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
  minX: number; minY: number; maxX: number; maxY: number
}
export function Rect(x: number, y: number, w: number, h: number): Rectangle {
  return { minX: x, minY: y, maxX: x + w, maxY: y + h }
}

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
export function ReadLink(link: Link): string { return link.url }
export function ConvertLink(link: Link): string {
  return link.params ? `${link.url}:${link.params}` : link.url
}

// ── ConvertStyle ──
export function ConvertStyle(style: CellStyle): string {
  // TODO: implement full ANSI SGR generation
  return ""
}

// ── StyleDiff ──
export function StyleDiff(from: CellStyle | null, to: CellStyle | null): string {
  // TODO: implement minimal style diff
  return ""
}

// ── Cell ops ──
import { emptyCell, type Cell } from "./cell"
export { emptyCell as EmptyCell }

// ── WidthMethod ──
export type WidthMethod = "unicode" | "wcwidth"
export function TrimSpace(s: string): string { return s.trim() }

// ── Logger stub ──
export class Logger {
  debug(...args: any[]): void {}
  info(...args: any[]): void {}
  warn(...args: any[]): void {}
  error(...args: any[]): void {}
}

// ── Environ stub ──
export function Environ(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== undefined) as [string, string][])
}

// ── Encode stubs ──
export function EncodeBackgroundColor(): string { return "" }
export function EncodeBracketedPaste(): string { return "" }
export function EncodeCursorColor(): string { return "" }
export function EncodeCursorStyle(): string { return "" }
export function EncodeForegroundColor(): string { return "" }
export function EncodeKeyboardEnhancements(): string { return "" }
export function EncodeMouseEncoding(): string { return "" }
export function EncodeMouseMode(): string { return "" }
export function EncodeProgressBar(): string { return "" }
export function EncodeWindowTitle(): string { return "" }

// ── Error constants ──
export const ErrCanceled = new Error("canceled")
export const ErrInvalidDimensions = new Error("invalid dimensions")
export const ErrReaderNotStarted = new Error("reader not started")

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

// ── Cursor constants ──
export const CursorBar = "bar"
export const CursorBlock = "block"
export const CursorUnderline = "underline"
export const CursorShape = "default"

// ── Clipboard ──
export const ClipboardSelection = "clipboard"
export const PrimaryClipboard = "primary"
export const SystemClipboard = "system"

// ── Progress ──
export const ProgressBarDefault = "default"
export const ProgressBarError = "error"
export const ProgressBarIndeterminate = "indeterminate"
export const ProgressBarNone = "none"
export const ProgressBarState = "state"
export const ProgressBarWarning = "warning"

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
export function NewProgressBar(): any { return null }
export function NewSizeNotifier(): any { return null }
export function NewTabStops(): number[] { return DefaultTabStops() }
export function NewKeyboardEnhancements(): any { return null }
export function NewCursor(): any { return null }
export function NewContext(): any { return null }
export function NewCancelReader(): any { return null }
export function NewStyledString(str: string): any { return { text: str, wrap: false, tail: "" } }

// ── Buffer factory functions ──
import { ScreenBuffer } from "./buffer"
export function NewBuffer(w: number, h: number): ScreenBuffer { return new ScreenBuffer(w, h) }
export function NewScreenBuffer(w: number, h: number): ScreenBuffer { return new ScreenBuffer(w, h) }
export function NewRenderBuffer(w: number, h: number): ScreenBuffer { return new ScreenBuffer(w, h) }
export function NewLine(width: number): any[] { return Array(width).fill({ char: " ", style: null, width: 1 }) }

// ── Terminal factory functions ──
export function NewTerminal(): any { return null }
export function NewTerminalReader(): any { return null }
export function NewTerminalRenderer(): any { return null }
export function NewTerminalScreen(): any { return null }
export function NewConsole(): any { return null }

// ── ReadStyle ──
export function ReadStyle(params: string, pen: any): any { return pen }

// ── ProgressBar ──
export const ProgressBar = { Default: "default", Error: "error", Indeterminate: "indeterminate", None: "none", State: "state", Warning: "warning" }

// ── WinCon ──
export const WinCon = null

// ── KeyboardEnhancements ──
export const KeyboardEnhancements = { ReportEventTypes: false, ReportAlternateKeys: false, ReportAllKeysAsEscapeCodes: false, ReportAssociatedText: false }

// ── Buffer standalone functions (Go: Clear(buf, area) wrappers) ──
export function Clear(buf: ScreenBuffer): void { buf.clear() }
export function ClearArea(buf: ScreenBuffer, area: Rectangle): void {
  for (let y = area.minY; y < area.maxY; y++) {
    for (let x = area.minX; x < area.maxX; x++) {
      buf.setCell(x, y, { char: " ", style: null, width: 1 })
    }
  }
}
export function Clone(buf: ScreenBuffer): ScreenBuffer { return buf.clone() }
export function CloneArea(buf: ScreenBuffer, area: Rectangle): ScreenBuffer {
  const clone = new ScreenBuffer(area.maxX - area.minX, area.maxY - area.minY)
  for (let y = area.minY; y < area.maxY; y++) {
    for (let x = area.minX; x < area.maxX; x++) {
      const cell = buf.getCell(x, y)
      if (cell) clone.setCell(x - area.minX, y - area.minY, { ...cell })
    }
  }
  return clone
}
export function Fill(buf: ScreenBuffer, x: number, y: number, w: number, h: number, cell: any): void {
  buf.fill(x, y, w, h, cell?.char ?? " ", cell?.style ?? null)
}
export function FillArea(buf: ScreenBuffer, area: Rectangle, cell: any): void {
  Fill(buf, area.minX, area.minY, area.maxX - area.minX, area.maxY - area.minY, cell)
}

// ── Terminal types ──
export interface TerminalReader {}
export interface TerminalScreen {}

// ── Event types (runtime-compatible) ──
export interface ClipboardEventType { type: "clipboard"; data: string; selection: string }
export interface UnknownApcEventType { type: "unknownApc"; data: string }
export interface UnknownCsiEventType { type: "unknownCsi"; data: string }
export interface UnknownDcsEventType { type: "unknownDcs"; data: string }
export interface UnknownEventType { type: "unknown"; data: string }
export interface UnknownOscEventType { type: "unknownOsc"; data: string }
export interface UnknownPmEventType { type: "unknownPm"; data: string }
export interface UnknownSosEventType { type: "unknownSos"; data: string }
export interface UnknownSs3EventType { type: "unknownSs3"; data: string }

// ── Drawable ──
export interface Drawable { draw(buf: any, area: any): void }
export type DrawableFunc = (buf: any, area: any) => void

// ── Line/LineData ──
export type LineData = string
export type Splitted = string[]
