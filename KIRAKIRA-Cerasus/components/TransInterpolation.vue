<docs>
	i18nの文字列補間（interpolation）に他のコンポーネントを挿入できます。

	Vue I18n 公式の `<I18nT>` コンポーネントをベースに、プロジェクトに適応させています。
</docs>

<script lang="tsx">
	export default defineComponent({
		inheritAttrs: false,
		props: {
			/** i18nキー。 */
			keypath: {
				type: String,
				required: true,
			},
		},
		render() {
			// `this.$slots` を直接書くとProxyが返ってきて正常にレンダリングできないため、一度シャローコピーする必要があります。
			return <I18nT keypath={this.$props.keypath} scope="global">{{ ...this.$slots }}</I18nT>;
		},
	});
</script>
