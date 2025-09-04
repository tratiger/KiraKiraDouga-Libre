<script setup lang="ts">
	const props = defineProps<{
		/** アイコン、任意。 */
		icon?: DeclaredIcons;
		/**
		 * ボタンをクリックしてナビゲーションを切り替えますか？
		 * #### NOTE
		 * ボタンをクリックするとすぐにナビゲーションが切り替わり、クリックイベントが無効になります。
		 *
		 * **この機能の使用は推奨されません**。例えば、マウスの中ボタンで新しいウィンドウを開いたり、タッチスクリーンでリンクを長押ししたりする操作は機能しなくなります。リンクコンポーネントを使用してください。
		 */
		href?: string;
		/** ボタンは読み込み中ですか？ */
		loading?: boolean;
		/** ボタンイベントのレベル。 */
		severity?: "warning" | "danger";
	}>();

	const emits = defineEmits<{
		click: [e: MouseEvent];
	}>();

	/**
	 * マウスクリックイベント。
	 * @param e - マウスイベント。
	 */
	function onClick(e: MouseEvent) {
		props.href && navigate(props.href);
		emits("click", e);
	}
</script>

<template>
	<button
		type="button"
		@click="onClick"
		:class="severity && ['force-color', { warning: ['yellow', 'warning'], danger: ['red', 'danger'] }[severity]]"
	>
		<div v-ripple class="button-content">
			<div v-if="severity === 'warning' || severity === 'danger'" class="decoration">
				<Icon v-for="i in 5" :name="severity === 'danger' ? 'close' : 'exclamation'" :key="i" />
			</div>
			<Transition name="icon" mode="out-in">
				<Icon v-if="icon" :name="icon" :key="icon" />
			</Transition>
			<span class="caption"><span><slot></slot></span></span>
			<Transition>
				<ProgressBar v-if="loading" />
			</Transition>
			<LocaleLink v-if="href" :draggable="false" :to="href" class="link lite" :tabindex="-1" />
		</div>
	</button>
</template>

<style scoped lang="scss">
	@layer props {
		button {
			/// 外観の好み、選択可能な値：primary | secondary | tertiary。
			/// primary: 強調色ボタン。
			/// secondary: セカンダリ/背景なしボタン。
			/// tertiary: 非強調色状態ボタン。
			--appearance: primary;
			/// ラベルテキストを非表示にしますか？
			--hide-caption: false;
			/// アイコンをテキストの後に配置しますか？
			--icon-behind: false;
		}
	}

	button {
		display: inline-grid;
		color: white;
		font-weight: 500;

		&[disabled] {
			pointer-events: none;
			interactivity: inert;
		}

		* {
			font-family: inherit;
			font-feature-settings: inherit;
		}

		&.secondary {
			--appearance: secondary;
		}

		&.tertiary {
			--appearance: tertiary;
		}

		&.icon-behind {
			--icon-behind: true;
		}

		&.warning,
		&.danger {
			font-weight: 600;
		}

		&:deep(*) {
			font-variant-numeric: inherit;
		}
	}

	.button-content {
		@include flex-center;
		@include button-shadow;
		@include round-small;
		@include square(inherit);
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		min-height: 36px;
		padding: 8px 16px;
		white-space: nowrap;
		vertical-align: middle;
		background-color: c(accent);
		touch-action: manipulation;
		transition: $fallback-transitions, all $ease-out-back 500ms !important;

		> span {
			font-family: inherit;
		}

		@container style(--icon-behind: true) {
			flex-direction: row-reverse;
		}

		button:active > & {
			@include button-scale-pressed;
			background-color: c(accent);
		}

		button[disabled] > & {
			background-color: c(accent-disabled) !important;
			box-shadow: none !important;

			html.dark & :is(.caption, .icon) {
				opacity: 0.4;
			}
		}

		button:focus > & {
			@include button-shadow-focus;
		}

		button:any-hover > & {
			// タッチスクリーンではhoverスタイルをサポートしません。
			@include button-shadow-hover;
			background-color: c(accent-hover);
		}

		button:any-hover:focus > & {
			@include button-shadow-hover-focus;
		}

		@container style(--appearance: secondary) or style(--appearance: tertiary) {
			background-color: transparent;

			button:not(:focus-visible) > & {
				box-shadow: none !important;
			}

			.icon {
				color: inherit;
			}
		}

		@container style(--appearance: secondary) {
			@include accent-ripple;
			color: c(accent);

			button:any-hover > &,
			button:active > & {
				background-color: c(accent-hover-overlay);
			}

			button:focus-visible > &,
			button:focus-visible:hover > & {
				@include button-shadow-focus-only;
			}

			button[disabled] > & {
				color: c(accent-disabled);
				background-color: transparent !important;
			}
		}

		@container style(--appearance: tertiary) {
			color: c(icon-color);

			button:any-hover > &,
			button:active > & {
				background-color: c(hover-overlay);
			}

			button:focus-visible > &,
			button:focus-visible:hover > & {
				@include button-shadow-unchecked-focus-only;
			}

			button[disabled] > & {
				color: c(gray-40);
				background-color: transparent !important;
			}
		}
	}

	@keyframes decoration-move {
		0% {
			translate: 0 150%;
			opacity: 0;
		}

		50% {
			opacity: 1;
		}

		100% {
			translate: 0 -150%;
			opacity: 0;
		}
	}

	.decoration {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		overflow: clip;
		opacity: 0.4;
		pointer-events: none;

		> * {
			position: absolute;
			scale: 1.5;
			transition: $fallback-transitions, all $ease-out-back 1s;
			animation: decoration-move 4s linear infinite both;

			button:any-hover & {
				scale: 2;
			}

			button.danger:any-hover & {
				rotate: 90deg;
			}
		}

		@for $i from 1 through 5 {
			> :nth-child(#{$i}) {
				animation-delay: (1.6s * ($i - 1));
			}
		}

		> :nth-child(1) {
			font-size: 36px;
		}

		> :nth-child(2) {
			left: 20%;
			font-size: 24px;
		}

		> :nth-child(3) {
			left: 50%;
			font-size: 48px;
		}

		> :nth-child(4) {
			left: 60%;
			font-size: 16px;
		}

		> :nth-child(5) {
			left: 80%;
			font-size: 32px;
		}
	}

	@mixin icon-only {
		margin-right: 0 !important;
		font-size: 24px;
	}

	.icon {
		$padding-inset: 2px;
		$padding-outset: 8px;
		$size: 18px;
		min-width: $size;
		min-height: $size;
		margin-right: $padding-outset;
		color: inherit;
		font-size: $size;

		@container style(--icon-behind: false) {
			margin-left: -$padding-inset;
		}

		@container style(--icon-behind: true) {
			margin-right: -$padding-inset;
			margin-left: $padding-outset;
		}

		&:has(+ .caption > :empty) {
			@include icon-only;
		}

		@container style(--hide-caption: true) {
			@include icon-only;
		}
	}

	.caption {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;

		> * {
			overflow: hidden;
		}

		@container style(--hide-caption: true) {
			grid-template-columns: 0fr;
		}
	}

	.link {
		@include square(100%);
		position: absolute !important;
	}

	.progress-bar:deep() {
		position: absolute !important;
		bottom: 0;
		width: 100%;
		border-radius: 0 !important;

		.wrapper {
			background-color: transparent;
			translate: -50%;
		}

		button:not([disabled]) & .line {
			background-color: white;
		}

		&.v-enter-from,
		&.v-leave-to {
			height: 0;
		}
	}
</style>
