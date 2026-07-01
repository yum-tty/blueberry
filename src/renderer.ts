// renderer.ts | terminal renderer (ultraviolet port)

import { ScreenBuffer } from "./buffer"
import { type Cell, cellEquals, isZero } from "./cell"
import { type Style, styleToString, styleDiff, isStyleEmpty, stylesEqual } from "./styled"

const ESC = "\x1b"
const CSI = `${ESC}[`

/**
 * TerminalRenderer handles rendering to the terminal.
 */
export class TerminalRenderer {
  private output: NodeJS.WriteStream
  private width: number
  private height: number
  private prevBuffer: ScreenBuffer
  private currBuffer: ScreenBuffer
  private cursorVisible: boolean = false
  private altScreen: boolean = false
  private syncdUpdates: boolean = false

  constructor(output: NodeJS.WriteStream = process.stdout) {
    this.output = output
    this.width = output.columns || 80
    this.height = output.rows || 24
    this.prevBuffer = new ScreenBuffer(this.width, this.height)
    this.currBuffer = new ScreenBuffer(this.width, this.height)
  }

  /**
   * Initialize the renderer.
   */
  init(altScreen: boolean): void {
    this.altScreen = altScreen

    if (altScreen) {
      this.write(`${CSI}?1049h`) // Enter alternate screen
    }

    this.write(`${CSI}?25l`) // Hide cursor
    this.write(`${CSI}2J`) // Clear screen
    this.write(`${CSI}H`) // Move to top-left
  }

  /**
   * Render a frame with cell-based diffing.
   */
  render(view: string): void {
    this.parseView(view)
    this.diffAndRender()
  }

  /**
   * Parse a view string into the current buffer.
   */
  private parseView(view: string): void {
    const lines = view.split("\n")

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.currBuffer.setCell(x, y, {
          Content: " ",
          Style: null,
          Link: { URL: "", Params: "" },
          Width: 1,
        })
      }
    }

    for (let y = 0; y < Math.min(lines.length, this.height); y++) {
      const line = lines[y]!
      let x = 0
      let currentStyle: Style | null = null

      for (let i = 0; i < line.length && x < this.width; i++) {
        const charCode = line.charCodeAt(i)
        const isSurrogate = charCode >= 0xD800 && charCode <= 0xDBFF
        const char = isSurrogate && i + 1 < line.length
          ? String.fromCodePoint((charCode << 10) + line.charCodeAt(i + 1) + 0x35FDC00)
          : line[i]!

        if (char === "\x1b") {
          let seq = "\x1b"
          i++
          while (i < line.length && line[i] !== "m") {
            seq += line[i]!
            i++
          }
          if (i < line.length) {
            seq += line[i]!
            i++
          }

          const style = parseSgrSequence(seq, currentStyle)
          currentStyle = style
          i--
          continue
        }

        this.currBuffer.setCell(x, y, {
          Content: char,
          Style: currentStyle,
          Link: { URL: "", Params: "" },
          Width: 1,
        })
        x++
        if (isSurrogate) i++
      }
    }
  }

  /**
   * Compare buffers and render changes. Uses incremental style diffing
   * matching Go's StyleDiff for minimal ANSI transitions.
   */
  private diffAndRender(): void {
    let buffer = ""
    let changes = 0

    for (let y = 0; y < this.height; y++) {
      let pen: Style | null = null

      for (let x = 0; x < this.width; x++) {
        const prev = this.prevBuffer.getCell(x, y)
        const curr = this.currBuffer.getCell(x, y)

        if (prev && curr && !cellEquals(prev, curr)) {
          if (!isZero(curr)) {
            buffer += `${CSI}${y + 1};${x + 1}H`

            const currStyle = curr.Style
            if (!isStyleEmpty(currStyle)) {
              if (!stylesEqual(pen, currStyle)) {
                buffer += styleDiff(pen, currStyle)
                pen = currStyle
              }
            } else if (!isStyleEmpty(pen)) {
              buffer += `${CSI}0m`
              pen = null
            }

            buffer += curr.Content
          }
          changes++
        }
      }

      // Reset pen at end of line if needed
      if (!isStyleEmpty(pen)) {
        // pen will be reset on next line's first cell or at end
      }
    }

    if (changes > 0) {
      if (this.syncdUpdates) {
        this.output.write(`${CSI}?2026h`)
      }
      this.output.write(buffer)
      if (this.syncdUpdates) {
        this.output.write(`${CSI}?2026l`)
      }
    }

    const temp = this.prevBuffer
    this.prevBuffer = this.currBuffer
    this.currBuffer = temp
  }

  /**
   * Clear the screen.
   */
  clear(): void {
    this.write(`${CSI}2J${CSI}H`)
    this.prevBuffer.clear()
    this.currBuffer.clear()
  }

  /**
   * Show cursor.
   */
  showCursor(): void {
    if (!this.cursorVisible) {
      this.write(`${CSI}?25h`)
      this.cursorVisible = true
    }
  }

  /**
   * Hide cursor.
   */
  hideCursor(): void {
    if (this.cursorVisible) {
      this.write(`${CSI}?25l`)
      this.cursorVisible = false
    }
  }

  /**
   * Move cursor to position.
   */
  moveTo(x: number, y: number): void {
    this.write(`${CSI}${y + 1};${x + 1}H`)
  }

  /**
   * Get terminal size.
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.output.columns || 80,
      height: this.output.rows || 24,
    }
  }

  /**
   * Resize renderer buffers to match current terminal size.
   */
  resize(): void {
    const { width, height } = this.getSize()
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.prevBuffer = new ScreenBuffer(this.width, this.height)
    this.currBuffer = new ScreenBuffer(this.width, this.height)
    this.write(`${CSI}2J${CSI}H`)
  }

  /**
   * Restore terminal state.
   */
  restore(): void {
    this.showCursor()

    if (this.altScreen) {
      this.write(`${CSI}?1049l`)
    }

    this.write(`${CSI}0m`)
  }

  enableSyncUpdates(): void {
    this.syncdUpdates = true
  }

  disableSyncUpdates(): void {
    this.syncdUpdates = false
  }

  /**
   * Flush the buffer.
   */
  flush(): void {
    // No-op - we write directly in diffAndRender
  }

  private write(data: string): void {
    this.output.write(data)
  }
}

const BRIGHT_COLORS = [
  "#555555", "#FF5555", "#55FF55", "#FFFF55",
  "#5555FF", "#FF55FF", "#55FFFF", "#FFFFFF",
]

const BRIGHT_FG_OFFSET = 90
const BRIGHT_BG_OFFSET = 100

function parseSgrSequence(seq: string, current: Style | null): Style | null {
  const match = seq.match(/^\x1b\[([0-9;]*)m$/)
  if (!match) return current

  const paramsStr = match[1]!
  if (paramsStr === "") return null

  const params = paramsStr.split(";").map(s => parseInt(s, 10) || 0)
  let style: Style = current ? { ...current } : {}

  for (let i = 0; i < params.length; i++) {
    const p = params[i]!
    switch (p) {
      case 0:
        style = {}
        break
      case 1:
        style.bold = true
        break
      case 2:
        style.dim = true
        break
      case 3:
        style.italic = true
        break
      case 4:
        style.underline = "single"
        break
      case 5:
      case 6:
        break
      case 7:
        style.reverse = true
        break
      case 8:
        break
      case 9:
        style.strikethrough = true
        break
      case 22:
        style.bold = false
        style.dim = false
        break
      case 23:
        style.italic = false
        break
      case 24:
        style.underline = "none"
        break
      case 25:
        break
      case 27:
        style.reverse = false
        break
      case 28:
        break
      case 29:
        style.strikethrough = false
        break
      case 30: case 31: case 32: case 33:
      case 34: case 35: case 36: case 37:
        style.foreground = BRIGHT_COLORS[p - 30]!
        style.fgCode = p
        break
      case 38: {
        if (params[i + 1] === 5 && i + 2 < params.length) {
          const idx = params[i + 2]!
          if (idx < 8) {
            style.foreground = BRIGHT_COLORS[idx]!
            style.fgCode = 30 + idx
          } else if (idx < 16) {
            style.foreground = BRIGHT_COLORS[idx - 8]!
            style.fgCode = 90 + (idx - 8)
          } else {
            style.foreground = `#${hexFrom256(idx)}`
          }
          i += 2
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2]!
          const g = params[i + 3]!
          const b = params[i + 4]!
          style.foreground = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          i += 4
        }
        break
      }
      case 39:
        style.foreground = undefined
        break
      case 40: case 41: case 42: case 43:
      case 44: case 45: case 46: case 47:
        style.background = BRIGHT_COLORS[p - 40]!
        style.bgCode = p
        break
      case 48: {
        if (params[i + 1] === 5 && i + 2 < params.length) {
          const idx = params[i + 2]!
          if (idx < 8) {
            style.background = BRIGHT_COLORS[idx]!
            style.bgCode = 40 + idx
          } else if (idx < 16) {
            style.background = BRIGHT_COLORS[idx - 8]!
            style.bgCode = 100 + (idx - 8)
          } else {
            style.background = `#${hexFrom256(idx)}`
          }
          i += 2
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2]!
          const g = params[i + 3]!
          const b = params[i + 4]!
          style.background = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          i += 4
        }
        break
      }
      case 49:
        style.background = undefined
        break
      case 90: case 91: case 92: case 93:
      case 94: case 95: case 96: case 97:
        style.foreground = BRIGHT_COLORS[p - 90 + 8]!
        style.fgCode = p
        break
      case 100: case 101: case 102: case 103:
      case 104: case 105: case 106: case 107:
        style.background = BRIGHT_COLORS[p - 100 + 8]!
        style.bgCode = p
        break
    }
  }

  const isEmpty = !style.bold && !style.italic && !style.underline &&
    !style.strikethrough && !style.dim && !style.reverse &&
    !style.foreground && !style.background &&
    style.fgCode == null && style.bgCode == null
  return isEmpty ? null : style
}

function hexFrom256(idx: number): string {
  if (idx < 16) {
    const table = [
      "000000", "800000", "008000", "808000",
      "000080", "800080", "008080", "c0c0c0",
      "808080", "ff0000", "00ff00", "ffff00",
      "0000ff", "ff00ff", "00ffff", "ffffff",
    ]
    return table[idx]!
  }
  if (idx < 232) {
    const i = idx - 16
    const r = Math.floor(i / 36)
    const g = Math.floor((i % 36) / 6)
    const b = i % 6
    const toHex = (v: number) => (v === 0 ? 0 : 55 + v * 40).toString(16).padStart(2, "0")
    return `${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  const gray = 8 + (idx - 232) * 10
  return gray.toString(16).padStart(2, "0") + gray.toString(16).padStart(2, "0") + gray.toString(16).padStart(2, "0")
}
