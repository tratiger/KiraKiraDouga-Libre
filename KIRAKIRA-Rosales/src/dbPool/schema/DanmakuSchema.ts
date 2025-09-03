import { Schema } from 'mongoose'

/**
 * 弾幕データ
 */
class DanmakuSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** KVIDビデオID - 空でないこと */
		videoId: { type: Number, required: true },
		/** 弾幕送信者のUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		UUID: { type: String, required: true },
		/** 弾幕送信者のUID - 空でないこと */
		uid: { type: Number, required: true },
		/** 弾幕送信のタイミング、単位：秒（小数をサポート） - 空でないこと */
		time: { type: Number, required: true },
		/** 弾幕テキスト - 空でないこと */
		text: { type: String, required: true },
		/** 弾幕の色 - 空でないこと */
		color: { type: String, required: true },
		/** 弾幕のフォントサイズ - 空でないこと */ /** バックエンドでは3つのデータのみを保存し、フロントエンドでタイプに応じてCSSで利用可能なピクセルにマッピングします */ /** デフォルトは 'medium' —— 中サイズ */
		fontSize: { type: String, enum: ['small', 'medium', 'large'], required: true, default: 'medium' },
		/** 弾幕の発射モード - 空でないこと */ /** デフォルトは 'rtl' —— 右から左へ発射 */
		mode: { type: String, enum: ['ltr', 'rtl', 'top', 'bottom'], required: true, default: 'rtl' },
		/** 虹色弾幕を有効にするか - 空でないこと */ /** デフォルトは false —— 有効にしない */
		enableRainbow: { type: Boolean, required: false, default: false },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'danmaku'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}

export const DanmakuSchema = new DanmakuSchemaFactory()
