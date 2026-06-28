// layout.ts | layout solver (ultraviolet port)

import { type Rectangle, Rect, RectangleDx, RectangleDy } from "../compat"
import { type Constraint } from "./constraint"

export enum Flex {
  Start = 0,
  Legacy = 1,
  End = 2,
  Center = 3,
  SpaceBetween = 4,
  SpaceEvenly = 5,
  SpaceAround = 6,
}

export const FlexStart = Flex.Start
export const FlexLegacy = Flex.Legacy
export const FlexEnd = Flex.End
export const FlexCenter = Flex.Center
export const FlexSpaceBetween = Flex.SpaceBetween
export const FlexSpaceEvenly = Flex.SpaceEvenly
export const FlexSpaceAround = Flex.SpaceAround

export enum Direction {
  Vertical = 0,
  Horizontal = 1,
}

export const DirectionVertical = Direction.Vertical
export const DirectionHorizontal = Direction.Horizontal

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export function Pad(...sides: number[]): Padding {
  switch (sides.length) {
    case 0:
      return { top: 0, right: 0, bottom: 0, left: 0 }
    case 1:
      return { top: sides[0]!, right: sides[0]!, bottom: sides[0]!, left: sides[0]! }
    case 2:
      return { top: sides[0]!, right: sides[1]!, bottom: sides[0]!, left: sides[1]! }
    case 4:
      return { top: sides[0]!, right: sides[1]!, bottom: sides[2]!, left: sides[3]! }
    default:
      throw new Error("layout.Pad: unexpected sides count")
  }
}

export type Splitted = Rectangle[]

export class Layout {
  direction: Direction
  constraints: Constraint[]
  padding: Padding
  spacing: number
  flex: Flex

  constructor(direction: Direction, constraints: Constraint[]) {
    this.direction = direction
    this.constraints = constraints
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 }
    this.spacing = 0
    this.flex = Flex.Legacy
  }

  withDirection(direction: Direction): Layout {
    const l = this.clone()
    l.direction = direction
    return l
  }

  withPadding(padding: Padding): Layout {
    const l = this.clone()
    l.padding = padding
    return l
  }

  withFlex(flex: Flex): Layout {
    const l = this.clone()
    l.flex = flex
    return l
  }

  withSpacing(spacing: number): Layout {
    const l = this.clone()
    l.spacing = spacing
    return l
  }

  withConstraints(...constraints: Constraint[]): Layout {
    const l = this.clone()
    l.constraints = [...l.constraints, ...constraints]
    return l
  }

  splitWithSpacers(area: Rectangle): { segments: Splitted; spacers: Splitted } {
    const innerArea = this.applyPadding(area)
    const innerSize = this.direction === Direction.Horizontal
      ? RectangleDx(innerArea)
      : RectangleDy(innerArea)
    const crossSize = this.direction === Direction.Horizontal
      ? RectangleDy(innerArea)
      : RectangleDx(innerArea)
    const crossStart = this.direction === Direction.Horizontal
      ? innerArea.MinY
      : innerArea.MinX

    const segmentCount = this.constraints.length
    if (segmentCount === 0) {
      return { segments: [], spacers: [] }
    }

    const totalSpacing = this.spacing * Math.max(0, segmentCount - 1)
    const sizes = this.resolveSizes(innerSize, segmentCount, totalSpacing)
    const actualTotalUsed = sizes.reduce((a, b) => a + b, 0) + totalSpacing

    let startOffset = 0
    if (this.flex === Flex.End) {
      startOffset = innerSize - actualTotalUsed
    } else if (this.flex === Flex.Center) {
      startOffset = Math.floor((innerSize - actualTotalUsed) / 2)
    }

    const segments: Rectangle[] = []
    const spacers: Rectangle[] = []

    let remainingSpace = Math.max(0, innerSize - actualTotalUsed)

    let spacerSize = 0
    let firstSpacerSize = 0
    let lastSpacerSize = 0

    if (segmentCount <= 1) {
      spacerSize = 0
    } else {
      switch (this.flex) {
        case Flex.Legacy:
        case Flex.Start:
        case Flex.End:
        case Flex.Center:
          spacerSize = this.spacing
          break
        case Flex.SpaceBetween:
          spacerSize = this.spacing + Math.floor(remainingSpace / (segmentCount - 1))
          break
        case Flex.SpaceEvenly:
          spacerSize = this.spacing + Math.floor(remainingSpace / (segmentCount + 1))
          break
        case Flex.SpaceAround: {
          const halfSpace = Math.floor(remainingSpace / (segmentCount * 2))
          spacerSize = this.spacing + halfSpace * 2
          firstSpacerSize = this.spacing + halfSpace
          lastSpacerSize = this.spacing + halfSpace
          break
        }
      }
    }

    let pos = startOffset

    for (let i = 0; i < segmentCount; i++) {
      const size = sizes[i]!
      let spacerW = 0

      if (i > 0) {
        if (this.flex === Flex.SpaceAround && segmentCount > 2) {
          spacerW = i === 1 ? firstSpacerSize : (i === segmentCount - 1 ? lastSpacerSize : spacerSize)
        } else {
          spacerW = spacerSize
        }
      }

      pos += spacerW

      if (spacerW > 0) {
        spacers.push(this.makeRect(pos - spacerW, crossStart, spacerW, crossSize, this.direction))
      }

      segments.push(this.makeRect(pos, crossStart, size, crossSize, this.direction))
      pos += size
    }

    if (this.flex === Flex.SpaceEvenly && segmentCount > 0) {
      spacers.push(this.makeRect(pos, crossStart, spacerSize, crossSize, this.direction))
    }

    return { segments, spacers }
  }

  split(area: Rectangle): Splitted {
    return this.splitWithSpacers(area).segments
  }

  private clone(): Layout {
    const l = new Layout(this.direction, [...this.constraints])
    l.padding = { ...this.padding }
    l.spacing = this.spacing
    l.flex = this.flex
    return l
  }

  private applyPadding(area: Rectangle): Rectangle {
    const horizontal = this.padding.right + this.padding.left
    const vertical = this.padding.top + this.padding.bottom

    if (RectangleDx(area) < horizontal || RectangleDy(area) < vertical) {
      return Rect(0, 0, 0, 0)
    }

    return Rect(
      area.MinX + this.padding.left,
      area.MinY + this.padding.top,
      Math.max(0, RectangleDx(area) - horizontal),
      Math.max(0, RectangleDy(area) - vertical),
    )
  }

  private resolveSizes(available: number, count: number, totalSpacing: number): number[] {
    const effectiveAvailable = available - totalSpacing

    if (effectiveAvailable <= 0 || count === 0) {
      return new Array(count).fill(0)
    }

    const sizes = new Array(count).fill(0)
    let remaining = effectiveAvailable

    const fixedIndices: number[] = []
    const fillIndices: number[] = []
    const minIndices: number[] = []
    const maxIndices: number[] = []
    const percentIndices: number[] = []
    const ratioIndices: number[] = []

    for (let i = 0; i < count; i++) {
      const c = this.constraints[i]!
      if (c.type === "len") fixedIndices.push(i)
      else if (c.type === "fill") fillIndices.push(i)
      else if (c.type === "min") minIndices.push(i)
      else if (c.type === "max") maxIndices.push(i)
      else if (c.type === "percent") percentIndices.push(i)
      else if (c.type === "ratio") ratioIndices.push(i)
    }

    for (const i of fixedIndices) {
      sizes[i] = Math.min(this.constraints[i]!.value, remaining)
      remaining -= sizes[i]
    }

    for (const i of maxIndices) {
      const c = this.constraints[i]!
      if (remaining > 0) {
        sizes[i] = Math.min(c.value, remaining)
        remaining -= sizes[i]
      } else {
        sizes[i] = c.value
      }
    }

    for (const i of minIndices) {
      sizes[i] = this.constraints[i]!.value
      remaining -= sizes[i]
    }

    for (const i of percentIndices) {
      sizes[i] = Math.floor(effectiveAvailable * this.constraints[i]!.value)
      remaining -= sizes[i]
    }

    for (const i of ratioIndices) {
      sizes[i] = Math.floor(effectiveAvailable * this.constraints[i]!.value)
      remaining -= sizes[i]
    }

    if (fillIndices.length > 0 && remaining > 0) {
      let totalWeight = 0
      for (const i of fillIndices) {
        totalWeight += this.constraints[i]!.value
      }

      if (totalWeight > 0) {
        let distributed = 0
        for (let j = 0; j < fillIndices.length; j++) {
          const i = fillIndices[j]!
          if (j === fillIndices.length - 1) {
            sizes[i] = remaining - distributed
          } else {
            sizes[i] = Math.floor(remaining * this.constraints[i]!.value / totalWeight)
            distributed += sizes[i]
          }
        }
      } else {
        const perFill = Math.floor(remaining / fillIndices.length)
        for (let j = 0; j < fillIndices.length; j++) {
          sizes[fillIndices[j]!] = j === fillIndices.length - 1
            ? remaining - perFill * (fillIndices.length - 1)
            : perFill
        }
      }
      remaining = 0
    } else if (this.flex === Flex.Legacy && remaining > 0) {
      for (let i = count - 1; i >= 0; i--) {
        sizes[i] += remaining
        remaining = 0
        break
      }
    }

    for (let i = 0; i < count; i++) {
      if (sizes[i] < 0) sizes[i] = 0
    }

    return sizes
  }

  private makeRect(pos: number, crossStart: number, size: number, crossSize: number, direction: Direction): Rectangle {
    if (direction === Direction.Horizontal) {
      return Rect(pos, crossStart, size, crossSize)
    } else {
      return Rect(crossStart, pos, crossSize, size)
    }
  }
}

export function New(direction: Direction, ...constraints: Constraint[]): Layout {
  return new Layout(direction, constraints)
}

export function Vertical(...constraints: Constraint[]): Layout {
  return new Layout(Direction.Vertical, constraints)
}

export function Horizontal(...constraints: Constraint[]): Layout {
  return new Layout(Direction.Horizontal, constraints)
}
