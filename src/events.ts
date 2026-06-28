// events.ts | event types (ultraviolet port)

import type { Key } from "./keys"
import type { Mouse } from "./mouse"

export interface KeyEvent {
  type: "keyPress" | "keyRelease"
  key: Key
}

export interface MouseClickEvent {
  type: "mouseClick"
  mouse: Mouse
}

export interface MouseReleaseEvent {
  type: "mouseRelease"
  mouse: Mouse
}

export interface MouseWheelEvent {
  type: "mouseWheel"
  mouse: Mouse
}

export interface MouseMotionEvent {
  type: "mouseMotion"
  mouse: Mouse
}

export interface CursorPositionEvent {
  type: "cursorPosition"
  x: number
  y: number
}

export interface WindowSizeEvent {
  type: "windowSize"
  width: number
  height: number
}

export interface PixelSizeEvent {
  type: "pixelSize"
  width: number
  height: number
}

export interface CellSizeEvent {
  type: "cellSize"
  width: number
  height: number
}

export interface FocusEvent {
  type: "focus"
}

export interface BlurEvent {
  type: "blur"
}

export interface DarkColorSchemeEvent {
  type: "darkColorScheme"
}

export interface LightColorSchemeEvent {
  type: "lightColorScheme"
}

export interface PasteEvent {
  type: "paste"
  content: string
}

export interface PasteStartEvent {
  type: "pasteStart"
}

export interface PasteEndEvent {
  type: "pasteEnd"
}

export interface TerminalVersionEvent {
  type: "terminalVersion"
  name: string
}

export interface ModifyOtherKeysEvent {
  type: "modifyOtherKeys"
  mode: number
}

export interface KeyboardEnhancementsEvent {
  type: "keyboardEnhancements"
  flags: number
}

export interface PrimaryDeviceAttributesEvent {
  type: "primaryDeviceAttributes"
  attrs: number[]
}

export interface SecondaryDeviceAttributesEvent {
  type: "secondaryDeviceAttributes"
  attrs: number[]
}

export interface TertiaryDeviceAttributesEvent {
  type: "tertiaryDeviceAttributes"
  value: string
}

export interface ModeReportEvent {
  type: "modeReport"
  mode: number
  value: number
}

export interface UnknownEvent {
  type: "unknown"
  raw: string
}

export interface UnknownCsiEvent {
  type: "unknownCsi"
  data: string
}

export interface UnknownOscEvent {
  type: "unknownOsc"
  data: string
}

export interface UnknownDcsEvent {
  type: "unknownDcs"
  data: string
}

export interface UnknownSosEvent {
  type: "unknownSos"
  data: string
}

export interface UnknownPmEvent {
  type: "unknownPm"
  data: string
}

export interface UnknownApcEvent {
  type: "unknownApc"
  data: string
}

export interface UnknownSs3Event {
  type: "unknownSs3"
  data: string
}

/**
 * Size represents the size of the terminal window.
 * Go: type Size struct { Width, Height int }
 */
export interface Size {
  width: number
  height: number
}

/**
 * Bounds returns the bounds corresponding to the size.
 * Go: Size.Bounds() Rectangle
 */
export function sizeBounds(s: Size): { minX: number; minY: number; maxX: number; maxY: number } {
  return { minX: 0, minY: 0, maxX: s.width, maxY: s.height }
}

/**
 * KittyGraphicsEvent represents a Kitty Graphics response event.
 * Go: type KittyGraphicsEvent struct { Options kitty.Options; Payload []byte }
 * See https://sw.kovidgoyal.net/kitty/graphics-protocol/
 */
export interface KittyGraphicsEvent {
  type: "kittyGraphics"
  options: number
  payload: Uint8Array
}

/**
 * ForegroundColorEvent represents a foreground color event.
 * Go: type ForegroundColorEvent struct{ color.Color }
 */
export interface ForegroundColorEvent {
  type: "foregroundColor"
  color: string | null
}

/**
 * String returns the hex representation of the color.
 */
export function foregroundColorString(e: ForegroundColorEvent): string {
  return colorToHex(e.color)
}

/**
 * IsDark returns whether the color is dark.
 */
export function foregroundColorIsDark(e: ForegroundColorEvent): boolean {
  return isDarkColor(e.color)
}

/**
 * BackgroundColorEvent represents a background color event.
 * Go: type BackgroundColorEvent struct{ color.Color }
 */
export interface BackgroundColorEvent {
  type: "backgroundColor"
  color: string | null
}

/**
 * String returns the hex representation of the color.
 */
export function backgroundColorString(e: BackgroundColorEvent): string {
  return colorToHex(e.color)
}

/**
 * IsDark returns whether the color is dark.
 */
export function backgroundColorIsDark(e: BackgroundColorEvent): boolean {
  return isDarkColor(e.color)
}

/**
 * CursorColorEvent represents a cursor color change event.
 * Go: type CursorColorEvent struct{ color.Color }
 */
export interface CursorColorEvent {
  type: "cursorColor"
  color: string | null
}

/**
 * String returns the hex representation of the color.
 */
export function cursorColorString(e: CursorColorEvent): string {
  return colorToHex(e.color)
}

/**
 * IsDark returns whether the color is dark.
 */
export function cursorColorIsDark(e: CursorColorEvent): boolean {
  return isDarkColor(e.color)
}

/**
 * WindowOpEvent is a window operation (XTWINOPS) report event.
 * Go: type WindowOpEvent struct { Op int; Args []int }
 */
export interface WindowOpEvent {
  type: "windowOp"
  op: number
  args: number[]
}

/**
 * CapabilityEvent represents a Termcap/Terminfo response event.
 * Go: type CapabilityEvent struct { Content string }
 */
export interface CapabilityEvent {
  type: "capability"
  content: string
}

/**
 * String returns the capability content.
 */
export function capabilityString(e: CapabilityEvent): string {
  return e.content
}

/**
 * ClipboardSelection represents a clipboard selection type.
 * Go: type ClipboardSelection = byte
 * SystemClipboard = 'c', PrimaryClipboard = 'p'
 */
export type ClipboardSelection = "system" | "primary"

export const SystemClipboard: ClipboardSelection = "system"
export const PrimaryClipboard: ClipboardSelection = "primary"

/**
 * ClipboardEvent is a clipboard read message event.
 * Emitted when a terminal receives an OSC 52 clipboard read event.
 * Go: type ClipboardEvent struct { Content string; Selection ClipboardSelection }
 */
export interface ClipboardEvent {
  type: "clipboard"
  content: string
  selection: ClipboardSelection
}

/**
 * String returns the clipboard content.
 */
export function clipboardEventString(e: ClipboardEvent): string {
  return e.content
}

/**
 * Clipboard returns the clipboard selection (system or primary).
 */
export function clipboardEventSelection(e: ClipboardEvent): ClipboardSelection {
  return e.selection
}

export type TerminalEvent =
  | KeyEvent
  | MouseClickEvent
  | MouseReleaseEvent
  | MouseWheelEvent
  | MouseMotionEvent
  | CursorPositionEvent
  | WindowSizeEvent
  | PixelSizeEvent
  | CellSizeEvent
  | FocusEvent
  | BlurEvent
  | DarkColorSchemeEvent
  | LightColorSchemeEvent
  | PasteEvent
  | PasteStartEvent
  | PasteEndEvent
  | TerminalVersionEvent
  | ModifyOtherKeysEvent
  | KeyboardEnhancementsEvent
  | PrimaryDeviceAttributesEvent
  | SecondaryDeviceAttributesEvent
  | TertiaryDeviceAttributesEvent
  | ModeReportEvent
  | KittyGraphicsEvent
  | ForegroundColorEvent
  | BackgroundColorEvent
  | CursorColorEvent
  | WindowOpEvent
  | CapabilityEvent
  | ClipboardEvent
  | UnknownEvent
  | UnknownCsiEvent
  | UnknownOscEvent
  | UnknownDcsEvent
  | UnknownSosEvent
  | UnknownPmEvent
  | UnknownApcEvent
  | UnknownSs3Event

// ── Color helpers ──

function colorToHex(color: string | null): string {
  if (!color) return ""
  return color
}

function isDarkColor(color: string | null): boolean {
  if (!color) return true
  const hex = color.replace("#", "")
  if (hex.length < 6) return true
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const l = (max + min) / 2
  return l < 0.5
}
