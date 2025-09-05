/**
 * 環境マクロ定義変数。
 */
export const environment = {
	/** サーバーサイドレンダリングですか？ */
	get server() { return import.meta.server; },
	/** クライアントサイドレンダリングですか？ */
	get client() { return import.meta.client; },
	/** 本番環境ですか？ */
	get production() { return process.env.NODE_ENV === "production"; },
	/** 開発環境ですか？ */
	get development() { return process.env.NODE_ENV === "development"; },
	/** バックエンドAPIのURIアドレス */
	get backendUri() {
		const DEFAULT_BACKEND_URI = "https://localhost:9999/";
		try {
			const backendUriInput = import.meta.env.VITE_BACKEND_URI;
			if (!backendUriInput) {
				console.error("ERROR", "Server startup failed,  the value of the environment variable BACKEND_URL was not specified.");
				return DEFAULT_BACKEND_URI;
			}
			const backendUri = new URL(backendUriInput.trim());
			const backendUriHref = backendUri.href;
			if (!backendUriHref) {
				console.error("ERROR", "System startup failed, the parsed result of the environment variable BACKEND_URL is empty.");
				return DEFAULT_BACKEND_URI;
			}
			return backendUriHref;
		} catch (error) {
			console.error("ERROR", "System startup failed, environment variable BACKEND_URL parsing failed:", error);
			return DEFAULT_BACKEND_URI;
		}
	},
};
