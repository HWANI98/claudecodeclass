// jsdom 에 없는 브라우저 API 를 채우고, 테스트마다 화면·주소를 초기화한다.
process.env.RTL_SKIP_AUTO_CLEANUP = "true"

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })
}
for (const name of ["ResizeObserver", "IntersectionObserver"]) {
  if (!globalThis[name]) {
    globalThis[name] = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
  }
}
window.scrollTo = () => {}
Element.prototype.scrollIntoView ??= function () {}

globalThis.__harnessCleanup = []
afterEach(() => {
  for (const fn of globalThis.__harnessCleanup.splice(0)) fn()
  document.body.innerHTML = ""
  window.history.replaceState({}, "", "/")
})
