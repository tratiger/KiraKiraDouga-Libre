/**
 * MinIOのオブジェクトキーから完全な公開URLを生成するためのコンポーザブル。
 * @returns オブジェクトキーを受け取り、完全なURLを返す関数。
 */
export function useMinioUrl() {
	const config = useRuntimeConfig();
	const baseUrl = config.public.minioPublicUrl;

	/**
	 * オブジェクトキーとバケット名から完全なURLを構築します。
	 * @param bucket - オブジェクトが保存されているバケット名。
	 * @param objectKey - MinIO内のオブジェクトキー。
	 * @returns 完全な公開URL。
	 */
	const getUrl = (bucket: string, objectKey: string | undefined): string | undefined => {
		if (!objectKey) {
			return undefined;
		}
		// URLの末尾にスラッシュがあるか確認し、なければ追加する
		const trailingSlash = baseUrl.endsWith('/') ? '' : '/';
		return `${baseUrl}${trailingSlash}${bucket}/${objectKey}`;
	};

	return {
		getUrl,
	};
}
