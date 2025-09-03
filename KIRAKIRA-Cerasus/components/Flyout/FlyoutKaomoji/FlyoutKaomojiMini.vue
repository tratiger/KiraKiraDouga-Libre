<docs>
	# ミニ顔文字フローティングウィンドウ
</docs>

<script setup lang="ts">
	const emits = defineEmits<{
		insert: [text: string];
		escape: [];
	}>();

	const model = defineModel<FlyoutModel>();
	const grid = ref<HTMLDivElement>();
	const hide = () => model.value = undefined;
	const recentKaomoji = useRecentKaomojiStore();
	const selectedItem = () => grid.value?.querySelector(":focus"); // computedを使用すると結果が間違ってしまいますが、なぜですか？

	/**
	 * フローティングウィンドウが表示されたときのイベント。
	 */
	function onShowFlyout() {
		(grid.value?.children[0] as HTMLElement)?.focus();
	}

	/**
	 * 選択位置を移動します。
	 * @param displacement - 変位値、正数は右、負数は左。
	 */
	function moveSelectedPosition(displacement: number) {
		const current = elementIndex(selectedItem());
		const length = grid.value?.childElementCount ?? 0;
		if (!length) return;
		let newIndex = 0;
		if (current !== -1) {
			newIndex = current;
			newIndex += displacement;
			newIndex = floorMod(newIndex, length);
		}
		(grid.value?.children[newIndex] as HTMLElement)?.focus();
	}

	/**
	 * 顔文字を挿入するコールバック関数。
	 * @param kaomoji - 入力された顔文字。
	 */
	function input(kaomoji: string) {
		emits("insert", kaomoji);
		recentKaomoji.add(kaomoji);
		hide();
	}

	/**
	 * キーボードが押されたときのイベント。
	 * @param e - キーボードイベント。
	 */
	function onKeydown(e: KeyboardEvent) {
		switch (e.code) {
			case "Escape":
				hide();
				emits("escape");
				break;
			case "ArrowRight":
				moveSelectedPosition(1);
				stopEvent(e);
				break;
			case "ArrowLeft":
				moveSelectedPosition(-1);
				stopEvent(e);
				break;
			// "Enter"のケースはありませんが、直接使用できます。
			default:
				break;
		}
	}
</script>

<template>
	<Flyout v-model="model" @show="onShowFlyout">
		<Comp>
			<div ref="grid" class="grid" @keydown="onKeydown">
				<FlyoutKaomojiButton
					v-for="(kaomoji, index) in recentKaomoji.kaomojis"
					:key="kaomoji"
					v-i="index"
					highlighted
					@click="input(kaomoji)"
				>{{ kaomoji }}</FlyoutKaomojiButton>
			</div>
		</Comp>
	</Flyout>
</template>

<style scoped lang="scss">
	$button-width: 120px;

	.grid {
		display: flex;
		gap: 6px;
	}

	.flyout-kaomoji-button {
		width: $button-width;
		animation: float-left 500ms calc(var(--i) * 100ms) $ease-out-max backwards;
	}

	@keyframes float-left {
		from {
			translate: 40px;
			opacity: 0;
		}
	}
</style>
