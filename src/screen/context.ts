// context.ts | screen context (ultraviolet port)

import { type Style, styleToString } from "../styled"
import { ScreenBuffer } from "../buffer"

/**
 * Context provides drawing helpers for a screen.
 */
export class Context {
  private buffer: ScreenBuffer
  private x: number = 0
  private y: number = 0
  private style: Style | null = null

  constructor(buffer: ScreenBuffer) {
    this.buffer = buffer
  }

  /**
   * Set the current position.
   */
  moveTo(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  /**
   * Set the current style.
   */
  setStyle(style: Style | null): void {
    this.style = style
  }

  /**
   * Draw a string at the current position.
   */
  drawString(str: string): void {
    const lines = str.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      for (let j = 0; j < line.length; j++) {
        this.buffer.setCell(this.x + j, this.y + i, {
          Content: line[j]!,
          Style: this.style,
          Link: { URL: "", Params: "" },
          Width: 1,
        })
      }
      this.y++
    }
  }

  /**
   * Draw a styled string at the current position.
   */
  drawStyledString(str: string, style: Style): void {
    const savedStyle = this.style
    this.style = style
    this.drawString(str)
    this.style = savedStyle
  }

  /**
   * Clear the screen.
   */
  clear(): void {
    this.buffer.clear()
  }

  /**
   * Fill a rectangular region.
   */
  fill(
    x: number,
    y: number,
    width: number,
    height: number,
    char: string = " ",
    style: Style | null = null,
  ): void {
    this.buffer.fill(x, y, width, height, char, style)
  }
}
