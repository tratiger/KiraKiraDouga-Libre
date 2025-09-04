import { Schema } from 'mongoose'

/**
 * 自動インクリメントシーケンス
 */
export class SequenceValueSchemaFactory {
	schema = {
		/** 自動インクリメント項目、例: videoId */
		_id: { type: String, unique: true, required: true },
		/** 自動インクリメントの値 */
		sequenceValue: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'sequence-value'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}

export const SequenceValueSchema = new SequenceValueSchemaFactory()
