/** HTTP Error Code */
type KirakiraErrorCode = 233 | 301 | 403 | 404 | 500 | 502 | 503 | 601;

/**
 * Navigate To Error Page
 * // DELETE: エラーページに直接ジャンプするのはベストプラクティスではない可能性があるため、Nuxtのエラー処理メカニズムを使用して代替案を探します。
 * @param errorCode
 */
export async function navigateToErrorPage(errorCode: KirakiraErrorCode) {
	console.log(`/error/${errorCode}`);
	return await navigate(`/error/${errorCode}`, { redirectCode: errorCode });
}
