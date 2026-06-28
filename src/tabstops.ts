export const DefaultTabInterval = 8

export class TabStops {
  private stops: number[]
  private interval: number
  private width: number

  constructor(width: number, interval: number = DefaultTabInterval) {
    this.interval = interval
    this.width = width
    this.stops = new Array(Math.ceil(width / interval)).fill(0)
    this.init(0, width)
  }

  resize(width: number): void {
    if (width === this.width) return
    if (width < this.width) {
      const size = Math.ceil(width / this.interval)
      this.stops = this.stops.slice(0, size)
    } else {
      const size = Math.ceil((width - this.width) / this.interval)
      this.stops.push(...new Array(size).fill(0))
    }
    this.init(this.width, width)
    this.width = width
  }

  getWidth(): number {
    return this.width
  }

  isStop(col: number): boolean {
    const mask = this.mask(col)
    const i = col >> 3
    if (i < 0 || i >= this.stops.length) return false
    return (this.stops[i]! & mask) !== 0
  }

  next(col: number): number {
    return this.find(col, 1)
  }

  prev(col: number): number {
    return this.find(col, -1)
  }

  find(col: number, delta: number): number {
    if (delta === 0) return col
    let count = Math.abs(delta)
    const prev = delta < 0
    while (count > 0) {
      if (!prev) {
        if (col >= this.width - 1) return col
        col++
      } else {
        if (col < 1) return col
        col--
      }
      if (this.isStop(col)) count--
    }
    return col
  }

  set(col: number): void {
    if (col < 0 || col >= this.width) return
    const mask = this.mask(col)
    this.stops[col >> 3]! |= mask
  }

  reset(col: number): void {
    if (col < 0 || col >= this.width) return
    const mask = this.mask(col)
    this.stops[col >> 3]! &= ~mask
  }

  clear(): void {
    this.stops = new Array(this.stops.length).fill(0)
  }

  private mask(col: number): number {
    return 1 << (col & (this.interval - 1))
  }

  private init(col: number, width: number): void {
    for (let x = col; x < width; x++) {
      if (x % this.interval === 0) {
        this.set(x)
      } else {
        this.reset(x)
      }
    }
  }
}

export function DefaultTabStops(cols: number): TabStops {
  return new TabStops(cols)
}
