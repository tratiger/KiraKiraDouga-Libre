<script setup lang="ts">
	import AccordionItem from "./AccordionItem.vue";

	const props = defineProps<{
		/** 他のアコーディオン項目を開いたときに、すでに開いているアコーディオン項目を自動的に折りたたみますか？ */
		autoCollapse?: boolean;
	}>();

	defineSlots<{
		default?: typeof AccordionItem;
	}>();

	const { Slot, children } = useFactory(AccordionItem);

	/**
	 * すべてのアコーディオン項目を閉じます。
	 */
	function collaspeAll() {
		if (!props.autoCollapse || !children.value) return;
		for (const child of children.value) {
			if (!child.component?.exposed?.shown) return;
			child.component.exposed.shown.value = false;
		}
	}

	defineExpose({
		collaspeAll,
	});
</script>

<template>
	<Comp role="list">
		<Slot />
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		@include round-large;
		@include chip-shadow;
		background-color: c(main-bg, 50%);
	}
</style>
