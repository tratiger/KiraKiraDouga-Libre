<docs>
	アイコンをクリックするとアニメーションを再生するコンポーネント。

	コレクションやお気に入りなどの小さな機能に適しています。
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** ループ再生しますか？ */
		loop?: boolean;
		/** 自動再生しますか？ */
		autoplay?: boolean;
		/** アニメーションデータJSONまたはそのファイル名。 */
		name: object | DeclaredLotties;
		/** 非表示にしますか？ */
		hidden?: boolean;
		/** 再生速度。 */
		speed?: number;
		/** 状態情報。パラメータは順に、マーカー、ループ、速度です。 */
		state?: AnimatedIconState;
		/** アイコン自体の色を保持しますか？ */
		filled?: boolean;
	}>(), {
		speed: 1,
		state: () => [],
	});

	const emits = defineEmits<{
		init: [anim?: AnimationItem];
		click: [anim?: AnimationItem];
		press: [anim?: AnimationItem];
		lift: [anim?: AnimationItem];
	}>();

	const animationData = ref<object>();
	const anim = ref<AnimationItem>();
	const iconBox = ref<HTMLDivElement>();

	watch(() => props.speed, () => onSpeedChange());
	watch(() => props.state, () => onStateChange());

	/**
	 * ファイル名形式のアイコンを取得します。
	 */
	function getIcon() {
		if (typeof props.name !== "string") {
			animationData.value = props.name;
			return;
		}
		try {
			const iconsImport = import.meta.glob<string>("assets/lotties/**/**.json", {
				query: "?raw",
				import: "default",
				eager: true,
			});
			const rawIcon = iconsImport[`/assets/lotties/${props.name}.json`];
			animationData.value = JSON.parse(rawIcon);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(`Lottie file '${props.name}' doesn't exist in 'assets/lotties'`, e);
		}
	}

	/**
	 * アイコンクリックインタラクションイベント。
	 */
	function onClick() {
		if (!anim.value) return;
		emits("click", anim.value);
	}

	/**
	 * アニメーションを停止します。
	 */
	function stop() {
		anim.value?.stop();
	}

	/**
	 * アニメーションを再生します。
	 */
	function play() {
		anim.value?.play();
	}

	/**
	 * アニメーションを一時停止します。
	 */
	function pause() {
		anim.value?.pause();
	}

	/**
	 * 再生速度を制御します。
	 */
	function onSpeedChange() {
		anim.value?.setSpeed(props.speed);
	}

	/**
	 * 状態情報を制御します。
	 */
	function onStateChange() {
		const ani = anim.value;
		if (!ani) return;
		let marker: string | undefined, loop: boolean | undefined, speed: number | undefined;
		if (props.state instanceof Array)
			[marker, loop, speed] = props.state;
		else
			({ marker, loop, speed } = props.state);
		if (loop !== undefined) ani.loop = loop;
		if (speed) { // 0でない場合に有効。
			ani.playSpeed = Math.abs(speed);
			ani.playDirection = Math.sign(speed);
		}
		if (!marker)
			if (speed === 0) ani.pause();
			else ani.play();
		else {
			const markerItem = ani.markers.find(m => m.payload.name === marker);
			if (markerItem)
				if (Object.is(speed, -0)) ani.goToAndStop(marker, true);
				else if (Object.is(speed, 0)) ani.goToAndStop(markerItem.time + markerItem.duration - 1, true);
				else ani.goToAndPlay(marker, true);
		}
	}

	/**
	 * Lottieアニメーションの読み込みが完了したときに呼び出され、animオブジェクトを取得するために使用されます。
	 * @param animated - animオブジェクト。
	 */
	function onAnimationCreated(animated: AnimationItem) {
		anim.value = animated;
		onSpeedChange();
		onStateChange();
		emits("init", animated);
	}

	usePressed(iconBox, () => emits("press", anim.value), () => emits("lift", anim.value));

	defineExpose({
		play, pause, stop,
	});

	await getIcon();
	watchEffect(getIcon);
</script>

<template>
	<Comp>
		<div
			ref="iconBox"
			class="icon-box"
			@click="onClick"
		>
			<Lottie
				:class="{ filled }"
				:loop
				:autoplay
				:animationData="animationData!"
				:hidden
				@animCreated="onAnimationCreated"
			/>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	:comp,
	.icon-box,
	.lottie {
		display: inline-block;
		line-height: 0;
	}

	.icon-box {
		position: relative;

		.lottie {
			@include square(1em);
			cursor: pointer;

			&:not(.filled) :deep(*) {
				fill: currentColor;
			}
		}
	}
</style>
