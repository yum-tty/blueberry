// buffer.ts | screen buffer (ultraviolet port)

import { type Cell, EmptyCell, emptyCell, isZero, cellEquals, cellClone, cellString } from "./cell"
import { type Style, styleDiff, isStyleEmpty, stylesEqual } from "./styled"

const RESET_STYLE = "\x1b[0m"
const RESET_HYPERLINK = "\x1b]8;;\x07"

// ── Line type ──

/**
 * Line represents cells in a line.
 * Go: type Line []Cell
 */
export type Line = Cell[]

/**
 * NewLine creates a new line with the given width, filled with empty cells.
 * Go: NewLine(width int) Line
 */
export function NewLine(width: number): Line {
  const line: Line = []
  for (let i = 0; i < width; i++) {
    line.push(cellClone(EmptyCell))
  }
  return line
}

/**
 * LineSet sets the cell at the given x position.
 * Go: Line.Set(x int, c *Cell)
 */
export function LineSet(line: Line, x: number, c: Cell | null): void {
  const lineWidth = line.length
  if (x < 0 || x >= lineWidth) return

  const prev = line[x]!
  if (prev.Width > 1) {
    for (let j = 0; j < prev.Width && x + j < lineWidth; j++) {
      line[x + j] = cellClone(EmptyCell)
    }
  } else if (prev.Width === 0 && !isZero(prev)) {
    for (let j = 1; x - j >= 0; j++) {
      const wide = line[x - j]!
      if (wide.Width > 1 && j < wide.Width) {
        for (let k = 0; k < wide.Width; k++) {
          line[x - j + k] = cellClone(EmptyCell)
        }
        break
      }
    }
  }

  if (c === null) {
    line[x] = cellClone(EmptyCell)
    return
  }

  line[x] = cellClone(c)
  const cw = c.Width
  if (x + cw > lineWidth) {
    for (let i = 1; i < cw && x + i < lineWidth; i++) {
      line[x + i] = cellClone(EmptyCell)
    }
    return
  }

  if (cw > 1) {
    for (let j = 1; j < cw && x + j < lineWidth; j++) {
      line[x + j] = { Content: "", Style: null, Link: { URL: "", Params: "" }, Width: 0 }
    }
  }
}

/**
 * LineAt returns the cell at the given x position.
 * Go: Line.At(x int) *Cell
 */
export function LineAt(line: Line, x: number): Cell | null {
  if (x < 0 || x >= line.length) return null
  return line[x]!
}

/**
 * LineString returns the string representation of the line.
 * Go: Line.String() string
 */
export function LineString(line: Line): string {
  let buf = ""
  let pending = ""
  for (const c of line) {
    if (isZero(c)) continue
    if (cellEquals(c, EmptyCell)) {
      pending += " "
      continue
    }
    if (pending.length > 0) {
      buf += pending
      pending = ""
    }
    buf += cellString(c)
  }
  return buf
}

/**
 * LineRender renders the line to a string with all the required attributes and
 * styles.
 * Go: Line.Render() string
 */
export function LineRender(line: Line): string {
  let buf = ""
  let pen: Style | null = null
  let link = { URL: "", Params: "" }
  let pending = ""

  for (const c of line) {
    if (isZero(c)) continue
    if (cellEquals(c, EmptyCell)) {
      if (!isStyleEmpty(pen)) {
        buf += RESET_STYLE
        pen = null
      }
      if (!linkIsZero(link)) {
        buf += RESET_HYPERLINK
        link = { URL: "", Params: "" }
      }
      pending += " "
      continue
    }

    if (pending.length > 0) {
      buf += pending
      pending = ""
    }

    if (isStyleEmpty(c.Style) && !isStyleEmpty(pen)) {
      buf += RESET_STYLE
      pen = null
    }
    if (!stylesEqual(pen, c.Style)) {
      buf += styleDiff(pen, c.Style)
      pen = c.Style
    }

    if (!linkEqual(c.Link, link) && link.URL !== "") {
      buf += RESET_HYPERLINK
      link = { URL: "", Params: "" }
    }
    if (!linkEqual(c.Link, link)) {
      buf += `\x1b]8;${c.Link.Params};${c.Link.URL}\x07`
      link = c.Link
    }

    buf += cellString(c)
  }

  if (link.URL !== "") {
    buf += RESET_HYPERLINK
  }
  if (!isStyleEmpty(pen)) {
    buf += RESET_STYLE
  }

  return buf
}

// ── Lines type ──

/**
 * Lines represents a slice of lines.
 * Go: type Lines []Line
 */
export type Lines = Line[]

/**
 * LinesHeight returns the height of the lines.
 * Go: Lines.Height() int
 */
export function LinesHeight(ls: Lines): number {
  return ls.length
}

/**
 * LinesWidth returns the width of the widest line.
 * Go: Lines.Width() int
 */
export function LinesWidth(ls: Lines): number {
  let maxWidth = 0
  for (const l of ls) {
    maxWidth = Math.max(maxWidth, l.length)
  }
  return maxWidth
}

/**
 * LinesString returns the string representation of the lines.
 * Go: Lines.String() string
 */
export function LinesString(ls: Lines): string {
  let buf = ""
  for (let i = 0; i < ls.length; i++) {
    buf += LineString(ls[i]!)
    if (i < ls.length - 1) buf += "\n"
  }
  return buf
}

/**
 * LinesRender renders the lines to a styled string.
 * Go: Lines.Render() string
 */
export function LinesRender(ls: Lines): string {
  let buf = ""
  for (let i = 0; i < ls.length; i++) {
    buf += LineRender(ls[i]!)
    if (i < ls.length - 1) buf += "\n"
  }
  return buf
}

// ── LineData ──

/**
 * LineData represents the metadata for a line.
 * Go: type LineData struct { FirstCell, LastCell int }
 */
export interface LineData {
  FirstCell: number
  LastCell: number
}

// ── Rectangle ──

export interface Rectangle {
  MinX: number
  MinY: number
  MaxX: number
  MaxY: number
}

export function Rect(x: number, y: number, w: number, h: number): Rectangle {
  return { MinX: x, MinY: y, MaxX: x + w, MaxY: y + h }
}

export function rectEmpty(r: Rectangle): boolean {
  return r.MinX >= r.MaxX || r.MinY >= r.MaxY
}

export function rectIn(r: Rectangle, area: Rectangle): boolean {
  return r.MinX >= area.MinX && r.MinY >= area.MinY && r.MaxX <= area.MaxX && r.MaxY <= area.MaxY
}

export function rectOverlaps(a: Rectangle, b: Rectangle): boolean {
  return a.MinX < b.MaxX && a.MaxX > b.MinX && a.MinY < b.MaxY && a.MaxY > b.MinY
}

export function rectDx(r: Rectangle): number { return r.MaxX - r.MinX }
export function rectDy(r: Rectangle): number { return r.MaxY - r.MinY }

// ── TrimSpace ──

/**
 * TrimSpace trims trailing spaces from the end of each line in the given string.
 * Go: TrimSpace(s string) string
 */
export function TrimSpace(s: string): string {
  const lines = s.split("\n")
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!
    const hasCR = line.endsWith("\r")
    if (hasCR) line = line.slice(0, -1)
    line = line.replace(/ +$/, "")
    if (hasCR) line += "\r"
    lines[i] = line
  }
  return lines.join("\n")
}

// ── Buffer ──

/**
 * Buffer represents a cell buffer that contains the contents of a screen.
 * Go: type Buffer struct { Lines []Line }
 */
export class Buffer {
  Lines: Line[]

  constructor(width: number = 0, height: number = 0) {
    this.Lines = []
    for (let i = 0; i < height; i++) {
      this.Lines.push(NewLine(width))
    }
  }

  String(): string { return LinesString(this.Lines) }
  Render(): string { return LinesRender(this.Lines) }

  GetLine(y: number): Line | null {
    if (y < 0 || y >= this.Lines.length) return null
    return this.Lines[y]!
  }

  CellAt(x: number, y: number): Cell | null {
    if (y < 0 || y >= this.Lines.length) return null
    return LineAt(this.Lines[y]!, x)
  }

  SetCell(x: number, y: number, c: Cell | null): void {
    if (y < 0 || y >= this.Lines.length) return
    LineSet(this.Lines[y]!, x, c)
  }

  Height(): number { return this.Lines.length }
  Width(): number { return this.Lines.length === 0 ? 0 : this.Lines[0]!.length }

  Bounds(): Rectangle { return Rect(0, 0, this.Width(), this.Height()) }

  Resize(width: number, height: number): void {
    const curWidth = this.Width()
    const curHeight = this.Height()
    if (curWidth === width && curHeight === height) return

    if (width > curWidth) {
      const ext = NewLine(width - curWidth)
      for (let i = 0; i < this.Lines.length; i++) {
        this.Lines[i]!.push(...ext.map(c => cellClone(c)))
      }
    } else if (width < curWidth) {
      for (let i = 0; i < this.Lines.length; i++) {
        this.Lines[i] = this.Lines[i]!.slice(0, width)
      }
    }

    if (height > this.Lines.length) {
      for (let i = this.Lines.length; i < height; i++) {
        this.Lines.push(NewLine(width))
      }
    } else if (height < this.Lines.length) {
      this.Lines = this.Lines.slice(0, height)
    }
  }

  Fill(c: Cell | null): void { this.FillArea(c, this.Bounds()) }

  FillArea(c: Cell | null, area: Rectangle): void {
    const cellWidth = c && c.Width > 1 ? c.Width : 1
    for (let y = area.MinY; y < area.MaxY; y++) {
      for (let x = area.MinX; x < area.MaxX; x += cellWidth) {
        this.SetCell(x, y, c)
      }
    }
  }

  Clear(): void {
    const area = this.Bounds()
    for (let y = area.MinY; y < area.MaxY; y++) {
      for (let x = area.MinX; x < area.MaxX; x++) {
        this.Lines[y]![x] = cellClone(EmptyCell)
      }
    }
  }

  ClearArea(area: Rectangle): void { this.FillArea(null, area) }

  CloneArea(area: Rectangle): Buffer | null {
    const bounds = this.Bounds()
    if (!rectIn(area, bounds)) return null
    const n = new Buffer(rectDx(area), rectDy(area))
    for (let y = area.MinY; y < area.MaxY; y++) {
      for (let x = area.MinX; x < area.MaxX;) {
        const c = this.CellAt(x, y)
        if (!c || isZero(c)) { x++; continue }
        n.SetCell(x - area.MinX, y - area.MinY, c)
        x += Math.max(c.Width, 1)
      }
    }
    return n
  }

  Clone(): Buffer { return this.CloneArea(this.Bounds())! }

  InsertLine(y: number, n: number, c: Cell | null): void {
    this.InsertLineArea(y, n, c, this.Bounds())
  }

  InsertLineArea(y: number, n: number, c: Cell | null, area: Rectangle): void {
    if (n <= 0 || y < area.MinY || y >= area.MaxY || y >= this.Height()) return
    if (y + n > area.MaxY) n = area.MaxY - y

    for (let i = area.MaxY - 1; i >= y + n; i--) {
      for (let x = area.MinX; x < area.MaxX; x++) {
        this.Lines[i]![x] = this.Lines[i - n]![x]!
      }
    }

    for (let i = y; i < y + n; i++) {
      for (let x = area.MinX; x < area.MaxX; x++) {
        this.SetCell(x, i, c)
      }
    }
  }

  DeleteLine(y: number, n: number, c: Cell | null): void {
    this.DeleteLineArea(y, n, c, this.Bounds())
  }

  DeleteLineArea(y: number, n: number, c: Cell | null, area: Rectangle): void {
    if (n <= 0 || y < area.MinY || y >= area.MaxY || y >= this.Height()) return
    if (n > area.MaxY - y) n = area.MaxY - y

    for (let dst = y; dst < area.MaxY - n; dst++) {
      const src = dst + n
      for (let x = area.MinX; x < area.MaxX; x++) {
        this.Lines[dst]![x] = this.Lines[src]![x]!
      }
    }

    for (let i = area.MaxY - n; i < area.MaxY; i++) {
      for (let x = area.MinX; x < area.MaxX; x++) {
        this.SetCell(x, i, c)
      }
    }
  }

  InsertCell(x: number, y: number, n: number, c: Cell | null): void {
    this.InsertCellArea(x, y, n, c, this.Bounds())
  }

  InsertCellArea(x: number, y: number, n: number, c: Cell | null, area: Rectangle): void {
    if (n <= 0 || y < area.MinY || y >= area.MaxY || y >= this.Height() ||
        x < area.MinX || x >= area.MaxX || x >= this.Width()) return
    if (x + n > area.MaxX) n = area.MaxX - x

    for (let i = area.MaxX - 1; i >= x + n && i - n >= area.MinX; i--) {
      this.Lines[y]![i] = this.Lines[y]![i - n]!
    }

    for (let i = x; i < x + n && i < area.MaxX; i++) {
      this.SetCell(i, y, c)
    }
  }

  DeleteCell(x: number, y: number, n: number, c: Cell | null): void {
    this.DeleteCellArea(x, y, n, c, this.Bounds())
  }

  DeleteCellArea(x: number, y: number, n: number, c: Cell | null, area: Rectangle): void {
    if (n <= 0 || y < area.MinY || y >= area.MaxY || y >= this.Height() ||
        x < area.MinX || x >= area.MaxX || x >= this.Width()) return

    let remaining = area.MaxX - x
    if (n > remaining) n = remaining

    for (let i = x; i < area.MaxX - n; i++) {
      const src = this.CellAt(i + n, y)
      this.SetCell(i, y, src)
    }

    for (let i = area.MaxX - n; i < area.MaxX; i++) {
      this.SetCell(i, y, c)
    }
  }
}

// ── RenderBuffer ──

/**
 * RenderBuffer represents a buffer that tracks current/new state for efficient rendering.
 * Go: type RenderBuffer struct { *Buffer; Touched []*LineData }
 */
export class RenderBuffer {
  Buffer: Buffer
  Touched: (LineData | null)[]

  constructor(width: number, height: number) {
    this.Buffer = new Buffer(width, height)
    this.Touched = new Array(height).fill(null)
  }

  Width(): number { return this.Buffer.Width() }
  Height(): number { return this.Buffer.Height() }
  Bounds(): Rectangle { return this.Buffer.Bounds() }
  CellAt(x: number, y: number): Cell | null { return this.Buffer.CellAt(x, y) }
  GetLine(y: number): Line | null { return this.Buffer.GetLine(y) }

  SetCell(x: number, y: number, c: Cell | null): void {
    const p = this.Buffer.CellAt(x, y)
    if (!cellEquals(p, c)) {
      let width = 1
      if (c && c.Width > 0) width = c.Width
      if (p && p.Width > 0) width = Math.max(width, p.Width)
      this.TouchLine(x, y, width)
    }
    this.Buffer.SetCell(x, y, c)
  }

  TouchLine(x: number, y: number, n: number): void {
    if (y < 0 || y >= this.Buffer.Height()) return
    if (y >= this.Touched.length) {
      this.Touched.length = y + 1
    }

    const ch = this.Touched[y]
    if (ch === null) {
      this.Touched[y] = { FirstCell: x, LastCell: x + n }
    } else {
      ch.FirstCell = Math.min(ch.FirstCell, x)
      ch.LastCell = Math.max(ch.LastCell, x + n)
    }
  }

  Touch(x: number, y: number): void {
    this.TouchLine(x, y, 0)
  }

  TouchedLines(): number {
    let count = 0
    for (const t of this.Touched) {
      if (t !== null) count++
    }
    return count
  }

  Clear(): void {
    this.Buffer.Clear()
    const w = this.Width()
    for (let y = 0; y < this.Height(); y++) {
      this.TouchLine(0, y, w)
    }
  }

  ClearArea(area: Rectangle): void {
    this.Buffer.ClearArea(area)
    const w = area.MaxX - area.MinX
    for (let y = area.MinY; y < area.MaxY; y++) {
      this.TouchLine(area.MinX, y, w)
    }
  }

  Fill(c: Cell | null): void {
    this.Buffer.Fill(c)
    const w = this.Width()
    for (let y = 0; y < this.Height(); y++) {
      this.TouchLine(0, y, w)
    }
  }

  FillArea(c: Cell | null, area: Rectangle): void {
    this.Buffer.FillArea(c, area)
    const w = area.MaxX - area.MinX
    for (let y = area.MinY; y < area.MaxY; y++) {
      this.TouchLine(area.MinX, y, w)
    }
  }

  InsertLine(y: number, n: number, c: Cell | null): void {
    this.InsertLineArea(y, n, c, this.Bounds())
  }

  InsertLineArea(y: number, n: number, c: Cell | null, area: Rectangle): void {
    this.Buffer.InsertLineArea(y, n, c, area)
    for (let i = area.MinY; i < area.MaxY; i++) {
      this.TouchLine(area.MinX, i, area.MaxX - area.MinX)
      this.TouchLine(area.MinX, i - n, area.MaxX - area.MinX)
    }
  }

  DeleteLine(y: number, n: number, c: Cell | null): void {
    this.DeleteLineArea(y, n, c, this.Bounds())
  }

  DeleteLineArea(y: number, n: number, c: Cell | null, area: Rectangle): void {
    this.Buffer.DeleteLineArea(y, n, c, area)
    for (let i = area.MinY; i < area.MaxY; i++) {
      this.TouchLine(area.MinX, i, area.MaxX - area.MinX)
      this.TouchLine(area.MinX, i + n, area.MaxX - area.MinX)
    }
  }

  InsertCell(x: number, y: number, n: number, c: Cell | null): void {
    this.InsertCellArea(x, y, n, c, this.Bounds())
  }

  InsertCellArea(x: number, y: number, n: number, c: Cell | null, area: Rectangle): void {
    this.Buffer.InsertCellArea(x, y, n, c, area)
    if (x + n > area.MaxX) n = area.MaxX - x
    this.TouchLine(x, y, n)
  }

  DeleteCell(x: number, y: number, n: number, c: Cell | null): void {
    this.DeleteCellArea(x, y, n, c, this.Bounds())
  }

  DeleteCellArea(x: number, y: number, n: number, c: Cell | null, area: Rectangle): void {
    this.Buffer.DeleteCellArea(x, y, n, c, area)
    let remaining = area.MaxX - x
    if (n > remaining) n = remaining
    this.TouchLine(x, y, n)
  }

  Resize(width: number, height: number): void {
    this.Buffer.Resize(width, height)
    this.Touched.length = height
  }

  Clone(): RenderBuffer {
    const rb = new RenderBuffer(this.Width(), this.Height())
    for (let y = 0; y < this.Height(); y++) {
      for (let x = 0; x < this.Width(); x++) {
        const c = this.Buffer.CellAt(x, y)
        if (c) rb.Buffer.SetCell(x, y, c)
      }
      const td = this.Touched[y]
      if (td) rb.Touched[y] = { ...td }
    }
    return rb
  }
}

// ── ScreenBuffer (legacy API wrapper) ──

/**
 * ScreenBuffer is a cell-based screen buffer. Wraps RenderBuffer for backward compatibility.
 */
export class ScreenBuffer {
  private touched: Map<number, { first: number; last: number }>
  private width: number
  private height: number
  private cells: Cell[][]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.touched = new Map()
    this.cells = []
    for (let y = 0; y < height; y++) {
      const row: Cell[] = []
      for (let x = 0; x < width; x++) {
        row.push(cellClone(EmptyCell))
      }
      this.cells.push(row)
    }
  }

  getWidth(): number { return this.width }
  getHeight(): number { return this.height }

  getCell(x: number, y: number): Cell | null {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return null
    return this.cells[y]![x]!
  }

  setCell(x: number, y: number, cell: Cell): void {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return
    const line = this.cells[y]!
    const prev = line[x]!

    if (prev.Width > 1) {
      for (let j = 0; j < prev.Width && x + j < this.width; j++) {
        line[x + j] = cellClone(EmptyCell)
      }
    } else if (prev.Width === 0 && !isZero(prev)) {
      for (let j = 1; x - j >= 0; j++) {
        const wide = line[x - j]!
        if (wide.Width > 1 && j < wide.Width) {
          for (let k = 0; k < wide.Width; k++) {
            line[x - j + k] = cellClone(EmptyCell)
          }
          break
        }
      }
    }

    line[x] = cell
    const cw = cell.Width
    if (x + cw > this.width) {
      for (let i = 1; i < cw && x + i < this.width; i++) {
        line[x + i] = cellClone(EmptyCell)
      }
    } else if (cw > 1) {
      for (let j = 1; j < cw && x + j < this.width; j++) {
        line[x + j] = { Content: "", Style: null, Link: { URL: "", Params: "" }, Width: 0 }
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

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y]![x] = cellClone(EmptyCell)
      }
    }
    this.touched.clear()
  }

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
          row.push(cellClone(EmptyCell))
        }
      }
      this.cells.push(row)
    }
  }

  getBounds(): Rectangle { return { MinX: 0, MinY: 0, MaxX: this.width, MaxY: this.height } }

  equals(other: ScreenBuffer): boolean {
    if (this.width !== other.width || this.height !== other.height) return false
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!cellEquals(this.cells[y]![x]!, other.cells[y]![x]!)) return false
      }
    }
    return true
  }

  getCells(): Cell[][] { return this.cells }
  getTouched(): Map<number, { first: number; last: number }> { return this.touched }
  clearTouched(): void { this.touched.clear() }

  drawString(str: string, x: number, y: number, style: Style | null = null): void {
    const lines = str.split("\n")
    for (let i = 0; i < lines.length; i++) {
      if (y + i >= this.height) break
      const line = lines[i]!
      let currentX = x
      for (let j = 0; j < line.length; j++) {
        if (currentX >= this.width) break
        this.setCell(currentX, y + i, {
          Content: line[j]!,
          Style: style,
          Link: { URL: "", Params: "" },
          Width: 1,
        })
        currentX++
      }
    }
  }

  fill(x: number, y: number, width: number, height: number, char: string = " ", style: Style | null = null): void {
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        this.setCell(x + col, y + row, {
          Content: char,
          Style: style,
          Link: { URL: "", Params: "" },
          Width: 1,
        })
      }
    }
  }

  insertLine(y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height) return
    const fillCell = cell ?? cellClone(EmptyCell)
    const limit = Math.min(y + n, this.height)
    for (let i = this.height - 1; i >= limit; i--) {
      for (let x = 0; x < this.width; x++) {
        this.cells[i]![x] = this.cells[i - n]![x]!
      }
    }
    for (let i = y; i < limit; i++) {
      for (let x = 0; x < this.width; x++) {
        this.setCell(x, i, cellClone(fillCell))
      }
    }
  }

  deleteLine(y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height) return
    const fillCell = cell ?? cellClone(EmptyCell)
    for (let dst = y; dst < this.height - n; dst++) {
      const src = dst + n
      for (let x = 0; x < this.width; x++) {
        this.cells[dst]![x] = this.cells[src]![x]!
      }
    }
    for (let i = this.height - n; i < this.height; i++) {
      for (let x = 0; x < this.width; x++) {
        this.setCell(x, i, cellClone(fillCell))
      }
    }
  }

  insertCell(x: number, y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height || x < 0 || x >= this.width) return
    const fillCell = cell ?? cellClone(EmptyCell)
    for (let i = this.width - 1; i >= x + n && i - n >= 0; i--) {
      this.cells[y]![i] = this.cells[y]![i - n]!
    }
    for (let i = x; i < x + n && i < this.width; i++) {
      this.setCell(i, y, cellClone(fillCell))
    }
  }

  deleteCell(x: number, y: number, n: number, cell?: Cell): void {
    if (n <= 0 || y < 0 || y >= this.height || x < 0 || x >= this.width) return
    const fillCell = cell ?? cellClone(EmptyCell)
    let remaining = this.width - x
    if (n > remaining) n = remaining
    for (let i = x; i < this.width - n; i++) {
      const src = this.cells[y]![i + n]!
      this.setCell(i, y, src ? cellClone(src) : cellClone(EmptyCell))
    }
    for (let i = this.width - n; i < this.width; i++) {
      this.setCell(i, y, cellClone(fillCell))
    }
  }

  fillArea(x: number, y: number, width: number, height: number, cell?: Cell): void {
    const fillCell = cell ?? cellClone(EmptyCell)
    for (let row = y; row < y + height && row < this.height; row++) {
      for (let col = x; col < x + width && col < this.width; col++) {
        if (col >= 0 && row >= 0) this.setCell(col, row, cellClone(fillCell))
      }
    }
  }

  clearArea(x: number, y: number, width: number, height: number): void {
    this.fillArea(x, y, width, height, cellClone(EmptyCell))
  }

  cloneArea(x: number, y: number, width: number, height: number): ScreenBuffer {
    const clone = new ScreenBuffer(width, height)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const src = this.getCell(x + col, y + row)
        if (src && !isZero(src)) clone.setCell(col, row, cellClone(src))
      }
    }
    return clone
  }

  clone(): ScreenBuffer { return this.cloneArea(0, 0, this.width, this.height) }

  draw(drawable: { draw: (screen: ScreenBuffer, area: Rectangle) => void }, area?: Rectangle): void {
    const a = area ?? { MinX: 0, MinY: 0, MaxX: this.width, MaxY: this.height }
    drawable.draw(this, a)
  }

  render(): string {
    const parts: string[] = []
    for (let y = 0; y < this.height; y++) {
      const lineParts: string[] = []
      let pen: Style | null = null

      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y]![x]!
        if (isZero(cell)) continue
        if (cell.Content === " " && isStyleEmpty(cell.Style) && linkIsZero(cell.Link)) {
          if (!isStyleEmpty(pen)) { lineParts.push(RESET_STYLE); pen = null }
          lineParts.push(" ")
          continue
        }

        if (isStyleEmpty(cell.Style) && !isStyleEmpty(pen)) {
          lineParts.push(RESET_STYLE)
          pen = null
        }
        if (!isStyleEmpty(cell.Style) && !stylesEqual(pen, cell.Style)) {
          lineParts.push(styleDiff(pen, cell.Style))
          pen = cell.Style
        }

        lineParts.push(cell.Content)
      }

      if (!isStyleEmpty(pen)) lineParts.push(RESET_STYLE)
      parts.push(lineParts.join(""))
    }
    return parts.join("\n")
  }

  getLine(y: number): Cell[] {
    if (y < 0 || y >= this.height) return []
    return [...this.cells[y]!]
  }
}

function linkIsZero(link: { URL: string; Params: string }): boolean {
  return link.URL === "" && link.Params === ""
}

function linkEqual(a: { URL: string; Params: string }, b: { URL: string; Params: string }): boolean {
  return a.URL === b.URL && a.Params === b.Params
}
