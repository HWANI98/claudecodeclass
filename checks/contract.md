# checks/contract.md — 화면 ↔ 판정 테스트 약속

판정 테스트(`checks/prd/*.test.tsx`)는 아래 `data-testid`와 문구로 화면 요소를 찾는다.
screen-builder는 이 약속을 그대로 지킨다. 테스트는 이 약속이 지켜졌다는 전제로 PRD 규칙을 센다.

공통

- 금액 표기: `59,000원`처럼 `toLocaleString("ko-KR") + "원"` 형식이다. 판정은 정규식 `/\d{1,3}(,\d{3})*원/`으로 금액을 센다.
- 요금제 값은 `app/src/data/plans.ts`에서만 읽는다.
- 화면 전체에서 `<s>`, `<del>`, `<strike>`, `line-through`, "정가", "할인가", "프로모션가", `\d+%`는 0개여야 한다.

## /plans — 요금제 목록 (PlansScreen.tsx)

| testid | 개수 | 내용 |
|---|---|---|
| `plan-card` | 표시 중인 요금제 수 | 카드 1개 요소. `data-plan-id="p01"` 속성을 붙인다. DOM 순서가 표시 순서다. |
| `plan-name` | 카드당 1 | 요금제 이름 |
| `plan-data` | 카드당 1 | 기본 데이터량 (`plans.data`) |
| `plan-throttle` | 카드당 1 | `소진 후 1Mbps로 제한` 또는 `속도 제한 없음` |
| `price-monthly` | 카드당 1 | 매달 내는 금액 (예: `59,000원`, 앞에 "월 "을 붙여도 된다) |
| `price-after` | 할인 요금제 카드에만 1 | 정확히 `25개월째부터 69,000원` 형식 |
| `chip-discount` | 할인 요금제 카드에만 1 | `24개월 할인` |
| `tag-recommended` | 화면 전체 1 (p02 카드 안) | 추천 Tag |
| `filter-chip` | 3 | `전체` / `속도 제한 없음` / `속도 제한 있음`. 선택 상태는 `aria-pressed="true"`로 표시한다. |
| (button) | 카드당 1 | 이름이 `자세히`인 button |

- 카드 안의 금액 텍스트는 `price-monthly` 1개, 그리고 할인 요금제라면 `price-after` 1개뿐이다. 그 밖의 금액은 두지 않는다.

## /plans/[id] — 요금제 상세 (DetailScreen.tsx)

| testid | 개수 | 내용 |
|---|---|---|
| `header-title` | 1 | 요금제 이름 |
| `header-back` | 1 | 뒤로 버튼 (`icon/arrowLeft`) |
| `price-card` | 1 | Card/Price 영역 |
| `price-monthly` | price-card 안 1 | 매달 내는 금액 |
| `price-after` | 할인 요금제의 price-card 안 1 | `25개월째부터 69,000원` |
| `row-data` | 1 | 기본 데이터량 행 |
| `plan-throttle` | 1 | 소진 후 속도 행의 값 |
| `tag-recommended` | 추천 요금제(p02)에만 1 | 추천 Tag |
| `cta-amount` | 1 | BottomCTA의 매달 내는 금액 |
| (button) | 1 | 이름이 `구독 신청하기`인 button. 누르면 `/apply?planId=<id>` |

- 없는 id로 들어오면 `/plans`로 이동한다(`location.pathname === "/plans"`).

## /apply — 구독 신청 (ApplyScreen.tsx)

| testid | 개수 | 내용 |
|---|---|---|
| `header-back` | 1 | 뒤로 버튼 |
| `summary-plan-name` | 1 | 선택한 요금제 이름 |
| `price-monthly` | 1 | 매달 내는 금액 |
| `price-after` | 할인 요금제만 1 | 할인 종료 후 금액 |
| `input-name` | 1 | 이름 `<input>` |
| `input-phone` | 1 | 휴대폰 번호 `<input>` (숫자만, 하이픈 없음) |
| `checkbox-agree` | 1 | 동의 `<input type="checkbox">` |
| `error-name` | 오류일 때만 1 | `이름을 입력해 주세요.` |
| `error-phone` | 오류일 때만 1 | `휴대폰 번호 11자리를 숫자로 입력해 주세요.` |
| `error-save` | 저장 실패일 때만 1 | `신청을 저장하지 못했어요. 다시 시도해 주세요.` |
| `btn-submit` | 1 | `신청하기` `<button>`. 비활성일 때 `disabled` 속성 |
| `btn-cancel` | 1 | `취소` `<button>` |

- planId는 `location.search`의 `planId`에서 읽는다. 없거나 잘못된 id면 `/plans`로 이동한다.

## /complete — 신청 완료 (CompleteScreen.tsx)

| testid | 개수 | 내용 |
|---|---|---|
| `complete-title` | 1 | `구독 신청이 완료됐어요` |
| `complete-id` | 1 | `S` + 숫자 8자리 |
| `complete-plan-name` | 1 | 요금제 이름 |
| `complete-price` | 1 | 매달 내는 금액 |
| `complete-date` | 1 | `YYYY.MM.DD HH:mm` |
| `complete-applicant` | 1 | 가린 이름: 첫 글자 + `*`×max(1, 글자수−2) + 마지막 글자. 1글자면 그대로 (예: `홍길동` → `홍*동`, `김철` → `김*철`) |
| (button) | 1 | 이름이 `요금제 더 보기`인 button → `/plans` |

- 휴대폰 번호는 어떤 형태로도 표시하지 않는다. 완료 화면 DOM에 `/\d{3}-?\*{4}-?\d{4}|\d{10,11}/`가 0개여야 한다.
- 저장된 신청 내역 없이 들어오면 `/plans`로 이동한다.
