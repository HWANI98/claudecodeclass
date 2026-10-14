import { useEffect, useState } from "react"
import { plans } from "../data/plans"
import { saveSubscription } from "./parts/subscriptionStore"
import { insertSubscription, supabaseEnabled } from "../lib/supabase"

const won = (n: number) => n.toLocaleString("ko-KR") + "원"

function goTo(to: string) {
  window.history.pushState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function replaceTo(to: string) {
  window.history.replaceState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function makeId() {
  const n = Math.floor(Math.random() * 100000000)
  return "S" + String(n).padStart(8, "0")
}

export default function ApplyScreen() {
  const planId = new URLSearchParams(window.location.search).get("planId")
  const plan = plans.find((p) => p.id === planId)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agree, setAgree] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!plan) replaceTo("/plans")
  }, [plan])

  if (!plan) return <main data-testid="screen-/apply" />

  const nameValid = name.trim().length >= 1 && name.trim().length <= 20
  const phoneValid = /^\d{11}$/.test(phone)
  const canSubmit = nameValid && phoneValid && agree && !saving

  const backToDetail = () => goTo(`/plans/${plan.id}`)

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setSaveError(false)
    const next = {
      id: makeId(),
      planId: plan.id,
      name: name.trim(),
      phone,
      createdAt: new Date().toISOString(),
    }
    try {
      if (supabaseEnabled) {
        await insertSubscription({
          id: next.id,
          plan_id: next.planId,
          name: next.name,
          phone: next.phone,
          created_at: next.createdAt,
        })
      }
      saveSubscription(next)
    } catch {
      setSaving(false)
      setSaveError(true)
      return
    }
    goTo("/complete")
  }

  return (
    <main
      data-testid="screen-/apply"
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
          onClick={backToDetail}
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
        <h1 className="ts-subtitle-bold">구독 신청</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
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
              요금제
            </span>
            <span data-testid="summary-plan-name" className="ts-body-strong">
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
            <span data-testid="price-monthly" className="ts-body-strong">
              {won(plan.monthly_price)}
            </span>
          </div>
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
          className="flex flex-col gap-4 p-5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-16)",
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="apply-name" className="ts-body-small-strong">
              이름
            </label>
            <input
              id="apply-name"
              data-testid="input-name"
              type="text"
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              onBlur={() => setNameTouched(true)}
              className="ts-body-medium h-12 w-full px-4"
              style={{
                borderRadius: "var(--radius-12)",
                background: "var(--bg-subtle)",
                color: "var(--text-primary)",
              }}
            />
            {nameTouched && !nameValid && (
              <p
                data-testid="error-name"
                className="ts-caption-medium"
                style={{ color: "var(--text-error)" }}
              >
                이름을 입력해 주세요.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="apply-phone" className="ts-body-small-strong">
              휴대폰 번호
            </label>
            <input
              id="apply-phone"
              data-testid="input-phone"
              type="text"
              inputMode="numeric"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              onBlur={() => setPhoneTouched(true)}
              className="ts-body-medium h-12 w-full px-4"
              style={{
                borderRadius: "var(--radius-12)",
                background: "var(--bg-subtle)",
                color: "var(--text-primary)",
              }}
            />
            {phoneTouched && !phoneValid && (
              <p
                data-testid="error-phone"
                className="ts-caption-medium"
                style={{ color: "var(--text-error)" }}
              >
                휴대폰 번호 11자리를 숫자로 입력해 주세요.
              </p>
            )}
          </div>
        </section>

        <section
          className="flex flex-col gap-2 p-5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-16)",
          }}
        >
          <label className="flex items-center gap-3">
            <input
              data-testid="checkbox-agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="h-6 w-6"
              style={{ accentColor: "var(--fill-primary)" }}
            />
            <span className="ts-body-medium">
              개인정보 수집·이용에 동의합니다. (필수)
            </span>
          </label>
          <p
            className="ts-caption-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            수집 항목: 이름·휴대폰 번호 / 이용 목적: 구독 신청 처리 / 보유 기간:
            신청 처리 후 즉시 삭제
          </p>
        </section>
      </div>

      <div
        className="sticky bottom-0 flex flex-col gap-3 p-4"
        style={{ background: "var(--bg-surface)" }}
      >
        {saveError && (
          <p
            data-testid="error-save"
            className="ts-caption-medium"
            style={{ color: "var(--text-error)" }}
          >
            신청을 저장하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="btn-cancel"
            onClick={backToDetail}
            className="ts-body-strong h-12 flex-1"
            style={{
              borderRadius: "var(--radius-12)",
              background: "var(--fill-secondary)",
              color: "var(--text-primary)",
            }}
          >
            취소
          </button>
          <button
            type="button"
            data-testid="btn-submit"
            disabled={!canSubmit}
            onClick={submit}
            className="ts-body-strong h-12 flex-1"
            style={{
              borderRadius: "var(--radius-12)",
              background: canSubmit
                ? "var(--fill-primary)"
                : "var(--fill-disabled)",
              color: canSubmit
                ? "var(--text-on-dark)"
                : "var(--text-on-disabled)",
            }}
          >
            신청하기
          </button>
        </div>
      </div>
    </main>
  )
}
