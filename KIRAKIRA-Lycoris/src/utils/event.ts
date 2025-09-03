type Options = Partial<{
	/** すぐに呼び出すか？ */
	immediate: boolean;
}>;

/**
 * DOMイベントリスナーの追加と削除のロジックをコンポーザブル関数にカプセル化することもできます。
 * @param target - ウィンドウオブジェクト。文字列である必要があることに注意してください。
 * @param event - イベント。
 * @param callback - コールバック関数。
 * @param options - その他のオプション。
 */
export function useEventListener<K extends keyof WindowEventMap>(target: Window, event: K, callback: (this: Window, ev: WindowEventMap[K]) => void, options?: Options): void;
/**
 * DOMイベントリスナーの追加と削除のロジックをコンポーザブル関数にカプセル化することもできます。
 * @param target - ドキュメントオブジェクト。文字列である必要があることに注意してください。
 * @param event - イベント。
 * @param callback - コールバック関数。
 * @param options - その他のオプション。
 */
export function useEventListener<K extends keyof DocumentEventMap>(target: Document, event: K, callback: (this: Document, ev: DocumentEventMap[K]) => void, options?: Options): void;
/**
 * DOMイベントリスナーの追加と削除のロジックをコンポーザブル関数にカプセル化することもできます。
 * @param target - HTML DOM要素。
 * @param event - イベント。
 * @param callback - コールバック関数。
 * @param options - その他のオプション。
 */
export function useEventListener<K extends keyof HTMLElementEventMap, E extends HTMLElement>(target: MaybeRef<E | ComponentPublicInstance | undefined>, event: K, callback: (this: E, ev: HTMLElementEventMap[K]) => void, options?: Options): void;
/**
 * DOMイベントリスナーの追加と削除のロジックをコンポーザブル関数にカプセル化することもできます。
 * @param target - HTML DOM要素。
 * @param event - イベント。
 * @param callback - コールバック関数。
 * @param options - その他のオプション。
 */
export function useEventListener<K extends keyof HTMLElementEventMap, E extends HTMLElement>(target: MaybeRef<E | ComponentPublicInstance | undefined> | Window | Document, event: K, callback: (this: E, ev: HTMLElementEventMap[K]) => void, options: Options = {}): void {
	// 必要であれば、CSSセレクタの文字列形式でターゲットDOM要素を見つけることもできます。
	const getTarget = () => {
		target = toValue(target);
		if (!target) return undefined;
		else if ("$el" in target) return target.$el as HTMLElement;
		else return target;
	};
	onMounted(() => {
		if (options.immediate) (callback as () => void)();
		getTarget()?.addEventListener(event, callback as never);
	});
	onUnmounted(() => {
		getTarget()?.removeEventListener(event, callback as never);
	});
}
