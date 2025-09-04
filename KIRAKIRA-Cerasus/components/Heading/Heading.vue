<docs>
	トップの大きな見出し。

	~~HTMLのtitleタグと競合するため、Titleとは呼びません。~~
	~~HTMLのheadタグと競合するため、Headとは呼びません。~~
	~~HTMLのheaderタグと競合するため、Headerとは呼びません。~~
	HTMLのh1〜h6タグに対応するクラス名はHTML**Heading**Elementです。
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		form?: "main" | "small" | "small-solid";
	}>(), {
		form: "main",
	});
</script>

<template>
	<h1
		:class="{
			sub: form === 'small' || form === 'small-solid',
			stroked: form === 'small',
		}"
	>
		<slot></slot>
	</h1>
</template>

<style scoped lang="scss">
	h1 {
		color: c(accent);

		&:not(.sub) {
			margin-bottom: -2px;
			font-weight: 900;
			font-size: 40px;
			text-transform: capitalize;
			transform: skewX(-10deg); // `font-style: italic;` は傾きすぎるため使用しないでください。
			transform-origin: left bottom;
			font-variant-caps: small-caps;
			transition: none;

			&:lang-latin {
				font-family: $english-logo-fonts;
				font-style: italic;
				transform: none;
			}
		}

		&.sub {
			margin-bottom: 1px;
			font-weight: bold;
			font-size: 30px;
			font-family: $english-logo-fonts;
			font-style: italic;
			text-transform: uppercase;

			&.stroked {
				background-clip: text;
				opacity: 0.4;
				-webkit-text-stroke-width: 1px;
				-webkit-text-fill-color: transparent;
			}
		}
	}
</style>
