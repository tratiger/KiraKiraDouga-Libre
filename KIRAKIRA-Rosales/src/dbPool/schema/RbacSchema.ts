import { Schema } from 'mongoose'

/**
 * KIRAKIRA RBAC
 *
 * KIRAKIRA RBACの最小単位はAPIパスです。
 * * 1人のユーザーが複数のロールを持つことができます
 * * 1つのロールが複数のユーザーに対応できます
 * * 1つのロールが複数のAPIへのアクセス権を持つことができます
 * * 1つのAPIが複数のロールに対応できます
 */

/**
 * APIパスのリスト
 * KIRAKIRA RBACの最小単位であり、各APIインターフェースのアクセス権を正確に制御します
 */
class RbacApiSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** APIパスのUUID - 空でないこと - ユニーク */
		apiPathUuid: { type: String, required: true, unique: true },
		/** APIパス - 空でないこと - ユニーク */
		apiPath: { type: String, required: true, unique: true },
		/** APIパスのタイプ */
		apiPathType: { type: String },
		/** APIパスの色 */
		apiPathColor: { type: String },
		/** APIパスの説明 */
		apiPathDescription: { type: String },
		/** APIパス作成者 - 空でないこと */
		creatorUuid: { type: String, required: true },
		/** APIパス最終更新者 - 空でないこと */
		lastEditorUuid: { type: String, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'rbac-api-list'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const RbacApiSchema = new RbacApiSchemaFactory()

/**
 * RBACロール
 *
 * 1人のユーザーが複数のロールを持つことができます
 * 1つのロールが複数のユーザーに対応できます
 * 1つのロールが複数のAPIへのアクセス権を持つことができます
 * 1つのAPIが複数のロールに対応できます
 */
class RbacRoleSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ロールのUUID */
		roleUuid: { type: String, required: true, unique: true },
		/** ロール名 */
		roleName: { type: String, required: true, unique: true },
		/** ロールのタイプ */
		roleType: { type: String },
		/** ロールの色 */
		roleColor: { type: String },
		/** ロールの説明 */
		roleDescription: { type: String },
		/** このロールがアクセス権を持つAPIパス */
		apiPathPermissions: { type: [String], required: true },
		/** APIパス作成者 - 空でないこと */
		creatorUuid: { type: String, required: true },
		/** APIパス最終更新者 - 空でないこと */
		lastEditorUuid: { type: String, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'rbac-role'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const RbacRoleSchema = new RbacRoleSchemaFactory()
