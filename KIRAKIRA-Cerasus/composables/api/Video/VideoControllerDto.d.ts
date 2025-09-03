import { VideoTag } from "./VideoTagControllerDto.js";

/**
 * 個別動画パートのデータパラメータ
 */
export type VideoPartDto = {
	/** パートID */
	id: number;
	/** 動画パートタイトル */
	videoPartTitle: string;
	/** 動画ダイレクトリンク */
	link: string;
};

/**
 * 動画アップロードのリクエストパラメータ
 */
export type UploadVideoRequestDto = {
	/** 各パートの動画データ */
	videoPart: VideoPartDto[];
	/** 動画タイトル */
	title: string;
	/** カバー画像リンク */
	image: string;
	/** 作成者UID */
	uploaderId: number;
	/** 動画時間（単位：ms） */
	duration: number;
	/** 動画説明 */
	description?: string;
	/** 動画カテゴリ */
	videoCategory: string;
	/** 動画著作権 */
	copyright: string;
	/** 原作者 */
	originalAuthor?: string;
	/** 元動画リンク */
	originalLink?: string;
	/** フィードに投稿するか */
	pushToFeed: boolean;
	/** オリジナルとして宣言 */
	ensureOriginal: boolean;
	/** 動画タグ */
	videoTagList: VideoTag[];
};

/**
 * 動画アップロードの返却パラメータ
 */
export type UploadVideoResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 動画ID */
	videoId?: number;
};

// export type ThumbVideoRequestDto = {
// 	username: string;
// }

/**
 * 動画カード表示に必要な返却パラメータ
 */
export type ThumbVideoResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 取得した動画数。取得できなかった場合は0 */
	videosCount: number;
	/** リクエストされた動画データ */
	videos: {
		/** 動画ID (KVID) */
		videoId: number;
		/** 動画タイトル */
		title: string;
		/** カバー画像リンク */
		image?: string;
		/** 動画アップロード日（タイムスタンプ形式） */
		uploadDate?: number;
		/** 動画再生数 */
		watchedCount?: number;
		/** 動画作者名 */
		uploader?: string;
		/** 動画作者ニックネーム */
		uploaderNickname?: string;
		/** 作成者UID */
		uploaderId?: number;
		/** 動画時間（単位：ms） */
		duration?: number;
		/** 動画説明 */
		description?: string;
		/** ブロックされているか */
		isBlockedByOther?: boolean;
	}[];
};

/**
 * 動画IDから動画を取得するリクエストパラメータ
 */
export type GetVideoByKvidRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
};

/**
 * 動画をアップロードしたユーザーの情報
 */
type UploaderInfoDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザー名 */
	username: string;
	/** ユーザーニックネーム */
	userNickname?: string;
	/** ユーザーアイコンのリンク */
	avatar?: string;
	/** ユーザー背景画像のリンク */
	userBannerImage?: string;
	/** ユーザーの自己紹介 */
	signature?: string;
	/** このアップローダーをフォローしているか */
	isFollowing: boolean;
	/** アップローダーが自分自身か */
	isSelf: boolean;
};

/**
 * ユーザーのブロック状態
 */
type BlockState = { isBlockedByOther: boolean; isBlocked: boolean; isHidden: boolean };

/**
 * 動画ページに必要なレスポンス
 */
export type GetVideoByKvidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** リクエストされた動画データ */
	video?: {
		/** 動画ID (KVID) */
		videoId: number;
		/** 動画パートデータ */
		videoPart: VideoPartDto[];
		/** 動画タイトル */
		title: string;
		/** カバー画像リンク */
		image?: string;
		/** 動画アップロード日（タイムスタンプ形式） */
		uploadDate?: number;
		/** 動画再生数 */
		watchedCount?: number;
		/** 動画作者 ID */
		uploader?: string;
		/** 作成者UUID */
		uploaderUUID?: string;
		/** 作成者UID */
		uploaderId?: number;
		/** 動画作者情報 */
		uploaderInfo?: UploaderInfoDto;
		/** 動画時間（単位：ms） */
		duration?: number;
		/** 動画説明 */
		description?: string;
		/** 動画カテゴリ */
		videoCategory: string;
		/** 動画著作権 */
		copyright: string;
		/** 動画タグ */
		videoTagList: VideoTag[];
	};
} & BlockState;

/**
 * 動画ID (KVID) に基づいて動画が存在するか確認するリクエストペイロード
 */
export type CheckVideoExistRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
};

/**
 * 動画ID (KVID) に基づいて動画が存在するか確認するリクエストのレスポンス
 */
export type CheckVideoExistResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 動画が存在するか */
	exist: boolean;
};

/**
 * 動画ID (KVID) に基づいて動画がブロックされているか確認するリクエストのレスポンス
 */
export type CheckVideoBlockedByKvidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ユーザーをブロックしているか */
	isBlocked?: boolean;
	/** 他のユーザーにブロックされているか */
	isBlockedByOther?: boolean;
	/** 非表示にされているか */
	isHidden?: boolean;
};

/**
 * UIDから動画を取得するリクエストパラメータ
 */
export type GetVideoByUidRequestDto = {
	/** ユーザーのUID */
	uid: number;
};

/**
 * UIDから動画を取得するリクエストのレスポンス結果
 */
export type GetVideoByUidResponseDto = ThumbVideoResponseDto & BlockState;

/**
 * キーワードに基づいて動画を検索するリクエストパラメータ
 */
export type SearchVideoByKeywordRequestDto = {
	keyword: string;
};

/**
 * キーワードに基づいて動画を検索するレスポンス結果
 */
export type SearchVideoByKeywordResponseDto = ThumbVideoResponseDto & {};

/**
 * 動画ファイルTUSアップロードエンドポイントのリクエストパラメータ
 */
export type GetVideoFileTusEndpointRequestDto = {
	/** 動画アップロードのチャンクサイズ。Cloudflareは256KiBの倍数のみサポートし、最小5,242,880バイト、最大209,715,200バイト。推奨は52,428,800バイト */
	uploadLength: number;
	/** 動画メタデータ */
	uploadMetadata: string;
};

/**
 * 動画カバー画像アップロード用の署名付きURL取得のレスポンス結果
 */
export type GetVideoCoverUploadSignedUrlResponseDto = {
	/** リクエストが成功したか。成功した場合はtrue、それ以外はfalse */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** リクエストされた動画カバー画像アップロードの署名付きURLデータ */
	result?: {
		/** 署名付きURL */
		signedUrl: string;
		/** ファイル名 */
		fileName: string;
	};
};

/**
 * 動画TAG IDに基づいて動画を検索するリクエストペイロード
 */
export type SearchVideoByVideoTagIdRequestDto = {
	/** TAG ID */
	tagId: UploadVideoRequestDto["videoTagList"][number]["tagId"][];
};

/**
 * 動画TAG IDによる動画取得のリクエストレスポンス
 */
export type SearchVideoByVideoTagIdResponseDto = ThumbVideoResponseDto & {};

/**
 * 動画削除のリクエストペイロード
 */
export type DeleteVideoRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
};

/**
 * 動画削除のリクエストレスポンス
 */
export type DeleteVideoResponseDto = {
	/** リクエストが成功したか。成功した場合はtrue、それ以外はfalse */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 審査待ちの動画リスト
 */
export type PendingReviewVideoResponseDto = {} & ThumbVideoResponseDto;

/**
 * 審査待ち動画を承認するリクエストペイロード
 */
export type ApprovePendingReviewVideoRequestDto = {
	/** 動画ID (KVID) */
	videoId: number;
};

/**
 * 審査待ち動画を承認するリクエストのレスポンス
 */
export type ApprovePendingReviewVideoResponseDto = {
	/** リクエストが成功したか。成功した場合はtrue、それ以外はfalse */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};
