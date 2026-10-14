// 판정 테스트 공용 도구. 기대값은 harness/out/01-spec.json(=G1 통과한 PRD 값)에서 읽는다.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
export const appPath = (...p) => join(ROOT, "app", "src", ...p).replaceAll("\\", "/")
const APP = appPath("App.tsx")

export const spec = JSON.parse(readFileSync(join(ROOT, "harness", "out", "01-spec.json"), "utf8"))
export const plans = spec.plans
export const won = (n) => `${n.toLocaleString("ko-KR")}원`
export const MONEY = /\d{1,3}(?:,\d{3})*원/g
export const moneyCount = (el) => (el.textContent.match(MONEY) || []).length
export const afterText = (p) => `${p.discount_months + 1}개월째부터 ${won(p.price_after_discount)}`
export const throttleText = (p) => (p.throttle_after ? `소진 후 ${p.throttle_after}로 제한` : "속도 제한 없음")
export const FORBIDDEN_PRICE_WORDS = /정가|할인가|프로모션가|\d+\s*%/

// path 로 들어가 App 을 새로 그린다. 모듈을 매번 새로 불러와 메모리 상태가 남지 않게 한다.
export async function renderAt(path) {
  vi.resetModules()
  window.history.replaceState({}, "", path)
  const React = await import("react")
  const rtl = await import("@testing-library/react")
  const { default: App } = await import(/* @vite-ignore */ APP)
  const view = rtl.render(React.createElement(App))
  globalThis.__harnessCleanup.push(rtl.cleanup)
  return { ...rtl, view, within: rtl.within }
}

export const byId = (id, root = document) => [...root.querySelectorAll(`[data-testid="${id}"]`)]
export const one = (id, root = document) => {
  const els = byId(id, root)
  expect(els, `data-testid="${id}" 는 정확히 1개여야 함 (contract.md)`).toHaveLength(1)
  return els[0]
}

// 취소선·정가 표기 금지 (R-가격 공통)
export function expectNoStrikePrice(root = document.body) {
  expect(root.querySelectorAll("s, del, strike").length, "<s>/<del>/<strike> 0개").toBe(0)
  const struck = [...root.querySelectorAll("*")].filter((el) => /line-through/.test(el.getAttribute("style") || ""))
  expect(struck.length, "inline line-through 0개").toBe(0)
  expect(FORBIDDEN_PRICE_WORDS.test(root.textContent), "정가·할인가·프로모션가·% 문구 0개").toBe(false)
}
