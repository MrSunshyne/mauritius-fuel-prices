<script setup lang="ts">
const { DATA_SOURCE, fetchLiveData } = useFuelPrices()

const route = useRoute()

const dark = ref(false)

onMounted(() => {
  dark.value = localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyTheme()
  fetchLiveData()
})

function toggleDark() {
  dark.value = !dark.value
  localStorage.setItem('theme', dark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', dark.value)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <div class="header-left">
          <NuxtLink to="/" class="header-title">
            <h1>Mauritius Fuel Prices</h1>
          </NuxtLink>
          <nav class="header-nav">
            <NuxtLink to="/" :class="{ active: route.path === '/' || route.path === '/mauritius-fuel-prices/' }">Overview</NuxtLink>
            <NuxtLink to="/comparison" :class="{ active: route.path === '/comparison' || route.path === '/mauritius-fuel-prices/comparison' }">Comparison</NuxtLink>
            <NuxtLink to="/history" :class="{ active: route.path === '/history' || route.path === '/mauritius-fuel-prices/history' }">History</NuxtLink>
          </nav>
        </div>
        <div class="header-actions">
          <a
            href="https://github.com/MrSunshyne/mauritius-fuel-prices"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
            title="View on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button class="theme-toggle" :title="dark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleDark">
            <svg v-if="dark" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 9.2A6.5 6.5 0 0 1 6.8 2 6 6 0 1 0 14 9.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <NuxtPage />

    <footer class="page-footer">
      <p>
        Data sourced from the
        <a :href="DATA_SOURCE.url" target="_blank" rel="noopener noreferrer">{{ DATA_SOURCE.name }}</a>.
        Last verified March 2026.
      </p>
      <p>
        Built by <a href="https://github.com/MrSunshyne" target="_blank" rel="noopener noreferrer">Sandeep Ramgolam</a>
      </p>
    </footer>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --border: #111111;
  --text: #111111;
  --text-secondary: #444444;
  --text-muted: #888888;
  --table-header: #f8f8f8;
  --row-border: #eeeeee;
  --row-hover: #fcfcfc;
  --active-btn-bg: #111111;
  --active-btn-text: #ffffff;
  --petrol-color: #22c55e;
  --diesel-color: #eab308;
  --up-color: #dc2626;
  --down-color: #16a34a;
  --brent-color: #2563eb;
  --neutral-color: #444444;
  --radius: 0px;
  --radius-lg: 0px;
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Bricolage Grotesque', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', SFMono-Regular, ui-monospace, monospace;
}

html.dark {
  --bg: #0c0c0c;
  --surface: #111111;
  --border: #222222;
  --text: #e5e5e5;
  --text-secondary: #a3a3a3;
  --text-muted: #666666;
  --table-header: #181818;
  --row-border: #1a1a1a;
  --row-hover: #161616;
  --active-btn-bg: #e5e5e5;
  --active-btn-text: #0a0a0a;
  --petrol-color: #4ade80;
  --diesel-color: #facc15;
  --brent-color: #60a5fa;
  --up-color: #f87171;
  --down-color: #4ade80;
  color-scheme: dark;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  font-weight: 800;
}

a {
  color: inherit;
  text-decoration: none;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--surface);
  border-bottom: 2px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.header-title {
  text-decoration: none;
  color: inherit;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 0px;
  border: 1.5px solid var(--border);
}

.header-nav a {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.1s;
  border-right: 1.5px solid var(--border);
}

.header-nav a:last-child {
  border-right: none;
}

.header-nav a:hover {
  background: var(--text);
  color: var(--bg);
}

.header-nav a.active {
  background: var(--text);
  color: var(--bg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.github-link, .theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 2px solid var(--border);
  color: var(--text);
  transition: all 0.1s;
  background: transparent;
  cursor: pointer;
}

.github-link:hover, .theme-toggle:hover {
  background: var(--text);
  color: var(--bg);
}

.page-footer {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 24px;
  border-top: 2px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.page-footer p {
  max-width: 400px;
}

.page-footer a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .header-inner {
    height: auto;
    padding: 16px 24px;
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-nav {
    width: 100%;
  }

  .header-nav a {
    flex: 1;
    text-align: center;
  }

  .page-footer {
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }
}
</style>
