<docs>
	動画が全画面表示の時のみ、上部に動画のタイトルと現在時刻を表示します。
</docs>

<script setup lang="ts">
	const props = defineProps<{
		/** 動画タイトル。 */
		title: string;
		/** 非表示にしますか？ */
		hidden?: boolean;
	}>();

	import { useNow, useBattery } from "@vueuse/core";
	const now = useNow();
	const time = computed(() => Intl.DateTimeFormat(getCurrentLocaleLangCode(), {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		hourCycle: "h23",
	}).format(now.value));

	const { charging, level, isSupported: hasBattery } = useBattery();
	const battery = computed(() => Math.round(level.value * 100) + "%");
</script>

<template>
	<Comp :class="{ hidden }">
		<div class="left">
			<h3 class="title">{{ title }}</h3>
		</div>
		<div class="right">
			<div v-if="hasBattery" class="battery">
				<p class="battery-text">{{ battery }}</p>
				<LogoBattery :value="level" :charging />
			</div>
			<time :datetime="now.toISOString()">{{ time }}</time>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	$gap: 0.75em;

	:comp {
		@include acrylic-background;
		position: absolute;
		top: 0;
		display: flex;
		gap: $gap;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 8px 20px;
		color: c(icon-color);
		backdrop-filter: blur(16px);
		pointer-events: none;
		transition: $fallback-transitions, background-color 0s;

		&.hidden {
			translate: 0 -100%;
			visibility: hidden;
		}
	}

	.left {
		min-width: 0;
	}

	.title {
		overflow: clip;
		font-size: 16px;
		font-weight: bold;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.right {
		display: flex;
		gap: $gap;
		align-items: center;

		.icon {
			font-size: 18px;
		}

		time,
		.battery-text {
			font-weight: 500;
			font-variant-numeric: tabular-nums;
		}

		.battery {
			display: flex;
			gap: 2px;
			align-items: center;
		}
	}
</style>
