import { Schema } from 'mongoose';

/**
 * ユーザーブロックデータ
 */
class BlockListSchemaFactory {
	schema = {
		/** ブラックリストタイプ - 空でないこと */
		type: { type: String, required: true },
		/** ブラックリストの内容 - 空でないこと */
		value: { type: String, required: true },
		/** 作成者UID - 空でないこと */
		operatorUid: { type: Number, required: true },
		/** 作成者UUID - 空でないこと */
		operatorUUID: { type: String, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true, index: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'blocklist'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const BlockListSchema = new BlockListSchemaFactory()

/**
 * ユーザーブロック解除データ
 */
class UnblockListSchemaFactory {
	schema = {
		/** 元のブロックリストのコレクション */
		...BlockListSchema.schema,
		/** 操作者UUID - 空でないこと */
		_operatorUUID_: { type: String, required: true },
		/** 操作者UID - 空でないこと */
		_operatorUid_: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'unblocklist'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UnblockListSchema = new UnblockListSchemaFactory()

