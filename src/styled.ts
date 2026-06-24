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

  constructor(content: string, spans: StyledSpan[] = []) {
    this.content = content
    this.spans = spans
  }

  /**
   * Get the width of the string.
   */
  width(): number {
    return stripAnsi(this.content).length
  }

  /**
   * Get the height of the string.
   */
  height(): number {
    return this.content.split("\n").length
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
