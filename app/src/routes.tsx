type Route = {
  path: string
  screen: string
}

export const routes: Route[] = [
  {
    path: "/plans",
    screen: "PlansScreen",
  },
  {
    path: "/plans/:id",
    screen: "DetailScreen",
  },
  {
    path: "/apply",
    screen: "ApplyScreen",
  },
  {
    path: "/complete",
    screen: "CompleteScreen",
  },
]
