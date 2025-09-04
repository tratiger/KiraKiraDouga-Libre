<script setup lang="ts">
	const props = defineProps<{
		/** 日時オブジェクト。 */
		dateTime: Date | null;
		/** 時刻も表示しますか？ */
		showTime?: boolean;
		/** 相対時間を表示しますか？ */
		relativeTime?: boolean | Intl.RelativeTimeFormatStyle;
	}>();

	const isValidDate = computed(() => props.dateTime instanceof Date && !Number.isNaN(props.dateTime.valueOf()));
</script>

<template>
	<time :datetime="isValidDate ? dateTime?.toISOString() : undefined">
		<slot>
			{{ relativeTime ?
				!dateTime ? "−" : timeAgo(dateTime, relativeTime === true ? undefined : relativeTime) :
				formatDateWithLocale(isValidDate ? dateTime : null, { time: showTime }) }}
		</slot>
	</time>
</template>
