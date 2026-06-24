// keys.ts | key constants and modifiers (ultraviolet port)

export const ModShift = 1
export const ModAlt = 2
export const ModCtrl = 4
export const ModMeta = 8
export const ModHyper = 16
export const ModSuper = 32
export const ModCapsLock = 64
export const ModNumLock = 128
export const ModScrollLock = 256

export interface Key {
  code: number
  text: string
  mod: number
  shiftedCode?: number
  baseCode?: number
  isRepeat?: boolean
}

export function keyMatchString(k: Key, s: string): boolean {
  let mod = 0
  let code = 0
  let text = ""
  const parts = s.split("+")
  for (const part of parts) {
    switch (part) {
      case "ctrl": mod |= ModCtrl; break
      case "alt": mod |= ModAlt; break
      case "shift": mod |= ModShift; break
      case "meta": mod |= ModMeta; break
      case "hyper": mod |= ModHyper; break
      case "super": mod |= ModSuper; break
      case "capslock": mod |= ModCapsLock; break
      case "scrolllock": mod |= ModScrollLock; break
      case "numlock": mod |= ModNumLock; break
      default: {
        const mapped = stringKeyType[part]
        if (mapped !== undefined) {
          code = mapped
        } else if (part.length === 1) {
          code = part.codePointAt(0)!
        } else {
          code = KeyExtended
          text = part
        }
      }
    }
  }

  const smod = mod & ~(ModShift | ModCapsLock)
  if (smod === 0 && text === "" && code > 0x20 && code < 0x7F) {
    if (mod & ModShift || mod & ModCapsLock) {
      text = String.fromCodePoint(code).toUpperCase()
    } else {
      text = String.fromCodePoint(code)
    }
  }

  return (k.mod === mod && k.code === code) || (k.text !== "" && k.text === text)
}

export function keyString(k: Key): string {
  if (k.text.length > 0 && k.text !== " ") return k.text
  return keyKeystroke(k)
}

export function keyKeystroke(k: Key): string {
  let s = ""
  if (k.mod & ModCtrl) s += "ctrl+"
  if (k.mod & ModAlt) s += "alt+"
  if (k.mod & ModShift) s += "shift+"
  if (k.mod & ModMeta) s += "meta+"
  if (k.mod & ModHyper) s += "hyper+"
  if (k.mod & ModSuper) s += "super+"

  const name = keyTypeString[k.code]
  if (name) {
    s += name
  } else {
    let code = k.code
    if (k.baseCode) code = k.baseCode
    if (code === KeySpace) s += "space"
    else if (code === KeyExtended) s += k.text
    else s += String.fromCodePoint(code)
  }

  return s
}

// Special key constants
export const KeyExtended = 0x100000

// Navigation keys
export const KeyUp = KeyExtended + 1
export const KeyDown = KeyExtended + 2
export const KeyRight = KeyExtended + 3
export const KeyLeft = KeyExtended + 4
export const KeyBegin = KeyExtended + 5
export const KeyFind = KeyExtended + 6
export const KeyInsert = KeyExtended + 7
export const KeyDelete = KeyExtended + 8
export const KeySelect = KeyExtended + 9
export const KeyPgUp = KeyExtended + 10
export const KeyPgDown = KeyExtended + 11
export const KeyHome = KeyExtended + 12
export const KeyEnd = KeyExtended + 13

// Keypad keys
export const KeyKpEnter = KeyExtended + 14
export const KeyKpEqual = KeyExtended + 15
export const KeyKpMultiply = KeyExtended + 16
export const KeyKpPlus = KeyExtended + 17
export const KeyKpComma = KeyExtended + 18
export const KeyKpMinus = KeyExtended + 19
export const KeyKpDecimal = KeyExtended + 20
export const KeyKpDivide = KeyExtended + 21
export const KeyKp0 = KeyExtended + 22
export const KeyKp1 = KeyExtended + 23
export const KeyKp2 = KeyExtended + 24
export const KeyKp3 = KeyExtended + 25
export const KeyKp4 = KeyExtended + 26
export const KeyKp5 = KeyExtended + 27
export const KeyKp6 = KeyExtended + 28
export const KeyKp7 = KeyExtended + 29
export const KeyKp8 = KeyExtended + 30
export const KeyKp9 = KeyExtended + 31

// Kitty keypad keys
export const KeyKpSep = KeyExtended + 32
export const KeyKpUp = KeyExtended + 33
export const KeyKpDown = KeyExtended + 34
export const KeyKpLeft = KeyExtended + 35
export const KeyKpRight = KeyExtended + 36
export const KeyKpPgUp = KeyExtended + 37
export const KeyKpPgDown = KeyExtended + 38
export const KeyKpHome = KeyExtended + 39
export const KeyKpEnd = KeyExtended + 40
export const KeyKpInsert = KeyExtended + 41
export const KeyKpDelete = KeyExtended + 42
export const KeyKpBegin = KeyExtended + 43

// Function keys
export const KeyF1 = KeyExtended + 44
export const KeyF2 = KeyExtended + 45
export const KeyF3 = KeyExtended + 46
export const KeyF4 = KeyExtended + 47
export const KeyF5 = KeyExtended + 48
export const KeyF6 = KeyExtended + 49
export const KeyF7 = KeyExtended + 50
export const KeyF8 = KeyExtended + 51
export const KeyF9 = KeyExtended + 52
export const KeyF10 = KeyExtended + 53
export const KeyF11 = KeyExtended + 54
export const KeyF12 = KeyExtended + 55
export const KeyF13 = KeyExtended + 56
export const KeyF14 = KeyExtended + 57
export const KeyF15 = KeyExtended + 58
export const KeyF16 = KeyExtended + 59
export const KeyF17 = KeyExtended + 60
export const KeyF18 = KeyExtended + 61
export const KeyF19 = KeyExtended + 62
export const KeyF20 = KeyExtended + 63
export const KeyF21 = KeyExtended + 64
export const KeyF22 = KeyExtended + 65
export const KeyF23 = KeyExtended + 66
export const KeyF24 = KeyExtended + 67
export const KeyF25 = KeyExtended + 68
export const KeyF26 = KeyExtended + 69
export const KeyF27 = KeyExtended + 70
export const KeyF28 = KeyExtended + 71
export const KeyF29 = KeyExtended + 72
export const KeyF30 = KeyExtended + 73
export const KeyF31 = KeyExtended + 74
export const KeyF32 = KeyExtended + 75
export const KeyF33 = KeyExtended + 76
export const KeyF34 = KeyExtended + 77
export const KeyF35 = KeyExtended + 78
export const KeyF36 = KeyExtended + 79
export const KeyF37 = KeyExtended + 80
export const KeyF38 = KeyExtended + 81
export const KeyF39 = KeyExtended + 82
export const KeyF40 = KeyExtended + 83
export const KeyF41 = KeyExtended + 84
export const KeyF42 = KeyExtended + 85
export const KeyF43 = KeyExtended + 86
export const KeyF44 = KeyExtended + 87
export const KeyF45 = KeyExtended + 88
export const KeyF46 = KeyExtended + 89
export const KeyF47 = KeyExtended + 90
export const KeyF48 = KeyExtended + 91
export const KeyF49 = KeyExtended + 92
export const KeyF50 = KeyExtended + 93
export const KeyF51 = KeyExtended + 94
export const KeyF52 = KeyExtended + 95
export const KeyF53 = KeyExtended + 96
export const KeyF54 = KeyExtended + 97
export const KeyF55 = KeyExtended + 98
export const KeyF56 = KeyExtended + 99
export const KeyF57 = KeyExtended + 100
export const KeyF58 = KeyExtended + 101
export const KeyF59 = KeyExtended + 102
export const KeyF60 = KeyExtended + 103
export const KeyF61 = KeyExtended + 104
export const KeyF62 = KeyExtended + 105
export const KeyF63 = KeyExtended + 106

// Kitty extension keys
export const KeyCapsLock = KeyExtended + 107
export const KeyScrollLock = KeyExtended + 108
export const KeyNumLock = KeyExtended + 109
export const KeyPrintScreen = KeyExtended + 110
export const KeyPause = KeyExtended + 111
export const KeyMenu = KeyExtended + 112

// Media keys
export const KeyMediaPlay = KeyExtended + 113
export const KeyMediaPause = KeyExtended + 114
export const KeyMediaPlayPause = KeyExtended + 115
export const KeyMediaReverse = KeyExtended + 116
export const KeyMediaStop = KeyExtended + 117
export const KeyMediaFastForward = KeyExtended + 118
export const KeyMediaRewind = KeyExtended + 119
export const KeyMediaNext = KeyExtended + 120
export const KeyMediaPrev = KeyExtended + 121
export const KeyMediaRecord = KeyExtended + 122

export const KeyLowerVol = KeyExtended + 123
export const KeyRaiseVol = KeyExtended + 124
export const KeyMute = KeyExtended + 125

// Modifier keys
export const KeyLeftShift = KeyExtended + 126
export const KeyLeftAlt = KeyExtended + 127
export const KeyLeftCtrl = KeyExtended + 128
export const KeyLeftSuper = KeyExtended + 129
export const KeyLeftHyper = KeyExtended + 130
export const KeyLeftMeta = KeyExtended + 131
export const KeyRightShift = KeyExtended + 132
export const KeyRightAlt = KeyExtended + 133
export const KeyRightCtrl = KeyExtended + 134
export const KeyRightSuper = KeyExtended + 135
export const KeyRightHyper = KeyExtended + 136
export const KeyRightMeta = KeyExtended + 137
export const KeyIsoLevel3Shift = KeyExtended + 138
export const KeyIsoLevel5Shift = KeyExtended + 139

// C0 control keys
export const KeyBackspace = 0x7F
export const KeyTab = 0x09
export const KeyEnter = 0x0D
export const KeyReturn = KeyEnter
export const KeyEscape = 0x1B
export const KeyEsc = KeyEscape
export const KeySpace = 0x20

const keyTypeString: Record<number, string> = {
  [KeyEnter]: "enter",
  [KeyTab]: "tab",
  [KeyBackspace]: "backspace",
  [KeyEscape]: "esc",
  [KeySpace]: "space",
  [KeyUp]: "up",
  [KeyDown]: "down",
  [KeyLeft]: "left",
  [KeyRight]: "right",
  [KeyBegin]: "begin",
  [KeyFind]: "find",
  [KeyInsert]: "insert",
  [KeyDelete]: "delete",
  [KeySelect]: "select",
  [KeyPgUp]: "pgup",
  [KeyPgDown]: "pgdown",
  [KeyHome]: "home",
  [KeyEnd]: "end",
  [KeyKpEnter]: "enter",
  [KeyKpEqual]: "equal",
  [KeyKpMultiply]: "mul",
  [KeyKpPlus]: "plus",
  [KeyKpComma]: "comma",
  [KeyKpMinus]: "minus",
  [KeyKpDecimal]: "period",
  [KeyKpDivide]: "div",
  [KeyKp0]: "0",
  [KeyKp1]: "1",
  [KeyKp2]: "2",
  [KeyKp3]: "3",
  [KeyKp4]: "4",
  [KeyKp5]: "5",
  [KeyKp6]: "6",
  [KeyKp7]: "7",
  [KeyKp8]: "8",
  [KeyKp9]: "9",
  [KeyKpSep]: "sep",
  [KeyKpUp]: "up",
  [KeyKpDown]: "down",
  [KeyKpLeft]: "left",
  [KeyKpRight]: "right",
  [KeyKpPgUp]: "pgup",
  [KeyKpPgDown]: "pgdown",
  [KeyKpHome]: "home",
  [KeyKpEnd]: "end",
  [KeyKpInsert]: "insert",
  [KeyKpDelete]: "delete",
  [KeyKpBegin]: "begin",
  [KeyF1]: "f1",
  [KeyF2]: "f2",
  [KeyF3]: "f3",
  [KeyF4]: "f4",
  [KeyF5]: "f5",
  [KeyF6]: "f6",
  [KeyF7]: "f7",
  [KeyF8]: "f8",
  [KeyF9]: "f9",
  [KeyF10]: "f10",
  [KeyF11]: "f11",
  [KeyF12]: "f12",
  [KeyF13]: "f13",
  [KeyF14]: "f14",
  [KeyF15]: "f15",
  [KeyF16]: "f16",
  [KeyF17]: "f17",
  [KeyF18]: "f18",
  [KeyF19]: "f19",
  [KeyF20]: "f20",
  [KeyF21]: "f21",
  [KeyF22]: "f22",
  [KeyF23]: "f23",
  [KeyF24]: "f24",
  [KeyF25]: "f25",
  [KeyF26]: "f26",
  [KeyF27]: "f27",
  [KeyF28]: "f28",
  [KeyF29]: "f29",
  [KeyF30]: "f30",
  [KeyF31]: "f31",
  [KeyF32]: "f32",
  [KeyF33]: "f33",
  [KeyF34]: "f34",
  [KeyF35]: "f35",
  [KeyF36]: "f36",
  [KeyF37]: "f37",
  [KeyF38]: "f38",
  [KeyF39]: "f39",
  [KeyF40]: "f40",
  [KeyF41]: "f41",
  [KeyF42]: "f42",
  [KeyF43]: "f43",
  [KeyF44]: "f44",
  [KeyF45]: "f45",
  [KeyF46]: "f46",
  [KeyF47]: "f47",
  [KeyF48]: "f48",
  [KeyF49]: "f49",
  [KeyF50]: "f50",
  [KeyF51]: "f51",
  [KeyF52]: "f52",
  [KeyF53]: "f53",
  [KeyF54]: "f54",
  [KeyF55]: "f55",
  [KeyF56]: "f56",
  [KeyF57]: "f57",
  [KeyF58]: "f58",
  [KeyF59]: "f59",
  [KeyF60]: "f60",
  [KeyF61]: "f61",
  [KeyF62]: "f62",
  [KeyF63]: "f63",
  [KeyCapsLock]: "capslock",
  [KeyScrollLock]: "scrolllock",
  [KeyNumLock]: "numlock",
  [KeyPrintScreen]: "printscreen",
  [KeyPause]: "pause",
  [KeyMenu]: "menu",
  [KeyMediaPlay]: "mediaplay",
  [KeyMediaPause]: "mediapause",
  [KeyMediaPlayPause]: "mediaplaypause",
  [KeyMediaReverse]: "mediareverse",
  [KeyMediaStop]: "mediastop",
  [KeyMediaFastForward]: "mediafastforward",
  [KeyMediaRewind]: "mediarewind",
  [KeyMediaNext]: "medianext",
  [KeyMediaPrev]: "mediaprev",
  [KeyMediaRecord]: "mediarecord",
  [KeyLowerVol]: "lowervol",
  [KeyRaiseVol]: "raisevol",
  [KeyMute]: "mute",
  [KeyLeftShift]: "leftshift",
  [KeyLeftAlt]: "leftalt",
  [KeyLeftCtrl]: "leftctrl",
  [KeyLeftSuper]: "leftsuper",
  [KeyLeftHyper]: "lefthyper",
  [KeyLeftMeta]: "leftmeta",
  [KeyRightShift]: "rightshift",
  [KeyRightAlt]: "rightalt",
  [KeyRightCtrl]: "rightctrl",
  [KeyRightSuper]: "rightsuper",
  [KeyRightHyper]: "righthyper",
  [KeyRightMeta]: "rightmeta",
  [KeyIsoLevel3Shift]: "isolevel3shift",
  [KeyIsoLevel5Shift]: "isolevel5shift",
}

const stringKeyType: Record<string, number> = {
  enter: KeyEnter,
  tab: KeyTab,
  backspace: KeyBackspace,
  escape: KeyEscape,
  esc: KeyEscape,
  space: KeySpace,
  up: KeyUp,
  down: KeyDown,
  left: KeyLeft,
  right: KeyRight,
  begin: KeyBegin,
  find: KeyFind,
  insert: KeyInsert,
  delete: KeyDelete,
  select: KeySelect,
  pgup: KeyPgUp,
  pgdown: KeyPgDown,
  home: KeyHome,
  end: KeyEnd,
  kpenter: KeyKpEnter,
  kpequal: KeyKpEqual,
  kpmul: KeyKpMultiply,
  kpplus: KeyKpPlus,
  kpcomma: KeyKpComma,
  kpminus: KeyKpMinus,
  kpperiod: KeyKpDecimal,
  kpdiv: KeyKpDivide,
  kp0: KeyKp0,
  kp1: KeyKp1,
  kp2: KeyKp2,
  kp3: KeyKp3,
  kp4: KeyKp4,
  kp5: KeyKp5,
  kp6: KeyKp6,
  kp7: KeyKp7,
  kp8: KeyKp8,
  kp9: KeyKp9,
  kpsep: KeyKpSep,
  kpup: KeyKpUp,
  kpdown: KeyKpDown,
  kpleft: KeyKpLeft,
  kpright: KeyKpRight,
  kppgup: KeyKpPgUp,
  kppgdown: KeyKpPgDown,
  kphome: KeyKpHome,
  kpend: KeyKpEnd,
  kpinsert: KeyKpInsert,
  kpdelete: KeyKpDelete,
  kpbegin: KeyKpBegin,
  f1: KeyF1, f2: KeyF2, f3: KeyF3, f4: KeyF4, f5: KeyF5,
  f6: KeyF6, f7: KeyF7, f8: KeyF8, f9: KeyF9, f10: KeyF10,
  f11: KeyF11, f12: KeyF12, f13: KeyF13, f14: KeyF14, f15: KeyF15,
  f16: KeyF16, f17: KeyF17, f18: KeyF18, f19: KeyF19, f20: KeyF20,
  f21: KeyF21, f22: KeyF22, f23: KeyF23, f24: KeyF24, f25: KeyF25,
  f26: KeyF26, f27: KeyF27, f28: KeyF28, f29: KeyF29, f30: KeyF30,
  f31: KeyF31, f32: KeyF32, f33: KeyF33, f34: KeyF34, f35: KeyF35,
  f36: KeyF36, f37: KeyF37, f38: KeyF38, f39: KeyF39, f40: KeyF40,
  f41: KeyF41, f42: KeyF42, f43: KeyF43, f44: KeyF44, f45: KeyF45,
  f46: KeyF46, f47: KeyF47, f48: KeyF48, f49: KeyF49, f50: KeyF50,
  f51: KeyF51, f52: KeyF52, f53: KeyF53, f54: KeyF54, f55: KeyF55,
  f56: KeyF56, f57: KeyF57, f58: KeyF58, f59: KeyF59, f60: KeyF60,
  f61: KeyF61, f62: KeyF62, f63: KeyF63,
  capslock: KeyCapsLock,
  scrolllock: KeyScrollLock,
  numlock: KeyNumLock,
  printscreen: KeyPrintScreen,
  pause: KeyPause,
  menu: KeyMenu,
  mediaplay: KeyMediaPlay,
  mediapause: KeyMediaPause,
  mediaplaypause: KeyMediaPlayPause,
  mediareverse: KeyMediaReverse,
  mediastop: KeyMediaStop,
  mediafastforward: KeyMediaFastForward,
  mediarewind: KeyMediaRewind,
  medianext: KeyMediaNext,
  mediaprev: KeyMediaPrev,
  mediarecord: KeyMediaRecord,
  lowervol: KeyLowerVol,
  raisevol: KeyRaiseVol,
  mute: KeyMute,
  leftshift: KeyLeftShift,
  leftalt: KeyLeftAlt,
  leftctrl: KeyLeftCtrl,
  leftsuper: KeyLeftSuper,
  lefthyper: KeyLeftHyper,
  leftmeta: KeyLeftMeta,
  rightshift: KeyRightShift,
  rightalt: KeyRightAlt,
  rightctrl: KeyRightCtrl,
  rightsuper: KeyRightSuper,
  righthyper: KeyRightHyper,
  rightmeta: KeyRightMeta,
  isolevel3shift: KeyIsoLevel3Shift,
  isolevel5shift: KeyIsoLevel5Shift,
}
