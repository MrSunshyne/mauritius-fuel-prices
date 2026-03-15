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
  // Find first and last non-null indices
  let first = -1
  let last = -1
  values.forEach((v, i) => { if (v !== null) { if (first === -1) first = i; last = i } })
  if (first === -1) return ''
  return `${line} L${xScale(last).toFixed(1)},${(padding.top + innerHeight)} L${xScale(first).toFixed(1)},${(padding.top + innerHeight)} Z`
}

// --- Y-axis ticks ---
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

// --- X-axis labels ---
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

// --- Annotation positions ---
const annotationPositions = computed(() => {
  return annotations.map((a) => {
    const idx = timeline.value.findIndex(p => p.date === a.date)
    return { ...a, x: idx >= 0 ? xScale(idx) : -1, idx }
  }).filter(a => a.x >= 0)
})

// --- Tooltip ---
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

  // Check if near an annotation (within 8px)
  const nearAnnotation = annotationPositions.value.find(a => Math.abs(a.x - xScale(closestIdx)) < 12)
  hoveredAnnotation.value = nearAnnotation?.date ?? null
}

function handleChartLeave() {
  tooltip.value.show = false
  hoveredAnnotation.value = null
}

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${year}`
}
</script>

<template>
  <main class="main">
    <div class="hero">
      <h2>Fuel Prices in Mauritius</h2>
      <p class="hero-sub">Tracking petrol and diesel retail prices since 2002</p>
      <span class="verified-badge">Data last verified March 2026</span>
    </div>

    <div class="price-cards">
      <div class="price-card">
        <div class="price-label">
          <span class="fuel-dot petrol" />
          Mogas (Petrol)
        </div>
        <div class="price-value">{{ formatPrice(currentPrices.petrol) }}</div>
        <div class="price-unit">per litre</div>
        <div class="price-change" :class="{ up: lastChange.petrol > 0, down: lastChange.petrol < 0 }">
          <template v-if="lastChange.petrol > 0">+</template>{{ lastChange.petrol.toFixed(2) }} Rs
          <span class="change-label">since {{ formatDate(lastChange.sinceDate) }}</span>
        </div>
      </div>
      <div class="price-card">
        <div class="price-label">
          <span class="fuel-dot diesel" />
          Gas Oil (Diesel)
        </div>
        <div class="price-value">{{ formatPrice(currentPrices.diesel) }}</div>
        <div class="price-unit">per litre</div>
        <div class="price-change" :class="{ up: lastChange.diesel > 0, down: lastChange.diesel < 0 }">
          <template v-if="lastChange.diesel > 0">+</template>{{ lastChange.diesel.toFixed(2) }} Rs
          <span class="change-label">since {{ formatDate(lastChange.sinceDate) }}</span>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat">
        <span class="stat-label">Petrol All-Time High</span>
        <span class="stat-value">{{ formatPrice(allTimePetrolHigh) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Diesel All-Time High</span>
        <span class="stat-value">{{ formatPrice(allTimeDieselHigh) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Petrol All-Time Low</span>
        <span class="stat-value">{{ formatPrice(allTimePetrolLow) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Diesel All-Time Low</span>
        <span class="stat-value">{{ formatPrice(allTimeDieselLow) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Data Points</span>
        <span class="stat-value">{{ chronologicalPrices.length }}</span>
      </div>
    </div>

    <div class="chart-section">
      <h3>Price History</h3>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-line petrol" /> Petrol (Rs/L)</span>
        <span class="legend-item"><span class="legend-line diesel" /> Diesel (Rs/L)</span>
        <span class="legend-item faded"><span class="legend-line brent" /> Brent Crude (USD/bbl)</span>
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
            :y="yLeft(tick) + 4"
            class="axis-label axis-label-left"
            text-anchor="end"
          >${{ tick }}</text>

          <!-- Right Y-axis labels (Mauritius Rs) -->
          <text
            v-for="tick in yTicksRight"
            :key="'r-' + tick"
            :x="padding.left + innerWidth + 8"
            :y="yRight(tick) + 4"
            class="axis-label"
            text-anchor="start"
          >Rs {{ tick }}</text>

          <!-- X-axis labels -->
          <text
            v-for="label in xLabels"
            :key="'x-' + label.year"
            :x="xScale(label.index)"
            :y="padding.top + innerHeight + 20"
            class="axis-label"
            text-anchor="middle"
          >{{ label.year }}</text>

          <!-- Annotation lines (behind data) -->
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

          <!-- Brent area fill (faded background) -->
          <path
            :d="buildAreaLeft(timeline.map(p => p.brent))"
            class="area-brent"
          />

          <!-- Brent line (faded) -->
          <path
            :d="buildPathLeft(timeline.map(p => p.brent))"
            class="line-brent"
            fill="none"
          />

          <!-- Petrol & Diesel lines (foreground) -->
          <path
            :d="buildPathRight(timeline.map(p => p.petrol))"
            class="line-petrol"
            fill="none"
          />
          <path
            :d="buildPathRight(timeline.map(p => p.diesel))"
            class="line-diesel"
            fill="none"
          />

          <!-- Hover indicator -->
          <template v-if="tooltip.show && tooltip.point">
            <line
              :x1="tooltip.x"
              :y1="padding.top"
              :x2="tooltip.x"
              :y2="padding.top + innerHeight"
              class="hover-line"
            />
            <circle
              v-if="tooltip.point.brent"
              :cx="tooltip.x"
              :cy="yLeft(tooltip.point.brent)"
              r="3"
              class="hover-dot brent"
            />
            <circle
              v-if="tooltip.point.petrol"
              :cx="tooltip.x"
              :cy="yRight(tooltip.point.petrol)"
              r="4"
              class="hover-dot petrol"
            />
            <circle
              v-if="tooltip.point.diesel"
              :cx="tooltip.x"
              :cy="yRight(tooltip.point.diesel)"
              r="4"
              class="hover-dot diesel"
            />
          </template>

          <!-- Invisible hover area -->
          <rect
            :x="padding.left"
            :y="padding.top"
            :width="innerWidth"
            :height="innerHeight"
            fill="transparent"
          />
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltip.show && tooltip.point"
          class="chart-tooltip"
          :style="{ left: `${(tooltip.x / chartWidth) * 100}%` }"
        >
          <div class="tooltip-date">{{ formatMonth(tooltip.point.date) }}</div>
          <template v-if="tooltip.point.petrol">
            <div class="tooltip-row">
              <span class="fuel-dot petrol" /> Petrol: Rs {{ tooltip.point.petrol?.toFixed(2) }}
            </div>
            <div class="tooltip-row">
              <span class="fuel-dot diesel" /> Diesel: Rs {{ tooltip.point.diesel?.toFixed(2) }}
            </div>
          </template>
          <div class="tooltip-row brent-row">
            <span class="fuel-dot brent" /> Brent: ${{ tooltip.point.brent?.toFixed(2) }}/bbl
          </div>
        </div>

        <!-- Annotation detail popup -->
        <div
          v-if="hoveredAnnotation"
          class="annotation-popup"
        >
          {{ annotationPositions.find(a => a.date === hoveredAnnotation)?.detail }}
        </div>
      </div>
    </div>

    <div class="cta-row">
      <NuxtLink to="/comparison" class="cta-btn">
        View Global Oil Comparison
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>
      <NuxtLink to="/history" class="cta-btn">
        View Full Price History
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 24px 48px;
}

.hero {
  padding: 32px 0 24px;
}

.hero h2 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 4px;
}

.hero-sub {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.verified-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 20px;
}

.price-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.price-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
}

.price-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.fuel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fuel-dot.petrol { background: var(--petrol-color); }
.fuel-dot.diesel { background: var(--diesel-color); }
.fuel-dot.brent { background: var(--brent-color); }

.price-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.price-unit {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.price-change {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--neutral-color);
}

.price-change.up { color: var(--up-color); }
.price-change.down { color: var(--down-color); }

.change-label {
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 4px;
}

.stats-row {
  display: flex;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 32px;
}

.stat {
  flex: 1;
  background: var(--surface);
  padding: 12px 16px;
  text-align: center;
  min-width: 0;
}

.stat-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* --- Chart --- */

.chart-section {
  margin-bottom: 32px;
}

.chart-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-item.faded {
  opacity: 0.5;
}

.legend-line {
  display: inline-block;
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

.legend-line.petrol { background: var(--petrol-color); }
.legend-line.diesel { background: var(--diesel-color); }
.legend-line.brent { background: var(--brent-color); }

.chart-container {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  overflow: hidden;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}

.grid-line {
  stroke: var(--border);
  stroke-width: 0.5;
}

.axis-label {
  font-size: 10px;
  fill: var(--text-muted);
  font-family: var(--font);
}

.axis-label-left {
  opacity: 0.5;
}

/* Brent (faded background) */
.area-brent {
  fill: var(--brent-color);
  opacity: 0.04;
}

.line-brent {
  stroke: var(--brent-color);
  stroke-width: 1;
  opacity: 0.25;
}

/* Mauritius fuel (foreground) */
.line-petrol {
  stroke: var(--petrol-color);
  stroke-width: 2;
}

.line-diesel {
  stroke: var(--diesel-color);
  stroke-width: 2;
}

/* Annotations */
.annotation-group .annotation-line {
  stroke: var(--text-muted);
  stroke-width: 0.5;
  stroke-dasharray: 3 3;
  opacity: 0.4;
  transition: opacity 0.15s, stroke-width 0.15s;
}

.annotation-group .annotation-label {
  font-size: 8px;
  fill: var(--text-muted);
  font-family: var(--font);
  font-weight: 500;
  opacity: 0.6;
  transition: opacity 0.15s, font-size 0.15s;
}

.annotation-group.highlighted .annotation-line {
  stroke: var(--text);
  stroke-width: 1.5;
  opacity: 0.8;
  stroke-dasharray: none;
}

.annotation-group.highlighted .annotation-label {
  fill: var(--text);
  font-size: 9px;
  font-weight: 600;
  opacity: 1;
}

/* Hover */
.hover-line {
  stroke: var(--text-muted);
  stroke-width: 0.5;
  stroke-dasharray: 4 2;
}

.hover-dot.petrol { fill: var(--petrol-color); }
.hover-dot.diesel { fill: var(--diesel-color); }
.hover-dot.brent { fill: var(--brent-color); opacity: 0.6; }

.chart-tooltip {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
}

.brent-row {
  opacity: 0.6;
  font-size: 11px;
}

.annotation-popup {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--active-btn-bg);
  color: var(--active-btn-text);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}

/* CTAs */
.cta-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  transition: all 0.15s;
}

.cta-btn:hover {
  background: var(--surface);
  border-color: var(--text-muted);
}

@media (max-width: 768px) {
  .hero h2 {
    font-size: 22px;
  }

  .stats-row {
    flex-direction: column;
  }

  .stat {
    text-align: left;
    padding: 10px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    margin-bottom: 0;
  }

  .annotation-group .annotation-label {
    display: none;
  }
}
</style>
