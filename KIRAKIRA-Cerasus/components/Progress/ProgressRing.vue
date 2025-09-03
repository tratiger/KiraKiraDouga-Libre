<docs>
	# 进度环
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** 加载完成并隐藏？ */
		hidden?: boolean;
		/** 指示进度条的最大值。 */
		max?: number;
		/** 进度值，留空表示不定状态。 */
		value?: number | undefined;
	}>(), {
		max: 100,
		value: NaN,
	});

	const indeterminate = computed(() => !Number.isFinite(props.value));
	const shown = computed(() => !props.hidden);
	const toDeterminate = ref(false);

	watch(indeterminate, async (curInd, prevInd) => {
		if (prevInd && !curInd) { // 当从不定状态到定值状态时增加一个动画，但反之则不会。
			toDeterminate.value = true;
			await delay(500);
			toDeterminate.value = false;
		}
	});
</script>

<template>
	<Transition :duration="500">
		<Comp v-if="shown" role="progressbar" :aria-busy="shown" :class="{ indeterminate, 'to-determinate': toDeterminate }">
			<svg class="ring" :style="{ '--progress': value / max }">
				<g class="linear-rotate">
					<g class="rotate-arc">
						<circle fill="none" />
					</g>
				</g>
			</svg>
			<Icon name="refresh" />
		</Comp>
	</Transition>
</template>

<style scoped lang="scss">
	$layer-animation-options: cubic-bezier(0.4, 0, 0.2, 1) infinite both;

	@layer props {
		:comp {
			/// 进度环尺寸大小。
			--size: 40px;
			/// 进度环边缘线条粗细。
			--thickness: 4px;
			/// 颜色。
			color: c(accent);
		}
	}

	:comp {
		@include square(var(--size));
		position: relative;
		display: inline-block;
		contain: strict;
		line-height: 0;

		&.v-leave-active * {
			transition-timing-function: $ease-in-cubic;
		}

		&.v-enter-from,
		&.v-leave-to {
			/* stylelint-disable-next-line length-zero-no-unit */
			--thickness: 0px !important; // 如果去掉 px 则会行为异常。
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.layer-wrapper {
			display: none;

			+ .icon {
				display: block;
			}
		}
	}

	.ring {
		@include square(100%);
		--progress: 0;
		overflow: visible;

		:comp.indeterminate & {
			.linear-rotate {
				/* stylelint-disable-next-line number-max-precision */
				animation: linear-rotate 1568.2352941176ms linear infinite both;
			}

			.rotate-arc {
				animation: rotate-arc 5332ms $layer-animation-options;
			}

			circle {
				animation: dash 1333ms $layer-animation-options;
			}
		}

		:comp:not(.indeterminate) & {
			circle {
				rotate: -100grad;
			}
		}

		.linear-rotate {
			transform-origin: center;
			animation-fill-mode: both;
		}

		.rotate-arc {
			transform-origin: center;
			animation-fill-mode: both;
		}

		circle {
			--center: calc(var(--size) / 2);
			--radius: calc(var(--center) - var(--thickness) / 2);
			--dash-array: calc(2 * #{math.$pi} * var(--radius));
			transform-origin: center;
			transition: $fallback-transitions, rotate 500ms $ease-out-smooth;
			animation-fill-mode: both;
			fill: transparent;
			stroke: currentColor;
			stroke-dasharray: var(--dash-array);
			stroke-dashoffset: calc(var(--dash-array) * (1 - var(--progress)));
			stroke-linecap: round;
			stroke-width: var(--thickness);
			cx: var(--center);
			cy: var(--center);
			r: var(--radius);

			:comp.to-determinate & {
				animation: to-determinate-scale 500ms $ease-out-smooth;
			}
		}

		+ .icon {
			display: none;
			color: currentColor;
			scale: 1.5;

			&,
			:deep(*) {
				@include square(100%);
			}
		}
	}

	@keyframes to-determinate-scale {
		from {
			stroke-dashoffset: 0;
		}
	}

	@keyframes rotate-arc {
		12.5% {
			transform: rotate(135deg);
		}

		25% {
			transform: rotate(270deg);
		}

		37.5% {
			transform: rotate(405deg);
		}

		50% {
			transform: rotate(540deg);
		}

		62.5% {
			transform: rotate(675deg);
		}

		75% {
			transform: rotate(810deg);
		}

		87.5% {
			transform: rotate(945deg);
		}

		100% {
			transform: rotate(1080deg);
		}
	}

	@keyframes linear-rotate {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes dash {
		0% {
			transform: rotate(-91.8deg);
			stroke-dashoffset: calc(var(--dash-array) * (1 - 0.01));
		}

		50% {
			transform: rotate(-225deg);
			stroke-dashoffset: calc(var(--dash-array) * (1 - 0.75));
		}

		100% {
			transform: rotate(-91.8deg);
			stroke-dashoffset: calc(var(--dash-array) * (1 - 0.01));
		}
	}
</style>
