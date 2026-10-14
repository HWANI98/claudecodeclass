// G4 /plans/[id] — PRD 규칙 3·4·5
import { afterText, byId, expectNoStrikePrice, moneyCount, one, plans, renderAt, throttleText, won } from "./helpers.mjs"

describe("/plans/[id]", () => {
  test("PRD-PRICE 규칙3·4(핵심): Card/Price 에 매달 내는 금액 1개 + 할인 종료 후 금액 최대 1개", async () => {
    for (const p of plans as any[]) {
      const r = await renderAt(`/plans/${p.id}`)
      const hasAfter = p.price_after_discount != null
      const card = one("price-card")
      expect(moneyCount(card), `${p.id} price-card 금액 개수`).toBe(hasAfter ? 2 : 1)
      expect(one("price-monthly", card).textContent).toContain(won(p.monthly_price))
      const after = byId("price-after", card)
      expect(after.length, `${p.id} price-after 개수`).toBe(hasAfter ? 1 : 0)
      if (hasAfter) expect(after[0].textContent?.trim()).toBe(afterText(p))
      expectNoStrikePrice()
      r.cleanup()
    }
  })

  test("PRD-THROTTLE 규칙5: 상세에 소진 후 속도 문구", async () => {
    for (const p of plans as any[]) {
      const r = await renderAt(`/plans/${p.id}`)
      expect(one("plan-throttle").textContent?.trim(), p.id).toBe(throttleText(p))
      r.cleanup()
    }
  })
})
