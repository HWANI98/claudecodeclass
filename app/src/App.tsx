import { useCallback, useEffect, useState, type ComponentType } from "react"
import { routes } from "./routes"
import PlansScreen from "./screens/PlansScreen"
import DetailScreen from "./screens/DetailScreen"
import ApplyScreen from "./screens/ApplyScreen"
import CompleteScreen from "./screens/CompleteScreen"

export type Subscription = {
  id: string
  planId: string
  name: string
  phone: string
  createdAt: string
}

const screens: Record<string, ComponentType> = {
  PlansScreen,
  DetailScreen,
  ApplyScreen,
  CompleteScreen,
}

function matchRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  for (const r of routes) {
    const rp = r.path.split("/").filter(Boolean)
    if (rp.length !== parts.length) continue
    if (rp.every((seg, i) => seg.startsWith(":") || seg === parts[i])) {
      return r
    }
  }
  return undefined
}

export default function App() {
  const [location, setLocation] = useState(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", "/plans" + window.location.search)
    }
    return window.location.pathname + window.location.search
  })
  // 신청 내역은 메모리에만 둔다 (화면에서 쓰는 S4가 context/props로 연결)
  const [, setSubscription] = useState<Subscription | null>(null)
  void setSubscription

  useEffect(() => {
    const onPop = () =>
      setLocation(window.location.pathname + window.location.search)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, "", to)
    setLocation(window.location.pathname + window.location.search)
  }, [])
  void navigate

  const pathname = location.split("?")[0]
  const route = matchRoute(pathname)
  const Screen = route ? screens[route.screen] : undefined
  return Screen ? <Screen /> : <PlansScreen />
}
