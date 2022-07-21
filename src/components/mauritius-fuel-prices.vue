<template>
	<div class="container page-fuel">
		<div class="top-section md:flex justify-between">
			<div class="left">
				<h1 class="text-3xl md:text-5xl text-center md:text-left font-black pt-10">Mauritius Fuel Prices</h1>
				<p class="text-xl text-center md:text-left">Progression of fuel prices in Mauritius (2002 - Present)</p>
				<div class="text-sm text-center md:text-left font-normal pb-4"
					v-if="latestPrices">Last Updated : {{ dateUpdated }}</div>
			</div>
			<CurrentPrice v-if="latestPrices"
				:prices="latestPrices" />
		</div>
		<div v-if="!loading"
			class="chart-container flex flex-col text-blue-500">
			<VueApexCharts width="100%"
				class="w-full h-full"
				type="area"
				:options="chartOptions"
				:series="petrolSeries"></VueApexCharts>

			<VueApexCharts width="100%"
				class="w-full h-full"
				type="area"
				:options="chartOptions"
				:series="dieselSeries"></VueApexCharts>
		</div>
		<div v-else>Loading data...</div>
		<p>
			Source :
			<a class="underline"
				target="_blank"
				href="https://www.stcmu.com/ppm/retail-prices">STC</a>
		</p>
		<p>
			Cache :
			<a class="underline"
				target="_blank"
				href="https://docs.google.com/spreadsheets/d/19xdGb9OyWLV9zpQKqT66EGG-1fGoc5JIvZXdVRj0C1w/edit?usp=sharing">Google
				Sheets API</a>
		</p>
	</div>
</template>

<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import { ApexOptions } from 'apexcharts'


let loading = ref(true);
let series = reactive([]);
let petrolSeries = reactive([]);
let dieselSeries = reactive([]);
let chartOptions: ApexOptions = reactive({
	chart: {
		
	},
	dataLabels: {
		enabled: true,
		formatter: function (value, { seriesIndex, dataPointIndex, w }) {
			if (value > 50) {
				return `Rs/L ${value}`
			} else {
				return ''
			}
		}
	},
	stroke: {
		curve: 'smooth'
	},

	grid: {
		borderColor: '#e7e7e7',
		row: {
			colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
			opacity: 0.5
		},
	},
	xaxis: {
		type: 'datetime',
		title: {
			text: 'Timeline (Year)',
			style: {
				fontSize: '1rem',
			}
		}
	},
	yaxis: {
		title: {
			text: "Price Rs/Litre",
			style: {
				fontSize: '1rem'
			}
		}
	},
	legend: {
		position: 'top',
		horizontalAlign: 'left',
		floating: false,
	}
})

let latestPrices = ref({
	petrol: 0,
	diesel: 0
});

let SHEET_ID: string = '19xdGb9OyWLV9zpQKqT66EGG-1fGoc5JIvZXdVRj0C1w'
let SHEET_NAME: string = 'Sheet1'
let API_KEY: string = 'AIzaSyCJZRDpeWRvJNcdggWITICUBvDKbpxhHgI'

function fetchDataFromGoogleSheet() {

	fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`)
		.then(response => response.json())
		.then(res => res.values)
		.then(stats => {

			let petrol = {
				name: "Petrol",
				data: stats.map(stat => {
					return {
						x: new Date(stat[0]).getTime() + 3600000 * 4,
						y: parseFloat(stat[1])
					}
				}),
				lineWidth: 3,
				color: "var(--petrol)"
			}

			let diesel = {
				name: "Diesel",
				data: stats.map(stat => {
					return {
						x: new Date(stat[0]).getTime() + 3600000 * 4,
						y: parseFloat(stat[2])
					}
				}),
				lineWidth: 3,
				color: "var(--diesel)"
			}

			petrolSeries.push(petrol)
			dieselSeries.push(diesel)

			latestPrices.value = {
				petrol: petrol.data[0].y,
				diesel: diesel.data[0].y
			}


			loading.value = false;
		})
		.catch(error => {
			throw new Error(
				"Error should be caught by Vue global error handler." + error
			);
		});
}


const dateUpdated = computed(() => {
	let date = series[0]?.data[0]?.x
	if (date) {
		return new Date(date).toDateString()
	}
})

onMounted(() => {
	fetchDataFromGoogleSheet();
})


</script>


<style>
.page-fuel {
	--petrol: green;
	--diesel: rgb(200, 200, 0);
}

.apexcharts-svg {
    overflow: visible;
}

.chart-container {
    padding: 2rem;
    padding-right: 2.7rem;
}
</style>
