<script setup lang="ts">
	const props = defineProps<{
		/** 日期时间对象。 */
		dateTime: Date | null;
		/** 是否同时显示时间？ */
		showTime?: boolean;
		/** 是否显示相对时间？ */
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
