<script setup lang="ts">
const {
  currentPrices,
  priceChange,
  allTimePetrolHigh,
  allTimeDieselHigh,
  allTimePetrolLow,
  allTimeDieselLow,
  chronologicalPrices,
  chartData,
  formatDate,
  formatPrice,
  DATA_SOURCE,
} = useFuelPrices()

useSeoMeta({
  title: 'Mauritius Fuel Prices - Petrol & Diesel Price Tracker',
  description: 'Track petrol and diesel price changes in Mauritius from 2002 to present. Data sourced from the State Trading Corporation.',
})

const tooltip = ref<{ show: boolean; x: number; y: number; entry: any }>({
  show: false,
  x: 0,
  y: 0,
  entry: null,
})

const chartWidth = 900
const chartHeight = 300
const padding = { top: 20, right: 20, bottom: 30, left: 50 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

function xScale(index: number, total: number): number {
  return padding.left + (index / (total - 1)) * innerWidth
}

function yScale(value: number, min: number, max: number): number {
  return padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight
}

function buildPath(values: number[], min: number, max: number, total: number): string {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i, total).toFixed(1)},${yScale(v, min, max).toFixed(1)}`)
    .join(' ')
}

function buildAreaPath(values: number[], min: number, max: number, total: number): string {
  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i, total).toFixed(1)},${yScale(v, min, max).toFixed(1)}`)
    .join(' ')
  const bottomRight = `L${xScale(total - 1, total).toFixed(1)},${(padding.top + innerHeight).toFixed(1)}`
  const bottomLeft = `L${xScale(0, total).toFixed(1)},${(padding.top + innerHeight).toFixed(1)}`
  return `${linePath} ${bottomRight} ${bottomLeft} Z`
}

const yTicks = computed(() => {
  const { minVal, maxVal } = chartData.value
  const step = maxVal <= 40 ? 5 : 10
  const ticks: number[] = []
  for (let v = minVal; v <= maxVal; v += step) {
    ticks.push(v)
  }
  return ticks
})

const xLabels = computed(() => {
  const data = chartData.value.data
  const labels: { index: number; year: string }[] = []
  let lastYear = ''
  data.forEach((d, i) => {
    const year = d.date.slice(0, 4)
    if (year !== lastYear) {
      labels.push({ index: i, year })
      lastYear = year
    }
  })
  // Only show every Nth year label to avoid clutter
  const step = labels.length > 15 ? 3 : labels.length > 8 ? 2 : 1
  return labels.filter((_, i) => i % step === 0)
})

function handleChartHover(event: MouseEvent) {
  const svgEl = (event.currentTarget as SVGElement).closest('svg')
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const scaleRatio = chartWidth / rect.width
  const scaledX = mouseX * scaleRatio

  const data = chartData.value.data
  const total = data.length

  // Find nearest data point
  let closestIdx = 0
  let closestDist = Infinity
  for (let i = 0; i < total; i++) {
    const px = xScale(i, total)
    const dist = Math.abs(px - scaledX)
    if (dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  const entry = data[closestIdx]
  const px = xScale(closestIdx, total)

  tooltip.value = {
    show: true,
    x: px,
    y: 0,
    entry,
  }
}

function handleChartLeave() {
  tooltip.value.show = false
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
        <div class="price-change" :class="{ up: priceChange.petrol > 0, down: priceChange.petrol < 0 }">
          <template v-if="priceChange.petrol > 0">+</template>{{ priceChange.petrol.toFixed(2) }} Rs
          <span class="change-label">vs previous</span>
        </div>
      </div>
      <div class="price-card">
        <div class="price-label">
          <span class="fuel-dot diesel" />
          Gas Oil (Diesel)
        </div>
        <div class="price-value">{{ formatPrice(currentPrices.diesel) }}</div>
        <div class="price-unit">per litre</div>
        <div class="price-change" :class="{ up: priceChange.diesel > 0, down: priceChange.diesel < 0 }">
          <template v-if="priceChange.diesel > 0">+</template>{{ priceChange.diesel.toFixed(2) }} Rs
          <span class="change-label">vs previous</span>
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
        <span class="legend-item"><span class="legend-line petrol" /> Petrol</span>
        <span class="legend-item"><span class="legend-line diesel" /> Diesel</span>
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
            v-for="tick in yTicks"
            :key="tick"
            :x1="padding.left"
            :y1="yScale(tick, chartData.minVal, chartData.maxVal)"
            :x2="padding.left + innerWidth"
            :y2="yScale(tick, chartData.minVal, chartData.maxVal)"
            class="grid-line"
          />

          <!-- Y-axis labels -->
          <text
            v-for="tick in yTicks"
            :key="'label-' + tick"
            :x="padding.left - 8"
            :y="yScale(tick, chartData.minVal, chartData.maxVal) + 4"
            class="axis-label"
            text-anchor="end"
          >Rs {{ tick }}</text>

          <!-- X-axis labels -->
          <text
            v-for="label in xLabels"
            :key="'x-' + label.year"
            :x="xScale(label.index, chartData.data.length)"
            :y="padding.top + innerHeight + 20"
            class="axis-label"
            text-anchor="middle"
          >{{ label.year }}</text>

          <!-- Area fills -->
          <path
            :d="buildAreaPath(chartData.data.map(d => d.petrol), chartData.minVal, chartData.maxVal, chartData.data.length)"
            class="area-petrol"
          />
          <path
            :d="buildAreaPath(chartData.data.map(d => d.diesel), chartData.minVal, chartData.maxVal, chartData.data.length)"
            class="area-diesel"
          />

          <!-- Lines -->
          <path
            :d="buildPath(chartData.data.map(d => d.petrol), chartData.minVal, chartData.maxVal, chartData.data.length)"
            class="line-petrol"
            fill="none"
          />
          <path
            :d="buildPath(chartData.data.map(d => d.diesel), chartData.minVal, chartData.maxVal, chartData.data.length)"
            class="line-diesel"
            fill="none"
          />

          <!-- Hover indicator -->
          <template v-if="tooltip.show && tooltip.entry">
            <line
              :x1="tooltip.x"
              :y1="padding.top"
              :x2="tooltip.x"
              :y2="padding.top + innerHeight"
              class="hover-line"
            />
            <circle
              :cx="tooltip.x"
              :cy="yScale(tooltip.entry.petrol, chartData.minVal, chartData.maxVal)"
              r="4"
              class="hover-dot petrol"
            />
            <circle
              :cx="tooltip.x"
              :cy="yScale(tooltip.entry.diesel, chartData.minVal, chartData.maxVal)"
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
          v-if="tooltip.show && tooltip.entry"
          class="chart-tooltip"
          :style="{ left: `${(tooltip.x / chartWidth) * 100}%` }"
        >
          <div class="tooltip-date">{{ formatDate(tooltip.entry.date) }}</div>
          <div class="tooltip-row">
            <span class="fuel-dot petrol" /> Petrol: {{ formatPrice(tooltip.entry.petrol) }}
          </div>
          <div class="tooltip-row">
            <span class="fuel-dot diesel" /> Diesel: {{ formatPrice(tooltip.entry.diesel) }}
          </div>
        </div>
      </div>
    </div>

    <div class="cta-row">
      <NuxtLink to="/history" class="cta-btn">
        View Full Price History Table
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

.fuel-dot.petrol {
  background: var(--petrol-color);
}

.fuel-dot.diesel {
  background: var(--diesel-color);
}

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

.price-change.up {
  color: var(--up-color);
}

.price-change.down {
  color: var(--down-color);
}

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

.area-petrol {
  fill: var(--petrol-color);
  opacity: 0.06;
}

.area-diesel {
  fill: var(--diesel-color);
  opacity: 0.06;
}

.line-petrol {
  stroke: var(--petrol-color);
  stroke-width: 1.5;
}

.line-diesel {
  stroke: var(--diesel-color);
  stroke-width: 1.5;
}

.hover-line {
  stroke: var(--text-muted);
  stroke-width: 0.5;
  stroke-dasharray: 4 2;
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

.cta-row {
  text-align: center;
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
}
</style>
