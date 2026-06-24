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

export interface ModeReportEvent {
  type: "modeReport"
  mode: number
  value: number
}

export interface UnknownEvent {
  type: "unknown"
  raw: string
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
  | ModeReportEvent
  | UnknownEvent
