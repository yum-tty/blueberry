// styled.ts | styled string (ultraviolet port)

import type { Cell, Link } from "./cell"
import { EmptyCell, cellClone } from "./cell"
import { type Line, NewLine, LineSet } from "./buffer"

/**
 * Underline style enum matching Go ultraviolet's ansi.Underline.
 */
export type Underline = "none" | "single" | "double" | "curly" | "dotted" | "dashed"

/**
 * Style represents a styled text span.
 * Matches Go ultraviolet's Style struct with Fg, Bg, UnderlineColor, Underline, Attrs.
 */
export interface Style {
  foreground?: string
  background?: string
  underlineColor?: string
  bold?: boolean
  italic?: boolean
  underline?: Underline
  strikethrough?: boolean
  dim?: boolean
  reverse?: boolean
  blink?: boolean
  rapidBlink?: boolean
  conceal?: boolean
  fgCode?: number
  bgCode?: number
}

/**
 * StyledSpan represents a span of text with a style.
 */
export interface StyledSpan {
  text: string
  style: Style
}

/**
 * StyledString represents a string that can be decomposed into styled lines and cells.
 * Go: type StyledString struct { Text string; Wrap bool; Tail string }
 */
export class StyledString {
  Text: string
  Wrap: boolean
  Tail: string
  content: string
  spans: StyledSpan[]

  constructor(content: string, spans: StyledSpan[] = []) {
    this.Text = content
    this.content = content
    this.spans = spans
    this.Wrap = false
    this.Tail = ""
  }

  String(): string { return this.Text }

  /**
   * Width returns the width of the widest line.
   */
  width(): number {
    let maxWidth = 0
    const lines = this.Text.split("\n")
    for (const line of lines) {
      const w = getStringWidth(stripAnsi(line))
      if (w > maxWidth) maxWidth = w
    }
    return maxWidth
  }

  /**
   * Height returns the number of lines.
   * Go: StyledString.Height() int
   */
  Height(): number {
    return this.Text.split("\n").length
  }

  /**
   * UnicodeWidth returns the cells width of the widest line using grapheme width.
   * Go: StyledString.UnicodeWidth() int
   */
  UnicodeWidth(): number {
    let maxWidth = 0
    const lines = this.Text.split("\n")
    for (const line of lines) {
      const w = getStringWidth(stripAnsi(line))
      if (w > maxWidth) maxWidth = w
    }
    return maxWidth
  }

  /**
   * WcWidth returns the cells width of the widest line using wcwidth.
   * Go: StyledString.WcWidth() int
   */
  WcWidth(): number {
    let maxWidth = 0
    const lines = this.Text.split("\n")
    for (const line of lines) {
      const w = getStringWidth(stripAnsi(line))
      if (w > maxWidth) maxWidth = w
    }
    return maxWidth
  }

  /**
   * Bounds returns the minimum area that can contain the whole styled string.
   * Go: StyledString.Bounds() Rectangle
   */
  Bounds(): { MinX: number; MinY: number; MaxX: number; MaxY: number } {
    const w = this.WcWidth()
    const h = this.Height()
    return { MinX: 0, MinY: 0, MaxX: w, MaxY: h }
  }

  /**
   * Lines returns the styled string decomposed into a slice of Lines.
   * Go: StyledString.Lines(m ansi.Method) []Line
   */
  Lines(): Line[] {
    return printString(null, 0, 0, { MinX: 0, MinY: 0, MaxX: 0, MaxY: 0 }, this.Text, false, "")
  }

  /**
   * Render returns the raw text.
   */
  render(): string { return this.Text }

  /**
   * Draw renders the styled string to a screen at the specified area.
   * Go: StyledString.Draw(buf Screen, area Rectangle)
   */
  draw(
    buf: { setCell(x: number, y: number, cell: Cell): void; Width(): number },
    area: { MinX: number; MinY: number; MaxX: number; MaxY: number },
  ): void {
    for (let y = area.MinY; y < area.MaxY; y++) {
      for (let x = area.MinX; x < area.MaxX; x++) {
        buf.setCell(x, y, cellClone(EmptyCell))
      }
    }
    let str = this.Text
    str = str.replace(/\r\n/g, "\n")
    printString(buf, area.MinX, area.MinY, area, str, !this.Wrap, this.Tail)
  }
}

/**
 * printString draws a string starting at the given position.
 * If screen is nil, it builds and returns a slice of Lines instead.
 * Go: printString[T](s Screen, m WidthMethod, x, y int, bounds Rectangle, str T, truncate bool, tail string) []Line
 */
function printString(
  s: { setCell(x: number, y: number, cell: Cell): void; Width(): number } | null,
  x: number,
  y: number,
  bounds: { MinX: number; MinY: number; MaxX: number; MaxY: number },
  str: string,
  truncate: boolean,
  tail: string,
): Line[] {
  let tailc: Cell | null = null
  if (truncate && tail.length > 0) {
    tailc = { Content: tail, Style: null, Link: { URL: "", Params: "" }, Width: getStringWidth(tail) }
  }

  let lines: Line[] = []
  if (s === null) {
    lines = []
  }

  let cell: Cell | null = null
  let style: Style | null = null
  let link: Link = { URL: "", Params: "" }
  let i = 0

  while (i < str.length) {
    const ch = str[i]!

    if (ch === "\x1b") {
      const seqStart = i
      i++

      if (i < str.length && str[i] === "[") {
        // CSI sequence
        i++
        let params = ""
        while (i < str.length && str.charCodeAt(i) >= 0x30 && str.charCodeAt(i) <= 0x3F) {
          params += str[i]
          i++
        }
        if (i < str.length) {
          const final = str[i]!
          i++
          if (final === "m") {
            // SGR sequence - parse params
            const paramNums = params.split(";").map(s => parseInt(s, 10) || 0)
            readStyleParams(paramNums, 0, style, (s: Style) => { style = s })
          }
          // Other CSI sequences are ignored for now
        }
      } else if (i < str.length && str[i] === "]") {
        // OSC sequence
        i++
        let cmd = ""
        while (i < str.length && str.charCodeAt(i) >= 0x30 && str.charCodeAt(i) <= 0x39) {
          cmd += str[i]
          i++
        }
        if (i < str.length && str[i] === ";") i++
        let data = ""
        while (i < str.length) {
          const c = str[i]!
          if (c === "\x07") { i++; break }
          if (c === "\x1b") {
            i++
            if (i < str.length && str[i] === "\\") i++
            break
          }
          data += c
          i++
        }
        if (cmd === "8") {
          readLinkData(data, (l: Link) => { link = l })
        }
      }
      continue
    }

    if (ch === "\n") {
      if (s === null) {
        if (y >= lines.length) lines.push([])
      }
      y++
      x = s !== null ? bounds.MinX : 0
      i++
      continue
    }

    if (ch === "\r") {
      x = s !== null ? bounds.MinX : 0
      i++
      continue
    }

    // Regular character
    const cellWidth = 1
    const cellStyle: Style | null = style != null ? cloneStyle(style) : null
    const cellLink: Link = link != null ? { URL: link.URL, Params: link.Params } : { URL: "", Params: "" }
    const newCell: Cell = {
      Content: ch,
      Style: cellStyle,
      Link: cellLink,
      Width: cellWidth,
    }

    if (s === null) {
      if (y >= lines.length) lines.push([])
      lines[y]!.push(newCell)
      x += cellWidth
    } else {
      if (!truncate && x + newCell.Width > bounds.MaxX && y + 1 < bounds.MaxY) {
        x = bounds.MinX
        y++
      }

      if (x >= bounds.MinX && x < bounds.MaxX && y >= bounds.MinY && y < bounds.MaxY) {
        if (truncate && tailc && tailc.Width > 0 && x + newCell.Width > bounds.MaxX - tailc.Width) {
          const tc: Cell = {
            Content: tailc.Content,
            Style: cellStyle,
            Link: cellLink,
            Width: tailc.Width,
          }
          s.setCell(x, y, tc)
          x += tailc.Width
        } else {
          s.setCell(x, y, newCell)
          x += cellWidth
        }
      }
    }

    i++
  }

  return lines
}

/**
 * ReadLinkData parses OSC 8 hyperlink data into a Link.
 * Go: ReadLink(p []byte, link *Link)
 * OSC 8 data format: "params;URL" (split by first semicolon)
 */
function readLinkData(data: string, setLink: (l: Link) => void): void {
  const parts = data.split(";", 3)
  if (parts.length < 3) {
    // Go's ReadLink expects exactly 3 parts (action;params;URL)
    // If fewer, it's malformed
    return
  }
  setLink({ Params: parts[1]!, URL: parts[2]! })
}

/**
 * Clone a Style object.
 */
function cloneStyle(s: Style): Style {
  return { ...s }
}

/**
 * ReadStyleParams reads SGR parameters into a pen Style.
 * Go: ReadStyle(params ansi.Params, pen *Style)
 */
function readStyleParams(
  params: number[],
  _startIdx: number,
  current: Style | null,
  setPen: (s: Style) => void,
): void {
  if (params.length === 0) {
    setPen({})
    return
  }

  let pen: Style = current ? { ...current } : {}
  let i = 0

  while (i < params.length) {
    const param = params[i]!
    switch (param) {
      case 0: pen = {}; break
      case 1: pen.bold = true; break
      case 2: pen.dim = true; break
      case 3: pen.italic = true; break
      case 4: {
        const next = params[i + 1]
        if (next !== undefined && next >= 0 && next <= 5) {
          i++
          switch (next) {
            case 0: pen.underline = "none"; break
            case 1: pen.underline = "single"; break
            case 2: pen.underline = "double"; break
            case 3: pen.underline = "curly"; break
            case 4: pen.underline = "dotted"; break
            case 5: pen.underline = "dashed"; break
          }
        } else {
          pen.underline = "single"
        }
        break
      }
      case 5: pen.blink = true; break
      case 6: pen.rapidBlink = true; break
      case 7: pen.reverse = true; break
      case 8: pen.conceal = true; break
      case 9: pen.strikethrough = true; break
      case 22: pen.bold = false; pen.dim = false; break
      case 23: pen.italic = false; break
      case 24: pen.underline = "none"; break
      case 25: pen.blink = false; break
      case 27: pen.reverse = false; break
      case 28: pen.conceal = false; break
      case 29: pen.strikethrough = false; break
      case 30: case 31: case 32: case 33:
      case 34: case 35: case 36: case 37:
        pen.fgCode = param
        pen.foreground = basicFgColor(param - 30)
        break
      case 38: {
        if (params[i + 1] === 5 && i + 2 < params.length) {
          pen.fgCode = 38
          pen.foreground = ansi256ToHex(params[i + 2]!)
          i += 2
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2]!
          const g = params[i + 3]!
          const b = params[i + 4]!
          pen.foreground = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          i += 4
        }
        break
      }
      case 39: pen.foreground = undefined; pen.fgCode = undefined; break
      case 40: case 41: case 42: case 43:
      case 44: case 45: case 46: case 47:
        pen.bgCode = param
        pen.background = basicBgColor(param - 40)
        break
      case 48: {
        if (params[i + 1] === 5 && i + 2 < params.length) {
          pen.bgCode = 48
          pen.background = ansi256ToHex(params[i + 2]!)
          i += 2
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2]!
          const g = params[i + 3]!
          const b = params[i + 4]!
          pen.background = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          i += 4
        }
        break
      }
      case 49: pen.background = undefined; pen.bgCode = undefined; break
      case 58: {
        if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2]!
          const g = params[i + 3]!
          const b = params[i + 4]!
          pen.underlineColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          i += 4
        }
        break
      }
      case 59: pen.underlineColor = undefined; break
      case 90: case 91: case 92: case 93:
      case 94: case 95: case 96: case 97:
        pen.fgCode = param
        pen.foreground = brightFgColor(param - 90)
        break
      case 100: case 101: case 102: case 103:
      case 104: case 105: case 106: case 107:
        pen.bgCode = param
        pen.background = brightBgColor(param - 100)
        break
    }
    i++
  }

  setPen(pen)
}

const BRIGHT_COLORS = [
  "#000000", "#FF5555", "#55FF55", "#FFFF55",
  "#5555FF", "#FF55FF", "#55FFFF", "#FFFFFF",
]

const BRIGHT_BGCOLORS = [
  "#000000", "#AA0000", "#00AA00", "#AA5500",
  "#0000AA", "#AA00AA", "#00AAAA", "#AAAAAA",
]

const BRIGHT_FGCOLORS = [
  "#555555", "#FF5555", "#55FF55", "#FFFF55",
  "#5555FF", "#FF55FF", "#55FFFF", "#FFFFFF",
]

const BRIGHT_BG_BRIGHTCOLORS = [
  "#AA0000", "#FF5555", "#55FF55", "#FFFF55",
  "#5555FF", "#FF55FF", "#55FFFF", "#FFFFFF",
]

function basicFgColor(idx: number): string { return BRIGHT_BGCOLORS[idx] ?? "#000000" }
function basicBgColor(idx: number): string { return BRIGHT_BGCOLORS[idx] ?? "#000000" }
function brightFgColor(idx: number): string { return BRIGHT_FGCOLORS[idx] ?? "#555555" }
function brightBgColor(idx: number): string { return BRIGHT_BG_BRIGHTCOLORS[idx] ?? "#AA0000" }

function ansi256ToHex(idx: number): string {
  if (idx < 16) {
    const table = [
      "000000", "800000", "008000", "808000",
      "000080", "800080", "008080", "c0c0c0",
      "808080", "ff0000", "00ff00", "ffff00",
      "0000ff", "ff00ff", "00ffff", "ffffff",
    ]
    return `#${table[idx]!}`
  }
  if (idx < 232) {
    const i = idx - 16
    const r = Math.floor(i / 36)
    const g = Math.floor((i % 36) / 6)
    const b = i % 6
    const toHex = (v: number) => (v === 0 ? 0 : 55 + v * 40).toString(16).padStart(2, "0")
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  const gray = 8 + (idx - 232) * 10
  return `#${gray.toString(16).padStart(2, "0")}${gray.toString(16).padStart(2, "0")}${gray.toString(16).padStart(2, "0")}`
}

/**
 * ReadStyle is exported for compat.ts usage.
 * Go: ReadStyle(params ansi.Params, pen *Style)
 */
export function ReadStyle(params: number[], pen: Style): void {
  readStyleParams(params, 0, pen, () => {})
}

/**
 * ReadLink parses OSC 8 hyperlink escape data into a Link.
 * Go: ReadLink(p []byte, link *Link)
 * Expects 3-part semicolon-separated data: action;params;URL
 */
export function ReadLink(data: string, link: Link): void {
  const parts = data.split(";")
  if (parts.length < 3) return
  link.Params = parts[1]!
  link.URL = parts[2]!
}

/**
 * Convert a Style to an ANSI string.
 */
export function styleToString(style: Style | null): string {
  if (!style || isStyleEmpty(style)) return ""

  const parts: string[] = []

  if (style.bold) parts.push("1")
  if (style.dim) parts.push("2")
  if (style.italic) parts.push("3")
  if (style.blink) parts.push("5")
  if (style.rapidBlink) parts.push("6")
  if (style.reverse) parts.push("7")
  if (style.conceal) parts.push("8")
  if (style.strikethrough) parts.push("9")

  if (style.underline && style.underline !== "none") {
    switch (style.underline) {
      case "double": parts.push("4:2"); break
      case "curly": parts.push("4:3"); break
      case "dotted": parts.push("4:4"); break
      case "dashed": parts.push("4:5"); break
      default: parts.push("4")
    }
  }

  if (style.fgCode != null) {
    parts.push(String(style.fgCode))
  } else if (style.foreground) {
    parts.push(`38;2;${hexToRgb(style.foreground)}`)
  }

  if (style.bgCode != null) {
    parts.push(String(style.bgCode))
  } else if (style.background) {
    parts.push(`48;2;${hexToRgb(style.background)}`)
  }

  if (style.underlineColor) {
    parts.push(`58;2;${hexToRgb(style.underlineColor)}`)
  }

  if (parts.length === 0) return ""
  return `\x1b[${parts.join(";")}m`
}

const RESET = "\x1b[0m"

/**
 * Check if a style is empty (no attributes or colors set).
 */
export function isStyleEmpty(s: Style | null): boolean {
  if (!s) return true
  return (
    !s.bold && !s.italic && (!s.underline || s.underline === "none") && !s.strikethrough &&
    !s.dim && !s.reverse && !s.blink && !s.rapidBlink && !s.conceal &&
    !s.foreground && !s.background && !s.underlineColor &&
    s.fgCode == null && s.bgCode == null
  )
}

function colorEqual(a?: string, b?: string): boolean {
  return (a ?? "") === (b ?? "")
}

function codeEqual(a?: number, b?: number): boolean {
  return a === b
}

/**
 * Compute the minimal ANSI SGR sequence to transition from `from` to `to`.
 */
export function styleDiff(from: Style | null, to: Style | null): string {
  if (!from && !to) return ""
  if (from && to && stylesEqual(from, to)) return ""
  if (!from) return to ? styleToString(to) : ""
  if (!to || isStyleEmpty(to)) return RESET

  const parts: string[] = []

  const fromBold = !!from.bold
  const toBold = !!to.bold
  const fromDim = !!from.dim
  const toDim = !!to.dim

  let boldChanged = fromBold !== toBold
  let dimChanged = fromDim !== toDim
  if (boldChanged || dimChanged) {
    if ((fromBold && !toBold) || (fromDim && !toDim)) {
      parts.push("22")
      boldChanged = true
      dimChanged = true
    }
  }

  if (!!from.italic !== !!to.italic && !to.italic) parts.push("23")

  const fromUL = from.underline ?? "none"
  const toUL = to.underline ?? "none"
  if (fromUL !== toUL) {
    if (fromUL !== "none" && toUL === "none") {
      parts.push("24")
    }
  }

  if (!!from.reverse !== !!to.reverse && !to.reverse) parts.push("27")
  if (!!from.strikethrough !== !!to.strikethrough && !to.strikethrough) parts.push("29")
  if (!!from.blink !== !!to.blink && !to.blink) parts.push("25")
  if (!!from.conceal !== !!to.conceal && !to.conceal) parts.push("28")

  if (boldChanged && toBold) parts.push("1")
  if (dimChanged && toDim) parts.push("2")
  if (!!from.italic !== !!to.italic && to.italic) parts.push("3")
  if (fromUL !== toUL && toUL !== "none") {
    switch (toUL) {
      case "double": parts.push("4:2"); break
      case "curly": parts.push("4:3"); break
      case "dotted": parts.push("4:4"); break
      case "dashed": parts.push("4:5"); break
      default: parts.push("4")
    }
  }
  if (!!from.strikethrough !== !!to.strikethrough && to.strikethrough) parts.push("9")
  if (!!from.reverse !== !!to.reverse && to.reverse) parts.push("7")
  if (!!from.blink !== !!to.blink && to.blink) parts.push("5")
  if (!!from.conceal !== !!to.conceal && to.conceal) parts.push("8")

  if (!colorEqual(from.foreground, to.foreground) || !codeEqual(from.fgCode, to.fgCode)) {
    if (to.fgCode != null) parts.push(String(to.fgCode))
    else if (to.foreground) parts.push(`38;2;${hexToRgb(to.foreground)}`)
    else parts.push("39")
  }

  if (!colorEqual(from.background, to.background) || !codeEqual(from.bgCode, to.bgCode)) {
    if (to.bgCode != null) parts.push(String(to.bgCode))
    else if (to.background) parts.push(`48;2;${hexToRgb(to.background)}`)
    else parts.push("49")
  }

  if (!colorEqual(from.underlineColor, to.underlineColor)) {
    if (to.underlineColor) parts.push(`58;2;${hexToRgb(to.underlineColor)}`)
    else parts.push("59")
  }

  if (parts.length === 0) return ""
  return `\x1b[${parts.join(";")}m`
}

/**
 * Check if two styles are structurally equal.
 */
export function stylesEqual(a: Style | null, b: Style | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    (a.underline ?? "none") === (b.underline ?? "none") &&
    !!a.strikethrough === !!b.strikethrough &&
    !!a.dim === !!b.dim &&
    !!a.reverse === !!b.reverse &&
    !!a.blink === !!b.blink &&
    !!a.rapidBlink === !!b.rapidBlink &&
    !!a.conceal === !!b.conceal &&
    colorEqual(a.foreground, b.foreground) &&
    colorEqual(a.background, b.background) &&
    colorEqual(a.underlineColor, b.underlineColor) &&
    codeEqual(a.fgCode, b.fgCode) &&
    codeEqual(a.bgCode, b.bgCode)
  )
}

/**
 * Convert hex color to RGB string.
 */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r};${g};${b}`
}

/**
 * Strip ANSI escape codes from a string (both CSI-SGR and OSC).
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\]8;[^;]*;[^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
}

export function getStringWidth(str: string): number {
  let w = 0
  for (const ch of stripAnsi(str)) {
    const code = ch.codePointAt(0)!
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3000 && code <= 0x303F) ||
      (code >= 0x3040 && code <= 0x309F) ||
      (code >= 0x30A0 && code <= 0x30FF) ||
      (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0x2E80 && code <= 0x2EFF) ||
      (code >= 0x3100 && code <= 0x312F) ||
      (code >= 0x3130 && code <= 0x318F) ||
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFE30 && code <= 0xFE4F) ||
      (code >= 0x20000 && code <= 0x2A6DF) ||
      (code >= 0x2A700 && code <= 0x2B73F) ||
      (code >= 0x2B740 && code <= 0x2B81F) ||
      (code >= 0x2B820 && code <= 0x2CEAF) ||
      (code >= 0x2CEB0 && code <= 0x2EBEF) ||
      (code >= 0x30000 && code <= 0x3134F)
    ) {
      w += 2
    } else {
      w += 1
    }
  }
  return w
}
