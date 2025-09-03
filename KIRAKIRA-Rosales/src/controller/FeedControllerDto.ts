import { ThumbVideoResponseDto } from "./VideoControllerDto.js"

// marker.ts
const ONLY_IN_TS_FILE = Symbol("ONLY_IN_TS_FILE") // WARN: DO NOT RENAME THIS FILE AS `*.d.ts`
void ONLY_IN_TS_FILE

/** フォローのタイプ */
export enum FOLLOWING_TYPE {
	/** 動画ページやユーザーページなどのフォローボタンによる通常のフォロー */
	normal = 'normal',
	/** 自動フォロー */ // MEME: really?
	auto = 'auto',
	/** イベントページ経由でのフォロー */
	event = 'event',
	/** イベントページ経由での自動一括フォロー */
	eventAutoBatch = 'eventAutoBatch',
}

/**
 * ユーザーがクリエイターをフォローするリクエストペイロード
 */
export type FollowingUploaderRequestDto = {
	/** フォローされる人のUID */
	followingUid: number;
};

/**
 * ユーザーがクリエイターをフォローするレスポンス
 */
export type FollowingUploaderResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
};

/**
 * ユーザーがクリエイターのフォローを解除するリクエストペイロード
 */
export type UnfollowingUploaderRequestDto = {
	/** フォローを解除される人のUID */
	unfollowingUid: number;
};

/**
 * ユーザーがクリエイターのフォローを解除するレスポンス
 */
export type UnfollowingUploaderResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
};

/**
 * フィードグループ
 */
type FeedGroup = {
	/** フィードグループのUUID - 空でないこと */
	feedGroupUuid: string,
	/** フィードグループ名 - 空でないこと */
	feedGroupName: string,
	/** フィードグループ作成者のUUID - 空でないこと */
	feedGroupCreatorUuid: string,
	/** フィードグループ内のユーザー - 空でないこと */
	uuidList: string[],
	/** フィードグループのカスタムカバー */
	customCover?: string,
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: number,
	/** システム専用フィールド - 作成日時 - 空でないこと */
	createDateTime: number,
}

/**
 * フィードグループ作成リクエストペイロード
 */
export type CreateFeedGroupRequestDto = {
	/** フィードグループ名 */
	feedGroupName: string;
	/** フィードグループ作成時に含めるUIDリスト */
	withUidList?: number[];
	/** フィードグループ作成時に含めるカスタムカバーURL */
	withCustomCoverUrl?: string;
};

/**
 * フィードグループ作成レスポンス
 */
export type CreateFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎる */
	tooManyUidInOnce: boolean;
	/** 追加メッセージ */
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
}

/**
 * 特定のフィードグループにUIDを追加するレスポンス
 */
export type AddNewUid2FeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎる */
	tooManyUidInOnce: boolean;
	/** フィードグループ内のUIDが多すぎる */
	isOverload: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 変更が成功した場合、フィードグループを返す */
	feedGroupResult?: FeedGroup
}

/**
 * フィードグループからUIDを削除するリクエストペイロード
 */
export type RemoveUidFromFeedGroupRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
	/** 削除するUIDリスト */
	uidList: number[];
}

/**
 * フィードグループからUIDを削除するレスポンス
 */
export type RemoveUidFromFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 一度に追加されたUIDが多すぎる */
	tooManyUidInOnce: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 変更が成功した場合、フィードグループを返す */
	feedGroupResult?: FeedGroup
};

/**
 * フィードグループ削除リクエストペイロード
 */
export type DeleteFeedGroupRequestDto = {
	/** 削除するフィードグループのUUID */
	feedGroupUuid: string;
}

/**
 * フィードグループ削除レスポンス
 */
export type DeleteFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
* フィードグループカバー画像アップロード用署名付きURL取得レスポンス
*/
export type GetFeedGroupCoverUploadSignedUrlResponseDto = {
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
 * フィードグループ削除リクエストペイロード
 */
export type CreateOrEditFeedGroupInfoRequestDto = {
	/** 削除するフィードグループのUUID */
	feedGroupUuid: string;
	/** フィードグループ名 */
	feedGroupName?: string;
	/** フィードグループ作成時に含めるカスタムカバーURL */
	feedGroupCustomCoverUrl?: string;
}

/***
 * フィードグループ情報作成・更新レスポンス
 */
export type CreateOrEditFeedGroupInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、フィードグループを返す */
	feedGroupResult?: FeedGroup
}

/**
 * 管理者によるフィードグループ情報更新レビュー承認リクエストペイロード
 */
export type AdministratorApproveFeedGroupInfoChangeRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
}

/**
 * 管理者によるフィードグループ情報更新レビュー承認レスポンス
 */
export type AdministratorApproveFeedGroupInfoChangeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 管理者によるフィードグループ削除リクエストペイロード
 */
export type AdministratorDeleteFeedGroupRequestDto = {
	/** フィードグループのUUID */
	feedGroupUuid: string;
}

/**
 * 管理者によるフィードグループ削除レスポンス
 */
export type AdministratorDeleteFeedGroupResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * フィードグループ取得レスポンス
 */
export type GetFeedGroupListResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 結果 */
	result?: FeedGroup[];
}

/**
 * フィードコンテンツ取得リクエストペイロード
 */
export type GetFeedContentRequestDto = {
	feedGroupUuid?: string;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
}

/**
 * フィードコンテンツ取得レスポンス
 */
export type GetFeedContentResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ユーザーが誰もフォローしていない、またはフィードグループにユーザーがいないか */
	isLonely: false | {
		/** 誰もフォローしていない */
		noFollowing: boolean;
	} | {
		/** フィードグループにユーザーがいない */
		noUserInFeedGroup: boolean;
	};
	/** リクエスト結果 */
	result?: {
		/** コンテンツ数 */
		count: number;
		/** コンテンツ */
		content: ThumbVideoResponseDto['videos'];
	};
}
