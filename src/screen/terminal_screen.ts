// terminal_screen.ts | TerminalScreen (ultraviolet port)

import { Window } from "../window"
import { TerminalRenderer } from "../terminal_renderer"
import { ScreenBuffer } from "../buffer"
import { type Cell, isZero, cellClone, emptyCell } from "../cell"
import { type Rectangle, Rect, RectangleDx, RectangleDy, type Style, type Cursor, NewCursor, type ColorProfile } from "../compat"
import { EncodeBracketedPaste, EncodeKeyboardEnhancements, EncodeMouseMode, EncodeMouseEncoding, EncodeCursorStyle, EncodeCursorColor, EncodeBackgroundColor, EncodeForegroundColor, EncodeProgressBar, EncodeWindowTitle, type ProgressBarData, type KeyboardEnhancementsOpts } from "../compat"

const ESC = "\x1b"
const CSI = ESC + "["
const OSC = ESC + "]"

const ALT_SCREEN_ON = CSI + "?1049h"
const ALT_SCREEN_OFF = CSI + "?1049l"
const HIDE_CURSOR = CSI + "?25l"
const SHOW_CURSOR = CSI + "?25h"
const SET_MODE_SYNC = CSI + "?2026h"
const RESET_MODE_SYNC = CSI + "?2026l"
const ERASE_DISPLAY = CSI + "2J"
const CURSOR_HOME = CSI + "H"
const RESET_STYLE = CSI + "0m"
const INSERT_LINE = CSI + "L"
const CURSOR_UP = CSI + "A"
const CURSOR_DOWN = CSI + "B"
const ERASE_LINE_RIGHT = CSI + "K"

export class TerminalScreen {
  private win: Window
  private w: NodeJS.WriteStream
  private buf: string
  private rend: TerminalRenderer
  private rbuf: ScreenBuffer
  private profile: ColorProfile

  private altScreenActive: boolean
  private keyboardEnhancements: KeyboardEnhancementsOpts | null
  private bracketedPasteActive: boolean
  private mouseModeActive: number
  private mouseEncodingActive: number
  private cursorState: Cursor
  private backgroundColor: string | null
  private foregroundColor: string | null
  private progressBarState: ProgressBarData | null
  private windowTitle: string
  private syncUpdates: boolean
  private previousRawMode: boolean | undefined
  private started: boolean

  constructor(w?: NodeJS.WriteStream, profile: ColorProfile = "truecolor") {
    this.w = w ?? process.stdout
    this.buf = ""
    this.profile = profile
    this.altScreenActive = false
    this.keyboardEnhancements = null
    this.bracketedPasteActive = false
    this.mouseModeActive = 0
    this.mouseEncodingActive = 0
    this.cursorState = NewCursor(-1, -1)
    this.cursorState.hidden = true
    this.backgroundColor = null
    this.foregroundColor = null
    this.progressBarState = null
    this.windowTitle = ""
    this.syncUpdates = false
    this.started = false

    const width = this.w.columns || 80
    const height = this.w.rows || 24

    this.win = new Window(width, height)
    this.rend = new TerminalRenderer(this.w)
    this.rbuf = new ScreenBuffer(width, height)
    this.rend.setFullscreen(false)
    this.rend.setRelativeCursor(true)
    this.rend.setColorProfile(this.profile)
  }

  cellAt(x: number, y: number): Cell | null {
    return this.win.cellAt(x, y)
  }

  setCell(x: number, y: number, cell: Cell | null): void {
    this.win.setCell(x, y, cell)
  }

  bounds(): Rectangle {
    return this.win.getBounds()
  }

  width(): number {
    return this.win.width()
  }

  height(): number {
    return this.win.height()
  }

  setColorProfile(profile: ColorProfile): void {
    this.profile = profile
    this.rend.setColorProfile(profile)
  }

  resize(width: number, height: number): void {
    this.win.resize(width, height)
    this.rbuf.resize(width, height)
    this.rend.resize(width, height)
    this.rend.erase()
  }

  init(): void {
    if (this.started) return
    this.started = true

    this.previousRawMode = process.stdin.isRaw
    if (typeof process.stdin.setRawMode === "function") {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding("utf8")

    const width = this.w.columns || 80
    const height = this.w.rows || 24
    this.resize(width, height)
    this.rend.init(false)
  }

  enterAltScreen(): void {
    let seq = ALT_SCREEN_ON
    if (this.cursorState.hidden) {
      seq += HIDE_CURSOR
    } else {
      seq += SHOW_CURSOR
    }
    if (this.keyboardEnhancements) {
      seq += EncodeKeyboardEnhancements(this.keyboardEnhancements)
    }
    this.buf += seq

    if (!this.altScreenActive) {
      this.rend.saveCursor()
      this.rend.erase()
      this.rend.setFullscreen(true)
      this.rend.setRelativeCursor(false)
      this.altScreenActive = true
    }
  }

  exitAltScreen(): void {
    let seq = ALT_SCREEN_OFF
    if (this.cursorState.hidden) {
      seq += HIDE_CURSOR
    } else {
      seq += SHOW_CURSOR
    }
    if (this.keyboardEnhancements) {
      seq += EncodeKeyboardEnhancements(this.keyboardEnhancements)
    }
    this.buf += seq

    if (this.altScreenActive) {
      this.rend.restoreCursor()
      this.rend.erase()
      this.rend.setFullscreen(false)
      this.rend.setRelativeCursor(true)
      this.altScreenActive = false
    }
  }

  isAltScreen(): boolean {
    return this.altScreenActive
  }

  hideCursor(): void {
    this.buf += HIDE_CURSOR
    this.cursorState.hidden = true
  }

  showCursor(): void {
    this.buf += SHOW_CURSOR
    this.cursorState.hidden = false
  }

  cursorVisible(): boolean {
    return !this.cursorState.hidden
  }

  setCursorPosition(x: number, y: number): void {
    this.cursorState.x = x
    this.cursorState.y = y
  }

  cursorPosition(): { x: number; y: number } {
    return { x: this.cursorState.x, y: this.cursorState.y }
  }

  setCursorStyle(shape: number, blink: boolean): void {
    this.buf += EncodeCursorStyle(shape as any, blink)
    this.cursorState.shape = shape as any
    this.cursorState.blink = blink
  }

  setCursorColor(color: string | null): void {
    this.buf += EncodeCursorColor(color)
    this.cursorState.color = color
  }

  setBackgroundColor(c: string | null): void {
    this.buf += EncodeBackgroundColor(c)
    this.backgroundColor = c
  }

  getBackgroundColor(): string | null {
    return this.backgroundColor
  }

  setForegroundColor(c: string | null): void {
    this.buf += EncodeForegroundColor(c)
    this.foregroundColor = c
  }

  getForegroundColor(): string | null {
    return this.foregroundColor
  }

  enableBracketedPaste(): void {
    this.buf += EncodeBracketedPaste(true)
    this.bracketedPasteActive = true
  }

  disableBracketedPaste(): void {
    this.buf += EncodeBracketedPaste(false)
    this.bracketedPasteActive = false
  }

  isBracketedPaste(): boolean {
    return this.bracketedPasteActive
  }

  setSynchronizedUpdates(enabled: boolean): void {
    this.syncUpdates = enabled
  }

  isSynchronizedUpdates(): boolean {
    return this.syncUpdates
  }

  setMouseMode(mode: number): void {
    this.buf += EncodeMouseMode(mode)
    this.mouseModeActive = mode
  }

  getMouseMode(): number {
    return this.mouseModeActive
  }

  setMouseEncoding(enc: number): void {
    this.buf += EncodeMouseEncoding(enc)
    this.mouseEncodingActive = enc
  }

  getMouseEncoding(): number {
    return this.mouseEncodingActive
  }

  setWindowTitle(title: string): void {
    this.buf += EncodeWindowTitle(title)
    this.windowTitle = title
  }

  getWindowTitle(): string {
    return this.windowTitle
  }

  setKeyboardEnhancements(enh: KeyboardEnhancementsOpts | null): void {
    this.buf += EncodeKeyboardEnhancements(enh)
    this.keyboardEnhancements = enh
  }

  getKeyboardEnhancements(): KeyboardEnhancementsOpts | null {
    return this.keyboardEnhancements
  }

  setProgressBar(pb: ProgressBarData | null): void {
    this.buf += EncodeProgressBar(pb)
    this.progressBarState = pb
  }

  getProgressBar(): ProgressBarData | null {
    return this.progressBarState
  }

  display(drawable?: { draw: (screen: any, area: Rectangle) => void }): void {
    if (drawable) {
      this.win.clear()
      drawable.draw(this, this.win.getBounds())
    }
    this.render()
    this.flush()
  }

  render(): void {
    const w = this.win.width()
    const h = this.win.height()

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w;) {
        const cell = this.win.cellAt(x, y)
        if (!cell || isZero(cell)) {
          x++
          continue
        }
        this.rbuf.setCell(x, y, cell)
        const cellWidth = cell.Width > 0 ? cell.Width : 1
        x += cellWidth
      }
    }
    this.rend.renderFromBuffer(this.rbuf)
  }

  flush(): void {
    if (this.cursorState.x >= 0 && this.cursorState.y >= 0 && !this.cursorState.hidden) {
      this.rend.moveTo(this.cursorState.x, this.cursorState.y)
    } else if (!this.altScreenActive) {
      const pos = this.rend.getPosition()
      if (pos.x >= this.win.width() - 1) {
        this.rend.moveTo(0, pos.y)
      }
    }

    let out = ""
    const rendOutput = this.rend.getPendingOutput()

    if (rendOutput.length > 0) {
      if (this.syncUpdates) {
        out += SET_MODE_SYNC
      } else if (!this.cursorState.hidden) {
        out += HIDE_CURSOR
      }
      out += this.buf + rendOutput
      if (this.syncUpdates) {
        out += RESET_MODE_SYNC
      } else if (!this.cursorState.hidden) {
        out += SHOW_CURSOR
      }
    } else if (this.buf.length > 0) {
      out += this.buf
    }

    if (out.length > 0) {
      this.w.write(out)
    }
    this.buf = ""
  }

  reset(): void {
    let seq = ""

    if (this.altScreenActive) {
      if (this.keyboardEnhancements) {
        seq += EncodeKeyboardEnhancements(null)
      }
      seq += ALT_SCREEN_OFF
    }
    if (this.keyboardEnhancements) {
      seq += EncodeKeyboardEnhancements(null)
    }
    if (this.mouseModeActive !== 0) {
      seq += EncodeMouseMode(0)
    }
    if (this.mouseEncodingActive !== 0) {
      seq += EncodeMouseEncoding(0)
    }
    if (!this.cursorState.hidden) {
      seq += SHOW_CURSOR
    }
    if (this.cursorState.shape !== 0 || !this.cursorState.blink) {
      seq += CSI + "0 q"
    }
    if (this.cursorState.color !== null) {
      seq += OSC + "112" + ESC + "\\"
    }
    if (this.backgroundColor !== null) {
      seq += CSI + "11m"
    }
    if (this.foregroundColor !== null) {
      seq += CSI + "10m"
    }
    if (this.bracketedPasteActive) {
      seq += EncodeBracketedPaste(false)
    }
    if (this.windowTitle !== "") {
      seq += EncodeWindowTitle("")
    }
    if (this.progressBarState !== null && this.progressBarState.state !== 0) {
      seq += OSC + "9;4;" + ESC + "\\"
    }

    this.buf += seq
    this.rend.moveTo(0, this.win.height() - 1)
  }

  restore(): void {
    let seq = ""

    if (this.altScreenActive) {
      seq += ALT_SCREEN_ON
    }
    if (this.cursorState.hidden) {
      seq += HIDE_CURSOR
    } else {
      seq += SHOW_CURSOR
    }
    if (this.keyboardEnhancements) {
      seq += EncodeKeyboardEnhancements(this.keyboardEnhancements)
    }
    if (this.mouseModeActive !== 0) {
      seq += EncodeMouseMode(this.mouseModeActive)
    }
    if (this.mouseEncodingActive !== 0) {
      seq += EncodeMouseEncoding(this.mouseEncodingActive)
    }
    if (this.cursorState.shape !== 0 || !this.cursorState.blink) {
      seq += EncodeCursorStyle(this.cursorState.shape, this.cursorState.blink)
    }
    if (this.cursorState.color !== null) {
      seq += EncodeCursorColor(this.cursorState.color)
    }
    if (this.backgroundColor !== null) {
      seq += EncodeBackgroundColor(this.backgroundColor)
    }
    if (this.foregroundColor !== null) {
      seq += EncodeForegroundColor(this.foregroundColor)
    }
    if (this.bracketedPasteActive) {
      seq += EncodeBracketedPaste(true)
    }
    if (this.windowTitle !== "") {
      seq += EncodeWindowTitle(this.windowTitle)
    }
    if (this.progressBarState !== null && this.progressBarState.state !== 0) {
      seq += EncodeProgressBar(this.progressBarState)
    }

    this.buf += seq
    this.render()
  }

  insertAbove(content: string): void {
    if (content.length === 0) return

    let seq = ""
    const w = this.win.width()
    const h = this.win.height()
    const pos = this.rend.getPosition()

    seq += "\r"
    const down = h - pos.y - 1
    if (down > 0) {
      seq += `${CSI}${down}B`
    }

    const lines = content.split("\n")
    let offset = lines.length
    for (const line of lines) {
      const lineWidth = line.length
      if (w > 0 && lineWidth > w) {
        offset += Math.floor(lineWidth / w)
      }
    }

    seq += "\n".repeat(offset)

    const up = offset + h - 1
    seq += `${CSI}${up}A`
    seq += `${CSI}${offset}L`
    for (const line of lines) {
      seq += line
      seq += ERASE_LINE_RIGHT
      seq += "\r\n"
    }

    this.rend.setPosition(0, 0)
    this.w.write(seq)
  }

  write(p: string): void {
    this.buf += p
  }

  destroy(): void {
    this.reset()
    this.flush()

    if (typeof process.stdin.setRawMode === "function" && this.previousRawMode !== undefined) {
      process.stdin.setRawMode(this.previousRawMode)
    }
    process.stdin.pause()
    this.started = false
  }
}
