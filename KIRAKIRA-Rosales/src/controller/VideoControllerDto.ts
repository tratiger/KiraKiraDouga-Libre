import { VideoTag } from './VideoTagControllerDto.js'

/**
 * 動画パートのデータパラメータ
 */
export type VideoPartDto = {
	/** パートID */
	id: number;
	/** 動画パートのタイトル */
	videoPartTitle: string;
	/** 動画の直接リンク */
	link: string;
}

/**
 * 動画アップロードのリクエストパラメータ
 */
export type UploadVideoRequestDto = {
	/** 各パートの動画データ */
	videoPart: VideoPartDto[];
	/** 動画タイトル */
	title: string;
	/** カバー画像のリンク */
	image: string;
	/** 作成者のUID */
	uploaderId: number;
	/** 動画時間（ms） */
	duration: number;
	/** 動画説明 */
	description?: string;
	/** 動画カテゴリ */
	videoCategory: string;
	/** 動画の著作権 */
	copyright: string;
	/** 原作者 */
	originalAuthor?: string;
	/** 元動画のリンク */
	originalLink?: string;
	/** フィードに投稿するか */
	pushToFeed: boolean;
	/** オリジナルとして宣言するか */
	ensureOriginal: boolean;
	/** 動画TAG */
	videoTagList: VideoTag[];
}

/**
 * 動画アップロードのレスポンスパラメータ
 */
export type UploadVideoResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 動画ID */
	videoId?: number;
}

// export type ThumbVideoRequestDto = {
// 	username: string;
// }

/**
 * 動画カード表示に必要なレスポンスパラメータ
 */
export type ThumbVideoResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 取得した動画数（取得できなかった場合は0） */
	videosCount: number;
	/** リクエストされた動画データ */
	videos: {
		/** 動画ID (KVID) */
		videoId: number;
		/** 動画タイトル */
		title: string;
		/** カバー画像のリンク */
		image?: string;
		/** 動画アップロード日（タイムスタンプ形式） */
		uploadDate?: number;
		/** 動画再生数 */
		watchedCount?: number;
		/** 動画作成者名 */
		uploader?: string;
		/** 動画作成者のニックネーム */
		uploaderNickname?: string;
		/** 作成者のUID */
		uploaderId?: number;
		/** 動画時間（ms） */
		duration?: number;
		/** 動画説明 */
		description?: string;
		/** ブロックされているか */
		isBlockedByOther?: boolean;
	}[];
}

/**
 * 動画IDから動画を取得するリクエストパラメータ
 */
export type GetVideoByKvidRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
}

/**
 * 動画をアップロードしたユーザーの情報
 */
type UploaderInfoDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザー名 */
	username: string;
	/** ニックネーム */
	userNickname?: string;
	/** アバターのリンク */
	avatar?: string;
	/** ユーザー背景画像のリンク */
	userBannerImage?: string;
	/** 自己紹介 */
	signature?: string;
	/** このアップローダーをフォローしているか */
	isFollowing: boolean;
	/** アップローダーが自分自身か */
	isSelf: boolean;
}

/**
 * ユーザーのブロック状態
 */
type BlockState = { isBlockedByOther: boolean, isBlocked: boolean; isHidden: boolean }

/**
 * 動画ページに必要なレスポンス
 */
export type GetVideoByKvidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** リクエストされた動画データ */
	video?: {
		/** 動画ID (KVID) */
		videoId: number;
		/** 動画パートデータ */
		videoPart: VideoPartDto[];
		/** 動画タイトル */
		title: string;
		/** カバー画像のリンク */
		image?: string;
		/** 動画アップロード日（タイムスタンプ形式） */
		uploadDate?: number;
		/** 動画再生数 */
		watchedCount?: number;
		/** 動画作成者ID */
		uploader?: string;
		/** 作成者のUUID */
		uploaderUUID?: string;
		/** 作成者のUID */
		uploaderId?: number;
		/** 動画作成者情報 */
		uploaderInfo?: UploaderInfoDto;
		/** 動画時間（ms） */
		duration?: number;
		/** 動画説明 */
		description?: string;
		/** 動画カテゴリ */
		videoCategory: string;
		/** 動画の著作権 */
		copyright: string;
		/** 動画TAG */
		videoTagList: VideoTag[];
	};
} & BlockState

/**
 * 動画ID (KVID) で動画が存在するか確認するリクエストペイロード
 */
export type CheckVideoExistRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
}

/**
 * 動画ID (KVID) で動画が存在するか確認するレスポンス
 */
export type CheckVideoExistResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 動画が存在するか */
	exist: boolean;
}

/**
 * 動画ID (KVID) で動画がブロックされているか確認するレスポンス
 */
export type CheckVideoBlockedByKvidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ユーザーをブロックしているか */
	isBlocked?: boolean;
	/** 他のユーザーにブロックされているか */
	isBlockedByOther?: boolean;
	/** 非表示にされているか */
	isHidden?: boolean;
}

/**
 * UIDから動画を取得するリクエストパラメータ
 */
export type GetVideoByUidRequestDto = {
	/** ユーザーのUID */
	uid: number;
}

/**
 * UIDから動画を取得するリクエストのレスポンス
 */
export type GetVideoByUidResponseDto = ThumbVideoResponseDto & BlockState

/**
 * キーワードで動画を検索するリクエストパラメータ
 */
export type SearchVideoByKeywordRequestDto = {
	keyword: string;
}

/**
 * キーワードで動画を検索するレスポンス
 */
export type SearchVideoByKeywordResponseDto = ThumbVideoResponseDto & {}

/**
 * マルチパートアップロード開始リクエスト
 */
export type InitiateVideoUploadRequestDto = {
	/** アップロードするファイル名 */
	fileName: string;
}

/**
 * マルチパートアップロード開始レスポンス
 */
export type InitiateVideoUploadResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 結果 */
	result?: {
		/** アップロードID */
		uploadId: string;
		/** オブジェクトキー */
		objectKey: string;
	};
}

/**
 * パートアップロード用署名付きURL取得リクエスト
 */
export type GetMultipartSignedUrlRequestDto = {
	/** オブジェクトキー */
	objectKey: string;
	/** アップロードID */
	uploadId: string;
	/** パート番号 */
	partNumber: number;
}

/**
 * パートアップロード用署名付きURL取得レスポンス
 */
export type GetMultipartSignedUrlResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 結果 */
	result?: {
		/** 署名付きURL */
		signedUrl: string;
	};
}

/**
 * マルチパートアップロード完了リクエスト
 */
export type CompleteVideoUploadRequestDto = {
	/** オブジェクトキー */
	objectKey: string;
	/** アップロードID */
	uploadId: string;
	/** アップロードされたパートの情報 */
	parts: {
		/** ETag */
		ETag: string;
		/** パート番号 */
		PartNumber: number;
	}[];
}

/**
 * マルチパートアップロード完了レスポンス
 */
export type CompleteVideoUploadResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * マルチパートアップロード中断リクエスト
 */
export type AbortVideoUploadRequestDto = {
	/** オブジェクトキー */
	objectKey: string;
	/** アップロードID */
	uploadId: string;
}

/**
 * マルチパートアップロード中断レスポンス
 */
export type AbortVideoUploadResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 動画カバー画像アップロード用署名付きURL取得レスポンス
 */
export type GetVideoCoverUploadSignedUrlResponseDto = {
	/** リクエストが成功したか。成功ならtrue、失敗ならfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** リクエストされた動画カバー画像アップロード用署名付きURLデータ */
	result?: {
		/** 署名付きURL */
		signedUrl: string;
		/** ファイル名 */
		fileName: string;
	};
}

/**
 * 動画TAG IDで動画を検索するリクエストペイロード
 */
export type SearchVideoByVideoTagIdRequestDto = {
	/** TAG ID */
	tagId: UploadVideoRequestDto['videoTagList'][number]['tagId'][];
}

/**
 * 動画TAG IDで動画を取得するレスポンス
 */
export type SearchVideoByVideoTagIdResponseDto = ThumbVideoResponseDto & {}

/**
 * 動画削除リクエストペイロード
 */
export type DeleteVideoRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
}

/**
 * 動画削除レスポンス
 */
export type DeleteVideoResponseDto = {
	/** リクエストが成功したか。成功ならtrue、失敗ならfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * レビュー待ち動画リスト
 */
export type PendingReviewVideoResponseDto = {} & ThumbVideoResponseDto

/**
 * レビュー待ち動画承認リクエストペイロード
 */
export type ApprovePendingReviewVideoRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
}

/**
 * レビュー待ち動画承認レスポンス
 */
export type ApprovePendingReviewVideoResponseDto = {
	/** リクエストが成功したか。成功ならtrue、失敗ならfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}
