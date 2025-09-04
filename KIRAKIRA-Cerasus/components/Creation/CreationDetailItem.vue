<script setup lang="ts">
	const props = defineProps<{
		/** アイコン、任意。 */
		icon?: DeclaredIcons;
		/** クリック可能ですか？ */
		clickable?: boolean;
	}>();
</script>

<template>
	<Comp :class="{ clickable }">
		<Icon v-if="icon" :name="icon" />
		<p><slot></slot></p>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		display: flex;
		flex-shrink: 0;
		gap: 0.25rem;
		align-items: center;
		color: c(icon-color);

		&.clickable {
			cursor: pointer;

			&:any-hover {
				color: c(accent-hover);
			}

			&:active {
				color: c(accent-pressed);
			}
		}
	}

	.icon {
		font-size: 20px;
	}

	p,
	p:deep(time) {
		user-select: text;

		:comp.clickable & {
			user-select: none;
		}
	}
</style>
