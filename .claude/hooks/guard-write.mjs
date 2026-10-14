// PreToolUse(Write|Edit|MultiEdit|NotebookEdit): 경로 권한 + 토큰 밖 값 거부
import { scanText, SCAN_EXT, TOKENS_CSS } from "../../checks/lib/token-scan.mjs"
import { ALWAYS_READONLY, RUN_PROTECTED, STATE_FILE, deny, harnessState, readInput, toRel, under } from "./lib.mjs"

// 단계별 편집 허용 경로 (CLAUDE.md §2, R6)
const STAGE_PATHS = {
  S1: ["harness/out/01-spec.json"],
  S2: ["app/"],
  S3: [],
  S4: ["app/src/screens/"],
  S5: [],
}
// 훅 입력에 agent_type 이 들어오는 버전이면 에이전트별로도 한 번 더 좁힌다
const AGENT_PATHS = {
  "spec-reader": ["harness/out/01-spec.json"],
  "route-builder": ["app/"],
  "screen-builder": ["app/src/screens/"],
  judge: [],
}

const input = await readInput()
const ti = input.tool_input ?? {}
const rel = toRel(ti.file_path ?? ti.notebook_path, input.cwd)
if (!rel) process.exit(0) // 프로젝트 밖(스크래치 등)

if (under(rel, ALWAYS_READONLY)) deny(`${rel} — docs/·reference/는 읽기 전용`)

const state = harnessState()
if (state) {
  const agent = input.agent_type
  if (rel === STATE_FILE) {
    if (agent && AGENT_PATHS[agent]) deny(`${rel} — state.json은 오케스트레이터만 쓴다`)
    process.exit(0)
  }
  if (under(rel, RUN_PROTECTED)) deny(`${rel} — 하네스 실행 중 보호 경로 (checks/·scripts/·.claude/·CLAUDE.md·tokens.css·05-report)`)
  const allowed = STAGE_PATHS[state.stage] ?? []
  if (!under(rel, allowed)) deny(`${rel} — stage=${state.stage}에서 편집 가능 경로는 [${allowed.join(", ") || "없음"}]`)
  if (agent && AGENT_PATHS[agent] && !under(rel, AGENT_PATHS[agent])) {
    deny(`${rel} — ${agent}의 편집 가능 경로는 [${AGENT_PATHS[agent].join(", ") || "없음"}]`)
  }
}

// app/src 의 코드·CSS 는 새로 들어가는 텍스트만 검사한다 (기존 위반은 G4/G5 가 잡는다)
if (rel.startsWith("app/src/") && SCAN_EXT.test(rel) && rel !== TOKENS_CSS) {
  const added = [ti.content, ti.new_string, ti.new_source, ...(ti.edits ?? []).map((e) => e.new_string)]
    .filter((s) => typeof s === "string")
    .join("\n")
  const hits = scanText(added)
  if (hits.length) {
    const list = hits.slice(0, 10).map((h) => `  - "${h.match}": ${h.reason}`).join("\n")
    deny(`${rel} — 토큰 밖 값 ${hits.length}건 (docs/tokens.json 값 또는 var(--토큰)만 허용)\n${list}`)
  }
}
process.exit(0)
