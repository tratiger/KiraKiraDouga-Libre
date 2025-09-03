<docs>
	# ポインターイベントタイプ検出。
	Apple Pencilやペンタブレットなどの特殊なデバイスを一時的にテストするために使用します。
</docs>

<script setup lang="ts">
	useHead({ title: "ポインターイベントタイプ検出" });
	const pointerType = ref("");

	/**
	 * クリックイベント。
	 * @param e - ポインタークリックイベント。
	 */
	function onPointerUp(e: PointerEvent) {
		pointerType.value = e.pointerType;
	}
</script>

<template>
	<div>
		<h1>ポインターイベントタイプ検出</h1>
		<span>以下のボタンをクリックすると、どの入力デバイスでクリックされたかを検出できます</span>
		<Button @pointerup="onPointerUp">クリックして</Button>
		<p>{{ pointerType }}</p>
	</div>
</template>

<style scoped lang="scss">
	div {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 24px;
	}

	p {
		font-size: 16px;
	}
</style>
