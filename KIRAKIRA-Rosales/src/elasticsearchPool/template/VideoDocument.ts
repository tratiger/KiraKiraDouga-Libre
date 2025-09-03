const VideoTagNameDocument = {
	/** TAG名 - 空でないこと */
	name: { type: String, required: true as const },
	/** この言語のデフォルト名かどうか - 空でないこと */
	isDefault: { type: Boolean, required: true as const },
	/** TAGの元の名前かどうか - 空でないこと */
	isOriginalTagName: { type: Boolean, required: false as const },
}

/**
 * 各言語に対応するTAG名
 */
const MultilingualVideoTagNameDocument = {
	/** TAGの言語 - 空でないこと、原則としてユニークであるべき // WARN: サブドキュメントにユニークインデックスを指定できないため、ビジネスロジックで重複を回避し、検証を行う必要があります */
	lang: { type: String, required: true as const },
	/** 各言語に対応するTAG名 */
	tagName: { type: [VideoTagNameDocument], required: true as const },
}

/**
 * 動画TAGデータ
 */
const VideoTagDocument = {
	/** Elasticsearchインデックステンプレート */
	schema: {
		/** TAG ID - 空でないこと、ユニーク */
		tagId: { type: Number, required: true as const },
		/** 各言語に対応するTAG名 */
		tagNameList: { type: [MultilingualVideoTagNameDocument], required: true as const },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true as const },
	},
	/** Elasticsearchインデックス名 */
	indexName: 'search-kirakira-video-tag-elasticsearch',
}

/**
 * 動画データ
 */
export const VideoDocument = {
	/** Elasticsearchインデックステンプレート */
	schema: {
		/** 動画タイトル - 空でないこと */
		title: { type: String, required: true as const },
		/** 動画説明 */
		description: { type: String, required: false as const },
		/** KVID 動画ID - 空でないこと */
		kvid: { type: Number, required: true as const },
		/** 動画カテゴリ - 空でないこと */
		videoCategory: { type: String, required: true as const },
		/** 動画TAG - 空でないこと */
		videoTagList: { type: [VideoTagDocument], required: true as const },
	},
	/** Elasticsearchインデックス名 */
	indexName: 'search-kirakira-video-elasticsearch',
}
