/**
 * 現在の環境に応じて正しいバックエンドアドレスを返す
 * @returns 正しいバックエンドアドレス。
 */
export default function getCorrectUri(): string {
	/**
	 * 環境変数 VITE_BACKEND_URI の値を読み取り、バックエンドAPIのURIとして使用する
	 * VITE_BACKEND_URI の値が none の場合、空文字列を返し、KIRAKRIA-Lycorisはバックエンドなしモードで起動する
	 */
	try {
		const backendUriInput = import.meta.env.VITE_BACKEND_URI;

		if (!backendUriInput) {
			console.error("ERROR", "Server startup failed, the value of the environment variable VITE_BACKEND_URI was not specified.");
			return "";
		}

		if (backendUriInput === "none")
			return "";

		const backendUri = new URL(backendUriInput.trim());
		const backendUriHref = backendUri.href;
		if (!backendUriHref) {
			console.error("ERROR", "System startup failed, the parsed result of the environment variable VITE_BACKEND_URI is empty.");
			return "";
		}

		return backendUriHref;
	} catch (error) {
		console.error("ERROR", "System startup failed, environment variable VITE_BACKEND_URI parsing failed: ", error);
		return "";
	}
}

export const backendUri = getCorrectUri(); // バックエンドAPI URI
export const noBackend = !backendUri; // バックエンドなしモードかどうか
