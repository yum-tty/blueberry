// decoder.ts | event decoder (ultraviolet port)
//
// Decodes terminal input events from raw byte strings. Handles VT100/VT200/XTerm
// escape sequences, SS3 sequences, bracketed paste mode, and basic modifier detection.

import type { Key } from "./keys"
import {
  KeyBackspace, KeyTab, KeyEnter, KeyEscape, KeySpace, KeyExtended,
  KeyUp, KeyDown, KeyLeft, KeyRight, KeyBegin, KeyFind, KeyInsert, KeyDelete,
  KeySelect, KeyPgUp, KeyPgDown, KeyHome, KeyEnd,
  KeyF1, KeyF2, KeyF3, KeyF4, KeyF5, KeyF6, KeyF7, KeyF8,
  KeyF9, KeyF10, KeyF11, KeyF12, KeyF13, KeyF14, KeyF15, KeyF16,
  KeyF17, KeyF18, KeyF19, KeyF20,
  KeyKpEnter, KeyKpEqual, KeyKpMultiply, KeyKpPlus, KeyKpComma,
  KeyKpMinus, KeyKpDecimal, KeyKpDivide,
  KeyKp0, KeyKp1, KeyKp2, KeyKp3, KeyKp4,
  KeyKp5, KeyKp6, KeyKp7, KeyKp8, KeyKp9,
  ModShift, ModAlt, ModCtrl, ModMeta, ModSuper, ModHyper,
  ModCapsLock, ModNumLock, ModScrollLock,
} from "./keys"
import type { TerminalEvent } from "./events"
import { keyTable } from "./key_table"

// Legacy key encoding flags (matching Go decoder.go)
const flagCtrlAt = 1
const flagCtrlI = 2
const flagCtrlM = 4
const flagCtrlOpenBracket = 8
const flagBackspace = 16

export interface LegacyKeyFlags {
  flags: number
}

export function newLegacyKeyFlags(): LegacyKeyFlags {
  return { flags: 0 }
}

export function legacyCtrlAt(l: LegacyKeyFlags, v: boolean): LegacyKeyFlags {
  return { flags: v ? l.flags | flagCtrlAt : l.flags & ~flagCtrlAt }
}

export function legacyCtrlI(l: LegacyKeyFlags, v: boolean): LegacyKeyFlags {
  return { flags: v ? l.flags | flagCtrlI : l.flags & ~flagCtrlI }
}

export function legacyCtrlM(l: LegacyKeyFlags, v: boolean): LegacyKeyFlags {
  return { flags: v ? l.flags | flagCtrlM : l.flags & ~flagCtrlM }
}

export function legacyCtrlOpenBracket(l: LegacyKeyFlags, v: boolean): LegacyKeyFlags {
  return { flags: v ? l.flags | flagCtrlOpenBracket : l.flags & ~flagCtrlOpenBracket }
}

export function legacyBackspace(l: LegacyKeyFlags, v: boolean): LegacyKeyFlags {
  return { flags: v ? l.flags | flagBackspace : l.flags & ~flagBackspace }
}

export interface DecodeResult {
  n: number
  event: TerminalEvent | null
}

export class EventDecoder {
  legacy: LegacyKeyFlags = newLegacyKeyFlags()
  private pendingEsc: boolean = false
  private escTimestamp: number = 0
  private buffer: string = ""
  static readonly ESC_TIMEOUT_MS = 50

  /**
   * Feed raw input data into the decoder buffer.
   */
  feed(data: string): void {
    this.buffer += data
  }

  /**
   * Try to decode one event from the internal buffer.
   * Returns null if more data is needed or buffer is empty.
   */
  poll(): TerminalEvent | null {
    if (this.buffer.length === 0) return null
    const result = this.decode(this.buffer)
    if (result.n > 0) {
      this.buffer = this.buffer.slice(result.n)
    }
    return result.event
  }

  /**
   * Decode a single event from the input string.
   * Returns { n, event } where n is bytes consumed.
   * This is a synchronous decode matching the Go EventDecoder.Decode() semantics.
   */
  decode(buf: string): DecodeResult {
    if (buf.length === 0) {
      return { n: 0, event: null }
    }

    const b = buf.charCodeAt(0)

    if (b === 0x1B) {
      // ESC
      if (buf.length === 1) {
        // If we have a pending ESC from a previous decode, emit it as standalone
        if (this.pendingEsc) {
          this.pendingEsc = false
          return { n: 0, event: { type: "keyPress", key: { code: KeyEscape, text: "", mod: 0 } } }
        }
        // Start ESC timeout: buffer ESC, wait for more data
        this.pendingEsc = true
        this.escTimestamp = Date.now()
        return { n: 1, event: null }
      }

      this.pendingEsc = false
      const next = buf.charCodeAt(1)

      switch (next) {
        case 0x4F: // ESC O — SS3 sequence
          return this.parseSs3(buf)
        case 0x5B: // ESC [ — CSI sequence
          return this.parseCsi(buf)
        case 0x5D: // ESC ] — OSC
          return this.parseOsc(buf)
        case 0x50: // ESC P — DCS
          return this.parseDcs(buf)
        case 0x5F: // ESC _ — APC
          return this.parseApc(buf)
        case 0x5E: // ESC ^ — PM
        case 0x58: // ESC X — SOS
          return { n: 2, event: null }
        default: {
          // Alt+<key> or standalone ESC
          if (next >= 0x40 && next <= 0x7E) {
            // Alt+<printable> — return as Alt+key
            return { n: 2, event: { type: "keyPress", key: { code: next, text: "", mod: ModAlt } } }
          }
          if (next >= 0x61 && next <= 0x7A) {
            // Alt+<letter>
            return { n: 2, event: { type: "keyPress", key: { code: next, text: "", mod: ModAlt } } }
          }
          // Not a recognized sequence, emit standalone ESC
          return { n: 1, event: { type: "keyPress", key: { code: KeyEscape, text: "", mod: 0 } } }
        }
      }
    }

    // Check key table for single-byte or multi-byte sequences
    // Try longest match first (up to reasonable length)
    const maxLen = Math.min(buf.length, 64)
    let longestMatch = ""
    let longestKey: Key | null = null
    for (let len = 1; len <= maxLen; len++) {
      const seq = buf.slice(0, len)
      const key = keyTable.get(seq)
      if (key) {
        longestMatch = seq
        longestKey = key
      }
    }
    if (longestKey) {
      return { n: longestMatch.length, event: { type: "keyPress", key: longestKey } }
    }

    // Control characters (0x00-0x1F, 0x7F)
    if (b <= 0x1F) {
      return { n: 1, event: this.parseControl(b) }
    }
    if (b === 0x7F) {
      return { n: 1, event: { type: "keyPress", key: { code: KeyBackspace, text: "", mod: 0 } } }
    }

    // C1 control codes (0x80-0x9F) — not common in UTF-8 but handle gracefully
    if (b >= 0x80 && b <= 0x9F) {
      return { n: 1, event: { type: "keyPress", key: { code: b - 0x40, text: "", mod: ModCtrl | ModAlt } } }
    }

    // UTF-8 multi-byte or ASCII printable
    return this.parseUtf8(buf)
  }

  /**
   * Parse an ESC O (SS3) sequence.
   * Format: ESC O [modifier-numbers] GL-char
   * GL-char is in range 0x21-0x7E.
   */
  private parseSs3(buf: string): DecodeResult {
    if (buf.length < 3) {
      return { n: 1, event: null }
    }

    // Skip ESC O prefix
    let i = 2

    // Check for alt+O shortcut: ESC O at end of buffer
    if (buf.length === 2) {
      return { n: 2, event: { type: "keyPress", key: { code: "o".charCodeAt(0), text: "", mod: ModAlt } } }
    }

    // Parse modifier numbers (0-9)
    let mod = 0
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c >= 0x30 && c <= 0x39) {
        mod = mod * 10 + (c - 0x30)
        i++
      } else {
        break
      }
    }

    // Parse GL character (0x21-0x7E)
    if (i >= buf.length) {
      return { n: i, event: null }
    }
    const gl = buf.charCodeAt(i)
    if (gl < 0x21 || gl > 0x7E) {
      return { n: i, event: null }
    }
    i++

    let key: Key
    const ch = String.fromCharCode(gl)

    switch (ch) {
      case "a": key = { code: KeyUp, text: "", mod: ModCtrl }; break
      case "b": key = { code: KeyDown, text: "", mod: ModCtrl }; break
      case "c": key = { code: KeyRight, text: "", mod: ModCtrl }; break
      case "d": key = { code: KeyLeft, text: "", mod: ModCtrl }; break
      case "A": key = { code: KeyUp, text: "", mod: 0 }; break
      case "B": key = { code: KeyDown, text: "", mod: 0 }; break
      case "C": key = { code: KeyRight, text: "", mod: 0 }; break
      case "D": key = { code: KeyLeft, text: "", mod: 0 }; break
      case "E": key = { code: KeyBegin, text: "", mod: 0 }; break
      case "F": key = { code: KeyEnd, text: "", mod: 0 }; break
      case "H": key = { code: KeyHome, text: "", mod: 0 }; break
      case "P": key = { code: KeyF1, text: "", mod: 0 }; break
      case "Q": key = { code: KeyF2, text: "", mod: 0 }; break
      case "R": key = { code: KeyF3, text: "", mod: 0 }; break
      case "S": key = { code: KeyF4, text: "", mod: 0 }; break
      case "M": key = { code: KeyKpEnter, text: "", mod: 0 }; break
      case "X": key = { code: KeyKpEqual, text: "", mod: 0 }; break
      default: {
        // Keypad keys: j-y map to KpMultiply..Kp9
        const kpIdx = "jklmnopqrstuvwxyz".indexOf(ch)
        if (kpIdx >= 0) {
          key = { code: KeyKpMultiply + kpIdx, text: "", mod: 0 }
        } else {
          return { n: i, event: null }
        }
      }
    }

    // Apply modifier
    if (mod > 0) {
      key.mod |= this.fromXtermMod(mod - 1)
    }

    return { n: i, event: { type: "keyPress", key } }
  }

  /**
   * Parse a CSI sequence (ESC [ or bare CSI).
   * Handles arrow keys, function keys, tilde sequences, modified keys, etc.
   */
  private parseCsi(buf: string): DecodeResult {
    if (buf.length < 2) {
      return { n: 1, event: null }
    }

    let i = 1 // skip ESC (or CSI)

    // If starts with ESC, skip the [
    if (buf.charCodeAt(0) === 0x1B && i < buf.length && buf.charCodeAt(i) === 0x5B) {
      i++
    }

    // Scan parameter bytes (0x30-0x3F)
    let params = ""
    const paramStart = i
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c >= 0x30 && c <= 0x3F) {
        params += buf[i]
        i++
      } else {
        break
      }
    }

    // Scan intermediate bytes (0x20-0x2F)
    let intermediate = ""
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c >= 0x20 && c <= 0x2F) {
        intermediate += buf[i]
        i++
      } else {
        break
      }
    }

    // Check for final byte (0x40-0x7E)
    if (i >= buf.length) {
      return { n: i, event: null }
    }
    const finalByte = buf.charCodeAt(i)
    if (finalByte < 0x40 || finalByte > 0x7E) {
      return { n: i, event: null }
    }
    i++

    const finalChar = String.fromCharCode(finalByte)
    const paramParts = params.length > 0 ? params.split(/;|:/) : []
    const parsedParams = paramParts.map(p => p.length > 0 ? parseInt(p, 10) : -1)
    const numParams = parsedParams.length

    // Handle URxvt shift-modified keys: CSI <number> $
    if (intermediate === "$" && finalByte === 0x24) {
      // This is a special URxvt case, try as tilde with $
      if (numParams >= 1 && parsedParams[0]! >= 0) {
        const key = this.csiTildeKey(parsedParams[0]!)
        if (key) {
          key.mod |= ModShift
          return { n: i, event: { type: "keyPress", key } }
        }
      }
      return { n: i, event: null }
    }

    // Bracketed paste start/end
    if (finalChar === "~") {
      if (parsedParams[0] === 200) {
        return { n: i, event: { type: "pasteStart" } }
      }
      if (parsedParams[0] === 201) {
        return { n: i, event: { type: "pasteEnd" } }
      }
    }

    // CSI u (Kitty keyboard protocol)
    if (finalChar === "u") {
      return this.parseKittyCsiU(parsedParams, i)
    }

    // CSI R — cursor position report OR modified F3
    if (finalChar === "R") {
      if (numParams === 2 && parsedParams[0]! >= 1 && parsedParams[1]! >= 1) {
        return {
          n: i,
          event: {
            type: "cursorPosition",
            x: parsedParams[1]! - 1,
            y: parsedParams[0]! - 1,
          },
        }
      }
    }

    // X10 mouse: CSI M (3 bytes follow) — but NOT SGR mouse (CSI < ... M)
    if (finalChar === "M" && !params.startsWith("<")) {
      if (i + 3 <= buf.length) {
        const b = buf.charCodeAt(i) - 32
        const cx = buf.charCodeAt(i + 1) - 32
        const cy = buf.charCodeAt(i + 2) - 32
        i += 3

        const mod = (b >> 2) & 0x1F
        const btnBits = b & 0x03
        const isRelease = btnBits === 3
        const isMotion = (b & 0x20) !== 0
        const isWheel = (b & 0x40) !== 0

        if (isWheel) {
          return { n: i, event: { type: "mouseWheel", mouse: { x: cx - 1, y: cy - 1, button: btnBits + 4, mod } } }
        }
        if (isMotion) {
          return { n: i, event: { type: "mouseMotion", mouse: { x: cx - 1, y: cy - 1, button: btnBits + 1, mod } } }
        }
        if (isRelease) {
          return { n: i, event: { type: "mouseRelease", mouse: { x: cx - 1, y: cy - 1, button: 0, mod } } }
        }
        return { n: i, event: { type: "mouseClick", mouse: { x: cx - 1, y: cy - 1, button: btnBits + 1, mod } } }
      }
    }

    // SGR mouse: CSI < btn ; col ; row M/m
    if ((finalChar === "m" || finalChar === "M") && numParams === 3 && params.startsWith("<")) {
      // Strip the '<' prefix and re-parse the button code
      const btnCode = parseInt(params.slice(1), 10) || 0
      return this.parseSGRMouse([btnCode, parsedParams[1] ?? 0, parsedParams[2] ?? 0], finalChar === "m", i)
    }

    // Focus/Blur
    if (finalChar === "I") return { n: i, event: { type: "focus" } }
    if (finalChar === "O" && numParams === 0) return { n: i, event: { type: "blur" } }

    // Arrow/function/Home/End keys (single letter finals without params or with "1;mod" params)
    const csiLetterKey = this.csiLetterKey(finalChar, parsedParams, numParams)
    if (csiLetterKey) {
      return { n: i, event: { type: "keyPress", key: csiLetterKey } }
    }

    // Tilde sequences: CSI <number> ~
    if (finalChar === "~") {
      const param = parsedParams[0] ?? -1
      if (param >= 0) {
        // XTerm modifyOtherKeys: CSI 27 ; modifier ; code ~
        if (param === 27 && numParams === 3) {
          return this.parseXTermModifyOtherKeys(parsedParams, i)
        }

        const key = this.csiTildeKey(param)
        if (key) {
          // Modifier from CSI param ; modifier ~
          if (numParams > 1 && parsedParams[1]! >= 1) {
            key.mod |= this.fromXtermMod(parsedParams[1]! - 1)
          }
          return { n: i, event: { type: "keyPress", key } }
        }
      }
    }

    // Shift-modified keys via intermediate bytes
    if (intermediate === "^") {
      const param = parsedParams[0] ?? -1
      if (param >= 0) {
        const key = this.csiTildeKey(param)
        if (key) {
          key.mod |= ModCtrl
          return { n: i, event: { type: "keyPress", key } }
        }
      }
    }
    if (intermediate === "@") {
      const param = parsedParams[0] ?? -1
      if (param >= 0) {
        const key = this.csiTildeKey(param)
        if (key) {
          key.mod |= ModShift | ModCtrl
          return { n: i, event: { type: "keyPress", key } }
        }
      }
    }

    // Unknown CSI
    return { n: i, event: null }
  }

  /**
   * Map CSI tilde parameter number to a key.
   */
  private csiTildeKey(param: number): Key | null {
    switch (param) {
      case 1: return { code: KeyHome, text: "", mod: 0 }
      case 2: return { code: KeyInsert, text: "", mod: 0 }
      case 3: return { code: KeyDelete, text: "", mod: 0 }
      case 4: return { code: KeyEnd, text: "", mod: 0 }
      case 5: return { code: KeyPgUp, text: "", mod: 0 }
      case 6: return { code: KeyPgDown, text: "", mod: 0 }
      case 7: return { code: KeyHome, text: "", mod: 0 }
      case 8: return { code: KeyEnd, text: "", mod: 0 }
      case 11: return { code: KeyF1, text: "", mod: 0 }
      case 12: return { code: KeyF2, text: "", mod: 0 }
      case 13: return { code: KeyF3, text: "", mod: 0 }
      case 14: return { code: KeyF4, text: "", mod: 0 }
      case 15: return { code: KeyF5, text: "", mod: 0 }
      case 17: return { code: KeyF6, text: "", mod: 0 }
      case 18: return { code: KeyF7, text: "", mod: 0 }
      case 19: return { code: KeyF8, text: "", mod: 0 }
      case 20: return { code: KeyF9, text: "", mod: 0 }
      case 21: return { code: KeyF10, text: "", mod: 0 }
      case 23: return { code: KeyF11, text: "", mod: 0 }
      case 24: return { code: KeyF12, text: "", mod: 0 }
      case 25: return { code: KeyF13, text: "", mod: 0 }
      case 26: return { code: KeyF14, text: "", mod: 0 }
      case 28: return { code: KeyF15, text: "", mod: 0 }
      case 29: return { code: KeyF16, text: "", mod: 0 }
      case 31: return { code: KeyF17, text: "", mod: 0 }
      case 32: return { code: KeyF18, text: "", mod: 0 }
      case 33: return { code: KeyF19, text: "", mod: 0 }
      case 34: return { code: KeyF20, text: "", mod: 0 }
      default: return null
    }
  }

  /**
   * Map CSI letter final to a key with modifier handling.
   * CSI 1 ; <mod> <letter> format.
   */
  private csiLetterKey(letter: string, params: number[], numParams: number): Key | null {
    let key: Key | null = null

    switch (letter) {
      case "A": key = { code: KeyUp, text: "", mod: 0 }; break
      case "B": key = { code: KeyDown, text: "", mod: 0 }; break
      case "C": key = { code: KeyRight, text: "", mod: 0 }; break
      case "D": key = { code: KeyLeft, text: "", mod: 0 }; break
      case "E": key = { code: KeyBegin, text: "", mod: 0 }; break
      case "F": key = { code: KeyEnd, text: "", mod: 0 }; break
      case "H": key = { code: KeyHome, text: "", mod: 0 }; break
      case "P": key = { code: KeyF1, text: "", mod: 0 }; break
      case "Q": key = { code: KeyF2, text: "", mod: 0 }; break
      case "R": key = { code: KeyF3, text: "", mod: 0 }; break
      case "S": key = { code: KeyF4, text: "", mod: 0 }; break
      case "Z": key = { code: KeyTab, text: "", mod: ModShift }; break
      case "a": key = { code: KeyUp, text: "", mod: ModShift }; break
      case "b": key = { code: KeyDown, text: "", mod: ModShift }; break
      case "c": key = { code: KeyRight, text: "", mod: ModShift }; break
      case "d": key = { code: KeyLeft, text: "", mod: ModShift }; break
      default: return null
    }

    // Apply modifier: CSI 1 ; <mod> <letter>
    if (numParams >= 2 && params[0] === 1 && params[1]! >= 1) {
      key!.mod |= this.fromXtermMod(params[1]! - 1)
    }

    return key
  }

  /**
   * Parse CSI 27 ; modifier ; code ~ (XTerm modifyOtherKeys).
   */
  private parseXTermModifyOtherKeys(params: number[], endIdx: number): DecodeResult {
    const mod = this.fromXtermMod((params[1] ?? 1) - 1)
    const code = params[2] ?? 0

    let keyCode: number
    switch (code) {
      case 0x08: keyCode = KeyBackspace; break
      case 0x09: keyCode = KeyTab; break
      case 0x0D: keyCode = KeyEnter; break
      case 0x1B: keyCode = KeyEscape; break
      case 0x7F: keyCode = KeyBackspace; break
      default: keyCode = code
    }

    const key: Key = { code: keyCode, text: "", mod }
    if (mod <= ModShift && code >= 0x20 && code < 0x7F) {
      key.text = String.fromCharCode(code)
    }

    return { n: endIdx, event: { type: "keyPress", key } }
  }

  /**
   * Parse CSI u (Kitty keyboard protocol / fixterms).
   * CSI codepoint ; modifiers u
   */
  private parseKittyCsiU(params: number[], endIdx: number): DecodeResult {
    if (params.length === 0) {
      return { n: endIdx, event: null }
    }

    const codepoint = params[0] ?? 0
    const mod = params.length > 1 ? (params[1] ?? 1) - 1 : 0

    let keyCode = codepoint
    let text = ""

    // Map codepoint to internal key
    if (codepoint >= 57344 && codepoint <= 63743) {
      keyCode = this.kittyCodepointToKey(codepoint)
    } else if (codepoint >= 0x20 && codepoint < 0x7F) {
      text = String.fromCharCode(codepoint)
    }

    const key: Key = { code: keyCode, text, mod: this.fromKittyMod(mod) }
    return { n: endIdx, event: { type: "keyPress", key } }
  }

  /**
   * Map Kitty protocol codepoint to internal key constant.
   */
  private kittyCodepointToKey(cp: number): number {
    const map: Record<number, number> = {
      57344: KeyEscape, 57345: KeyEnter, 57346: KeyTab, 57347: KeyBackspace,
      57348: KeyInsert, 57349: KeyDelete, 57350: KeyLeft, 57351: KeyRight,
      57352: KeyUp, 57353: KeyDown, 57354: KeyPgUp, 57355: KeyPgDown,
      57356: KeyHome, 57357: KeyEnd,
      57364: KeyF1, 57365: KeyF2, 57366: KeyF3, 57367: KeyF4,
      57368: KeyF5, 57369: KeyF6, 57370: KeyF7, 57371: KeyF8,
      57372: KeyF9, 57373: KeyF10, 57374: KeyF11, 57375: KeyF12,
      57376: KeyF13, 57377: KeyF14, 57378: KeyF15, 57379: KeyF16,
      57380: KeyF17, 57381: KeyF18, 57382: KeyF19, 57383: KeyF20,
      57399: KeyKp0, 57400: KeyKp1, 57401: KeyKp2, 57402: KeyKp3,
      57403: KeyKp4, 57404: KeyKp5, 57405: KeyKp6, 57406: KeyKp7,
      57407: KeyKp8, 57408: KeyKp9, 57409: KeyKpDecimal,
      57410: KeyKpDivide, 57411: KeyKpMultiply, 57412: KeyKpMinus,
      57413: KeyKpPlus, 57414: KeyKpEnter, 57415: KeyKpEqual,
    }
    return map[cp] ?? KeyExtended + (cp - 57344)
  }

  /**
   * Convert Kitty protocol modifier bits to our modifier constants.
   */
  private fromKittyMod(mod: number): number {
    let m = 0
    if (mod & 1) m |= ModShift      // kittyShift
    if (mod & 2) m |= ModAlt        // kittyAlt
    if (mod & 4) m |= ModCtrl       // kittyCtrl
    if (mod & 8) m |= ModSuper      // kittySuper
    if (mod & 16) m |= ModHyper     // kittyHyper
    if (mod & 32) m |= ModMeta      // kittyMeta
    if (mod & 64) m |= ModCapsLock  // kittyCapsLock
    if (mod & 128) m |= ModNumLock  // kittyNumLock
    return m
  }

  /**
   * Convert XTerm modifier number to our modifier constants.
   * XTerm modifiers are 1-based: 1=shift, 2=alt, 3=shift+alt, 4=ctrl, etc.
   */
  private fromXtermMod(mod: number): number {
    let m = 0
    if (mod & 1) m |= ModShift
    if (mod & 2) m |= ModAlt
    if (mod & 4) m |= ModCtrl
    if (mod & 8) m |= ModMeta
    return m
  }

  /**
   * Parse SGR mouse event.
   * CSI < btn ; col ; row M/m
   */
  private parseSGRMouse(params: number[], release: boolean, endIdx: number): DecodeResult {
    const btnCode = params[0] ?? 0
    const x = (params[1] ?? 1) - 1
    const y = (params[2] ?? 1) - 1
    const mod = (btnCode >> 2) & 0x1F
    const btn = btnCode & 0x03

    if (btnCode & 0x40) {
      // Wheel
      const event = release ? "mouseRelease" : "mouseWheel"
      return { n: endIdx, event: { type: event, mouse: { x, y, button: btn + 4, mod } } }
    }
    if (release) {
      return { n: endIdx, event: { type: "mouseRelease", mouse: { x, y, button: btn + 1, mod } } }
    }
    return { n: endIdx, event: { type: "mouseClick", mouse: { x, y, button: btn + 1, mod } } }
  }

  /**
   * Parse OSC sequence (ESC ] ...).
   * Handles OSC 8 (hyperlinks), OSC 10/11/12 (color), OSC 52 (clipboard).
   */
  private parseOsc(buf: string): DecodeResult {
    if (buf.length < 2) {
      return { n: 1, event: null }
    }

    let i = 1 // skip ESC
    if (i < buf.length && buf.charCodeAt(i) === 0x5D) i++

    // Parse command number
    let cmd = -1
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c >= 0x30 && c <= 0x39) {
        if (cmd === -1) cmd = 0
        cmd = cmd * 10 + (c - 0x30)
        i++
      } else {
        break
      }
    }

    // Skip semicolon
    let dataStart = -1
    if (i < buf.length && buf.charCodeAt(i) === 0x3B) {
      i++
      dataStart = i
    }

    // Scan to terminator (BEL, ESC, ST, CAN, SUB)
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c === 0x07 || c === 0x1B || c === 0x9C || c === 0x18 || c === 0x1A) break
      i++
    }

    if (i >= buf.length) {
      return { n: i, event: null }
    }

    const dataEnd = i
    const terminator = buf.charCodeAt(i)
    i++

    // Check for ESC \ (ST terminator)
    if (terminator === 0x1B) {
      if (i < buf.length && buf.charCodeAt(i) === 0x5C) {
        i++
      }
    }

    // CAN/SUB cancel the sequence
    if (terminator === 0x18 || terminator === 0x1A) {
      return { n: i, event: null }
    }

    if (dataStart < 0 || dataEnd <= dataStart) {
      return { n: i, event: null }
    }

    const data = buf.slice(dataStart, dataEnd)

    switch (cmd) {
      case 8: {
        // OSC 8: Hyperlink — params;url
        const semiIdx = data.indexOf(";")
        if (semiIdx >= 0) {
          const params = data.slice(0, semiIdx)
          const url = data.slice(semiIdx + 1)
          if (url.length > 0) {
            return { n: i, event: { type: "hyperlink", params, url } }
          }
        }
        return { n: i, event: { type: "hyperlink", params: "", url: "" } }
      }
      case 10:
        return { n: i, event: { type: "foregroundColor", color: data } }
      case 11:
        return { n: i, event: { type: "backgroundColor", color: data } }
      case 12:
        return { n: i, event: { type: "cursorColor", color: data } }
    }

    return { n: i, event: null }
  }

  /**
   * Parse DCS sequence (ESC P ...).
   */
  private parseDcs(buf: string): DecodeResult {
    if (buf.length < 2) {
      return { n: 1, event: null }
    }

    let i = 1 // skip ESC
    if (i < buf.length && buf.charCodeAt(i) === 0x50) i++

    // Skip parameter bytes, intermediate bytes, final byte
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c >= 0x40 && c <= 0x7E) { i++; break }
      i++
    }

    // Scan to ST/ESC
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c === 0x9C || c === 0x1B) break
      i++
    }

    if (i >= buf.length) return { n: i, event: null }
    i++ // skip ST or ESC

    // Check for ESC \
    if (i < buf.length && buf.charCodeAt(i - 1) === 0x1B && buf.charCodeAt(i) === 0x5C) {
      i++
    }

    return { n: i, event: null }
  }

  /**
   * Parse APC sequence (ESC _ ...).
   */
  private parseApc(buf: string): DecodeResult {
    if (buf.length < 2) {
      return { n: 1, event: null }
    }

    let i = 1
    if (i < buf.length && buf.charCodeAt(i) === 0x5F) i++

    // Scan to ST/ESC
    while (i < buf.length) {
      const c = buf.charCodeAt(i)
      if (c === 0x9C || c === 0x1B) break
      i++
    }

    if (i >= buf.length) return { n: i, event: null }
    i++
    if (i < buf.length && buf.charCodeAt(i - 1) === 0x1B && buf.charCodeAt(i) === 0x5C) {
      i++
    }

    return { n: i, event: null }
  }

  /**
   * Parse a UTF-8 character from the buffer.
   */
  private parseUtf8(buf: string): DecodeResult {
    const c = buf.charCodeAt(0)

    if (c <= 0x1F || c === 0x7F) {
      return { n: 1, event: this.parseControl(c) }
    }

    if (c > 0x1F && c < 0x7F) {
      // ASCII printable
      const code = c
      const key: Key = { code, text: String.fromCharCode(code), mod: 0 }
      if (c >= 0x41 && c <= 0x5A) {
        // Uppercase: shift + lowercase
        key.code = c + 0x20
        key.text = String.fromCharCode(c)
        key.mod |= ModShift
      }
      return { n: 1, event: { type: "keyPress", key } }
    }

    // Multi-byte UTF-8: determine length from leading byte
    let byteLen = 1
    if ((c & 0xE0) === 0xC0) byteLen = 2
    else if ((c & 0xF0) === 0xE0) byteLen = 3
    else if ((c & 0xF8) === 0xF0) byteLen = 4

    if (byteLen > buf.length) {
      return { n: buf.length, event: null }
    }

    const charStr = buf.slice(0, byteLen)
    const codePoint = charStr.codePointAt(0) ?? 0
    return { n: byteLen, event: { type: "keyPress", key: { code: KeyExtended, text: charStr, mod: 0 } } }
  }

  /**
   * Parse a control character (0x00-0x1F).
   */
  private parseControl(b: number): TerminalEvent {
    let code: number
    let mod = 0
    let text = ""

    switch (b) {
      case 0x00: // NUL
        if (this.legacy.flags & flagCtrlAt) {
          code = 0x40; mod = ModCtrl; break
        }
        code = KeySpace; mod = ModCtrl; break
      case 0x08: // BS
        code = 0x68; mod = ModCtrl; break
      case 0x09: // HT
        if (this.legacy.flags & flagCtrlI) {
          code = 0x69; mod = ModCtrl; break
        }
        code = KeyTab; break
      case 0x0D: // CR
        if (this.legacy.flags & flagCtrlM) {
          code = 0x6D; mod = ModCtrl; break
        }
        code = KeyEnter; break
      case 0x1B: // ESC
        if (this.legacy.flags & flagCtrlOpenBracket) {
          code = 0x5B; mod = ModCtrl; break
        }
        code = KeyEscape; break
      default:
        if (b >= 0x01 && b <= 0x1A) {
          code = b + 0x60
          mod = ModCtrl
        } else if (b >= 0x1C && b <= 0x1F) {
          code = b + 0x40
          mod = ModCtrl
        } else {
          code = b
        }
    }

    return { type: "keyPress", key: { code, text, mod } }
  }

  /**
   * Flush a pending ESC as a standalone Escape key.
   * Call this after ESC_TIMEOUT_MS with no new data.
   */
  flushEsc(): TerminalEvent | null {
    if (this.pendingEsc) {
      this.pendingEsc = false
      return { type: "keyPress", key: { code: KeyEscape, text: "", mod: 0 } }
    }
    return null
  }
}
