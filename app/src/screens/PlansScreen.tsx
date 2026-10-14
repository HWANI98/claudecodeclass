import { useState } from "react"
import { plans, type Plan } from "../data/plans"

type FilterKey = "all" | "unlimited" | "limited"

type FilterItem = {
  key: FilterKey
  label: string
}

const filters: FilterItem[] = [
  { key: "all", label: "전체" },
  { key: "unlimited", label: "속도 제한 없음" },
  { key: "limited", label: "속도 제한 있음" },
]

const won = (n: number) => n.toLocaleString("ko-KR") + "원"

function goTo(to: string) {
  window.history.pushState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function matches(plan: Plan, key: FilterKey) {
  if (key === "unlimited") return plan.throttle_after === null
  if (key === "limited") return plan.throttle_after !== null
  return true
}

export default function PlansScreen() {
  const [filter, setFilter] = useState<FilterKey>("all")
  const visible = [...plans]
    .sort((a, b) => a.monthly_price - b.monthly_price)
    .filter((p) => matches(p, filter))

  return (
    <main
      data-testid="screen-/plans"
      className="mx-auto flex min-h-screen w-full flex-col"
      style={{
        maxWidth: "var(--spacing-390)",
        background: "var(--bg-default)",
        color: "var(--text-primary)",
      }}
    >
      <header className="px-4 py-4" style={{ background: "var(--bg-surface)" }}>
        <h1 className="ts-subtitle-bold">요금제</h1>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="요금제 필터"
        >
          {filters.map((f) => {
            const selected = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                data-testid="filter-chip"
                aria-pressed={selected}
                onClick={() => setFilter(f.key)}
                className="ts-body-small-strong h-10 px-4"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: selected
                    ? "var(--fill-secondary)"
                    : "var(--fill-tertiary)",
                  color: selected
                    ? "var(--text-on-dark)"
                    : "var(--text-primary)",
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <ul className="flex flex-col gap-4">
          {visible.map((plan) => (
            <li
              key={plan.id}
              data-testid="plan-card"
              data-plan-id={plan.id}
              className="flex flex-col gap-3 p-5"
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-16)",
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 data-testid="plan-name" className="ts-subtitle-bold">
                  {plan.name}
                </h2>
                {plan.recommended && (
                  <span
                    data-testid="tag-recommended"
                    className="ts-caption-bold px-3"
                    style={{
                      borderRadius: "var(--radius-full)",
                      background: "var(--bg-accent-subtle)",
                      color: "var(--text-accent)",
                    }}
                  >
                    추천
                  </span>
                )}
                {plan.discount_months !== null && (
                  <span
                    data-testid="chip-discount"
                    className="ts-caption-bold px-2"
                    style={{
                      borderRadius: "var(--radius-4)",
                      background: "var(--bg-error-subtle)",
                      color: "var(--text-error)",
                    }}
                  >
                    {plan.discount_months}개월 할인
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <p data-testid="plan-data" className="ts-body-strong">
                  {plan.data}
                </p>
                <p
                  data-testid="plan-throttle"
                  className="ts-body-small-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {plan.throttle_after === null
                    ? "속도 제한 없음"
                    : `소진 후 ${plan.throttle_after}로 제한`}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <p data-testid="price-monthly" className="ts-heading-h4">
                  {won(plan.monthly_price)}
                </p>
                {plan.price_after_discount !== null &&
                  plan.discount_months !== null && (
                    <p
                      data-testid="price-after"
                      className="ts-body-small-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {`${plan.discount_months + 1}개월째부터 ${won(plan.price_after_discount)}`}
                    </p>
                  )}
              </div>

              <button
                type="button"
                onClick={() => goTo(`/plans/${plan.id}`)}
                className="ts-body-strong h-12 w-full"
                style={{
                  borderRadius: "var(--radius-12)",
                  background: "var(--fill-primary)",
                  color: "var(--text-on-dark)",
                }}
              >
                자세히
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
