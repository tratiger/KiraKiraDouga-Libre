/**
 * データ総数と1ページあたりの表示件数に基づいて総ページ数を計算します。
 * @param dataCount データ総数
 * @param pageSize 1ページあたりの表示件数
 * @returns 総ページ数の結果
 */
export function getPageCountByDataCount(dataCount: number, pageSize: number): number {
	return Math.max(1, Math.ceil(dataCount / pageSize));
}
