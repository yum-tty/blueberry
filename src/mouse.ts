// mouse.ts | mouse types (ultraviolet port)

export enum MouseMode {
  None = 0,
  Press = 1,
  Click = 2,
  Drag = 3,
  Motion = 4,
}

export enum MouseEncoding {
  Legacy = 0,
  SGR = 1,
  SGRPixel = 2,
}

export enum MouseButton {
  None = 0,
  Left = 1,
  Middle = 2,
  Right = 3,
  WheelUp = 4,
  WheelDown = 5,
  WheelLeft = 6,
  WheelRight = 7,
  Backward = 8,
  Forward = 9,
  Button10 = 10,
  Button11 = 11,
}

export interface Mouse {
  x: number
  y: number
  button: MouseButton
  mod: number
}

export function mouseString(m: Mouse): string {
  let s = ""
  if (m.mod & 4) s += "ctrl+"   // ModCtrl
  if (m.mod & 2) s += "alt+"    // ModAlt
  if (m.mod & 1) s += "shift+"  // ModShift

  const btn = mouseButtonString(m.button)
  if (btn === "") s += "unknown"
  else if (btn !== "none") s += btn

  return s
}

function mouseButtonString(b: MouseButton): string {
  switch (b) {
    case MouseButton.Left: return "left"
    case MouseButton.Middle: return "middle"
    case MouseButton.Right: return "right"
    case MouseButton.WheelUp: return "wheelup"
    case MouseButton.WheelDown: return "wheeldown"
    case MouseButton.WheelLeft: return "wheelleft"
    case MouseButton.WheelRight: return "wheelright"
    case MouseButton.Backward: return "backward"
    case MouseButton.Forward: return "forward"
    default: return ""
  }
}

export function mousePixelToCell(m: Mouse, ws: { col: number; row: number; xpixel: number; ypixel: number }): Mouse {
  let col = 0
  let row = 0
  if (ws.xpixel > 0) col = Math.floor(m.x * ws.col / ws.xpixel)
  if (ws.ypixel > 0) row = Math.floor(m.y * ws.row / ws.ypixel)
  return { x: col, y: row, button: m.button, mod: m.mod }
}
