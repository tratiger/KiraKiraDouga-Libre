/**
 * コンポジションAPIでレンダリング関数を定義します。例えば、特定のJSXを返します。
 * @param render - レンダリング関数を指定します。例えば、JSX。
 */
export function useRender(render: () => VNode): void {
	const vm = getCurrentInstance() as ComponentInternalInstance & { render: () => VNode } | null;
	if (!vm) throw new Error("[useRender] must be called from inside a setup function");
	vm.render = render;
}

/**
 * 親コンポーネントを取得します。
 * @remarks この関数を使用すると、このコンポーネントを変更してホットリロードをトリガーしたときに、コンポーネントが突然消えることがあります。現在のところ、ウェブページをリフレッシュすることでのみ解決できます。
 * @param type - 親コンポーネントの型フィルタ。
 * @returns 親コンポーネント、またはnull（存在しない場合）。
 */
export function useParent<T extends ComponentInternalInstance>(type?: ConcreteComponent | unknown) {
	let parent = getCurrentInstance()?.parent;
	while (!(!parent || type === undefined || parent.type === type))
		parent = parent.parent;
	return parent as T | null || null;
}

/**
 * 親コンポーネントのスコープ付きスタイルIDを取得します。
 * @returns 親コンポーネントのスコープ付きスタイルID。
 */
export function useParentScopeId() {
	return getCurrentInstance()?.vnode.scopeId;
}

/**
 * 現在のコンポーネントのスコープ付きスタイルIDを取得します。
 * @remarks リリース版では、特定の極端な状況下で正常に動作しない可能性があります。
 * @returns 現在のコンポーネントのスコープ付きスタイルID。
 * 現在のコンポーネントにスコープ付きスタイルIDがない場合はundefinedを返し、この関数がsetup期間中に呼び出されない場合はnullを返します。
 */
export function useScopeId() {
	return getScopeIdFromInstance(getCurrentInstance());
}

/**
 * Scope IDを介して親コンポーネントを取得します。
 * @returns 親コンポーネント、またはnull（存在しない場合）。
 */
export function useParentByScopeId() {
	const instance = getCurrentInstance();
	if (!instance) return null;
	if ("ctx" in instance.vnode)
		return instance.vnode.ctx as ComponentInternalInstance;
	const scopeId = instance.vnode.scopeId;
	if (!scopeId) return null;
	let parent = instance.parent;
	while (!(!parent || getScopeIdFromInstance(parent) === scopeId))
		parent = parent.parent;
	return parent;
}

/**
 * インスタンスからコンポーネントのScope IDを取得します。
 * @remarks リリース版では、特定の極端な状況下で正常に動作しない可能性があります。
 * @param instance - コンポーネントの内部インスタンス。
 * @returns コンポーネントのScope ID。
 */
export function getScopeIdFromInstance(instance: ComponentInternalInstance | null) {
	if (!instance) return null;
	const scopeIdInProxy = instance.proxy?.$options.__scopeId;
	if (scopeIdInProxy) return scopeIdInProxy;
	if (!(instance.type instanceof Object && "__scopeId" in instance.type)) return undefined;
	return instance.type.__scopeId as string;
}

/**
 * defineModelで単方向バインディングのブール値プロパティを同時に互換性を持たせてバインドします。
 * @param model - 双方向バインディングのブール値モデル。
 * @param oneWayProp - 単方向互換バインディングのブール値プロパティを呼び出す関数。定数でない限り、変数を直接渡すことは推奨されません。さもなければバインディングが失われます。
 * @returns 変更時はモデルと直接一致し、読み取り時にモデルがundefinedを取得した場合は、単方向バインディングプロパティの値を呼び出す計算済みプロパティ。それでもundefinedの場合は自動的にfalseに変換されます。
 */
export function withOneWayProp(model: Ref<boolean | undefined>, oneWayProp: TypeOrReturnToType<boolean | undefined>): WritableComputedRef<boolean>;
/**
 * defineModelで単方向バインディングのプロパティを同時に互換性を持たせてバインドします。
 * @param model - 双方向バインディングモデル。
 * @param oneWayProp - 単方向互換バインディングプロパティを呼び出す関数。変数を直接渡すことは推奨されません。さもなければバインディングが失われます。
 * @returns 変更時はモデルと直接一致し、読み取り時にモデルがundefinedを取得した場合は、単方向バインディングプロパティの値を呼び出す計算済みプロパティ。
 */
export function withOneWayProp<T>(model: Ref<T | undefined>, oneWayProp: TypeOrReturnToType<T>): WritableComputedRef<T>;
/**
 * defineModelで単方向バインディングのプロパティを同時に互換性を持たせてバインドします。
 * @param model - 双方向バインディングモデル。
 * @param oneWayProp - 単方向互換バインディングプロパティを呼び出す関数。変数を直接渡すことは推奨されません。さもなければバインディングが失われます。
 * @returns 変更時はモデルと直接一致し、読み取り時にモデルがundefinedを取得した場合は、単方向バインディングプロパティの値を呼び出す計算済みプロパティ。
 */
export function withOneWayProp<T>(model: Ref<T | undefined>, oneWayProp: TypeOrReturnToType<T>) {
	const result = computed({
		get: () =>
			model.value !== undefined && model.value !== null && model.value !== false ? model.value :
			typeof oneWayProp === "function" ? (oneWayProp as () => T)() : oneWayProp,
		set: value => model.value = value,
	});
	return result;
}

/**
 * Vueコンポーネントの可能性があるものから実際のDOMを取得します。
 * @param el - コンポーネントまたは要素の参照。
 * @returns 実際のDOM。
 */
export function getElFromComponentInstance(el: MaybeRef<HTMLElement | ComponentPublicInstance | undefined>) {
	el = toValue(el);
	return !el ? undefined : "$el" in el ? el.$el as HTMLElement : el;
}

/**
 * スロット内の子ノードの内容を取得します。
 * @param item - スロット内の特定のアイテム。
 * @returns スロット内の子ノードの内容。
 */
export function getSlotVNodeNormalizedChildren(item: VNode) {
	return (item.children as Slots).default?.()?.[0]?.children;
}

/**
 * 仮想スロットの内容に関するオブジェクトの配列を取得します。
 * @see https://stackoverflow.com/questions/55754822 この関数はTypeScriptの機能の妥協に制約されており、短期的にはよりエレガントな書き方に変更することはできません。
 * @param vdoms - スロットの内容。
 * @returns 関数の括弧を2回呼び出す必要があることに注意してください。そうしないと、スロットの内容に関するオブジェクトの配列を取得できません。
 */
export function getSlotItems<
	C,
>(
	vdoms: VNode<RendererNode, RendererElement, AnyObject>[] | undefined,
) {
	/**
	 * @param def - Propsのデフォルト値を指定します。
	 * @returns スロットの内容に関するオブジェクトの配列。
	 */
	return <
		D extends Partial<Record<keyof ComponentProps<C>, unknown>> = {},
	>(
		def = {} as D,
	) => vdoms?.flatMap(item => {
		let items = [item];
		if (typeof item.type === "symbol" && item.type.description === "v-fgt" && Array.isArray(item.children))
			items = item.children as VNode[];
		return items.map(item => {
			const props = { ...item.props };
			const content = getSlotVNodeNormalizedChildren(item);
			if (typeof content !== "string") return undefined!;
			for (const [key, value] of entries(def))
				props[key] ??= value;
			props.content ??= content;
			props.id ??= content;
			type OriginalProps = ComponentProps<C> & { content: string };
			type OverrideProps = Override<OriginalProps, {
				[key in keyof D]:
					key extends keyof OriginalProps ?
					D[key] extends undefined | null ? OriginalProps[key] : NonNull<OriginalProps[key]> :
					D[key];
			}>;
			return props as Readonly<OverrideProps>;
		});
	}).filter(Boolean) ?? [];
}

/**
 * デフォルトスロットに内容があるかどうかを判断します。
 * @returns デフォルトスロットに内容がありますか？
 */
export function hasContentInDefaultSlot() {
	return !!useSlots().default?.()?.length;
}
