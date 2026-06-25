// cell.ts | cell representation (ultraviolet port)

import type { Style } from "./styled"
import { stylesEqual } from "./styled"

/**
 * WidthMethod calculates the display width of a string.
 * Go: type WidthMethod interface { StringWidth(string) int }
 */
export type WidthMethod = (s: string) => number

/**
 * Default width method using Unicode ranges.
 */
const defaultWidthMethod: WidthMethod = (s: string) => {
  if (s.length === 0) return 0
  const code = s.codePointAt(0)!
  if (
    (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3000 && code <= 0x303F) ||
    (code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF) ||
    (code >= 0xFF00 && code <= 0xFFEF) || (code >= 0x2E80 && code <= 0x2EFF) ||
    (code >= 0x3100 && code <= 0x312F) || (code >= 0x3130 && code <= 0x318F) ||
    (code >= 0xAC00 && code <= 0xD7AF) || (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFE30 && code <= 0xFE4F) || (code >= 0x20000 && code <= 0x2A6DF) ||
    (code >= 0x2A700 && code <= 0x2B73F) || (code >= 0x2B740 && code <= 0x2B81F) ||
    (code >= 0x2B820 && code <= 0x2CEAF) || (code >= 0x2CEB0 && code <= 0x2EBEF) ||
    (code >= 0x30000 && code <= 0x3134F) ||
    (code >= 0x1F600 && code <= 0x1F64F) || (code >= 0x1F300 && code <= 0x1F5FF) ||
    (code >= 0x1F680 && code <= 0x1F6FF) || (code >= 0x1F900 && code <= 0x1F9FF) ||
    (code >= 0x1FA00 && code <= 0x1FA6F) || (code >= 0x1FA70 && code <= 0x1FAFF) ||
    (code >= 0x2600 && code <= 0x26FF) || (code >= 0x2700 && code <= 0x27BF)
  ) return 2
  return 1
}

/**
 * Cell represents a single cell in the terminal screen.
 * Go: type Cell struct { Content string; Style Style; Link Link; Width int }
 */
export interface Cell {
  Content: string
  Style: Style | null
  Link?: string
  LinkParams?: string
  Width: number
}

/**
 * Create a new cell from a grapheme cluster.
 * Go: NewCell(method WidthMethod, gr string) *Cell
 */
export function NewCell(method: WidthMethod, gr: string): Cell | null {
  if (gr.length === 0) return null
  if (gr === " ") return EmptyCell()
  return { Content: gr, Style: null, Width: method(gr) }
}

/**
 * Create a new cell (simplified, no WidthMethod).
 */
export function newCell(char: string, style: Style | null = null): Cell {
  return { Content: char, Style: style, Width: defaultWidthMethod(char) }
}

/**
 * Create an empty cell.
 */
export function emptyCell(): Cell {
  return { Content: " ", Style: null, Width: 1 }
}

/**
 * EmptyCell constant — a cell with a single space, width of 1, no style.
 */
export const EmptyCell = (): Cell => ({ Content: " ", Style: null, Width: 1 })

/**
 * Check if a cell is zero/empty.
 */
export function isZero(cell: Cell): boolean {
  return cell.Content === "" && cell.Width === 0 && cell.Style === null && !cell.Link && !cell.LinkParams
}

/**
 * Deep comparison of two cells.
 * Go: Cell.Equal checks Content, Width, Style.Equal, Link.Equal
 */
export function cellEquals(a: Cell, b: Cell): boolean {
  return (
    a.Content === b.Content &&
    a.Width === b.Width &&
    stylesEqual(a.Style, b.Style) &&
    (a.Link ?? "") === (b.Link ?? "") &&
    (a.LinkParams ?? "") === (b.LinkParams ?? "")
  )
}

/**
 * Clone returns a deep copy of the cell.
 * Go: Cell.Clone() *Cell
 */
export function cellClone(cell: Cell): Cell {
  return {
    Content: cell.Content,
    Style: cell.Style ? { ...cell.Style } : null,
    Width: cell.Width,
    Link: cell.Link,
    LinkParams: cell.LinkParams,
  }
}
