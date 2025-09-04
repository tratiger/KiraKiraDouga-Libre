/**
 * URLの後に続くクエリパラメータを生成する
 * @param obj クエリパラメータ
 * @returns URLの後に続くクエリパラメータ
 */
export function getUrlQuery(obj: Record<string, unknown>): string {
	// クエリパラメータを構築する
	const params = new URLSearchParams();

	Object.entries(obj).forEach(([key, value]) => {
		if (value !== undefined && value !== null)
			params.append(key, String(value));
	});

	return `?${params.toString()}`;
}
