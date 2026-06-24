// buffer.ts | screen buffer (ultraviolet port)

import { type Cell, emptyCell, cellEquals } from "./cell"
import { type Style, styleToString, stripAnsi } from "./styled"

/**
 * ScreenBuffer is a cell-based screen buffer.
 */
export class ScreenBuffer {
  private cells: Cell[][]
  private width: number
  private height: number
  private touched: Set<string>

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.touched = new Set()
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
   * Set a cell at the given position.
   */
  setCell(x: number, y: number, cell: Cell): void {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      const prev = this.cells[y]![x]!
      if (!cellEquals(prev, cell)) {
        this.cells[y]![x] = cell
        this.touched.add(`${x},${y}`)
      }
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
    this.touched.clear()

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
  getTouched(): Set<string> {
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
}
