// G4 /complete — PRD 규칙 7 + 개인정보(PII) 규칙
import { one, plans, renderAt, won } from "./helpers.mjs"

const NAME = "홍길동"
const PHONE = "01012345678"
const mask = (n: string) => (n.length > 1 ? `${n[0]}${"*".repeat(Math.max(1, n.length - 2))}${n.at(-1)}` : n)
const PHONE_PATTERN = /\d{3}-?\*{4}-?\d{4}|\d{10,11}/

// 상세 → 구독 신청 → 신청 완료까지 실제로 눌러서 간다.
async function applyFlow(p: any) {
  const r = await renderAt(`/plans/${p.id}`)
  r.fireEvent.click(r.screen.getByRole("button", { name: "구독 신청하기" }))
  expect(location.pathname).toBe("/apply")
  expect(new URLSearchParams(location.search).get("planId")).toBe(p.id)
  r.fireEvent.change(one("input-name"), { target: { value: NAME } })
  r.fireEvent.change(one("input-phone"), { target: { value: PHONE } })
  r.fireEvent.click(one("checkbox-agree"))
  r.fireEvent.click(one("btn-submit"))
  await r.waitFor(() => expect(location.pathname).toBe("/complete"))
  await r.waitFor(() => one("complete-plan-name"))
  return r
}

const targets = () => {
  const list = plans as any[]
  const discounted = list.find((p) => p.price_after_discount != null)
  return [list[0], ...(discounted && discounted !== list[0] ? [discounted] : [])]
}

describe("/complete", () => {
  test("PRD-COMPLETE-MATCH 규칙7: 완료 화면 요금제 이름·매달 내는 금액 = 선택한 요금제", async () => {
    for (const p of targets()) {
      const r = await applyFlow(p)
      expect(one("complete-plan-name").textContent?.trim()).toBe(p.name)
      expect(one("complete-price").textContent).toContain(won(p.monthly_price))
      r.cleanup()
    }
  })

  test("PII-PHONE 완료 화면에 휴대폰 번호(가린 형태 포함) 0개", async () => {
    const r = await applyFlow(targets()[0])
    expect(PHONE_PATTERN.test(document.body.textContent ?? "")).toBe(false)
    r.cleanup()
  })

  test("PII-NAME-MASK 신청자 이름은 첫 글자 + * + 마지막 글자", async () => {
    const r = await applyFlow(targets()[0])
    expect(one("complete-applicant").textContent?.trim()).toBe(mask(NAME))
    expect(document.body.textContent).not.toContain(NAME)
    r.cleanup()
  })
})
