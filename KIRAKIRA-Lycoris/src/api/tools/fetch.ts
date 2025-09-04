type RequestObject = Record<string, string>;
type HeadersObject = Record<string, string>;

/**
 * タイムアウト付きのfetch
 * @param resource リクエストのターゲット
 * @param options リクエストに付随する内容
 * @param timeout リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
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
 * GETリクエストを送信する
 * @param url リクエストのURL
 * @param requestOptions リクエストに付随するリクエストヘッダー
 * @param headerOptions リクエストに付随するヘッダー内容
 * @param timeout リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
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
 * POSTリクエストを送信する
 * @param url リクエストのURL
 * @param body リクエストのbody内容
 * @param requestOptions リクエストに付随するリクエストヘッダー
 * @param headerOptions リクエストに付随するヘッダー内容
 * @param timeout リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
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
		if (import.meta.env.PROD)
			throw error;
	}
}

/**
 * DELETEリクエストを送信する
 * @param url リクエストのURL
 * @param body リクエストのbody内容
 * @param requestOptions リクエストに付随するリクエストヘッダー
 * @param headerOptions リクエストに付随するヘッダー内容
 * @param timeout リクエストのタイムアウト時間（ミリ秒）、デフォルト：30000ms
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
