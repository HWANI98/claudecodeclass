// 훅 공용: stdin 읽기, 프로젝트 기준 상대 경로, 하네스 실행 상태, 거부 출력
import { existsSync, readFileSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

export async function readInput() {
  let raw = ""
  for await (const chunk of process.stdin) raw += chunk
  try {
    return JSON.parse(raw || "{}")
  } catch {
    return {}
  }
}

// 프로젝트 안이면 "app/src/x.tsx" 같은 상대 경로, 밖이면 null
export function toRel(p, cwd = ROOT) {
  if (!p) return null
  const clean = String(p).replace(/^["']|["']$/g, "")
  const abs = isAbsolute(clean) ? clean : resolve(cwd || ROOT, clean)
  const r = relative(ROOT, abs).replaceAll("\\", "/")
  if (r.startsWith("..") || isAbsolute(r)) return null
  return r === "" ? "." : r
}

export function harnessState() {
  const f = join(ROOT, "harness", "out", "state.json")
  if (!existsSync(f)) return null
  try {
    const s = JSON.parse(readFileSync(f, "utf8"))
    return s?.stage && s.stage !== "DONE" ? s : null
  } catch {
    // 깨진 state.json 은 실행 중으로 간주해 가장 엄격하게 막는다
    return { stage: "UNKNOWN" }
  }
}

export const ALWAYS_READONLY = ["docs/", "reference/"]
export const RUN_PROTECTED = ["checks/", "scripts/", ".claude/", "CLAUDE.md", "app/src/styles/tokens.css", "harness/out/05-report.json"]
export const STATE_FILE = "harness/out/state.json"

export const under = (rel, prefixes) => prefixes.some((p) => (p.endsWith("/") ? rel === p.slice(0, -1) || rel.startsWith(p) : rel === p))

export function deny(msg) {
  process.stderr.write(`[harness] 거부: ${msg}\n`)
  process.exit(2)
}
