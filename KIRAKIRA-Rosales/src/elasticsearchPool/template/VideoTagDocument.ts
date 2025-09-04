// /**
//  * 各言語に対応するTAG名
//  */
// export const VideoTagNameDocument = {
// 	/** TAGの言語 - 空でないこと、原則としてユニークであるべき // WARN: サブドキュメントにユニークインデックスを指定できないため、ビジネスロジックで重複を回避し、検証を行う必要があります */
// 	lang: { type: String, required: true as const },
// 	/** 各言語に対応するTAG名 */
// 	tagName: { type: String, required: true as const },
// }

// /**
//  * 動画TAGデータ
//  */
// export const VideoTagDocument = {
// 	/** Elasticsearchインデックステンプレート */
// 	schema: {
// 		/** TAG ID - 空でないこと、ユニーク */
// 		tagId: { type: Number, required: true as const },
// 		/** 各言語に対応するTAG名 */
// 		tagNameList: { type: [VideoTagNameDocument], required: true as const },
// 		/** システム専用フィールド - 最終編集日時 - 空でないこと */
// 		editDateTime: { type: Number, required: true as const },
// 	},
// 	/** Elasticsearchインデックス名 */
// 	indexName: 'search-kirakira-video-tag-elasticsearch',
// }
