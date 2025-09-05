import { DELETE, GET, POST } from "../Common";
import type {
	ApprovePendingReviewVideoRequestDto,
	ApprovePendingReviewVideoResponseDto,
	CheckVideoExistRequestDto,
	CheckVideoExistResponseDto,
	DeleteVideoRequestDto,
	DeleteVideoResponseDto,
	GetVideoByKvidRequestDto,
	GetVideoByKvidResponseDto,
	GetVideoByUidRequestDto,
	GetVideoByUidResponseDto,
	GetVideoCoverUploadSignedUrlResponseDto,
	PendingReviewVideoResponseDto,
	SearchVideoByVideoTagIdRequestDto,
	SearchVideoByVideoTagIdResponseDto,
	ThumbVideoResponseDto,
	UploadVideoRequestDto,
	UploadVideoResponseDto,
	StartMultipartUploadRequestDto,
	StartMultipartUploadResponseDto,
	GetMultipartUploadPartSignedUrlRequestDto,
	GetMultipartUploadPartSignedUrlResponseDto,
	CompleteMultipartUploadRequestDto,
	CompleteMultipartUploadResponseDto,
	AbortMultipartUploadRequestDto,
	AbortMultipartUploadResponseDto,
} from "./VideoControllerDto";

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
 * MinIO Multipart Uploader
 */
export class MinioMultipartUploader {
	step: "pending" | "created" | "uploading" | "pausing" | "success" | "error" = "pending";
	process: Promise<string>;
	isUploadingVideo: Ref<boolean>;
	private file: File;
	private progress: Ref<number>;
	private uploadId: string | null = null;
	private key: string | null = null;
	private parts: { ETag: string; PartNumber: number }[] = [];
	private isAborted = false;

	constructor(file: File, progress: Ref<number>, isUploadingVideo: Ref<boolean>) {
		if (!file) {
			this.step = "error";
			useToast(t.toast.upload_file_not_found, "error");
			throw new Error(t.toast.upload_file_not_found);
		}
		this.file = file;
		this.progress = progress;
		this.isUploadingVideo = isUploadingVideo;
		this.process = this.startUpload();
	}

	private async startUpload(): Promise<string> {
		this.step = "created";
		this.isUploadingVideo.value = true;

		const startResponse = await startMultipartUpload({ fileName: this.file.name });
		if (!startResponse.success || !startResponse.uploadId || !startResponse.key) {
			this.step = "error";
			this.isUploadingVideo.value = false;
			throw new Error("Failed to start multipart upload.");
		}

		this.uploadId = startResponse.uploadId;
		this.key = startResponse.key;
		this.step = "uploading";

		const chunkSize = 5 * 1024 * 1024; // 5MB
		const totalChunks = Math.ceil(this.file.size / chunkSize);
		let uploadedChunks = 0;

		for (let i = 0; i < totalChunks; i++) {
			if (this.isAborted) {
				this.isUploadingVideo.value = false;
				throw new Error("Upload aborted by user.");
			}

			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, this.file.size);
			const chunk = this.file.slice(start, end);
			const partNumber = i + 1;

			const urlResponse = await getMultipartUploadPartSignedUrl({
				key: this.key,
				partNumber,
				uploadId: this.uploadId,
			});

			if (!urlResponse.success || !urlResponse.url) {
				this.step = "error";
				this.isUploadingVideo.value = false;
				throw new Error(`Failed to get signed URL for part ${partNumber}.`);
			}

			const uploadResponse = await fetch(urlResponse.url, {
				method: "PUT",
				body: chunk,
			});

			if (!uploadResponse.ok) {
				this.step = "error";
				this.isUploadingVideo.value = false;
				throw new Error(`Failed to upload part ${partNumber}.`);
			}

			const etag = uploadResponse.headers.get("ETag");
			if (!etag) {
				this.step = "error";
				this.isUploadingVideo.value = false;
				throw new Error(`Missing ETag for part ${partNumber}.`);
			}

			this.parts.push({ ETag: etag.replace(/"/g, ""), PartNumber: partNumber });
			uploadedChunks++;
			this.progress.value = (uploadedChunks / totalChunks) * 100;
		}

		const completeResponse = await completeMultipartUpload({
			key: this.key,
			uploadId: this.uploadId,
			parts: this.parts,
		});

		if (!completeResponse.success) {
			this.step = "error";
			this.isUploadingVideo.value = false;
			throw new Error("Failed to complete multipart upload.");
		}

		this.step = "success";
		this.isUploadingVideo.value = false;
		return this.key; // Return the object key on success
	}

	abort() {
		if (this.step === "uploading") {
			this.isAborted = true;
			this.step = "pausing"; // Or 'aborted'
			if (this.key && this.uploadId) {
				abortMultipartUpload({ key: this.key, uploadId: this.uploadId });
			}
		}
	}

	resume() {
		if (this.step === "pausing") {
			this.isAborted = false;
			this.process = this.startUpload(); // Restart upload
		}
	}
}

async function startMultipartUpload(request: StartMultipartUploadRequestDto): Promise<StartMultipartUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/start`, request, { credentials: "include" });
}

async function getMultipartUploadPartSignedUrl(request: GetMultipartUploadPartSignedUrlRequestDto): Promise<GetMultipartUploadPartSignedUrlResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/part-url`, request, { credentials: "include" });
}

async function completeMultipartUpload(request: CompleteMultipartUploadRequestDto): Promise<CompleteMultipartUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/complete`, request, { credentials: "include" });
}

async function abortMultipartUpload(request: AbortMultipartUploadRequestDto): Promise<AbortMultipartUploadResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload/abort`, request, { credentials: "include" });
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
		const response = await fetch(signedUrl, {
			method: 'PUT',
			body: videoCoverBlobData,
			headers: {
				'Content-Type': videoCoverBlobData.type,
			},
		});
		if (response.ok) {
			return true;
		} else {
			console.error("動画カバーのアップロードに失敗しました。HTTPエラー！ステータス:", response.status);
			return false;
		}
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
