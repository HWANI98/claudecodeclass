-- 구독 신청 저장용 스키마. Supabase 대시보드 > SQL Editor에서 한 번 실행한다.
-- 앱(publishable key, anon 역할)은 신청 저장(insert)만 할 수 있고, 아무것도 읽을 수 없다.
-- 이름·전화번호·요금제 조회는 대시보드(SQL Editor / Table Editor)에서 subscription_details 뷰로 한다.

-- 1) 요금제: app/src/data/plans.ts 와 같은 값
create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_price integer not null,
  data text not null,
  throttle_after text,
  price_after_discount integer,
  discount_months integer,
  recommended boolean not null default false
);

insert into public.plans
  (id, name, monthly_price, data, throttle_after, price_after_discount, discount_months, recommended)
values
  ('p01', '슬림 10GB',     39000, '10GB',       '1Mbps', null,  null, false),
  ('p02', '데일리 50GB',   52000, '50GB',       '1Mbps', null,  null, true),
  ('p03', '무제한 라이트', 59000, '기본 100GB', '5Mbps', 69000, 24,   false),
  ('p04', '무제한 프리',   75000, '무제한',     null,    null,  null, false)
on conflict (id) do update set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  data = excluded.data,
  throttle_after = excluded.throttle_after,
  price_after_discount = excluded.price_after_discount,
  discount_months = excluded.discount_months,
  recommended = excluded.recommended;

-- 2) 신청 내역
create table if not exists public.subscriptions (
  id text primary key check (id ~ '^S[0-9]{8}$'),
  plan_id text not null references public.plans (id),
  name text not null check (char_length(btrim(name)) between 1 and 20),
  phone text not null check (phone ~ '^[0-9]{11}$'),
  created_at timestamptz not null default now()
);

-- 3) 권한: anon은 insert만, 조회는 막는다
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

revoke all on public.plans, public.subscriptions from anon, authenticated;
grant insert on public.subscriptions to anon;

drop policy if exists "anon can apply" on public.subscriptions;
create policy "anon can apply"
  on public.subscriptions
  for insert
  to anon
  with check (true);
-- select 정책은 만들지 않는다 → anon/authenticated는 신청 내역을 읽을 수 없다.

-- 4) 조회용 뷰: 이름·전화번호·신청한 요금제 (대시보드/서비스 역할 전용)
create or replace view public.subscription_details
with (security_invoker = true) as
select
  s.id as subscription_id,
  s.name,
  s.phone,
  p.id as plan_id,
  p.name as plan_name,
  p.monthly_price,
  s.created_at
from public.subscriptions s
join public.plans p on p.id = s.plan_id
order by s.created_at desc;

revoke all on public.subscription_details from anon, authenticated;

-- 조회 예시 (SQL Editor에서 실행)
-- select * from public.subscription_details;
