<script lang="tsx">
	import { NuxtLink } from "#components";

	export default defineComponent({
		inheritAttrs: false,
		props: {
			/** ハイパーリンクのターゲットアドレス。 */
			to: { type: String, required: true },
			/** リンク内リンクですか？ */
			linkInLink: { type: Boolean, default: false },
			/** 現在のルートでアクティブ状態として表示しますか？ */
			activable: { type: Boolean, default: false },
			/** 新しいウィンドウでリンクを開きますか？ */
			blank: { type: Boolean, default: false },
			/** URL検索パラメータ（？）。 */
			query: {
				type: [String, Object] as PropType<UrlQueryType>,
				default: "",
			},
			/** URLハッシュ（＃）。 */
			hash: { type: String, default: undefined },
		},
		setup(props) {
			const localePath = useLocalePath();
			const parentScopeId = useParentScopeId();

			const attrs = computed(() => {
				const attrs = { ...useAttrs() }; // 注意：useAttrs関数はattrsからの読み取り専用オブジェクトを参照するため、オブジェクトのコピーを作成する必要があります。
				if (!props.activable && !props.blank)
					Object.assign(attrs, { activeClass: " ", exactActiveClass: " " }); // disableActiveClass
				else
					attrs.ariaCurrentValue = "page";
				if (props.linkInLink && parentScopeId)
					attrs[parentScopeId] = "";
				if (props.blank)
					attrs.target = "_blank";
				return attrs;
			});

			const routeLocation = computed(() => ({
				path: localePath(props.to),
				hash: props.hash,
				query: props.query,
			} as RouteLocation));

			return {
				routeLocation, attrs,
			};
		},
		render() {
			const slot = this.$slots.default?.();
			let link = <NuxtLink to={this.routeLocation} {...this.attrs}>{slot}</NuxtLink>;
			if (this.linkInLink)
				link = <object>{link}</object>;
			return link;
		},
	});
</script>
