// Supabase REST(PostgREST)로 신청 내역을 저장한다. SDK 없이 fetch만 쓴다.
// 값은 app/.env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
// 값이 없으면(테스트 등) 원격 저장을 건너뛴다.

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const key = import.meta.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabaseEnabled = Boolean(url && key)

export type SubscriptionRow = {
  id: string
  plan_id: string
  name: string
  phone: string
  created_at: string
}

export async function insertSubscription(row: SubscriptionRow) {
  if (!url || !key) return
  const res = await fetch(`${url}/rest/v1/subscriptions`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      // anon은 select 권한이 없으므로 응답 본문을 받지 않는다
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    throw new Error(`subscriptions insert failed: ${res.status}`)
  }
}
