import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'
import App from '@/App.vue'
import '@/styles/main.css'

const routes = setupLayouts(generatedRoutes)

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        offset: { x: 0, y: 10 },
      }
    }
    else {
      return { el: 'body' }
    }
  },
})

const app = createApp(App)

app.use(router)
app.mount('#app')
