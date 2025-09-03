/**
 * 閲覧コンテンツのタイプ
 */
export type BrowsingHistoryCategory = 'video' | 'photo' | 'comment'

/**
 * お気に入り
 */
type Favorites = {
	/** お気に入りID - 空でないこと - ユニーク */
	favoritesId: number;
	/** お気に入り作成者 - 空でないこと */
	creator: number;
	/** その他のお気に入りメンテナー */
	editor?: number[];
	/** お気に入りタイトル - 空でないこと */
	favoritesTitle: string;
	/** お気に入り紹介 */
	favoritesBio?: string;
	/** お気に入りカバー */
	favoritesCover?: string;
	/** お気に入りの公開設定 - 空でないこと - 1: 公開, 0: フォロワーのみ, -1: 非公開 */
	favoritesVisibility: number;
	/** お気に入り作成日時 - 空でないこと */
	favoritesCreateDateTime: number;
}

/**
 * お気に入り作成リクエストペイロード
 */
export type CreateFavoritesRequestDto = {
	/** お気に入りタイトル - 空でないこと */
	favoritesTitle: string;
	/** お気に入り紹介 */
	favoritesBio?: string;
	/** お気に入りカバー */
	favoritesCover?: string;
	/** お気に入りの公開設定 - 空でないこと */
	favoritesVisibility: number;
}

/**
 * お気に入り作成レスポンス
 */
export type CreateFavoritesResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成されたお気に入りデータを返す */
	result?: Favorites;
}

/**
 * 特定ユーザーのお気に入り取得
 */
export type GetFavoritesResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、ユーザーの全てのお気に入りを返す */
	result?: Favorites[];
}
