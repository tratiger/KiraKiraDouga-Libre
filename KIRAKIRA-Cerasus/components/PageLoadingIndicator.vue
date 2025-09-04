<docs>
	# グローバルローディングインジケーター
	NuxtLoadingIndicatorの代替として使用します。

	Nuxtのドキュメントに基づいて作成：https://nuxt.com/docs/api/components/nuxt-loading-indicator
</docs>

<script setup lang="ts">
	const { progress, isLoading, error, start, finish, clear } = useLoadingIndicator();
</script>

<template>
	<Comp>
		<ProgressBar :hidden="!isLoading" :value="progress" />
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		position: fixed;
		top: 0;
		right: -4px;
		left: 0;
		z-index: calc(infinity);
		pointer-events: none;

		.progress-bar {
			border-radius: 0;
			transform-origin: top;

			&:deep(.determinate) {
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}
</style>
