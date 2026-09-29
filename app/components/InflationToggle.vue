<script setup lang="ts">
const { adjustForInflation, cpiReference } = useFuelPrices()

const referenceMonth = computed(() => new Date(`${cpiReference.value.date}-01`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}))
</script>

<template>
  <div class="value-toggle" role="group" aria-label="Price basis">
    <button type="button" :class="{ active: !adjustForInflation }" :aria-pressed="!adjustForInflation" @click="adjustForInflation = false">
      Nominal
    </button>
    <button
      type="button"
      :class="{ active: adjustForInflation }"
      :aria-pressed="adjustForInflation"
      :title="`Prices in ${referenceMonth} rupees, adjusted with the consumer price index`"
      @click="adjustForInflation = true"
    >
      Inflation-adjusted
    </button>
  </div>
</template>

<style scoped>
.value-toggle {
  display: flex;
  border: 1.5px solid var(--border);
}

.value-toggle button {
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text);
  background: transparent;
  border: none;
  border-right: 1.5px solid var(--border);
  cursor: pointer;
  transition: all 0.1s;
}

.value-toggle button:last-child { border-right: none; }

.value-toggle button:hover, .value-toggle button.active {
  background: var(--text);
  color: var(--bg);
}
</style>
