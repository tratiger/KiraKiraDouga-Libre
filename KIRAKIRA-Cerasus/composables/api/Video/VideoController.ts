import * as tus from "tus-js-client";
import { DELETE, GET, POST, uploadFile2CloudflareImages } from "../Common";
import type { ApprovePendingReviewVideoRequestDto, ApprovePendingReviewVideoResponseDto, CheckVideoExistRequestDto, CheckVideoExistResponseDto, DeleteVideoRequestDto, DeleteVideoResponseDto, GetVideoByKvidRequestDto, GetVideoByKvidResponseDto, GetVideoByUidRequestDto, GetVideoByUidResponseDto, GetVideoCoverUploadSignedUrlResponseDto, PendingReviewVideoResponseDto, SearchVideoByVideoTagIdRequestDto, SearchVideoByVideoTagIdResponseDto, ThumbVideoResponseDto, UploadVideoRequestDto, UploadVideoResponseDto } from "./VideoControllerDto";

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
 * TUSでファイルをアップロードします
 */
export class TusFileUploader {
	step: "pending" | "created" | "uploading" | "pausing" | "success" | "error" = "pending";
	process: Promise<string>;
	uploading?: tus.Upload;
	isUploadingVideo: Ref<boolean>;

	/**
	 * TUSでファイルをアップロードします
	 * @param file - ファイル
	 * @param progress - 進捗（Vueリアクティブ状態）
	 * @param isUploadingVideo - 動画をアップロード中かどうか（Vueリアクティブ状態）
	 */
	constructor(file: File, progress: Ref<number>, isUploadingVideo: Ref<boolean>) {
		if (!file) {
			this.step = "error";
			useToast(t.toast.upload_file_not_found, "error");
			throw new Error(t.toast.upload_file_not_found);
		}
		this.isUploadingVideo = isUploadingVideo;
		this.process = new Promise<string>((resolve, reject) => {
			let videoId = "";
			// Create a new tus upload
			const uploader = new tus.Upload(file, {
				endpoint: `${VIDEO_API_URI}/tus`,
				onBeforeRequest(req) {
					const url = req.getURL();
					if (url?.includes(VIDEO_API_URI)) { // バックエンドAPIにアップロード先のURLをリクエストする場合にのみ、クロスオリジンでのcookie送信を許可します。
						const xhr = req.getUnderlyingObject();
						xhr.withCredentials = true;
					}
				},
				retryDelays: [0, 3000, 5000, 10000, 20000], // リトライタイムアウト
				chunkSize: 52428800, // 動画チャンクサイズ
				storeFingerprintForResuming: true, // アップロード再開用のキーを保存 // WARN: 通常実行時はTrueにすべきです
				removeFingerprintOnSuccess: true, // アップロード成功後に再開用のキーを削除
				metadata: {
					name: file.name,
					maxDurationSeconds: "1800", // 最大動画長、1800秒（30分）
					expiry: getCloudflareRFC3339ExpiryDateTime(3600), // 最大アップロード時間、3600秒（1時間）
				},
				onError: error => {
					console.error("ERROR", "Upload error:", error);
					this.step = "error";
					reject(error);
				},
				onProgress: (bytesUploaded, bytesTotal) => {
					const percentage = bytesUploaded / bytesTotal * 100;
					progress.value = percentage;
					console.info(bytesUploaded, bytesTotal, percentage.toFixed(2) + "%"); // useless
				},
				onSuccess: () => {
					console.info("Video upload success");
					if (videoId) {
						this.step = "success";
						resolve(videoId);
					} else
						reject(new Error("Can not find the video ID"));
				},
				onAfterResponse: (req, res) => {
					if (!req.getURL().includes(VIDEO_API_URI)) {
						const headerVideoId = res?.getHeader("stream-media-id");
						if (headerVideoId)
							videoId = headerVideoId;
					}
				},
			});
			this.uploading = uploader;
			this.step = "created";
			// Check if there are any previous uploads to continue.
			uploader.findPreviousUploads().then(previousUploads => {
				// Found previous uploads so we select the first one.
				if (previousUploads.length > 0)
					uploader.resumeFromPreviousUpload(previousUploads[0]);

				// Start the upload
				uploader.start();
				this.step = "uploading";
				isUploadingVideo.value = true;
			});
		});
	}

	/**
	 * TUSアップロードを一時停止します
	 */
	abort() {
		if (this.uploading)
			if (this.step === "uploading") {
				this.uploading.abort();
				this.step = "pausing";
				this.isUploadingVideo.value = false;
			} else
				console.error(`Upload pause failed, Pausing can only work when in 'uploading' step, but you are in '${this.step}' step.`);
	}

	/**
	 * TUSアップロードを再開します
	 */
	resume() {
		if (this.uploading)
			if (this.step === "pausing") {
				this.uploading.start();
				this.step = "uploading";
				this.isUploadingVideo.value = true;
			} else
				console.error(`Upload resume failed, Uploading can only work when in 'pausing' step, but you are in '${this.step}' step.`);
	}
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
		await uploadFile2CloudflareImages(fileName, signedUrl, videoCoverBlobData, 60000);
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
