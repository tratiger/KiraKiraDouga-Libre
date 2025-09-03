import { Schema } from 'mongoose'

/**
 * ユーザーフォローデータ
 */
class FollowingSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** フォロワーのUUID - 空でないこと */
		followerUuid: { type: String, required: true },
		/** フォローされる人のUUID - 空でないこと */
		followingUuid: { type: String, required: true },
		/** フォロータイプ - 空でないこと - 'normal', 'auto', 'event', 'eventAutoBatch' から選択 */
		followingType: { type: String, enum: ['normal', 'auto', 'event', 'eventAutoBatch'],  required: true },
		/** お気に入りかどうか - 空でないこと */
		isFavorite: { type: Boolean, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		followingEditDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		followingCreateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'following'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const FollowingSchema = new FollowingSchemaFactory()

/**
 * ユーザーアンフォローデータ
 */
class UnfollowingSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** 元のフォローデータ、FollowingSchemaから継承 */
		...FollowingSchema.schema,
		/** アンフォロー理由タイプ - 空でないこと */
		unfollowingReasonType: { type: String, request: true },
		/** ユーザーがアンフォローした日時 - 空でないこと */
		unfollowingDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		unfollowingEditDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		unfollowingCreateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'unfollowing'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UnfollowingSchema = new UnfollowingSchemaFactory()

/**
 * ユーザーが作成したフィードグループ
 */
class FeedGroupSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** フィードグループのUUID - 空でないこと */
		feedGroupUuid: { type: String, required: true },
		/** フィードグループ名 - 空でないこと */
		feedGroupName: { type: String, required: true },
		/** フィードグループ作成者のUUID - 空でないこと */
		feedGroupCreatorUuid: { type: String, required: true },
		/** フィードグループ内のユーザー - 空でないこと */
		uuidList: { type: [String], required: true },
		/** フィードグループのカスタムカバー */
		customCover: { type: String },
		/** 前回のレビュー承認後にフィードグループ情報が変更されたかどうか - 空でないこと - ユーザー情報を初回作成および更新した場合にtrueに設定し、管理者がレビューを承認した際にfalseに変更する必要があります */
		isUpdatedAfterReview: { type: Boolean, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'feed-group'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const FeedGroupSchema = new FeedGroupSchemaFactory()
