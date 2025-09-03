<docs>
	# カプセルスライダー
	音量、速度制御に適しています。
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** スライダーの最小値。 */
		min?: number;
		/** スライダーの最大値。 */
		max?: number;
		/** スライダーのデフォルト値。マウスの中央ボタンをクリックするか、タッチスクリーンでコンポーネントを長押しすると、デフォルト値に戻ります。 */
		defaultValue?: number;
		/** 表示値、または数値を表示値に変換する関数。 */
		displayValue?: ((value: number) => Readable) | Readable;
	}>(), {
		min: 0,
		max: 100,
		defaultValue: undefined,
		displayValue: undefined,
	});

	const emits = defineEmits<{
		/** スライダーをドラッグするとイベントがトリガーされます。 */
		changing: [value: number];
		/** スライダーのドラッグが完了して離すとイベントがトリガーされます。 */
		changed: [value: number];
	}>();

	const model = defineModel<number>({ required: true });
	const errorInfo = `値の範囲は [${props.min}, ${props.max}] である必要がありますが、現在の値は ${model.value} です。`;
	if (props.min > props.max)
		throw new RangeError(`CapsuleSlider の最小値が最大値より大きいですか？最小値は ${props.min}、最大値は ${props.max} です。`);
	if (model.value < props.min)
		throw new RangeError("CapsuleSlider の値が最小値より小さいです。" + errorInfo);
	if (model.value > props.max)
		throw new RangeError("CapsuleSlider の値が最大値より大きいです。" + errorInfo);

	const restrict = (n: number | undefined, nanValue: number) => Number.isFinite(n) ? clamp(map(n!, props.min, props.max, 0, 1), 0, 1) : nanValue;
	const value = computed(() => restrict(model.value, 0));
	const smoothValue = useSmoothValue(value, 0.5); // このパラメータを変更すると、スライダーの平滑な移動値を調整できます。
	const adjustedValue = computed(() => { // clip-path によって視覚的な白い縁が生じるため、数値をわずかに調整します。
		const TINY = 0.005;
		return (1 - smoothValue.value) * (1 + TINY) - TINY;
	});
	const smoothOriginalValue = computed(() => map(smoothValue.value, 0, 1, props.min, props.max));

	/**
	 * デフォルト値をリセットします。
	 * @param e - ポインターイベント（マウスとタッチを含む）。
	 */
	function resetDefault(e: PointerEvent | MouseEvent) {
		e.preventDefault();
		if (props.defaultValue !== undefined && Number.isFinite(props.defaultValue))
			for (const event of ["update:modelValue", "changing", "changed"] as const)
				emits(event as "changing", props.defaultValue);
	}

	/**
	 * トラッククリックのロジック処理。
	 * @param e - ポインターイベント（マウスとタッチを含む）。
	 */
	function onTrackDown(e: PointerEvent) {
		if (e.button === 1) { resetDefault(e); return; }
		const track = e.currentTarget as HTMLDivElement;
		const { left, width: max } = track.getBoundingClientRect();
		const pointerMove = (e: PointerEvent) => {
			const position = clamp(e.pageX - left, 0, max);
			const value = map(position, 0, max, props.min, props.max);
			model.value = value;
			emits("changing", value);
		};
		const pointerUp = () => {
			document.removeEventListener("pointermove", pointerMove);
			document.removeEventListener("pointerup", pointerUp);
			emits("changed", model.value);
		};
		document.addEventListener("pointermove", pointerMove);
		document.addEventListener("pointerup", pointerUp);
		pointerMove(e);
	}

	/**
	 * モバイル端末で長押しした場合（PCの右クリックメニューに相当）、デフォルト値に戻します。
	 * @param e - マウスイベント。
	 */
	function onLongPress(e: MouseEvent) {
		if (!isMobile()) return; // PC側では無視します。
		resetDefault(e);
	}

	const displayValue = computed(() =>
		(typeof props.displayValue === "function" ? props.displayValue(smoothOriginalValue.value) : props.displayValue)
		?? smoothOriginalValue.value);
</script>

<template>
	<Comp
		tabindex="0"
		:style="{ '--value': smoothValue }"
		role="slider"
		:aria-valuenow="value"
		:aria-valuemin="min"
		:aria-valuemax="max"
		aria-orientation="horizontal"
		@pointerdown="onTrackDown"
		@contextmenu="onLongPress"
	>
		<div class="value-container">
			<div class="value">{{ displayValue }}</div>
			<div class="value passed"></div>
			<div class="value value-on">{{ displayValue }}</div>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		@include round-large;
		@include dropdown-flyouts;
		@include acrylic-background;
		--value: 0;
		position: relative;
		height: $menu-item-height - 4px;
		overflow: clip;
		font-weight: 500;
		cursor: pointer;
		touch-action: none;

		@include mobile {
			height: $menu-item-height-mobile - 4px;
		}
	}

	.value-container {
		position: relative;
		height: 100%;
	}

	.value {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding-left: 20px;
		color: c(accent);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
		transition: none;

		html.dark & {
			color: white;
		}
	}

	.passed {
		background-color: c(accent);
		opacity: map(var(--value), 0, 1, 0.4, 1, true);
	}

	.passed,
	.value-on {
		color: white;
		clip-path: inset(-1rem calc(v-bind(adjustedValue) * 100%) -1rem -1rem);
	}
</style>
