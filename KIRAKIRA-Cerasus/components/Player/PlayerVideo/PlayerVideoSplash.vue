<docs>
	# ファーストビューのローディング画面。
	今後、パート切り替えや動画ページから直接他の動画（おすすめ動画など）に移動する際に、シャッターを引くようなアニメーション（maimaiの閉店アニメーション参照）を検討することができます。
</docs>

<script setup lang="ts">
	/** 表示しますか？ */
	const shown = defineModel<boolean>();
</script>

<template>
	<Transition>
		<Comp v-if="shown">
			<LogoCover noTitle />
			<LogoText />
			<div class="logo-player">
				<Icon class="logo" name="yozora" />
				<p class="name">YOZORA PLAYER</p>
			</div>
		</Comp>
	</Transition>
</template>

<style scoped lang="scss">
	:comp {
		background-color: c(main-bg);
		transition-duration: 500ms;

		&.v-enter-from,
		&.v-leave-to {
			opacity: 0;
		}
	}

	.logo-cover {
		--width: 100%;
		--height: 100%;
	}

	.logo-text {
		--form: full;
		position: absolute;
		top: 12px;
		right: 10px;
		z-index: 2;
		font-size: 22px;

		@include mobile {
			display: none;
		}
	}

	.logo-player {
		@include flex-center;
		position: absolute;
		top: 8px;
		left: 12px;
		overflow: clip;
		color: c(accent);
		font-size: 22px;

		.icon {
			font-size: 1.5em;
		}

		p {
			font-family: $english-logo-fonts;
			font-weight: 600;
		}
	}
</style>
