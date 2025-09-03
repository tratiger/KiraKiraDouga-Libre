import { Schema } from 'mongoose'

const VideoTagNameSchema = {
	/** TAG名 - 空でないこと */
	name: { type: String, required: true, unique: true },
	/** この言語のデフォルト名かどうか - 空でないこと */
	isDefault: { type: Boolean, required: true },
	/** TAGの元の名前かどうか - 空でないこと */
	isOriginalTagName: { type: Boolean, required: false },
}

/**
 * 各言語に対応するTAG名
 */
const MultilingualVideoTagNameSchema = {
	/** TAGの言語 - 空でないこと、原則としてユニークであるべき // WARN: サブドキュメントにユニークインデックスを指定できないため、ビジネスロジックで重複を回避し、検証を行う必要があります */
	lang: { type: String, required: true },
	/** 各言語に対応するTAG名 */
	tagName: { type: [VideoTagNameSchema], required: true },
}

/**
 * 動画TAGデータ
 */
class VideoTagSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** TAG ID - 空でないこと、ユニーク */
		tagId: { type: Number, required: true, unique: true },
		/** 各言語に対応するTAG名 */
		tagNameList: { type: [MultilingualVideoTagNameSchema], required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'video-tag'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const VideoTagSchema = new VideoTagSchemaFactory()
