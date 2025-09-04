/**
 * 基本的な動画コメントデータ
 */
type BasicVideoCommentDto = {
	/** KVID 動画ID */
	videoId: number;
	/** コメント本文 */
	text: string;
}

/**
 * 動画コメント送信リクエストデータ
 */
export type EmitVideoCommentRequestDto = BasicVideoCommentDto

/**
 * 動画コメント送信レスポンスデータ
 */
export type EmitVideoCommentResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 送信成功時、送信したコメントのデータを返す */
	videoComment?: VideoCommentResult;
}

/**
 * 特定のユーザーの特定動画へのコメントに対する高評価状況を取得するパラメータ
 */
export type GetVideoCommentUpvotePropsDto = {
	/** KVID 動画ID */
	videoId: number;
	/** 動画コメントに高評価したユーザーのUID */
	uid: number;
}

/**
 * 特定のユーザーの特定動画へのコメントに対する高評価状況を取得する結果
 */
export type GetVideoCommentUpvoteResultDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 特定のユーザーの特定動画へのコメントに対する高評価状況 */
	videoCommentUpvoteResult: {
		/** KVID 動画ID */
		videoId: number;
		/** コメントID */
		commentId: string;
		/** 動画コメントに高評価したユーザーのUID */
		uid: number;
		/** システム専用フィールド - 最終編集日時 */
		editDateTime: number;
	}[];
}

/**
 * 特定のユーザーの特定動画へのコメントに対する低評価状況を取得するパラメータ
 */
export type GetVideoCommentDownvotePropsDto = {
	/** KVID 動画ID */
	videoId: number;
	/** 動画コメントに低評価したユーザーのUID */
	uid: number;
}

/**
 * 特定のユーザーの特定動画へのコメントに対する低評価状況を取得する結果
 */
export type GetVideoCommentDownvoteResultDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 特定のユーザーの特定動画へのコメントに対する低評価状況 */
	videoCommentDownvoteResult: {
		/** KVID 動画ID */
		videoId: number;
		/** コメントID */
		commentId: string;
		/** 動画コメントに低評価したユーザーのUID */
		uid: number;
		/** システム専用フィールド - 最終編集日時 */
		editDateTime: number;
	}[];
}

/**
 * KVIDで動画コメントを取得するリクエストパラメータ
 */
export type GetVideoCommentByKvidRequestDto = {
	/** KVID 動画ID */
	videoId: number;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページあたりの表示件数 */
		pageSize: number;
	}
}

/**
 * 動画コメントIDの型（メインコメントの子コメントとして使用）
 */
type VideoCommentIdDto = {
	/** コメントのルート */ /** 例: 1.2.3（動画1のコメント2への3番目の返信） */
	commentRoute: string;
	/** コメントID */
	upvoteCount: string;
	/** コメント階層 */
	commentIndex: number;
}

/**
 * コメント投稿者のユーザー情報
 */
type CommentSenderUserInfo = {
	/** ニックネーム */
	userNickname?: string;
	/** ユーザー名 */
	username?: string;
	/** アバターのリンク */
	avatar?: string;
	/** ユーザー背景画像のリンク */
	userBannerImage?: string;
	/** 自己紹介 */
	signature?: string;
	/** 性別、男性、女性、カスタム（文字列） */
	gender?: string;
}

/**
 * リクエストされた動画コメント1件
 */
export type VideoCommentResult = {
	/** MongoDBが生成したユニークID */
	_id: string;
	/** コメントのルート */ /** 例: 1.2.3（動画1のコメント2への3番目の返信） */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
	/** コメント投稿者のUID */
	uid: number;
	/** コメント投稿者の情報（ユーザー名、アバターなど） */
	userInfo?: CommentSenderUserInfo;
	/** コメント投稿日時 */
	emitTime: number;
	/** コメント本文 */
	text: string;
	/** 高評価済みか */
	isUpvote: boolean;
	/** 低評価済みか */
	isDownvote: boolean;
	/** コメント高評価数 */
	upvoteCount: number;
	/** コメント低評価数 */
	downvoteCount: number;
	/** コメント階層 */
	commentIndex: number;
	/** 子コメント */
	subComments: VideoCommentIdDto[];
	/** このコメントの次の階層の子コメント数 */
	subCommentsCount: number;
	/** システム専用フィールド - 最終編集日時 */
	editDateTime: number;
}

/**
 * 動画コメント取得レスポンス
 */
export type GetVideoCommentByKvidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 動画コメント総数 */
	videoCommentCount: number;
	/** 動画コメント */
	videoCommentList: (VideoCommentResult& { isBlockedByOther?: boolean })[];
}

/**
 * 動画コメント高評価リクエストパラメータ
 */
export type EmitVideoCommentUpvoteRequestDto = {
	/** コメントのユニークID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 動画コメント高評価レスポンス
 */
export type EmitVideoCommentUpvoteResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 動画コメント高評価キャンセルリクエストパラメータ
 */
export type CancelVideoCommentUpvoteRequestDto = {
	/** コメントのユニークID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 動画コメント高評価キャンセルレスポンス
 */
export type CancelVideoCommentUpvoteResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 動画コメント低評価リクエストパラメータ
 */
export type EmitVideoCommentDownvoteRequestDto = {
	/** コメントのユニークID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 動画コメント低評価レスポンス
 */
export type EmitVideoCommentDownvoteResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 動画コメント低評価キャンセルリクエストパラメータ
 */
export type CancelVideoCommentDownvoteRequestDto = {
	/** コメントのユニークID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 動画コメント低評価キャンセルレスポンス
 */
export type CancelVideoCommentDownvoteResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 自身の動画コメント削除リクエストペイロード
 */
export type DeleteSelfVideoCommentRequestDto = {
	/** コメントのルート */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 自身の動画コメント削除レスポンス
 */
export type DeleteSelfVideoCommentResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 管理者による動画コメント削除リクエストペイロード
 */
export type AdminDeleteVideoCommentRequestDto = {
	/** コメントのルート */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
}

/**
 * 管理者による動画コメント削除レスポンス
 */
export type AdminDeleteVideoCommentResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}
