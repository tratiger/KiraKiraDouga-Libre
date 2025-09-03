import { Schema } from 'mongoose'

/**
 * お気に入りデータ
 */
class FavoritesSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** お気に入りID - 空でないこと - ユニーク */
		favoritesId: { type: Number, required: true, unique: true },
		/** お気に入り作成者 - 空でないこと */
		creator: { type: Number, required: true },
		/** その他のお気に入りメンテナー */
		editor: { type: [Number] },
		/** お気に入りタイトル - 空でないこと */
		favoritesTitle: { type: String, required: true },
		/** お気に入り紹介 */
		favoritesBio: { type: String },
		/** お気に入りカバー */
		favoritesCover: { type: String },
		/** お気に入りの公開設定 - 空でないこと - 1: 公開, 0: フォロワーのみ, -1: 非公開 */
		favoritesVisibility: { type: Number, required: true },
		/** お気に入り作成日時 - 空でないこと */
		favoritesCreateDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'favorites'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const FavoritesSchema = new FavoritesSchemaFactory()

/**
 * お気に入り詳細データ
 */
class FavoritesDetailSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** お気に入りID - 空でないこと */
		favoritesListId: { type: Number, required: true },
		/** このコンテンツをお気に入りに追加したユーザー - 空でないこと */
		operator: { type: Number, required: true },
		/** コンテンツのタイプ、例: video, photo など - 空でないこと */
		category: { type: String, required: true },
		/** コンテンツのID - 空でないこと */
		id: { type: String, required: true },
		/** お気に入り追加日時 - 空でないこと */
		addedDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'favorites-detail'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const FavoritesDetailSchema = new FavoritesDetailSchemaFactory()
