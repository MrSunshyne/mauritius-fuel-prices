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
    <div class="page-header">
      <h2>Price History</h2>
      <p class="page-sub">
        Complete record of retail fuel price changes from the
        <a :href="DATA_SOURCE.url" target="_blank" rel="noopener noreferrer">{{ DATA_SOURCE.name }}</a>.
      </p>
    </div>

    <div class="results-bar">
      <span class="results-count">{{ sortedPrices.length }} price changes recorded</span>
      <div class="sort-buttons">
        <span class="sort-label">Sort:</span>
        <button :class="{ active: sortField === 'date' }" @click="toggleSort('date')">
          Date{{ sortIcon('date') }}
        </button>
        <button :class="{ active: sortField === 'petrol' }" @click="toggleSort('petrol')">
          Petrol{{ sortIcon('petrol') }}
        </button>
        <button :class="{ active: sortField === 'diesel' }" @click="toggleSort('diesel')">
          Diesel{{ sortIcon('diesel') }}
        </button>
        <button :class="{ active: sortField === 'spread' }" @click="toggleSort('spread')">
          Spread{{ sortIcon('spread') }}
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="price-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('date')">
              Date{{ sortIcon('date') }}
            </th>
            <th class="num sortable" @click="toggleSort('petrol')">
              Mogas (Petrol){{ sortIcon('petrol') }}
            </th>
            <th class="num sortable" @click="toggleSort('diesel')">
              Gas Oil (Diesel){{ sortIcon('diesel') }}
            </th>
            <th class="num sortable" @click="toggleSort('spread')">
              Spread{{ sortIcon('spread') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, i) in sortedPrices" :key="entry.date" :class="{ 'current-row': i === 0 && sortField === 'date' && sortDirection === 'desc' }">
            <td>{{ formatDate(entry.date) }}</td>
            <td class="num">
              <span class="fuel-chip petrol">{{ formatPrice(entry.petrol) }}</span>
            </td>
            <td class="num">
              <span class="fuel-chip diesel">{{ formatPrice(entry.diesel) }}</span>
            </td>
            <td class="num spread-cell">
              {{ (entry.petrol - entry.diesel >= 0 ? '+' : '') }}{{ (entry.petrol - entry.diesel).toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
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

.page-sub a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.results-count {
  font-size: 13px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.sort-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 4px;
}

.sort-buttons button {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s;
  white-space: nowrap;
}

.sort-buttons button.active {
  background: var(--active-btn-bg);
  color: var(--active-btn-text);
  border-color: var(--active-btn-bg);
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.price-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.price-table th {
  background: var(--table-header);
  padding: 10px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  user-select: none;
}

.price-table th.sortable {
  cursor: pointer;
}

.price-table th.sortable:hover {
  color: var(--text);
}

.price-table th.num,
.price-table td.num {
  text-align: right;
}

.price-table td {
  padding: 8px 16px;
  border-bottom: 1px solid var(--row-border);
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}

.price-table tr:last-child td {
  border-bottom: none;
}

.price-table tr:hover td {
  background: var(--row-hover);
}

.current-row td {
  font-weight: 600;
}

.fuel-chip {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.fuel-chip.petrol {
  color: var(--petrol-color);
  background: color-mix(in srgb, var(--petrol-color) 10%, transparent);
}

.fuel-chip.diesel {
  color: var(--diesel-color);
  background: color-mix(in srgb, var(--diesel-color) 10%, transparent);
}

.spread-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .sort-buttons {
    flex-wrap: wrap;
  }
}
</style>
