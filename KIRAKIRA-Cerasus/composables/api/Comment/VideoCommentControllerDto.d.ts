/**
 * 基本的な動画コメントデータ
 */
type BasicVideoCommentDto = {
	/** KVID 動画ID */
	videoId: number;
	/** コメント本文 */
	text: string;
};

/**
 * 動画コメント送信のリクエストデータ
 */
export type EmitVideoCommentRequestDto = BasicVideoCommentDto;

/**
 * 動画コメント送信のレスポンスデータ
 */
export type EmitVideoCommentResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 送信成功の場合、送信時のコメントデータを返す */
	videoComment?: VideoCommentResult;
};

/**
 * 特定のユーザーの特定動画へのコメントに対する高評価状況を取得するパラメータ
 */
export type GetVideoCommentUpvotePropsDto = {
	/** KVID 動画ID */
	videoId: number;
	/** 動画コメントを高評価したユーザーのUID */
	uid: number;
};

/**
 * 特定のユーザーの特定動画へのコメントに対する高評価状況の取得結果
 */
export type GetVideoCommentUpvoteResultDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 特定のユーザーの特定動画へのコメントに対する高評価状況 */
	videoCommentUpvoteResult: {
		/** KVID 動画ID */
		videoId: number;
		/** コメントID */
		commentId: string;
		/** コメントを高評価したユーザーのUID */
		uid: number;
		/** システム専用フィールド - 最終編集日時 */
		editDateTime: number;
	}[];
};

/**
 * 特定のユーザーの特定動画へのコメントに対する低評価状況を取得するパラメータ
 */
export type GetVideoCommentDownvotePropsDto = {
	/** KVID 動画ID */
	videoId: number;
	/** 動画コメントを低評価したユーザーのUID */
	uid: number;
};

/**
 * 特定のユーザーの特定動画へのコメントに対する低評価状況の取得結果
 */
export type GetVideoCommentDownvoteResultDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 特定のユーザーの特定動画へのコメントに対する低評価状況 */
	videoCommentDownvoteResult: {
		/** KVID 動画ID */
		videoId: number;
		/** コメントID */
		commentId: string;
		/** コメントを低評価したユーザーのUID */
		uid: number;
		/** システム専用フィールド - 最終編集日時 */
		editDateTime: number;
	}[];
};

/**
 * KVIDに基づいて動画コメントを取得するリクエストのパラメータ
 */
export type GetVideoCommentByKvidRequestDto = {
	/** KVID 動画ID */
	videoId: number;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * 動画コメントIDのタイプ（メインコメントの子コメントとして使用）
 */
type VideoCommentIdDto = {
	/** コメントのルート */ /** 例：1.2.3（1番目の動画の2番目のコメントの3番目の返信） */
	commentRoute: string;
	/** コメントID */
	upvoteCount: string;
	/** コメント番号 */
	commentIndex: number;
};

/**
 * コメント投稿者のユーザー情報
 */
type CommentSenderUserInfo = {
	/** ユーザーニックネーム */
	userNickname?: string;
	/** ユーザー名 */
	username?: string;
	/** ユーザーアイコンのリンク */
	avatar?: string;
	/** ユーザー背景画像のリンク */
	userBannerImage?: string;
	/** ユーザーの自己紹介 */
	signature?: string;
	/** ユーザーの性別、男性、女性、カスタム（文字列） */
	gender?: string;
};

/**
 * リクエストされた1件の動画コメント
 */
export type VideoCommentResult = {
	/** MongoDBが生成した一意のID */
	_id: string;
	/** コメントのルート */ /** 例：1.2.3（1番目の動画の2番目のコメントの3番目の返信） */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
	/** コメント投稿者のUID */
	uid: number;
	/** コメント投稿者の情報（ユーザー名、アイコンなど） */
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
	/** コメント番号 */
	commentIndex: number;
	/** 子コメント */
	subComments: VideoCommentIdDto[];
	/** このコメントの次のレベルの子コメント数 */
	subCommentsCount: number;
	/** システム専用フィールド - 最終編集日時 */
	editDateTime: number;
};

/**
 * 動画コメント取得のレスポンス結果
 */
export type GetVideoCommentByKvidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 動画コメント総数 */
	videoCommentCount: number;
	/** 動画コメント */
	videoCommentList: (VideoCommentResult & { isBlockedByOther?: boolean })[];
};

/**
 * 動画コメントに高評価するためのリクエストパラメータ
 */
export type EmitVideoCommentUpvoteRequestDto = {
	/** コメントの一意のID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 動画コメントに高評価するためのリクエストのレスポンス結果
 */
export type EmitVideoCommentUpvoteResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 動画コメントに高評価するためのリクエストパラメータ
 */
export type CancelVideoCommentUpvoteRequestDto = {
	/** コメントの一意のID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 動画コメントの高評価を取り消すリクエストのレスポンス結果
 */
export type CancelVideoCommentUpvoteResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 動画コメントに低評価するためのリクエストパラメータ
 */
export type EmitVideoCommentDownvoteRequestDto = {
	/** コメントの一意のID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 動画コメントに低評価するためのリクエストのレスポンス結果
 */
export type EmitVideoCommentDownvoteResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 動画コメントに低評価するためのリクエストパラメータ
 */
export type CancelVideoCommentDownvoteRequestDto = {
	/** コメントの一意のID */
	id: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 動画コメントの低評価を取り消すリクエストのレスポンス結果
 */
export type CancelVideoCommentDownvoteResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 自分の動画コメントを削除するリクエストペイロード
 */
export type DeleteSelfVideoCommentRequestDto = {
	/** コメントのルート */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 自分の動画コメントを削除するリクエストのレスポンス
 */
export type DeleteSelfVideoCommentResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 管理者が動画コメントを削除するリクエストペイロード
 */
export type AdminDeleteVideoCommentRequestDto = {
	/** コメントのルート */
	commentRoute: string;
	/** KVID 動画ID */
	videoId: number;
};

/**
 * 管理者が動画コメントを削除するリクエストのレスポンス
 */
export type AdminDeleteVideoCommentResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};
