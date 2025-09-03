<script lang="tsx">
	const comp = defineComponent({
		inheritAttrs: true,
		props: {
			/**
			 * 要素がフォーカス可能かどうか、また、シーケンシャルキーボードナビゲーションに参加するかどうか/どこで参加するかを示します。
			 *
			 * タグのパススルー機能がこのタグをサポートしていないようなので、手動で属性を追加して実装します。
			 */
			tabindex: {
				type: [Number, String] as PropType<Numberish>,
				default: undefined,
			},
			/**
			 * `role` を使用すると、コンポーネントの可読性とセマンティックが向上します。この属性は列挙型であり、任意に記入するものではないことに注意してください。
			 */
			role: {
				type: String as PropType<Role>,
				default: "application",
			},
		},
		setup() {
			const instance = getCurrentInstance();
			let className = "";
			do {
				if (!instance) break;
				const parent = useParentByScopeId();
				let componentName = parent?.type.__name;
				if (!componentName) {
					// 注意：このブロックの内容は本番環境では実行できません。現在、より良い解決策はなく、最適化が必要です。
					const componentPath = parent?.type.__file;
					if (!componentPath) break;
					componentName = path.fileRoot(componentPath);
				}
				if (!componentName) break;
				className = new VariableName(componentName).kebab;
			} while (false);
			const label = new VariableName(className).words;
			return { className, label };
		},
		render() {
			return (
				<kira-component tabindex={this.tabindex} class={this.className} role={this.role} aria-label={this.label}>
					{this.$slots.default?.()}
				</kira-component>
			);
		},
	});

	type OnToAt<T> = T extends `on${infer U}` ? `@${Lowercase<U>}` : never;
	type OnEvents = { [event in keyof Events as OnToAt<event>]?: (payload: Events[event]) => void; };
	export default comp as typeof comp & JSX.IntrinsicElements["section"] & OnEvents;
</script>
