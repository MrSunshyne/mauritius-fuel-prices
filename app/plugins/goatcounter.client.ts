// GoatCounter's script counts the page a visitor lands on. Pages opened after that are shown
// without a reload, so this counts each of them.
declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string }) => void }
  }
}

export default defineNuxtPlugin(() => {
  useRouter().afterEach((to, from, failure) => {
    // No `from` route means this is the page the visitor landed on, already counted.
    if (failure || !from.matched.length || to.path === from.path) return
    window.goatcounter?.count?.({ path: location.pathname })
  })
})
