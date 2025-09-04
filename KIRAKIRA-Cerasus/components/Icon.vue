<docs>
	# アイコンコンポーネント
	カプセル化された総合アイコンコンポーネント。次回アイコンモジュールを変更したい場合は、ここで一括して変更できます。
	現在のアイコンモジュール：@nuxt/icon
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** アイコンファイル名。 */
		name: DeclaredIcons;
		/** アイコン自体の色を保持しますか？ */
		filled?: boolean;
	}>(), {
		filled: false,
	});

	const iconName = computed(() => {
		return props.name.replace(/^(.*)\/|^/, (_, prefix) => (prefix ?? "kirakira") + ":");
	});
</script>

<template>
	<i class="icon" :class="{ filled }" role="img" :aria-label="new VariableName(name).words">
		<NuxtIcon :name="iconName" />
	</i>
</template>

<style scoped lang="scss">
	.icon {
		@include square(1em);
		display: inline-flex;

		&:not(.filled) :deep(svg) {
			fill: currentColor;
		}

		:deep(svg) {
			@include square(1em);
		}
	}
</style>
