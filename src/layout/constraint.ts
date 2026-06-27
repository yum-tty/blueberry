// constraint.ts | layout constraints (ultraviolet port)

export interface Constraint {
  type: "len" | "min" | "max" | "fill" | "ratio" | "percent"
  value: number
}

export function Len(value: number): Constraint {
  return { type: "len", value }
}

export function Min(value: number): Constraint {
  return { type: "min", value }
}

export function Max(value: number): Constraint {
  return { type: "max", value }
}

export function Fill(ratio: number = 1): Constraint {
  return { type: "fill", value: ratio }
}

export function Ratio(numerator: number, denominator: number): Constraint {
  return { type: "ratio", value: denominator === 0 ? 0 : numerator / denominator }
}

export function Percent(value: number): Constraint {
  return { type: "percent", value: value / 100 }
}

export function resolveConstraint(
  constraint: Constraint,
  available: number,
): number {
  switch (constraint.type) {
    case "len":
      return Math.min(constraint.value, available)
    case "min":
      return Math.min(Math.max(constraint.value, 0), available)
    case "max":
      return Math.min(constraint.value, available)
    case "fill":
      return Math.floor(available * constraint.value)
    case "ratio":
      return Math.floor(available * constraint.value)
    case "percent":
      return Math.floor(available * constraint.value)
    default:
      return available
  }
}
