// G1: harness/out/01-spec.json 이 docs/PRD.md · docs/screens.md 와 맞는지 센다.
// 기대값은 매번 문서에서 다시 뽑는다(하드코딩 없음) → docs 를 바꿔 끼워도 그대로 동작.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { ROOT } from "./lib/token-scan.mjs"

const num = (s) => (s.match(/\d[\d,]*/) ? Number(s.match(/\d[\d,]*/)[0].replaceAll(",", "")) : null)

export function parseScreens(md) {
  return md
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const name = block.split(/\r?\n/)[0].trim()
      const route = (block.match(/### 라우트\s*\r?\n\s*(\S+)/) || [])[1] ?? null
      const compBlock = (block.match(/### 구성 요소\s*\r?\n([\s\S]*?)(?=\r?\n###|$)/) || [])[1] ?? ""
      const components = [...compBlock.matchAll(/^- ([^:]+):/gm)].map((m) => m[1].trim())
      return { name, route, components }
    })
}

export function parsePrd(md) {
  const rulesBlock = (md.match(/### 어기면 안 되는 것[^\n]*\n([\s\S]*?)(?=\n---)/) || [])[1] ?? ""
  const rules = [...rulesBlock.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim())
  const recommended = new Set([...md.matchAll(/(p\d+)만 true/g)].map((m) => m[1]))
  const plans = [...md.matchAll(/^\|\s*(p\d+)\s*\|(.+)\|\s*$/gm)].map((m) => {
    const c = m[2].split("|").map((s) => s.trim())
    const [name, price, data, throttle, after, description] = c
    return {
      id: m[1],
      name,
      monthly_price: num(price),
      data,
      throttle_after: /제한 없음/.test(throttle) ? null : (throttle.match(/\d+\s*Mbps/) || [null])[0],
      price_after_discount: /없음/.test(after) ? null : num(after.replace(/^\D*\d+개월째부터/, "")),
      discount_months: (price.match(/(\d+)개월 할인/) || [])[1] ? Number(price.match(/(\d+)개월 할인/)[1]) : null,
      description,
      recommended: recommended.has(m[1]),
    }
  })
  return { rules, plans }
}

export function g1() {
  const res = []
  const add = (code, ok, message) => res.push({ code, ok, message, file: "harness/out/01-spec.json" })
  const specPath = join(ROOT, "harness", "out", "01-spec.json")
  if (!existsSync(specPath)) {
    add("SPEC-MISSING", false, "harness/out/01-spec.json 없음")
    return res
  }
  let spec
  try {
    spec = JSON.parse(readFileSync(specPath, "utf8"))
  } catch (e) {
    add("SPEC-JSON", false, `JSON 파싱 실패: ${e.message}`)
    return res
  }
  const screensMd = readFileSync(join(ROOT, "docs", "screens.md"), "utf8")
  const prdMd = readFileSync(join(ROOT, "docs", "PRD.md"), "utf8")
  const screens = parseScreens(screensMd)
  const prd = parsePrd(prdMd)

  const sScreens = Array.isArray(spec.screens) ? spec.screens : []
  add("SPEC-SCREEN-COUNT", sScreens.length === screens.length, `screens ${sScreens.length}개 / screens.md ${screens.length}개`)
  const routesOk = screens.every((s, i) => sScreens[i]?.route === s.route)
  add("SPEC-ROUTES", routesOk, `라우트 순서·값: spec=[${sScreens.map((s) => s.route)}] docs=[${screens.map((s) => s.route)}]`)
  const compMiss = screens.flatMap((s, i) =>
    s.components.filter((c) => !(sScreens[i]?.components ?? []).includes(c)).map((c) => `${s.route}:${c}`),
  )
  add("SPEC-COMPONENTS", compMiss.length === 0, compMiss.length ? `구성 요소 누락: ${compMiss.join(", ")}` : "구성 요소 일치")
  const noFile = sScreens.filter((s) => !/^[A-Z]\w*Screen\.tsx$/.test(s.file ?? ""))
  add("SPEC-FILE", noFile.length === 0, noFile.length ? `file 이름 형식 오류: ${noFile.map((s) => s.route)}` : "file 이름 형식 일치")

  const sPlans = Array.isArray(spec.plans) ? spec.plans : []
  add("SPEC-PLAN-IDS", sPlans.map((p) => p.id).join() === prd.plans.map((p) => p.id).join(), `plans id: spec=[${sPlans.map((p) => p.id)}] PRD=[${prd.plans.map((p) => p.id)}]`)
  const diffs = []
  for (const want of prd.plans) {
    const got = sPlans.find((p) => p.id === want.id)
    if (!got) continue
    for (const k of Object.keys(want)) if (got[k] !== want[k]) diffs.push(`${want.id}.${k}: spec=${JSON.stringify(got[k])} PRD=${JSON.stringify(want[k])}`)
  }
  add("SPEC-PLAN-VALUES", diffs.length === 0, diffs.length ? diffs.join(" / ") : "요금제 값 PRD 표와 일치")

  const sRules = Array.isArray(spec.rules) ? spec.rules : []
  add("SPEC-RULE-COUNT", sRules.length === prd.rules.length, `rules ${sRules.length}개 / PRD ${prd.rules.length}개`)

  const msgs = Object.entries(spec.messages ?? {})
  const badMsg = msgs.filter(([, v]) => typeof v !== "string" || !v || !prdMd.includes(v)).map(([k]) => k)
  add("SPEC-MESSAGES", msgs.length > 0 && badMsg.length === 0, badMsg.length ? `PRD 원문과 다른 문구: ${badMsg.join(", ")}` : `문구 ${msgs.length}개 PRD 원문과 일치`)
  return res
}
