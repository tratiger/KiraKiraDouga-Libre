type CompInstance = InstanceType<typeof Comp>;

/**
 * Comp DOMへの参照。
 * @param value - 初期化時に渡されるデータ。
 * @returns Comp DOMへの参照。
 */
export function refComp(value?: CompInstance) {
	return customRef((track, trigger) => ({
		get() {
			track();
			return value?.$el as HTMLElement | undefined;
		},
		set(newValue) {
			value = newValue as unknown as CompInstance;
			trigger();
		},
	}));
}

/**
 * Flyoutコンポーネントへの参照。
 * @deprecated 驚いたことに、この関数は作成後すぐに非推奨となりました。より強力なv-modelを使用してパラメータを渡してください。
 * @returns Flyoutコンポーネントへの参照。
 */
export function refFlyout() {
	return ref<InstanceType<typeof Flyout>>();
}

/**
 * Menuコンポーネントへの参照。
 * @deprecated 驚いたことに、この関数は作成後すぐに非推奨となりました。より強力なv-modelを使用してパラメータを渡してください。
 * @returns Menuコンポーネントへの参照。
 */
export function refMenu() {
	return ref<InstanceType<typeof Menu>>();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnknownFunctionType = (...args: any[]) => any;

/**
 * 基本コンポーネントの表示・非表示関数を取得します。
 * @deprecated 驚いたことに、この関数は作成後すぐに非推奨となりました。より強力なv-modelを使用してパラメータを渡してください。
 * @param base - 基本コンポーネント。提供されない場合は、新しい空の参照が作成されます。
 * @returns 基本コンポーネントとその表示・非表示関数。
 */
export function useBaseComponentShowHide<T extends { show: UnknownFunctionType; hide: UnknownFunctionType }>(base?: Ref<T | undefined>) {
	if (!base) base = ref<T>();
	return {
		ref: base,
		show: (...args: Parameters<T["show"]>): ReturnType<T["show"]> => base.value?.show(...args),
		hide: (...args: Parameters<T["hide"]>): ReturnType<T["hide"]> => base.value?.hide(...args),
	};
}
