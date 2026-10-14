// ===== 파일 개요 =====
// 이 파일은 "요금제 구독 신청" 앱 전체를 담고 있는 React 컴포넌트 파일이다.
// 화면은 4개이고, 사용자는 아래 순서대로 이동한다.
//   1) 요금제 목록(/plans)      : 필터로 요금제를 골라 본다
//   2) 요금제 상세(/plans/:id)  : 가격·혜택을 확인하고 "구독 신청하기"를 누른다
//   3) 구독 신청(/apply?plan=id): 이름·휴대폰 번호를 입력하고 동의 후 신청한다
//   4) 신청 완료(/complete)     : 신청 내역을 (이름·번호를 가린 채) 보여준다
// 흐름 요약:
//   - 맨 아래 App 컴포넌트가 "지금 어떤 화면인지(route)"를 상태로 들고 있다
//   - route 값에 따라 4개 화면 중 하나를 골라 그린다
//   - 화면 이동은 navigate()로 하고, 이때 브라우저 주소창(URL)도 함께 바꾼다
//   - 뒤로가기 버튼을 누르면 URL을 다시 읽어서 route를 맞춘다
// 미리 알면 좋은 개념: React 컴포넌트, props, useState/useEffect/useMemo, JSX, TypeScript 타입
//
// [용어] 컴포넌트: 화면의 한 조각(버튼, 카드, 화면 전체 등)을 그려 주는 함수. 이름이 대문자로 시작한다.
// [용어] props: 부모 컴포넌트가 자식 컴포넌트에 넘겨주는 값들. 함수의 매개변수와 같은 역할이다.
// [용어] JSX: 자바스크립트 안에 <div>처럼 HTML 비슷한 문법을 쓰는 방식. 결국 화면 요소를 만드는 코드로 바뀐다.
// ====================

// React에서 필요한 기능들을 가져온다.
// [용어] 훅(Hook): use로 시작하는 React 함수. 컴포넌트에 "기억(상태)"이나 "부수 효과" 같은 기능을 붙인다.
// type 이 붙은 것(FormEvent, ReactNode)은 실행 코드가 아니라 TypeScript 타입만 가져온다는 뜻이다.
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

// Route: "지금 보여줄 화면"을 나타내는 타입.
// [용어] 유니온 타입(A | B | C): 여러 모양 중 "하나"라는 뜻. 여기서는 4가지 화면 중 하나다.
// name 값으로 어떤 화면인지 구분하고, 상세/신청 화면은 어떤 요금제인지 planId도 함께 가진다.
// 예) { name: "detail", planId: "slim" } → "슬림 10" 요금제 상세 화면
// ⚠ 주의: 같은 줄에 있는 name: "detail" 과 planId: string 사이(그리고 아래 summary, PlanCard 타입의
//   같은 줄 항목들 사이)에 구분자(; 또는 ,)가 없다. TypeScript 문법상 오류로 보이니,
//   빌드가 실패하면 이 부분을 먼저 확인해 보자.
type Route = { name: "plans" } | { name: "detail" planId: string } | {
  name: "apply"
  planId: string
} | { name: "complete" }

// Plan: 요금제 하나의 정보 모양.
// [용어] 선택 속성(?:): originalPrice?: 처럼 ?가 붙으면 "없어도 되는 값"이다. 없으면 undefined.
// categories 는 정해진 4개 문자열 중에서만 고를 수 있다(오타를 내면 TypeScript가 잡아 준다).
type Plan = {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: string
  data: string
  description: string
  badge?: string
  promo?: string
  categories: Array<"데이터 많이" | "가성비" | "구독 포함" | "통화 많이">
  benefits: string[]
}

// Application: 신청이 끝났을 때 만들어지는 "신청 내역" 한 건의 모양.
// number 는 신청 번호, appliedAt 은 사람이 읽기 좋게 바꾼 신청 일시 문자열이다.
type Application = {
  number: string
  plan: Plan
  name: string
  phone: string
  appliedAt: string
}

// 화면에 보여줄 요금제 목록. 서버에서 받아오지 않고 코드에 직접 적어 둔 고정 데이터다.
// 할인이 없는 요금제(라이트 30)는 originalPrice/discount 를 아예 적지 않았다.
const plans: Plan[] = [
  {
    id: "unlimited",
    name: "넉넉 무제한",
    price: 85000,
    originalPrice: 100000,
    discount: "15%",
    data: "무제한",
    description: "영상·게임을 하루 종일 해도 걱정 없어요",
    badge: "추천",
    promo: "24개월 할인 프로모션",
    categories: ["데이터 많이", "구독 포함", "통화 많이"],
    benefits: ["넷플릭스 스탠다드", "유튜브 프리미엄"],
  },
  {
    id: "standard",
    name: "스탠다드 110",
    price: 69000,
    originalPrice: 78000,
    discount: "12%",
    data: "110GB",
    description: "데이터 110GB · 통화 무제한",
    badge: "추천",
    promo: "24개월 할인 프로모션",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 5Mbps", "테더링 40GB"],
  },
  {
    id: "light",
    name: "라이트 30",
    price: 49000,
    data: "30GB",
    description: "데이터 30GB · 통화 무제한",
    badge: "추천",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 1Mbps", "테더링 10GB"],
  },
  {
    id: "slim",
    name: "슬림 10",
    price: 39000,
    originalPrice: 43000,
    discount: "10%",
    data: "10GB",
    description: "데이터 10GB · 통화 무제한",
    badge: "추천",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 1Mbps", "U+zone 무료"],
  },
]

// 목록 화면 위쪽에 나오는 필터 버튼 4개의 이름.
// [용어] as const: "이 배열은 절대 안 바뀐다"고 TypeScript에 알려 주는 표시.
//   덕분에 타입이 그냥 string 이 아니라 "데이터 많이" | "가성비" | ... 로 정확히 잡힌다.
const filters = ["데이터 많이", "가성비", "구독 포함", "통화 많이"] as const

// 숫자를 한국식 금액 문자열로 바꾼다.
// 입력: price - 금액(숫자)
// 출력: 천 단위 쉼표 + "원"이 붙은 문자열
// 예) formatPrice(85000) → "85,000원"
// [용어] 템플릿 리터럴: `${값}원` 처럼 백틱(`) 안에 ${ }로 값을 끼워 넣어 문자열을 만드는 문법.
function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`
}

// 현재 브라우저 주소(URL)를 읽어서 "어떤 화면을 보여줄지(Route)"로 바꾼다.
// 페이지를 처음 열 때와, 뒤로가기/앞으로가기를 눌렀을 때 쓰인다.
// 출력: Route 값
// 예) 주소가 /plans/slim        → { name: "detail", planId: "slim" }
//     주소가 /apply?plan=light  → { name: "apply", planId: "light" }
//     주소가 /complete          → { name: "complete" }
//     그 외 아무 주소           → { name: "plans" } (목록 화면)
function readRoute(): Route {
  // pathname: 주소에서 도메인 뒤, ? 앞 부분. 예) https://a.com/plans/slim?x=1 → "/plans/slim"
  const path = window.location.pathname
  // [용어] 정규식: 문자열 패턴을 찾는 규칙.
  //   ^\/plans\/ : "/plans/"로 시작하고
  //   ([^/]+)    : 그 뒤에 "/"가 아닌 글자가 1개 이상 → 괄호로 묶어서 따로 꺼낼 수 있게 함(요금제 id)
  //   $          : 거기서 문자열이 끝나야 함
  // 맞으면 match = ["/plans/slim", "slim"], 안 맞으면 null
  const match = path.match(/^\/plans\/([^/]+)$/)

  // match[1] 은 괄호로 묶은 부분, 즉 요금제 id 다.
  if (match) return { name: "detail", planId: match[1] }
  if (path === "/apply") {
    return {
      name: "apply",
      // ?plan=xxx 의 xxx 를 읽는다. 없으면(null) ?? 오른쪽, 즉 첫 번째 요금제 id 를 쓴다.
      // [용어] ?? (널 병합 연산자): 왼쪽이 null 또는 undefined 일 때만 오른쪽 값을 쓴다.
      planId:
        new URLSearchParams(window.location.search).get("plan") ?? plans[0].id,
    }
  }
  if (path === "/complete") return { name: "complete" }
  return { name: "plans" }
}

// readRoute 의 반대: Route 값을 주소(URL 경로) 문자열로 바꾼다.
// 화면을 이동할 때 주소창을 바꾸기 위해 쓴다.
// 예) pathFor({ name: "apply", planId: "slim" }) → "/apply?plan=slim"
function pathFor(route: Route) {
  if (route.name === "plans") return "/plans"
  if (route.name === "detail") return `/plans/${route.planId}`
  if (route.name === "apply") return `/apply?plan=${route.planId}`
  return "/complete"
}

// ===== 여기부터는 여러 화면에서 같이 쓰는 작은 UI 조각(컴포넌트)들 =====

// 화면 맨 위 헤더(제목 줄).
// 입력(props): title  - 헤더에 보일 제목
//              root   - true 면 첫 화면용(제목 + 로고), false 면 하위 화면용(뒤로 버튼 + 가운데 제목)
//              onBack - 뒤로 버튼을 눌렀을 때 실행할 함수
// 예) <Header title="요금제 상세" onBack={...} /> → [←]  요금제 상세  [빈칸]
// [용어] 구조 분해 할당: ({ title, root = false }) 처럼 객체에서 필요한 값만 바로 꺼내 변수로 만드는 문법.
//   root = false 는 값이 안 넘어오면 false 를 쓰라는 기본값이다.
function Header({
  title,
  root = false,
  onBack,
}: {
  title: string
  root?: boolean
  onBack?: () => void
}) {
  // [용어] 삼항 연산자(조건 ? A : B): 조건이 참이면 A, 거짓이면 B.
  //   여기서는 root 일 때만 CSS 클래스 " app-header--root" 를 덧붙인다.
  //   예) root=true → "app-header app-header--root",  root=false → "app-header"
  // JSX 안에서 { } 는 "여기에 자바스크립트 값을 넣겠다"는 뜻이다.
  return (
    <header className={`app-header${root ? " app-header--root" : ""}`}>
      {/* 왼쪽 칸: 첫 화면이면 제목, 아니면 뒤로 가기 버튼 */}
      {root ? (
        <span className="header-title">{title}</span>
      ) : (
        <button
          className="icon-button"
          type="button"
          aria-label="이전 화면"
          onClick={onBack}
        >
          <img src="/assets/f152b.svg" alt="" />
        </button>
      )}
      {/* 오른쪽 칸: 첫 화면이면 로고, 아니면 제목 + 빈 칸(제목을 가운데로 맞추기 위한 자리 채우기) */}
      {root ? (
        <img className="logo" src="/assets/38036.svg" alt="U+" />
      ) : (
        // [용어] 프래그먼트(<>...</>): 화면에 아무 태그도 추가하지 않고 여러 요소를 하나로 묶는 빈 껍데기.
        <>
          <span className="header-title">{title}</span>
          <span className="header-spacer" aria-hidden="true" />
        </>
      )}
    </header>
  )
}

// 앱 공통 버튼.
// 입력(props): children - 버튼 안에 들어갈 내용(글자 등)
//              type     - "button"(그냥 버튼) 또는 "submit"(폼 제출 버튼). 기본 "button"
//              variant  - 모양. "primary"(강조) 또는 "secondary"(보조). 기본 "primary"
//              disabled - true 면 눌리지 않는 비활성 상태
// 예) <Button variant="secondary" onClick={...}>자세히</Button>
// [용어] children: 컴포넌트 태그 사이에 넣은 내용. <Button>여기</Button> 의 "여기"가 children 이다.
// [용어] ReactNode: 화면에 그릴 수 있는 거의 모든 것(글자, 숫자, 태그 등)을 뜻하는 타입.
function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary"
  disabled?: boolean
}) {
  return (
    <button
      className={`kit-button kit-button--${variant}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// 목록 화면의 필터 버튼 하나(칩 모양).
// 입력(props): label - 버튼 글자, selected - 지금 선택된 필터인지, onClick - 눌렀을 때 실행할 함수
// 예) <FilterChip label="가성비" selected={true} onClick={...} /> → 선택된 모양의 "가성비" 버튼
// aria-pressed: 화면 낭독기(시각장애인용 프로그램)에 "눌린 상태인지"를 알려 주는 접근성 속성.
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`filter-chip${selected ? " filter-chip--selected" : ""}`}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

// "추천" 같은 작은 표시(태그). 넘겨받은 내용을 둥근 라벨 모양으로 보여 준다.
// 예) <Tag>추천</Tag>
function Tag({ children }: { children: ReactNode }) {
  return <span className="tag w-fit self-start">{children}</span>
}

// "이름 ......... 값" 형태의 한 줄 정보.
// 입력(props): label - 왼쪽 글자, value - 오른쪽 글자(없어도 됨),
//              check - true 면 앞에 체크 아이콘을 붙인 "혜택 목록" 모양으로 보여 준다
// 예) <ListRow label="데이터" value="30GB" />          → 데이터        30GB
//     <ListRow label="테더링 10GB" value="포함" check /> → ✓ 테더링 10GB  포함
function ListRow({
  label,
  value,
  check = false,
}: {
  label: string
  value?: string
  check?: boolean
}) {
  return (
    <div className={`list-row${check ? " list-row--check" : ""}`}>
      {/* 조건 && 요소: 조건이 참일 때만 요소를 그린다. 거짓이면 아무것도 안 그린다. */}
      {/* ⚠ 주의: 조건이 숫자 0 이면 화면에 "0"이 그대로 찍힌다. 숫자로 조건을 걸 땐 길이 > 0 처럼 비교식을 쓰자. */}
      {check && (
        <img className="benefit-bullet" src="/assets/d5cc2.svg" alt="" />
      )}
      <span className={check ? "list-row-value" : "list-row-label"}>
        {label}
      </span>
      {value && <span className="list-row-value">{value}</span>}
    </div>
  )
}

// 화면 맨 아래에 붙는 버튼 영역(CTA = Call To Action, "행동 유도 버튼").
// 입력(props): children - 안에 넣을 버튼
//              summary  - (선택) 버튼 위에 보여 줄 금액 요약. 예) { label: "월 납부 금액", amount: "39,000원" }
// summary 를 넘기면 금액 요약 줄이 함께 나오고, 안 넘기면 버튼만 나온다.
function BottomCta({
  children,
  summary,
}: {
  children: ReactNode
  summary?: { label: string amount: string }
}) {
  return (
    <div className={`bottom-cta${summary ? " bottom-cta--price" : ""}`}>
      {summary && (
        <div className="cta-summary">
          <span>{summary.label}</span>
          <strong>{summary.amount}</strong>
        </div>
      )}
      <div className="cta-actions">{children}</div>
    </div>
  )
}

// 목록 화면에서 요금제 하나를 보여 주는 카드.
// 입력(props): plan - 보여 줄 요금제, onDetail - "자세히" 버튼을 눌렀을 때 실행할 함수
// 할인율, 원래 가격, 프로모션 문구는 그 값이 있는 요금제에서만 보인다.
// 예) 슬림 10 → [추천] 슬림 10 / 10% 월 39,000원 / (취소선) 월 43,000원 / [자세히]
function PlanCard({ plan, onDetail }: { plan: Plan onDetail: () => void }) {
  return (
    <article className="plan-card">
      {plan.badge && <Tag>{plan.badge}</Tag>}
      <span className="plan-name">{plan.name}</span>
      <span className="plan-description">{plan.description}</span>
      <div className="plan-price-row">
        <div className="plan-price-group">
          <div className="current-price">
            {plan.discount && (
              <strong className="discount">{plan.discount}</strong>
            )}
            <strong>월 {formatPrice(plan.price)}</strong>
          </div>
          {plan.originalPrice && (
            <span className="original-price">
              월 {formatPrice(plan.originalPrice)}
            </span>
          )}
          {plan.promo && <span className="promo-chip">{plan.promo}</span>}
        </div>
        <Button variant="secondary" onClick={onDetail}>
          자세히
        </Button>
      </div>
    </article>
  )
}

// ===== 여기부터는 실제 화면(페이지) 컴포넌트 4개 =====

// [화면 1] 요금제 목록 화면.
// 필터 버튼을 누르면 그 조건(categories)에 해당하는 요금제만 걸러서 카드로 보여 준다.
// 입력(props): navigate - 다른 화면으로 이동할 때 쓰는 함수(App 에서 받아 옴)
function PlansScreen({ navigate }: { navigate: (route: Route) => void }) {
  // [용어] useState: 컴포넌트가 값을 "기억"하게 하는 훅. [현재값, 바꾸는함수] 두 개를 돌려준다.
  //   setFilter("가성비") 를 호출하면 filter 가 바뀌고, 화면이 자동으로 다시 그려진다.
  // typeof filters[number]: filters 배열에 들어 있는 값 중 하나라는 타입 → 4개 필터 이름만 허용된다.
  // 처음 값은 "데이터 많이".
  const [filter, setFilter] = useState<typeof filters[number]>("데이터 많이")
  // 선택된 필터를 가진 요금제만 골라낸다.
  // [용어] useMemo: 계산 결과를 기억해 두는 훅. 뒤쪽 배열 [filter] 안의 값이 바뀔 때만 다시 계산한다.
  // [용어] filter(): 배열에서 조건이 참인 것만 모아 새 배열을 만든다. (위의 filter 상태 변수와 이름만 같고 다른 것)
  // 예) filter 가 "구독 포함" → categories 에 "구독 포함"이 있는 [넉넉 무제한] 하나만 남음
  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.categories.includes(filter)),
    [filter],
  )

  return (
    <main className="screen screen--muted">
      <Header title="요금제" root />
      <div className="scroll-content plans-content">
        <section className="title-group">
          <h1>
            나에게 맞는 요금제를
            <br />
            골라보세요
          </h1>
          <p>중요하게 보는 조건을 고르면 추천해 드려요</p>
        </section>
        {/* 필터 이름 4개를 하나씩 FilterChip 버튼으로 바꿔서 그린다. */}
        {/* [용어] map(): 배열의 각 항목을 다른 것으로 바꿔 새 배열을 만든다. 여기서는 "글자 → 버튼". */}
        {/* [용어] key: 목록을 그릴 때 React 가 각 항목을 구별하기 위한 고유값. 목록마다 꼭 필요하다. */}
        <div className="filter-list" aria-label="요금제 필터">
          {filters.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={filter === item}
              onClick={() => setFilter(item)}
            />
          ))}
        </div>
        <section className="plan-list">
          <p className="list-meta">추천순 · {visiblePlans.length}개</p>
          {/* 걸러진 요금제마다 카드를 하나씩 그린다. "자세히"를 누르면 그 요금제의 상세 화면으로 이동. */}
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onDetail={() => navigate({ name: "detail", planId: plan.id })}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

// [화면 2] 요금제 상세 화면.
// 가격 카드, 기본 제공(데이터/통화/문자), 포함 혜택을 보여 주고, 맨 아래에 "구독 신청하기" 버튼이 있다.
// 입력(props): plan - 보여 줄 요금제, navigate - 화면 이동 함수
// 뒤로 버튼 → 목록 화면, 구독 신청하기 → 이 요금제의 신청 화면
function DetailScreen({
  plan,
  navigate,
}: {
  plan: Plan
  navigate: (route: Route) => void
}) {
  return (
    <main className="screen">
      <Header title="요금제 상세" onBack={() => navigate({ name: "plans" })} />
      <div className="scroll-content screen-with-price-cta">
        <section className="detail-title">
          {plan.badge && <Tag>{plan.badge}</Tag>}
          <h1>{plan.name}</h1>
          <p>{plan.description}</p>
        </section>
        <section className="price-card">
          <span>월 요금</span>
          <div className="price-card-current">
            <strong>{formatPrice(plan.price)}</strong>
            {plan.discount && <b>{plan.discount}</b>}
          </div>
          {/* 원래 가격이 있는(=할인 중인) 요금제만 취소선(<s>) 가격과 프로모션 문구를 보여 준다. */}
          {/* ⚠ 주의: "24개월 할인 프로모션 적용" 문구가 plan.promo 값이 아니라 고정 글자로 적혀 있다. */}
          {/*   그래서 promo 값이 없는 슬림 10 에도 이 문구가 나온다. 의도한 것인지 확인이 필요하다. */}
          {plan.originalPrice && (
            <small>
              <s>{formatPrice(plan.originalPrice)}/월</s> · 24개월 할인 프로모션
              적용
            </small>
          )}
        </section>
        <section className="detail-section">
          <h2>기본 제공</h2>
          {/* 데이터만 요금제마다 다르고, 통화·문자는 모든 요금제에 같은 글자를 고정으로 보여 준다. */}
          <ListRow label="데이터" value={plan.data} />
          <ListRow label="통화" value="집·이동전화 무제한" />
          <ListRow label="문자" value="기본 제공" />
        </section>
        <section className="detail-section">
          <h2>포함 혜택</h2>
          {plan.benefits.map((benefit) => (
            <ListRow key={benefit} label={benefit} value="포함" check />
          ))}
        </section>
      </div>
      <BottomCta
        summary={{ label: "월 납부 금액", amount: formatPrice(plan.price) }}
      >
        <Button onClick={() => navigate({ name: "apply", planId: plan.id })}>
          구독 신청하기
        </Button>
      </BottomCta>
    </main>
  )
}

// [화면 3] 구독 신청 화면.
// 이름·휴대폰 번호를 입력하고 개인정보 동의에 체크하면 "신청하기" 버튼이 활성화된다.
// 입력(props): plan       - 신청할 요금제
//              navigate   - 화면 이동 함수(뒤로 버튼용)
//              onComplete - 신청이 끝났을 때 신청 내역(Application)을 넘겨받아 처리할 함수(App 에서 받아 옴)
// ⚠ 주의: 실제 서버로 전송하는 코드는 없다. 신청 내역은 브라우저 메모리에만 잠깐 저장된다.
function ApplyScreen({
  plan,
  navigate,
  onComplete,
}: {
  plan: Plan
  navigate: (route: Route) => void
  onComplete: (application: Application) => void
}) {
  // 입력칸 3개(이름, 휴대폰 번호, 동의 체크)의 현재 값을 기억한다.
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agreed, setAgreed] = useState(false)
  // 신청 가능 여부. 세 조건이 모두 참이어야 true:
  //   1) 이름의 앞뒤 공백을 뺀(trim) 길이가 2글자 이상
  //   2) 번호에서 숫자만 남긴 길이가 10자리 이상
  //      /\D/g : \D 는 "숫자가 아닌 글자", g 는 "전부". 즉 숫자 아닌 글자를 모두 ""로 지운다.
  //      예) "010-1234-5678" → "01012345678" (11자리)
  //   3) 동의 체크가 되어 있음
  // 이 값은 useState 가 아니라, 화면이 다시 그려질 때마다 새로 계산된다.
  const valid =
    name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 && agreed

  // 휴대폰 번호 입력칸에 글자가 입력될 때마다 실행된다.
  // 숫자만 남기고 최대 11자리로 자른 뒤, 길이에 맞춰 하이픈(-)을 자동으로 넣어 준다.
  // 입력: value - 사용자가 입력칸에 친 그대로의 글자
  // 예) "010"         → "010"
  //     "0101234"     → "010-1234"
  //     "01012345678" → "010-1234-5678"
  //     "010abc12"    → 숫자만 남겨 "01012" → "010-12"
  function handlePhone(value: string) {
    // slice(0, 11): 앞에서부터 11글자까지만 남긴다(12번째 숫자부터는 버림).
    const digits = value.replace(/\D/g, "").slice(0, 11)
    // 삼항 연산자를 이어 붙인 형태. 위에서부터 차례로 검사한다:
    //   3자리 이하   → 그대로
    //   4~7자리      → 앞 3자리-나머지
    //   8자리 이상   → 앞 3자리-가운데 4자리-나머지
    // ⚠ 주의: 항상 3-4-4 로 나누므로 02(서울) 번호나 010-123-4567 같은 10자리 번호는 모양이 어색하게 나온다.
    const formatted =
      digits.length < 4
        ? digits
        : digits.length < 8
          ? `${digits.slice(0, 3)}-${digits.slice(3)}`
          : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    setPhone(formatted)
  }

  // "신청하기"(폼 제출) 버튼을 눌렀을 때 실행된다.
  // 입력값으로 신청 내역(Application)을 만들어서 onComplete 로 넘긴다.
  function submit(event: FormEvent) {
    // 폼을 제출하면 브라우저는 원래 페이지를 새로고침한다. 그걸 막아서 앱 상태가 사라지지 않게 한다.
    event.preventDefault()
    // 조건이 안 맞으면 아무것도 하지 않고 끝낸다(버튼이 비활성이라 보통은 여기 오지 않지만, 한 번 더 막아 둔다).
    if (!valid) return
    const now = new Date()
    onComplete({
      // 신청 번호: "UP" + 연도 + 월 2자리 + 일 2자리 + "-01". 예) 2026년 10월 4일 → "UP20261004-01"
      // getMonth() 는 0~11 을 돌려주므로 +1 해야 실제 월이 된다.
      // padStart(2, "0"): 2자리가 안 되면 앞에 "0"을 채운다. 예) "4" → "04"
      // ⚠ 주의: 끝 번호가 항상 "-01" 로 고정이라, 같은 날 여러 번 신청하면 신청 번호가 겹친다.
      number: `UP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-01`,
      plan,
      name: name.trim(),
      phone,
      // 신청 일시를 한국식 날짜 글자로 바꾼다. 예) "2026. 10. 04. 14:30" (24시간제)
      // [용어] Intl.DateTimeFormat: 날짜·시간을 나라별 표기법에 맞춰 글자로 바꿔 주는 브라우저 내장 기능.
      appliedAt: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now),
    })
  }

  return (
    <main className="screen">
      <Header
        title="구독 신청"
        onBack={() => navigate({ name: "detail", planId: plan.id })}
      />
      {/* form 안의 type="submit" 버튼을 누르거나 입력칸에서 Enter 를 치면 submit 함수가 실행된다. */}
      <form className="application-form" onSubmit={submit}>
        <div className="scroll-content screen-with-cta">
          <section className="title-group title-only">
            <h1>
              신청 정보를
              <br />
              입력해주세요
            </h1>
          </section>
          <section className="apply-summary">
            <ListRow label="선택 요금제" value={plan.name} />
            <ListRow label="월 요금" value={formatPrice(plan.price)} />
          </section>
          <div className="fields">
            {/* [용어] 제어 컴포넌트: 입력칸의 값(value)을 React 상태가 쥐고 있고, 글자를 칠 때마다 onChange 로 상태를 바꾸는 방식. */}
            {/* 이름 칸: 한글(완성형·자음·모음), 영문, 공백이 아닌 글자는 입력하는 즉시 지운다. */}
            {/*   [^...] 는 "괄호 안 글자가 아닌 것", 가-힣 은 완성된 한글, ㄱ-ㅎ/ㅏ-ㅣ 는 자음/모음, \s 는 공백. */}
            {/*   예) "홍길동1!" → "홍길동" */}
            <label className="field">
              <span>이름</span>
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value.replace(
                      /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]/g,
                      "",
                    ),
                  )
                }
                placeholder="이름을 입력해주세요"
                autoComplete="name"
                inputMode="text"
              />
            </label>
            <label className="field">
              <span>휴대폰 번호</span>
              <input
                value={phone}
                onChange={(event) => handlePhone(event.target.value)}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>
            {/* 동의 체크박스. 실제 체크박스(input)는 CSS 로 숨기고, 옆의 check-control 을 대신 꾸며서 보여 주는 방식으로 보인다. */}
            {/* label 로 감쌌기 때문에 글자를 눌러도 체크박스가 눌린다. */}
            <label className="agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span className="check-control" aria-hidden="true">
                {agreed && <img src="/assets/e8d68.svg" alt="" />}
              </span>
              <span>[필수] 개인정보 수집·이용에 동의합니다</span>
            </label>
          </div>
        </div>
        {/* 조건을 다 채우지 않으면(valid 가 false) 버튼이 비활성화된다. */}
        <BottomCta>
          <Button type="submit" disabled={!valid}>
            신청하기
          </Button>
        </BottomCta>
      </form>
    </main>
  )
}

// [화면 4] 신청 완료 화면.
// 신청 내역을 보여 주되, 개인정보 보호를 위해 이름과 휴대폰 번호 일부를 *로 가린다(마스킹).
// 입력(props): application - 보여 줄 신청 내역, navigate - 화면 이동 함수
// ⚠ 주의: navigate 를 받지만 이 화면 안에서는 쓰지 않는다. 뒤로 버튼과 "요금제 더 보기"는 브라우저 기능을 직접 쓴다.
function CompleteScreen({
  application,
  navigate,
}: {
  application: Application
  navigate: (route: Route) => void
}) {
  // 이름 마스킹: 첫 글자 + 가운데는 * + 마지막 글자.
  //   가운데 * 개수 = 전체 길이 - 2, 단 최소 1개(Math.max(1, ...)).
  //   at(-1): 배열/문자열의 "뒤에서 첫 번째", 즉 마지막 글자.
  // 예) "홍길동" → "홍*동",  "김철" → "김*철"(2글자면 * 를 끼워 넣어 3글자가 됨),  "남궁민수" → "남**수"
  // 1글자 이하면 그대로 둔다.
  const maskedName =
    application.name.length > 1
      ? `${application.name[0]}${"*".repeat(Math.max(1, application.name.length - 2))}${application.name.at(-1)}`
      : application.name
  // 번호 마스킹: 숫자만 뽑은 뒤 "앞 3자리-****-뒤 4자리".
  //   slice(-4): 뒤에서 4글자. 예) "01012345678" → "010-****-5678"
  // 숫자가 7자리 미만이면 가리지 않고 그대로 보여 준다.
  const phoneDigits = application.phone.replace(/\D/g, "")
  const maskedPhone =
    phoneDigits.length >= 7
      ? `${phoneDigits.slice(0, 3)}-****-${phoneDigits.slice(-4)}`
      : application.phone

  return (
    <main className="screen">
      {/* 뒤로 버튼: 브라우저의 "뒤로 가기"와 똑같이 동작한다(직전 주소로 이동 → popstate 이벤트 발생). */}
      <Header title="신청 완료" onBack={() => window.history.back()} />
      <div className="scroll-content screen-with-cta complete-content">
        <section className="complete-result">
          <span className="done-mark" aria-hidden="true">
            <img src="/assets/7c149.svg" alt="" />
          </span>
          <h1>구독 신청이 완료됐어요</h1>
          <p>개통 안내는 문자로 보내드려요</p>
        </section>
        <section className="application-card">
          <h2>신청 내역</h2>
          <ListRow label="신청 번호" value={application.number} />
          <ListRow label="요금제" value={application.plan.name} />
          <ListRow
            label="월 요금"
            value={formatPrice(application.plan.price)}
          />
          <ListRow label="신청 일시" value={application.appliedAt} />
          <ListRow label="신청자" value={`${maskedName} · ${maskedPhone}`} />
        </section>
      </div>
      {/* location.assign: 페이지를 /plans 로 "새로 불러온다"(navigate 와 달리 앱이 처음부터 다시 시작됨). */}
      <BottomCta>
        <Button onClick={() => window.location.assign("/plans")}>
          요금제 더 보기
        </Button>
      </BottomCta>
    </main>
  )
}

// ===== 앱의 시작점 =====
// [용어] export default: 이 파일을 다른 파일에서 불러올 때 기본으로 가져가는 대상. (보통 main.tsx 에서 화면에 붙인다.)
//
// App 은 두 가지를 기억한다:
//   route       - 지금 보여 줄 화면
//   application - 마지막으로 완료된 신청 내역(아직 없으면 null)
// 그리고 route 에 따라 4개 화면 중 하나를 골라서 돌려준다.
// 이렇게 라이브러리 없이 URL 과 상태를 직접 맞추는 방식을 "간단한 직접 라우팅"이라고 볼 수 있다.
export default function App() {
  // () => readRoute() 처럼 함수를 넘기면, 처음 한 번만 실행해서 초깃값을 만든다(지연 초기화).
  const [route, setRoute] = useState<Route>(() => readRoute())
  // [용어] Application | null: "신청 내역이거나, 아직 아무것도 없음(null)"이라는 타입.
  const [application, setApplication] = useState<Application | null>(null)

  // [용어] useEffect: 화면을 그린 "뒤에" 실행할 작업을 등록하는 훅.
  //   뒤쪽의 빈 배열 [] 은 "처음 화면에 나타날 때 한 번만 실행"이라는 뜻이다.
  //   안에서 return 한 함수는 컴포넌트가 사라질 때 실행되는 "정리(clean-up)" 함수다.
  useEffect(() => {
    // 주소가 그냥 "/" 이면 "/plans" 로 바꿔 둔다.
    // replaceState: 방문 기록을 새로 쌓지 않고 현재 주소만 바꾼다(뒤로 가기 해도 "/"로 돌아가지 않음).
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/plans")
    }
    // [용어] popstate: 사용자가 브라우저의 뒤로/앞으로 버튼을 눌렀을 때 발생하는 이벤트.
    // 그때 바뀐 주소를 다시 읽어서 route 를 맞춘다 → 화면이 주소에 맞게 바뀐다.
    const onPopState = () => setRoute(readRoute())
    window.addEventListener("popstate", onPopState)
    // 정리 함수: 등록해 둔 이벤트를 해제한다. 안 하면 같은 이벤트가 여러 번 등록되어 중복 실행될 수 있다.
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // 화면 이동 함수. 모든 화면에 props 로 넘겨준다.
  //   1) pushState: 주소창을 새 경로로 바꾸고 방문 기록에 한 칸 추가(새로고침 없이) → 뒤로 가기가 가능해짐
  //   2) setRoute: 상태를 바꿔서 새 화면을 그린다
  //   3) scrollTo(0, 0): 새 화면은 맨 위부터 보이게 스크롤을 올린다
  // 예) navigate({ name: "detail", planId: "slim" }) → 주소 /plans/slim, 슬림 10 상세 화면
  function navigate(next: Route) {
    window.history.pushState({}, "", pathFor(next))
    setRoute(next)
    window.scrollTo(0, 0)
  }

  // ----- 여기부터 route 에 따라 보여 줄 화면을 고른다 -----

  if (route.name === "plans") return <PlansScreen navigate={navigate} />

  if (route.name === "complete") {
    // 신청 내역이 있으면 그것을, 없으면(예: /complete 주소로 바로 들어왔거나 새로고침한 경우) 예시용 가짜 내역을 쓴다.
    // [용어] satisfies: "이 값이 Application 모양에 맞는지 검사만 해 달라"는 TypeScript 문법. 값 자체는 바꾸지 않는다.
    // ⚠ 주의: application 은 메모리에만 있으므로 새로고침하면 사라지고 이 예시 내역이 대신 보인다.
    const completed =
      application ??
      {
        number: "UP20250616-01",
        plan: plans[0],
        name: "신청자",
        phone: "010-0000-0000",
        appliedAt: "2025. 06. 16. 14:30",
      } satisfies Application
    return <CompleteScreen application={completed} navigate={navigate} />
  }

  // 여기까지 왔다면 route 는 "detail" 또는 "apply" 뿐이라 planId 가 반드시 있다.
  // (TypeScript 도 위의 if 문들을 보고 이것을 알아낸다. [용어] 타입 좁히기)
  // [용어] find(): 배열에서 조건에 맞는 "첫 번째" 항목을 찾는다. 없으면 undefined.
  // 주소에 없는 요금제 id 가 들어오면(예: /plans/abc) 첫 번째 요금제를 대신 보여 준다.
  // ⚠ 주의: 잘못된 주소여도 에러 화면 없이 다른 요금제가 보이므로, 사용자가 헷갈릴 수 있다.
  const selectedPlan =
    plans.find((plan) => plan.id === route.planId) ?? plans[0]

  if (route.name === "apply") {
    return (
      <ApplyScreen
        plan={selectedPlan}
        navigate={navigate}
        // 신청이 끝나면: 신청 내역을 App 에 저장한 뒤 완료 화면으로 이동한다.
        // (자식 화면이 부모 App 의 상태를 직접 못 바꾸므로, 이렇게 함수를 내려보내서 대신 바꾸게 한다.)
        onComplete={(completed) => {
          setApplication(completed)
          navigate({ name: "complete" })
        }}
      />
    )
  }

  // 남은 경우는 "detail" 하나뿐 → 상세 화면.
  return <DetailScreen plan={selectedPlan} navigate={navigate} />
}
