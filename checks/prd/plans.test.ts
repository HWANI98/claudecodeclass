// G4 /plans — PRD 규칙 1·2·3·4·5
import { afterText, byId, expectNoStrikePrice, moneyCount, one, plans, renderAt, throttleText, won } from "./helpers.mjs"

const cards = () => byId("plan-card")
const planOf = (el: Element) => plans.find((p: any) => p.id === el.getAttribute("data-plan-id"))

describe("/plans", () => {
  test("PRD-COUNT 규칙1: 카드 정확히 4개, 매달 내는 금액 낮은 순", async () => {
    await renderAt("/plans")
    const want = [...plans].sort((a: any, b: any) => a.monthly_price - b.monthly_price).map((p: any) => p.id)
    expect(cards().map((c) => c.getAttribute("data-plan-id"))).toEqual(want)
  })

  test("PRD-TAG 규칙2: 추천 Tag 1개, 추천 요금제 카드 안", async () => {
    await renderAt("/plans")
    const tags = byId("tag-recommended")
    expect(tags).toHaveLength(1)
    const owner = tags[0].closest('[data-testid="plan-card"]')
    expect(owner?.getAttribute("data-plan-id")).toBe(plans.find((p: any) => p.recommended)?.id)
  })

  test("PRD-PRICE 규칙3·4(핵심): 카드마다 매달 내는 금액 1개 + 할인 종료 후 금액은 할인 요금제만 1개", async () => {
    await renderAt("/plans")
    for (const card of cards()) {
      const p: any = planOf(card)
      const hasAfter = p.price_after_discount != null
      expect(moneyCount(card), `${p.id} 카드의 금액 개수`).toBe(hasAfter ? 2 : 1)
      expect(one("price-monthly", card).textContent).toContain(won(p.monthly_price))
      const after = byId("price-after", card)
      expect(after.length, `${p.id} price-after 개수`).toBe(hasAfter ? 1 : 0)
      if (hasAfter) expect(after[0].textContent?.trim()).toBe(afterText(p))
      expect(byId("chip-discount", card).length, `${p.id} 24개월 할인 Chip`).toBe(hasAfter ? 1 : 0)
    }
    expectNoStrikePrice()
  })

  test("PRD-THROTTLE 규칙5: 카드마다 소진 후 속도 문구", async () => {
    await renderAt("/plans")
    for (const card of cards()) {
      const p: any = planOf(card)
      expect(one("plan-throttle", card).textContent?.trim(), p.id).toBe(throttleText(p))
    }
  })
})
