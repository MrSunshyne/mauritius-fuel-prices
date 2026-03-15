<script setup lang="ts">
import type { SortField } from '~/composables/useFuelPrices'

const {
  sortedPrices,
  sortField,
  sortDirection,
  toggleSort,
  formatDate,
  formatPrice,
  DATA_SOURCE,
} = useFuelPrices()

useSeoMeta({
  title: 'Price History - Mauritius Fuel Prices',
  description: 'Complete historical record of petrol and diesel prices in Mauritius from 2002 to present.',
})

function sortIcon(field: SortField): string {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? ' \u2191' : ' \u2193'
}
</script>

<template>
  <main class="main">
    <div class="bento-header">
      <div class="header-left">
        <div class="eyebrow">Archives // Historical Data</div>
        <h2>Price Registry</h2>
        <p>A complete chronological ledger of retail fuel price adjustments in Mauritius as mandated by the State Trading Corporation (STC).</p>
      </div>
      <div class="header-right">
        <div class="stat-box">
          <span class="label">Total Records</span>
          <span class="val">{{ sortedPrices.length }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Timespan</span>
          <span class="val">2002 - 2026</span>
        </div>
      </div>
    </div>

    <div class="controls-bar">
      <div class="sort-group">
        <span class="label">Sort Ledger By</span>
        <div class="btn-cluster">
          <button :class="{ active: sortField === 'date' }" @click="toggleSort('date')">DATE{{ sortIcon('date') }}</button>
          <button :class="{ active: sortField === 'petrol' }" @click="toggleSort('petrol')">PETROL{{ sortIcon('petrol') }}</button>
          <button :class="{ active: sortField === 'diesel' }" @click="toggleSort('diesel')">DIESEL{{ sortIcon('diesel') }}</button>
          <button :class="{ active: sortField === 'spread' }" @click="toggleSort('spread')">SPREAD{{ sortIcon('spread') }}</button>
        </div>
      </div>
      <a :href="DATA_SOURCE.url" target="_blank" class="source-link">
        Official STC Source
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
    </div>

    <div class="ledger-wrapper">
      <table class="ledger">
        <thead>
          <tr>
            <th @click="toggleSort('date')">Effective Date</th>
            <th class="num" @click="toggleSort('petrol')">Mogas (Petrol)</th>
            <th class="num" @click="toggleSort('diesel')">Gas Oil (Diesel)</th>
            <th class="num" @click="toggleSort('spread')">Index Spread</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, i) in sortedPrices" :key="entry.date">
            <td class="date-cell">{{ formatDate(entry.date) }}</td>
            <td class="num petrol-cell">{{ formatPrice(entry.petrol) }}</td>
            <td class="num diesel-cell">{{ formatPrice(entry.diesel) }}</td>
            <td class="num spread-cell">
              <span :class="{ pos: entry.petrol - entry.diesel > 0, neg: entry.petrol - entry.diesel < 0 }">
                {{ (entry.petrol - entry.diesel).toFixed(2) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.bento-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border: 2px solid var(--border);
  padding: 32px;
  margin-bottom: 24px;
  background: var(--surface);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.header-left h2 {
  font-size: 40px;
  margin-bottom: 12px;
}

.header-left p {
  max-width: 500px;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.header-right {
  display: flex;
  gap: 32px;
}

.stat-box {
  text-align: right;
}

.stat-box .label {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-box .val {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sort-group .label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.btn-cluster {
  display: flex;
  border: 1.5px solid var(--border);
}

.btn-cluster button {
  background: transparent;
  border: none;
  border-right: 1.5px solid var(--border);
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s;
  color: var(--text);
}

.btn-cluster button:last-child { border-right: none; }

.btn-cluster button:hover { background: var(--row-hover); }
.btn-cluster button.active { background: var(--text); color: var(--bg); }

.source-link {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.source-link:hover { color: var(--text); text-decoration: underline; }

.ledger-wrapper {
  border: 2px solid var(--border);
  background: var(--surface);
}

.ledger {
  width: 100%;
  border-collapse: collapse;
}

.ledger th {
  text-align: left;
  padding: 16px 24px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--table-header);
  border-bottom: 2px solid var(--border);
  cursor: pointer;
  user-select: none;
}

.ledger th:hover { background: var(--border); color: var(--bg); }

.ledger td {
  padding: 14px 24px;
  font-family: var(--font-mono);
  font-size: 14px;
  border-bottom: 1.5px solid var(--row-border);
}

.ledger tr:last-child td { border-bottom: none; }
.ledger tr:hover td { background: var(--row-hover); }

.ledger .num { text-align: right; font-weight: 600; }

.petrol-cell { color: var(--petrol-color); }
.diesel-cell { color: var(--diesel-color); }

.spread-cell span {
  padding: 2px 6px;
  background: var(--row-border);
  font-size: 12px;
}

.spread-cell span.pos { color: var(--up-color); }
.spread-cell span.neg { color: var(--down-color); }

@media (max-width: 1024px) {
  .bento-header { flex-direction: column; align-items: stretch; gap: 32px; }
  .header-right { justify-content: space-between; }
}

@media (max-width: 768px) {
  .controls-bar { flex-direction: column; align-items: stretch; gap: 16px; }
  .sort-group { flex-direction: column; align-items: stretch; gap: 8px; }
  .btn-cluster { width: 100%; }
  .btn-cluster button { flex: 1; padding: 10px 4px; font-size: 9px; }
  .ledger td, .ledger th { padding: 12px 16px; font-size: 12px; }
  .header-left h2 { font-size: 32px; }
}
</style>