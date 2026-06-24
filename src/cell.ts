// cell.ts | cell representation (ultraviolet port)

import type { Style } from "./styled"

/**
 * Cell represents a single cell in the terminal.
 */
export interface Cell {
  char: string
  style: Style | null
  width: number
}

/**
 * Create a new cell.
 */
export function newCell(char: string, style: Style | null = null): Cell {
  return {
    char,
    style,
    width: getCharWidth(char),
  }
}

/**
 * Create an empty cell.
 */
export function emptyCell(): Cell {
  return { char: " ", style: null, width: 1 }
}

/**
 * Check if a cell is zero/empty.
 */
export function isZero(cell: Cell): boolean {
  return cell.char === " " && cell.style === null
}

/**
 * Compare two cells.
 */
export function cellEquals(a: Cell, b: Cell): boolean {
  return a.char === b.char && a.style === b.style && a.width === b.width
}

/**
 * Get the width of a character.
 */
function getCharWidth(char: string): number {
  if (char.length === 0) return 0

  const code = char.codePointAt(0)!

  // CJK characters
  if (
    (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
    (code >= 0x3000 && code <= 0x303F) || // CJK Symbols and Punctuation
    (code >= 0x3040 && code <= 0x309F) || // Hiragana
    (code >= 0x30A0 && code <= 0x30FF) || // Katakana
    (code >= 0xFF00 && code <= 0xFFEF) || // Fullwidth Forms
    (code >= 0x2E80 && code <= 0x2EFF) || // CJK Radicals
    (code >= 0x3100 && code <= 0x312F) || // Bopomofo
    (code >= 0x3130 && code <= 0x318F) || // Hangul Compatibility Jamo
    (code >= 0xAC00 && code <= 0xD7AF) || // Hangul Syllables
    (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
    (code >= 0xFE30 && code <= 0xFE4F) || // CJK Compatibility Forms
    (code >= 0x20000 && code <= 0x2A6DF) || // CJK Unified Ideographs Extension B
    (code >= 0x2A700 && code <= 0x2B73F) || // CJK Unified Ideographs Extension C
    (code >= 0x2B740 && code <= 0x2B81F) || // CJK Unified Ideographs Extension D
    (code >= 0x2B820 && code <= 0x2CEAF) || // CJK Unified Ideographs Extension E
    (code >= 0x2CEB0 && code <= 0x2EBEF) || // CJK Unified Ideographs Extension F
    (code >= 0x30000 && code <= 0x3134F) // CJK Unified Ideographs Extension G
  ) {
    return 2
  }

  // Emoji
  if (
    (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
    (code >= 0x1F300 && code <= 0x1F5FF) || // Misc Symbols and Pictographs
    (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map Symbols
    (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols and Pictographs
    (code >= 0x1FA00 && code <= 0x1FA6F) || // Chess Symbols
    (code >= 0x1FA70 && code <= 0x1FAFF) || // Symbols and Pictographs Extended-A
    (code >= 0x2600 && code <= 0x26FF) || // Misc Symbols
    (code >= 0x2700 && code <= 0x27BF) || // Dingbats
    (code >= 0xFE00 && code <= 0xFE0F) || // Variation Selectors
    (code >= 0x200D && code <= 0x200D) // Zero Width Joiner
  ) {
    return 2
  }

  return 1
}
