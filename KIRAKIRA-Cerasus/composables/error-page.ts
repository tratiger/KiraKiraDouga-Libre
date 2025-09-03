/** HTTP Error Code */
type KirakiraErrorCode = 233 | 301 | 403 | 404 | 500 | 502 | 503 | 601;

/**
 * Navigate To Error Page
 * // DELETE: 直接跳转至错误页可能并非最佳实践，寻找使用 Nuxt 的错误处理机制来替代的方案。
 * @param errorCode
 */
export async function navigateToErrorPage(errorCode: KirakiraErrorCode) {
	console.log(`/error/${errorCode}`);
	return await navigate(`/error/${errorCode}`, { redirectCode: errorCode });
}
