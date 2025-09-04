<!-- @deprecated 廃止されました -->

<docs>
	投稿者があなたに「いいね」しています🖤🖤！
</docs>

<script setup lang="ts">
	const props = defineProps<{
		/** 非表示にしますか？ */
		hidden?: boolean;
	}>();

	const hover = ref(false);
	const [onContentEnter, onContentLeave] = simpleAnimateSize("width");
</script>

<template>
	<Transition>
		<Comp v-if="!hidden" role="text" @mouseenter="hover = true" @mouseleave="hover = false">
			<!-- 注意：ここには落とし穴があります。mouseenterとmouseleaveを使い、mouseoverとmouseoutは絶対に使わないでください。 -->
			<Icon name="heart" />
			<Transition :css="false" @enter="onContentEnter" @leave="onContentLeave">
				<span v-show="hover" class="text">投稿者が「いいね」しました</span>
			</Transition>
		</Comp>
	</Transition>
</template>

<style scoped lang="scss">
	:comp {
		@include round-small;
		display: inline-flex;
		align-items: center;
		height: 24px;
		padding: 6px;
		color: c(accent);
		font-weight: 500;
		background-color: c(accent-10);

		.dark & {
			color: c(icon-color);
		}

		.icon {
			font-size: 16px;
		}

		.text {
			margin-left: 4px;
			overflow: clip;
			white-space: nowrap;
		}

		&.v-enter-from,
		&.v-leave-to {
			scale: 0.8;
			opacity: 0;
		}
	}
</style>
