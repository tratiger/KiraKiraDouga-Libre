<script setup lang="ts">
	import { useAVBars } from "vue-audio-visual";
	const audio = (await import(`assets/audios/test${randBetween(3, 3)}.mp3`) as typeof import("*.mp3")).default;
	const player = ref<HTMLAudioElement | null>(null);
	const canvas = ref<HTMLCanvasElement | null>(null);
	const accent = useCssVar("--accent");
	const accent10 = useCssVar("--accent-10");
	const pitch = ref(0);

	useAVBars(player, canvas, {
		src: audio,
		canvHeight: 60,
		canvWidth: 200,
		barColor: [accent10.value, accent.value],
		barSpace: 0,
		barWidth: 2,
	});

	onMounted(() => {
		if (!player.value) return;
		player.value.preservesPitch = false;
		player.value.play().catch(useNoop);
	});

	/**
	 * スライダーをスライドさせた後のイベント。
	 */
	function onSliding() {
		if (!player.value) return;
		player.value.playbackRate = 2 ** (pitch.value / 12);
	}

	/**
	 * オーディオの再生速度が変更されたときのイベント。
	 * @param e - 通常のイベント。
	 */
	function onRateChange(e: Event) {
		const audio = e.currentTarget as HTMLAudioElement;
		pitch.value = Math.log2(audio.playbackRate) * 12;
	}
</script>

<template>
	<div class="container">
		<h2>オーディオとスペクトルのテスト機能</h2>
		<audio ref="player" :src="audio" controls loop @ratechange="onRateChange" />
		<Slider v-model="pitch" :min="-24" :max="24" :defaultValue="0" @changing="onSliding" />
		<canvas ref="canvas" />
	</div>
</template>

<style scoped lang="scss">
	h2 {
		margin-bottom: 1.5rem;
	}

	audio {
		width: 100%;
	}
</style>
