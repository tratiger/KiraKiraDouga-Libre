import { DELETE, GET, POST, uploadFile2CloudflareImages } from "../Common";
import type { ApprovePendingReviewVideoRequestDto, ApprovePendingReviewVideoResponseDto, CheckVideoExistRequestDto, CheckVideoExistResponseDto, DeleteVideoRequestDto, DeleteVideoResponseDto, GetVideoByKvidRequestDto, GetVideoByKvidResponseDto, GetVideoByUidRequestDto, GetVideoByUidResponseDto, GetVideoCoverUploadSignedUrlResponseDto, PendingReviewVideoResponseDto, SearchVideoByVideoTagIdRequestDto, SearchVideoByVideoTagIdResponseDto, ThumbVideoResponseDto, UploadVideoRequestDto, UploadVideoResponseDto, InitiateVideoUploadRequestDto, InitiateVideoUploadResponseDto, GetMultipartSignedUrlRequestDto, GetMultipartSignedUrlResponseDto, CompleteVideoUploadRequestDto, CompleteVideoUploadResponseDto, AbortVideoUploadRequestDto, AbortVideoUploadResponseDto } from "./VideoControllerDto";

const BACK_END_URI = environment.backendUri;
const VIDEO_API_URI = `${BACK_END_URI}video`;

/**
 * ホームページに表示される動画を取得します
 * @returns 動画カードの表示に必要な返却パラメータ
 */
export const getHomePageThumbVideo = async (headerCookie: { cookie?: string | undefined }): Promise<ThumbVideoResponseDto> => {
	// NOTE: SSR時にクライアント側のクッキーをバックエンドAPIに渡すために { headers: headerCookie } を使用します。
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	const { data: result } = await useFetch<ThumbVideoResponseDto>(`${VIDEO_API_URI}/home`, { headers: headerCookie, credentials: "include" });
	if (result.value)
		return result.value;
	else
		return { success: false, videosCount: 0, videos: [], message: "ホームページの動画取得に失敗しました" };
};

/**
 * 動画ID (KVID) に基づいて動画が存在するかどうかを確認します
 * @param CheckVideoExistRequest - 動画ID (KVID)
 * @returns 動画が存在するかどうかのレスポンス
 */
export const checkVideoExistByKvid = async (CheckVideoExistRequest: CheckVideoExistRequestDto): Promise<CheckVideoExistResponseDto> => {
	if (CheckVideoExistRequest && CheckVideoExistRequest.videoId) {
		const { data: result } = await useFetch<CheckVideoExistResponseDto>(`${VIDEO_API_URI}/exists?videoId=${CheckVideoExistRequest.videoId}`, { credentials: "include" });
		if (result.value)
			return result.value;
		else
			return { success: false, message: "動画が存在しません", exist: false };
	} else
		return { success: false, message: "KVIDが提供されていません", exist: false };
};

/**
 * 動画ID (KVID) に基づいて動画のデータを取得します
 * @param getVideoByKvidRequest - 動画IDから動画を取得するためのリクエストパラメータ
 * @param headerCookie - SSR時にクライアントからリクエストされたヘッダーのCookie部分。SSR時にバックエンドAPIに渡されます
 * @returns 動画ページに必要なレスポンス
 */
export const getVideoByKvid = async (getVideoByKvidRequest: GetVideoByKvidRequestDto, headerCookie?: { cookie?: string | undefined }): Promise<GetVideoByKvidResponseDto> => {
	if (getVideoByKvidRequest && getVideoByKvidRequest.videoId) {
		// NOTE: SSR時にクライアント側のクッキーをバックエンドAPIに渡すために { headers: headerCookie } を使用します。
		// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
		const { data: result } = await useFetch<GetVideoByKvidResponseDto>(`${VIDEO_API_URI}?videoId=${getVideoByKvidRequest.videoId}`, { headers: headerCookie, credentials: "include" });
		if (result.value)
			return result.value;
		else
			return { success: false, message: "動画の取得に失敗しました", isBlockedByOther: false, isBlocked: false, isHidden: false };
	} else
		return { success: false, message: "KVIDが提供されていません", isBlockedByOther: false, isBlocked: false, isHidden: false };
};

/**
 * UIDに基づいてユーザーがアップロードした動画を取得します
 * @param getVideoByUidRequest - UIDに基づいてユーザーがアップロードした動画を取得するためのリクエストパラメータ
 * @returns UIDに基づいてユーザーがアップロードした動画を取得したリクエストのレスポンス結果
 */
export const getVideoByUid = async (getVideoByUidRequest: GetVideoByUidRequestDto): Promise<GetVideoByUidResponseDto> => {
	if (getVideoByUidRequest && getVideoByUidRequest.uid) {
		const { data: result } = await useFetch<GetVideoByUidResponseDto>(`${VIDEO_API_URI}/user?uid=${getVideoByUidRequest.uid}`);
		if (result.value)
			return result.value;
		else
			return { success: false, message: "ユーザーのアップロード動画の取得に失敗しました", videosCount: 0, videos: [], isBlockedByOther: false, isBlocked: false, isHidden: false };
	} else
		return { success: false, message: "UIDが提供されていません", videosCount: 0, videos: [], isBlockedByOther: false, isBlocked: false, isHidden: false };
};

/**
 * キーワードに基づいて動画を検索します
 * @param searchVideoByKeywordRequest - キーワードに基づいて動画を検索するためのリクエストパラメータ
 * @returns キーワードに基づいて動画を検索したリクエストのレスポンス結果
 */
export const searchVideoByKeyword = async (searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto): Promise<SearchVideoByKeywordResponseDto> => {
	if (searchVideoByKeywordRequest && searchVideoByKeywordRequest.keyword) {
		const { data: result } = await useFetch<SearchVideoByKeywordResponseDto>(`${VIDEO_API_URI}/search?keyword=${searchVideoByKeywordRequest.keyword}`);
		if (result.value)
			return result.value;
		else
			return { success: false, message: "キーワードによる動画検索に失敗しました", videosCount: 0, videos: [] };
	} else
		return { success: false, message: "キーワードが提供されていません", videosCount: 0, videos: [] };
};

/**
 * TAG IDリストに基づいて動画を検索します
 * @param searchVideoByVideoTagIdRequest - TAG IDリストに基づいて動画を検索するためのリクエストパラメータ
 * @returns TAG IDリストに基づいて動画を検索したリクエストのレスポンス結果
 */
export const searchVideoByTagIds = async (searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto): Promise<SearchVideoByVideoTagIdResponseDto> => {
	if (searchVideoByVideoTagIdRequest && searchVideoByVideoTagIdRequest.tagId) {
		const { data: result } = await useFetch<SearchVideoByVideoTagIdResponseDto>(`${VIDEO_API_URI}/search/tag`, {
			method: "POST",
			body: { tagId: searchVideoByVideoTagIdRequest.tagId },
		});
		if (result.value)
			return result.value;
		else
			return { success: false, message: "TAG IDによる動画検索に失敗しました", videosCount: 0, videos: [] };
	} else
		return { success: false, message: "TAG IDが提供されていません", videosCount: 0, videos: [] };
};

/**
 * MinIOにファイルをマルチパートアップロードします
 */
export class MinioFileUploader {
	step: "pending" | "initiating" | "uploading" | "completing" | "success" | "error" | "aborting" = "pending";
	process: Promise<string>;
	isUploadingVideo: Ref<boolean>;
	private file: File;
	private progress: Ref<number>;
	private uploadId?: string;
	private objectKey?: string;
	private abortController: AbortController;

	constructor(file: File, progress: Ref<number>, isUploadingVideo: Ref<boolean>) {
		if (!file) {
			this.step = "error";
			useToast(t.toast.upload_file_not_found, "error");
			throw new Error(t.toast.upload_file_not_found);
		}
		this.file = file;
		this.progress = progress;
		this.isUploadingVideo = isUploadingVideo;
		this.abortController = new AbortController();
		this.process = this.start();
	}

	private async start(): Promise<string> {
		try {
			this.step = "initiating";
			this.isUploadingVideo.value = true;

			// 1. マルチパートアップロードを開始
			const initiateResult = await initiateVideoUpload({ fileName: this.file.name });
			if (!initiateResult.success || !initiateResult.result) {
				throw new Error(initiateResult.message || "アップロードの開始に失敗しました。");
			}
			this.uploadId = initiateResult.result.uploadId;
			this.objectKey = initiateResult.result.objectKey;

			// 2. ファイルをチャンクに分割してアップロード
			this.step = "uploading";
			const uploadedParts = await this.uploadParts();

			// 3. アップロードを完了
			this.step = "completing";
			const completeResult = await completeVideoUpload({
				objectKey: this.objectKey,
				uploadId: this.uploadId,
				parts: uploadedParts,
			});
			if (!completeResult.success) {
				throw new Error(completeResult.message || "アップロードの完了に失敗しました。");
			}

			this.step = "success";
			this.isUploadingVideo.value = false;
			this.progress.value = 100;
			return this.objectKey; // 成功したらオブジェクトキーを返す
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.info("Upload aborted by user.");
				this.step = "error";
			} else {
				console.error("ERROR", "Upload failed:", error);
				this.step = "error";
				this.isUploadingVideo.value = false;
				// エラーが発生した場合、中断処理を試みる
				if (this.uploadId && this.objectKey) {
					await this.abort();
				}
			}
			throw error;
		}
	}

	private async uploadParts(): Promise<{ ETag: string; PartNumber: number }[]> {
		const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
		const totalChunks = Math.ceil(this.file.size / CHUNK_SIZE);
		const uploadedParts: { ETag: string; PartNumber: number }[] = [];
		let uploadedSize = 0;

		for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
			if (this.abortController.signal.aborted) throw new Error("Upload aborted");

			const start = (partNumber - 1) * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, this.file.size);
			const chunk = this.file.slice(start, end);

			const urlResult = await getMultipartSignedUrl({
				objectKey: this.objectKey!,
				uploadId: this.uploadId!,
				partNumber: partNumber,
			});

			if (!urlResult.success || !urlResult.result) {
				throw new Error(`パート${partNumber}のURL取得に失敗しました: ${urlResult.message}`);
			}

			const signedUrl = urlResult.result.signedUrl;
			const response = await fetch(signedUrl, {
				method: 'PUT',
				body: chunk,
				signal: this.abortController.signal,
			});

			if (!response.ok) {
				throw new Error(`パート${partNumber}のアップロードに失敗しました。ステータス: ${response.status}`);
			}

			const etag = response.headers.get('ETag');
			if (!etag) {
				throw new Error(`パート${partNumber}のETagが取得できませんでした。`);
			}

			uploadedParts.push({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber });
			uploadedSize += chunk.size;
			this.progress.value = (uploadedSize / this.file.size) * 100;
		}

		return uploadedParts;
	}

	/**
	 * アップロードを中断します
	 */
	async abort() {
		this.abortController.abort();
		this.step = "aborting";
		this.isUploadingVideo.value = false;
		if (this.uploadId && this.objectKey) {
			await abortVideoUpload({ uploadId: this.uploadId, objectKey: this.objectKey });
			console.info("Abort request sent to server.");
		}
	}
}

/**
 * マルチパートアップロードを開始
 */
export async function initiateVideoUpload(initiateVideoUploadRequest: InitiateVideoUploadRequestDto): Promise<InitiateVideoUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/initiate`, initiateVideoUploadRequest, { credentials: "include" }) as InitiateVideoUploadResponseDto;
}

/**
 * パートアップロード用の署名付きURLを取得
 */
export async function getMultipartSignedUrl(getMultipartSignedUrlRequest: GetMultipartSignedUrlRequestDto): Promise<GetMultipartSignedUrlResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/part-url`, getMultipartSignedUrlRequest, { credentials: "include" }) as GetMultipartSignedUrlResponseDto;
}

/**
 * マルチパートアップロードを完了
 */
export async function completeVideoUpload(completeVideoUploadRequest: CompleteVideoUploadRequestDto): Promise<CompleteVideoUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/complete`, completeVideoUploadRequest, { credentials: "include" }) as CompleteVideoUploadResponseDto;
}

/**
 * マルチパートアップロードを中断
 */
export async function abortVideoUpload(abortVideoUploadRequest: AbortVideoUploadRequestDto): Promise<AbortVideoUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/abort`, abortVideoUploadRequest, { credentials: "include" }) as AbortVideoUploadResponseDto;
}

/**
 * 動画カバー画像アップロード用の署名付きURLを取得します。アップロードは60秒に制限されています
 * @returns 動画カバー画像アップロード用の署名付きURLリクエストのレスポンス
 */
export async function getVideoCoverUploadSignedUrl(): Promise<GetVideoCoverUploadSignedUrlResponseDto> {
	return (await GET(`${VIDEO_API_URI}/cover/preUpload`, { credentials: "include" })) as GetVideoCoverUploadSignedUrlResponseDto;
}

/**
 * 署名付きURL経由で動画カバー画像をアップロードします
 * @param fileName - ファイル名
 * @param videoCoverBlobData - Blobでエンコードされた動画カバーファイル
 * @param signedUrl - 署名付きURL
 * @returns boolean アップロード結果
 */
export async function uploadVideoCover(fileName: string, videoCoverBlobData: Blob, signedUrl: string): Promise<boolean> {
	try {
		// MinIOへのアップロードはPUTリクエストを使用します
		await fetch(signedUrl, {
			method: 'PUT',
			body: videoCoverBlobData,
			headers: {
				'Content-Type': videoCoverBlobData.type,
			},
		});
		return true;
	} catch (error) {
		console.error("動画カバーのアップロードに失敗しました。エラー情報：", error, { videoCoverBlobData, signedUrl });
		return false;
	}
}

/**
 * アップロードが完了した動画を提出します
 * @param uploadVideoRequest - 動画データ
 * @returns 動画アップロードのリクエストレスポンス
 */
export async function commitVideo(uploadVideoRequest: UploadVideoRequestDto): Promise<UploadVideoResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload`, uploadVideoRequest, { credentials: "include" }) as UploadVideoResponseDto;
}

/**
 * 動画を削除します
 * @param deleteVideoRequest - 動画削除のリクエストペイロード
 * @returns 動画削除のリクエストレスポンス
 */
export async function deleteVideo(deleteVideoRequest: DeleteVideoRequestDto): Promise<DeleteVideoResponseDto> {
	return await DELETE(`${VIDEO_API_URI}/delete`, deleteVideoRequest, { credentials: "include" }) as DeleteVideoResponseDto;
}

/**
 * 審査待ち動画リストを取得します
 * @param headerCookie  - SSR時にクライアントからリクエストされたヘッダーのCookie部分。SSR時にバックエンドAPIに渡されます
 * @returns 審査待ち動画リスト取得のリクエストレスポンス
 */
export const getPendingReviewVideo = async (headerCookie: { cookie?: string | undefined }): Promise<PendingReviewVideoResponseDto> => {
	// NOTE: SSR時にクライアント側のクッキーをバックエンドAPIに渡すために { headers: headerCookie } を使用します。
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	const { data: result } = await useFetch(`${VIDEO_API_URI}/pending`, { headers: headerCookie, credentials: "include" });
	return result.value as PendingReviewVideoResponseDto;
};

/**
 * 審査待ち動画を承認します
 * @param approvePendingReviewVideoRequest - 審査待ち動画承認のリクエストペイロード
 * @returns 審査待ち動画承認のリクエストレスポンス
 */
export async function approvePendingReviewVideo(approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto): Promise<ApprovePendingReviewVideoResponseDto> {
	return await POST(`${VIDEO_API_URI}/pending/approved`, approvePendingReviewVideoRequest, { credentials: "include" }) as ApprovePendingReviewVideoResponseDto;
}
