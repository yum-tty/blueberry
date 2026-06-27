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
 * Link represents a hyperlink in the terminal screen.
 * Go: type Link struct { URL string; Params string }
 */
export interface Link {
  URL: string
  Params: string
}

/**
 * Create a new hyperlink with the given URL and parameters.
 * Go: NewLink(url string, params ...string) Link
 */
export function NewLink(url: string, params: string = ""): Link {
  return { URL: url, Params: params }
}

/**
 * String returns a string representation of the hyperlink.
 * Go: Link.String() string
 */
export function linkString(link: Link): string {
  return link.URL
}

/**
 * Equal returns whether the hyperlink is equal to the other hyperlink.
 * Go: Link.Equal(o *Link) bool
 */
export function linkEqual(a: Link, b: Link): boolean {
  return a.URL === b.URL && a.Params === b.Params
}

/**
 * IsZero returns whether the hyperlink is empty.
 * Go: Link.IsZero() bool
 */
export function linkIsZero(link: Link): boolean {
  return link.URL === "" && link.Params === ""
}

/**
 * Cell represents a single cell in the terminal screen.
 * Go: type Cell struct { Content string; Style Style; Link Link; Width int }
 */
export interface Cell {
  Content: string
  Style: Style | null
  Link: Link
  Width: number
}

/**
 * EmptyCell is a cell with a single space, width of 1, and no style or link.
 */
export const EmptyCell: Cell = { Content: " ", Style: null, Link: { URL: "", Params: "" }, Width: 1 }

/**
 * Create a new cell from the given string grapheme.
 * Go: NewCell(method WidthMethod, gr string) *Cell
 */
export function NewCell(method: WidthMethod, gr: string): Cell | null {
  if (gr.length === 0) return null
  if (gr === " ") return cellClone(EmptyCell)
  return { Content: gr, Style: null, Link: { URL: "", Params: "" }, Width: method(gr) }
}

/**
 * Create a new cell (simplified, no WidthMethod).
 */
export function newCell(char: string, style: Style | null = null): Cell {
  return { Content: char, Style: style, Link: { URL: "", Params: "" }, Width: defaultWidthMethod(char) }
}

/**
 * Create an empty cell.
 */
export function emptyCell(): Cell {
  return { Content: " ", Style: null, Link: { URL: "", Params: "" }, Width: 1 }
}

/**
 * String returns the string content of the cell excluding any styles, links,
 * and escape sequences.
 * Go: Cell.String() string
 */
export function cellString(cell: Cell): string {
  return cell.Content
}

/**
 * Equal returns whether the cell is equal to the other cell.
 * Go: Cell.Equal(o *Cell) bool
 */
export function cellEquals(a: Cell | null, b: Cell | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.Width === b.Width &&
    a.Content === b.Content &&
    stylesEqual(a.Style, b.Style) &&
    linkEqual(a.Link, b.Link)
  )
}

/**
 * IsZero returns whether the cell is an empty cell.
 * Go: Cell.IsZero() bool
 */
export function isZero(cell: Cell | null): boolean {
  if (!cell) return true
  return cell.Content === "" && cell.Width === 0 && cell.Style === null && linkIsZero(cell.Link)
}

/**
 * Clone returns a copy of the cell.
 * Go: Cell.Clone() *Cell
 */
export function cellClone(cell: Cell): Cell {
  return {
    Content: cell.Content,
    Style: cell.Style ? { ...cell.Style } : null,
    Link: { ...cell.Link },
    Width: cell.Width,
  }
}

/**
 * Empty makes the cell an empty cell by setting its content to a single space
 * and width to 1.
 * Go: Cell.Empty()
 */
export function cellEmpty(cell: Cell): void {
  cell.Content = " "
  cell.Width = 1
  cell.Link = { URL: "", Params: "" }
}
