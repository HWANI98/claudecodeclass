// PreToolUse(Agent|Task): 하네스 실행 중에는 하네스 에이전트만, 그리고 단계에 맞는 에이전트만 부를 수 있다
import { deny, harnessState, readInput } from "./lib.mjs"

const STAGE_AGENTS = {
  S1: ["spec-reader", "judge"],
  S2: ["route-builder", "judge"],
  S3: ["judge"],
  S4: ["screen-builder", "judge"],
  S5: ["judge"],
}

const input = await readInput()
const state = harnessState()
if (!state) process.exit(0) // 실행 중이 아니면 prd-checker 등 자유롭게 사용

const type = input.tool_input?.subagent_type ?? "general-purpose"
const allowed = STAGE_AGENTS[state.stage] ?? []
if (!allowed.includes(type)) {
  deny(`하네스 실행 중(stage=${state.stage})에는 [${allowed.join(", ") || "없음"}]만 부를 수 있다. 요청: ${type}`)
}
process.exit(0)
