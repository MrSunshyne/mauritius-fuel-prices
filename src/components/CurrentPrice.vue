<template>
	<div class="right text-center md:text-right">
		<div class="uppercase md:text-md font-black pt-5 pb-2 text-gray-600">Current Price</div>
		<div class="flex justify-center pb-10">
			<div class="px-4 mr-2 py-2 border diesel-border">
				<div class="uppercase text-md text-left font-bold tracking-widest">Diesel</div>
				<div>
					<span class="text-3xl font-bold">{{ prices.diesel[1]}}</span>
					<span class="text-xl">Rs/L</span>
				</div>
			</div>
			<div class="px-4 py-2 border petrol-border">
				<div class="uppercase text-md text-left font-bold tracking-widest">Petrol</div>
				<div>
					<span class="text-3xl font-bold">{{ prices.petrol[1]}}</span>
					<span class="text-xl">Rs/L</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ["prices"]
};
</script>

<style scoped>
.petrol-border {
	border-color: var(--petrol);
}

.diesel-border {
	border-color: var(--diesel);
}
</style>