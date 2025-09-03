import { ThumbVideoResponseDto } from './VideoControllerDto.js'

/**
 * 閲覧コンテンツのタイプ
 */
export type BrowsingHistoryCategory = 'video' | 'photo' | 'comment'

/**
 * ユーザーの閲覧履歴
 */
type BrowsingHistory = {
	/** ユーザーのUUID - 空でないこと */
	uuid: string;
	/** 閲覧コンテンツのタイプ（例: video, photoなど） - 空でないこと */
	category: BrowsingHistoryCategory;
	/** 閲覧コンテンツのユニークID - 空でないこと */
	id: string;
	/** 閲覧位置のアンカー。動画の場合は再生時間、アルバムの場合は前回閲覧したn番目の写真など。互換性のためにStringを使用 */
	anchor?: string;
}

/**
 * ユーザー閲覧履歴作成リクエストペイロード
 */
export type CreateOrUpdateBrowsingHistoryRequestDto = BrowsingHistory & {}

/**
 * ユーザー閲覧履歴作成レスポンス
 */
export type CreateOrUpdateBrowsingHistoryResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成された閲覧履歴データを返す */
	result?: BrowsingHistory;
}

/**
 * ユーザー閲覧履歴取得リクエストペイロード
 * 主にフィルタリング条件として使用
 */
export type GetUserBrowsingHistoryWithFilterRequestDto = {
	/** フィルタリング条件 - 動画タイトル */
	videoTitle?: string;
}

/**
 * ユーザー閲覧履歴取得レスポンス（全件またはフィルタリング後）
 */
export type GetUserBrowsingHistoryWithFilterResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成された閲覧履歴データを返す */
	result?: (
		& BrowsingHistory
		& {
			/** 最終更新日時 */
			lastUpdateDateTime: number;
		}
		& ThumbVideoResponseDto['videos'][number])[];
}
