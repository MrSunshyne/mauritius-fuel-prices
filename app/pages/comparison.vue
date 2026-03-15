<script setup lang="ts">
import { brentPrices } from '~/data/brent'

const { chronologicalPrices, formatDate } = useFuelPrices()

useSeoMeta({
  title: 'Global Comparison - Mauritius Fuel Prices',
  description: 'Compare Mauritius retail fuel prices against Brent Crude oil benchmark to understand the correlation between global oil markets and local pump prices.',
})

// Build unified timeline: merge Brent monthly + Mauritius price change dates
// For each Mauritius price entry, find the nearest Brent price
// For each Brent entry, find the active Mauritius price at that time

interface TimelinePoint {
  date: string
  brent: number | null
  petrol: number | null
  diesel: number | null
}

const timeline = computed<TimelinePoint[]>(() => {
  const muPrices = chronologicalPrices.value // oldest first
  const points: TimelinePoint[] = []

  for (const b of brentPrices) {
    const bDate = new Date(b.date + '-15')
    // Find the active Mauritius price at this date (last entry on or before this date)
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
    points.push({
      date: b.date,
      brent: b.price,
      petrol: activePetrol,
      diesel: activeDiesel,
    })
  }

  return points
})

// Chart dimensions
const chartWidth = 900
const chartHeight = 360
const padding = { top: 20, right: 60, bottom: 30, left: 55 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

// Scales
const brentMax = computed(() => Math.ceil(Math.max(...timeline.value.map(p => p.brent ?? 0)) / 10) * 10)
const brentMin = 0
const muMax = computed(() => Math.ceil(Math.max(...timeline.value.filter(p => p.petrol !== null).map(p => Math.max(p.petrol!, p.diesel!))) / 10) * 10)
const muMin = 0

function xScale(index: number): number {
  const total = timeline.value.length
  return padding.left + (index / (total - 1)) * innerWidth
}

function yScaleLeft(value: number): number {
  return padding.top + innerHeight - ((value - brentMin) / (brentMax.value - brentMin)) * innerHeight
}

function yScaleRight(value: number): number {
  return padding.top + innerHeight - ((value - muMin) / (muMax.value - muMin)) * innerHeight
}

function buildPathLeft(values: (number | null)[]): string {
  let started = false
  return values
    .map((v, i) => {
      if (v === null) return ''
      const cmd = started ? 'L' : 'M'
      started = true
      return `${cmd}${xScale(i).toFixed(1)},${yScaleLeft(v).toFixed(1)}`
    })
    .join(' ')
}

function buildPathRight(values: (number | null)[]): string {
  let started = false
  return values
    .map((v, i) => {
      if (v === null) return ''
      const cmd = started ? 'L' : 'M'
      started = true
      return `${cmd}${xScale(i).toFixed(1)},${yScaleRight(v).toFixed(1)}`
    })
    .join(' ')
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

// Tooltip
const tooltip = ref<{ show: boolean; x: number; point: TimelinePoint | null }>({
  show: false,
  x: 0,
  point: null,
})

function handleHover(event: MouseEvent) {
  const svgEl = (event.currentTarget as SVGElement).closest('svg')
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const scaleRatio = chartWidth / rect.width
  const scaledX = mouseX * scaleRatio

  const data = timeline.value
  let closestIdx = 0
  let closestDist = Infinity
  for (let i = 0; i < data.length; i++) {
    const px = xScale(i)
    const dist = Math.abs(px - scaledX)
    if (dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  tooltip.value = {
    show: true,
    x: xScale(closestIdx),
    point: data[closestIdx],
  }
}

function handleLeave() {
  tooltip.value.show = false
}

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${year}`
}
</script>

<template>
  <main class="main">
    <div class="page-header">
      <h2>Global Oil Price Comparison</h2>
      <p class="page-sub">
        How do Mauritius retail fuel prices correlate with international oil markets?
      </p>
    </div>

    <div class="context-cards">
      <div class="context-card">
        <h3>Why Brent Crude?</h3>
        <p>
          Mauritius imports refined petroleum products priced against
          <strong>Platts Singapore (MOPS)</strong>, which closely tracks Brent Crude.
          Since MOPS data is proprietary, Brent serves as the best freely available proxy
          for global oil price trends.
        </p>
      </div>
      <div class="context-card">
        <h3>The Price Gap</h3>
        <p>
          The CIF (landed) cost of fuel is only about <strong>45% of the retail price</strong>.
          The rest comprises excise duty, VAT (15%), subsidies for LPG/flour/rice,
          road development levies, and distribution margins. This is why retail prices
          don't move in lockstep with global oil.
        </p>
      </div>
      <div class="context-card">
        <h3>Price Stabilisation</h3>
        <p>
          Since 2011, the <strong>Petroleum Pricing Mechanism (PPM)</strong> uses a
          6-month weighted average of Platts prices and a stabilisation account to
          smooth out volatility, so retail price changes are delayed and dampened
          relative to world markets.
        </p>
      </div>
    </div>

    <div class="chart-section">
      <h3>Brent Crude vs Mauritius Retail Prices (2002 - Present)</h3>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-line brent" /> Brent Crude (USD/barrel)</span>
        <span class="legend-item"><span class="legend-line petrol" /> Petrol (Rs/litre)</span>
        <span class="legend-item"><span class="legend-line diesel" /> Diesel (Rs/litre)</span>
      </div>

      <div class="chart-container">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="xMidYMid meet"
          class="chart-svg"
          @mousemove="handleHover"
          @mouseleave="handleLeave"
        >
          <!-- Grid lines (using left axis) -->
          <line
            v-for="tick in yTicksLeft"
            :key="tick"
            :x1="padding.left"
            :y1="yScaleLeft(tick)"
            :x2="padding.left + innerWidth"
            :y2="yScaleLeft(tick)"
            class="grid-line"
          />

          <!-- Left Y-axis labels (Brent USD) -->
          <text
            v-for="tick in yTicksLeft"
            :key="'l-' + tick"
            :x="padding.left - 8"
            :y="yScaleLeft(tick) + 4"
            class="axis-label"
            text-anchor="end"
          >${{ tick }}</text>

          <!-- Right Y-axis labels (Mauritius Rs) -->
          <text
            v-for="tick in yTicksRight"
            :key="'r-' + tick"
            :x="padding.left + innerWidth + 8"
            :y="yScaleRight(tick) + 4"
            class="axis-label axis-right"
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

          <!-- Brent area fill -->
          <path
            :d="buildPathLeft(timeline.map(p => p.brent)) + ` L${xScale(timeline.length - 1).toFixed(1)},${(padding.top + innerHeight)} L${xScale(0).toFixed(1)},${(padding.top + innerHeight)} Z`"
            class="area-brent"
          />

          <!-- Lines -->
          <path
            :d="buildPathLeft(timeline.map(p => p.brent))"
            class="line-brent"
            fill="none"
          />
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
              :cy="yScaleLeft(tooltip.point.brent)"
              r="4"
              class="hover-dot brent"
            />
            <circle
              v-if="tooltip.point.petrol"
              :cx="tooltip.x"
              :cy="yScaleRight(tooltip.point.petrol)"
              r="4"
              class="hover-dot petrol"
            />
            <circle
              v-if="tooltip.point.diesel"
              :cx="tooltip.x"
              :cy="yScaleRight(tooltip.point.diesel)"
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

        <div
          v-if="tooltip.show && tooltip.point"
          class="chart-tooltip"
          :style="{ left: `${(tooltip.x / chartWidth) * 100}%` }"
        >
          <div class="tooltip-date">{{ formatMonth(tooltip.point.date) }}</div>
          <div class="tooltip-row brent-row">
            <span class="fuel-dot brent" /> Brent: ${{ tooltip.point.brent?.toFixed(2) }}/bbl
          </div>
          <template v-if="tooltip.point.petrol">
            <div class="tooltip-row">
              <span class="fuel-dot petrol" /> Petrol: Rs {{ tooltip.point.petrol?.toFixed(2) }}/L
            </div>
            <div class="tooltip-row">
              <span class="fuel-dot diesel" /> Diesel: Rs {{ tooltip.point.diesel?.toFixed(2) }}/L
            </div>
          </template>
          <div v-else class="tooltip-row muted">No Mauritius data</div>
        </div>
      </div>
    </div>

    <div class="insights">
      <h3>Key Observations</h3>
      <div class="insight-grid">
        <div class="insight">
          <div class="insight-year">2008</div>
          <p>Brent peaked at $132/bbl. Mauritius petrol reached Rs 49.50 then fell rapidly as the global financial crisis caused oil to crash to $40 by December.</p>
        </div>
        <div class="insight">
          <div class="insight-year">2011-2014</div>
          <p>Brent sustained above $100/bbl for over 3 years. Mauritius retail prices remained relatively stable at Rs 49-52 thanks to the new PPM stabilisation mechanism introduced in January 2011.</p>
        </div>
        <div class="insight">
          <div class="insight-year">2014-2016</div>
          <p>Global oil price collapse (Brent from $112 to $30). Mauritius prices fell from Rs 52.25 to Rs 38.85, but only a ~25% cut vs Brent's ~73% drop - taxes and levies formed a price floor.</p>
        </div>
        <div class="insight">
          <div class="insight-year">2020</div>
          <p>COVID-19 crashed Brent to $18. Mauritius prices stayed flat at Rs 44/Rs 35, demonstrating how the stabilisation account absorbs short-term shocks rather than passing them through.</p>
        </div>
        <div class="insight">
          <div class="insight-year">2022</div>
          <p>Russia-Ukraine war drove Brent to $122. Mauritius petrol hit an all-time high of Rs 74.10 despite the PPM buffer - the sustained global shock eventually exhausted the stabilisation account.</p>
        </div>
        <div class="insight">
          <div class="insight-year">2024-2026</div>
          <p>Brent has eased to $65-75 range. Mauritius retail prices have gradually decreased to Rs 58.45/58.95, lagging the oil market decline as is typical of the PPM mechanism.</p>
        </div>
      </div>
    </div>

    <div class="source-note">
      <p>
        Brent Crude data from
        <a href="https://github.com/datasets/oil-prices" target="_blank" rel="noopener noreferrer">datasets/oil-prices</a>
        (public domain). Mauritius retail prices from the
        <a href="https://www.stcmu.com/ppm/retail-prices" target="_blank" rel="noopener noreferrer">State Trading Corporation</a>.
      </p>
    </div>
  </main>
</template>

<style scoped>
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 24px 48px;
}

.page-header {
  padding: 24px 0 16px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.page-sub {
  font-size: 13px;
  color: var(--text-secondary);
}

.context-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.context-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
}

.context-card h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.context-card p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

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

.legend-line {
  display: inline-block;
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

.legend-line.brent {
  background: var(--brent-color, #ef4444);
}

.legend-line.petrol {
  background: var(--petrol-color);
}

.legend-line.diesel {
  background: var(--diesel-color);
}

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

.axis-right {
  fill: var(--text-secondary);
}

.area-brent {
  fill: var(--brent-color, #ef4444);
  opacity: 0.05;
}

.line-brent {
  stroke: var(--brent-color, #ef4444);
  stroke-width: 1.5;
  opacity: 0.7;
}

.line-petrol {
  stroke: var(--petrol-color);
  stroke-width: 2;
}

.line-diesel {
  stroke: var(--diesel-color);
  stroke-width: 2;
}

.hover-line {
  stroke: var(--text-muted);
  stroke-width: 0.5;
  stroke-dasharray: 4 2;
}

.hover-dot.brent {
  fill: var(--brent-color, #ef4444);
}

.hover-dot.petrol {
  fill: var(--petrol-color);
}

.hover-dot.diesel {
  fill: var(--diesel-color);
}

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

.tooltip-row.muted {
  color: var(--text-muted);
  font-style: italic;
}

.fuel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fuel-dot.brent {
  background: var(--brent-color, #ef4444);
}

.fuel-dot.petrol {
  background: var(--petrol-color);
}

.fuel-dot.diesel {
  background: var(--diesel-color);
}

.insights {
  margin-bottom: 32px;
}

.insights h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.insight {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
}

.insight-year {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px;
  color: var(--petrol-color);
}

.insight p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.source-note {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
}

.source-note a {
  color: var(--text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
