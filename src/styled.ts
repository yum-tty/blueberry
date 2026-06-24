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
      const w = stripAnsi(line).length
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
      const stripped = stripAnsi(line)
      let w = 0
      for (const ch of stripped) {
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
          (code >= 0xF900 && code <= 0xFAFF)
        ) {
          w += 2
        } else {
          w += 1
        }
      }
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

      // Apply spans
      for (const span of this.spans) {
        if (span.text === line) {
          // Apply style to entire line
          const styleStr = styleToString(span.style)
          for (let i = 0; i < line.length && x < bounds.width; i++) {
            setCell(bounds.x + x, bounds.y + y, line[i]!, styleStr)
            x++
          }
          break
        }
      }

      // Fill remaining cells
      while (x < bounds.width) {
        setCell(bounds.x + x, bounds.y + y, " ", "")
        x++
      }
    }
  }
}

/**
 * Convert a Style to an ANSI string.
 */
export function styleToString(style: Style): string {
  const parts: string[] = []

  if (style.bold) parts.push("1")
  if (style.italic) parts.push("3")
  if (style.underline) parts.push("4")
  if (style.strikethrough) parts.push("9")
  if (style.dim) parts.push("2")
  if (style.reverse) parts.push("7")

  if (style.foreground) {
    parts.push(`38;2;${hexToRgb(style.foreground)}`)
  }

  if (style.background) {
    parts.push(`48;2;${hexToRgb(style.background)}`)
  }

  if (parts.length === 0) return ""

  return `\x1b[${parts.join(";")}m`
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
