type RequestObject = Record<string, string>;
type HeadersObject = Record<string, string>;

/**
 * タイムアウト付きのfetch
 * @param resource - リクエストのターゲット
 * @param options - リクエストに付随する内容
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果
 */
async function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 30000) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(resource, {
		...options,
		signal: controller.signal,
	});

	clearTimeout(id);

	if (!response.ok)
		throw new Error(`HTTP error! Status: ${response.status}`);

	return response;
}

/**
 * GETリクエストを送信
 * @param url - リクエストのURL
 * @param requestOptions - リクエストに付随するリクエストヘッダー
 * @param headerOptions - リクエストに付随するヘッダー内容
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果
 */
export async function GET(url: string, requestOptions: RequestObject = {}, headerOptions: HeadersObject = {}, timeout?: number): Promise<unknown> {
	try {
		const response = await fetchWithTimeout(url, {
			method: "GET",
			...requestOptions,
			headers: headerOptions,
		}, timeout);
		return response.json();
	} catch (error) {
		console.error("ERROR", `something wrong in 'GET', URL: ${url}`, error); // TODO: Remove Console Output?
		throw error;
	}
}

/**
 * POSTリクエストを送信
 * @param url - リクエストのURL
 * @param body - リクエストのボディ内容
 * @param requestOptions - リクエストに付随するリクエストヘッダー
 * @param headerOptions - リクエストに付随するヘッダー内容
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果
 */
export async function POST(url: string, body: unknown, requestOptions: RequestObject = {}, headerOptions: HeadersObject = {}, timeout?: number): Promise<unknown> {
	try {
		const response = await fetchWithTimeout(url, {
			method: "POST",
			...requestOptions,
			headers: {
				"Content-Type": "application/json",
				...headerOptions,
			},
			body: JSON.stringify(body),
		}, timeout);
		return response.json();
	} catch (error) {
		console.error("ERROR", `something wrong in 'POST', URL: ${url}`, error); // TODO: Remove Console Output?
		throw error;
	}
}

/**
 * DELETEリクエストを送信
 * @param url - リクエストのURL
 * @param body - リクエストのボディ内容
 * @param requestOptions - リクエストに付随するリクエストヘッダー
 * @param headerOptions - リクエストに付随するヘッダー内容
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果
 */
export async function DELETE(url: string, body: unknown, requestOptions: RequestObject = {}, headerOptions: HeadersObject = {}, timeout?: number): Promise<unknown> {
	try {
		const response = await fetchWithTimeout(url, {
			method: "DELETE",
			...requestOptions,
			headers: {
				"Content-Type": "application/json",
				...headerOptions,
			},
			body: JSON.stringify(body),
		}, timeout);
		return response.json();
	} catch (error) {
		console.error("ERROR", `something wrong in 'DELETE', URL: ${url}`, error); // TODO: Remove Console Output?
		throw error;
	}
}

/**
 * PUTリクエストを送信してCloudflare R2にファイルをアップロード
 * @param signedUrl - R2がファイルをアップロードするために使用する署名付きURL
 * @param body - アップロードするファイルのBlob
 * @param contentType - リクエストペイロードのデータのメディアタイプ、例：'application/json', 'image/png' など。詳細なContent-Typeについては、このファイルの最後のコメントを参照してください
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果、アップロード成功はtrue、それ以外はfalse
 */
export async function uploadFile2R2(signedUrl: string, body: Blob, contentType: string, timeout: number = 30000): Promise<void> {
	try {
		await fetchWithTimeout(signedUrl, {
			method: "PUT",
			mode: "cors",
			headers: {
				"Content-Type": contentType,
				"Access-Control-Allow-Origin": "*",
			},
			body,
		}, timeout);
	} catch (error) {
		console.error("ERROR", `something wrong in 'uploadFile2R2', URL: ${signedUrl}`, error); // TODO: Remove Console Output?
		throw error;
	}
}

// 以下は典型的なContent-Type HTTPヘッダーです
//
// テキスト形式:
// text/html: HTMLドキュメント用。
// text/plain: プレーンテキストファイル。
// text/css: CSSスタイルシート。
// text/javascript: JavaScriptコード。
//
// 画像形式:
// image/jpeg: JPEG画像。
// image/png: PNG画像。
// image/gif: GIF画像。
// image/svg+xml: SVGベクター画像。
//
// アプリケーションとドキュメント形式:
// application/json: JSONデータ形式。
// application/xml: XMLデータ形式。
// application/pdf: PDFドキュメント。
// application/msword: Microsoft Wordドキュメント。
// application/vnd.ms-excel: Microsoft Excelドキュメント。
//
// 音声と動画形式:
// audio/mpeg: MP3音声。
// audio/ogg: Ogg音声。
// video/mp4: MP4動画。
// video/x-msvideo: AVI動画。
//
// その他の形式:
// application/octet-stream: 任意のバイナリデータ。
// multipart/form-data: フォームデータ用、特にファイルアップロードを含む場合。

/**
 * POSTリクエストを送信してCloudflare Imageにファイルをアップロード
 * @param fileName - アップロードするファイル名
 * @param signedUrl - R2がファイルをアップロードするために使用する署名付きURL
 * @param body - アップロードするファイルのBlob
 * @param timeout - リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
 * @returns リクエスト結果、アップロード成功はtrue、それ以外はfalse
 */
export async function uploadFile2CloudflareImages(fileName: string, signedUrl: string, body: Blob, timeout: number = 30000): Promise<void> {
	try {
		const formData = new FormData();
		formData.append("file", body);
		await fetchWithTimeout(signedUrl, {
			method: "POST",
			mode: "cors",
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: formData,
		}, timeout);
	} catch (error) {
		console.error("ERROR", `Cloudflare Imageへのファイルアップロード中にエラーが発生しました, URL: ${signedUrl}`, error); // TODO: Remove Console Output?
		throw error;
	}
}
