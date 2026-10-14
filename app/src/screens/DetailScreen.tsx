import { useEffect } from "react"
import { plans } from "../data/plans"

const won = (n: number) => n.toLocaleString("ko-KR") + "원"

function goTo(to: string) {
  window.history.pushState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function replaceTo(to: string) {
  window.history.replaceState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export default function DetailScreen() {
  const id = window.location.pathname.split("/").filter(Boolean)[1]
  const plan = plans.find((p) => p.id === id)

  useEffect(() => {
    if (!plan) replaceTo("/plans")
  }, [plan])

  if (!plan) return <main data-testid="screen-/plans/[id]" />

  return (
    <main
      data-testid="screen-/plans/[id]"
      className="mx-auto flex min-h-screen w-full flex-col"
      style={{
        maxWidth: "var(--spacing-390)",
        background: "var(--bg-default)",
        color: "var(--text-primary)",
      }}
    >
      <header
        className="flex items-center gap-2 px-4 py-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <button
          type="button"
          data-testid="header-back"
          aria-label="뒤로"
          onClick={() => goTo("/plans")}
          className="flex h-6 w-6 items-center justify-center"
          style={{ color: "var(--icon-strong)" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 data-testid="header-title" className="ts-subtitle-bold">
          {plan.name}
        </h1>
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
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <section
          data-testid="price-card"
          className="flex flex-col gap-2 p-5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-16)",
          }}
        >
          <p
            className="ts-body-small-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            매달 내는 금액
          </p>
          <p data-testid="price-monthly" className="ts-heading-h3">
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
        </section>

        <section
          className="flex flex-col gap-3 p-5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-16)",
          }}
        >
          <div
            data-testid="row-data"
            className="flex items-center justify-between gap-4"
          >
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              기본 데이터량
            </span>
            <span className="ts-body-strong">{plan.data}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              소진 후 속도
            </span>
            <span data-testid="plan-throttle" className="ts-body-strong">
              {plan.throttle_after === null
                ? "속도 제한 없음"
                : `소진 후 ${plan.throttle_after}로 제한`}
            </span>
          </div>
        </section>
      </div>

      <div
        className="sticky bottom-0 flex flex-col gap-3 p-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <span
            className="ts-body-small-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            매달 내는 금액
          </span>
          <span data-testid="cta-amount" className="ts-subtitle-bold">
            {won(plan.monthly_price)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => goTo(`/apply?planId=${plan.id}`)}
          className="ts-body-strong h-12 w-full"
          style={{
            borderRadius: "var(--radius-12)",
            background: "var(--fill-primary)",
            color: "var(--text-on-dark)",
          }}
        >
          구독 신청하기
        </button>
      </div>
    </main>
  )
}
