// PreToolUse(Bash|PowerShell): 보호 경로를 대상으로 한 쓰기·삭제, push, --no-verify, main 커밋 거부
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { ALWAYS_READONLY, ROOT, RUN_PROTECTED, deny, harnessState, readInput, toRel, under } from "./lib.mjs"

const input = await readInput()
const cmd = String(input.tool_input?.command ?? "")
const state = harnessState()
const protectedNow = state ? [...ALWAYS_READONLY, ...RUN_PROTECTED] : ALWAYS_READONLY

if (/(^|\s)--no-verify\b/.test(cmd)) deny("--no-verify 금지 (게이트·훅 우회)")
if (state && /\bgit\s+push\b/.test(cmd)) deny("하네스 실행 중 git push 금지")
if (state && /\bgit\s+commit\b/.test(cmd)) {
  const head = existsSync(join(ROOT, ".git", "HEAD")) ? readFileSync(join(ROOT, ".git", "HEAD"), "utf8").trim() : ""
  if (/refs\/heads\/(main|master)$/.test(head)) deny("하네스 실행 중 main 브랜치 커밋 금지 — harness/run-YYYYMMDD 브랜치에서 커밋")
}

const unq = (s) => s.replace(/^["'`]+|["'`;,)]+$/g, "")
const words = (seg) => seg.trim().split(/\s+/).map(unq).filter(Boolean)
const isPathish = (w) => !w.startsWith("-") && /[\w.]/.test(w)
const targets = []

for (const seg of cmd.split(/&&|\|\||;|\r?\n/)) {
  // 리다이렉션 / tee
  for (const m of seg.matchAll(/(?:^|[^\d&<-])>{1,2}\s*([^\s|;&]+)/g)) targets.push(m[1])
  for (const m of seg.matchAll(/\btee\s+(?:-a\s+)?([^\s|;&]+)/g)) targets.push(m[1])
  for (const part of seg.split("|")) {
    const w = words(part)
    if (!w.length) continue
    const head = w[0].toLowerCase()
    const args = w.slice(1).filter(isPathish)
    // 복사·이동은 마지막 인자(목적지)만, 이동은 원본도 사라지므로 전부
    if (["cp", "copy-item", "cpi", "rsync", "robocopy", "xcopy"].includes(head)) targets.push(...args.slice(-1))
    else if (["mv", "move-item", "mi", "rename-item", "ren"].includes(head)) targets.push(...args)
    else if (
      ["rm", "rmdir", "del", "erase", "unlink", "truncate", "touch", "mkdir", "chmod", "remove-item", "ri", "set-content", "sc", "add-content", "ac", "out-file", "clear-content", "new-item", "ni"].includes(head)
    )
      targets.push(...args)
    else if (head === "sed" && w.some((x) => /^-i/.test(x))) targets.push(...args)
    else if (head === "git" && ["checkout", "restore", "rm", "mv", "clean"].includes(w[1]?.toLowerCase())) targets.push(...args.slice(1))
    else if (/^(node|python3?|deno|bun|perl|ruby)$/.test(head) && /writeFile|appendFile|rmSync|unlink|open\(.+['"]w/.test(part)) {
      for (const m of part.matchAll(/['"`]([^'"`]*(?:docs|reference|checks|scripts|\.claude|CLAUDE\.md|tokens\.css)[^'"`]*)['"`]/g)) targets.push(m[1])
    }
  }
}

for (const t of targets) {
  const rel = toRel(t, input.cwd)
  if (!rel) continue
  if (rel === ".") deny(`프로젝트 루트 전체를 대상으로 한 쓰기·삭제 명령 (명령: ${cmd.slice(0, 120)})`)
  if (under(rel, protectedNow)) deny(`${rel} — ${under(rel, ALWAYS_READONLY) ? "docs/·reference/는 읽기 전용" : "하네스 실행 중 보호 경로"} (명령: ${cmd.slice(0, 120)})`)
}
process.exit(0)
