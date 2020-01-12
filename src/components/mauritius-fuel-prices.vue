<template>
	<div class="container page-fuel">
		<div class="top-section md:flex justify-between">
			<div class="left">
				<h1 class="text-3xl md:text-5xl text-center md:text-left font-black pt-10">Mauritius Fuel Prices</h1>
				<p
					class="text-xl text-center md:text-left"
				>Progression of fuel prices in Mauritius (2002 - Present)</p>
				<div class="text-sm text-center md:text-left font-normal pb-4">Last Updated (11 Jan 2020)</div>
			</div>
			<CurrentPrice />
		</div>
		<div v-if="!loading" class="chart-container flex flex-col text-blue-500">
			<highcharts :updateArgs="[true, false]" :options="chartOptions"></highcharts>
		</div>
		<div v-else>Loading data...</div>
		<p>
			Source :
			<a class="underline" target="_blank" href="https://www.stcmu.com/ppm/retail-prices">STC</a>
		</p>
		<p>
			Cache :
			<a
				class="underline"
				target="_blank"
				href="https://docs.google.com/spreadsheets/d/19xdGb9OyWLV9zpQKqT66EGG-1fGoc5JIvZXdVRj0C1w/edit?usp=sharing"
			>Google Sheets API</a>
		</p>
	</div>
</template>

<script>
import Vue from "vue";
import { Chart } from "highcharts-vue";
import CurrentPrice from "./CurrentPrice.vue";
export default {
	components: {
		highcharts: Chart,
		CurrentPrice
	},
	data() {
		return {
			loading: true,
			chartOptions: {
				series: [
					{
						data: [],
						name: "Petrol",
						lineWidth: 3,
						color: "var(--petrol)"
					},
					{
						data: [],
						name: "Diesel",
						lineWidth: 3,
						color: "var(--diesel)"
					}
				],
				labels: {
					style: { color: "currentColor" }
				},
				caption: {
					style: { color: "red" }
				},
				setOptions: {},
				chart: {
					backgroundColor: "transparent"
				},
				title: {
					text: "",
					style: { color: "currentColor", fontSize: "32px" }
				},
				xAxis: {
					type: "datetime",
					tickPixelInterval: 100,
					plotLines: [
						{
							width: 5,
							color: "#808080"
						}
					]
				},
				yAxis: {
					min: 0,
					max: 100,
					title: {
						text: "Price Rs/Litre"
					}
				}
			},
			URL:
				"https://spreadsheets.google.com/feeds/list/19xdGb9OyWLV9zpQKqT66EGG-1fGoc5JIvZXdVRj0C1w/1/public/values?alt=json"
		};
	},
	methods: {
		extractData(entries) {
			return entries.map(this.extractObject);
		},

		extractObject(entry) {
			const fieldNameList = Object.keys(entry).filter(fieldName =>
				fieldName.includes("gsx$")
			);

			const formattedObjet = {};
			fieldNameList.forEach(fieldName => {
				const trimmedName = fieldName.replace("gsx$", "");
				formattedObjet[trimmedName] = entry[fieldName][`$t`];
			});

			return formattedObjet;
		},
		fetchDataFromGoogleSheet() {
			fetch(this.URL)
				.then(response => response.json())
				.then(({ feed }) => this.extractData(feed.entry))
				.then(stats => {
					let petrol = stats.map(stat => {
						return [
							new Date(stat["_cn6ca"]).getTime() + 3600000 * 4,
							parseInt(stat["_cokwr"])
						];
						//   diesel: parseInt(stat['_cpzh4'])
					});

					let diesel = stats.map(stat => {
						return [
							new Date(stat["_cn6ca"]).getTime() + 3600000 * 4,
							parseInt(stat["_cpzh4"])
						];
					});

					this.chartOptions.series[0].data = petrol;
					this.chartOptions.series[1].data = diesel;

					this.loading = false;
				})
				.catch(error => {
					throw new Error(
						"Error should be caught by Vue global error handler." + error
					);
				});
		}
	},
	mounted() {
		this.fetchDataFromGoogleSheet();
	},
	head() {
		return {
			title: "Mauritius Fuel Price",
			meta: [
				{
					hid: "description",
					name: "description",
					content: "Progression of fuel prices in Mauritius (2002 - Present)"
				},
				{ hid: "og:type", property: "og:type", content: "page" },
				{
					hid: "og:title",
					property: "og:title",
					content: "Mauritius Fuel Price"
				},
				{
					hid: "og:image",
					property: "og:image",
					content:
						process.env.siteUrl + "/data/og-image/mauritius-fuel-prices.jpg"
				},
				{
					hid: "og:description",
					property: "og:description",
					content: "Progression of fuel prices in Mauritius (2002 - Present)"
				},
				{
					hid: "og:url",
					property: "og:url",
					content: this.replaceWithAbsolute(
						process.env.siteUrl + this.$route.path
					)
				}
			]
		};
	}
};
</script>


<style>
.page-fuel {
	--petrol: green;
	--diesel: rgb(200, 200, 0);
}
</style>
