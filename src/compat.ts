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
export function NewCell(char: string, style?: CellStyle): Cell {
  return { char, style: style ?? null, width: 1 }
}
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
