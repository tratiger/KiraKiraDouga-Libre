/**
 * Cloudflare形式の有効期限日時文字列を生成します。例: "2024-03-17T13:47:28Z"
 * @param expiresIn 有効期限（秒単位）。
 * @returns Cloudflare形式の有効期限日時文字列
 */
export function getCloudflareRFC3339ExpiryDateTime(expiresIn: number): string {
	return (new Date((new Date()).getTime() + expiresIn * 1000)).toISOString().replace(/\.\d{3}/, '')
}
