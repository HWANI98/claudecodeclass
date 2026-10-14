// 토큰 밖 값 검사기. 훅(.claude/hooks/guard-write.mjs)과 G4/G5(checks/run.mjs)가 같이 쓴다.
// 허용 기준은 docs/tokens.json 하나에서만 만든다.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

export function loadAllowed(tokensPath = join(ROOT, "docs", "tokens.json")) {
  const t = JSON.parse(readFileSync(tokensPath, "utf8"))
  const hex = new Set()
  const px = new Set([0])
  const spacing = new Set([0])
  for (const tok of t.tokens) {
    const v = tok.values.Default
    if (tok.type === "color") hex.add(String(typeof v === "object" ? v.resolved : v).toUpperCase())
    if (tok.type === "float" && ["spacing", "radius", "typography"].includes(tok.collection)) px.add(v)
    if (tok.collection === "spacing") spacing.add(v)
  }
  for (const s of t.textStyles) {
    px.add(typeof s.fontSize === "object" ? s.fontSize.resolved : s.fontSize)
    px.add(s.lineHeight)
  }
  return { hex, px, spacing }
}

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const COLOR_UTIL =
  "bg|text|border(?:-[trblxyse])?|outline|ring|ring-offset|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder"
const RE = {
  hex: /#[0-9a-fA-F]{3,8}\b/g,
  colorFn: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/g,
  px: /(-?\d+(?:\.\d+)?)px\b/g,
  rem: /(?<![\w-])\d+(?:\.\d+)?r?em\b/g,
  twArbitrary: /(?<![\w-])[a-z][\w:-]*-\[([^\]]+)\]/g,
  twPalette: new RegExp(
    `(?<![\\w-])(?:[a-z-]+:)*(?:${COLOR_UTIL})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|black|white)(?![\\w-])`,
    "g",
  ),
  twSpacing:
    /(?<![\w-])(?:[a-z-]+:)*-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|min-h|max-w|max-h|size|top|right|bottom|left|inset(?:-[xy])?|translate-[xy]|basis|scroll-[mp][xytrbl]?)-(\d+(?:\.\d+)?)(?![\w.-])/g,
  twRounded: /(?<![\w-])(?:[a-z-]+:)*rounded(?:-[trblse]{1,2})?-(xs|md)(?![\w-])/g,
  twText: /(?<![\w-])(?:[a-z-]+:)*text-([3-9]xl)(?![\w-])/g,
  styleNum:
    /\b(padding|margin|gap|rowGap|columnGap|width|height|minWidth|minHeight|maxWidth|maxHeight|top|left|right|bottom|inset|fontSize|borderRadius|borderWidth|letterSpacing)(?:Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd|TopLeftRadius|TopRightRadius|BottomLeftRadius|BottomRightRadius)?\s*:\s*(-?\d+(?:\.\d+)?)(?![\d.]|\s*(?:px|%|r?em|vh|vw|dvh|svh|fr|ch)\b)/g,
}
const WIDTHISH = /\b(?:max-|min-)?width\b|\b(?:max|min)?[wW]idth\s*:|(?<![\w-])(?:max-|min-)?w-/

// text: 검사할 문자열. 반환: [{ line, col, match, reason }]
export function scanText(text, allowed = loadAllowed()) {
  const out = []
  const lines = text.split(/\r?\n/)
  lines.forEach((ln, i) => {
    const push = (m, reason) => out.push({ line: i + 1, col: m.index + 1, match: m[0], reason })
    for (const m of ln.matchAll(RE.hex)) {
      if (!allowed.hex.has(m[0].toUpperCase())) push(m, "tokens.json에 없는 색")
    }
    for (const m of ln.matchAll(RE.colorFn)) push(m, "rgb()/hsl() 등 색 함수 금지 — var(--토큰) 사용")
    for (const m of ln.matchAll(RE.px)) {
      const n = Math.abs(Number(m[1]))
      if (n === 390 && WIDTHISH.test(ln)) continue
      if (n === 390 || !allowed.px.has(n)) push(m, `tokens.json에 없는 px 값 ${n}`)
    }
    for (const m of ln.matchAll(RE.rem)) push(m, "rem/em 단위 금지 — 토큰 px 또는 var(--토큰)")
    for (const m of ln.matchAll(RE.twArbitrary)) {
      if (!/^var\(--[\w-]+\)$/.test(m[1].trim())) push(m, "Tailwind 임의 값은 [var(--토큰)]만 허용")
    }
    for (const m of ln.matchAll(RE.twPalette)) push(m, "Tailwind 기본 팔레트 색 금지 — var(--토큰)")
    for (const m of ln.matchAll(RE.twSpacing)) {
      const n = Number(m[1]) * 4
      const isWidth = /(?:^|[:\s-])(?:max-|min-)?w-/.test(m[0]) || m[0].includes("size-")
      if (n === 390 && isWidth) continue
      if (n === 390 || !allowed.spacing.has(n)) push(m, `Tailwind 간격 ${m[1]}(=${n}px)은 spacing 토큰이 아님`)
    }
    for (const m of ln.matchAll(RE.twRounded)) push(m, "rounded-xs(2px)/md(6px)는 radius 토큰이 아님")
    for (const m of ln.matchAll(RE.twText)) push(m, "text-3xl 이상은 font-size 토큰이 아님")
    for (const m of ln.matchAll(RE.styleNum)) {
      const n = Math.abs(Number(m[2]))
      if (n === 390 && /width/i.test(m[1])) continue
      if (n === 390 || !allowed.px.has(n)) push(m, `style 숫자 ${n}(px)은 토큰이 아님`)
    }
  })
  return out
}

export const SCAN_EXT = /\.(?:tsx?|jsx?|css)$/
export const TOKENS_CSS = "app/src/styles/tokens.css"
