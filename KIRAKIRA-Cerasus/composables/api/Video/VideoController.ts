import * as tus from "tus-js-client";
import { DELETE, GET, POST, uploadFile2CloudflareImages } from "../Common";
import type { ApprovePendingReviewVideoRequestDto, ApprovePendingReviewVideoResponseDto, CheckVideoExistRequestDto, CheckVideoExistResponseDto, DeleteVideoRequestDto, DeleteVideoResponseDto, GetVideoByKvidRequestDto, GetVideoByKvidResponseDto, GetVideoByUidRequestDto, GetVideoByUidResponseDto, GetVideoCoverUploadSignedUrlResponseDto, PendingReviewVideoResponseDto, SearchVideoByVideoTagIdRequestDto, SearchVideoByVideoTagIdResponseDto, ThumbVideoResponseDto, UploadVideoRequestDto, UploadVideoResponseDto } from "./VideoControllerDto";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";  

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
 * MinIO S3互換APIでファイルをアップロードします  
 */  
export class MinIOFileUploader {  
    step: "pending" | "created" | "uploading" | "pausing" | "success" | "error" = "pending";  
    process: Promise<string>;  
    isUploadingVideo: Ref<boolean>;  
    private s3Client: S3Client;  
    private uploadId?: string;  
    private parts: Array<{ ETag: string; PartNumber: number }> = [];  
  
    /**  
     * MinIO S3互換APIでファイルをアップロードします  
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
        this.s3Client = new S3Client({  
            region: 'us-east-1',  
            endpoint: environment.minioEndpoint,  
            credentials: {  
                accessKeyId: environment.minioAccessKey,  
                secretAccessKey: environment.minioSecretKey,  
            },  
            forcePathStyle: true,  
        });  
  
        this.process = this.uploadFile(file, progress);  
    }  
  
    private async uploadFile(file: File, progress: Ref<number>): Promise<string> {  
        try {  
            const key = `videos/${Date.now()}-${file.name}`;  
              
            // マルチパートアップロード開始  
            const createCommand = new CreateMultipartUploadCommand({  
                Bucket: environment.minioBucket,  
                Key: key,  
                ContentType: file.type,  
            });  
              
            const createResponse = await this.s3Client.send(createCommand);  
            this.uploadId = createResponse.UploadId;  
            this.step = "created";  
  
            // ファイルを5MBチャンクに分割  
            const chunkSize = 5 * 1024 * 1024; // 5MB  
            const totalChunks = Math.ceil(file.size / chunkSize);  
              
            this.step = "uploading";  
            this.isUploadingVideo.value = true;  
  
            // 各チャンクをアップロード  
            for (let i = 0; i < totalChunks; i++) {  
                const start = i * chunkSize;  
                const end = Math.min(start + chunkSize, file.size);  
                const chunk = file.slice(start, end);  
  
                const uploadCommand = new UploadPartCommand({  
                    Bucket: environment.minioBucket,  
                    Key: key,  
                    PartNumber: i + 1,  
                    UploadId: this.uploadId,  
                    Body: chunk,  
                });  
  
                const uploadResponse = await this.s3Client.send(uploadCommand);  
                this.parts.push({  
                    ETag: uploadResponse.ETag!,  
                    PartNumber: i + 1,  
                });  
  
                // 進捗更新  
                progress.value = ((i + 1) / totalChunks) * 100;  
            }  
  
            // マルチパートアップロード完了  
            const completeCommand = new CompleteMultipartUploadCommand({  
                Bucket: environment.minioBucket,  
                Key: key,  
                UploadId: this.uploadId,  
                MultipartUpload: { Parts: this.parts },  
            });  
  
            await this.s3Client.send(completeCommand);  
            this.step = "success";  
            this.isUploadingVideo.value = false;  
              
            return key; // MinIOのオブジェクトキーを返す  
        } catch (error) {  
            console.error("ERROR", "Upload error:", error);  
            this.step = "error";  
            this.isUploadingVideo.value = false;  
            throw error;  
        }  
    }  
  
    /**  
     * アップロードを中止します  
     */  
    abort() {  
        // MinIOでは中止機能の実装が必要  
        this.step = "pausing";  
        this.isUploadingVideo.value = false;  
    }  
  
    /**  
     * アップロードを再開します  
     */  
    resume() {  
        // MinIOでは再開機能の実装が必要  
        this.step = "uploading";  
        this.isUploadingVideo.value = true;  
    }  
}

/**  
 * MinIO用の動画カバー画像アップロード署名付きURLを取得します  
 * @returns MinIO署名付きURLリクエストのレスポンス  
 */  
export async function getVideoCoverUploadSignedUrl(): Promise<GetVideoCoverUploadSignedUrlResponseDto> {  
    return (await GET(`${VIDEO_API_URI}/cover/preUpload/minio`, { credentials: "include" })) as GetVideoCoverUploadSignedUrlResponseDto;  
}  
  
/**  
 * MinIO S3互換API経由で動画カバー画像をアップロードします  
 * @param fileName - ファイル名  
 * @param videoCoverBlobData - Blobでエンコードされた動画カバーファイル  
 * @param signedUrl - MinIO署名付きURL  
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
            throw new Error(`Upload failed with status: ${response.status}`);  
        }  
    } catch (error) {  
        console.error("動画カバーのアップロードに失敗しました。エラー情報：", error, { videoCoverBlobData, signedUrl });  
        return false;  
    }  
}

  
/**  
 * MinIO用動画アップロードセッションを作成します  
 * @param fileName ファイル名  
 * @param fileSize ファイルサイズ  
 * @returns アップロードセッション情報  
 */  
export async function createVideoUploadSession(fileName: string, fileSize: number): Promise<CreateVideoUploadSessionResponseDto> {  
    return (await POST(`${VIDEO_API_URI}/upload/session`, {   
        body: { fileName, fileSize },  
        credentials: "include"   
    })) as CreateVideoUploadSessionResponseDto;  
}  
  

/**  
 * MinIOFileUploaderクラスの修正版（セッション対応）  
 */  
export class MinIOFileUploader {  
    step: "pending" | "created" | "uploading" | "pausing" | "success" | "error" = "pending";  
    process: Promise<string>;  
    isUploadingVideo: Ref<boolean>;  
    private s3Client: S3Client;  
    private uploadId?: string;  
    private objectKey?: string;  
    private parts: Array<{ ETag: string; PartNumber: number }> = [];  
  
    constructor(file: File, progress: Ref<number>, isUploadingVideo: Ref<boolean>) {  
        if (!file) {  
            this.step = "error";  
            useToast(t.toast.upload_file_not_found, "error");  
            throw new Error(t.toast.upload_file_not_found);  
        }  
          
        this.isUploadingVideo = isUploadingVideo;  
        this.s3Client = new S3Client({  
            region: 'us-east-1',  
            endpoint: environment.minioEndpoint,  
            credentials: {  
                accessKeyId: environment.minioAccessKey,  
                secretAccessKey: environment.minioSecretKey,  
            },  
            forcePathStyle: true,  
        });  
  
        this.process = this.uploadFile(file, progress);  
    }  
  
    private async uploadFile(file: File, progress: Ref<number>): Promise<string> {  
        try {  
            // バックエンドでアップロードセッションを作成  
            const sessionResult = await createVideoUploadSession(file.name, file.size);  
              
            if (!sessionResult.success || !sessionResult.uploadId || !sessionResult.objectKey) {  
                throw new Error('アップロードセッションの作成に失敗しました');  
            }  
  
            this.uploadId = sessionResult.uploadId;  
            this.objectKey = sessionResult.objectKey;  
            this.step = "created";  
  
            // ファイルを5MBチャンクに分割  
            const chunkSize = 5 * 1024 * 1024; // 5MB  
            const totalChunks = Math.ceil(file.size / chunkSize);  
              
            this.step = "uploading";  
            this.isUploadingVideo.value = true;  
  
            // 各チャンクをアップロード  
            for (let i = 0; i < totalChunks; i++) {  
                const start = i * chunkSize;  
                const end = Math.min(start + chunkSize, file.size);  
                const chunk = file.slice(start, end);  
  
                const uploadCommand = new UploadPartCommand({  
                    Bucket: sessionResult.bucketName,  
                    Key: this.objectKey,  
                    PartNumber: i + 1,  
                    UploadId: this.uploadId,  
                    Body: chunk,  
                });  
  
                const uploadResponse = await this.s3Client.send(uploadCommand);  
                this.parts.push({  
                    ETag: uploadResponse.ETag!,  
                    PartNumber: i + 1,  
                });  
  
                // 進捗更新  
                progress.value = ((i + 1) / totalChunks) * 100;  
            }  
  
            // マルチパートアップロード完了  
            const completeCommand = new CompleteMultipartUploadCommand({  
                Bucket: sessionResult.bucketName,  
                Key: this.objectKey,  
                UploadId: this.uploadId,  
                MultipartUpload: { Parts: this.parts },  
            });  
  
            await this.s3Client.send(completeCommand);  
            this.step = "success";  
            this.isUploadingVideo.value = false;  
              
            return this.objectKey; // MinIOのオブジェクトキーを返す  
        } catch (error) {  
            console.error("ERROR", "Upload error:", error);  
            this.step = "error";  
            this.isUploadingVideo.value = false;  
            throw error;  
        }  
    }  
  
    abort() {  
        this.step = "pausing";  
        this.isUploadingVideo.value = false;  
    }  
  
    resume() {  
        this.step = "uploading";  
        this.isUploadingVideo.value = true;  
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
