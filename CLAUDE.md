# CLAUDE.md — 화면 구현 하네스

## 0. 이 대화의 역할
- 메인 대화는 **오케스트레이터**다. `app/`을 직접 Write/Edit하지 않는다.
  하는 일은 4가지뿐이다: ① 에이전트 호출 ② 게이트 실행 ③ `harness/out/state.json` 갱신 ④ 커밋.
- `docs/`, `reference/`는 읽기 전용이다. 비주얼 규칙의 SSOT는 `docs/tokens.json` 하나다.
- PRD·screens.md에 없는 내용은 지어내지 않는다. 모호하면 멈추고 사람에게 묻는다.

## 1. 부르는 말
| 말 | 동작 |
|---|---|
| `하네스 시작` | `harness/run-YYYYMMDD` 브랜치 생성 → state.json 초기화(stage=S1) → S1 |
| `하네스 이어 하기` | §5 확인 후 state.json의 stage/screen부터 재개 |
| `하네스 상태` | stage·screen·retries·마지막 05-report 요약 출력 (아무것도 실행하지 않음) |
| `승인` / `반려: <사유>` | §6 승인 지점에서만 유효 |

## 2. 파이프라인
| 단계 | 실행 | 게이트 | 통과 시 |
|---|---|---|---|
| S1 PRD 읽기 | Agent `spec-reader` | `node checks/run.mjs G1` | 커밋 → S2 |
| S2 페이지 나누기 | Agent `route-builder` | `node checks/run.mjs G2` | 커밋 → S3 |
| S3 토큰 적용 | `node scripts/gen-tokens.mjs` | `node checks/run.mjs G3` | 커밋 → S4 |
| S4 화면 구현 | Agent `screen-builder` (화면 1개씩: `/plans` → `/plans/[id]` → `/apply` → `/complete`) | `node checks/run.mjs G4 --screen <route>` | 화면마다 커밋 → 다음 화면, 4개 끝나면 S5 |
| S5 검증 | — | `node checks/run.mjs G5` | §6 사람 승인 |

- 게이트는 종료 코드 0일 때만 통과로 본다. 결과는 스크립트가 `harness/out/05-report.json`에 쓴다.
- 에이전트를 부를 때 프롬프트에 다음을 넣는다: §7 맥락, 이번 단계·화면, 직전 judge 지시(있으면).
- 단계를 옮길 때는 **먼저** state.json의 `stage`/`screen`을 바꾸고 나서 에이전트를 부른다. 훅이 이 값으로 편집 가능 경로를 정한다.

## 3. 실패 루프
1. 게이트 실패 → `state.retries += 1`
2. Agent `judge` 호출(05-report와 실패 소스를 읽고, 고칠 지시를 텍스트로 돌려줌)
3. judge 지시를 해당 단계 에이전트에 그대로 넘겨 재시도 → 같은 게이트 재실행
4. `retries == 3`이면 멈춘다. 05-report의 실패 항목을 보여 주고 사람에게 묻는다.
5. 돌아갈 곳은 05-report의 `return_to`를 따른다.
   `SPEC-*` → S1 · `ROUTE-*` → S2 · `TOKEN-CSS-*` → S3 · `TOKEN-*`/`PRD-*`/`PII-*`/`BUILD-*`/`LINT-*` → 해당 화면 S4
   (S2 진행 중에 `BUILD-*`/`LINT-*`가 나오면 S2)

## 4. state.json
```json
{ "stage": "S1|S2|S3|S4|S5|DONE", "screen": "/plans|null", "retries": 0, "lastCommit": "<sha>|null", "branch": "harness/run-YYYYMMDD" }
```
- 게이트를 통과할 때마다 `retries=0`, 커밋하고, `lastCommit`을 갱신한다.
- stage를 건너뛰어 바꾸지 않는다. `stage`가 있고 `DONE`이 아니면 "하네스 실행 중"이다.

## 5. 이어 하기
- state.json의 `lastCommit`이 `git rev-parse HEAD`와 다르거나, 작업 트리가 dirty이면 진행하지 않고 사람에게 묻는다.

## 6. 사람 승인 (1곳)
- G5가 통과했을 때만 승인 지점에 들어간다. **05-report의 `core_rule_failed`가 true(PRD-PRICE 실패)이면 승인 지점에 들어가지 않는다.**
- 05-report 요약과 dev 서버 실행 방법(`app/`에서 `npx vite`)을 보여 주고 `승인` / `반려: <사유>`를 기다린다.
- `승인` → 최종 커밋, stage=DONE. `반려` → 사유를 §3-5 기준으로 분류해 해당 단계로 돌아간다(retries=0).

## 7. 맥락 (에이전트 프롬프트에 그대로 넣는다)
1. 매달 20일쯤 데이터가 떨어지는 출퇴근 영상 시청 고객이 데이터량 기준으로 요금제를 비교한다.
2. 속도 제한 유무 필터로 후보를 줄이고 추천(p02)을 참고한다.
3. "무제한"이라는 이름이어도 소진 후 속도 제한 여부를 카드에서 바로 확인한다.
4. 매달 내는 금액 1개와, 24개월 할인 종료 후 금액(할인 있는 요금제만)을 확인한다.
5. 포털로 나가지 않고 이름·휴대폰·동의만으로 구독을 신청하고 완료 내역을 본다.

**어기면 안 되는 것(핵심) — R-가격:** 카드 4개와 상세 Card/Price에서 "매달 내는 금액"은 정확히 1개다. "25개월째부터 ○원"은 p03에만 1개 있다. 취소선·정가·할인가·프로모션가·%할인율은 0개다.

## 8. 커밋
- 브랜치는 `harness/run-YYYYMMDD`. main에 커밋하지 않고 push하지 않는다.
- 메시지: `harness(<stage>[:<route>]): <한 줄 요약>`
- `harness/out/`(spec·state·report)도 함께 커밋한다. `node_modules/`, `app/dist/`는 커밋하지 않는다.

## 9. 금지
- tokens.json에 없는 색·px 값, `tokens.css` 직접 수정
- `checks/`·`scripts/`·`.claude/`·이 파일 수정, 훅 끄기, `--no-verify`, 게이트 건너뛰기
- reference의 데이터·문구 가져오기 (구조만 참고)
- 완료 화면에 휴대폰 번호 표시 (이름은 `첫 글자 + *×max(1,n−2) + 마지막 글자`)
- **하네스 실행 중에는 하네스 에이전트(`spec-reader`·`route-builder`·`screen-builder`·`judge`) 외의 에이전트를 부르지 않는다.** `prd-checker`, `general-purpose` 등도 포함한다. 단계와 맞지 않는 에이전트도 부르지 않는다(S1=spec-reader, S2=route-builder, S4=screen-builder, judge는 어느 단계든).

## 10. 훅이 막는 것 (`.claude/settings.json`)
| 훅 | 막는 것 |
|---|---|
| `guard-write.mjs` | 항상: `docs/`·`reference/` 수정 / 실행 중: 단계별 허용 경로 밖 편집, `checks/`·`scripts/`·`.claude/`·`CLAUDE.md`·`tokens.css` 수정 / `app/src`에 토큰 밖 값 추가 |
| `guard-bash.mjs` | 항상: `docs/`·`reference/` 대상 쓰기·삭제 명령, `--no-verify` / 실행 중: 보호 경로 대상 쓰기·삭제, `git push`, main 브랜치 커밋 |
| `guard-agent.mjs` | 실행 중: 하네스 외 에이전트 호출, 단계와 맞지 않는 에이전트 호출 |

하네스를 고치려면 실행 중이 아닐 때(state.json이 없거나 stage=DONE) 고친다.
