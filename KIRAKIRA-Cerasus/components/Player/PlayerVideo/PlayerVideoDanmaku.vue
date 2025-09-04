<docs>
	# 弾幕コンテナ
	Danmaku ライブラリを使用：https://github.com/weizhenye/Danmaku
</docs>

<script setup lang="ts">
	import Danmaku from "danmaku/dist/esm/danmaku.dom.js";

	const props = withDefaults(defineProps<{
		/** メディアは`<video>`または`<audio>`要素です。指定しない場合はライブモードになります。 */
		media?: MaybeRef<HTMLMediaElement | undefined>;
		/** プリセットされた弾幕データ配列。メディアモードで使用します。フォーマットはemit APIで説明されています。 */
		comments?: DanmakuComment[];
		/** DOMエンジンとcanvasエンジンをサポートしています。canvasエンジンはDOMよりも効率的ですが、メモリ消費が比較的多くなります。 */
		engine?: "canvas" | "dom";
		/**
		 * 弾幕の基準速度。speed APIでも設定可能です。
		 *
		 * すべての弾幕には、その生存期間を示す `duration` プロパティがあります。`duration` は `ステージ幅 / danmaku.speed` で計算されます。ここで `danmaku.speed` はすべての弾幕の基準速度であり、各弾幕の実際の速度は `(弾幕幅 + ステージ幅) / duration` で計算されるためです。デフォルトの速度は `144` です。
		 */
		speed?: number;
		/** 弾幕を非表示にしますか？ */
		hidden?: boolean;
	}>(), {
		media: undefined,
		comments: () => [],
		engine: "dom",
		speed: undefined,
	});

	const emitted = defineModel<DanmakuComment[]>();
	const danmakuContainer = ref<HTMLDivElement>();
	const danmaku = ref<Danmaku>();
	const resizeObserver = ref<ResizeObserver>();

	/**
	 * 弾幕コンポーネントを初期化します。
	 */
	function initDanmaku() {
		if (import.meta.client) { // FIXME: 02: idk why `environment.client` not working here...
			const media = toValue(props.media);
			if (!media || !danmakuContainer.value) return;
			danmaku.value?.destroy();
			danmaku.value = new Danmaku({
				container: danmakuContainer.value,
				media,
				comments: props.comments,
				engine: props.engine,
				speed: props.speed,
			});
		}
	}

	watch(() => props.media, initDanmaku);
	watch(() => props.comments, initDanmaku); // 新しいデータがリクエストされたら、弾幕コンポーネントをリロードします

	onMounted(() => {
		if (!danmakuContainer.value) return;
		initDanmaku();
		resizeObserver.value = new ResizeObserver(() => {
			try {
				danmaku.value?.resize();
			} catch { }
		});
		resizeObserver.value.observe(danmakuContainer.value);
	});

	onBeforeUnmount(() => {
		danmaku.value?.destroy();
		danmakuContainer.value && resizeObserver.value?.observe(danmakuContainer.value);
	});

	watch(() => props.hidden, hidden => {
		if (!danmaku.value) return;
		if (!hidden) danmaku.value.show();
		else danmaku.value.hide();
	}, { immediate: true });

	watch(() => props.speed, speed => {
		if (!danmaku.value || speed === undefined) return;
		danmaku.value.speed = speed;
	});

	/**
	 * ### 画面クリア
	 * 現在のステージ上の弾幕をクリアします。
	 */
	function clear() {
		danmaku.value?.clear();
	}

	/**
	 * 弾幕を**発射**します（**送信**ではないことに注意）。
	 * @param comment - 弾幕の内容。
	 */
	function emit(comment: DanmakuComment) {
		danmaku.value?.emit(comment);
	}

	watch(emitted, emittedDanmaku => {
		if (emittedDanmaku) {
			emittedDanmaku.forEach(e => {
				emit(e);
			});
			emitted.value = undefined;
		}
	});

	defineExpose({
		clear, emit,
	});
</script>

<template>
	<div ref="danmakuContainer" class="danmaku-container" :hidden></div>
</template>

<style scoped lang="scss">
	.danmaku-container:deep() {
		pointer-events: none;

		* {
			transition: none;
		}

		.dm {
			@include round-small;

			&.user-sent {
				// box-shadow: -1px -1px black, -1px 1px black, 1px -1px black, 1px 1px black;
				backdrop-filter: invert(1);
			}

			&.dm-rainbow {
				background: linear-gradient(to right, #f2509e, #308bcd);
				background-clip: text;
				-webkit-text-stroke: 2px transparent;
			}
		}
	}
</style>
