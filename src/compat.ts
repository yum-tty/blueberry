// compat.ts | Ultraviolet-compatible API re-exports

// ── Text attribute constants (Go: AttrBold = 1 << iota) ──
export const AttrBold = 1 << 0
export const AttrFaint = 1 << 1
export const AttrItalic = 1 << 2
export const AttrBlink = 1 << 3
export const AttrRapidBlink = 1 << 4
export const AttrReverse = 1 << 5
export const AttrConceal = 1 << 6
export const AttrStrikethrough = 1 << 7
export const AttrReset = 0
export const AttrSlowBlink = AttrBlink // deprecated alias

// ── Underline style constants (Go: UnderlineNone = ansi.UnderlineNone) ──
export const UnderlineNone = "none"
export const UnderlineSingle = "single"
export const UnderlineDouble = "double"
export const UnderlineCurly = "curly"
export const UnderlineDotted = "dotted"
export const UnderlineDashed = "dashed"

// Deprecated aliases
export const UnderlineStyleNone = UnderlineNone
export const UnderlineStyleSingle = UnderlineSingle
export const UnderlineStyleDouble = UnderlineDouble
export const UnderlineStyleCurly = UnderlineCurly
export const UnderlineStyleDotted = UnderlineDotted
export const UnderlineStyleDashed = UnderlineDashed

// ── Underline type (Go: type Underline = ansi.Underline) ──
export type Underline = string
export type UnderlineStyle = string // deprecated

// ── Direction / Side / Position ──
export const Horizontal = "horizontal"
export const Vertical = "vertical"
export const Left = "left"
export const Right = "right"
export type Direction = "horizontal" | "vertical"
export type Side = "left" | "right" | "top" | "bottom"
export type Position = number

// ── Border constants ──
export interface Border {
  top: string; bottom: string; left: string; right: string
  topLeft: string; topRight: string; bottomLeft: string; bottomRight: string
  middleLeft?: string; middleRight?: string; middle?: string
  middleTop?: string; middleBottom?: string
}

export const NormalBorder: Border = {
  top: "─", bottom: "─", left: "│", right: "│",
  topLeft: "┌", topRight: "┐", bottomLeft: "└", bottomRight: "┘",
  middleLeft: "├", middleRight: "┤", middle: "┼", middleTop: "┬", middleBottom: "┴",
}
export const RoundedBorder: Border = {
  top: "─", bottom: "─", left: "│", right: "│",
  topLeft: "╭", topRight: "╮", bottomLeft: "╰", bottomRight: "╯",
}
export const DoubleBorder: Border = {
  top: "═", bottom: "═", left: "║", right: "║",
  topLeft: "╔", topRight: "╗", bottomLeft: "╚", bottomRight: "╝",
}
export const ThickBorder: Border = {
  top: "━", bottom: "━", left: "┃", right: "┃",
  topLeft: "┏", topRight: "┓", bottomLeft: "┗", bottomRight: "┛",
}
export const HiddenBorder: Border = {
  top: " ", bottom: " ", left: " ", right: " ",
  topLeft: " ", topRight: " ", bottomLeft: " ", bottomRight: " ",
}
export const BlockBorder: Border = {
  top: "█", bottom: "█", left: "█", right: "█",
  topLeft: "█", topRight: "█", bottomLeft: "█", bottomRight: "█",
}
export const InnerHalfBlockBorder: Border = {
  top: "▄", bottom: "▀", left: "▌", right: "▐",
  topLeft: "▐", topRight: "▌", bottomLeft: "▐", bottomRight: "▌",
}
export const OuterHalfBlockBorder: Border = {
  top: "▀", bottom: "▄", left: "▌", right: "▐",
  topLeft: "▌", topRight: "▐", bottomLeft: "▌", bottomRight: "▐",
}
export const MarkdownBorder: Border = {
  top: " ", bottom: " ", left: ">", right: " ",
  topLeft: "", topRight: "", bottomLeft: "", bottomRight: "",
}
export const ASCIIBorder: Border = {
  top: "-", bottom: "-", left: "|", right: "|",
  topLeft: "+", topRight: "+", bottomLeft: "+", bottomRight: "+",
}

// ── Rectangle / Rect ──
export interface Rectangle {
  MinX: number; MinY: number; MaxX: number; MaxY: number
}
export function Rect(x: number, y: number, w: number, h: number): Rectangle {
  return { MinX: x, MinY: y, MaxX: x + w, MaxY: y + h }
}

export function RectangleDx(r: Rectangle): number { return r.MaxX - r.MinX }
export function RectangleDy(r: Rectangle): number { return r.MaxY - r.MinY }

// ── Size ──
export interface Size { width: number; height: number }

// ── Style type (Go: type Style struct) ──
import type { Style as CellStyle } from "./styled"
export { type CellStyle as Style }

// ── Link type ──
export interface Link {
  url: string
  params: string
}
export function NewLink(url: string, params: string = ""): Link {
  return { url, params }
}

// ── Cell ops ──
import { emptyCell, type Cell } from "./cell"
export { emptyCell as EmptyCell }

// ── WidthMethod ──
export type WidthMethod = "unicode" | "wcwidth"
export function TrimSpace(s: string): string {
  const lines = s.split("\n")
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!
    const hasCR = line.endsWith("\r")
    if (hasCR) line = line.slice(0, -1)
    line = line.replace(/ +$/, "")
    if (hasCR) line += "\r"
    lines[i] = line
  }
  return lines.join("\n")
}

// ── Logger ──
export class Logger {
  debug(...args: any[]): void {}
  info(...args: any[]): void {}
  warn(...args: any[]): void {}
  error(...args: any[]): void {}
}

// ── Environ ──
export function Environ(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== undefined) as [string, string][])
}

// ── ConvertStyle ──
// Go: func ConvertStyle(s Style, p colorprofile.Profile) Style
// Color profiles: truecolor, ANSI256, ANSI, ascii, noTTY
export type ColorProfile = "truecolor" | "ANSI256" | "ANSI" | "ascii" | "noTTY"

// ANSI 256-color cube values: [0, 95, 135, 175, 215, 255]
const CUBE_VALUES = [0, 95, 135, 175, 215, 255]

// Basic 16-color palette as RGB tuples
const BASIC_16_COLORS: [number, number, number][] = [
  [0, 0, 0],       // 0 black
  [128, 0, 0],     // 1 red
  [0, 128, 0],     // 2 green
  [128, 128, 0],   // 3 yellow
  [0, 0, 128],     // 4 blue
  [128, 0, 128],   // 5 magenta
  [0, 128, 128],   // 6 cyan
  [192, 192, 192], // 7 white
  [128, 128, 128], // 8 bright black
  [255, 0, 0],     // 9 bright red
  [0, 255, 0],     // 10 bright green
  [255, 255, 0],   // 11 bright yellow
  [0, 0, 255],     // 12 bright blue
  [255, 0, 255],   // 13 bright magenta
  [0, 255, 255],   // 14 bright cyan
  [255, 255, 255], // 15 bright white
]

function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
}

function nearestAnsi256(r: number, g: number, b: number): string {
  // Check the 6x6x6 color cube (indices 16-231)
  const ri = Math.round(r / 51)
  const gi = Math.round(g / 51)
  const bi = Math.round(b / 51)
  const cubeR = CUBE_VALUES[ri]!
  const cubeG = CUBE_VALUES[gi]!
  const cubeB = CUBE_VALUES[bi]!
  return rgbToHex(cubeR, cubeG, cubeB)
}

function nearestAnsi16(r: number, g: number, b: number): string {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < BASIC_16_COLORS.length; i++) {
    const [cr, cg, cb] = BASIC_16_COLORS[i]!
    const dist = colorDistance(r, g, b, cr, cg, cb)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  const [cr, cg, cb] = BASIC_16_COLORS[bestIdx]!
  return rgbToHex(cr, cg, cb)
}

function convertColor(hex: string | undefined, profile: ColorProfile): string | undefined {
  if (!hex) return undefined
  const [r, g, b] = parseHexColor(hex)
  if (profile === "ANSI256") return nearestAnsi256(r, g, b)
  if (profile === "ANSI") return nearestAnsi16(r, g, b)
  return hex
}

export function ConvertStyle(style: CellStyle, profile: ColorProfile): CellStyle {
  if (profile === "truecolor") return { ...style }
  if (profile === "noTTY") return {}
  if (profile === "ascii") {
    return {
      ...style,
      foreground: undefined,
      background: undefined,
      underlineColor: undefined,
      fgCode: undefined,
      bgCode: undefined,
    }
  }
  // ANSI256 or ANSI: downgrade truecolor to nearest 256 or basic color
  return {
    ...style,
    foreground: convertColor(style.foreground, profile),
    background: convertColor(style.background, profile),
    underlineColor: convertColor(style.underlineColor, profile),
  }
}

export function ConvertLink(link: { url: string; params: string }, profile: ColorProfile): { url: string; params: string } {
  if (profile === "noTTY") return { url: "", params: "" }
  return { ...link }
}

// ── StyleDiff ──
// Go: func StyleDiff(from, to *Style) string
import { styleDiff as _styleDiff, stylesEqual, isStyleEmpty, styleToString } from "./styled"

export function StyleDiff(from: CellStyle | null, to: CellStyle | null): string {
  return _styleDiff(from, to)
}

// ReadLink — parse OSC 8 hyperlink escape (2-part: params;URL)
// Go: func ReadLink(p []byte, link *Link)
export function ReadLink(data: string, link: { url: string; params: string }): void {
  const semi = data.indexOf(";")
  if (semi === -1) return
  link.params = data.substring(0, semi)
  link.url = data.substring(semi + 1)
}

// ── ReadStyle — parse SGR parameters into Style ──
// Go: func ReadStyle(params []int, pen *Style)
export function ReadStyle(params: number[], pen: any): void {
  let i = 0
  while (i < params.length) {
    const p = params[i]
    if (p === 0) {
      pen.bold = false
      pen.faint = false
      pen.italic = false
      pen.blink = false
      pen.reverse = false
      pen.strikethrough = false
      pen.conceal = false
      pen.underline = "none"
      pen.foreground = undefined
      pen.background = undefined
      pen.underlineColor = undefined
    } else if (p === 1) pen.bold = true
    else if (p === 2) pen.faint = true
    else if (p === 3) pen.italic = true
    else if (p === 4) {
      if (i + 1 < params.length && params[i + 1] !== undefined) {
        const sub = params[i + 1]
        if (sub === 2) pen.underline = "double"
        else if (sub === 3) pen.underline = "curly"
        else if (sub === 4) pen.underline = "dotted"
        else if (sub === 5) pen.underline = "dashed"
        else pen.underline = "single"
        i++
      } else {
        pen.underline = "single"
      }
    }
    else if (p === 5) pen.blink = true
    else if (p === 6) pen.rapidBlink = true
    else if (p === 7) pen.reverse = true
    else if (p === 8) pen.conceal = true
    else if (p === 9) pen.strikethrough = true
    else if (p === 22) { pen.bold = false; pen.faint = false }
    else if (p === 23) pen.italic = false
    else if (p === 24) pen.underline = "none"
    else if (p === 25) pen.blink = false
    else if (p === 27) pen.reverse = false
    else if (p === 28) pen.conceal = false
    else if (p === 29) pen.strikethrough = false
    else if (p >= 30 && p <= 37) pen.fgCode = p
    else if (p === 38) {
      if (i + 1 < params.length && params[i + 1] === 5 && i + 2 < params.length) {
        pen.fgCode = p
        i += 2
      } else if (i + 1 < params.length && params[i + 1] === 2 && i + 4 <= params.length) {
        const r = params[i + 2] ?? 0, g = params[i + 3] ?? 0, b = params[i + 4] ?? 0
        pen.foreground = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        i += 4
      } else if (i + 3 < params.length) {
        const r = params[i + 1] ?? 0, g = params[i + 2] ?? 0, b = params[i + 3] ?? 0
        pen.foreground = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        i += 3
      }
    }
    else if (p === 39) pen.foreground = undefined
    else if (p >= 40 && p <= 47) pen.bgCode = p
    else if (p === 48) {
      if (i + 1 < params.length && params[i + 1] === 5 && i + 2 < params.length) {
        pen.bgCode = p
        i += 2
      } else if (i + 1 < params.length && params[i + 1] === 2 && i + 4 <= params.length) {
        const r = params[i + 2] ?? 0, g = params[i + 3] ?? 0, b = params[i + 4] ?? 0
        pen.background = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        i += 4
      } else if (i + 3 < params.length) {
        const r = params[i + 1] ?? 0, g = params[i + 2] ?? 0, b = params[i + 3] ?? 0
        pen.background = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        i += 3
      }
    }
    else if (p === 49) pen.background = undefined
    else if (p === 58) {
      if (i + 3 < params.length) {
        const r = params[i + 1] ?? 0, g = params[i + 2] ?? 0, b = params[i + 3] ?? 0
        pen.underlineColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        i += 3
      }
    }
    else if (p === 59) pen.underlineColor = undefined
    else if (p >= 90 && p <= 97) pen.fgCode = p
    else if (p >= 100 && p <= 107) pen.bgCode = p
    i++
  }
}

// ── CursorShape ──
// Go: type CursorShape int
export enum CursorShapeEnum {
  Block = 0,
  Underline = 1,
  Bar = 2,
}

// Go: const CursorBlock, CursorUnderline, CursorBar
export const CursorBlock = CursorShapeEnum.Block
export const CursorUnderline = CursorShapeEnum.Underline
export const CursorBar = CursorShapeEnum.Bar
export const CursorShape = CursorShapeEnum

/**
 * EncodeCursorShapeValue returns the ANSI escape value for a cursor shape.
 * Go: func (s CursorShape) Encode(blink bool) int
 */
export function EncodeCursorShapeValue(shape: CursorShapeEnum, blink: boolean): number {
  let s = (shape * 2) + 1
  if (!blink) s++
  return s
}

// ── Cursor struct ──
// Go: type Cursor struct { Position; Color color.Color; Shape CursorShape; Blink bool; Hidden bool }
export interface Cursor {
  x: number
  y: number
  color: string | null
  shape: CursorShapeEnum
  blink: boolean
  hidden: boolean
}

export function NewCursor(x: number = 0, y: number = 0): Cursor {
  return { x, y, color: null, shape: CursorBlock, blink: true, hidden: false }
}

// ── ProgressBar struct ──
// Go: type ProgressBarState int
export enum ProgressBarStateEnum {
  None = 0,
  Default = 1,
  Error = 2,
  Indeterminate = 3,
  Warning = 4,
}

export const ProgressBarNone = ProgressBarStateEnum.None
export const ProgressBarDefault = ProgressBarStateEnum.Default
export const ProgressBarError = ProgressBarStateEnum.Error
export const ProgressBarIndeterminate = ProgressBarStateEnum.Indeterminate
export const ProgressBarWarning = ProgressBarStateEnum.Warning

/**
 * ProgressBarData represents the terminal progress bar.
 * Go: type ProgressBar struct { State ProgressBarState; Value int }
 */
export interface ProgressBarData {
  state: ProgressBarStateEnum
  value: number
}

export function NewProgressBar(state: ProgressBarStateEnum, value: number): ProgressBarData {
  return { state, value: Math.min(Math.max(value, 0), 100) }
}

// ── KeyboardEnhancements struct ──
// Go: type KeyboardEnhancements struct { ... }

/** Kitty keyboard enhancement flags */
export const KittyDisambiguateEscapeCodes = 1
export const KittyReportEventTypes = 2
export const KittyReportAlternateKeys = 4
export const KittyReportAllKeysAsEscapeCodes = 8
export const KittyReportAssociatedKeys = 16

export interface KeyboardEnhancementsOpts {
  DisambiguateEscapeCodes: boolean
  ReportEventTypes: boolean
  ReportAlternateKeys: boolean
  ReportAllKeysAsEscapeCodes: boolean
  ReportAssociatedText: boolean
}

export function NewKeyboardEnhancements(flags: number = 0): KeyboardEnhancementsOpts {
  if (flags <= 0) {
    return {
      DisambiguateEscapeCodes: false,
      ReportEventTypes: false,
      ReportAlternateKeys: false,
      ReportAllKeysAsEscapeCodes: false,
      ReportAssociatedText: false,
    }
  }
  return {
    DisambiguateEscapeCodes: !!(flags & KittyDisambiguateEscapeCodes),
    ReportEventTypes: !!(flags & KittyReportEventTypes),
    ReportAlternateKeys: !!(flags & KittyReportAlternateKeys),
    ReportAllKeysAsEscapeCodes: !!(flags & KittyReportAllKeysAsEscapeCodes),
    ReportAssociatedText: !!(flags & KittyReportAssociatedKeys),
  }
}

/**
 * Flags returns the keyboard enhancements as bits.
 * Go: func (ke KeyboardEnhancements) Flags() int
 */
export function KeyboardEnhancementsFlags(ke: KeyboardEnhancementsOpts): number {
  let bits = 0
  if (ke.DisambiguateEscapeCodes) bits |= KittyDisambiguateEscapeCodes
  if (ke.ReportEventTypes) bits |= KittyReportEventTypes
  if (ke.ReportAlternateKeys) bits |= KittyReportAlternateKeys
  if (ke.ReportAllKeysAsEscapeCodes) bits |= KittyReportAllKeysAsEscapeCodes
  if (ke.ReportAssociatedText) bits |= KittyReportAssociatedKeys
  return bits
}

// ── Encode functions ──
// Go: func EncodeBackgroundColor(w io.Writer, c color.Color) error
export function EncodeBackgroundColor(color: string | null): string {
  if (!color) return "\x1b[49m"
  return `\x1b[48;2;${hexToRgb(color)}m`
}

// Go: func EncodeForegroundColor(w io.Writer, c color.Color) error
export function EncodeForegroundColor(color: string | null): string {
  if (!color) return "\x1b[39m"
  return `\x1b[38;2;${hexToRgb(color)}m`
}

// Go: func EncodeCursorColor(w io.Writer, c color.Color) error
export function EncodeCursorColor(color: string | null): string {
  if (!color) return "\x1b]112\x07"
  return `\x1b]12;${color}\x07`
}

// Go: func EncodeCursorStyle(w io.Writer, shape CursorShape, blink bool) error
export function EncodeCursorStyle(shape: CursorShapeEnum, blink: boolean): string {
  const val = EncodeCursorShapeValue(shape, blink)
  return `\x1b[${val} q`
}

// Go: func EncodeBracketedPaste(w io.Writer, enable bool) error
export function EncodeBracketedPaste(enable: boolean): string {
  return enable ? "\x1b[?2004h" : "\x1b[?2004l"
}

// Go: func EncodeMouseMode(w io.Writer, mode MouseMode) error
export function EncodeMouseMode(mode: number): string {
  switch (mode) {
    case 0: return "\x1b[?9l\x1b[?1000l\x1b[?1002l\x1b[?1003l"
    case 1: return "\x1b[?9h"
    case 2: return "\x1b[?1000h"
    case 3: return "\x1b[?1002h"
    case 4: return "\x1b[?1003h"
    default: return ""
  }
}

// Go: func EncodeMouseEncoding(w io.Writer, enc MouseEncoding) error
export function EncodeMouseEncoding(enc: number): string {
  switch (enc) {
    case 0: return "\x1b[?1006l\x1b[?1015l\x1b[?1016l"
    case 1: return "\x1b[?1006h"
    case 2: return "\x1b[?1016h"
    default: return ""
  }
}

// Go: func EncodeProgressBar(w io.Writer, pb *ProgressBar) error
export function EncodeProgressBar(pb: ProgressBarData | null): string {
  if (!pb) return "\x1b]9;4;\x07"
  const percent = Math.min(Math.max(pb.value, 0), 100)
  switch (pb.state) {
    case ProgressBarNone: return "\x1b]9;4;\x07"
    case ProgressBarDefault: return `\x1b]9;4;${percent};${percent === 100 ? 1 : 0}\x07`
    case ProgressBarError: return `\x1b]9;4;${percent};${percent === 100 ? 2 : -1}\x07`
    case ProgressBarIndeterminate: return "\x1b]9;4;indeterminate\x07"
    case ProgressBarWarning: return `\x1b]9;4;${percent};${percent === 100 ? 3 : -1}\x07`
    default: return "\x1b]9;4;\x07"
  }
}

// Go: func EncodeKeyboardEnhancements(w io.Writer, ke *KeyboardEnhancements) error
export function EncodeKeyboardEnhancements(ke: KeyboardEnhancementsOpts | null): string {
  const flags = ke ? KeyboardEnhancementsFlags(ke) : 0
  // ansi.KittyKeyboard(flags, 1) produces CSI > {flags} u (push current flags, then set)
  return `\x1b[>${flags}u`
}

// Go: func EncodeWindowTitle(w io.Writer, title string) error
export function EncodeWindowTitle(title: string): string {
  return `\x1b]0;${title}\x07`
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `${r};${g};${b}`
}

// ── Error constants ──
export const ErrCanceled = new Error("canceled")
export const ErrInvalidDimensions = new Error("invalid dimensions")
export const ErrReaderNotStarted = new Error("reader not started")
export const ErrNotTerminal = new Error("not a terminal")
export const ErrPlatformNotSupported = new Error("platform not supported")

// ── Mouse constants ──
export const MouseNone = 0
export const MouseLeft = 1
export const MouseMiddle = 2
export const MouseRight = 3
export const MouseBackward = 4
export const MouseForward = 5
export const MouseModeNone = 0
export const MouseModePress = 1
export const MouseButton10 = 10
export const MouseButton11 = 11
export const MouseWheelDown = 12
export const MouseWheelUp = 13
export const MouseWheelLeft = 14
export const MouseWheelRight = 15

// ── Clipboard ──
export const ClipboardSelection = "clipboard"
export const PrimaryClipboard = "primary"
export const SystemClipboard = "system"

// ── TabStops ──
export function DefaultTabStops(): number[] {
  const stops: number[] = []
  for (let i = 0; i < 256; i += 8) stops.push(i)
  return stops
}
export const TabStops = DefaultTabStops()

// ── Terminal stubs ──
export const DefaultConsole = null
export const DefaultTerminal = null
export const DefaultOptions = {}
export const ControllingConsole = null
export const ControllingTerminal = null
export const LegacyKeyEncoding = false
export const Suspend = () => {}
export const NotifyWinch = () => {}
export const NotifyWinchContext = () => {}
export const OpenTTY = () => null
export const File = null
export const TTY = null
export const Console = null

// ── Window ──
export const Window = { width: 80, height: 24 }
export const NewWindow = () => ({ width: 80, height: 24 })
export const Winsize = { width: 80, height: 24 }
export const SizeNotifier = null

// ── Misc ──
export function Pos(x: number, y: number): { x: number; y: number } { return { x, y } }
export function New(...args: any[]): any { return args }
export const Options = {}
export function NewSizeNotifier(): any { return null }
export function NewTabStops(): number[] { return DefaultTabStops() }
export function NewContext(): any { return null }
export function NewCancelReader(): any { return null }

export function NewStyledString(str: string): any { return { text: str, wrap: false, tail: "" } }

// ── Buffer factory functions ──
import { ScreenBuffer, Buffer, RenderBuffer, NewLine, NewLine as _NewLine } from "./buffer"
export function NewBuffer(w: number, h: number): Buffer { return new Buffer(w, h) }
export function NewScreenBuffer(w: number, h: number): ScreenBuffer { return new ScreenBuffer(w, h) }
export function NewRenderBuffer(w: number, h: number): RenderBuffer { return new RenderBuffer(w, h) }
export { _NewLine as NewLine }

// ── Terminal factory functions ──
export function NewTerminal(): any { return null }
export function NewTerminalReader(): any { return null }
export function NewTerminalRenderer(): any { return null }
export function NewTerminalScreen(): any { return null }
export function NewConsole(): any { return null }

// ── ProgressBar ──
export const ProgressBar = {
  Default: ProgressBarStateEnum.Default,
  Error: ProgressBarStateEnum.Error,
  Indeterminate: ProgressBarStateEnum.Indeterminate,
  None: ProgressBarStateEnum.None,
  State: ProgressBarStateEnum.Default,
  Warning: ProgressBarStateEnum.Warning,
}

// ── WinCon ──
export const WinCon = null

// ── KeyboardEnhancements ──
export const KeyboardEnhancements = {
  DisambiguateEscapeCodes: false,
  ReportEventTypes: false,
  ReportAlternateKeys: false,
  ReportAllKeysAsEscapeCodes: false,
  ReportAssociatedText: false,
}

// ── Buffer standalone functions (Go: Clear(buf, area) wrappers) ──
export function Clear(buf: ScreenBuffer): void { buf.clear() }
export function ClearArea(buf: ScreenBuffer, area: Rectangle): void {
  for (let y = area.MinY; y < area.MaxY; y++) {
    for (let x = area.MinX; x < area.MaxX; x++) {
      buf.setCell(x, y, { Content: " ", Style: null, Link: { URL: "", Params: "" }, Width: 1 })
    }
  }
}
export function Clone(buf: ScreenBuffer): ScreenBuffer { return buf.clone() }
export function CloneArea(buf: ScreenBuffer, area: Rectangle): ScreenBuffer {
  const clone = new ScreenBuffer(area.MaxX - area.MinX, area.MaxY - area.MinY)
  for (let y = area.MinY; y < area.MaxY; y++) {
    for (let x = area.MinX; x < area.MaxX; x++) {
      const cell = buf.getCell(x, y)
      if (cell) clone.setCell(x - area.MinX, y - area.MinY, { ...cell })
    }
  }
  return clone
}
export function Fill(buf: ScreenBuffer, x: number, y: number, w: number, h: number, cell: any): void {
  buf.fill(x, y, w, h, cell?.Content ?? " ", cell?.Style ?? null)
}
export function FillArea(buf: ScreenBuffer, area: Rectangle, cell: any): void {
  Fill(buf, area.MinX, area.MinY, area.MaxX - area.MinX, area.MaxY - area.MinY, cell)
}

// ── Terminal types ──
export interface TerminalReader {}
export interface TerminalScreen {}

// ── Event types (runtime-compatible) ──
export interface ClipboardEventType { type: "clipboard"; data: string; selection: string }

// ── Drawable ──
export interface Drawable { draw(buf: any, area: any): void }
export type DrawableFunc = (buf: any, area: any) => void

// ── Line/LineData ──
export type LineData = string
export type Splitted = string[]

// ── MouseEncoding ──
export const MouseEncodingLegacy = 0
export const MouseEncodingSGR = 1
export const MouseEncodingSGRPixel = 2

// ── MouseMode ──
export const MouseModeClick = 2
export const MouseModeDrag = 3
export const MouseModeMotion = 4

// ── MouseButton ──
export const MouseButton = {
  None: 0,
  Left: 1,
  Middle: 2,
  Right: 3,
  WheelUp: 4,
  WheelDown: 5,
  WheelLeft: 6,
  WheelRight: 7,
  Backward: 8,
  Forward: 9,
  Button10: 10,
  Button11: 11,
}
