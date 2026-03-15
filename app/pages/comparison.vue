<script setup lang="ts">
import { brentPrices } from '~/data/brent'

const { chronologicalPrices, formatDate, formatPrice } = useFuelPrices()

useSeoMeta({
  title: 'Global Comparison - Mauritius Fuel Prices',
  description: 'Compare Mauritius retail fuel prices against Brent Crude oil benchmark to understand the correlation between global oil markets and local pump prices.',
})

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

const chartWidth = 900
const chartHeight = 400
const padding = { top: 20, right: 60, bottom: 40, left: 60 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const brentMax = computed(() => Math.ceil(Math.max(...timeline.value.map(p => p.brent ?? 0)) / 10) * 10)
const muMax = computed(() => Math.ceil(Math.max(...timeline.value.filter(p => p.petrol !== null).map(p => Math.max(p.petrol!, p.diesel!))) / 10) * 10)

function xScale(index: number): number {
  return padding.left + (index / (timeline.value.length - 1)) * innerWidth
}
function yScaleLeft(value: number): number {
  return padding.top + innerHeight - (value / brentMax.value) * innerHeight
}
function yScaleRight(value: number): number {
  return padding.top + innerHeight - (value / muMax.value) * innerHeight
}

function buildPathLeft(values: (number | null)[]): string {
  let started = false
  return values.map((v, i) => {
    if (v === null) return ''
    const cmd = started ? 'L' : 'M'
    started = true
    return `${cmd}${xScale(i).toFixed(1)},${yScaleLeft(v).toFixed(1)}`
  }).join(' ')
}
function buildPathRight(values: (number | null)[]): string {
  let started = false
  return values.map((v, i) => {
    if (v === null) return ''
    const cmd = started ? 'L' : 'M'
    started = true
    return `${cmd}${xScale(i).toFixed(1)},${yScaleRight(v).toFixed(1)}`
  }).join(' ')
}

const yTicksLeft = computed(() => {
  const ticks = []
  for (let v = 0; v <= brentMax.value; v += 20) ticks.push(v)
  return ticks
})
const yTicksRight = computed(() => {
  const ticks = []
  for (let v = 0; v <= muMax.value; v += 10) ticks.push(v)
  return ticks
})
const xLabels = computed(() => {
  const labels = []
  let lastYear = ''
  timeline.value.forEach((d, i) => {
    const year = d.date.slice(0, 4)
    if (year !== lastYear) {
      labels.push({ index: i, year })
      lastYear = year
    }
  })
  return labels.filter((_, i) => i % 3 === 0)
})

const tooltip = ref<{ show: boolean; x: number; point: TimelinePoint | null }>({ show: false, x: 0, point: null })
function handleHover(event: MouseEvent) {
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
}
function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[parseInt(month) - 1]} ${year}`
}
</script>

<template>
  <main class="main">
    <div class="report-header">
      <div class="eyebrow">Technical Supplement // Market Correlation</div>
      <h2>Global Oil Index Comparison</h2>
      <p class="summary">Analyzing the correlation between international Brent Crude benchmarks and the retail Petroleum Pricing Mechanism (PPM) in Mauritius.</p>
    </div>

    <div class="bento-layout">
      <!-- CONTEXT -->
      <section class="bento-item context-block">
        <div class="content-grid">
          <div class="text-card">
            <span class="num">01</span>
            <h3>Proxy Benchmark</h3>
            <p>Mauritius imports are priced against Platts Singapore (MOPS). Brent Crude serves as a high-correlation public proxy for tracking these international trends.</p>
          </div>
          <div class="text-card">
            <span class="num">02</span>
            <h3>CIF Weighting</h3>
            <p>Landed costs represent ~45% of retail price. The remainder is comprised of fixed excise duties, 15% VAT, and various social subsidies (LPG/Rice/Flour).</p>
          </div>
          <div class="text-card">
            <span class="num">03</span>
            <h3>Stabilization Buffer</h3>
            <p>The PPM uses a 6-month weighted average and a Price Stabilisation Account to dampen volatility, leading to a lagging effect on local pump prices.</p>
          </div>
        </div>
      </section>

      <!-- CHART -->
      <section class="bento-item chart-block">
        <div class="chart-header">
          <div class="legend">
            <span class="legend-item"><span class="dot brent" /> Brent crude ($/bbl)</span>
            <span class="legend-item"><span class="dot petrol" /> Petrol (Rs/L)</span>
            <span class="legend-item"><span class="dot diesel" /> Diesel (Rs/L)</span>
          </div>
        </div>

        <div class="chart-container">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="chart-svg" @mousemove="handleHover" @mouseleave="tooltip.show = false">
            <line v-for="tick in yTicksLeft" :key="tick" :x1="padding.left" :y1="yScaleLeft(tick)" :x2="padding.left + innerWidth" :y2="yScaleLeft(tick)" class="grid-line" />
            <text v-for="tick in yTicksLeft" :key="'l-'+tick" :x="padding.left - 12" :y="yScaleLeft(tick) + 3" class="axis-label" text-anchor="end">{{ tick }}</text>
            <text v-for="tick in yTicksRight" :key="'r-'+tick" :x="padding.left + innerWidth + 12" :y="yScaleRight(tick) + 3" class="axis-label axis-right" text-anchor="start">{{ tick }}</text>
            <text v-for="label in xLabels" :key="'x-'+label.year" :x="xScale(label.index)" :y="padding.top + innerHeight + 25" class="axis-label" text-anchor="middle">{{ label.year }}</text>

            <path :d="buildPathLeft(timeline.map(p => p.brent)) + ` L${xScale(timeline.length - 1)},${padding.top+innerHeight} L${xScale(0)},${padding.top+innerHeight} Z`" class="area-brent" />
            <path :d="buildPathLeft(timeline.map(p => p.brent))" class="line-brent" fill="none" />
            <path :d="buildPathRight(timeline.map(p => p.petrol))" class="line-petrol" fill="none" />
            <path :d="buildPathRight(timeline.map(p => p.diesel))" class="line-diesel" fill="none" />

            <template v-if="tooltip.show && tooltip.point">
              <line :x1="tooltip.x" :y1="padding.top" :x2="tooltip.x" :y2="padding.top + innerHeight" class="hover-line" />
              <circle v-if="tooltip.point.brent" :cx="tooltip.x" :cy="yScaleLeft(tooltip.point.brent)" r="3" class="hover-dot brent" />
              <circle v-if="tooltip.point.petrol" :cx="tooltip.x" :cy="yScaleRight(tooltip.point.petrol)" r="4" class="hover-dot petrol" />
              <circle v-if="tooltip.point.diesel" :cx="tooltip.x" :cy="yScaleRight(tooltip.point.diesel)" r="4" class="hover-dot diesel" />
            </template>
          </svg>

          <div v-if="tooltip.show && tooltip.point" class="chart-tooltip" :style="{ left: `${(tooltip.x / chartWidth) * 100}%` }">
            <div class="tooltip-date">{{ formatMonth(tooltip.point.date) }}</div>
            <div class="tooltip-row"><span class="dot brent" /> BRENT: ${{ tooltip.point.brent?.toFixed(2) }}</div>
            <div class="tooltip-row"><span class="dot petrol" /> PETROL: RS {{ tooltip.point.petrol?.toFixed(2) }}</div>
            <div class="tooltip-row"><span class="dot diesel" /> DIESEL: RS {{ tooltip.point.diesel?.toFixed(2) }}</div>
          </div>
        </div>
      </section>

      <!-- OBSERVATIONS -->
      <section class="bento-item observations">
        <div class="section-title">Case Study / Historical Milestones</div>
        <div class="obs-grid">
          <div class="obs-card">
            <span class="year">2008</span>
            <p>Brent hit $132 peak. Local prices reached Rs 49.50 before the global financial crisis caused a crash to $40.</p>
          </div>
          <div class="obs-card">
            <span class="year">2014</span>
            <p>Oil collapse from $112 to $30. Local prices cut by only 25% due to fixed tax floors and exchange rate shifts.</p>
          </div>
          <div class="obs-card">
            <span class="year">2020</span>
            <p>Brent fell to $18 (COVID). Mauritius prices stayed at Rs 44 as the stabilization account absorbed the shock.</p>
          </div>
          <div class="obs-card">
            <span class="year">2022</span>
            <p>Ukraine war drive oil to $122. Sustained shock exhausted buffers, hitting all-time high of Rs 74.10.</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.report-header {
  margin-bottom: 48px;
  max-width: 800px;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.report-header h2 {
  font-size: 40px;
  margin-bottom: 16px;
}

.summary {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.bento-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.bento-item {
  background: var(--surface);
  border: 2px solid var(--border);
  padding: 32px;
}

/* Context block */
.context-block {
  grid-column: span 3;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.text-card {
  position: relative;
}

.text-card .num {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 800;
  color: var(--row-border);
  position: absolute;
  top: -10px;
  left: -5px;
  z-index: 0;
}

.text-card h3 {
  font-size: 14px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.text-card p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

/* Chart block */
.chart-block {
  grid-column: span 3;
}

.chart-header {
  margin-bottom: 32px;
}

.legend {
  display: flex;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.dot { width: 8px; height: 8px; border: 1.5px solid var(--border); }
.dot.brent { background: var(--brent-color); }
.dot.petrol { background: var(--petrol-color); }
.dot.diesel { background: var(--diesel-color); }

.chart-container {
  position: relative;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.grid-line { stroke: var(--row-border); stroke-width: 1; }
.axis-label { font-family: var(--font-mono); font-size: 9px; fill: var(--text-muted); font-weight: 600; }
.axis-right { fill: var(--text-secondary); }

.area-brent { fill: var(--brent-color); opacity: 0.04; }
.line-brent { stroke: var(--brent-color); stroke-width: 1.5; opacity: 0.4; }
.line-petrol { stroke: var(--petrol-color); stroke-width: 2.5; }
.line-diesel { stroke: var(--diesel-color); stroke-width: 2.5; }

.hover-line { stroke: var(--text); stroke-width: 1; stroke-dasharray: 2 2; }
.hover-dot { stroke: var(--bg); stroke-width: 2; }

.chart-tooltip {
  position: absolute;
  top: -20px;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--bg);
  padding: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  z-index: 10;
  min-width: 150px;
}

.tooltip-date { font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 8px; padding-bottom: 4px; }

/* Observations */
.observations {
  grid-column: span 3;
}

.section-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 24px;
  color: var(--text-muted);
}

.obs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.obs-card {
  border: 1.5px solid var(--row-border);
  padding: 20px;
}

.obs-card .year {
  display: block;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
}

.obs-card p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .content-grid, .obs-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .report-header h2 { font-size: 32px; }
  .content-grid, .obs-grid { grid-template-columns: 1fr; }
}
</style>