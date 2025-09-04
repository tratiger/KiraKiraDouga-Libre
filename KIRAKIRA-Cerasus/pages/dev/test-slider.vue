<docs>
	Sliderの精度問題をテストするために使用します。
</docs>

<script setup lang="ts">
	const value = ref(0);
	const pending = ref<"current" | "cursor">(false as never);
</script>

<template>
	<div class="slider-test">
		<Segmented v-model="pending">
			<SegmentedItem :id="(false as never)">非表示</SegmentedItem>
			<SegmentedItem id="current">スライダー値</SegmentedItem>
			<SegmentedItem id="cursor">カーソル値</SegmentedItem>
		</Segmented>
		<p>{{ value }}</p>
		<div class="slider-wrapper">
			<!-- <Slider v-model="value" :min="0" :max="1" :pending :defaultValue="0.5" /> -->
			<Slider v-model="value" :min="0" :max="100" :pending :defaultValue="0.5" />
		</div>
	</div>
</template>

<style scoped lang="scss">
	.slider-test {
		@include flex-center;
		flex-direction: column;
		align-items: center;
		height: 100dvh;
		margin: 0 10px;
	}

	p {
		width: 100%;
		margin-top: 40px;
		text-align: center;
	}

	.slider-wrapper {
		width: 100%;
		margin: 50px 0;

		// .slider:nth-of-type(2) {
		// 	--size: large;
		// }
	}
</style>
