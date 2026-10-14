// G2: 라우트 수 = screens.md 화면 수, plans.ts = 01-spec.json plans
import { appPath, spec } from "../prd/helpers.mjs"

const norm = (r: string) => r.replace(/\[(\w+)\]/g, ":$1")

describe("G2 routes", () => {
  test("ROUTE-COUNT 라우트 수 = spec 화면 수", async () => {
    const { routes } = await import(/* @vite-ignore */ appPath("routes.tsx"))
    expect(Array.isArray(routes), "routes.tsx 는 routes 배열을 export").toBe(true)
    expect(routes.length).toBe(spec.screens.length)
  })

  test("ROUTE-PATHS 라우트 경로·화면 이름이 spec 순서와 같음", async () => {
    const { routes } = await import(/* @vite-ignore */ appPath("routes.tsx"))
    expect(routes.map((r: any) => norm(r.path))).toEqual(spec.screens.map((s: any) => norm(s.route)))
    expect(routes.map((r: any) => r.screen)).toEqual(spec.screens.map((s: any) => s.file.replace(/\.tsx$/, "")))
  })

  test("ROUTE-PLANS plans.ts = 01-spec.json plans", async () => {
    const { plans } = await import(/* @vite-ignore */ appPath("data", "plans.ts"))
    expect(plans).toEqual(spec.plans)
  })

  test("ROUTE-APP App.tsx default export 가 컴포넌트", async () => {
    const mod = await import(/* @vite-ignore */ appPath("App.tsx"))
    expect(typeof mod.default).toBe("function")
  })
})
