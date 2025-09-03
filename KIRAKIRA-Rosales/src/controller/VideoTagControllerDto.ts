/**
 * 動画TAG名
 */
type VideoTagNameSchema = {
	/** TAG名 - 空でないこと */
	name: string;
	/** この言語のデフォルト名かどうか - 空でないこと */
	isDefault: boolean;
	/** TAGの元の名前かどうか - 空でないこと */
	isOriginalTagName: boolean;
}

/**
 * 各言語に対応するTAG名
 */
type MultilingualVideoTagNameSchema = {
	/** TAGの言語 - 空でないこと、原則としてユニークであるべき // WARN: サブドキュメントにユニークインデックスを指定できないため、ビジネスロジックで重複を回避し、検証を行う必要があります */
	lang: string;
	/** 各言語に対応するTAG名 */
	tagName: VideoTagNameSchema[];
}

/**
 * 動画TAG作成リクエストペイロード
 */
export type CreateVideoTagRequestDto = {
	/** 各言語に対応するTAG名 */
	tagNameList: MultilingualVideoTagNameSchema[];
}

/**
 * 動画TAGの型
 */
export type VideoTag = {
	/** TAG ID */
	tagId: number;
	/** 各言語に対応するTAG名 */
	tagNameList: MultilingualVideoTagNameSchema[];
}

/**
 * 動画TAG作成レスポンス
 */
export type CreateVideoTagResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成されたTAGの情報を返す */
	result?: VideoTag;
}


/**
 * 動画TAG検索リクエストペイロード
 */
export type SearchVideoTagRequestDto = {
	/** TAG名検索キーワード */
	tagNameSearchKey: string;
}

/**
 * 動画TAG検索レスポンス
 */
export type SearchVideoTagResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、一致したTAG情報を返す */
	result?: VideoTag[];
}

/**
 * 動画TAG IDによる動画検索リクエストペイロード
 */
export type GetVideoTagByTagIdRequestDto = {
	/** TAG ID */
	tagId: number[];
}

/** 動画TAG IDによる動画取得レスポンス */
export type GetVideoTagByTagIdResponseDto = SearchVideoTagResponseDto & {}
