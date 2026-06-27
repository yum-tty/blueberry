import { ScreenBuffer } from "./buffer"
import { type Cell, emptyCell, type WidthMethod } from "./cell"
import { getStringWidth } from "./styled"
import { type Rectangle, Rect, RectangleDx, RectangleDy } from "./compat"

export class Window {
  buffer: ScreenBuffer
  method: WidthMethod
  parent: Window | null
  bounds: Rectangle

  constructor(width: number, height: number, method: WidthMethod | null = null) {
    this.buffer = new ScreenBuffer(width, height)
    this.method = method ?? getStringWidth
    this.parent = null
    this.bounds = Rect(0, 0, width, height)
  }

  hasParent(): boolean {
    return this.parent !== null
  }

  getParent(): Window | null {
    return this.parent
  }

  moveTo(x: number, y: number): void {
    const w = RectangleDx(this.bounds)
    const h = RectangleDy(this.bounds)
    this.bounds = Rect(x, y, w, h)
  }

  moveBy(dx: number, dy: number): void {
    this.bounds = Rect(
      this.bounds.minX + dx,
      this.bounds.minY + dy,
      RectangleDx(this.bounds),
      RectangleDy(this.bounds),
    )
  }

  clone(): Window {
    return this.cloneArea(Rect(0, 0, this.buffer.getWidth(), this.buffer.getHeight()))
  }

  cloneArea(area: Rectangle): Window {
    const clone = new Window(0, 0, this.method)
    clone.buffer = this.buffer.cloneArea(area.minX, area.minY, RectangleDx(area), RectangleDy(area))
    clone.parent = this.parent
    clone.method = this.method
    clone.bounds = area
    return clone
  }

  resize(width: number, height: number): void {
    if (!this.parent || this.buffer !== this.parent.buffer) {
      this.buffer.resize(width, height)
    }
    this.bounds = Rect(this.bounds.minX, this.bounds.minY, width, height)
  }

  getWidthMethod(): WidthMethod {
    return this.method
  }

  setWidthMethod(method: WidthMethod): void {
    this.method = method
  }

  getBounds(): Rectangle {
    return { ...this.bounds }
  }

  newWindow(x: number, y: number, width: number, height: number): Window {
    return newWindow(this, x, y, width, height, this.method, false)
  }

  newView(x: number, y: number, width: number, height: number): Window {
    return newWindow(this, x, y, width, height, this.method, true)
  }

  cellAt(x: number, y: number): Cell | null {
    return this.buffer.getCell(x, y)
  }

  setCell(x: number, y: number, cell: Cell | null): void {
    if (cell === null) cell = emptyCell()
    this.buffer.setCell(x, y, cell)
  }

  width(): number {
    return this.buffer.getWidth()
  }

  height(): number {
    return this.buffer.getHeight()
  }

  clear(): void {
    this.buffer.clear()
  }
}

function newWindow(
  parent: Window | null,
  x: number,
  y: number,
  width: number,
  height: number,
  method: WidthMethod,
  view: boolean,
): Window {
  const w = new Window(0, 0, method)
  if (view && parent) {
    w.buffer = parent.buffer
  } else {
    w.buffer = new ScreenBuffer(width, height)
  }
  w.parent = parent
  w.method = method
  w.bounds = Rect(x, y, width, height)
  return w
}
