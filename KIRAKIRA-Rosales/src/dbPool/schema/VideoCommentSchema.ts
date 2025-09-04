import { Schema } from 'mongoose'

/**
 * 親コメントまたは子コメントに保存されている子コメントID
 */
const VideoSubCommentIdSchema = {
	/** コメントのルート - 空でないこと */ /** 例: 1.2.3（動画1のコメント2への3番目の返信） */
	commentRoute: { type: String, required: true },
	/** コメントID - 空でないこと */
	upvoteCount: { type: String, default: 0, required: true },
	/** コメント階層 - 空でないこと */
	commentIndex: { type: Number, required: true },
}

// /**
//  * 视频的子评论，不止是一级子评论
//  */
// export const VideoSubCommentSchema = {
// 	/** MongoDB Schema */
// 	schema: {
// 		/** 评论的路由 - 非空 */ /** 如：1.2.3（第一号视频的第二个评论的第三个子回复） */
// 		commentRoute: { type: String, required: true },
// 		/** 父评论 ID */
// 		parentCommentsId: { type: String, required: true },
// 		/** KVID 视频 ID - 非空 */
// 		videoId: { type: Number, required: true },
// 		/** 评论发送者的用户的 UID - 非空 */
// 		uid: { type: Number, required: true },
// 		/** 发送评论的时间 - 非空 */
// 		time: { type: Number, required: true },
// 		/** 评论正文 - 非空 */
// 		text: { type: String, required: true },
// 		/** 评论点赞数 - 非空 */ /** 默认：0 —— 没人点赞 ＞﹏＜ */
// 		upvoteCount: { type: Number, default: 0, required: true },
// 		/** 评论点踩数 - 非空 */ /** 默认：0 —— 没有反对票！ */
// 		downvote: { type: Number, default: 0, required: true },
// 		/** 评论楼层数 - 非空 */
// 		commentIndex: { type: Number, required: true },
// 		/** 子评论 */
// 		subComments: [VideoSubCommentIdSchema],
// 		/** 该评论的下一级子评论数量 */
// 		subCommentsCount: { type: Number, required: true },
// 		/** 系统专用字段-最后编辑时间 - 非空 */
// 		editDateTime: { type: Number, required: true },
// 	},
// 	/** MongoDB 集合名 */
// 	collectionName: 'video-sub-comment',
// }

/**
 * 動画コメントデータ
 */
class VideoCommentSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** コメントのルート - 空でないこと - ユニーク */ /** 例: 1.2.3（動画1のコメント2への3番目の返信） */
		commentRoute: { type: String, required: true, unique: true },
		/** KVID 動画ID - 空でないこと */
		videoId: { type: Number, required: true },
		/** コメント投稿者のUUID - 空でないこと */
		UUID: { type: String, required: true },
		/** コメント投稿者のUID - 空でないこと */
		uid: { type: Number, required: true },
		/** コメント投稿日時 - 空でないこと */
		emitTime: { type: Number, required: true },
		/** コメント本文 - 空でないこと */
		text: { type: String, required: true },
		/** コメント高評価数 - 空でないこと */ /** デフォルト: 0 —— まだ誰も「いいね」していません＞﹏＜ */
		upvoteCount: { type: Number, default: 0, required: true },
		/** コメント低評価数 - 空でないこと */ /** デフォルト: 0 —— 反対票はありません！ */
		downvoteCount: { type: Number, default: 0, required: true },
		/** コメント階層 - 空でないこと */
		commentIndex: { type: Number, required: true },
		/** 子コメント */
		subComments: [VideoSubCommentIdSchema],
		/** このコメントの次の階層の子コメント数 */
		subCommentsCount: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'video-comment'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const VideoCommentSchema = new VideoCommentSchemaFactory()

/**
 * 削除された動画コメントデータ
 */
class RemovedVideoCommentSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** 元の動画コメントデータコレクション */
		...VideoCommentSchema.schema,
		/** 操作者のUUID - 空でないこと */
		_operatorUUID_: { type: String, required: true },
		/** 操作者のUID - 空でないこと */
		_operatorUid_: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'removed-video-comment'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const RemovedVideoCommentSchema = new RemovedVideoCommentSchemaFactory()

/**
 * 動画コメントの高評価
 */
class VideoCommentUpvoteSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** KVID 動画ID - 空でないこと */
		videoId: { type: Number, required: true },
		/** コメントID - 空でないこと */
		commentId: { type: String, required: true },
		/** 高評価したユーザーのUUID - 空でないこと */
		UUID: { type: String, required: true },
		/** 高評価したユーザーのUID - 空でないこと */
		uid: { type: Number, required: true },
		/** 高評価無効フラグ（ユーザーが高評価を取り消し） */
		invalidFlag: { type: Boolean, required: true },
		/** システム専用フィールド - 削除フラグ - 空でないこと */
		deleteFlag: { type: Boolean, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'video-comment-upvote'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const VideoCommentUpvoteSchema = new VideoCommentUpvoteSchemaFactory()


/**
 * 動画コメントの低評価
 */
class VideoCommentDownvoteSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** KVID 動画ID - 空でないこと */
		videoId: { type: Number, required: true },
		/** コメントID - 空でないこと */
		commentId: { type: String, required: true },
		/** 低評価したユーザーのUUID - 空でないこと */
		UUID: { type: String, required: true },
		/** 低評価したユーザーのUID - 空でないこと */
		uid: { type: Number, required: true },
		/** 低評価無効フラグ（ユーザーが低評価を取り消し） */
		invalidFlag: { type: Boolean, required: true },
		/** システム専用フィールド - 削除フラグ - 空でないこと */
		deleteFlag: { type: Boolean, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'video-comment-downvote'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}

export const VideoCommentDownvoteSchema = new VideoCommentDownvoteSchemaFactory()
