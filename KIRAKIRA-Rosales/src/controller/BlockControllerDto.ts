import { type VideoTag } from "./VideoTagControllerDto.js";

/**
 * ユーザーブロックリクエストペイロード
 */
export type BlockUserByUidRequestDto = {
	/** ブロックされるユーザーのUID - 空でないこと */
	blockUid: number;
}

/**
 * ユーザーブロックレスポンス
 */
export type BlockUserByUidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザー非表示リクエストペイロード
 */
export type HideUserByUidRequestDto = {
	/** 非表示にされるユーザーのUID - 空でないこと */
	hideUid: number;
}

/**
 * ユーザー非表示レスポンス
 */
export type HideUserByUidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * タグブロックリクエストペイロード
 */
export type BlockTagRequestDto = {
	/* ブロックするタグID - 空でないこと */
	tagId: number;
}

/**
 * タグブロックレスポンス
 */
export type BlockTagResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * キーワードブロックリクエストペイロード
 */
export type BlockKeywordRequestDto = {
	/* ブロックするキーワード - 空でないこと */
	blockKeyword: string;
}

/**
 * キーワードブロックレスポンス
 */
export type BlockKeywordResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 正規表現追加リクエストペイロード
 */
export type AddRegexRequestDto = {
	/** 正規表現 - 空でないこと */
	blockRegex: string;
	/** 正規表現のフラグ - 空でないこと */
	// flag: string;
}

/**
 * 正規表現追加レスポンス
 */
export type AddRegexResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** ユーザーが安全でない正規表現を入力したか */
	unsafeRegex: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーブロック解除リクエストペイロード
 */
export type UnblockUserByUidRequestDto = {
	/** ブロックされるユーザーのUID - 空でないこと */
	blockUid: number;
}

/**
 * ユーザーブロック解除レスポンス
 */
export type UnblockUserByUidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザー表示リクエストペイロード
 */
export type ShowUserByUidRequestDto = {
	/** 表示するユーザーのUID - 空でないこと */
	hideUid: number;
}

/**
 * ユーザー表示レスポンス
 */
export type ShowUserByUidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * タグブロック解除リクエストペイロード
 */
export type UnblockTagRequestDto = {
	/* ブロックするタグID - 空でないこと */
	tagId: number;
}

/**
 * タグブロック解除レスポンス
 */
export type UnblockTagResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * キーワードブロック解除リクエストペイロード
 */
export type UnblockKeywordRequestDto = {
	/** ブロックするキーワード - 空でないこと */
	blockKeyword: string;
}

/**
 * 正規表現削除リクエストペイロード
 */
export type RemoveRegexRequestDto = {
	/** 正規表現 - 空でないこと */
	blockRegex: string;
	/** 正規表現のフラグ - 空でないこと */
	// flag: string;
}

/**
 * 正規表現削除レスポンス
 */
export type RemoveRegexResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * キーワードブロック解除レスポンス
 */
export type UnblockKeywordResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ブロックリスト取得リクエストペイロード
 */
export type GetBlockListRequestDto = {
	/** ブロックタイプ - 空でないこと */
	type: string;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
}

export type GetBlocklistResult = {
	/** ブロックタイプ */
	type: string;
	/** ブロック値 */
	value: string;
	/** ブロック日時 */
	createDateTime: number;
	/** ブロックされたユーザーのUID */
	uid?: number;
	/** ブロックされたユーザー名 */
	username?: string;
	/** ブロックされたユーザーのニックネーム */
	userNickname?: string;
	/** ブロックされたユーザーのアバター */
	avatar?: string;
	/** ブロックされたTAG */
	tag?: VideoTag;
}

/**
 * ブロックリスト取得レスポンス
 */
export type GetBlockListResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ブラックリスト数 */
	blocklistCount?: number;
	/** ブロックユーザーリスト */
	result?: GetBlocklistResult[];
}

/**
 * コンテンツがブロックされているか確認するリクエストペイロード
 */
export type CheckContentIsBlockedRequestDto = {
	/** 確認するコンテンツ */
	content: string;
}

/**
 * タグがブロックされているか確認するリクエストペイロード
 */
export type CheckTagIsBlockedRequestDto = {
	/** 確認するタグID */
	tagId: number[];
}

/**
 * ユーザーがブロックされているか確認するリクエストペイロード
 */
export type CheckUserIsBlockedRequestDto = {
	/** 確認するユーザーUID */
	uid: number;
}

/**
 * 他のユーザーにブロックされているか確認するリクエストペイロード
 */
export type CheckIsBlockedByOtherUserRequestDto = {
	/** 確認するコンテンツ */
	targetUid: number;
}

/** 他のユーザーにブロックされているか確認するレスポンス */
export type CheckIsBlockedByOtherUserResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
}
/**
 * ブロックされているか確認するレスポンス
 */
export type CheckIsBlockedResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
}

/**
 * ユーザーがブロックされているか確認するレスポンス
 */
export type CheckUserIsBlockedResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ブロックされているか */
	isBlocked: boolean;
	/** 非表示にされているか */
	isHidden: boolean;
}
