// G3: app/src/styles/tokens.css 가 docs/tokens.json 과 1:1 인지 센다.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { ROOT } from "./lib/token-scan.mjs"
import { HEADER, className, cssValue, varName } from "../scripts/gen-tokens.mjs"

export function g3() {
  const res = []
  const add = (code, ok, message, extra = {}) => res.push({ code, ok, message, ...extra })
  const file = join(ROOT, "app", "src", "styles", "tokens.css")
  if (!existsSync(file)) {
    add("TOKEN-CSS-MISSING", false, "app/src/styles/tokens.css 없음 — node scripts/gen-tokens.mjs 실행 필요")
    return res
  }
  const css = readFileSync(file, "utf8")
  const tokens = JSON.parse(readFileSync(join(ROOT, "docs", "tokens.json"), "utf8"))

  add("TOKEN-CSS-HEADER", css.startsWith(HEADER), "첫 줄 자동 생성 표시")

  const vars = new Map([...css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]))
  add(
    "TOKEN-CSS-COUNT",
    vars.size === tokens.tokens.length,
    `CSS 변수 ${vars.size}개 / tokens.json ${tokens.tokens.length}개`,
  )
  const wrong = tokens.tokens.filter((t) => vars.get(varName(t.name)) !== cssValue(t))
  add(
    "TOKEN-CSS-VALUE",
    wrong.length === 0,
    wrong.length ? `값 불일치·누락: ${wrong.map((t) => varName(t.name)).join(", ")}` : "모든 변수 값 일치",
  )
  const extra = [...vars.keys()].filter((k) => !tokens.tokens.some((t) => varName(t.name) === k))
  add("TOKEN-CSS-EXTRA", extra.length === 0, extra.length ? `tokens.json에 없는 변수: ${extra.join(", ")}` : "추가 변수 없음")

  const classes = new Set([...css.matchAll(/^\.(ts-[\w-]+)\s*\{/gm)].map((m) => m[1]))
  const missing = tokens.textStyles.filter((s) => !classes.has(className(s.name)))
  add(
    "TOKEN-CSS-TEXTSTYLE",
    missing.length === 0 && classes.size === tokens.textStyles.length,
    `텍스트 스타일 ${classes.size}개 / tokens.json ${tokens.textStyles.length}개${missing.length ? ` 누락: ${missing.map((s) => s.name).join(", ")}` : ""}`,
  )
  return res
}
