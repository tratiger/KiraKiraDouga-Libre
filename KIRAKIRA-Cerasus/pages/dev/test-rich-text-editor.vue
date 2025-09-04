<script setup lang="ts">
	useHead({ title: "リッチテキストテストページ" });
</script>

<template>
	<div class="container">
		<ShadingIcon icon="email" position="right top" />

		<Heading>リッチテキストの例</Heading>

		<div class="introduce">
			<p><a target="_blank" href="https://tiptap.dev/introduction">Tiptap</a>ベース&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;コードの場所：components/TextEditor/*&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;下の部分はリッチテキストエディタ本体ですが、作りが粗く、デモ用です……</p>
			<p>現在実装されている機能：選択したテキストの太字設定/解除、またはカーソル位置への<a target="_blank" href="https://tiptap.dev/guide/node-views/vue">Vueコンポーネントの追加</a>。試してみますか？</p>
			<p>残念ながら、TiptapはネイティブではMarkdown形式の入出力をサポートしておらず、JSONまたはHTML文字列のみをサポートしています。</p>
		</div>

		<TextEditorRtf />
	</div>
</template>

<style scoped lang="scss">
	.introduce {
		@include round-large;
		margin: 1rem 0;
		padding: 1rem;
		background-color: c(gray-20);
	}
</style>
