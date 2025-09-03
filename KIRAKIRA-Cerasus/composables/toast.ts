/**
 * トーストメッセージイベント。
 */
export interface ToastEvent {
	/** メッセージテキスト。 */
	message: string;
	/** イベントレベル。アイコンと色を決定します。 */
	severity: "success" | "warning" | "error" | "info";
	/** メッセージの表示時間。 */
	duration?: number;
}

/**
 * トーストにメッセージを送信します。
 * @param message - メッセージテキスト。
 * @param severity - イベントレベル。アイコンと色を決定します。
 * @param duration - メッセージの表示時間（ミリ秒）。
 */
export function useToast(message: string, severity: ToastEvent["severity"] = "success", duration?: number) {
	useEvent("app:toast", { message, severity, duration });
}

/**
 * トーストリストのすべての内容をクリアします。
 */
export function clearAllToast() {
	useEvent("app:clearAllToast");
}
