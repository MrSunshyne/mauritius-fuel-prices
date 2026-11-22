// GoatCounter's script counts the page a visitor lands on. Pages opened after that are shown
// without a reload, so this counts each of them, once the page is on screen: Nuxt writes the
// new page's title just after it finishes, and GoatCounter records document.title.
declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string; title: string }) => void }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  let pending: string | null = null
  const count = (path: string) => window.goatcounter?.count?.({ path, title: document.title })

  useRouter().afterEach((to, from, failure) => {
    // No `from` route means this is the page the visitor landed on, already counted.
    if (failure || !from.matched.length || to.path === from.path) return
    // A page left before it finished still counts, with the title it had.
    if (pending) count(pending)
    pending = location.pathname
  })

  nuxtApp.hook('page:finish', () => {
    const path = pending
    if (!path) return
    pending = null
    setTimeout(() => count(path), 50)
  })
})
