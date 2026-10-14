// G4 /apply — PRD 규칙 6
import { one, plans, renderAt } from "./helpers.mjs"

async function setup() {
  const r = await renderAt(`/apply?planId=${(plans as any[])[0].id}`)
  const name = one("input-name") as HTMLInputElement
  const phone = one("input-phone") as HTMLInputElement
  const agree = one("checkbox-agree") as HTMLInputElement
  const btn = one("btn-submit") as HTMLButtonElement
  const fill = (n: string, ph: string, ag: boolean) => {
    r.fireEvent.change(name, { target: { value: n } })
    r.fireEvent.blur(name)
    r.fireEvent.change(phone, { target: { value: ph } })
    r.fireEvent.blur(phone)
    if (agree.checked !== ag) r.fireEvent.click(agree)
  }
  return { name, phone, agree, btn, fill }
}

const OK_NAME = "홍길동"
const OK_PHONE = "01012345678"

describe("/apply", () => {
  test("PRD-APPLY-VALID 규칙6: 세 조건을 모두 만족하면 '신청하기' 활성", async () => {
    const f = await setup()
    expect(f.btn.disabled, "초기 상태는 비활성").toBe(true)
    f.fill(OK_NAME, OK_PHONE, true)
    expect(f.btn.disabled).toBe(false)
  })

  test("PRD-APPLY-VALID 규칙6: 이름이 1~20자가 아니면 비활성", async () => {
    const f = await setup()
    f.fill("", OK_PHONE, true)
    expect(f.btn.disabled, "이름 빈 값").toBe(true)
    f.fill("   ", OK_PHONE, true)
    expect(f.btn.disabled, "이름 공백만").toBe(true)
    f.fill("가".repeat(21), OK_PHONE, true)
    expect(f.name.value.length <= 20 || f.btn.disabled, "21자: 입력이 20자로 막히거나 비활성").toBe(true)
  })

  test("PRD-APPLY-VALID 규칙6: 휴대폰 번호가 숫자 11자리가 아니면 비활성", async () => {
    const f = await setup()
    f.fill(OK_NAME, "0101234567", true)
    expect(f.btn.disabled, "10자리").toBe(true)
    for (const v of ["010123456789", "010-1234-5678", "010abc12345678"]) {
      f.fill(OK_NAME, v, true)
      expect(/^\d*$/.test(f.phone.value), `${v}: 숫자 외 문자가 입력되면 안 됨`).toBe(true)
      expect(/^\d{11}$/.test(f.phone.value) || f.btn.disabled, `${v}: 11자리가 아니면 비활성`).toBe(true)
    }
  })

  test("PRD-APPLY-VALID 규칙6: 동의하지 않으면 비활성", async () => {
    const f = await setup()
    f.fill(OK_NAME, OK_PHONE, false)
    expect(f.btn.disabled).toBe(true)
  })
})
