import { type VideoTag } from "../VideoTag/VideoTagControllerDto";

/**
 * ユーザーをブロックするリクエストペイロード
 */
export type BlockUserByUidRequestDto = {
	/** ブロックされるユーザーのUID - 空でないこと */
	blockUid: number;
};

/**
 * ユーザーをブロックするリクエストのレスポンス
 */
export type BlockUserByUidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * ユーザーを非表示にするリクエストペイロード
 */
export type HideUserByUidRequestDto = {
	/** 非表示にされるユーザーのUID - 空でないこと */
	hideUid: number;
};

/**
 * ユーザーを非表示にするリクエストのレスポンス
 */
export type HideUserByUidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * タグをブロックするリクエストペイロード
 */
export type BlockTagRequestDto = {
	/* ブロックするタグID - 空でないこと */
	tagId: number;
};

/**
 * タグをブロックするリクエストのレスポンス
 */
export type BlockTagResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * キーワードをブロックするリクエストペイロード
 */
export type BlockKeywordRequestDto = {
	/* ブロックするキーワード - 空でないこと */
	blockKeyword: string;
};

/**
 * キーワードをブロックするリクエストのレスポンス
 */
export type BlockKeywordResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 正規表現を追加するリクエストペイロード
 */
export type AddRegexRequestDto = {
	/** 正規表現 - 空でないこと */
	blockRegex: string;
	/** 正規表現のフラグ - 空でないこと */
	// flag: string;
};

/**
 * 正規表現を追加するリクエストのレスポンス
 */
export type AddRegexResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** ユーザーが安全でない正規表現を入力したか */
	unsafeRegex: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * ユーザーのブロックを解除するリクエストペイロード
 */
export type UnblockUserByUidRequestDto = {
	/** ブロックされるユーザーのUID - 空でないこと */
	blockUid: number;
};

/**
 * ユーザーのブロックを解除するリクエストのレスポンス
 */
export type UnblockUserByUidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * ユーザーを表示するリクエストペイロード
 */
export type ShowUserByUidRequestDto = {
	/** 表示されるユーザーのUID - 空でないこと */
	hideUid: number;
};

/**
 * ユーザーを表示するリクエストのレスポンス
 */
export type ShowUserByUidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * タグのブロックを解除するリクエストペイロード
 */
export type UnblockTagRequestDto = {
	/* ブロックするタグID - 空でないこと */
	tagId: number;
};

/**
 * タグのブロックを解除するリクエストのレスポンス
 */
export type UnblockTagResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * キーワードのブロックを解除するリクエストペイロード
 */
export type UnblockKeywordRequestDto = {
	/** ブロックするキーワード - 空でないこと */
	blockKeyword: string;
};

/**
 * 正規表現を削除するリクエストペイロード
 */
export type RemoveRegexRequestDto = {
	/** 正規表現 - 空でないこと */
	blockRegex: string;
	/** 正規表現のフラグ - 空でないこと */
	// flag: string;
};

/**
 * 正規表現を削除するリクエストのレスポンス
 */
export type RemoveRegexResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * キーワードのブロックを解除するリクエストのレスポンス
 */
export type UnblockKeywordResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * ブロックリスト取得のリクエストペイロード
 */
export type GetBlockListRequestDto = {
	/** ブロックの種類 - 空でないこと */
	type: string;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

export type GetBlocklistResult = {
	/** ブロックの種類 */
	type: string;
	/** ブロック値 */
	value: string;
	/** ブロック日時 */
	createDateTime: number;
	/** ブロックされたユーザーのUID */
	uid?: number;
	/** ブロックされたユーザー名 */
	username?: string;
	/** ブロックされたユーザーニックネーム */
	userNickname?: string;
	/** ブロックされたユーザーアイコン */
	avatar?: string;
	/** ブロックされたTAG */
	tag?: VideoTag;
};

/**
 * ブロックリスト取得のリクエストレスポンス
 */
export type GetBlockListResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ブラックリスト数 */
	blocklistCount?: number;
	/** ブロックユーザーリスト */
	result?: GetBlocklistResult[];
};

/**
 * コンテンツがブロックされているか確認するリクエストペイロード
 */
export type CheckContentIsBlockedRequestDto = {
	/** チェックするコンテンツ */
	content: string;
};

/**
 * タグがブロックされているか確認するリクエストペイロード
 */
export type CheckTagIsBlockedRequestDto = {
	/** チェックするタグID */
	tagId: number[];
};

/**
 * ユーザーがブロックされているか確認するリクエストペイロード
 */
export type CheckUserIsBlockedRequestDto = {
	/** チェックするユーザーのUID */
	uid: number;
};

/**
 * 他のユーザーにブロックされているか検出するリクエストペイロード
 */
export type CheckIsBlockedByOtherUserRequestDto = {
	/** チェックするコンテンツ */
	targetUid: number;
};

/** 他のユーザーにブロックされているか検出するリクエストのレスポンス */
export type CheckIsBlockedByOtherUserResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
};
/**
 * ブロックされているか確認するリクエストのレスポンス
 */
export type CheckIsBlockedResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
};

/**
 * ユーザーがブロックされているか確認するリクエストのレスポンス
 */
export type CheckUserIsBlockedResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
	/** 非表示にされているか */
	isHidden: boolean;
};
