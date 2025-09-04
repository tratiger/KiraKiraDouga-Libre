import { Schema } from 'mongoose'

/**
 * ユーザー閲覧履歴データ
 */
class BrowsingHistorySchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID - 空でないこと */
		UUID: { type: String, required: true },
		/** ユーザーのUID - 空でないこと */
		uid: { type: Number, required: true },
		/** 閲覧コンテンツのタイプ、例えばvideo、photoなど - 空でないこと */
		category: { type: String, required: true },
		/** 閲覧コンテンツの一意のID - 空でないこと */
		id: { type: String, required: true },
		/** 閲覧のアンカー。動画の場合は再生時間、アルバムの場合は前回閲覧したn番目の写真など。互換性のためにStringを使用 */
		anchor: { type: String },
		/** 最終閲覧日時。ユーザー履歴ページのソート順。原則として下のシステム専用最終編集日時と同じ - 空でないこと */
		lastUpdateDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'browsing-history'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const BrowsingHistorySchema = new BrowsingHistorySchemaFactory()
