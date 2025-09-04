import type { ThumbVideoResponseDto } from "../Video/VideoControllerDto.js";

// marker.ts
const ONLY_IN_TS_FILE = Symbol("ONLY_IN_TS_FILE"); // WARN: DO NOT RENAME THIS FILE AS `*.d.ts`
void ONLY_IN_TS_FILE;

/** フォローの種類 */
export enum FOLLOWING_TYPE {
	/** 動画ページやユーザーページなどのフォローボタンによる通常のフォロー */
	normal = "normal",
	/** 自動フォロー */ // MEME: really?
	auto = "auto",
	/** イベントページ経由のフォロー */
	event = "event",
	/** イベントページ経由の自動一括フォロー */
	eventAutoBatch = "eventAutoBatch",
}

/**
 * ユーザーがクリエイターをフォローするリクエストペイロード
 */
export type FollowingUploaderRequestDto = {
	/** フォローされる人のUID */
	followingUid: number;
};

/**
 * ユーザーがクリエイターをフォローするリクエストのレスポンス
 */
export type FollowingUploaderResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * ユーザーがクリエイターのフォローを解除するリクエストペイロード
 */
export type UnfollowingUploaderRequestDto = {
	/** フォローを解除する人のUID */
	unfollowingUid: number;
};

/**
 * ユーザーがクリエイターのフォローを解除するリクエストのレスポンス
 */
export type UnfollowingUploaderResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * フィードグループ
 */
type FeedGroup = {
	/** フィードグループのUUID - 空でないこと */
	feedGroupUuid: string;
	/** フィードグループの名称 - 空でないこと */
	feedGroupName: string;
	/** フィードグループ作成者のUUID - 空でないこと */
	feedGroupCreatorUuid: string;
	/** フィードグループ内のユーザー - 空でないこと */
	uuidList: string[];
	/** フィードグループのカスタムカバー */
	customCover?: string;
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: number;
	/** システム専用フィールド - 作成日時 - 空でないこと */
	createDateTime: number;
};

/**
 * フィードグループ作成のリクエストペイロード
 */
export type CreateFeedGroupRequestDto = {
	/** フィードグループの名前 */
	feedGroupName: string;
	/** フィードグループ作成時に含めるUIDリスト */
	withUidList?: number[];
	/** フィードグループ作成時に含めるカスタムカバーURL */
	withCustomCoverUrl?: string;
};

/**
 * フィードグループ作成のリクエストレスポンス
 */
export type CreateFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎます */
	tooManyUidInOnce: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 特定のフィードグループにUIDを追加するリクエストペイロード
 */
export type AddNewUid2FeedGroupRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
	/** 追加するUIDリスト */
	uidList: number[];
};

/**
 * 特定のフィードグループにUIDを追加するリクエストのレスポンス
 */
export type AddNewUid2FeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎます */
	tooManyUidInOnce: boolean;
	/** フィードグループ内のUIDが多すぎます */
	isOverload: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 修正が成功した場合、フィードグループを返します */
	feedGroupResult?: FeedGroup;
};

/**
 * 特定のフィードグループからUIDを削除するリクエストペイロード
 */
export type RemoveUidFromFeedGroupRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
	/** 削除するUIDリスト */
	uidList: number[];
};

/**
 * 特定のフィードグループからUIDを削除するリクエストのレスポンス
 */
export type RemoveUidFromFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎます */
	tooManyUidInOnce: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 修正が成功した場合、フィードグループを返します */
	feedGroupResult?: FeedGroup;
};

/**
 * フィードグループ削除のリクエストペイロード
 */
export type DeleteFeedGroupRequestDto = {
	/** 削除するフィードグループのUUID */
	feedGroupUuid: string;
};

/**
 * フィードグループ削除のリクエストレスポンス
 */
export type DeleteFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * フィードグループカバー画像アップロード用の署名付きURL取得のリクエストレスポンス
 */
export type GetFeedGroupCoverUploadSignedUrlResponseDto = {
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
 * フィードグループ削除のリクエストペイロード
 */
export type CreateOrEditFeedGroupInfoRequestDto = {
	/** 削除するフィードグループのUUID */
	feedGroupUuid: string;
	/** フィードグループの名前 */
	feedGroupName?: string;
	/** フィードグループ作成時に含めるカスタムカバーURL */
	feedGroupCustomCoverUrl?: string;
};

/***
 * フィードグループ情報作成または更新のリクエストレスポンス
 */
export type CreateOrEditFeedGroupInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、フィードグループを返します */
	feedGroupResult?: FeedGroup;
};

/**
 * 管理者によるフィードグループ情報更新審査のリクエストペイロード
 */
export type AdministratorApproveFeedGroupInfoChangeRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
};

/**
 * 管理者によるフィードグループ情報更新審査のリクエストレスポンス
 */
export type AdministratorApproveFeedGroupInfoChangeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * 管理者によるフィードグループ削除のリクエストペイロード
 */
export type AdministratorDeleteFeedGroupRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
};

/**
 * 管理者によるフィードグループ削除のリクエストレスポンス
 */
export type AdministratorDeleteFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * フィードグループ取得のリクエストレスポンス
 */
export type GetFeedGroupListResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 結果 */
	result?: FeedGroup[];
};

/**
 * フィードコンテンツ取得のリクエストペイロード
 */
export type GetFeedContentRequestDto = {
	feedGroupUuid?: string;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * フィードコンテンツ取得のリクエストレスポンス
 */
export type GetFeedContentResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** ユーザーが他のユーザーをフォローしていないか、またはフィードグループにユーザーがいないか */
	isLonely: false | {
		/** 他のユーザーをフォローしていない */
		noFollowing: boolean;
	} | {
		/** フィードグループにユーザーがいない */
		noUserInFeedGroup: boolean;
	};
	/** リクエスト結果 */
	result?: {
		/** コンテンツ数 */
		count: number;
		/** 内容 */
		content: ThumbVideoResponseDto["videos"];
	};
};
