// key_table.ts | CSI sequence to key lookup table (ultraviolet port)

import {
  Key,
  ModShift,
  ModAlt,
  ModCtrl,
  ModMeta,
  KeyUp,
  KeyDown,
  KeyLeft,
  KeyRight,
  KeyBegin,
  KeyFind,
  KeyInsert,
  KeyDelete,
  KeySelect,
  KeyPgUp,
  KeyPgDown,
  KeyHome,
  KeyEnd,
  KeyKpEnter,
  KeyKpEqual,
  KeyKpMultiply,
  KeyKpPlus,
  KeyKpComma,
  KeyKpMinus,
  KeyKpDecimal,
  KeyKpDivide,
  KeyKp0,
  KeyKp1,
  KeyKp2,
  KeyKp3,
  KeyKp4,
  KeyKp5,
  KeyKp6,
  KeyKp7,
  KeyKp8,
  KeyKp9,
  KeyF1,
  KeyF2,
  KeyF3,
  KeyF4,
  KeyF5,
  KeyF6,
  KeyF7,
  KeyF8,
  KeyF9,
  KeyF10,
  KeyF11,
  KeyF12,
  KeyF13,
  KeyF14,
  KeyF15,
  KeyF16,
  KeyF17,
  KeyF18,
  KeyF19,
  KeyF20,
  KeyBackspace,
  KeyTab,
  KeyEnter,
  KeyEscape,
  KeySpace,
} from "./keys"

function makeKey(code: number, mod: number = 0, text: string = ""): Key {
  return { code, mod, text }
}

function buildKeyTable(): Map<string, Key> {
  const table = new Map<string, Key>()

  // C0 control characters
  const nul = makeKey(KeySpace, ModCtrl)
  const tab = makeKey(KeyTab)
  const enter = makeKey(KeyEnter)
  const esc = makeKey(KeyEscape)
  const del = makeKey(KeyBackspace)

  table.set("\x00", nul)
  table.set("\x01", makeKey("a".codePointAt(0)!, ModCtrl))
  table.set("\x02", makeKey("b".codePointAt(0)!, ModCtrl))
  table.set("\x03", makeKey("c".codePointAt(0)!, ModCtrl))
  table.set("\x04", makeKey("d".codePointAt(0)!, ModCtrl))
  table.set("\x05", makeKey("e".codePointAt(0)!, ModCtrl))
  table.set("\x06", makeKey("f".codePointAt(0)!, ModCtrl))
  table.set("\x07", makeKey("g".codePointAt(0)!, ModCtrl))
  table.set("\x08", makeKey("h".codePointAt(0)!, ModCtrl))
  table.set("\x09", tab)
  table.set("\x0a", makeKey("j".codePointAt(0)!, ModCtrl))
  table.set("\x0b", makeKey("k".codePointAt(0)!, ModCtrl))
  table.set("\x0c", makeKey("l".codePointAt(0)!, ModCtrl))
  table.set("\x0d", enter)
  table.set("\x0e", makeKey("n".codePointAt(0)!, ModCtrl))
  table.set("\x0f", makeKey("o".codePointAt(0)!, ModCtrl))
  table.set("\x10", makeKey("p".codePointAt(0)!, ModCtrl))
  table.set("\x11", makeKey("q".codePointAt(0)!, ModCtrl))
  table.set("\x12", makeKey("r".codePointAt(0)!, ModCtrl))
  table.set("\x13", makeKey("s".codePointAt(0)!, ModCtrl))
  table.set("\x14", makeKey("t".codePointAt(0)!, ModCtrl))
  table.set("\x15", makeKey("u".codePointAt(0)!, ModCtrl))
  table.set("\x16", makeKey("v".codePointAt(0)!, ModCtrl))
  table.set("\x17", makeKey("w".codePointAt(0)!, ModCtrl))
  table.set("\x18", makeKey("x".codePointAt(0)!, ModCtrl))
  table.set("\x19", makeKey("y".codePointAt(0)!, ModCtrl))
  table.set("\x1a", makeKey("z".codePointAt(0)!, ModCtrl))
  table.set("\x1b", esc)
  table.set("\x1c", makeKey("\\".codePointAt(0)!, ModCtrl))
  table.set("\x1d", makeKey("]".codePointAt(0)!, ModCtrl))
  table.set("\x1e", makeKey("^".codePointAt(0)!, ModCtrl))
  table.set("\x1f", makeKey("_".codePointAt(0)!, ModCtrl))

  // Space and DEL
  table.set("\x20", makeKey(KeySpace, 0, " "))
  table.set("\x7f", del)

  // Shift+Tab
  table.set("\x1b[Z", makeKey(KeyTab, ModShift))

  // Home/Insert/Delete/End/PgUp/PgDown (CSI ~ sequences)
  table.set("\x1b[1~", makeKey(KeyFind))
  table.set("\x1b[2~", makeKey(KeyInsert))
  table.set("\x1b[3~", makeKey(KeyDelete))
  table.set("\x1b[4~", makeKey(KeySelect))
  table.set("\x1b[5~", makeKey(KeyPgUp))
  table.set("\x1b[6~", makeKey(KeyPgDown))
  table.set("\x1b[7~", makeKey(KeyHome))
  table.set("\x1b[8~", makeKey(KeyEnd))

  // Normal mode arrow/function keys
  table.set("\x1b[A", makeKey(KeyUp))
  table.set("\x1b[B", makeKey(KeyDown))
  table.set("\x1b[C", makeKey(KeyRight))
  table.set("\x1b[D", makeKey(KeyLeft))
  table.set("\x1b[E", makeKey(KeyBegin))
  table.set("\x1b[F", makeKey(KeyEnd))
  table.set("\x1b[H", makeKey(KeyHome))
  table.set("\x1b[P", makeKey(KeyF1))
  table.set("\x1b[Q", makeKey(KeyF2))
  table.set("\x1b[R", makeKey(KeyF3))
  table.set("\x1b[S", makeKey(KeyF4))

  // Application Cursor Key Mode (DECCKM)
  table.set("\x1bOA", makeKey(KeyUp))
  table.set("\x1bOB", makeKey(KeyDown))
  table.set("\x1bOC", makeKey(KeyRight))
  table.set("\x1bOD", makeKey(KeyLeft))
  table.set("\x1bOE", makeKey(KeyBegin))
  table.set("\x1bOF", makeKey(KeyEnd))
  table.set("\x1bOH", makeKey(KeyHome))
  table.set("\x1bOP", makeKey(KeyF1))
  table.set("\x1bOQ", makeKey(KeyF2))
  table.set("\x1bOR", makeKey(KeyF3))
  table.set("\x1bOS", makeKey(KeyF4))

  // Keypad Application Mode (DECKPAM)
  table.set("\x1bOM", makeKey(KeyKpEnter))
  table.set("\x1bOX", makeKey(KeyKpEqual))
  table.set("\x1bOj", makeKey(KeyKpMultiply))
  table.set("\x1bOk", makeKey(KeyKpPlus))
  table.set("\x1bOl", makeKey(KeyKpComma))
  table.set("\x1bOm", makeKey(KeyKpMinus))
  table.set("\x1bOn", makeKey(KeyKpDecimal))
  table.set("\x1bOo", makeKey(KeyKpDivide))
  table.set("\x1bOp", makeKey(KeyKp0))
  table.set("\x1bOq", makeKey(KeyKp1))
  table.set("\x1bOr", makeKey(KeyKp2))
  table.set("\x1bOs", makeKey(KeyKp3))
  table.set("\x1bOt", makeKey(KeyKp4))
  table.set("\x1bOu", makeKey(KeyKp5))
  table.set("\x1bOv", makeKey(KeyKp6))
  table.set("\x1bOw", makeKey(KeyKp7))
  table.set("\x1bOx", makeKey(KeyKp8))
  table.set("\x1bOy", makeKey(KeyKp9))

  // Function keys (CSI ~ sequences)
  table.set("\x1b[11~", makeKey(KeyF1))
  table.set("\x1b[12~", makeKey(KeyF2))
  table.set("\x1b[13~", makeKey(KeyF3))
  table.set("\x1b[14~", makeKey(KeyF4))
  table.set("\x1b[15~", makeKey(KeyF5))
  table.set("\x1b[17~", makeKey(KeyF6))
  table.set("\x1b[18~", makeKey(KeyF7))
  table.set("\x1b[19~", makeKey(KeyF8))
  table.set("\x1b[20~", makeKey(KeyF9))
  table.set("\x1b[21~", makeKey(KeyF10))
  table.set("\x1b[23~", makeKey(KeyF11))
  table.set("\x1b[24~", makeKey(KeyF12))
  table.set("\x1b[25~", makeKey(KeyF13))
  table.set("\x1b[26~", makeKey(KeyF14))
  table.set("\x1b[28~", makeKey(KeyF15))
  table.set("\x1b[29~", makeKey(KeyF16))
  table.set("\x1b[31~", makeKey(KeyF17))
  table.set("\x1b[32~", makeKey(KeyF18))
  table.set("\x1b[33~", makeKey(KeyF19))
  table.set("\x1b[34~", makeKey(KeyF20))

  // URxvt shift arrows
  table.set("\x1b[a", makeKey(KeyUp, ModShift))
  table.set("\x1b[b", makeKey(KeyDown, ModShift))
  table.set("\x1b[c", makeKey(KeyRight, ModShift))
  table.set("\x1b[d", makeKey(KeyLeft, ModShift))

  // URxvt ctrl arrows
  table.set("\x1bOa", makeKey(KeyUp, ModCtrl))
  table.set("\x1bOb", makeKey(KeyDown, ModCtrl))
  table.set("\x1bOc", makeKey(KeyRight, ModCtrl))
  table.set("\x1bOd", makeKey(KeyLeft, ModCtrl))

  // URxvt modifier CSI ~ keys
  const csiTildeKeys: Record<string, Key> = {
    "1": makeKey(KeyFind),
    "2": makeKey(KeyInsert),
    "3": makeKey(KeyDelete),
    "4": makeKey(KeySelect),
    "5": makeKey(KeyPgUp),
    "6": makeKey(KeyPgDown),
    "7": makeKey(KeyHome),
    "8": makeKey(KeyEnd),
    "11": makeKey(KeyF1),
    "12": makeKey(KeyF2),
    "13": makeKey(KeyF3),
    "14": makeKey(KeyF4),
    "15": makeKey(KeyF5),
    "17": makeKey(KeyF6),
    "18": makeKey(KeyF7),
    "19": makeKey(KeyF8),
    "20": makeKey(KeyF9),
    "21": makeKey(KeyF10),
    "23": makeKey(KeyF11),
    "24": makeKey(KeyF12),
    "25": makeKey(KeyF13),
    "26": makeKey(KeyF14),
    "28": makeKey(KeyF15),
    "29": makeKey(KeyF16),
    "31": makeKey(KeyF17),
    "32": makeKey(KeyF18),
    "33": makeKey(KeyF19),
    "34": makeKey(KeyF20),
  }

  for (const [k, v] of Object.entries(csiTildeKeys)) {
    // Shift
    table.set(`\x1b[${k}$`, { ...v, mod: ModShift })
    // Ctrl
    table.set(`\x1b[${k}^`, { ...v, mod: ModCtrl })
    // Shift+Ctrl
    table.set(`\x1b[${k}@`, { ...v, mod: ModShift | ModCtrl })
  }

  // URxvt F keys (shift maps to F11-F20)
  table.set("\x1b[23$", makeKey(KeyF11, ModShift))
  table.set("\x1b[24$", makeKey(KeyF12, ModShift))
  table.set("\x1b[25$", makeKey(KeyF13, ModShift))
  table.set("\x1b[26$", makeKey(KeyF14, ModShift))
  table.set("\x1b[28$", makeKey(KeyF15, ModShift))
  table.set("\x1b[29$", makeKey(KeyF16, ModShift))
  table.set("\x1b[31$", makeKey(KeyF17, ModShift))
  table.set("\x1b[32$", makeKey(KeyF18, ModShift))
  table.set("\x1b[33$", makeKey(KeyF19, ModShift))
  table.set("\x1b[34$", makeKey(KeyF20, ModShift))
  table.set("\x1b[11^", makeKey(KeyF1, ModCtrl))
  table.set("\x1b[12^", makeKey(KeyF2, ModCtrl))
  table.set("\x1b[13^", makeKey(KeyF3, ModCtrl))
  table.set("\x1b[14^", makeKey(KeyF4, ModCtrl))
  table.set("\x1b[15^", makeKey(KeyF5, ModCtrl))
  table.set("\x1b[17^", makeKey(KeyF6, ModCtrl))
  table.set("\x1b[18^", makeKey(KeyF7, ModCtrl))
  table.set("\x1b[19^", makeKey(KeyF8, ModCtrl))
  table.set("\x1b[20^", makeKey(KeyF9, ModCtrl))
  table.set("\x1b[21^", makeKey(KeyF10, ModCtrl))
  table.set("\x1b[23^", makeKey(KeyF11, ModCtrl))
  table.set("\x1b[24^", makeKey(KeyF12, ModCtrl))
  table.set("\x1b[25^", makeKey(KeyF13, ModCtrl))
  table.set("\x1b[26^", makeKey(KeyF14, ModCtrl))
  table.set("\x1b[28^", makeKey(KeyF15, ModCtrl))
  table.set("\x1b[29^", makeKey(KeyF16, ModCtrl))
  table.set("\x1b[31^", makeKey(KeyF17, ModCtrl))
  table.set("\x1b[32^", makeKey(KeyF18, ModCtrl))
  table.set("\x1b[33^", makeKey(KeyF19, ModCtrl))
  table.set("\x1b[34^", makeKey(KeyF20, ModCtrl))
  table.set("\x1b[23@", makeKey(KeyF11, ModShift | ModCtrl))
  table.set("\x1b[24@", makeKey(KeyF12, ModShift | ModCtrl))
  table.set("\x1b[25@", makeKey(KeyF13, ModShift | ModCtrl))
  table.set("\x1b[26@", makeKey(KeyF14, ModShift | ModCtrl))
  table.set("\x1b[28@", makeKey(KeyF15, ModShift | ModCtrl))
  table.set("\x1b[29@", makeKey(KeyF16, ModShift | ModCtrl))
  table.set("\x1b[31@", makeKey(KeyF17, ModShift | ModCtrl))
  table.set("\x1b[32@", makeKey(KeyF18, ModShift | ModCtrl))
  table.set("\x1b[33@", makeKey(KeyF19, ModShift | ModCtrl))
  table.set("\x1b[34@", makeKey(KeyF20, ModShift | ModCtrl))

  // Alt+<key> combinations (prefix existing entries with ESC)
  const tmap = new Map<string, Key>()
  for (const [seq, key] of table) {
    tmap.set("\x1b" + seq, { ...key, mod: key.mod | ModAlt })
  }
  for (const [seq, key] of tmap) {
    table.set(seq, key)
  }

  // XTerm modifiers
  const xtermModifiers = [
    ModShift,
    ModAlt,
    ModShift | ModAlt,
    ModCtrl,
    ModShift | ModCtrl,
    ModAlt | ModCtrl,
    ModShift | ModAlt | ModCtrl,
    ModMeta,
    ModMeta | ModShift,
    ModMeta | ModAlt,
    ModMeta | ModShift | ModAlt,
    ModMeta | ModCtrl,
    ModMeta | ModShift | ModCtrl,
    ModMeta | ModAlt | ModCtrl,
    ModMeta | ModShift | ModAlt | ModCtrl,
  ]

  // SS3 keypad function keys
  const ss3FuncKeys: Record<string, number> = {
    M: KeyKpEnter, X: KeyKpEqual,
    j: KeyKpMultiply, k: KeyKpPlus,
    l: KeyKpComma, m: KeyKpMinus,
    n: KeyKpDecimal, o: KeyKpDivide,
    p: KeyKp0, q: KeyKp1,
    r: KeyKp2, s: KeyKp3,
    t: KeyKp4, u: KeyKp5,
    v: KeyKp6, w: KeyKp7,
    x: KeyKp8, y: KeyKp9,
  }

  // CSI function keys
  const csiFuncKeys: Record<string, number> = {
    A: KeyUp, B: KeyDown,
    C: KeyRight, D: KeyLeft,
    E: KeyBegin, F: KeyEnd,
    H: KeyHome, P: KeyF1,
    Q: KeyF2, R: KeyF3,
    S: KeyF4,
  }

  // CSI 27 ; modifier ; code ~ (modifyOtherKeys)
  const modifyOtherKeys: Record<number, number> = {
    0x08: KeyBackspace,
    0x09: KeyTab,
    0x0d: KeyEnter,
    0x1b: KeyEscape,
    0x7f: KeyBackspace,
  }

  for (const m of xtermModifiers) {
    const xtermMod = String(m + 1)

    // CSI 1 ; <modifier> <func>
    for (const [k, v] of Object.entries(csiFuncKeys)) {
      table.set(`\x1b[1;${xtermMod}${k}`, makeKey(v, m))
    }
    // SS3 <modifier> <func>
    for (const [k, v] of Object.entries(ss3FuncKeys)) {
      table.set(`\x1bO${xtermMod}${k}`, makeKey(v, m))
    }
    // CSI <number> ; <modifier> ~
    for (const [k, v] of Object.entries(csiTildeKeys)) {
      table.set(`\x1b[${k};${xtermMod}~`, { ...v, mod: m })
    }
    // CSI 27 ; <modifier> ; <code> ~
    for (const [code, key] of Object.entries(modifyOtherKeys)) {
      table.set(`\x1b[27;${xtermMod};${code}~`, makeKey(key, m))
    }
  }

  return table
}

export const keyTable: Map<string, Key> = buildKeyTable()
