<docs>
	# 未設計のデフォルト設定サブページ
</docs>

<template>
	<div class="no-settings">
		<LogoSettings />

		<h2>{{ t.settings }}</h2>
		<p>{{ t.unselected.settings }}</p>
	</div>
</template>

<style scoped lang="scss">
	.no-settings {
		@include flex-center;
		flex-direction: column;
		gap: 1rem;
		height: 70dvh;
		color: c(icon-color);
		transition: none;
	}
</style>
