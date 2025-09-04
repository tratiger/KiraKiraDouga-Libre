/**
 * 動画タグ名
 */
type VideoTagNameSchema = {
	/** タグ名 - 空でないこと */
	name: string;
	/** この言語のデフォルト名かどうか - 空でないこと */
	isDefault: boolean;
	/** タグの元の名前かどうか - 空でないこと */
	isOriginalTagName: boolean;
};

/**
 * 各言語に対応するタグ名
 */
type MultilingualVideoTagNameSchema = {
	/** タグの言語 - 空でないこと、原則として一意である必要があります // WARN: サブドキュメントの一意のインデックスを指定できないため、ビジネスロジックで回避および検証する必要があります */
	lang: string;
	/** 各言語に対応するタグ名 */
	tagName: VideoTagNameSchema[];
};

/**
 * 動画タグ作成リクエストのペイロード
 */
export type CreateVideoTagRequestDto = {
	/** 各言語に対応するタグ名 */
	tagNameList: MultilingualVideoTagNameSchema[];
};

/**
 * 動画タグのタイプ
 */
export type VideoTag = {
	/** タグID */
	tagId: number;
	/** 各言語に対応するタグ名 */
	tagNameList: MultilingualVideoTagNameSchema[];
};

/**
 * 動画タグ作成リクエストのレスポンス
 */
export type CreateVideoTagResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたこのタグの情報を返します */
	result?: VideoTag;
};

/**
 * 動画タグ検索リクエストのペイロード
 */
export type SearchVideoTagRequestDto = {
	/** タグ名検索キーワード */
	tagNameSearchKey: string;
};

/**
 * 動画タグ検索リクエストのレスポンス
 */
export type SearchVideoTagResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、一致したタグ情報を返します */
	result?: VideoTag[];
};

/**
 * 動画タグIDに基づいて動画を検索するリクエストのペイロード
 */
export type GetVideoTagByTagIdRequestDto = {
	/** タグID */
	tagId: number[];
};

/** 動画タグIDで動画を取得するリクエストのレスポンス */
export type GetVideoTagByTagIdResponseDto = SearchVideoTagResponseDto & {};
