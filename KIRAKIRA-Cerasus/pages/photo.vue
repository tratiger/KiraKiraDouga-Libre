<script setup lang="ts">
	import shibamata from "assets/audios/shibamata.mp3";
	import metadata from "assets/audios/shibamata.vtt";
	import testPhoto from "assets/images/かいりきベア.jpg";
	const audio = ref<HTMLAudioElement>();
	const currentPitch = ref("");
	const flipped = ref<boolean>();
	const photoInput = ref<HTMLInputElement>();
	const photo = ref(testPhoto);
	const cueChangeTimeoutId = ref<Timeout>();
	const pitch = ref(0);
	const rate = computed({
		get: () => 2 ** (pitch.value / 12),
		set: value => pitch.value = Math.log2(value) * 12,
	});
	const enter = ref(true);

	/**
	 * ワンクリックで柴又！
	 */
	function otomading() {
		if (!audio.value) return;
		audio.value.preservesPitch = false;
		const { paused } = audio.value;
		if (paused) audio.value.play().catch(useNoop);
		else {
			audio.value.pause();
			currentPitch.value = "";
			flipped.value = undefined;
		}
	}

	/**
	 * 字幕変更イベント。
	 * @param e - 通常のイベント。
	 */
	function onCueChange(e: Event) {
		const track = e.target as HTMLTrackElement;
		const cue = track.track.activeCues?.[0] as VTTCue;
		if (!cue) return;
		clearTimeout(cueChangeTimeoutId.value);
		const duration = (cue.endTime - cue.startTime) * 1000;
		cueChangeTimeoutId.value = setTimeout(() => currentPitch.value = "", duration / rate.value);
		currentPitch.value = cue.text;
		flipped.value = !flipped.value;
	}

	/**
	 * 画像アップロード時に呼び出されます。
	 * @param e - 通常のイベント。
	 */
	async function onChangePhoto(e: Event) {
		const input = e.target as HTMLInputElement;
		const image = input.files?.[0];
		if (image)
			photo.value = await fileToBlob(image);
	}

	/**
	 * 画像をクリックして画像を変更します。
	 * @param e - 通常のイベント。
	 */
	function onClickPhoto(e: Event) {
		replayAnimation(e.currentTarget as HTMLDivElement, "swing");
		photoInput.value?.click();
	}

	/**
	 * スライダーをスライドさせた後のイベント。
	 */
	function onSliding() {
		if (!audio.value) return;
		audio.value.playbackRate = rate.value;
	}

	/**
	 * オーディオの再生速度が変更されたときのイベント。
	 * @param e - 通常のイベント。
	 */
	function onRateChange(e: Event) {
		const audio = e.currentTarget as HTMLAudioElement;
		rate.value = audio.playbackRate;
	}

	onMounted(() => {
		otomading();
	});
</script>

<template>
	<div class="container">
		<div class="left">
			<h2>アルバム機能のテスト</h2>
			<Button @click="otomading">音MADing!</Button>
			<p class="pitch">{{ currentPitch }}</p>
			<ToggleSwitch v-model="enter">入る</ToggleSwitch>
			<Slider v-model="pitch" :min="-24" :max="24" :defaultValue="0" @changing="onSliding" />
			<audio ref="audio" loop controls @ratechange="onRateChange">
				<source :src="shibamata" />
				<track default kind="metadata" :src="metadata" @cuechange="onCueChange" />
			</audio>
			<input
				ref="photoInput"
				hidden
				type="file"
				accept="image/*"
				@change="onChangePhoto"
			/>
		</div>
		<div class="right" @click="onClickPhoto">
			<img
				:src="photo"
				alt="photo"
				:class="{ front: flipped === false, back: flipped, enter }"
				:tabindex="0"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
	$flip-scale: 1.1;

	.container,
	.left {
		display: flex;
		gap: 1.5rem;
		justify-content: space-between;
	}

	@include mobile {
		.container {
			flex-direction: column;
		}
	}

	.left {
		flex-direction: column;
		justify-content: flex-start;

		.pitch {
			margin-bottom: auto;
			font-size: 54px;
			text-align: center;

			&:empty::after {
				content: "\a0"; // コンテンツがない場合でも、レイアウトのずれを防ぐために高さを保持します。
			}
		}

		video,
		audio {
			@include mobile {
				width: 100%;
			}
		}
	}

	.right {
		overflow: clip;
		cursor: pointer;

		&.swing {
			animation: swing 500ms $ease-out-sine;
		}

		img {
			width: 100%;
			max-height: calc(100dvh - 2 * 26px);

			&.front,
			&.back {
				animation: 250ms $ease-out-max forwards;
			}

			&.front {
				animation-name: flip-front;
			}

			&.back {
				animation-name: flip-back;
			}

			&:focus-visible {
				filter: invert(1);
			}

			&:not(.enter) {
				animation-timing-function: step-start;
			}
		}
	}

	@keyframes flip-front {
		from {
			scale: $flip-scale;
		}

		to {
			scale: 1;
		}
	}

	@keyframes flip-back {
		from {
			scale: -$flip-scale $flip-scale;
		}

		to {
			scale: -1 1;
		}
	}
</style>
