<docs>
	# 时间码选择器
</docs>

<script setup lang="ts">
	const value = defineModel<Duration>({ required: true });
	const sep = Duration.localedColon;
	const fields: BaseDateTimePickerField<number>[] = reactive([
		{ name: "hour", sep, values: forMap(100, Number, 0), getDisplayValue: padTo2Digit },
		{ name: "minute", sep, values: forMap(60, Number, 0), getDisplayValue: padTo2Digit, loopable: true },
		{ name: "second", values: forMap(60, Number, 0), getDisplayValue: padTo2Digit, loopable: true },
	]);
	const model = computed({
		get: () => ({ hour: value.value.h, minute: value.value.m, second: value.value.s }),
		set: ({ hour, minute, second }) => value.value = new Duration(hour, minute, second),
	});
</script>

<template>
	<BaseDateTimePicker :fields v-model="model" />
</template>
