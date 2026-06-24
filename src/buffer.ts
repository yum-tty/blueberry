// buffer.ts | screen buffer (ultraviolet port)

import { type Cell, emptyCell, isZero, cellEquals } from "./cell"
import { type Style, styleToString, styleDiff, isStyleEmpty, stylesEqual, stripAnsi } from "./styled"

/**
 * ScreenBuffer is a cell-based screen buffer.
 */
export class ScreenBuffer {
  private cells: Cell[][]
  private width: number
  private height: number
  private touched: Map<number, { first: number; last: number }>

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.touched = new Map()
    this.cells = []
    for (let y = 0; y < height; y++) {
      const row: Cell[] = []
      for (let x = 0; x < width; x++) {
        row.push(emptyCell())
      }
      this.cells.push(row)
    }
  }

  /**
   * Get the width of the buffer.
   */
  getWidth(): number {
    return this.width
  }

  /**
   * Get the height of the buffer.
   */
  getHeight(): number {
    return this.height
  }

  /**
   * Get a cell at the given position.
   */
  getCell(x: number, y: number): Cell | null {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return null
    }
    return this.cells[y]![x]!
  }

  /**
   * Set a cell at the given position. Handles wide character placeholder logic
   * matching Go's Line.Set: clears parent wide cells when overwriting
   * placeholders, and fills placeholder slots when writing wide cells.
   */
  setCell(x: number, y: number, cell: Cell): void {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return

    const line = this.cells[y]!
    const prev = line[x]!

    if (prev.width > 1) {
      // Writing to the first cell of a wide character — fill all its
      // occupied positions with empty cells.
      for (let j = 0; j < prev.width && x + j < this.width; j++) {
        line[x + j] = emptyCell()
      }
    } else if (prev.width === 0 && !isZero(prev)) {
      // Writing to a wide-cell placeholder (width 0, not a zero cell) —
      // find the parent wide cell and clear it.
      for (let j = 1; x - j >= 0; j++) {
        const wide = line[x - j]!
        if (wide.width > 1 && j < wide.width) {
          for (let k = 0; k < wide.width; k++) {
            line[x - j + k] = emptyCell()
          }
          break
        }
      }
    }

    const lineWidth = this.width
    line[x] = cell
    const cw = cell.width

    if (x + cw > lineWidth) {
      // Cell overflows the line — fill remaining with empty cells.
      for (let i = 1; i < cw && x + i < lineWidth; i++) {
        line[x + i] = emptyCell()
      }
    } else if (cw > 1) {
      // Mark trailing positions as zero-width placeholders.
      for (let j = 1; j < cw && x + j < lineWidth; j++) {
        line[x + j] = { char: "", style: null, width: 0 }
      }
    }

    const existing = this.touched.get(y)
    if (existing) {
      existing.first = Math.min(existing.first, x)
      existing.last = Math.max(existing.last, x + Math.max(cw, 1))
    } else {
      this.touched.set(y, { first: x, last: x + Math.max(cw, 1) })
    }
  }

  /**
   * Clear the buffer.
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y]![x] = emptyCell()
      }
    }
    this.touched.clear()
  }

  /**
   * Resize the buffer.
   */
  resize(width: number, height: number): void {
    const oldCells = this.cells
    this.width = width
    this.height = height
    this.cells = []
    this.touched = new Map()

    for (let y = 0; y < height; y++) {
      const row: Cell[] = []
      for (let x = 0; x < width; x++) {
        if (y < oldCells.length && x < oldCells[y]!.length) {
          row.push(oldCells[y]![x]!)
        } else {
          row.push(emptyCell())
        }
      }
      this.cells.push(row)
    }
  }

  /**
   * Get the bounds of the buffer.
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return { x: 0, y: 0, width: this.width, height: this.height }
  }

  /**
   * Compare two buffers and return true if they are equal.
   */
  equals(other: ScreenBuffer): boolean {
    if (this.width !== other.width || this.height !== other.height) {
      return false
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!cellEquals(this.cells[y]![x]!, other.cells[y]![x]!)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Get the cells as a 2D array.
   */
  getCells(): Cell[][] {
    return this.cells
  }

  /**
   * Get the touched cells.
   */
  getTouched(): Map<number, { first: number; last: number }> {
    return this.touched
  }

  /**
   * Clear touched cells.
   */
  clearTouched(): void {
    this.touched.clear()
  }

  /**
   * Draw a styled string to the buffer.
   */
  drawString(
    str: string,
    x: number,
    y: number,
    style: Style | null = null,
  ): void {
    const lines = str.split("\n")

    for (let i = 0; i < lines.length; i++) {
      if (y + i >= this.height) break

      const line = lines[i]!
      let currentX = x

      for (let j = 0; j < line.length; j++) {
        if (currentX >= this.width) break

        const char = line[j]!
        this.setCell(currentX, y + i, {
          char,
          style,
          width: 1,
        })
        currentX++
      }
    }
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
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        this.setCell(x + col, y + row, {
          char,
          style,
          width: 1,
        })
      }
    }
  }

  insertLine(y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height) return
    const fillCell = cell ?? emptyCell()

    const limit = Math.min(y + n, this.height)
    for (let i = this.height - 1; i >= limit; i--) {
      for (let x = 0; x < this.width; x++) {
        this.cells[i]![x] = this.cells[i - n]![x]!
      }
    }

    for (let i = y; i < limit; i++) {
      for (let x = 0; x < this.width; x++) {
        this.setCell(x, i, { ...fillCell })
      }
    }
  }

  deleteLine(y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height) return
    const fillCell = cell ?? emptyCell()

    const limit = Math.min(y + n, this.height)
    for (let dst = y; dst < this.height - n; dst++) {
      const src = dst + n
      for (let x = 0; x < this.width; x++) {
        this.cells[dst]![x] = this.cells[src]![x]!
      }
    }

    for (let i = this.height - n; i < this.height; i++) {
      for (let x = 0; x < this.width; x++) {
        this.setCell(x, i, { ...fillCell })
      }
    }
  }

  insertCell(x: number, y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height || x < 0 || x >= this.width) return
    const fillCell = cell ?? emptyCell()

    for (let i = this.width - 1; i >= x + n && i - n >= 0; i--) {
      this.cells[y]![i] = this.cells[y]![i - n]!
    }

    for (let i = x; i < x + n && i < this.width; i++) {
      this.setCell(i, y, { ...fillCell })
    }
  }

  deleteCell(x: number, y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height || x < 0 || x >= this.width) return
    const fillCell = cell ?? emptyCell()

    const remaining = this.width - x
    if (n > remaining) n = remaining

    for (let i = x; i < this.width - n; i++) {
      const src = this.cells[y]![i + n]!
      this.setCell(i, y, src ? { ...src } : emptyCell())
    }

    for (let i = this.width - n; i < this.width; i++) {
      this.setCell(i, y, { ...fillCell })
    }
  }

  fillArea(x: number, y: number, width: number, height: number, cell?: Cell): void {
    const fillCell = cell ?? emptyCell()
    for (let row = y; row < y + height && row < this.height; row++) {
      for (let col = x; col < x + width && col < this.width; col++) {
        if (col >= 0 && row >= 0) {
          this.setCell(col, row, { ...fillCell })
        }
      }
    }
  }

  clearArea(x: number, y: number, width: number, height: number): void {
    this.fillArea(x, y, width, height, emptyCell())
  }

  cloneArea(x: number, y: number, width: number, height: number): ScreenBuffer {
    const clone = new ScreenBuffer(width, height)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const src = this.getCell(x + col, y + row)
        if (src && !isZero(src)) {
          clone.setCell(col, row, { ...src })
        }
      }
    }
    return clone
  }

  clone(): ScreenBuffer {
    return this.cloneArea(0, 0, this.width, this.height)
  }

  draw(drawable: { draw: (screen: ScreenBuffer, area: { x: number; y: number; width: number; height: number }) => void }, area?: { x: number; y: number; width: number; height: number }): void {
    const a = area ?? { x: 0, y: 0, width: this.width, height: this.height }
    drawable.draw(this, a)
  }

  render(): string {
    const parts: string[] = []
    for (let y = 0; y < this.height; y++) {
      const lineParts: string[] = []
      let pen: Style | null = null

      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y]![x]!
        if (isZero(cell)) {
          continue
        }
        if (cell.char === " " && isStyleEmpty(cell.style)) {
          if (!isStyleEmpty(pen)) {
            lineParts.push("\x1b[0m")
            pen = null
          }
          lineParts.push(" ")
          continue
        }

        const cellStyle = cell.style
        if (isStyleEmpty(cellStyle) && !isStyleEmpty(pen)) {
          lineParts.push("\x1b[0m")
          pen = null
        }
        if (!isStyleEmpty(cellStyle) && !stylesEqual(pen, cellStyle)) {
          lineParts.push(styleDiff(pen, cellStyle))
          pen = cellStyle
        }

        lineParts.push(cell.char)
      }

      if (!isStyleEmpty(pen)) {
        lineParts.push("\x1b[0m")
      }

      parts.push(lineParts.join(""))
    }

    return parts.join("\n")
  }

  getLine(y: number): Cell[] {
    if (y < 0 || y >= this.height) return []
    return [...this.cells[y]!]
  }
}
