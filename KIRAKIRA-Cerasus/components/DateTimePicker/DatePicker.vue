<docs>
	# 日付ピッカー
</docs>

<script lang="ts">
	function getLocaleDateFormat(locale: string | Intl.Locale) {
		const go = new Date("2006-01-02T15:04:05"); // Golangのユーモラスな日時フォーマット文字列。
		const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit", numberingSystem: "latn" };
		const formatted = new Intl.DateTimeFormat(locale, options).format(go);
		const [, num1, sep, num2, num3] = formatted.match(/(\d+)(.*?)(\d+).*?(\d+)/)!;
		const ymd = [num1, num2, num3].map(num => ({ 2006: "y", "01": "m", "02": "d" })[num]!).join("");
		const weekdayAfter = !new Intl.DateTimeFormat(locale, { ...options, weekday: "short" }).format(go).match(/\d$/);
		const weekdays = forMap(7, date => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2006, 0 /* 注意: 0は1月を表します！ */, date)), 1);
		return { ymd, sep: sep.trim(), weekdayAfter, weekdays };
	}
	const availableCalendars = ["gregory", "chinese"] as const;
	function toHanziDecimal(num: number, locale: string | Intl.Locale = "zh") {
		return Intl.NumberFormat(locale, { numberingSystem: "hanidec", useGrouping: false }).format(num);
	}
	function toChineseCalendarMonth(monthCode: string, locale: string | Intl.Locale = "zh") {
		// return Temporal.Now.plainDateISO().withCalendar("chinese").with({ monthCode: "M01" }).toLocaleString("zh-CN", { calendar: "chinese", month: "long" });
		// 上記のコードでは、11月が冬月ではなく十一月と書かれ、12月が臘月と書かれるという、とんでもない間違いが発生します。しかし、繁体字中国語は正常です。日本語の11月と12月は一緒にストライキをします。
		locale = new Intl.Locale(locale).maximize();
		const hans = locale.script === "Hans";
		return (monthCode.endsWith("L") ? "閏" : "") +
			" 正二三四五六七八九十冬臘"[+monthCode.match(/\d+/)![0]];
	}
	function toHanziDays(day: number, locale: string | Intl.Locale = "zh") {
		// return Intl.NumberFormat(locale, { numberingSystem: "hanidays" }).format(num); // 公式の方法ですが、ブラウザはサポートしていません。
		locale = new Intl.Locale(locale).maximize();
		const hans = locale.script === "Hans";
		const tens = ` 十廿卅卌圩${hans ? "圆" : "圓"}${hans ? "进" : "進"}枯枠百`;
		const ones = "〇一二三四五六七八九十";
		if (day <= 10) return "初" + ones[day];
		else if (day % 10 === 0) return ones[day / 10] + "十";
		else return tens[day / 10 | 0] + ones[day % 10];
	}
</script>

<script setup lang="ts">
	const value = defineModel<Temporal.PlainDate>({ required: true });
	const locale = getCurrentLocaleLangCode(undefined, true);
	const useHanzi = computed(() => locale.startsWith("zh") || locale === "ja"); // 中国語（簡体字、繁体字、広東語を含む）と日本語は漢字を使用できます。
	const isChineseCalendar = computed(() => value.value.calendarId === "chinese");
	const format = computed(() => getLocaleDateFormat(locale));
	const staticFields = {
		calendar: { name: "calendar", values: availableCalendars, getDisplayValue: calendar => t.calendar[calendar] } satisfies BaseDateTimePickerField<string>,
		weekday: { name: "weekday", text: () => format.value.weekdays[value.value.dayOfWeek % 7], minWidth: "2em" },
		y: {
			name: "year",
			sep: format.value.sep,
			values: () => forMap(21, Number, value.value.year - 10),
			placeholderLength: 4,
			getDisplayValue: year => {
				if (isChineseCalendar.value && useHanzi.value) return toHanziDecimal(year, locale);
				return year.toString().padStart(4, "0");
			},
		} satisfies BaseDateTimePickerField<number>,
		m: {
			name: "month",
			sep: format.value.sep,
			values: () => forMap(value.value.monthsInYear, month => value.value.toPlainYearMonth().with({ month }).monthCode, 1),
			getDisplayValue: monthCode => {
				if (isChineseCalendar.value && useHanzi.value) return toChineseCalendarMonth(monthCode, locale);
				return monthCode.match(/\d+/)![0].padStart(2, "0") + (monthCode.endsWith("L") ? "+" : "");
			},
			loopable: true,
			minWidth: () => isChineseCalendar.value && useHanzi.value ? "2em" : undefined,
		} satisfies BaseDateTimePickerField<string>,
		d: {
			name: "date",
			sep: format.value.sep,
			values: () => forMap(value.value.daysInMonth, Number, 1),
			getDisplayValue: date => {
				if (isChineseCalendar.value && useHanzi.value) return toHanziDays(date, locale);
				return padTo2Digit(date);
			},
			loopable: true,
		} satisfies BaseDateTimePickerField<number>,
	} satisfies Record<string, BaseDateTimePickerField | BaseDateTimePickerFieldPlain>;
	const fields: (BaseDateTimePickerField | BaseDateTimePickerFieldPlain)[] = reactive([
		staticFields.calendar,
		...!format.value.weekdayAfter ? [staticFields.weekday] : [],
		staticFields[format.value.ymd[0] as "y"],
		staticFields[format.value.ymd[1] as "m"],
		{ ...staticFields[format.value.ymd[2] as "d"], sep: undefined },
		...format.value.weekdayAfter ? [staticFields.weekday] : [],
	]);
	const model = computed({
		get: () => ({
			calendar: value.value.calendarId,
			year: value.value.year,
			month: value.value.monthCode,
			date: value.value.day,
		}),
		set: ({ calendar, year, month, date }) =>
			value.value = calendar === value.value.calendarId ?
				Temporal.PlainDate.from({
					calendar,
					year,
					monthCode: month,
					day: clamp(date, 1, Temporal.PlainYearMonth.from({ calendar, year, monthCode: month }).daysInMonth),
				}) :
				value.value.withCalendar(calendar),
	});
</script>

<template>
	<BaseDateTimePicker :fields v-model="model" />
</template>
