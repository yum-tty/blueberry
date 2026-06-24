// constraint.ts | layout constraints (ultraviolet port)

/**
 * Constraint represents a layout constraint.
 */
export interface Constraint {
  type: "len" | "min" | "max" | "fill" | "ratio" | "percent"
  value: number
}

/**
 * Create a length constraint.
 */
export function Len(value: number): Constraint {
  return { type: "len", value }
}

/**
 * Create a minimum constraint.
 */
export function Min(value: number): Constraint {
  return { type: "min", value }
}

/**
 * Create a maximum constraint.
 */
export function Max(value: number): Constraint {
  return { type: "max", value }
}

/**
 * Create a fill constraint.
 */
export function Fill(ratio: number = 1): Constraint {
  return { type: "fill", value: ratio }
}

/**
 * Create a ratio constraint.
 */
export function Ratio(numerator: number, denominator: number): Constraint {
  return { type: "ratio", value: numerator / denominator }
}

/**
 * Create a percent constraint.
 */
export function Percent(value: number): Constraint {
  return { type: "percent", value: value / 100 }
}

/**
 * Resolve a constraint to a concrete value.
 */
export function resolveConstraint(
  constraint: Constraint,
  available: number,
): number {
  switch (constraint.type) {
    case "len":
      return constraint.value
    case "min":
      return Math.min(constraint.value, available)
    case "max":
      return Math.max(constraint.value, available)
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
