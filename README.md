# Blueberry

<p>
    <a href="https://github.com/charmbracelet/ultraviolet"><img src="https://img.shields.io/badge/original-ultraviolet-blue" alt="Original Ultraviolet"></a>
    <a href="https://github.com/yum-tty/blueberry"><img src="https://img.shields.io/badge/port-blueberry-green" alt="Blueberry Port"></a>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-bun-black" alt="Bun Runtime"></a>
</p>

Cell-based terminal rendering primitives for Bun. A TypeScript port of [Ultraviolet](https://github.com/charmbracelet/ultraviolet).

Blueberry provides the core building blocks for building terminal user interfaces, including cell-based rendering, screen buffers, styled strings, and layout constraints.

## Installation

```bash
bun add github:yum-tty/blueberry
```

Or install from a specific package:

```bash
bun add blueberry
```

## Quick Start

```typescript
import { ScreenBuffer, TerminalRenderer, Context } from "blueberry"

// Create a renderer
const renderer = new TerminalRenderer()
renderer.init(true) // Enter alternate screen

// Create a buffer
const buffer = new ScreenBuffer(80, 24)

// Create a context
const ctx = new Context(buffer)

// Draw something
ctx.drawString("Hello, World!")
buffer.fill(0, 1, 80, 1, "─")

// Render to terminal
renderer.render(buffer)
```

## Features

### Cell-Based Rendering

```typescript
import { newCell, emptyCell, cellEquals } from "blueberry"

const cell = newCell("A", { bold: true, foreground: "#FF0000" })
const empty = emptyCell()

console.log(cellEquals(cell, empty)) // false
```

### Styled Strings

```typescript
import { StyledString } from "blueberry"

const styled = new StyledString("Hello", [
  { text: "Hello", style: { bold: true, foreground: "#FF0000" } },
])

console.log(styled.width()) // 5
console.log(styled.height()) // 1
```

### Screen Buffers

```typescript
import { ScreenBuffer } from "blueberry"

const buffer = new ScreenBuffer(80, 24)

// Set a cell
buffer.setCell(0, 0, { char: "A", style: null, width: 1 })

// Fill a region
buffer.fill(0, 0, 10, 5, "X", { background: "#FF0000" })

// Draw a string
buffer.drawString("Hello", 0, 0, { foreground: "#00FF00" })
```

### Terminal Renderer

```typescript
import { TerminalRenderer } from "blueberry"

const renderer = new TerminalRenderer()
renderer.init(true) // Enter alternate screen

// Render a view
renderer.render("Hello, World!")

// Clear the screen
renderer.clear()

// Restore terminal state
renderer.restore()
```

### Layout Constraints

```typescript
import { Len, Min, Max, Fill, Percent } from "blueberry/layout"

const constraint = Len(20)
const resolved = resolveConstraint(constraint, 100) // 20

const fill = Fill(0.5)
const resolved = resolveConstraint(fill, 100) // 50
```

### Screen Context

```typescript
import { Context } from "blueberry/screen"
import { ScreenBuffer } from "blueberry"

const buffer = new ScreenBuffer(80, 24)
const ctx = new Context(buffer)

ctx.moveTo(0, 0)
ctx.setStyle({ bold: true, foreground: "#FF0000" })
ctx.drawString("Hello!")
```

## API Reference

### Cell

| Function | Description |
|----------|-------------|
| `newCell(char, style?)` | Create a new cell |
| `emptyCell()` | Create an empty cell |
| `isZero(cell)` | Check if a cell is empty |
| `cellEquals(a, b)` | Compare two cells |

### StyledString

| Method | Description |
|--------|-------------|
| `width()` | Get the visible width |
| `height()` | Get the number of lines |
| `draw(setCell, bounds)` | Draw to a buffer |

### ScreenBuffer

| Method | Description |
|--------|-------------|
| `getWidth()` | Get buffer width |
| `getHeight()` | Get buffer height |
| `getCell(x, y)` | Get a cell |
| `setCell(x, y, cell)` | Set a cell |
| `clear()` | Clear the buffer |
| `resize(width, height)` | Resize the buffer |
| `equals(other)` | Compare buffers |
| `drawString(str, x, y, style?)` | Draw a string |
| `fill(x, y, w, h, char?, style?)` | Fill a region |

### TerminalRenderer

| Method | Description |
|--------|-------------|
| `init(altScreen)` | Initialize the renderer |
| `render(view)` | Render a frame |
| `clear()` | Clear the screen |
| `showCursor()` | Show the cursor |
| `hideCursor()` | Hide the cursor |
| `moveTo(x, y)` | Move the cursor |
| `getSize()` | Get terminal size |
| `restore()` | Restore terminal state |

### Context

| Method | Description |
|--------|-------------|
| `moveTo(x, y)` | Set position |
| `setStyle(style)` | Set style |
| `drawString(str)` | Draw string |
| `drawStyledString(str, style)` | Draw styled string |
| `clear()` | Clear screen |
| `fill(x, y, w, h, char?, style?)` | Fill region |

### Layout

| Function | Description |
|----------|-------------|
| `Len(value)` | Fixed length constraint |
| `Min(value)` | Minimum constraint |
| `Max(value)` | Maximum constraint |
| `Fill(ratio?)` | Fill available space |
| `Ratio(n, d)` | Ratio constraint |
| `Percent(value)` | Percent constraint |
| `resolveConstraint(c, available)` | Resolve constraint |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## License

[MIT](./LICENSE)

---

Based on [Ultraviolet](https://github.com/charmbracelet/ultraviolet) by [Charm](https://charm.sh).
