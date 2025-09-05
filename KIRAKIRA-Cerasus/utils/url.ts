/**
 * MinIOのオブジェクトキーから動画の完全な公開URLを生成します。
 * @param objectKey - MinIO内の動画オブジェクトキー。
 * @returns 動画の完全な公開URL。
 */
export function getMinioVideoUrl(objectKey: string): string {
	if (!objectKey) {
		useToast(t.toast.video_manifest_file_generate_failed, "error");
		console.error("ERROR", "動画URLの生成に失敗しました、オブジェクトキーが空です。");
		return "";
	}

	try {
		const config = useRuntimeConfig();
		const baseUrl = config.public.minioPublicUrl as string;
		const bucket = 'videos'; // 動画は 'videos' バケットにあると仮定

		if (!baseUrl) {
			console.error("ERROR", "MINIO_PUBLIC_URLが設定されていません。");
			return "";
		}

		// URLの末尾にスラッシュがあるか確認し、なければ追加する
		const trailingSlash = baseUrl.endsWith('/') ? '' : '/';
		return `${baseUrl}${trailingSlash}${bucket}/${objectKey}`;
	} catch (error) {
		useToast(t.toast.video_manifest_file_generate_failed, "error");
		console.error("ERROR", "動画URLの生成中にエラーが発生しました:", error);
		return "";
	}
}
