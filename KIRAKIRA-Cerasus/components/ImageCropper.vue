<!-- vue-cropperに基づく画像切り抜きコンポーネント -->
<script setup lang="ts">
	import cropTestImage from "assets/images/av820864307.jpg";
	import { VueCropper } from "vue-cropper";

	const props = withDefaults(defineProps<{
		/** 切り抜き画像のアドレス */
		image?: string;
		/** 切り抜き画像の品質、0.1～1 */
		outputSize?: number;
		/** 切り抜き画像のフォーマット */
		outputType?: "jpeg" | "png" | "webp";
		/** 切り抜き枠のサイズ情報を表示するかどうか */
		info?: boolean;
		/** 画像のホイールズームを許可するかどうか */
		canScale?: boolean;
		/** デフォルトでスクリーンショット枠を生成するかどうか */
		autoCrop?: boolean;
		/** デフォルトで生成されるスクリーンショット枠の幅 */
		autoCropWidth?: number;
		/** デフォルトで生成されるスクリーンショット枠の高さ */
		autoCropHeight?: number;
		/** スクリーンショット枠の幅と高さの比率を固定するかどうか */
		fixed?: boolean;
		/** スクリーンショット枠の幅と高さの比率、fixedを有効にする必要があります */
		fixedNumber?: [number, number];
		/** 元画像の比率でスクリーンショットを出力するかどうか */
		full?: boolean;
		/** スクリーンショット枠のサイズを固定します。trueの場合、スクリーンショット枠のサイズは変更できません。falseの場合、変更できます */
		fixedBox?: boolean;
		/** アップロードした画像を移動できるかどうか */
		canMove?: boolean;
		/** スクリーンショット枠をドラッグできるかどうか */
		canMoveBox?: boolean;
		/** アップロードした画像を元の比率でレンダリングします */
		original?: boolean;
		/** スクリーンショット枠が画像内に制限されているかどうか */
		centerBox?: boolean;
		/** デバイスのdprに従って等比率の画像を出力するかどうか */
		high?: boolean;
		/** trueは実際の出力画像の幅と高さを表示し、falseは表示されているスクリーンショット枠の幅と高さを表示します */
		infoTrue?: boolean;
		/** 画像の最大幅と高さを制限します、0～max */
		maxImgSize?: number;
		/** スクリーンショット枠に応じた画像の出力倍率、0～max（大きすぎるとフリーズする可能性があるため、推奨されません） */
		enlarge?: number;
		/** 画像のデフォルトのレンダリング方法 */
		mode?: "contain" | "cover" | string;
		/** 切り抜き枠の最小領域を制限します */
		limitMinSize?: number | [] | string;
		/** エクスポート時の背景色の塗りつぶし */
		fillColor?: string | void;
	}>(), {
		image: cropTestImage,
		outputSize: 1,
		outputType: "png",
		info: true,
		canScale: true,
		autoCrop: true,
		autoCropWidth: Infinity,
		autoCropHeight: Infinity,
		fixed: false,
		fixedNumber: () => [1, 1],
		full: false,
		fixedBox: false,
		canMove: true,
		canMoveBox: true,
		original: false,
		centerBox: false,
		high: true,
		infoTrue: false,
		maxImgSize: 99999,
		enlarge: 1,
		mode: "contain",
		limitMinSize: 10,
		fillColor: undefined,
	});

	const cropper = ref();
	/**
	 * 切り抜かれた画像の結果を取得します
	 * @returns Blob形式で保存された切り抜き後の画像
	 */
	const getCropBlobData = (): Promise<Blob> => {
		return new Promise((resolve, reject) => {
			if (!cropper.value) {
				reject(new Error("Cropper is not initialized"));
				return;
			}

			cropper.value.getCropBlob((data: unknown) => {
				const imageBlobData = data as Blob;
				if (imageBlobData)
					resolve(imageBlobData);
				else
					reject(new Error("No image data found"));
			});
		});
	};

	defineExpose({
		getCropBlobData,
	});
</script>

<template>
	<ClientOnly>
		<VueCropper
			ref="cropper"
			:img="image"
			:outputSize
			:outputType
			:info
			:canScale
			:autoCrop
			:autoCropWidth
			:autoCropHeight
			:fixed
			:fixedNumber
			:full
			:fixedBox
			:canMove
			:canMoveBox
			:original
			:centerBox
			:high
			:infoTrue
			:maxImgSize
			:enlarge
			:mode
			:limitMinSize
			:fillColor
		>
			<template #loading>
				<ProgressRing />
			</template>
		</VueCropper>
	</ClientOnly>
</template>

<style scoped lang="scss">
	.vue-cropper:deep(*) {
		// ドラッグによる遅延を防ぐ
		transition: none;

		.cropper-view-box {
			outline-color: c(accent);

			// グリッド線
			&::before,
			&::after {
				content: "";
				position: absolute;
				z-index: 1;
				border: dotted c(accent);
				pointer-events: none;
			}

			// グリッド線 - 水平
			&::before {
				top: 50%;
				left: 0;
				width: 100%;
				height: calc(100% / 3);
				border-width: 1px 0;
				translate: 0 -50%;
			}

			// グリッド線 - 垂直
			&::after {
				top: 0;
				left: 50%;
				width: calc(100% / 3);
				height: 100%;
				border-width: 0 1px;
				translate: -50%;
			}
		}

		.cropper-face {
			@include flex-center;
			background-color: transparent;
			opacity: 1;

			// 十字線
			&::before,
			&::after {
				@include oval;
				content: "";
				position: absolute;
				display: block;
				background-color: c(accent);
				pointer-events: none;
			}

			// 十字線 - 水平
			&::before {
				width: 12px;
				height: 1px;
			}

			// 十字線 - 垂直
			&::after {
				width: 1px;
				height: 12px;
			}
		}

		// コントロールボール
		.crop-point {
			$size: 16px;
			// stylelint-disable-next-line order/order
			@include square($size);
			@include circle;
			@include flex-center;
			@include control-ball-shadow;
			background-color: c(main-bg);
			opacity: 1;
			transition: $fallback-transitions;

			&::before {
				@include circle;
				content: "";
				display: block;
				width: 100%;
				height: 100%;
				background-color: c(accent);
				scale: 0.5;
			}

			&:hover::before {
				scale: 0.7;
			}

			&:active::before {
				scale: 0.4;
			}

			&:focus,
			&:active {
				@include large-shadow-focus;
			}

			@for $i from 1 through 8 {
				$offset: calc($size / -2);
				$offset-center: calc(50% - $size / 4);

				&.point#{$i} {
					@if $i <= 3 {
						top: $offset;
					}

					@if $i >= 6 {
						bottom: $offset;
					}

					@if list.index(1 4 6, $i) {
						left: $offset;
					}

					@if list.index(3 5 8, $i) {
						right: $offset;
					}

					@if list.index(2 7, $i) {
						left: $offset-center;
					}

					@if list.index(4 5, $i) {
						top: $offset-center;
					}
				}
			}
		}

		// 解像度情報
		.crop-info {
			@include round-small;
			@include dropdown-flyouts;
			@include acrylic-background;
			top: unset !important;
			bottom: 16px;
			left: 50%;
			padding: 8px 10px;
			color: c(text-color);
			font-size: 14px;
			font-variant-numeric: tabular-nums;
			white-space: nowrap;
			translate: -50% 0;
			opacity: 0;
			visibility: hidden;
			transition: $fallback-transitions;
		}

		&:has(.crop-point:active) .crop-info {
			opacity: 1;
			visibility: visible;
		}
	}
</style>
