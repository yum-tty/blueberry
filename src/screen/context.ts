// context.ts | screen context (ultraviolet port)

import { type Style, getStringWidth } from "../styled"
import { type Cell, type Link } from "../cell"
import { type ScreenBuffer } from "../buffer"

/**
 * Context provides drawing helpers for a screen.
 * Port of Go ultraviolet's screen.Context.
 */
export class Context {
  private buffer: ScreenBuffer
  private x: number = 0
  private y: number = 0
  private style: Style | null = null
  private link: Link = { URL: "", Params: "" }

  constructor(buffer: ScreenBuffer) {
    this.buffer = buffer
  }

  reset(): void {
    this.style = null
    this.link = { URL: "", Params: "" }
    this.x = 0
    this.y = 0
  }

  // ── Position ──

  /**
   * Position returns the current position of the context.
   */
  position(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * SetPosition moves the current position to the given coordinates.
   * Alias for moveTo.
   */
  setPosition(x: number, y: number): void {
    this.moveTo(x, y)
  }

  /**
   * WithPosition returns a copy of the context with the given position.
   */
  withPosition(x: number, y: number): Context {
    const c = this.clone()
    c.moveTo(x, y)
    return c
  }

  /**
   * MoveTo moves the current position to the given coordinates.
   */
  moveTo(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  // ── Style ──

  /**
   * SetStyle sets the style of the context.
   */
  setStyle(style: Style | null): void {
    this.style = style
  }

  /**
   * WithStyle returns a copy of the context with the given style.
   */
  withStyle(style: Style | null): Context {
    const c = this.clone()
    c.setStyle(style)
    return c
  }

  /**
   * SetLink sets the link of the context.
   */
  setLink(link: Link): void {
    this.link = link
  }

  /**
   * WithLink returns a copy of the context with the given link.
   */
  withLink(link: Link): Context {
    const c = this.clone()
    c.setLink(link)
    return c
  }

  // ── Attribute setters ──

  /**
   * SetBold sets whether the text should be bold.
   */
  setBold(bold: boolean): void {
    if (!this.style) this.style = {}
    this.style.bold = bold
  }

  withBold(bold: boolean): Context {
    const c = this.clone()
    c.setBold(bold)
    return c
  }

  /**
   * SetItalic sets whether the text should be italic.
   */
  setItalic(italic: boolean): void {
    if (!this.style) this.style = {}
    this.style.italic = italic
  }

  withItalic(italic: boolean): Context {
    const c = this.clone()
    c.setItalic(italic)
    return c
  }

  /**
   * SetStrikethrough sets whether the text should be strikethrough.
   */
  setStrikethrough(strikethrough: boolean): void {
    if (!this.style) this.style = {}
    this.style.strikethrough = strikethrough
  }

  withStrikethrough(strikethrough: boolean): Context {
    const c = this.clone()
    c.setStrikethrough(strikethrough)
    return c
  }

  /**
   * SetFaint (dim) sets whether the text should be faint/dim.
   */
  setFaint(faint: boolean): void {
    if (!this.style) this.style = {}
    this.style.dim = faint
  }

  withFaint(faint: boolean): Context {
    const c = this.clone()
    c.setFaint(faint)
    return c
  }

  /**
   * SetBlink sets whether the text should blink.
   */
  setBlink(blink: boolean): void {
    if (!this.style) this.style = {}
    this.style.blink = blink
  }

  withBlink(blink: boolean): Context {
    const c = this.clone()
    c.setBlink(blink)
    return c
  }

  /**
   * SetReverse sets whether the text should be reversed.
   */
  setReverse(reverse: boolean): void {
    if (!this.style) this.style = {}
    this.style.reverse = reverse
  }

  withReverse(reverse: boolean): Context {
    const c = this.clone()
    c.setReverse(reverse)
    return c
  }

  /**
   * SetConceal sets whether the text should be concealed.
   */
  setConceal(conceal: boolean): void {
    if (!this.style) this.style = {}
    this.style.conceal = conceal
  }

  withConceal(conceal: boolean): Context {
    const c = this.clone()
    c.setConceal(conceal)
    return c
  }

  // ── Color setters ──

  /**
   * SetForeground sets the foreground color. Use undefined to reset.
   */
  setForeground(fg: string | undefined): void {
    if (!this.style) this.style = {}
    this.style.foreground = fg
  }

  withForeground(fg: string | undefined): Context {
    const c = this.clone()
    c.setForeground(fg)
    return c
  }

  /**
   * SetBackground sets the background color. Use undefined to reset.
   */
  setBackground(bg: string | undefined): void {
    if (!this.style) this.style = {}
    this.style.background = bg
  }

  withBackground(bg: string | undefined): Context {
    const c = this.clone()
    c.setBackground(bg)
    return c
  }

  // ── Underline setters ──

  /**
   * SetUnderlineStyle sets the underline style.
   */
  setUnderlineStyle(u: Style["underline"]): void {
    if (!this.style) this.style = {}
    this.style.underline = u
  }

  withUnderlineStyle(u: Style["underline"]): Context {
    const c = this.clone()
    c.setUnderlineStyle(u)
    return c
  }

  /**
   * SetUnderline sets whether the text should be underlined (single).
   */
  setUnderline(underline: boolean): void {
    this.setUnderlineStyle(underline ? "single" : "none")
  }

  withUnderline(underline: boolean): Context {
    const c = this.clone()
    c.setUnderline(underline)
    return c
  }

  /**
   * SetUnderlineColor sets the underline color. Use undefined to reset.
   */
  setUnderlineColor(color: string | undefined): void {
    if (!this.style) this.style = {}
    this.style.underlineColor = color
  }

  withUnderlineColor(color: string | undefined): Context {
    const c = this.clone()
    c.setUnderlineColor(color)
    return c
  }

  // ── URL setters ──

  /**
   * SetURL sets a URL link for the context. Use empty string to reset.
   */
  setURL(url: string, ...params: string[]): void {
    if (url === "") {
      this.link = { URL: "", Params: "" }
      return
    }
    this.link = {
      URL: url,
      Params: params.join(":"),
    }
  }

  withURL(url: string, ...params: string[]): Context {
    const c = this.clone()
    c.setURL(url, ...params)
    return c
  }

  // ── Writing / Drawing ──

  /**
   * DrawString draws the given string at the given position with the current
   * style and link, cropping when it reaches the edge of the screen.
   */
  drawStringAt(s: string, x: number, y: number): void {
    const bounds = this.buffer.getBounds()
    if (!this.posInBounds(x, y, bounds)) return

    const chars = [...s]
    let cx = x
    let cy = y

    for (const ch of chars) {
      if (ch === "\n") {
        cx = bounds.MinX
        cy++
        continue
      }

      const w = getStringWidth(ch)
      if (cx + w > bounds.MaxX) {
        break
      }

      if (!this.posInBounds(cx, cy, bounds)) break

      this.buffer.setCell(cx, cy, {
        Content: ch,
        Style: this.style ? { ...this.style } : null,
        Link: { URL: this.link.URL, Params: this.link.Params },
        Width: w,
      })

      cx += w
    }
  }

  /**
   * DrawStringWrapped draws the given string at the given position with the
   * current style and link, wrapping when it reaches the edge of the screen.
   */
  drawStringWrappedAt(s: string, x: number, y: number): void {
    const bounds = this.buffer.getBounds()
    if (!this.posInBounds(x, y, bounds)) return

    const chars = [...s]
    let cx = x
    let cy = y

    for (const ch of chars) {
      if (ch === "\n") {
        cx = bounds.MinX
        cy++
        continue
      }

      const w = getStringWidth(ch)
      if (cx + w > bounds.MaxX) {
        cx = bounds.MinX
        cy++
      }

      if (!this.posInBounds(cx, cy, bounds)) break

      this.buffer.setCell(cx, cy, {
        Content: ch,
        Style: this.style ? { ...this.style } : null,
        Link: { URL: this.link.URL, Params: this.link.Params },
        Width: w,
      })

      cx += w
    }
  }

  /**
   * Draw a string at the current position (advancing y per line).
   */
  drawString(str: string): void {
    this.drawStringAt(str, this.x, this.y)
  }

  /**
   * Draw a styled string at the current position.
   */
  drawStyledString(str: string, style: Style): void {
    const savedStyle = this.style
    this.style = style
    this.drawString(str)
    this.style = savedStyle
  }

  /**
   * Write implements io.Writer, writing bytes at the current position
   * and updating position accordingly.
   */
  write(p: string): number {
    this.drawStringWrappedAt(p, this.x, this.y)
    return p.length
  }

  /**
   * WriteString writes a string at the current position with wrapping.
   */
  writeString(s: string): number {
    this.drawStringWrappedAt(s, this.x, this.y)
    return s.length
  }

  /**
   * Print prints the given values at the current position, updating position.
   */
  print(...values: unknown[]): void {
    const s = values.map(v => String(v)).join(" ")
    this.writeString(s)
  }

  /**
   * Println prints the given values with a newline at the current position.
   */
  println(...values: unknown[]): void {
    const s = values.map(v => String(v)).join(" ")
    this.writeString(s + "\n")
  }

  /**
   * Printf formats and prints at the current position.
   */
  printf(format: string, ...args: unknown[]): void {
    let result = format
    let argIdx = 0
    result = result.replace(/%[sdvfgtbcxXoOp]/g, () => {
      if (argIdx < args.length) {
        return String(args[argIdx++])
      }
      return ""
    })
    this.writeString(result)
  }

  // ── Clear / Fill ──

  /**
   * Clear the screen.
   */
  clear(): void {
    this.buffer.clear()
  }

  /**
   * Fill a rectangular region.
   */
  fill(
    x: number,
    y: number,
    width: number,
    height: number,
    char: string = " ",
    style: Style | null = null,
  ): void {
    this.buffer.fill(x, y, width, height, char, style)
  }

  // ── Internal ──

  private posInBounds(x: number, y: number, bounds: { MinX: number; MinY: number; MaxX: number; MaxY: number }): boolean {
    return x >= bounds.MinX && y >= bounds.MinY && x < bounds.MaxX && y < bounds.MaxY
  }

  private clone(): Context {
    const c = new Context(this.buffer)
    c.x = this.x
    c.y = this.y
    c.style = this.style ? { ...this.style } : null
    c.link = { URL: this.link.URL, Params: this.link.Params }
    return c
  }
}
