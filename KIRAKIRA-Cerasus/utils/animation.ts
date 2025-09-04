/**
 * 指定されたDOM要素で進行中のすべてのアニメーションを削除します。
 * @param elements - HTML DOM 元素。
 * @returns アニメーションが削除されたかどうか。
 */
export function removeExistAnimations(...elements: Element[]) {
	let hasExistAnimations = false;
	for (const element of elements) {
		const existAnimations = element.getAnimations();
		if (existAnimations.length > 0) {
			hasExistAnimations = true;
			existAnimations.forEach(animation => animation.cancel());
		}
	}
	return hasExistAnimations;
}

/**
 * 次のCSSアニメーション更新フレームを待ちます。
 * @returns 空のPromise。
 */
export function nextAnimationTick() {
	return new Promise<void>(resolve => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				resolve();
			});
		});
	});
}

/**
 * 要素のスタイルを設定する際に、一時的にトランジションを無効にします。
 * @param element - HTML DOM要素またはそのCSSスタイル宣言。
 * @param style - CSSスタイル。
 */
export async function setStyleWithoutTransition(element: HTMLElement | CSSStyleDeclaration, style: CSSProperties = {}) {
	const styles = element instanceof CSSStyleDeclaration ? element : element.style;
	Object.assign(styles, style);
	styles.transition = "none";
	await nextAnimationTick();
	styles.transition = null!;
}

/**
 * CSSアニメーションを再再生します。
 * @param element - HTML DOM要素。
 * @param className - アニメーションを持つCSSクラス名。
 */
export async function replayAnimation(element: Element, ...className: string[]) {
	element.classList.remove(...className);
	await nextAnimationTick();
	element.classList.add(...className);
}

/**
 * ユーザーは動きの削減を要求していますか？
 * @returns ユーザーが動きの削減を要求したかどうか。
 */
export const isPrefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type StyleProperties = string & keyof FilterValueType<CSSStyleDeclaration, string>;
type Keyframe = Partial<Override<Record<StyleProperties, Numberish>, { offset: number }>>;
type Keyframes = Keyframe[];
type DimensionAxis = "height" | "width" | "both";
type MaybePromise<T> = T | Promise<T>;

type AnimateSizeOptions = Partial<{
	/** 開始高さを明示的に指定します（オプション）。 */
	startHeight: number;
	/** 終了高さを明示的に指定します（オプション）。 */
	endHeight: number;
	/** 開始幅を明示的に指定します（オプション）。 */
	startWidth: number;
	/** 終了幅を明示的に指定します（オプション）。 */
	endWidth: number;
	/** アニメーション時間。 */
	duration: number;
	/** アニメーションのイージング。デフォルト：スムーズなイーズアウト。 */
	easing: string;
	/** アニメーションさせる方向を明示的に指定します。 */
	specified: DimensionAxis;
	/** アニメーションで調整**しない**パディング/マージンの方向を指定します。 */
	withoutAdjustPadding: DimensionAxis;
	/** コールバック関数を変更した後、自動的に次のフレームを待ちます。 */
	nextTick: boolean;
	/** 最終的な要素のサイズを取得します。 */
	getSize: TwoD | Ref<TwoD | undefined>;
	/** 最終的な要素の矩形を取得します。 */
	getRect: Ref<DOMRect | undefined>;
	/** 開始スタイルを明示的に指定します（オプション）。 */
	startStyle: Keyframe;
	/** 終了スタイルを明示的に指定します（オプション）。 */
	endStyle: Keyframe;
	/** 最初は逆方向からスライドインします。 */
	startReverseSlideIn: boolean;
	/** 最後は逆方向へスライドアウトします。 */
	endReverseSlideIn: boolean;
	/** 要素の**唯一**の子要素の開始時の変位。 */
	startChildTranslate: Numberish;
	/** 要素の**唯一**の子要素の終了時の変位。 */
	endChildTranslate: Numberish;
	/** アニメーションの不具合を解消するために最初の一コマを抜きますか？子要素がある場合にのみ有効です。 */
	removeGlitchFrame: boolean;
	/** アニメーション再生中に他のアニメーションを追加し、同じ時間とイージングを使用します。 */
	attachAnimations: [Element, Keyframes][] | false;
	/** `overflow: clip;` を使用しませんか？ */
	noClipping: boolean;
}>;

/**
 * 幅/高さがautoの場合にアニメーションさせるための高度なフックジェネレータ関数。
 * @param element - HTML DOM要素。
 * @returns 最終的にアニメーションの非同期Promiseを返すジェネレータ関数。
 */
export async function* animateSizeGenerator(
	element: MaybeRef<Element | undefined>,
	{
		startHeight,
		endHeight,
		startWidth,
		endWidth,
		duration = 250,
		easing = eases.easeOutSmooth,
		specified = "both",
		withoutAdjustPadding,
		nextTick: awaitNextTick = true,
		getSize,
		getRect,
		startStyle = {},
		endStyle = {},
		startReverseSlideIn,
		endReverseSlideIn,
		startChildTranslate,
		endChildTranslate,
		removeGlitchFrame,
		attachAnimations,
		noClipping = false,
	}: AnimateSizeOptions = {},
): AsyncGenerator<void, Animation | void, boolean> {
	element = toValue(element);
	if (!element) return;
	if (isPrefersReducedMotion()) duration = 0;
	startHeight ??= element.clientHeight;
	startWidth ??= element.clientWidth;
	const hasChangeFunc = yield;
	if (hasChangeFunc && awaitNextTick) await nextTick();
	endHeight ??= element.clientHeight;
	endWidth ??= element.clientWidth;
	if (getSize)
		if (getSize instanceof Array) [getSize[0], getSize[1]] = [endWidth, endHeight];
		else getSize.value = [endWidth, endHeight];
	if (getRect)
		getRect.value = element.getBoundingClientRect();
	let isHeightChanged = specified === "height" || specified === "both",
		isWidthChanged = specified === "width" || specified === "both";
	if (startHeight === endHeight) isHeightChanged = false; // 動かす必要はありません。
	if (startWidth === endWidth) isWidthChanged = false;
	if (!isHeightChanged && !isWidthChanged) return;
	const keyframes = [{}, {}] as Keyframes;
	if (isHeightChanged) [keyframes[0].height, keyframes[1].height] = [startHeight + "px", endHeight + "px"];
	if (isWidthChanged) [keyframes[0].width, keyframes[1].width] = [startWidth + "px", endWidth + "px"];
	let setYPaddingIndex: number | undefined, setXPaddingIndex: number | undefined;
	if (startHeight === 0) setYPaddingIndex = 0;
	if (endHeight === 0) setYPaddingIndex = 1;
	if (startWidth === 0) setXPaddingIndex = 0;
	if (endWidth === 0) setXPaddingIndex = 1;
	const setXPadding = withoutAdjustPadding === undefined || withoutAdjustPadding === "height",
		setYPadding = withoutAdjustPadding === undefined || withoutAdjustPadding === "width";
	if (setXPadding && isHeightChanged && setYPaddingIndex !== undefined)
		Object.assign(keyframes[setYPaddingIndex], { paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 });
	if (setYPadding && isWidthChanged && setXPaddingIndex !== undefined)
		Object.assign(keyframes[setXPaddingIndex], { paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0 });
	const setTranslate = (pxes: number[]) => pxes.map(i => i + "px").join(" ");
	if (startReverseSlideIn)
		keyframes[0].translate = setTranslate([isWidthChanged ? endWidth : 0, isHeightChanged ? endHeight : 0]);
	if (endReverseSlideIn)
		keyframes[1].translate = setTranslate([isWidthChanged ? startWidth : 0, isHeightChanged ? startHeight : 0]);
	Object.assign(keyframes[0], startStyle);
	Object.assign(keyframes[1], endStyle);
	const animationOptions = { duration, easing };
	const htmlElement = element as HTMLElement;
	if (!noClipping) htmlElement.style.overflow = "clip";
	const result = element.animate(keyframes, animationOptions);
	if (!noClipping) result.addEventListener("finish", () => htmlElement.style.removeProperty("overflow"));
	if (startChildTranslate || endChildTranslate || attachAnimations) {
		const onlyChild = element.children[0]; // 唯一の子要素のみを取得します。
		if (onlyChild && element instanceof HTMLElement && removeGlitchFrame) {
			element.hidden = true;
			await nextAnimationTick();
			element.hidden = false;
		}
		if (onlyChild && (startChildTranslate || endChildTranslate)) onlyChild.animate([
			startChildTranslate ? { translate: startChildTranslate } : {},
			endChildTranslate ? { translate: endChildTranslate } : {},
		], animationOptions);
		if (attachAnimations) attachAnimations.forEach(group => group[0]?.animate(group[1], animationOptions));
	}
	return result.finished;
}

/**
 * 幅/高さがautoの場合にアニメーションさせます。
 * @param element - HTML DOM要素。
 * @param changeFunc - 幅/高さを変更するコールバック関数。
 * @param options - 設定オプション。
 * @returns アニメーションの非同期Promise。
 */
export async function animateSize(
	element: MaybeRef<Element | undefined>,
	changeFunc: (() => MaybePromise<void | unknown>) | undefined | null,
	options: AnimateSizeOptions = {},
): Promise<Animation | void> {
	const gen = animateSizeGenerator(element, options);
	gen.next();
	if (changeFunc) await changeFunc();
	const animation = await gen.next(!!changeFunc);
	return animation.value;
}

type SameOrDifferent<T> = T | undefined | [T | undefined, T | undefined];
type TransitionHook = (el: Element, done: () => void) => Promise<void>;

/**
 * `animateSize`関数の簡易版で、よりシンプルなアニメーションに適しています。
 * @param specified - アニメーションさせる方向を明示的に指定します。デフォルトは高さのアニメーションです。
 * @param duration - アニメーション時間を指定します。
 * @param easing - アニメーションのイージングを指定します。
 * @returns `onEnter` と `onLeave` の2つの関数を返します。
 */
export function simpleAnimateSize(specified: "width" | "height" = "height", duration?: SameOrDifferent<number>, easing?: SameOrDifferent<string>) {
	type Options = Parameters<typeof animateSize>[2];
	let enter: Options, leave: Options;
	if (specified === "width") {
		enter = { startWidth: 0 };
		leave = { endWidth: 0 };
	} else {
		enter = { startHeight: 0 };
		leave = { endHeight: 0 };
	}
	duration = duration instanceof Array ? duration : [duration, duration];
	easing = easing instanceof Array ? easing : [easing, easing];
	enter.duration = duration[0];
	leave.duration = duration[1];
	enter.easing = easing[0];
	leave.easing = easing[1];

	const onEnter: TransitionHook = async (el, done) => {
		await animateSize(el, null, enter);
		done();
	};
	const onLeave: TransitionHook = async (el, done) => {
		await animateSize(el, null, leave);
		done();
	};

	return [onEnter, onLeave];
}

export const STOP_TRANSITION_ID = "stop-transition";

/**
 * 新しい `CSSStyleSheet` インスタンスを使用し、それを削除するためのクリーンアップ関数を返します。
 *
 * @param css - ドキュメントに追加するCSS文字列。
 * @returns 呼び出されると、追加されたスタイルシートを `document.adoptedStyleSheets` から削除する関数。
 *
 * @example
 * ```typescript
 * const removeStyle = addStyle(css`.foo { color: red; }`);
 * await doSomething();
 * removeStyle();
 * ```
 */
function addStyle(css: string) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	document.adoptedStyleSheets.push(sheet);
	return () => { arrayRemoveAllItem(document.adoptedStyleSheets, sheet); };
}

/**
 * `<style>` 要素を注入し、すべての要素（疑似要素を含む）に `transition: none !important;` を設定することで、ページ上のすべてのCSSトランジションを一時的に無効にします。
 *
 * @returns 呼び出されると、注入された `<style>` 要素を削除してトランジションを復元するクリーンアップ関数。
 *
 * @remarks
 * この関数は、DOMの更新やUIの変更中に不要なトランジションを防ぐために使用できます。
 * ページがトランジション無効状態で放置されるのを避けるため、必ず返されたクリーンアップ関数を呼び出してください。
 *
 * @example
 * ```typescript
 * const restoreTransitions = stopTransition(); // トランジションを無効化！
 * // DOMの更新を実行...
 * restoreTransitions(); // トランジションを再開！
 * ```
 */
export function stopTransition({ includesViewTransitions = false }: {
	/** `view-transition-old` と `view-transition-new` も含めますか？ */
	includesViewTransitions?: boolean;
} = {}) {
	return addStyle(`
		*,
		::before,
		::after,
		::-webkit-progress-value {
			-webkit-transition: none !important;
			-moz-transition: none !important;
			-o-transition: none !important;
			-ms-transition: none !important;
			transition: none !important;
		}

		/* Chromiumはwebkitとmozを一緒に書くのを嫌います（一緒に書くとChromiumで異常が発生しますが、Firefoxでは発生しません）。 */
		::-moz-progress-bar {
			-moz-transition: none !important;
			transition: none !important;
		}

		${includesViewTransitions ? `
			::view-transition-old(root),
			::view-transition-new(root) {
				mix-blend-mode: normal;
				transition: none !important;
				animation: none !important;
			}

			::view-transition-old(*),
			::view-transition-new(*),
			::view-transition-old(::before),
			::view-transition-new(::before),
			::view-transition-old(::after),
			::view-transition-new(::after) {
				transition: none !important;
			}
		` : ""}
	`);
}

type ColorViewTransitionAnimationOption = Override<KeyframeAnimationOptions, {
	pseudoElement?: "::view-transition-new(root)" | "::view-transition-old(root)" | (string & {}) | null;
}>;

interface ColorViewTransitionAnimationFallbackDefaultOption extends ColorViewTransitionAnimationOption {
	/** トランジション中のカーソルポインターを設定します。 */
	cursor?: Cursor;
	/** トランジション全体を通して、他の静的CSSスタイルを追加します。 */
	staticStyle?: string;
}

/**
 * ページ全体にビュー・トランジション・アニメーションを追加します。
 * @param changeFunc - ページを変更するコールバック関数。
 * @param animations - アニメーションのキーフレームと各アニメーションオプションを含むタプルの配列。
 * @param defaultOptions - 各アニメーションオプションのデフォルト設定。トランジション中のカーソルポインターも設定できます。
 * @returns アニメーションの再生完了後に実行可能なデストラクタ関数。
 */
export async function startColorViewTransition(changeFunc: () => MaybePromise<void | unknown>, animations: [keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: ColorViewTransitionAnimationOption][], defaultOptions: ColorViewTransitionAnimationFallbackDefaultOption = {}) {
	if (!document.startViewTransition) {
		await changeFunc();
		return;
	}

	defaultOptions.duration ??= 300;
	defaultOptions.easing ??= eases.easeInOutSmooth;
	defaultOptions.pseudoElement ??= "::view-transition-new(root)";

	const restoreTransitions = stopTransition({ includesViewTransitions: true });
	const removeStyle = defaultOptions.staticStyle ? addStyle(defaultOptions.staticStyle) : undefined;

	try {
		if (defaultOptions.cursor) forceCursor(defaultOptions.cursor);
		const transition = document.startViewTransition(changeFunc);
		await transition.ready;

		await Promise.all(animations.map(async ([keyframes, options]) => {
			options = supplement(options ?? {}, defaultOptions);
			return await document.documentElement.animate(keyframes, options).finished;
		}));
	} finally {
		restoreTransitions();
		removeStyle?.();
		if (defaultOptions.cursor) forceCursor(null);
	}
}

/**
 * ブラウザが `document.startViewTransition` をサポートしている場合はそれを呼び出し、そうでなければコールバック関数を直接実行します。
 * @param callback - ページのトランジションをトリガーするコールバック関数。
 */
export async function startViewTransition(callback: () => MaybePromise<void>) {
	if (document.startViewTransition) await document.startViewTransition(callback).finished;
	else await callback();
}

let lastClickMouseEvent: MouseEvent | undefined;
try {
	if (typeof document !== "undefined")
		document?.addEventListener("click", e => lastClickMouseEvent = e, true);
} catch (error) {
	console.error("ERROR", "Client-side code (adding global event listeners) should not be run on the server. (Error catched in modules/theme/theme-cookie-binding.ts)");
	console.error("ERROR", error);
}

export function startCircleViewTransition(isSpread: boolean, changeFunc: () => MaybePromise<void | unknown>) {
	return new Promise<void>(resolve => {
		// It is difficult to get 100lvh (large viewport) height in JavaScript.
		const lvsEl = document.getElementById("large-viewport-size");
		const lvh = lvsEl?.offsetHeight ?? window.innerHeight, lvw = lvsEl?.offsetWidth ?? window.innerWidth;
		const { x, y } = lastClickMouseEvent ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
		const endRadius = Math.hypot(Math.max(x, lvw - x), Math.max(y, lvh - y));
		const clipPath = [
			`circle(0px at ${x}px ${y}px)`,
			`circle(${endRadius}px at ${x}px ${y}px)`,
		];
		startColorViewTransition(changeFunc, [
			[{
				clipPath: isSpread ? clipPath : clipPath.toReversed(),
			}, {
				pseudoElement: isSpread ? "::view-transition-new(root)" : "::view-transition-old(root)",
			}],
			[{
				zIndex: ["1", "1"],
			}, {
				pseudoElement: !isSpread ? "::view-transition-new(root)" : "::view-transition-old(root)",
			}],
			[{
				zIndex: ["calc(infinity)", "calc(infinity)"],
			}, {
				pseudoElement: isSpread ? "::view-transition-new(root)" : "::view-transition-old(root)",
			}],
		], { cursor: "progress" }).then(() => {
			resolve();
		});
	});
}

/**
 * 周期的に変化する乱数を取得します。
 * @param interval - 変化の周期。単位：ミリ秒。
 * @returns 周期的に変化する乱数。
 */
export function useDynamicRandom(interval: number): Readonly<Ref<number>>;
/**
 * 周期的に変化する乱数を取得します。
 * @param interval - 変化の周期。単位：ミリ秒。
 * @param min - 最小値を指定します。
 * @param max - 最大値を指定します。
 * @returns 周期的に変化する乱数。
 */
export function useDynamicRandom(interval: number, min: number, max: number): Readonly<Ref<number>>;
/**
 * 周期的に変化する乱数を取得します。
 * @param interval - 変化の周期。単位：ミリ秒。
 * @param min - 最小値を指定します（オプション）。
 * @param max - 最大値を指定します（オプション）。
 * @returns 周期的に変化する乱数。
 */
export function useDynamicRandom(interval: number, min?: number, max?: number) { // WARN: この関数はSSRをサポートしていないため、注意して使用してください。
	const initial = min != null && max != null ? (max - min) / 2 + min : 0.5;
	const random = ref(initial);
	const intervalId = ref<Timeout>();

	onMounted(() => {
		intervalId.value = setInterval(() => {
			random.value = Math.random();
			if (min != null && max != null) random.value = random.value * (max - min) + min;
		}, interval);
	});

	onUnmounted(() => {
		clearInterval(intervalId.value);
	});

	return readonly(random);
}
