/**
 * モバイル端末かどうかを判定します。
 * @returns モバイル端末かどうか。
 * @see https://www.ruanyifeng.com/blog/2021/09/detecting-mobile-browser.html
 */
export function isMobile() {
	if (environment.server) return globalThis.orientation !== undefined;
	return "ontouchstart" in document.documentElement;
}

/**
 * ページの幅を使用してデバイスの種類を判定します。
 * @returns デバイスの種類。
 */
export function getResponsiveDevice() {
	if (environment.server) return "computer";
	else if (window.innerWidth <= 639) return "mobile";
	else if (window.innerWidth <= 991) return "tablet";
	else return "computer";
}

/**
 * ポインターイベントがタッチではなくマウスによってトリガーされたかどうかを判断します。
 * @param e - ポインタークリックイベント。
 * @returns ポインターイベントがタッチではなくマウスによってトリガーされたか？
 */
export function isMouse(e?: PointerEvent) {
	return e?.pointerType !== "touch";
}

/**
 * 現在のオペレーティングシステムを取得します。
 * @returns 現在のオペレーティングシステム。
 */
export function getPlatform() {
	if (environment.server) return;
	const { platform } = navigator;
	if (/(Mac|iPhone|iPod|iPad)/i.test(platform)) return "Apple";
	else if (/(Linux)/i.test(platform)) return "Linux";
	else if (/(Win)/i.test(platform)) return "Windows";
}
