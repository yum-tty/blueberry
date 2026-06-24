// terminal.ts | terminal class (ultraviolet port)

import { type TerminalEvent, type WindowSizeEvent, type PasteEvent, type PasteStartEvent, type PasteEndEvent } from "./events"
import { type Key } from "./keys"
import { KeyUp, KeyDown, KeyLeft, KeyRight, KeyHome, KeyEnd, KeyPgUp, KeyPgDown, KeyDelete, KeyBackspace, KeyTab, KeyEnter, KeyEscape, KeySpace, KeyInsert, KeyExtended, KeyF1, KeyF2, KeyF3, KeyF4 } from "./keys"
import { ScreenBuffer } from "./buffer"

export interface TerminalOptions {
  bufferSize?: number
  eventTimeout?: number
}

const DEFAULT_BUFFER_SIZE = 4096
const DEFAULT_EVENT_TIMEOUT = 100

export class Terminal {
  private running = false
  private eventQueue: TerminalEvent[] = []
  private eventCallbacks: ((e: TerminalEvent) => void)[] = []
  private stdinListeners: ((chunk: Buffer) => void)[] = []
  private resizeListener: (() => void) | null = null
  private screenBuffer: ScreenBuffer | null = null
  private previousRawMode: boolean | undefined
  private pasteMode = false
  private pasteBuffer = ""

  constructor(private options?: TerminalOptions) {}

  async start(): Promise<void> {
    if (this.running) return
    this.running = true

    const stdin = process.stdin
    const stdout = process.stdout

    this.previousRawMode = stdin.isRaw
    if (typeof stdin.setRawMode === "function") {
      stdin.setRawMode(true)
    }

    stdin.resume()
    stdin.setEncoding("utf8")

    const onData = (chunk: Buffer) => {
      const events = this.decodeInput(chunk)
      for (const event of events) {
        this.eventQueue.push(event)
        for (const cb of this.eventCallbacks) {
          cb(event)
        }
      }
    }
    this.stdinListeners.push(onData)
    stdin.on("data", onData)

    const onResize = () => {
      const event: WindowSizeEvent = {
        type: "windowSize",
        width: stdout.columns || 80,
        height: stdout.rows || 24,
      }
      this.eventQueue.push(event)
      for (const cb of this.eventCallbacks) {
        cb(event)
      }
    }
    this.resizeListener = onResize
    process.on("resize", onResize)

    // Emit initial size
    onResize()

    // Create screen buffer
    this.screenBuffer = new ScreenBuffer(
      stdout.columns || 80,
      stdout.rows || 24,
    )
  }

  async stop(): Promise<void> {
    if (!this.running) return
    this.running = false

    const stdin = process.stdin

    for (const listener of this.stdinListeners) {
      stdin.removeListener("data", listener)
    }
    this.stdinListeners = []

    if (this.resizeListener) {
      process.removeListener("resize", this.resizeListener)
      this.resizeListener = null
    }

    if (typeof stdin.setRawMode === "function" && this.previousRawMode !== undefined) {
      stdin.setRawMode(this.previousRawMode)
    }

    stdin.pause()
  }

  async wait(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.running) {
        resolve()
        return
      }
      const check = () => {
        if (!this.running) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })
  }

  sendEvent(event: TerminalEvent): void {
    this.eventQueue.push(event)
    for (const cb of this.eventCallbacks) {
      cb(event)
    }
  }

  getScreen(): ScreenBuffer | null {
    return this.screenBuffer
  }

  onEvent(callback: (e: TerminalEvent) => void): () => void {
    this.eventCallbacks.push(callback)
    return () => {
      const idx = this.eventCallbacks.indexOf(callback)
      if (idx >= 0) this.eventCallbacks.splice(idx, 1)
    }
  }

  async *events(): AsyncGenerator<TerminalEvent> {
    while (this.running) {
      if (this.eventQueue.length > 0) {
        yield this.eventQueue.shift()!
      } else {
        await new Promise<void>(resolve => {
          const timeout = setTimeout(resolve, 50)
          const check = () => {
            if (this.eventQueue.length > 0) {
              clearTimeout(timeout)
              resolve()
            } else if (this.running) {
              setTimeout(check, 10)
            } else {
              clearTimeout(timeout)
              resolve()
            }
          }
          check()
        })
      }
    }
    while (this.eventQueue.length > 0) {
      yield this.eventQueue.shift()!
    }
  }

  async read(buffer: Uint8Array): Promise<number> {
    return new Promise((resolve, reject) => {
      process.stdin.once("data", (chunk: Buffer) => {
        const bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        const len = Math.min(bytes.length, buffer.length)
        buffer.set(bytes.subarray(0, len))
        resolve(len)
      })
    })
  }

  async write(data: Uint8Array | string): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = process.stdout
      const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data)
      stream.write(buf, (err) => {
        if (err) reject(err)
        else resolve(buf.length)
      })
    })
  }

  private decodeInput(chunk: Buffer): TerminalEvent[] {
    const events: TerminalEvent[] = []
    const str = chunk.toString("latin1")
    let i = 0

    while (i < str.length) {
      const ch = str.charCodeAt(i)

      if (this.pasteMode) {
        const escIdx = str.indexOf("\x1b", i)
        if (escIdx === -1) {
          this.pasteBuffer += str.slice(i)
          i = str.length
          continue
        }
        if (escIdx > i) {
          this.pasteBuffer += str.slice(i, escIdx)
          i = escIdx
        }
        const seq = str.slice(i, i + 6)
        if (seq === "\x1b[201~") {
          i += 6
          this.pasteMode = false
          events.push({ type: "paste", content: this.pasteBuffer })
          events.push({ type: "pasteEnd" })
          this.pasteBuffer = ""
        } else {
          this.pasteBuffer += str[i]!
          i++
        }
        continue
      }

      if (ch === 0x1B) {
        i++
        if (i >= str.length) {
          events.push({ type: "keyPress", key: { code: KeyEscape, text: "", mod: 0 } })
          break
        }

        const next = str.charCodeAt(i)
        if (next === 0x5B) {
          i++
          let params = ""
          while (i < str.length) {
            const c = str.charCodeAt(i)
            if (c >= 0x30 && c <= 0x3F) {
              params += str[i]
              i++
            } else {
              break
            }
          }

          if (i < str.length) {
            const final = str.charCodeAt(i)
            i++

            if (final === 0x75) {
              const parts = params.split(";")
              const codepoint = parseInt(parts[0]!) || 0
              const mod = parts.length > 1 ? (parseInt(parts[1]!) || 1) - 1 : 0
              let keyCode = codepoint
              if (codepoint >= 57344 && codepoint <= 63743) {
                keyCode = KeyExtended + (codepoint - 57344)
              }
              events.push({
                type: "keyPress",
                key: { code: keyCode, text: codepoint < 128 ? String.fromCodePoint(codepoint) : "", mod },
              })
            } else if (final === 0x41) {
              events.push({ type: "keyPress", key: { code: KeyUp, text: "", mod: 0 } })
            } else if (final === 0x42) {
              events.push({ type: "keyPress", key: { code: KeyDown, text: "", mod: 0 } })
            } else if (final === 0x43) {
              events.push({ type: "keyPress", key: { code: KeyRight, text: "", mod: 0 } })
            } else if (final === 0x44) {
              events.push({ type: "keyPress", key: { code: KeyLeft, text: "", mod: 0 } })
            } else if (final === 0x48) {
              events.push({ type: "keyPress", key: { code: KeyHome, text: "", mod: 0 } })
            } else if (final === 0x46) {
              events.push({ type: "keyPress", key: { code: KeyEnd, text: "", mod: 0 } })
            } else if (final === 0x5A) {
              events.push({ type: "keyPress", key: { code: KeyTab, text: "", mod: 1 } })
            } else if (final === 0x7E) {
              const n = parseInt(params) || 0
              if (n === 200) {
                this.pasteMode = true
                events.push({ type: "pasteStart" })
              } else if (n === 201) {
                events.push({ type: "pasteEnd" })
              } else if (n === 1 || n === 7) {
                events.push({ type: "keyPress", key: { code: KeyHome, text: "", mod: 0 } })
              } else if (n === 4 || n === 8) {
                events.push({ type: "keyPress", key: { code: KeyEnd, text: "", mod: 0 } })
              } else if (n === 2) {
                events.push({ type: "keyPress", key: { code: KeyInsert, text: "", mod: 0 } })
              } else if (n === 3) {
                events.push({ type: "keyPress", key: { code: KeyDelete, text: "", mod: 0 } })
              } else if (n === 5) {
                events.push({ type: "keyPress", key: { code: KeyPgUp, text: "", mod: 0 } })
              } else if (n === 6) {
                events.push({ type: "keyPress", key: { code: KeyPgDown, text: "", mod: 0 } })
              } else if (n >= 11 && n <= 24) {
                const code = KeyF1 + (n - 11)
                events.push({ type: "keyPress", key: { code, text: "", mod: 0 } })
              }
            } else if (final === 0x4D || final === 0x6D) {
              if (params.startsWith("<")) {
                const parts = params.slice(1).split(";")
                if (parts.length >= 3) {
                  const btnCode = parseInt(parts[0]!) || 0
                  const x = (parseInt(parts[1]!) || 1) - 1
                  const y = (parseInt(parts[2]!) || 1) - 1
                  const mod = (btnCode >> 2) & 0x1F
                  const btn = btnCode & 0x03
                  const isRelease = final === 0x6D

                  if (btnCode & 0x40) {
                    events.push({
                      type: isRelease ? "mouseRelease" : "mouseWheel",
                      mouse: { x, y, button: btn + 4, mod },
                    })
                  } else if (isRelease) {
                    events.push({
                      type: "mouseRelease",
                      mouse: { x, y, button: btn + 1, mod },
                    })
                  } else {
                    events.push({
                      type: "mouseClick",
                      mouse: { x, y, button: btn + 1, mod },
                    })
                  }
                }
              } else {
                const parts = params.split(";")
                if (parts.length >= 3) {
                  const btnCode = parseInt(parts[0]!) || 0
                  const x = (parseInt(parts[1]!) || 1) - 1
                  const y = (parseInt(parts[2]!) || 1) - 1
                  const mod = (btnCode >> 2) & 0x1F
                  const btn = btnCode & 0x03
                  const isRelease = final === 0x6D

                  if (btnCode & 0x40) {
                    events.push({
                      type: isRelease ? "mouseRelease" : "mouseWheel",
                      mouse: { x, y, button: btn + 4, mod },
                    })
                  } else if (isRelease) {
                    events.push({
                      type: "mouseRelease",
                      mouse: { x, y, button: btn + 1, mod },
                    })
                  } else {
                    events.push({
                      type: "mouseClick",
                      mouse: { x, y, button: btn + 1, mod },
                    })
                  }
                }
              }
            } else if (final === 0x52) {
              const parts = params.split(";")
              if (parts.length === 2) {
                events.push({
                  type: "cursorPosition",
                  y: (parseInt(parts[0]!) || 1) - 1,
                  x: (parseInt(parts[1]!) || 1) - 1,
                })
              }
            } else if (final === 0x4D) {
              if (i + 3 <= str.length) {
                const b = str.charCodeAt(i) - 32
                const cx = str.charCodeAt(i + 1) - 32
                const cy = str.charCodeAt(i + 2) - 32
                i += 3

                const mod = (b >> 2) & 0x1F
                const btnBits = b & 0x03
                const isRelease = btnBits === 3
                const isMotion = (b & 0x20) !== 0
                const isWheel = (b & 0x40) !== 0

                if (isWheel) {
                  events.push({
                    type: "mouseWheel",
                    mouse: { x: cx - 1, y: cy - 1, button: btnBits + 4, mod },
                  })
                } else if (isMotion) {
                  events.push({
                    type: "mouseMotion",
                    mouse: { x: cx - 1, y: cy - 1, button: btnBits + 1, mod },
                  })
                } else if (isRelease) {
                  events.push({
                    type: "mouseRelease",
                    mouse: { x: cx - 1, y: cy - 1, button: 0, mod },
                  })
                } else {
                  events.push({
                    type: "mouseClick",
                    mouse: { x: cx - 1, y: cy - 1, button: btnBits + 1, mod },
                  })
                }
              }
            }
          }
        } else if (next === 0x4F) {
          i++
          if (i < str.length) {
            const final = str.charCodeAt(i)
            i++
            if (final === 0x50) events.push({ type: "keyPress", key: { code: KeyF1, text: "", mod: 0 } })
            else if (final === 0x51) events.push({ type: "keyPress", key: { code: KeyF2, text: "", mod: 0 } })
            else if (final === 0x52) events.push({ type: "keyPress", key: { code: KeyF3, text: "", mod: 0 } })
            else if (final === 0x53) events.push({ type: "keyPress", key: { code: KeyF4, text: "", mod: 0 } })
            else if (final === 0x41) events.push({ type: "keyPress", key: { code: KeyUp, text: "", mod: 0 } })
            else if (final === 0x42) events.push({ type: "keyPress", key: { code: KeyDown, text: "", mod: 0 } })
            else if (final === 0x43) events.push({ type: "keyPress", key: { code: KeyRight, text: "", mod: 0 } })
            else if (final === 0x44) events.push({ type: "keyPress", key: { code: KeyLeft, text: "", mod: 0 } })
            else if (final === 0x48) events.push({ type: "keyPress", key: { code: KeyHome, text: "", mod: 0 } })
            else if (final === 0x46) events.push({ type: "keyPress", key: { code: KeyEnd, text: "", mod: 0 } })
            else if (final === 0x5A) events.push({ type: "keyPress", key: { code: KeyTab, text: "", mod: 1 } })
          }
        } else if (next === 0x5D) {
          i++
          let cmd = -1
          let cmdStr = ""
          while (i < str.length && str.charCodeAt(i) >= 0x30 && str.charCodeAt(i) <= 0x39) {
            cmdStr += str[i]
            i++
          }

          if (cmdStr.length > 0) {
            cmd = parseInt(cmdStr, 10)
          }

          if (i < str.length && str.charCodeAt(i) === 0x3B) {
            i++
          }

          let data = ""
          while (i < str.length) {
            const c = str.charCodeAt(i)
            if (c === 0x07 || c === 0x1B) {
              if (c === 0x1B) {
                i++
                if (i < str.length && str.charCodeAt(i) === 0x5C) {
                  i++
                }
              } else {
                i++
              }
              break
            }
            data += str[i]
            i++
          }

          if (cmd === 0) {
            events.push({ type: "unknown", raw: `OSC 0: ${data}` })
          } else if (cmd === 8) {
            const parts = data.split(";")
            if (parts.length >= 3) {
              events.push({ type: "unknown", raw: `OSC 8: ${parts[2]}` })
            }
          }
        } else if (next >= 0x61 && next <= 0x7A) {
          events.push({
            type: "keyPress",
            key: { code: next, text: "", mod: 2 },
          })
          i++
        } else if (next === 0x1B) {
          events.push({ type: "keyPress", key: { code: KeyEscape, text: "", mod: 0 } })
        } else {
          events.push({ type: "keyPress", key: { code: next, text: "", mod: 2 } })
          i++
        }
      } else if (ch === 0x0D || ch === 0x0A) {
        events.push({ type: "keyPress", key: { code: KeyEnter, text: "", mod: 0 } })
        i++
      } else if (ch === 0x09) {
        events.push({ type: "keyPress", key: { code: KeyTab, text: "", mod: 0 } })
        i++
      } else if (ch === 0x7F || ch === 0x08) {
        events.push({ type: "keyPress", key: { code: KeyBackspace, text: "", mod: 0 } })
        i++
      } else if (ch >= 0x01 && ch <= 0x1A) {
        events.push({ type: "keyPress", key: { code: ch + 0x60, text: "", mod: 4 } })
        i++
      } else {
        events.push({ type: "keyPress", key: { code: ch, text: str[i], mod: 0 } })
        i++
      }
    }

    return events
  }
}
