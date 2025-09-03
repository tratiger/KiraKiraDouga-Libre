import { Schema } from 'mongoose'

/**
 * パート別動画データ
 */
const VideoPartSchema = {
	/** パート動画の順序 - 空でないこと */
	id: { type: Number, required: true },
	/** 各パート動画のタイトル - 空でないこと */
	videoPartTitle: { type: String, required: true },
	/** 各パート動画のリンク - 空でないこと */
	link: { type: String, required: true },
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: { type: Number, required: true },
}

const VideoTagNameSchema = {
	/** TAG名 - 空でないこと */
	name: { type: String, required: true },
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
const VideoTagSchema = {
	/** TAG ID - 空でないこと、ユニーク */
	tagId: { type: Number, required: true },
	/** 各言語に対応するTAG名 */
	tagNameList: { type: [MultilingualVideoTagNameSchema], required: true },
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: { type: Number, required: true },
}

/**
 * 動画データ
 */
class VideoSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** KVID 動画ID - 空でないこと - ユニーク */
		videoId: { type: Number, unique: true, required: true },
		/** 動画タイトル - 空でないこと */
		title: { type: String, required: true },
		/** パート別動画データ - 空でないこと */
		videoPart: { type: [VideoPartSchema], required: true },
		/** カバー画像リンク - 空でないこと */
		image: { type: String, required: true },
		/** 動画アップロード日、タイムスタンプ形式 - 空でないこと */
		uploadDate: { type: Number, required: true },
		/** 動画再生数 - 空でないこと */
		watchedCount: { type: Number, required: true },
		/** 作成者UUID - 空でないこと */
		uploaderUUID: { type: String, required: true },
		/** 作成者UID - 空でないこと */
		uploaderId: { type: Number, required: true },
		/** 動画時間、単位ms - 空でないこと */
		duration: { type: Number, required: true },
		/** 動画説明 */
		description: String,
		/** 動画カテゴリ - 空でないこと */
		videoCategory: { type: String, required: true },
		/** 動画著作権 - 空でないこと */
		copyright: { type: String, required: true },
		/** 原作者 */
		originalAuthor: { type: String, required: false },
		/** 元動画リンク */
		originalLink: { type: String, required: false },
		/** フィードに投稿するかどうか - 空でないこと */
		pushToFeed: { type: Boolean, required: true },
		/** オリジナルとして宣言 - 空でないこと */
		ensureOriginal: { type: Boolean, required: true },
		/** 動画TAG - 空でないこと */
		videoTagList: { type: [VideoTagSchema], required: true },
		/** レビュー待ちかどうか - 空でないこと */
		pendingReview: { type: Boolean, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'video'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const VideoSchema = new VideoSchemaFactory()

/**
 * 削除済み動画データテーブル
 */
class RemovedVideoSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** 元の動画データコレクション */
		...VideoSchema.schema,
		/** 操作者UUID - 空でないこと */
		_operatorUUID_: { type: String, required: true },
		/** 操作者UID - 空でないこと */
		_operatorUid_: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'removed-video'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const RemovedVideoSchema = new RemovedVideoSchemaFactory()
