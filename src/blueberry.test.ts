import { describe, test, expect } from "bun:test"
import {
  // Cell
  type Cell,
  NewCell,
  newCell,
  EmptyCell,
  emptyCell,
  isZero,
  cellEquals,
  cellClone,
  cellString,
  cellEmpty,
  // Link
  NewLink,
  linkEqual,
  linkIsZero,
  linkString,
  // Style
  type Style,
  styleToString,
  styleDiff,
  stylesEqual,
  isStyleEmpty,
  stripAnsi,
  getStringWidth,
  ReadStyle,
  ReadLink,
  // Buffer / Line
  type Line,
  type Lines,
  Buffer,
  RenderBuffer,
  ScreenBuffer,
  NewLine,
  LineSet,
  LineAt,
  LineString,
  LineRender,
  LinesHeight,
  LinesWidth,
  LinesString,
  LinesRender,
  Rect,
  TrimSpace,
  rectEmpty,
  rectIn,
  rectOverlaps,
  rectDx,
  rectDy,
  // Styled
  StyledString,
  // Layout
  type Constraint,
  Len,
  Min,
  Max,
  LayoutFill,
  Ratio,
  Percent,
  resolveConstraint,
  // Keys
  type Key,
  keyMatchString,
  keyString,
  keyKeystroke,
  ModShift,
  ModAlt,
  ModCtrl,
  ModMeta,
  KeyUp,
  KeyDown,
  KeyLeft,
  KeyRight,
  KeyEnter,
  KeyEscape,
  KeySpace,
  KeyF1,
  KeyF12,
  KeyBackspace,
  KeyTab,
  KeyHome,
  KeyEnd,
  KeyPgUp,
  KeyPgDown,
  // Decoder
  EventDecoder,
  // Borders
  NormalBorder,
  RoundedBorder,
  DoubleBorder,
  ThickBorder,
  HiddenBorder,
  BlockBorder,
  ASCIIBorder,
  MarkdownBorder,
  // Compat
  NewScreenBuffer,
  NewBuffer,
  NewRenderBuffer,
  NewStyledString,
  ConvertStyle,
  AttrBold,
  AttrItalic,
  UnderlineNone,
  UnderlineSingle,
} from "./index"

// ── Cell ──

describe("Cell", () => {
  test("EmptyCell has correct defaults", () => {
    expect(EmptyCell.Content).toBe(" ")
    expect(EmptyCell.Width).toBe(1)
    expect(EmptyCell.Style).toBeNull()
  })

  test("emptyCell() returns empty cell", () => {
    const c = emptyCell()
    expect(c.Content).toBe(" ")
    expect(c.Width).toBe(1)
  })

  test("newCell creates cell from char", () => {
    const c = newCell("A")
    expect(c.Content).toBe("A")
    expect(c.Width).toBe(1)
    expect(c.Style).toBeNull()
  })

  test("newCell with style", () => {
    const style: Style = { bold: true }
    const c = newCell("B", style)
    expect(c.Content).toBe("B")
    expect(c.Style).toEqual(style)
  })

  test("NewCell with width method", () => {
    const method = (s: string) => s.length
    const c = NewCell(method, "X")
    expect(c).not.toBeNull()
    expect(c!.Content).toBe("X")
    expect(c!.Width).toBe(1)
  })

  test("NewCell returns null for empty string", () => {
    const c = NewCell((s) => s.length, "")
    expect(c).toBeNull()
  })

  test("NewCell returns clone of EmptyCell for space", () => {
    const c = NewCell((s) => s.length, " ")
    expect(c).not.toBeNull()
    expect(c!.Content).toBe(" ")
    expect(c!.Width).toBe(1)
  })

  test("cellEquals compares cells", () => {
    const a = newCell("A")
    const b = newCell("A")
    expect(cellEquals(a, b)).toBe(true)
  })

  test("cellEquals detects different content", () => {
    const a = newCell("A")
    const b = newCell("B")
    expect(cellEquals(a, b)).toBe(false)
  })

  test("cellEquals handles null", () => {
    expect(cellEquals(null, null)).toBe(true)
    expect(cellEquals(null, newCell("A"))).toBe(false)
    expect(cellEquals(newCell("A"), null)).toBe(false)
  })

  test("isZero detects zero cell", () => {
    const zero: Cell = { Content: "", Style: null, Link: { URL: "", Params: "" }, Width: 0 }
    expect(isZero(zero)).toBe(true)
  })

  test("isZero detects non-zero cell", () => {
    expect(isZero(newCell("A"))).toBe(false)
  })

  test("isZero handles null", () => {
    expect(isZero(null)).toBe(true)
  })

  test("cellClone creates independent copy", () => {
    const style: Style = { bold: true }
    const c = newCell("X", style)
    const clone = cellClone(c)
    expect(clone.Content).toBe("X")
    expect(clone.Style!.bold).toBe(true)
    clone.Style!.bold = false
    expect(c.Style!.bold).toBe(true)
  })

  test("cellString returns content", () => {
    const c = newCell("Z")
    expect(cellString(c)).toBe("Z")
  })

  test("cellEmpty clears cell", () => {
    const c = newCell("X")
    cellEmpty(c)
    expect(c.Content).toBe(" ")
    expect(c.Width).toBe(1)
  })
})

// ── Link ──

describe("Link", () => {
  test("NewLink creates link", () => {
    const l = NewLink("https://example.com")
    expect(l.URL).toBe("https://example.com")
    expect(l.Params).toBe("")
  })

  test("NewLink with params", () => {
    const l = NewLink("https://example.com", "id=1")
    expect(l.Params).toBe("id=1")
  })

  test("linkString returns URL", () => {
    const l = NewLink("https://test.com")
    expect(linkString(l)).toBe("https://test.com")
  })

  test("linkEqual compares links", () => {
    const a = NewLink("url", "p")
    const b = NewLink("url", "p")
    expect(linkEqual(a, b)).toBe(true)
  })

  test("linkEqual detects different links", () => {
    const a = NewLink("url1")
    const b = NewLink("url2")
    expect(linkEqual(a, b)).toBe(false)
  })

  test("linkIsZero detects empty link", () => {
    expect(linkIsZero(NewLink(""))).toBe(true)
  })

  test("linkIsZero detects non-empty link", () => {
    expect(linkIsZero(NewLink("url"))).toBe(false)
  })
})

// ── Style ──

describe("Style", () => {
  test("isStyleEmpty detects empty style", () => {
    expect(isStyleEmpty(null)).toBe(true)
    expect(isStyleEmpty({})).toBe(true)
  })

  test("isStyleEmpty detects non-empty style", () => {
    expect(isStyleEmpty({ bold: true })).toBe(false)
    expect(isStyleEmpty({ foreground: "#fff" })).toBe(false)
  })

  test("stylesEqual compares styles", () => {
    const a: Style = { bold: true, foreground: "#fff" }
    const b: Style = { bold: true, foreground: "#fff" }
    expect(stylesEqual(a, b)).toBe(true)
  })

  test("stylesEqual detects different styles", () => {
    const a: Style = { bold: true }
    const b: Style = { bold: false }
    expect(stylesEqual(a, b)).toBe(false)
  })

  test("stylesEqual handles null", () => {
    expect(stylesEqual(null, null)).toBe(true)
    expect(stylesEqual(null, { bold: true })).toBe(false)
  })

  test("styleToString produces ANSI sequence", () => {
    const s: Style = { bold: true }
    const str = styleToString(s)
    expect(str).toContain("\x1b[")
    expect(str).toContain("1")
  })

  test("styleToString empty style returns empty", () => {
    expect(styleToString(null)).toBe("")
    expect(styleToString({})).toBe("")
  })

  test("styleDiff from null to style", () => {
    const to: Style = { bold: true }
    const diff = styleDiff(null, to)
    expect(diff).toContain("\x1b[")
    expect(diff).toContain("1")
  })

  test("styleDiff from style to null returns reset", () => {
    const from: Style = { bold: true }
    const diff = styleDiff(from, null)
    expect(diff).toContain("\x1b[0m")
  })

  test("styleDiff same styles returns empty", () => {
    const s: Style = { bold: true }
    expect(styleDiff(s, s)).toBe("")
  })

  test("stripAnsi removes ANSI sequences", () => {
    const styled = "\x1b[1mbold\x1b[0m"
    expect(stripAnsi(styled)).toBe("bold")
  })

  test("getStringWidth counts ASCII", () => {
    expect(getStringWidth("hello")).toBe(5)
  })

  test("getStringWidth counts CJK as 2", () => {
    expect(getStringWidth("中")).toBe(2)
  })

  test("getStringWidth handles empty string", () => {
    expect(getStringWidth("")).toBe(0)
  })

  test("ReadStyle parses SGR params", () => {
    const pen: Style = {}
    ReadStyle([1], pen)
    expect(pen.bold).toBe(true)
  })

  test("ReadStyle reset clears pen", () => {
    const pen: Style = { bold: true, italic: true }
    ReadStyle([0], pen)
    expect(pen.bold).toBeFalsy()
    expect(pen.italic).toBeFalsy()
  })
})

describe("ReadLink", () => {
  test("parses link data", () => {
    const link = NewLink("")
    ReadLink("action;params;https://example.com", link)
    expect(link.URL).toBe("https://example.com")
    expect(link.Params).toBe("params")
  })
})

// ── ScreenBuffer ──

describe("ScreenBuffer", () => {
  test("NewScreenBuffer creates buffer", () => {
    const buf = NewScreenBuffer(10, 5)
    expect(buf.getWidth()).toBe(10)
    expect(buf.getHeight()).toBe(5)
  })

  test("setCell places cell", () => {
    const buf = NewScreenBuffer(5, 5)
    const cell = newCell("A")
    buf.setCell(2, 2, cell)
    const got = buf.getCell(2, 2)
    expect(got).not.toBeNull()
    expect(got!.Content).toBe("A")
  })

  test("getCell returns null for out of bounds", () => {
    const buf = NewScreenBuffer(5, 5)
    expect(buf.getCell(-1, 0)).toBeNull()
    expect(buf.getCell(0, -1)).toBeNull()
    expect(buf.getCell(5, 0)).toBeNull()
    expect(buf.getCell(0, 5)).toBeNull()
  })

  test("drawString places string", () => {
    const buf = NewScreenBuffer(10, 3)
    buf.drawString("Hi", 1, 1)
    expect(buf.getCell(1, 1)!.Content).toBe("H")
    expect(buf.getCell(2, 1)!.Content).toBe("i")
  })

  test("drawString with multi-line", () => {
    const buf = NewScreenBuffer(10, 5)
    buf.drawString("A\nB", 0, 1)
    expect(buf.getCell(0, 1)!.Content).toBe("A")
    expect(buf.getCell(0, 2)!.Content).toBe("B")
  })

  test("fill fills area", () => {
    const buf = NewScreenBuffer(10, 10)
    buf.fill(0, 0, 5, 5, "#")
    expect(buf.getCell(0, 0)!.Content).toBe("#")
    expect(buf.getCell(4, 4)!.Content).toBe("#")
    expect(buf.getCell(5, 5)!.Content).toBe(" ")
  })

  test("fillArea fills area", () => {
    const buf = NewScreenBuffer(10, 10)
    buf.fillArea(2, 2, 3, 3)
    expect(buf.getCell(2, 2)!.Content).toBe(" ")
    expect(buf.getCell(4, 4)!.Content).toBe(" ")
  })

  test("clear resets buffer", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("X"))
    buf.clear()
    expect(buf.getCell(0, 0)!.Content).toBe(" ")
  })

  test("clearArea clears specific area", () => {
    const buf = NewScreenBuffer(10, 10)
    buf.fill(0, 0, 10, 10, "#")
    buf.clearArea(2, 2, 3, 3)
    expect(buf.getCell(0, 0)!.Content).toBe("#")
    expect(buf.getCell(2, 2)!.Content).toBe(" ")
  })

  test("clone creates independent copy", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("X"))
    const clone = buf.clone()
    expect(clone.getCell(0, 0)!.Content).toBe("X")
    clone.setCell(0, 0, newCell("Y"))
    expect(buf.getCell(0, 0)!.Content).toBe("X")
  })

  test("cloneArea clones specific area", () => {
    const buf = NewScreenBuffer(10, 10)
    buf.setCell(2, 2, newCell("Z"))
    const area = buf.cloneArea(1, 1, 5, 5)
    expect(area.getCell(1, 1)!.Content).toBe("Z")
  })

  test("resize changes dimensions", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("X"))
    buf.resize(10, 10)
    expect(buf.getWidth()).toBe(10)
    expect(buf.getHeight()).toBe(10)
    expect(buf.getCell(0, 0)!.Content).toBe("X")
  })

  test("getBounds returns correct rectangle", () => {
    const buf = NewScreenBuffer(8, 4)
    const b = buf.getBounds()
    expect(b.MinX).toBe(0)
    expect(b.MinY).toBe(0)
    expect(b.MaxX).toBe(8)
    expect(b.MaxY).toBe(4)
  })

  test("render produces output string", () => {
    const buf = NewScreenBuffer(5, 3)
    buf.setCell(0, 0, newCell("H"))
    buf.setCell(1, 0, newCell("i"))
    const out = buf.render()
    expect(out).toContain("Hi")
  })

  test("render includes ANSI for styled cells", () => {
    const buf = NewScreenBuffer(5, 3)
    buf.setCell(0, 0, newCell("X", { bold: true }))
    const out = buf.render()
    expect(out).toMatch(/\x1b\[/)
  })

  test("insertLine shifts lines down", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("A"))
    buf.setCell(0, 1, newCell("B"))
    buf.insertLine(0, 1)
    expect(buf.getCell(0, 0)!.Content).toBe(" ")
    expect(buf.getCell(0, 1)!.Content).toBe("A")
  })

  test("deleteLine shifts lines up", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("A"))
    buf.setCell(0, 1, newCell("B"))
    buf.deleteLine(0, 1)
    expect(buf.getCell(0, 0)!.Content).toBe("B")
  })

  test("insertCell shifts cells right", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("A"))
    buf.insertCell(0, 0, 1)
    expect(buf.getCell(0, 0)!.Content).toBe(" ")
    expect(buf.getCell(1, 0)!.Content).toBe("A")
  })

  test("deleteCell shifts cells left", () => {
    const buf = NewScreenBuffer(5, 5)
    buf.setCell(0, 0, newCell("A"))
    buf.setCell(1, 0, newCell("B"))
    buf.deleteCell(0, 0, 1)
    expect(buf.getCell(0, 0)!.Content).toBe("B")
  })

  test("equals compares buffers", () => {
    const a = NewScreenBuffer(3, 3)
    const b = NewScreenBuffer(3, 3)
    expect(a.equals(b)).toBe(true)
    a.setCell(0, 0, newCell("X"))
    expect(a.equals(b)).toBe(false)
  })

  test("getLine returns cells for row", () => {
    const buf = NewScreenBuffer(5, 3)
    buf.setCell(0, 1, newCell("Z"))
    const line = buf.getLine(1)
    expect(line.length).toBe(5)
    expect(line[0]!.Content).toBe("Z")
  })
})

// ── Buffer ──

describe("Buffer", () => {
  test("creates with dimensions", () => {
    const buf = new Buffer(10, 5)
    expect(buf.Width()).toBe(10)
    expect(buf.Height()).toBe(5)
  })

  test("CellAt and SetCell", () => {
    const buf = new Buffer(5, 5)
    buf.SetCell(2, 2, newCell("A"))
    expect(buf.CellAt(2, 2)!.Content).toBe("A")
  })

  test("String returns text representation", () => {
    const buf = new Buffer(5, 2)
    buf.SetCell(0, 0, newCell("H"))
    buf.SetCell(1, 0, newCell("i"))
    expect(buf.String()).toContain("Hi")
  })

  test("Render includes ANSI for styled cells", () => {
    const buf = new Buffer(5, 2)
    buf.SetCell(0, 0, newCell("X", { bold: true }))
    expect(buf.Render()).toMatch(/\x1b\[/)
  })

  test("Resize grows and shrinks", () => {
    const buf = new Buffer(5, 5)
    buf.SetCell(0, 0, newCell("A"))
    buf.Resize(10, 10)
    expect(buf.Width()).toBe(10)
    expect(buf.Height()).toBe(10)
    expect(buf.CellAt(0, 0)!.Content).toBe("A")
    buf.Resize(3, 3)
    expect(buf.Width()).toBe(3)
    expect(buf.Height()).toBe(3)
  })

  test("Fill fills entire buffer", () => {
    const buf = new Buffer(3, 3)
    buf.Fill(newCell("#"))
    expect(buf.CellAt(0, 0)!.Content).toBe("#")
    expect(buf.CellAt(2, 2)!.Content).toBe("#")
  })

  test("Clear resets all cells", () => {
    const buf = new Buffer(3, 3)
    buf.Fill(newCell("X"))
    buf.Clear()
    expect(buf.CellAt(0, 0)!.Content).toBe(" ")
  })

  test("Clone creates deep copy", () => {
    const buf = new Buffer(3, 3)
    buf.SetCell(0, 0, newCell("A"))
    const clone = buf.Clone()
    clone.SetCell(0, 0, newCell("B"))
    expect(buf.CellAt(0, 0)!.Content).toBe("A")
  })

  test("Bounds returns rectangle", () => {
    const buf = new Buffer(8, 4)
    const b = buf.Bounds()
    expect(rectDx(b)).toBe(8)
    expect(rectDy(b)).toBe(4)
  })
})

// ── RenderBuffer ──

describe("RenderBuffer", () => {
  test("creates with dimensions", () => {
    const rb = new RenderBuffer(10, 5)
    expect(rb.Width()).toBe(10)
    expect(rb.Height()).toBe(5)
  })

  test("SetCell tracks touched lines", () => {
    const rb = new RenderBuffer(10, 5)
    rb.SetCell(3, 2, newCell("X"))
    expect(rb.TouchedLines()).toBe(1)
  })

  test("Clone creates independent copy", () => {
    const rb = new RenderBuffer(5, 5)
    rb.SetCell(0, 0, newCell("A"))
    const clone = rb.Clone()
    clone.SetCell(0, 0, newCell("B"))
    expect(rb.CellAt(0, 0)!.Content).toBe("A")
  })

  test("Clear touches all lines", () => {
    const rb = new RenderBuffer(5, 5)
    rb.Clear()
    expect(rb.TouchedLines()).toBe(5)
  })
})

// ── Line operations ──

describe("Line operations", () => {
  test("NewLine creates line of empty cells", () => {
    const line = NewLine(5)
    expect(line.length).toBe(5)
    expect(line[0]!.Content).toBe(" ")
  })

  test("LineSet places cell", () => {
    const line = NewLine(5)
    LineSet(line, 2, newCell("X"))
    expect(line[2]!.Content).toBe("X")
  })

  test("LineAt returns cell", () => {
    const line = NewLine(5)
    LineSet(line, 3, newCell("Y"))
    expect(LineAt(line, 3)!.Content).toBe("Y")
  })

  test("LineAt returns null for out of bounds", () => {
    const line = NewLine(5)
    expect(LineAt(line, -1)).toBeNull()
    expect(LineAt(line, 5)).toBeNull()
  })

  test("LineString returns text", () => {
    const line = NewLine(5)
    LineSet(line, 0, newCell("A"))
    LineSet(line, 1, newCell("B"))
    expect(LineString(line)).toContain("AB")
  })

  test("LineRender includes ANSI for styled cells", () => {
    const line = NewLine(5)
    LineSet(line, 0, newCell("X", { bold: true }))
    expect(LineRender(line)).toMatch(/\x1b\[/)
  })

  test("LinesHeight returns count", () => {
    const lines: Lines = [NewLine(5), NewLine(5), NewLine(5)]
    expect(LinesHeight(lines)).toBe(3)
  })

  test("LinesWidth returns max width", () => {
    const lines: Lines = [NewLine(3), NewLine(7), NewLine(5)]
    expect(LinesWidth(lines)).toBe(7)
  })

  test("LinesString joins lines", () => {
    const a = NewLine(3)
    const b = NewLine(3)
    LineSet(a, 0, newCell("A"))
    LineSet(b, 0, newCell("B"))
    const result = LinesString([a, b])
    expect(result).toContain("A")
    expect(result).toContain("B")
  })
})

// ── Rectangle operations ──

describe("Rectangle", () => {
  test("Rect creates rectangle", () => {
    const r = Rect(1, 2, 3, 4)
    expect(r.MinX).toBe(1)
    expect(r.MinY).toBe(2)
    expect(r.MaxX).toBe(4)
    expect(r.MaxY).toBe(6)
  })

  test("rectEmpty detects empty rect", () => {
    expect(rectEmpty(Rect(0, 0, 0, 0))).toBe(true)
    expect(rectEmpty(Rect(0, 0, 1, 1))).toBe(false)
  })

  test("rectIn checks containment", () => {
    const inner = Rect(1, 1, 2, 2)
    const outer = Rect(0, 0, 5, 5)
    expect(rectIn(inner, outer)).toBe(true)
    expect(rectIn(outer, inner)).toBe(false)
  })

  test("rectOverlaps detects overlap", () => {
    const a = Rect(0, 0, 3, 3)
    const b = Rect(2, 2, 3, 3)
    expect(rectOverlaps(a, b)).toBe(true)
  })

  test("rectOverlaps detects no overlap", () => {
    const a = Rect(0, 0, 2, 2)
    const b = Rect(5, 5, 2, 2)
    expect(rectOverlaps(a, b)).toBe(false)
  })

  test("rectDx and rectDy return dimensions", () => {
    const r = Rect(1, 2, 5, 3)
    expect(rectDx(r)).toBe(5)
    expect(rectDy(r)).toBe(3)
  })
})

// ── TrimSpace ──

describe("TrimSpace", () => {
  test("trims trailing spaces", () => {
    expect(TrimSpace("hello   ")).toBe("hello")
  })

  test("trims each line", () => {
    expect(TrimSpace("a   \nb   ")).toBe("a\nb")
  })
})

// ── StyledString ──

describe("StyledString", () => {
  test("creates from plain text", () => {
    const ss = new StyledString("hello")
    expect(ss.String()).toBe("hello")
  })

  test("Height returns line count", () => {
    const ss = new StyledString("a\nb\nc")
    expect(ss.Height()).toBe(3)
  })

  test("Bounds returns rectangle", () => {
    const ss = new StyledString("hello")
    const b = ss.Bounds()
    expect(b.MinX).toBe(0)
    expect(b.MinY).toBe(0)
    expect(b.MaxX).toBe(5)
    expect(b.MaxY).toBe(1)
  })

  test("Lines returns line array", () => {
    const ss = new StyledString("a\nb")
    const lines = ss.Lines()
    expect(lines.length).toBe(2)
  })

  test("NewStyledString creates styled string", () => {
    const ss = NewStyledString("test")
    expect(ss).toBeDefined()
  })
})

// ── Layout constraints ──

describe("Layout constraints", () => {
  test("Len creates length constraint", () => {
    const c = Len(10)
    expect(c.type).toBe("len")
    expect(c.value).toBe(10)
  })

  test("Min creates min constraint", () => {
    const c = Min(5)
    expect(c.type).toBe("min")
    expect(c.value).toBe(5)
  })

  test("Max creates max constraint", () => {
    const c = Max(20)
    expect(c.type).toBe("max")
    expect(c.value).toBe(20)
  })

  test("Fill creates fill constraint", () => {
    const c = LayoutFill(2)
    expect(c.type).toBe("fill")
    expect(c.value).toBe(2)
  })

  test("Ratio creates ratio constraint", () => {
    const c = Ratio(1, 3)
    expect(c.type).toBe("ratio")
    expect(c.value).toBeCloseTo(1 / 3)
  })

  test("Percent creates percent constraint", () => {
    const c = Percent(50)
    expect(c.type).toBe("percent")
    expect(c.value).toBe(0.5)
  })

  test("resolveConstraint Len", () => {
    expect(resolveConstraint(Len(10), 20)).toBe(10)
    expect(resolveConstraint(Len(10), 5)).toBe(5)
  })

  test("resolveConstraint Min", () => {
    expect(resolveConstraint(Min(10), 20)).toBe(10)
    expect(resolveConstraint(Min(10), 5)).toBe(5)
  })

  test("resolveConstraint Max", () => {
    expect(resolveConstraint(Max(10), 5)).toBe(5)
    expect(resolveConstraint(Max(10), 20)).toBe(10)
  })

  test("resolveConstraint Fill", () => {
    expect(resolveConstraint(LayoutFill(0.5), 20)).toBe(10)
  })

  test("resolveConstraint Ratio", () => {
    expect(resolveConstraint(Ratio(1, 4), 100)).toBe(25)
  })

  test("resolveConstraint Percent", () => {
    expect(resolveConstraint(Percent(30), 100)).toBe(30)
  })
})

// ── Key constants and matching ──

describe("Key constants", () => {
  test("modifier constants are power-of-2", () => {
    expect(ModShift).toBe(1)
    expect(ModAlt).toBe(2)
    expect(ModCtrl).toBe(4)
    expect(ModMeta).toBe(8)
  })

  test("special key constants are unique", () => {
    expect(KeyUp).not.toBe(KeyDown)
    expect(KeyLeft).not.toBe(KeyRight)
    expect(KeyEnter).not.toBe(KeyEscape)
  })

  test("F-key constants are defined", () => {
    expect(KeyF1).toBeDefined()
    expect(KeyF12).toBeDefined()
  })
})

describe("keyMatchString", () => {
  test("matches simple key", () => {
    const k: Key = { code: "a".charCodeAt(0), text: "a", mod: 0 }
    expect(keyMatchString(k, "a")).toBe(true)
  })

  test("matches ctrl+key", () => {
    const k: Key = { code: "c".charCodeAt(0), text: "", mod: ModCtrl }
    expect(keyMatchString(k, "ctrl+c")).toBe(true)
  })

  test("matches alt+key", () => {
    const k: Key = { code: "x".charCodeAt(0), text: "", mod: ModAlt }
    expect(keyMatchString(k, "alt+x")).toBe(true)
  })

  test("does not match wrong key", () => {
    const k: Key = { code: "a".charCodeAt(0), text: "a", mod: 0 }
    expect(keyMatchString(k, "b")).toBe(false)
  })
})

describe("keyString", () => {
  test("returns text for printable keys", () => {
    const k: Key = { code: "a".charCodeAt(0), text: "a", mod: 0 }
    expect(keyString(k)).toBe("a")
  })

  test("returns keystroke for special keys", () => {
    const k: Key = { code: KeyEnter, text: "", mod: 0 }
    expect(keyString(k)).toContain("enter")
  })
})

describe("keyKeystroke", () => {
  test("formats ctrl+key", () => {
    const k: Key = { code: "c".charCodeAt(0), text: "", mod: ModCtrl }
    expect(keyKeystroke(k)).toBe("ctrl+c")
  })

  test("formats alt+key", () => {
    const k: Key = { code: "x".charCodeAt(0), text: "", mod: ModAlt }
    expect(keyKeystroke(k)).toBe("alt+x")
  })

  test("formats special key", () => {
    const k: Key = { code: KeyEnter, text: "", mod: 0 }
    expect(keyKeystroke(k)).toBe("enter")
  })
})

// ── Border constants ──

describe("Borders", () => {
  test("NormalBorder has all corners", () => {
    expect(NormalBorder.topLeft).toBe("┌")
    expect(NormalBorder.topRight).toBe("┐")
    expect(NormalBorder.bottomLeft).toBe("└")
    expect(NormalBorder.bottomRight).toBe("┘")
  })

  test("RoundedBorder has rounded corners", () => {
    expect(RoundedBorder.topLeft).toBe("╭")
    expect(RoundedBorder.bottomRight).toBe("╯")
  })

  test("DoubleBorder has double lines", () => {
    expect(DoubleBorder.top).toBe("═")
    expect(DoubleBorder.left).toBe("║")
  })

  test("ThickBorder has thick lines", () => {
    expect(ThickBorder.top).toBe("━")
    expect(ThickBorder.left).toBe("┃")
  })

  test("HiddenBorder uses spaces", () => {
    expect(HiddenBorder.top).toBe(" ")
    expect(HiddenBorder.left).toBe(" ")
  })

  test("BlockBorder uses block chars", () => {
    expect(BlockBorder.top).toBe("█")
  })

  test("ASCIIBorder uses ASCII", () => {
    expect(ASCIIBorder.topLeft).toBe("+")
    expect(ASCIIBorder.left).toBe("|")
  })

  test("MarkdownBorder uses pipe", () => {
    expect(MarkdownBorder.left).toBe("|")
  })
})

// ── EventDecoder ──

describe("EventDecoder", () => {
  test("creates decoder", () => {
    const dec = new EventDecoder()
    expect(dec).toBeDefined()
  })

  test("feed and poll basic input", () => {
    const dec = new EventDecoder()
    dec.feed("a")
    const event = dec.poll()
    expect(event).not.toBeNull()
  })

  test("poll returns null on empty buffer", () => {
    const dec = new EventDecoder()
    expect(dec.poll()).toBeNull()
  })

  test("handles escape sequence", () => {
    const dec = new EventDecoder()
    dec.feed("\x1b[A")
    const event = dec.poll()
    expect(event).not.toBeNull()
  })
})

// ── Compat exports ──

describe("Compat exports", () => {
  test("ConvertStyle truecolor returns same style", () => {
    const s: Style = { bold: true, foreground: "#ff0000" }
    const result = ConvertStyle(s, "truecolor")
    expect(result).toEqual(s)
  })

  test("ConvertStyle noTTY returns empty", () => {
    const s: Style = { bold: true }
    const result = ConvertStyle(s, "noTTY")
    expect(result.bold).toBeUndefined()
  })

  test("ConvertStyle ascii strips colors", () => {
    const s: Style = { bold: true, foreground: "#ff0000", background: "#0000ff" }
    const result = ConvertStyle(s, "ascii")
    expect(result.bold).toBe(true)
    expect(result.foreground).toBeUndefined()
    expect(result.background).toBeUndefined()
  })

  test("styleDiff wrapper works", () => {
    const from: Style = { bold: true }
    const to: Style = { italic: true }
    const diff = styleDiff(from, to)
    expect(typeof diff).toBe("string")
  })

  test("attr constants are defined", () => {
    expect(AttrBold).toBe(1)
    expect(AttrItalic).toBe(4)
  })

  test("underline constants are defined", () => {
    expect(UnderlineNone).toBe("none")
    expect(UnderlineSingle).toBe("single")
  })

  test("NewBuffer creates Buffer", () => {
    const buf = NewBuffer(5, 5)
    expect(buf.Width()).toBe(5)
  })

  test("NewRenderBuffer creates RenderBuffer", () => {
    const rb = NewRenderBuffer(5, 5)
    expect(rb.Width()).toBe(5)
  })
})
