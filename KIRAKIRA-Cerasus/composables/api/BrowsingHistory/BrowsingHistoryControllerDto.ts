import type { ThumbVideoResponseDto } from "../Video/VideoControllerDto";

/**
 * 閲覧したコンテンツの種類
 */
export type BrowsingHistoryCategory = "video" | "photo" | "comment";

/**
 * ユーザーの閲覧履歴
 */
type BrowsingHistory = {
	/** ユーザーのUUID - 空でないこと */
	uuid: string;
	/** 閲覧したコンテンツの種類、例えば video, photo など - 空でないこと */
	category: BrowsingHistoryCategory;
	/** 閲覧したコンテンツの一意のID - 空でないこと */
	id: string;
	/** 閲覧した位置のアンカー、動画の場合は再生時間、アルバムの場合は前回閲覧したn枚目の写真など、互換性のためにStringを使用 */
	anchor?: string;
};

/**
 * ユーザーの閲覧履歴を作成するリクエストのペイロード
 */
export type CreateOrUpdateBrowsingHistoryRequestDto = BrowsingHistory & {};

/**
 * ユーザーの閲覧履歴を作成するリクエストのレスポンス
 */
export type CreateOrUpdateBrowsingHistoryResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたこの閲覧履歴データを返します */
	result?: BrowsingHistory;
};

/**
 * ユーザーの閲覧履歴を取得するリクエストのペイロード
 * 主にフィルタリング条件を格納するために使用します
 */
export type GetUserBrowsingHistoryWithFilterRequestDto = {
	/** フィルタリング条件 - 動画のタイトル */
	videoTitle?: string;
};

/**
 * ユーザーの閲覧履歴を取得するリクエストのレスポンス、すべてまたはフィルタリングされたユーザーの閲覧履歴
 */
export type GetUserBrowsingHistoryWithFilterResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたこの閲覧履歴データを返します */
	result?: (
		& BrowsingHistory
		& {
			/** 最終更新日時 */
			lastUpdateDateTime: number;
		}
		& ThumbVideoResponseDto["videos"][number])[];
};
