// terminal_renderer.ts | terminal renderer (ultraviolet port)

import { ScreenBuffer } from "./buffer"
import { type Cell, cellEquals } from "./cell"
import { styleToString } from "./styled"

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
          char: " ",
          style: null,
          width: 1,
        })
      }
    }

    for (let y = 0; y < Math.min(lines.length, this.height); y++) {
      const line = lines[y]!
      let x = 0
      let currentStyle: any = null

      for (let i = 0; i < line.length && x < this.width; i++) {
        const char = line[i]!

        // Handle ANSI escape sequences
        if (char === "\x1b") {
          let seq = ""
          while (i < line.length && line[i] !== "m") {
            seq += line[i]!
            i++
          }
          if (i < line.length) {
            seq += line[i]!
            i++
          }

          // Parse style
          const styleStr = seq
          if (styleStr.includes("1")) currentStyle = { bold: true }
          else if (styleStr.includes("0")) currentStyle = null

          continue
        }

        this.currBuffer.setCell(x, y, {
          char,
          style: currentStyle,
          width: 1,
        })
        x++
      }
    }
  }

  /**
   * Compare buffers and render changes.
   */
  private diffAndRender(): void {
    let buffer = ""
    let changes = 0

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const prev = this.prevBuffer.getCell(x, y)
        const curr = this.currBuffer.getCell(x, y)

        if (prev && curr && !cellEquals(prev, curr)) {
          buffer += `${CSI}${y + 1};${x + 1}H`

          // Apply style
          if (curr.style) {
            buffer += styleToString(curr.style)
          }

          buffer += curr.char

          // Reset style if needed
          if (curr.style) {
            buffer += `${CSI}0m`
          }

          changes++
        }
      }
    }

    if (changes > 0) {
      this.output.write(buffer)
    }

    // Swap buffers
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
   * Restore terminal state.
   */
  restore(): void {
    this.showCursor()

    if (this.altScreen) {
      this.write(`${CSI}?1049l`) // Leave alternate screen
    }

    this.write(`${CSI}0m`) // Reset styles
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
