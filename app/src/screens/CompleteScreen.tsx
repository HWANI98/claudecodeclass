import { useEffect } from "react"
import { plans } from "../data/plans"
import { readSubscription } from "./parts/subscriptionStore"

const won = (n: number) => n.toLocaleString("ko-KR") + "원"

function goTo(to: string) {
  window.history.pushState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function replaceTo(to: string) {
  window.history.replaceState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function maskName(name: string) {
  const chars = Array.from(name)
  if (chars.length <= 1) return name
  const stars = "*".repeat(Math.max(1, chars.length - 2))
  return chars[0] + stars + chars[chars.length - 1]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function CompleteScreen() {
  const sub = readSubscription()
  const plan = sub ? plans.find((p) => p.id === sub.planId) : undefined

  useEffect(() => {
    if (!sub || !plan) replaceTo("/plans")
  }, [sub, plan])

  if (!sub || !plan) return <main data-testid="screen-/complete" />

  return (
    <main
      data-testid="screen-/complete"
      className="mx-auto flex min-h-screen w-full flex-col"
      style={{
        maxWidth: "var(--spacing-390)",
        background: "var(--bg-default)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-col items-center gap-3 py-8">
          <div
            className="flex h-12 w-12 items-center justify-center"
            style={{
              borderRadius: "var(--radius-full)",
              background: "var(--fill-primary)",
              color: "var(--icon-on-dark)",
            }}
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
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <h1 data-testid="complete-title" className="ts-heading-h4">
            구독 신청이 완료됐어요
          </h1>
        </div>

        <section
          className="flex flex-col gap-3 p-5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-16)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              신청 번호
            </span>
            <span data-testid="complete-id" className="ts-body-strong">
              {sub.id}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              요금제
            </span>
            <span data-testid="complete-plan-name" className="ts-body-strong">
              {plan.name}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              매달 내는 금액
            </span>
            <span data-testid="complete-price" className="ts-body-strong">
              {won(plan.monthly_price)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              신청 일시
            </span>
            <span data-testid="complete-date" className="ts-body-strong">
              {formatDate(sub.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span
              className="ts-body-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              신청자
            </span>
            <span data-testid="complete-applicant" className="ts-body-strong">
              {maskName(sub.name)}
            </span>
          </div>
        </section>
      </div>

      <div
        className="sticky bottom-0 p-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <button
          type="button"
          onClick={() => goTo("/plans")}
          className="ts-body-strong h-12 w-full"
          style={{
            borderRadius: "var(--radius-12)",
            background: "var(--fill-primary)",
            color: "var(--text-on-dark)",
          }}
        >
          요금제 더 보기
        </button>
      </div>
    </main>
  )
}
