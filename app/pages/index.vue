<script setup lang="ts">
import { brentPrices } from '~/data/brent'

const {
  currentPrices,
  lastChange,
  allTimePetrolHigh,
  allTimeDieselHigh,
  allTimePetrolLow,
  allTimeDieselLow,
  chronologicalPrices,
  formatDate,
  formatPrice,
  DATA_SOURCE,
} = useFuelPrices()

useSeoMeta({
  title: 'Mauritius Fuel Prices - Petrol & Diesel Price Tracker',
  description: 'Track petrol and diesel price changes in Mauritius from 2002 to present. Data sourced from the State Trading Corporation.',
})

// --- Build unified timeline for dual-axis chart ---
interface TimelinePoint {
  date: string
  brent: number | null
  petrol: number | null
  diesel: number | null
}

const timeline = computed<TimelinePoint[]>(() => {
  const muPrices = chronologicalPrices.value
  const points: TimelinePoint[] = []
  for (const b of brentPrices) {
    const bDate = new Date(b.date + '-15')
    let activePetrol: number | null = null
    let activeDiesel: number | null = null
    for (const mu of muPrices) {
      if (new Date(mu.date) <= bDate) {
        activePetrol = mu.petrol
        activeDiesel = mu.diesel
      } else {
        break
      }
    }
    points.push({ date: b.date, brent: b.price, petrol: activePetrol, diesel: activeDiesel })
  }
  return points
})

// --- Key dates for annotations ---
interface Annotation {
  date: string
  label: string
  detail: string
}

const annotations: Annotation[] = [
  { date: '2008-07', label: 'Oil Peak', detail: 'Brent hit $133/bbl. Petrol reached Rs 49.50.' },
  { date: '2011-01', label: 'PPM Introduced', detail: 'Price Stabilisation Mechanism replaced the old APM.' },
  { date: '2014-07', label: 'Oil Collapse', detail: 'Brent dropped from $112 to $30 over 18 months.' },
  { date: '2020-04', label: 'COVID Crash', detail: 'Brent fell to $18. Mauritius prices stayed flat at Rs 44.' },
  { date: '2022-03', label: 'Ukraine War', detail: 'Brent surged to $117. Petrol hit all-time high Rs 74.10.' },
]

const hoveredAnnotation = ref<string | null>(null)
const hoveredFuel = ref<'petrol' | 'diesel' | null>(null)

// --- Chart dimensions ---
const chartWidth = 900
const chartHeight = 340
const padding = { top: 20, right: 55, bottom: 30, left: 50 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

// --- Scales ---
const brentMax = computed(() => Math.ceil(Math.max(...timeline.value.map(p => p.brent ?? 0)) / 10) * 10)
const muMax = computed(() => Math.ceil(Math.max(...timeline.value.filter(p => p.petrol !== null).map(p => Math.max(p.petrol!, p.diesel!))) / 10) * 10)

function xScale(index: number): number {
  return padding.left + (index / (timeline.value.length - 1)) * innerWidth
}

function yLeft(value: number): number {
  return padding.top + innerHeight - (value / brentMax.value) * innerHeight
}

function yRight(value: number): number {
  return padding.top + innerHeight - (value / muMax.value) * innerHeight
}

function buildPathLeft(values: (number | null)[]): string {
  let started = false
  return values.map((v, i) => {
    if (v === null) return ''
    const cmd = started ? 'L' : 'M'
    started = true
    return `${cmd}${xScale(i).toFixed(1)},${yLeft(v).toFixed(1)}`
  }).join(' ')
}

function buildPathRight(values: (number | null)[]): string {
  let started = false
  return values.map((v, i) => {
    if (v === null) return ''
    const cmd = started ? 'L' : 'M'
    started = true
    return `${cmd}${xScale(i).toFixed(1)},${yRight(v).toFixed(1)}`
  }).join(' ')
}

function buildAreaLeft(values: (number | null)[]): string {
  const line = buildPathLeft(values)
  if (!line) return ''
  let first = -1
  let last = -1
  values.forEach((v, i) => { if (v !== null) { if (first === -1) first = i; last = i } })
  if (first === -1) return ''
  return `${line} L${xScale(last).toFixed(1)},${(padding.top + innerHeight)} L${xScale(first).toFixed(1)},${(padding.top + innerHeight)} Z`
}

const yTicksLeft = computed(() => {
  const step = brentMax.value > 100 ? 20 : 10
  const ticks: number[] = []
  for (let v = 0; v <= brentMax.value; v += step) ticks.push(v)
  return ticks
})

const yTicksRight = computed(() => {
  const step = muMax.value > 50 ? 10 : 5
  const ticks: number[] = []
  for (let v = 0; v <= muMax.value; v += step) ticks.push(v)
  return ticks
})

const xLabels = computed(() => {
  const data = timeline.value
  const labels: { index: number; year: string }[] = []
  let lastYear = ''
  data.forEach((d, i) => {
    const year = d.date.slice(0, 4)
    if (year !== lastYear) {
      labels.push({ index: i, year })
      lastYear = year
    }
  })
  const step = labels.length > 15 ? 3 : labels.length > 8 ? 2 : 1
  return labels.filter((_, i) => i % step === 0)
})

const annotationPositions = computed(() => {
  return annotations.map((a) => {
    const idx = timeline.value.findIndex(p => p.date === a.date)
    return { ...a, x: idx >= 0 ? xScale(idx) : -1, idx }
  }).filter(a => a.x >= 0)
})

const tooltip = ref<{ show: boolean; x: number; point: TimelinePoint | null }>({
  show: false, x: 0, point: null,
})

function handleChartHover(event: MouseEvent) {
  const svgEl = (event.currentTarget as SVGElement).closest('svg')
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const scaledX = (event.clientX - rect.left) * (chartWidth / rect.width)
  const data = timeline.value
  let closestIdx = 0
  let closestDist = Infinity
  for (let i = 0; i < data.length; i++) {
    const dist = Math.abs(xScale(i) - scaledX)
    if (dist < closestDist) { closestDist = dist; closestIdx = i }
  }
  tooltip.value = { show: true, x: xScale(closestIdx), point: data[closestIdx] }
  const nearAnnotation = annotationPositions.value.find(a => Math.abs(a.x - xScale(closestIdx)) < 12)
  hoveredAnnotation.value = nearAnnotation?.date ?? null
}

function handleChartLeave() {
  tooltip.value.show = false
  hoveredAnnotation.value = null
}

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[parseInt(month) - 1]} ${year}`
}
</script>

<template>
  <main class="main">
    <div class="bento-grid">
      <!-- HERO & INFO -->
      <section class="bento-item hero">
        <div class="hero-content">
          <span class="eyebrow">Data Report // STC Mauritius</span>
          <h2>Fuel Price Index</h2>
          <p>Tracking retail mogas and gas oil fluctuations in Mauritius since 2002. An analytical view of local price movements against global Brent benchmarks.</p>
        </div>
        <div class="hero-meta">
          <div class="meta-item">
            <span class="meta-label">Last Updated</span>
            <span class="meta-value">March 15, 2026</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-value pulse">Live Market</span>
          </div>
        </div>
      </section>

      <!-- PETROL CARD -->
      <div
        class="bento-item price-card petrol-card"
        :class="{ dimmed: hoveredFuel && hoveredFuel !== 'petrol', highlighted: hoveredFuel === 'petrol' }"
        @mouseenter="hoveredFuel = 'petrol'"
        @mouseleave="hoveredFuel = null"
      >
        <div class="card-header">
          <span class="fuel-dot petrol" />
          <span class="card-title">Mogas (Petrol)</span>
          <span class="card-code">RON 95</span>
        </div>
        <div class="card-body">
          <div class="price-value">{{ formatPrice(currentPrices.petrol) }}</div>
          <div class="price-change" :class="{ up: lastChange.petrol > 0, down: lastChange.petrol < 0 }">
            <span class="change-icon">{{ lastChange.petrol > 0 ? '▲' : '▼' }}</span>
            <span class="change-val">{{ Math.abs(lastChange.petrol).toFixed(2) }} MUR</span>
          </div>
        </div>
        <div class="card-footer">
          Since {{ formatDate(lastChange.sinceDate) }}
        </div>
      </div>

      <!-- DIESEL CARD -->
      <div
        class="bento-item price-card diesel-card"
        :class="{ dimmed: hoveredFuel && hoveredFuel !== 'diesel', highlighted: hoveredFuel === 'diesel' }"
        @mouseenter="hoveredFuel = 'diesel'"
        @mouseleave="hoveredFuel = null"
      >
        <div class="card-header">
          <span class="fuel-dot diesel" />
          <span class="card-title">Gas Oil (Diesel)</span>
          <span class="card-code">Euro 5</span>
        </div>
        <div class="card-body">
          <div class="price-value">{{ formatPrice(currentPrices.diesel) }}</div>
          <div class="price-change" :class="{ up: lastChange.diesel > 0, down: lastChange.diesel < 0 }">
            <span class="change-icon">{{ lastChange.diesel > 0 ? '▲' : '▼' }}</span>
            <span class="change-val">{{ Math.abs(lastChange.diesel).toFixed(2) }} MUR</span>
          </div>
        </div>
        <div class="card-footer">
          Since {{ formatDate(lastChange.sinceDate) }}
        </div>
      </div>

      <!-- CHART SECTION -->
      <section class="bento-item chart-section">
        <div class="section-header">
          <h3>Historical Analysis</h3>
          <div class="chart-legend">
            <span class="legend-item" :class="{ active: hoveredFuel === 'petrol' }" @mouseenter="hoveredFuel = 'petrol'" @mouseleave="hoveredFuel = null">
              <span class="legend-line petrol" /> Petrol
            </span>
            <span class="legend-item" :class="{ active: hoveredFuel === 'diesel' }" @mouseenter="hoveredFuel = 'diesel'" @mouseleave="hoveredFuel = null">
              <span class="legend-line diesel" /> Diesel
            </span>
            <span class="legend-item brent">
              <span class="legend-line brent" /> Brent Crude
            </span>
          </div>
        </div>

        <div class="chart-container">
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            preserveAspectRatio="xMidYMid meet"
            class="chart-svg"
            @mousemove="handleChartHover"
            @mouseleave="handleChartLeave"
          >
            <!-- Grid lines -->
            <line
              v-for="tick in yTicksLeft"
              :key="tick"
              :x1="padding.left"
              :y1="yLeft(tick)"
              :x2="padding.left + innerWidth"
              :y2="yLeft(tick)"
              class="grid-line"
            />

            <!-- Left Y-axis labels (Brent USD) -->
            <text
              v-for="tick in yTicksLeft"
              :key="'l-' + tick"
              :x="padding.left - 8"
              :y="yLeft(tick) + 3"
              class="axis-label axis-label-left"
              text-anchor="end"
            >{{ tick }}</text>

            <!-- Right Y-axis labels (Mauritius Rs) -->
            <text
              v-for="tick in yTicksRight"
              :key="'r-' + tick"
              :x="padding.left + innerWidth + 8"
              :y="yRight(tick) + 3"
              class="axis-label"
              text-anchor="start"
            >{{ tick }}</text>

            <!-- X-axis labels -->
            <text
              v-for="label in xLabels"
              :key="'x-' + label.year"
              :x="xScale(label.index)"
              :y="padding.top + innerHeight + 20"
              class="axis-label"
              text-anchor="middle"
            >{{ label.year }}</text>

            <!-- Annotation lines -->
            <g
              v-for="a in annotationPositions"
              :key="'ann-' + a.date"
              class="annotation-group"
              :class="{ highlighted: hoveredAnnotation === a.date }"
            >
              <line
                :x1="a.x"
                :y1="padding.top"
                :x2="a.x"
                :y2="padding.top + innerHeight"
                class="annotation-line"
              />
              <text
                :x="a.x"
                :y="padding.top - 6"
                class="annotation-label"
                text-anchor="middle"
              >{{ a.label }}</text>
            </g>

            <!-- Brent area & line -->
            <path :d="buildAreaLeft(timeline.map(p => p.brent))" class="area-brent" />
            <path :d="buildPathLeft(timeline.map(p => p.brent))" class="line-brent" fill="none" />

            <!-- Petrol & Diesel lines -->
            <path
              :d="buildPathRight(timeline.map(p => p.petrol))"
              class="line-petrol"
              :class="{ highlighted: hoveredFuel === 'petrol', dimmed: hoveredFuel && hoveredFuel !== 'petrol' }"
              fill="none"
            />
            <path
              :d="buildPathRight(timeline.map(p => p.diesel))"
              class="line-diesel"
              :class="{ highlighted: hoveredFuel === 'diesel', dimmed: hoveredFuel && hoveredFuel !== 'diesel' }"
              fill="none"
            />

            <!-- Hover indicator -->
            <template v-if="tooltip.show && tooltip.point">
              <line :x1="tooltip.x" :y1="padding.top" :x2="tooltip.x" :y2="padding.top + innerHeight" class="hover-line" />
              <circle v-if="tooltip.point.brent" :cx="tooltip.x" :cy="yLeft(tooltip.point.brent)" r="3" class="hover-dot brent" />
              <circle v-if="tooltip.point.petrol" :cx="tooltip.x" :cy="yRight(tooltip.point.petrol)" r="4" class="hover-dot petrol" />
              <circle v-if="tooltip.point.diesel" :cx="tooltip.x" :cy="yRight(tooltip.point.diesel)" r="4" class="hover-dot diesel" />
            </template>
          </svg>

          <!-- Tooltip -->
          <div v-if="tooltip.show && tooltip.point" class="chart-tooltip" :style="{ left: `${(tooltip.x / chartWidth) * 100}%` }">
            <div class="tooltip-date">{{ formatMonth(tooltip.point.date) }}</div>
            <div class="tooltip-row"><span class="fuel-dot petrol" /> PETROL: {{ tooltip.point.petrol?.toFixed(2) }}</div>
            <div class="tooltip-row"><span class="fuel-dot diesel" /> DIESEL: {{ tooltip.point.diesel?.toFixed(2) }}</div>
            <div class="tooltip-row brent-row"><span class="fuel-dot brent" /> BRENT: {{ tooltip.point.brent?.toFixed(2) }}</div>
          </div>

          <!-- Annotation detail popup -->
          <div v-if="hoveredAnnotation" class="annotation-popup">
            {{ annotationPositions.find(a => a.date === hoveredAnnotation)?.detail }}
          </div>
        </div>
      </section>

      <!-- EXTREMES -->
      <section class="bento-item extremes">
        <div class="section-header">
          <h3>Market Extremes</h3>
        </div>
        <div class="extremes-grid">
          <div class="extreme-item">
            <span class="label">Petrol Peak</span>
            <span class="value">{{ formatPrice(allTimePetrolHigh) }}</span>
          </div>
          <div class="extreme-item">
            <span class="label">Diesel Peak</span>
            <span class="value">{{ formatPrice(allTimeDieselHigh) }}</span>
          </div>
          <div class="extreme-item">
            <span class="label">Petrol Floor</span>
            <span class="value">{{ formatPrice(allTimePetrolLow) }}</span>
          </div>
          <div class="extreme-item">
            <span class="label">Diesel Floor</span>
            <span class="value">{{ formatPrice(allTimeDieselLow) }}</span>
          </div>
        </div>
      </section>

      <!-- NAVIGATION -->
      <nav class="bento-item quick-nav">
        <NuxtLink to="/comparison" class="nav-btn">
          <span>Brent Comparison</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink to="/history" class="nav-btn">
          <span>Price Registry</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(160px, auto);
  gap: 20px;
}

.bento-item {
  background: var(--surface);
  border: 2px solid var(--border);
  padding: 24px;
  display: flex;
  flex-direction: column;
}

/* Hero */
.hero {
  grid-column: span 2;
  grid-row: span 2;
  justify-content: space-between;
}

.eyebrow {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.hero h2 {
  font-size: 48px;
  line-height: 0.95;
  margin-bottom: 24px;
}

.hero p {
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 360px;
}

.hero-meta {
  display: flex;
  gap: 32px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.meta-label {
  display: block;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.meta-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}

.pulse {
  color: var(--down-color);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse::before {
  content: '';
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* Price Cards */
.price-card {
  grid-column: span 1;
  grid-row: span 2;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.price-card.dimmed { opacity: 0.3; filter: grayscale(1); }
.price-card.highlighted { border-width: 4px; padding: 22px; }

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.card-code {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
}

.fuel-dot {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--border);
}

.fuel-dot.petrol { background: var(--petrol-color); }
.fuel-dot.diesel { background: var(--diesel-color); }
.fuel-dot.brent { background: var(--brent-color); }

.price-value {
  font-family: var(--font-mono);
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  margin-bottom: 8px;
}

.price-change {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
}

.change-icon { font-size: 12px; }

.price-change.up { color: var(--up-color); }
.price-change.down { color: var(--down-color); }

.card-footer {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Chart */
.chart-section {
  grid-column: span 3;
  grid-row: span 2;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.section-header h3 { font-size: 14px; }

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.1s;
}

.legend-item.active, .legend-item:hover { opacity: 1; }
.legend-item.brent { cursor: default; }

.legend-line {
  width: 24px;
  height: 3px;
  background: var(--text);
}

.legend-line.petrol { background: var(--petrol-color); }
.legend-line.diesel { background: var(--diesel-color); }
.legend-line.brent { background: var(--brent-color); height: 1.5px; opacity: 0.4; }

.chart-container {
  position: relative;
  flex: 1;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.grid-line { stroke: var(--row-border); stroke-width: 1; }
.axis-label { font-family: var(--font-mono); font-size: 9px; fill: var(--text-muted); font-weight: 600; }
.axis-label-left { opacity: 0.4; }

.area-brent { fill: var(--brent-color); opacity: 0.03; }
.line-brent { stroke: var(--brent-color); stroke-width: 1.5; opacity: 0.3; }

.line-petrol { stroke: var(--petrol-color); stroke-width: 2.5; transition: all 0.2s; }
.line-diesel { stroke: var(--diesel-color); stroke-width: 2.5; transition: all 0.2s; }

.line-petrol.dimmed, .line-diesel.dimmed { opacity: 0.1; stroke-width: 1; }
.line-petrol.highlighted, .line-diesel.highlighted { stroke-width: 4; }

.annotation-line { stroke: var(--border); stroke-width: 1; stroke-dasharray: 4 4; opacity: 0.15; transition: all 0.2s; }
.annotation-label { font-family: var(--font-mono); font-size: 8px; font-weight: 700; fill: var(--text-muted); opacity: 0.6; transition: all 0.2s; }

.annotation-group.highlighted .annotation-line { opacity: 0.8; stroke-dasharray: none; stroke-width: 1.5; }
.annotation-group.highlighted .annotation-label { opacity: 1; fill: var(--text); font-size: 9px; }

.hover-line { stroke: var(--text); stroke-width: 1; stroke-dasharray: 2 2; }
.hover-dot { stroke: var(--bg); stroke-width: 2; }
.hover-dot.brent { fill: var(--brent-color); }
.hover-dot.petrol { fill: var(--petrol-color); }
.hover-dot.diesel { fill: var(--diesel-color); }

.chart-tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--bg);
  padding: 12px;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: 10px;
  z-index: 10;
  min-width: 140px;
}

.tooltip-date { font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px; }
.tooltip-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.brent-row { opacity: 0.6; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); }

.annotation-popup {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--bg);
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
  z-index: 20;
  border: 1px solid var(--bg);
}

/* Extremes */
.extremes {
  grid-column: span 1;
  grid-row: span 2;
}

.extremes-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.extreme-item {
  display: flex;
  flex-direction: column;
}

.extreme-item .label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.extreme-item .value {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 800;
}

/* Quick Nav */
.quick-nav {
  grid-column: span 4;
  grid-row: span 1;
  flex-direction: row;
  padding: 0;
  border: none;
  gap: 20px;
}

.nav-btn {
  flex: 1;
  background: var(--surface);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.1s;
}

.nav-btn:hover {
  background: var(--text);
  color: var(--bg);
}

@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero, .chart-section, .quick-nav { grid-column: span 2; }
}

@media (max-width: 640px) {
  .bento-grid { grid-template-columns: 1fr; }
  .hero, .price-card, .chart-section, .extremes, .quick-nav { grid-column: span 1; }
  .hero h2 { font-size: 32px; }
  .price-value { font-size: 48px; }
  .quick-nav { flex-direction: column; }
}
</style>