// 판정 테스트 실행 설정. app/ 에서 `vitest run --config ../checks/vitest.config.mjs` 로 돈다.
// checks/ 아래 파일은 app/node_modules 를 직접 못 찾으므로 alias 로 app 쪽 패키지를 가리킨다.
// (vitest 를 import 하지 않는 순수 객체 — checks/ 에는 node_modules 가 없다)
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const NM = join(ROOT, "app", "node_modules")

export default {
  root: ROOT,
  resolve: {
    alias: [
      { find: /^@\//, replacement: join(ROOT, "app", "src") + "/" },
      { find: /^react-dom(\/.*)?$/, replacement: join(NM, "react-dom") + "$1" },
      { find: /^react(\/.*)?$/, replacement: join(NM, "react") + "$1" },
      { find: /^@testing-library\/react$/, replacement: join(NM, "@testing-library", "react") },
      { find: /^@testing-library\/dom$/, replacement: join(NM, "@testing-library", "dom") },
    ],
    dedupe: ["react", "react-dom"],
  },
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    include: ["checks/**/*.test.{ts,tsx}"],
    setupFiles: [join(ROOT, "checks", "setup.mjs")],
    css: false,
    testTimeout: 10000,
    server: { deps: { inline: [/@make-kits/] } },
  },
}
