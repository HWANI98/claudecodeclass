#!/usr/bin/env node
// 하네스 게이트 진입점.
//   node checks/run.mjs G1
//   node checks/run.mjs G4 --screen /plans
//   node checks/run.mjs G5
// 결과: harness/out/05-report.json (매번 덮어씀). 종료 코드 0 = 통과, 1 = 실패, 2 = 사용법 오류.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import { tmpdir } from "node:os"
import { ROOT, SCAN_EXT, TOKENS_CSS, loadAllowed, scanText } from "./lib/token-scan.mjs"
import { g1 } from "./g1-spec.mjs"
import { g3 } from "./g3-tokens.mjs"

const APP = join(ROOT, "app")
const OUT = join(ROOT, "harness", "out")
const rel = (p) => relative(ROOT, p).replaceAll("\\", "/")

// 화면 라우트 → 판정 테스트 파일. 다른 PRD 로 바꿔 끼우면 이 표와 checks/prd/ 만 바꾼다.
export const SCREEN_TESTS = {
  "/plans": "checks/prd/plans.test.ts",
  "/plans/[id]": "checks/prd/detail.test.ts",
  "/apply": "checks/prd/apply.test.ts",
  "/complete": "checks/prd/complete.test.ts",
}

const results = []
const add = (code, ok, message, extra = {}) => results.push({ code, ok, message, ...extra })
const tail = (s, n = 1500) => (s.length > n ? "…" + s.slice(-n) : s)

function sh(cmd, cwd = APP) {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` }
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === "node_modules" ? [] : walk(join(dir, e.name))) : [join(dir, e.name)],
  )
}

function appReady() {
  const ok = existsSync(join(APP, "package.json")) && existsSync(join(APP, "node_modules"))
  add("ROUTE-DEPS", ok, ok ? "app/node_modules 있음" : "app/ 또는 app/node_modules 없음 — S2 설치 필요")
  return ok
}

function build() {
  const r = sh("npx --no-install vite build")
  add("BUILD-VITE", r.code === 0, r.code === 0 ? "vite build 0" : tail(r.out))
}

function lint() {
  const t = sh("npx --no-install tsc --noEmit")
  add("LINT-TSC", t.code === 0, t.code === 0 ? "tsc --noEmit 0" : tail(t.out))
  const f = sh("npx --no-install oxfmt --check src")
  add("LINT-FMT", f.code === 0, f.code === 0 ? "oxfmt --check 0" : tail(f.out))
}

function tokenScan() {
  const allowed = loadAllowed()
  const hits = []
  for (const file of walk(join(APP, "src"))) {
    if (!SCAN_EXT.test(file) || rel(file) === TOKENS_CSS) continue
    for (const v of scanText(readFileSync(file, "utf8"), allowed)) hits.push({ file: rel(file), ...v })
  }
  add(
    "TOKEN-SCAN",
    hits.length === 0,
    hits.length ? `토큰 밖 값 ${hits.length}건` : "토큰 밖 값 0건",
    hits.length ? { violations: hits.slice(0, 50) } : {},
  )
}

function strikeSource() {
  const hits = []
  for (const file of walk(join(APP, "src"))) {
    if (!SCAN_EXT.test(file) || rel(file) === TOKENS_CSS) continue
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((ln, i) => {
        if (/line-through|<\s*(?:s|del|strike)[\s>]/.test(ln)) hits.push(`${rel(file)}:${i + 1}`)
      })
  }
  add("PRD-PRICE-STRIKE-SRC", hits.length === 0, hits.length ? `취소선 코드: ${hits.join(", ")}` : "취소선 코드 0건")
}

function vitest(files, loadCode) {
  const outFile = join(tmpdir(), `harness-vitest-${process.pid}.json`)
  rmSync(outFile, { force: true })
  const r = sh(
    `npx --no-install vitest run --config ../checks/vitest.config.mjs --reporter=json --outputFile="${outFile}" ${files.join(" ")}`,
  )
  if (!existsSync(outFile)) {
    add(loadCode, false, `vitest 실행 실패: ${tail(r.out)}`)
    return
  }
  const json = JSON.parse(readFileSync(outFile, "utf8"))
  rmSync(outFile, { force: true })
  const byCode = new Map()
  for (const file of json.testResults ?? []) {
    const asserts = file.assertionResults ?? []
    if (asserts.length === 0) {
      add(loadCode, false, `${rel(file.name)} 로드 실패: ${tail(file.message ?? "", 800)}`, { file: rel(file.name) })
      continue
    }
    for (const a of asserts) {
      const code = a.title.split(/\s/)[0]
      const g = byCode.get(code) ?? { ok: true, msgs: [], file: rel(file.name) }
      if (a.status !== "passed") {
        g.ok = false
        g.msgs.push(`${a.title}: ${tail((a.failureMessages ?? []).join("\n").split("\n    at ")[0], 600)}`)
      }
      byCode.set(code, g)
    }
  }
  for (const [code, g] of byCode) add(code, g.ok, g.ok ? "통과" : g.msgs.join(" | "), { file: g.file })
}

function g2() {
  let spec = null
  try {
    spec = JSON.parse(readFileSync(join(OUT, "01-spec.json"), "utf8"))
  } catch {
    add("SPEC-MISSING", false, "01-spec.json 없음/파싱 실패 — S1부터")
    return false
  }
  const missing = spec.screens.map((s) => `app/src/screens/${s.file}`).filter((f) => !existsSync(join(ROOT, f)))
  add("ROUTE-FILES", missing.length === 0, missing.length ? `화면 파일 없음: ${missing.join(", ")}` : `화면 파일 ${spec.screens.length}개 있음`)
  let pkg = {}
  try {
    pkg = JSON.parse(readFileSync(join(APP, "package.json"), "utf8"))
  } catch {}
  const need = ["vitest", "jsdom", "@testing-library/react", "@testing-library/dom"]
  const lack = need.filter((d) => !pkg.devDependencies?.[d])
  add("ROUTE-DEVDEPS", lack.length === 0, lack.length ? `devDependencies 누락: ${lack.join(", ")}` : "테스트 의존성 있음")
  if (!appReady()) return false
  vitest(["checks/g2/routes.test.ts"], "ROUTE-LOAD")
  return true
}

function returnTo(fails) {
  const has = (re) => fails.some((r) => re.test(r.code))
  if (has(/^SPEC-/)) return "S1"
  if (has(/^ROUTE-/)) return "S2"
  if (has(/^TOKEN-CSS-/)) return "S3"
  return fails.length ? "S4" : null
}

// ---- main ----
const [gate, ...rest] = process.argv.slice(2)
// Git Bash(MSYS)는 "/plans" 를 "C:/Program Files/Git/plans" 로 바꿔 넘긴다 → 끝부분으로 라우트를 찾는다.
// "plans", "plans/[id]" 처럼 앞 "/" 없이 넘겨도 된다.
function normScreen(raw) {
  if (!raw) return null
  const s = raw.replaceAll("\\", "/")
  const hit = Object.keys(SCREEN_TESTS)
    .filter((k) => s === k || s === k.slice(1) || s.endsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return hit ?? raw
}
const screen = normScreen(rest.includes("--screen") ? rest[rest.indexOf("--screen") + 1] : null)

switch (gate) {
  case "G1":
    results.push(...g1())
    break
  case "G2":
    g2()
    break
  case "G3":
    results.push(...g3())
    break
  case "G4": {
    if (!screen || !SCREEN_TESTS[screen]) {
      console.error(`사용법: node checks/run.mjs G4 --screen <${Object.keys(SCREEN_TESTS).join("|")}>`)
      process.exit(2)
    }
    if (!appReady()) break
    build()
    lint()
    tokenScan()
    strikeSource()
    vitest([SCREEN_TESTS[screen]], "PRD-LOAD")
    break
  }
  case "G5": {
    if (!g2()) break
    results.push(...g3())
    build()
    lint()
    tokenScan()
    strikeSource()
    vitest(Object.values(SCREEN_TESTS), "PRD-LOAD")
    break
  }
  default:
    console.error("사용법: node checks/run.mjs <G1|G2|G3|G4|G5> [--screen <route>]")
    process.exit(2)
}

const fails = results.filter((r) => !r.ok)
const report = {
  gate,
  screen,
  ok: fails.length === 0,
  core_rule_failed: fails.some((r) => r.code.startsWith("PRD-PRICE")),
  return_to: returnTo(fails),
  at: new Date().toISOString(),
  results,
}
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, "05-report.json"), JSON.stringify(report, null, 2) + "\n")

for (const r of results) console.log(`${r.ok ? "O" : "X"} ${r.code}  ${r.ok ? "" : r.message.split("\n")[0].slice(0, 200)}`)
console.log(`\n${gate}${screen ? ` ${screen}` : ""}: ${report.ok ? "PASS" : `FAIL (${fails.length}) → return_to=${report.return_to}`}`)
process.exit(report.ok ? 0 : 1)
