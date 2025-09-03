<docs>
	# 时间选择器
</docs>

<script lang="ts">
	function getLocaleTimeFormat(locale: string | Intl.Locale) {
		const go = new Date("2006-01-02T15:04:05"); // 幽默 Golang 的日期时间格式化字符串。
		const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" };
		const formatted = new Intl.DateTimeFormat(locale, options).format(go);
		const hour12 = formatted.includes("03");
		const sep = formatted.match(/.(?=04)/)?.[0] ?? ":";
		const formattedPm = new Intl.DateTimeFormat(locale, { ...options, hour12: true }).format(go);
		const formattedAm = new Intl.DateTimeFormat(locale, { ...options, hour12: true }).format(new Date("2006-01-02T03:04:05"));
		const periodAfter = !formattedPm.endsWith("04");
		const periodRegExp = periodAfter ? /(?<=04).*$/ : /^.*(?=03)/;
		const pm = formattedPm.match(periodRegExp)?.[0].trim() ?? "";
		const am = formattedAm.match(periodRegExp)?.[0].trim() ?? "";
		return { hour12, periodAfter, sep, am, pm };
	}
	const hour23ToHour12 = (hour23: number) => ({
		period: hour23 >= 12 ? "pm" : "am",
		hour: hour23 % 12 || 12,
	});
	const hour12ToHour23 = ({ period, hour }: ReturnType<typeof hour23ToHour12>) => hour % 12 + (period === "pm" ? 12 : 0);
</script>

<script setup lang="ts">
	const value = defineModel<Temporal.PlainTime>({ required: true });
	const locale = getCurrentLocaleLangCode(undefined, true);
	const format = computed(() => getLocaleTimeFormat(locale));
	const staticFields = {
		period: { name: "period", values: ["am", "pm"], getDisplayValue: period => period === "am" ? format.value.am : format.value.pm },
		hour12: { name: "hour", sep: format.value.sep, values: forMap(12, Number, 1), getDisplayValue: padTo2Digit, loopable: true },
		hour23: { name: "hour", sep: format.value.sep, values: forMap(24, Number, 0), getDisplayValue: padTo2Digit, loopable: true },
		minute: { name: "minute", sep: format.value.sep, values: forMap(60, Number, 0), getDisplayValue: padTo2Digit, loopable: true },
		second: { name: "second", values: forMap(60, Number, 0), getDisplayValue: padTo2Digit, loopable: true },
	} satisfies Record<string, BaseDateTimePickerField>;
	const fields: BaseDateTimePickerField[] = reactive([
		...format.value.hour12 && !format.value.periodAfter ? [staticFields.period] : [],
		format.value.hour12 ? staticFields.hour12 : staticFields.hour23,
		staticFields.minute,
		staticFields.second,
		...format.value.hour12 && format.value.periodAfter ? [staticFields.period] : [],
	]);
	const model = computed({
		get: () => ({
			...format.value.hour12 ? hour23ToHour12(value.value.hour) : { hour: value.value.hour, period: undefined },
			minute: value.value.minute,
			second: value.value.second,
		}),
		set: ({ period, hour, minute, second }) => value.value = new Temporal.PlainTime(
			!period ? hour : hour12ToHour23({ period, hour }),
			minute,
			second,
		),
	});
</script>

<template>
	<BaseDateTimePicker :fields v-model="model" />
</template>
