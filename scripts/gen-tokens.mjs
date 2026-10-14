// S3 토큰 적용: docs/tokens.json → app/src/styles/tokens.css 를 기계적으로 만든다.
// 이름 규칙: 토큰 이름의 "/" → "-" 후 "--" 접두. semantic 은 alias 를 var(--primitive) 로 남긴다.
// 텍스트 스타일은 .ts-<이름> 클래스로 만든다. (예: heading/h1 → .ts-heading-h1)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SRC = join(ROOT, "docs", "tokens.json")
const OUT = join(ROOT, "app", "src", "styles", "tokens.css")

export const HEADER = "/* AUTO-GENERATED from docs/tokens.json — DO NOT EDIT */"
export const varName = (name) => `--${name.replaceAll("/", "-")}`
export const className = (name) => `ts-${name.replaceAll("/", "-")}`

export function cssValue(tok) {
  const v = tok.values.Default
  if (tok.type === "color") return typeof v === "object" ? `var(${varName(v.alias.replace(/^primitive\//, ""))})` : v
  if (tok.type === "float") return `${v}px`
  return `"${v}"`
}

export function render(tokens) {
  const lines = [HEADER, ":root {"]
  for (const tok of tokens.tokens) lines.push(`  ${varName(tok.name)}: ${cssValue(tok)};`)
  lines.push("}", "")
  for (const s of tokens.textStyles) {
    const size =
      typeof s.fontSize === "object"
        ? `var(${varName(s.fontSize.variable.replace(/^typography\//, ""))})`
        : `${s.fontSize}px`
    const family = `var(${varName(s.fontFamily.variable.replace(/^typography\//, ""))})`
    lines.push(
      `.${className(s.name)} {`,
      `  font-family: ${family};`,
      `  font-size: ${size};`,
      `  font-weight: ${s.fontWeight};`,
      `  line-height: ${s.lineHeight}px;`,
      `  letter-spacing: ${s.letterSpacing};`,
      "}",
    )
  }
  return lines.join("\n") + "\n"
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tokens = JSON.parse(readFileSync(SRC, "utf8"))
  const names = tokens.tokens.map((t) => varName(t.name))
  const dup = names.filter((n, i) => names.indexOf(n) !== i)
  if (dup.length) {
    console.error(`CSS 변수 이름 충돌: ${dup.join(", ")}`)
    process.exit(1)
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, render(tokens))
  console.log(`wrote ${OUT} (vars=${tokens.tokens.length}, textStyles=${tokens.textStyles.length})`)
}
