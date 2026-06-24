// styled.ts | styled string (ultraviolet port)

/**
 * Style represents a styled text span.
 */
export interface Style {
  foreground?: string
  background?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  dim?: boolean
  reverse?: boolean
  link?: string
  linkParams?: string
  /** 4-bit ANSI foreground code (30-37 or 90-97). When set, prefer over foreground hex. */
  fgCode?: number
  /** 4-bit ANSI background code (40-47 or 100-107). When set, prefer over background hex. */
  bgCode?: number
}

/**
 * StyledSpan represents a span of text with a style.
 */
export interface StyledSpan {
  text: string
  style: Style
}

/**
 * StyledString represents a string with multiple styled spans.
 */
export class StyledString {
  content: string
  spans: StyledSpan[]
  wrap: boolean
  tail: string

  constructor(content: string, spans: StyledSpan[] = []) {
    this.content = content
    this.spans = spans
    this.wrap = false
    this.tail = ""
  }

  /**
   * Get the width of the string.
   */
  width(): number {
    let maxWidth = 0
    const lines = this.content.split("\n")
    for (const line of lines) {
      const w = getStringWidth(stripAnsi(line))
      if (w > maxWidth) maxWidth = w
    }
    return maxWidth
  }

  /**
   * Get the height of the string.
   */
  height(): number {
    return this.content.split("\n").length
  }

  lines(): string[] {
    const result: string[] = []
    let current = ""
    let inAnsi = false

    for (let i = 0; i < this.content.length; i++) {
      const ch = this.content[i]!
      if (ch === "\x1b") {
        inAnsi = true
        current += ch
      } else if (inAnsi) {
        current += ch
        if (ch === "m") inAnsi = false
      } else if (ch === "\n") {
        result.push(current)
        current = ""
      } else {
        current += ch
      }
    }
    result.push(current)
    return result
  }

  render(): string {
    return this.content
  }

  unicodeWidth(): number {
    let maxWidth = 0
    const lines = this.lines()
    for (const line of lines) {
      const w = getStringWidth(stripAnsi(line))
      if (w > maxWidth) maxWidth = w
    }
    return maxWidth
  }

  /**
   * Draw the styled string to a buffer at the given position.
   */
  draw(
    setCell: (x: number, y: number, char: string, style: string) => void,
    bounds: { x: number; y: number; width: number; height: number },
  ): void {
    const lines = this.content.split("\n")

    for (let y = 0; y < lines.length && y < bounds.height; y++) {
      const line = lines[y]!
      let x = 0

      for (let i = 0; i < line.length && x < bounds.width; i++) {
        let appliedStyle = ""
        for (const span of this.spans) {
          const idx = line.indexOf(span.text, i)
          if (idx !== -1 && idx <= i && i < idx + span.text.length) {
            appliedStyle = styleToString(span.style)
            break
          }
        }
        setCell(bounds.x + x, bounds.y + y, line[i]!, appliedStyle)
        x++
      }

      while (x < bounds.width) {
        setCell(bounds.x + x, bounds.y + y, " ", "")
        x++
      }
    }
  }
}

/**
 * Convert a Style to an ANSI string. Uses 4-bit codes when fgCode/bgCode
 * are available, matching Go's ansi.BasicColor emission.
 */
export function styleToString(style: Style): string {
  const parts: string[] = []

  if (style.bold) parts.push("1")
  if (style.italic) parts.push("3")
  if (style.underline) parts.push("4")
  if (style.strikethrough) parts.push("9")
  if (style.dim) parts.push("2")
  if (style.reverse) parts.push("7")

  if (style.fgCode != null) {
    parts.push(String(style.fgCode))
  } else if (style.foreground) {
    parts.push(`38;2;${hexToRgb(style.foreground)}`)
  }

  if (style.bgCode != null) {
    parts.push(String(style.bgCode))
  } else if (style.background) {
    parts.push(`48;2;${hexToRgb(style.background)}`)
  }

  if (parts.length === 0) return ""

  return `\x1b[${parts.join(";")}m`
}

const RESET = "\x1b[0m"

/**
 * Check if a style is empty (no attributes or colors set).
 */
export function isStyleEmpty(s: Style | null): boolean {
  if (!s) return true
  return (
    !s.bold && !s.italic && !s.underline && !s.strikethrough &&
    !s.dim && !s.reverse && !s.foreground && !s.background &&
    s.fgCode == null && s.bgCode == null
  )
}

function colorEqual(a?: string, b?: string): boolean {
  return (a ?? "") === (b ?? "")
}

function codeEqual(a?: number, b?: number): boolean {
  return a === b
}

/**
 * Compute the minimal ANSI SGR sequence to transition from `from` to `to`.
 * Returns empty string when styles are equal. Returns a reset when `to` is
 * empty. Matches Go's StyleDiff logic.
 */
export function styleDiff(from: Style | null, to: Style | null): string {
  if (!from && !to) return ""
  if (from && to && stylesEqual(from, to)) return ""
  if (!from) return to ? styleToString(to) : ""
  if (!to || isStyleEmpty(to)) return RESET

  const parts: string[] = []

  const fromBold = !!from.bold
  const toBold = !!to.bold
  const fromDim = !!from.dim
  const toDim = !!to.dim

  let boldChanged = fromBold !== toBold
  let dimChanged = fromDim !== toDim
  if (boldChanged || dimChanged) {
    if ((fromBold && !toBold) || (fromDim && !toDim)) {
      parts.push("22")
      boldChanged = true
      dimChanged = true
    }
  }

  const fromItalic = !!from.italic
  const toItalic = !!to.italic
  if (fromItalic !== toItalic && !toItalic) {
    parts.push("23")
  }

  const fromUnderline = !!from.underline
  const toUnderline = !!to.underline
  if (fromUnderline !== toUnderline && !toUnderline) {
    parts.push("24")
  }

  const fromReverse = !!from.reverse
  const toReverse = !!to.reverse
  if (fromReverse !== toReverse && !toReverse) {
    parts.push("27")
  }

  const fromStrikethrough = !!from.strikethrough
  const toStrikethrough = !!to.strikethrough
  if (fromStrikethrough !== toStrikethrough && !toStrikethrough) {
    parts.push("29")
  }

  // Set new attributes
  if (boldChanged && toBold) parts.push("1")
  if (dimChanged && toDim) parts.push("2")
  if (fromItalic !== toItalic && toItalic) parts.push("3")
  if (fromUnderline !== toUnderline && toUnderline) parts.push("4")
  if (fromStrikethrough !== toStrikethrough && toStrikethrough) parts.push("9")
  if (fromReverse !== toReverse && toReverse) parts.push("7")

  // Colors: emit full color spec when changed
  if (!colorEqual(from.foreground, to.foreground) || !codeEqual(from.fgCode, to.fgCode)) {
    if (to.fgCode != null) {
      parts.push(String(to.fgCode))
    } else if (to.foreground) {
      parts.push(`38;2;${hexToRgb(to.foreground)}`)
    } else {
      parts.push("39")
    }
  }

  if (!colorEqual(from.background, to.background) || !codeEqual(from.bgCode, to.bgCode)) {
    if (to.bgCode != null) {
      parts.push(String(to.bgCode))
    } else if (to.background) {
      parts.push(`48;2;${hexToRgb(to.background)}`)
    } else {
      parts.push("49")
    }
  }

  if (parts.length === 0) return ""
  return `\x1b[${parts.join(";")}m`
}

/**
 * Check if two styles are structurally equal.
 */
export function stylesEqual(a: Style | null, b: Style | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.strikethrough === !!b.strikethrough &&
    !!a.dim === !!b.dim &&
    !!a.reverse === !!b.reverse &&
    colorEqual(a.foreground, b.foreground) &&
    colorEqual(a.background, b.background) &&
    codeEqual(a.fgCode, b.fgCode) &&
    codeEqual(a.bgCode, b.bgCode)
  )
}

/**
 * Convert hex color to RGB string.
 */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r};${g};${b}`
}

/**
 * Strip ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

export function getStringWidth(str: string): number {
  let w = 0
  for (const ch of str) {
    const code = ch.codePointAt(0)!
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3000 && code <= 0x303F) ||
      (code >= 0x3040 && code <= 0x309F) ||
      (code >= 0x30A0 && code <= 0x30FF) ||
      (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0x2E80 && code <= 0x2EFF) ||
      (code >= 0x3100 && code <= 0x312F) ||
      (code >= 0x3130 && code <= 0x318F) ||
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFE30 && code <= 0xFE4F) ||
      (code >= 0x20000 && code <= 0x2A6DF) ||
      (code >= 0x2A700 && code <= 0x2B73F) ||
      (code >= 0x2B740 && code <= 0x2B81F) ||
      (code >= 0x2B820 && code <= 0x2CEAF) ||
      (code >= 0x2CEB0 && code <= 0x2EBEF) ||
      (code >= 0x30000 && code <= 0x3134F)
    ) {
      w += 2
    } else {
      w += 1
    }
  }
  return w
}
