import { prices as fallbackPrices, DATA_SOURCE, type FuelPriceEntry } from '~/data/prices'

const DATASET_URL = 'https://raw.githubusercontent.com/MrSunshyne/mauritius-dataset-fuel/main/data/prices.json'

export type SortField = 'date' | 'petrol' | 'diesel' | 'spread'
export type SortDirection = 'asc' | 'desc'

const sortField = ref<SortField>('date')
const sortDirection = ref<SortDirection>('desc')
const livePrices = ref<FuelPriceEntry[] | null>(null)

export function useFuelPrices() {
  // Use live data if fetched, otherwise fall back to bundled data
  const prices = computed(() => livePrices.value ?? fallbackPrices)

  // Fetch live data from the dataset repo
  async function fetchLiveData() {
    try {
      const res = await fetch(DATASET_URL)
      if (!res.ok) return
      const data: FuelPriceEntry[] = await res.json()
      if (Array.isArray(data) && data.length > 0 && data[0].date && data[0].petrol != null) {
        livePrices.value = data
      }
    }
    catch {
      // Silently fall back to bundled data
    }
  }

  const currentPrices = computed(() => prices.value[0])

  // Find the last entry where petrol or diesel actually changed
  const lastChange = computed(() => {
    const p = prices.value
    const curr = p[0]
    for (let i = 1; i < p.length; i++) {
      if (p[i].petrol !== curr.petrol || p[i].diesel !== curr.diesel) {
        return {
          petrol: +(curr.petrol - p[i].petrol).toFixed(2),
          diesel: +(curr.diesel - p[i].diesel).toFixed(2),
          sinceDate: p[i].date,
        }
      }
    }
    return { petrol: 0, diesel: 0, sinceDate: curr.date }
  })

  const petrolPeak = computed(() => {
    const high = Math.max(...prices.value.map(p => p.petrol))
    return prices.value.find(p => p.petrol === high)!
  })
  const dieselPeak = computed(() => {
    const high = Math.max(...prices.value.map(p => p.diesel))
    return prices.value.find(p => p.diesel === high)!
  })
  const petrolFloor = computed(() => {
    const low = Math.min(...prices.value.map(p => p.petrol))
    return [...prices.value].reverse().find(p => p.petrol === low)!
  })
  const dieselFloor = computed(() => {
    const low = Math.min(...prices.value.map(p => p.diesel))
    return [...prices.value].reverse().find(p => p.diesel === low)!
  })

  const allTimePetrolHigh = computed(() => petrolPeak.value.petrol)
  const allTimeDieselHigh = computed(() => dieselPeak.value.diesel)
  const allTimePetrolLow = computed(() => petrolFloor.value.petrol)
  const allTimeDieselLow = computed(() => dieselFloor.value.diesel)

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInMonths = Math.floor(diffInDays / 30.44)
    const diffInYears = Math.floor(diffInDays / 365.25)

    if (diffInYears > 0) return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`
    if (diffInMonths > 0) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`
    if (diffInDays > 0) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    return 'Today'
  }

  // Chronological order (oldest first) for chart
  const chronologicalPrices = computed(() => [...prices.value].reverse())

  const sortedPrices = computed(() => {
    const result = [...prices.value]
    result.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sortField.value) {
        case 'date':
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
          break
        case 'petrol':
          aVal = a.petrol
          bVal = b.petrol
          break
        case 'diesel':
          aVal = a.diesel
          bVal = b.diesel
          break
        case 'spread':
          aVal = a.petrol - a.diesel
          bVal = b.petrol - b.diesel
          break
        default:
          aVal = 0
          bVal = 0
      }
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    })
    return result
  })

  function toggleSort(field: SortField) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    }
    else {
      sortField.value = field
      sortDirection.value = field === 'date' ? 'desc' : 'asc'
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formatPrice(value: number): string {
    return `Rs ${value.toFixed(2)}`
  }

  // SVG chart helpers
  const chartData = computed(() => {
    const data = chronologicalPrices.value
    const allValues = data.flatMap(d => [d.petrol, d.diesel])
    const minVal = Math.floor(Math.min(...allValues) / 5) * 5
    const maxVal = Math.ceil(Math.max(...allValues) / 5) * 5
    return { data, minVal, maxVal }
  })

  return {
    prices,
    currentPrices,
    lastChange,
    allTimePetrolHigh,
    allTimeDieselHigh,
    allTimePetrolLow,
    allTimeDieselLow,
    petrolPeak,
    dieselPeak,
    petrolFloor,
    dieselFloor,
    chronologicalPrices,
    sortedPrices,
    sortField,
    sortDirection,
    chartData,
    DATA_SOURCE,
    fetchLiveData,
    toggleSort,
    formatDate,
    formatPrice,
    timeAgo,
  }
}
