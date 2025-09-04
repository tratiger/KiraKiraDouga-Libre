<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** 表示しますか？（一方向バインディング用） */
		shown?: boolean;
		/** CSSのz-index。 */
		zIndex?: number;
		/** 静的（見た目がなく形式的なマスク）にしますか？ */
		effectless?: boolean;
		/** コンテンツの位置を指定します。 */
		position?: MaskSlotPosition;
		/** コンテンツをフォーカスします。空白部分をクリックして閉じないようにしますか？ */
		focusing?: boolean;
		/** 無効にしますか？ */
		disabled?: boolean;
		/** Teleportを無効にしますか？ */
		teleportDisabled?: boolean;
	}>(), {
		zIndex: 50,
		position: "center",
	});

	const model = defineModel<boolean>();
	const shown = withOneWayProp(model, () => props.shown);
	const mask = ref<HTMLDivElement>();

	/**
	 * マスク部分をクリックしてコンテンツを閉じます。
	 * @param e - 鼠标单击事件。
	 */
	function close(e: MouseEvent) {
		if (e.target === mask.value) // クリックされた最終要素はマスク自身である必要があり、そのコンテンツであってはなりません。
			if (props.focusing) replayAnimation(mask.value, "focusing");
			else model.value = false;
	}
</script>

<template>
	<Teleport to="#popovers" :disabled="teleportDisabled">
		<Contents v-if="!disabled" :style="{ '--z-index': zIndex }">
			<Transition>
				<div
					v-if="shown"
					ref="mask"
					class="mask"
					:class="[position, { effectless }]"
					@click="close"
				></div>
			</Transition>
			<slot><div></div></slot>
		</Contents>
		<slot v-else></slot>
	</Teleport>
</template>

<style scoped lang="scss">
	.mask {
		@include fullscreen(fixed);
		$slot: "+ :slotted(*)";

		&:not(.effectless) {
			background-color: c(main-bg, 40%);
			backdrop-filter: grayscale(0.4);
			transition: 300ms;

			&.v-enter-from,
			&.v-leave-to {
				opacity: 0;
			}
		}

		&,
		& #{$slot} {
			z-index: var(--z-index);
			// z-index: v-bind(zIndex); // v-bindはTeleport内では使用できません。Vueの更新に注意してください：https://github.com/vuejs/core/issues/4605
		}

		&.focusing #{$slot} {
			animation: swing 500ms $ease-out-sine;
		}

		#{$slot} {
			position: fixed;
			margin: auto;
		}

		&.left #{$slot} {
			left: 0;
		}

		&.right #{$slot} {
			right: 0;
		}

		&.top #{$slot} {
			top: 0;
		}

		&.bottom #{$slot} {
			bottom: 0;
		}

		&.center {
			&:not(.left, .right) #{$slot} {
				right: 0;
				left: 0;
			}

			&:not(.top, .bottom) #{$slot} {
				top: 0;
				bottom: 0;
			}
		}
	}
</style>
