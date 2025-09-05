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
	/** MinIOの画像プロバイダー名。本番環境ではminio-prod、それ以外ではminio-stgを使用します */  
	get minioImageProvider() {  
		const provider = import.meta.env.VITE_MINIO_IMAGES_PROVIDER as string;  
		if (!provider)  
			console.error("ERROR", "Server startup failed, the value of the environment variable MINIO_IMAGES_PROVIDER was not specified.");  
		if (provider === "minio-prod" || provider === "minio-stg")  
			return provider;  
		else  
			return "minio-stg";  
	},  
	/** MinIOエンドポイントURL */  
	get minioEndpoint() {  
		const DEFAULT_MINIO_ENDPOINT = "https://localhost:9000/";  
		try {  
			const minioEndpointInput = import.meta.env.VITE_MINIO_ENDPOINT;  
			if (!minioEndpointInput) {  
				console.error("ERROR", "Server startup failed, the value of the environment variable MINIO_ENDPOINT was not specified.");  
				return DEFAULT_MINIO_ENDPOINT;  
			}  
			const minioEndpoint = new URL(minioEndpointInput.trim());  
			return minioEndpoint.href;  
		} catch (error) {  
			console.error("ERROR", "System startup failed, environment variable MINIO_ENDPOINT parsing failed:", error);  
			return DEFAULT_MINIO_ENDPOINT;  
		}  
	},  
	/** MinIOアクセスキー */  
	get minioAccessKey() {  
		return import.meta.env.VITE_MINIO_ACCESS_KEY as string;  
	},  
	/** MinIOシークレットキー */  
	get minioSecretKey() {  
		return import.meta.env.VITE_MINIO_SECRET_KEY as string;  
	},  
	/** MinIOバケット名 */  
	get minioBucket() {  
		return import.meta.env.VITE_MINIO_BUCKET || "kirakira-videos";  
	},
	/** Cloudflare MPD 動画マニフェストURLテンプレート。"{videoId}"部分は実際の動画IDに置き換えられます。本番とテストで異なるURLを使用します */
	get cloudflareStreamVideoMpdUrlTemplate() {
		const DEFAULT_CLOUDFLARE_STREAM_SUBDOMAIN = "https://customer-o9xrvgnj5fidyfm4.cloudflarestream.com/";
		try {
			const subdomain = import.meta.env.VITE_CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
			if (!subdomain) {
				console.error("ERROR", "Server startup failed,  the value of the environment variable BACKEND_URL was not specified.");
				return DEFAULT_CLOUDFLARE_STREAM_SUBDOMAIN;
			}
			const subdomainUri = new URL(subdomain);
			const subdomainUriHref = subdomainUri.href;
			if (!subdomainUriHref) {
				console.error("ERROR", "System startup failed, the parsed result of the environment variable BACKEND_URL is empty.");
				return DEFAULT_CLOUDFLARE_STREAM_SUBDOMAIN;
			}

			return `${subdomainUriHref}{videoId}/manifest/video.mpd`;
		} catch (error) {
			console.error("ERROR", "System startup failed, environment variable BACKEND_URL parsing failed:", error);
			return DEFAULT_CLOUDFLARE_STREAM_SUBDOMAIN;
		}
	},
};
