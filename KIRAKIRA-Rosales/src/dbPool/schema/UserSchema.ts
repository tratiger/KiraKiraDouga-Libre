import { Schema } from 'mongoose'

/**
 * ユーザーセキュリティ認証コレクション
 */
class UserAuthSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと - ユニーク */
		UUID: { type: String, required: true, unique: true },
		/** ユーザーのUID - 空でないこと */
		uid: { type: Number, required: true, unique: true },
		/** ユーザーのメールアドレス - 空でないこと */
		email: { type: String, required: true, unique: true },
		/** すべて小文字のユーザーメールアドレス - 空でないこと */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 2回Bcryptハッシュ化されたパスワード - 空でないこと */
		passwordHashHash: { type: String, required: true },
		/** ユーザーのIDトークン - 空でないこと */
		token: { type: String, required: true },
		/** パスワードのヒント */
		passwordHint: String, // TODO: パスワードのヒントのセキュリティをどのように確保するか？
		// /** ユーザーのロール */
		// role: { type: String, required: true },
		/** ユーザーのロール */
		roles: { type: [String], required: true },
		/** ユーザーが有効にした2FAタイプ - 空でないこと */ /* email, totp, または none（未有効化）が可能です */
		authenticatorType: { type: String, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		userCreateDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-auth'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserAuthSchema = new UserAuthSchemaFactory()

/**
 * ユーザーの個人タグ
 */
const UserLabelSchema = {
	/** タグID - 空でないこと */
	id: { type: Number, required: true },
	/** タグ名 - 空でないこと */
	labelName: { type: String, required: true },
}

/**
 * ユーザーの連携アカウント
 */
const UserLinkedAccountsSchema = {
	/** 連携アカウントのプラットフォーム - 空でないこと - 例: "X" */
	platformId: { type: String, required: true },
	/** 連携アカウントのユニークID - 空でないこと */
	accountUniqueId: { type: String, required: true },
}

/**
 * ユーザーの連携ウェブサイト
 */
const UserWebsiteSchema = {
	/** 連携ウェブサイト名 - 空でないこと - 例: "私のホームページ" */
	websiteName: { type: String, required: true },
	/** 連携ウェブサイトURL - 空でないこと */
	websiteUrl: { type: String, required: true },
}

/**
 * ユーザー情報コレクション
 */
class UserInfoSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと - ユニーク */
		UUID: { type: String, required: true, unique: true },
		/** ユーザーのUID - 空でないこと - ユニーク */
		uid: { type: Number, required: true, unique: true },
		/** ユーザー名 - ユニーク */
		username: { type: String, unique: true },
		/** ニックネーム */
		userNickname: { type: String },
		/** アバターのリンク */
		avatar: { type: String },
		/** ユーザー背景画像のリンク */
		userBannerImage: { type: String },
		/** 自己紹介 */
		signature: { type: String },
		/** 性別、男性、女性、カスタム（文字列） */
		gender: { type: String },
		/** 個人タグ */
		label: { type: [UserLabelSchema], required: false },
		/** 誕生日 */
		userBirthday: { type: String },
		/** プロフィールページのMarkdown */
		userProfileMarkdown: { type: String },
		/** 連携アカウント */
		userLinkedAccounts: { type: [UserLinkedAccountsSchema], required: false },
		/** 連携ウェブサイト */
		userWebsite: { type: UserWebsiteSchema },
		/** 前回のレビュー承認後にユーザー情報が変更されたかどうか。初回作成時や更新時にtrueに設定し、管理者が承認した際にfalseに変更する必要があります */
		isUpdatedAfterReview: { type: Boolean, required: true },
		/** 編集者 */
		editOperatorUUID: { type: String },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-info'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserInfoSchema = new UserInfoSchemaFactory()

/**
 * 連携プラットフォームのプライバシー表示設定
 */
const UserLinkedAccountsVisibilitiesSettingSchema = {
	/** プラットフォームID - 空でないこと - 例: 'X', 'wechat', 'bilibili' */
	platformId: { type: String, required: true },
	/** 表示方法 - 空でないこと - 許可される値: {public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: { type: String, required: true },
}

/**
 * ユーザープライバシーデータの表示設定
 */
const UserPrivaryVisibilitiesSettingSchema = {
	/** プライバシーデータ項目ID - 空でないこと - 例: 'birthday', 'follow', 'fans' */
	privaryId: { type: String, required: true },
	/** 表示方法 - 空でないこと - 許可される値: {public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: { type: String, required: true },
}

/**
 * ユーザー個人設定コレクション
 */
class UserSettingsSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと - ユニーク */
		UUID: { type: String, required: true, unique: true },
		/** ユーザーのUID - 空でないこと - ユニーク */
		uid: { type: Number, required: true, unique: true },
		/** Cookieを有効にするか - 真偽値 */
		enableCookie: { type: Boolean },
		/** テーマ設定（テーマタイプ） - 選択可能な値: {light: ライト, dark: ダーク, system: システムに従う} */
		themeType: { type: String },
		/** テーマカラー - 文字列、カラーコード */
		themeColor: { type: String },
		/** カスタムテーマカラー - 文字列、#を含まない16進数カラーコード */
		themeColorCustom: { type: String },
		/** 壁紙（背景画像URL） - 文字列 */
		wallpaper: { type: String },
		/** カラーナビゲーションバーを有効にするか - 真偽値 */
		coloredSideBar: { type: Boolean },
		/** データ節約モード - 文字列, {standard: 標準, limit: 節約, preview: 先読み} */
		dataSaverMode: { type: String },
		/** 検索推薦を無効にする - 真偽値 */
		noSearchRecommendations: { type: Boolean },
		/** 関連動画の推薦を無効にする - 真偽値 */
		noRelatedVideos: { type: Boolean },
		/** 検索履歴を無効にする - 真偽値 */
		noRecentSearch: { type: Boolean },
		/** 視聴履歴を無効にする - 真偽値 */
		noViewHistory: { type: Boolean },
		/** 動画を新しいウィンドウで開くか - 真偽値 */
		openInNewWindow: { type: Boolean },
		/** 表示言語 - 文字列 */
		currentLocale: { type: String },
		/** タイムゾーン - 文字列 */
		timezone: { type: String },
		/** 単位系 - 文字列、メートル法、ヤード・ポンド法など */
		unitSystemType: { type: String },
		/** 開発者モードを有効にするか - 真偽値 */
		devMode: { type: Boolean },
		/** 実験的機能: 動的背景を有効にする - 真偽値 */
		showCssDoodle: { type: Boolean },
		/** 実験的機能: 直角モードを有効にする - 真偽値 */
		sharpAppearanceMode: { type: Boolean },
		/** 実験的機能: フラットモードを有効にする - 真偽値 */
		flatAppearanceMode: { type: Boolean },
		/** 連携ウェブサイトのプライバシー設定 */
		userWebsitePrivacySetting: { type: String },
		/** プライバシーデータの表示設定 */
		userPrivaryVisibilitiesSetting: { type: [UserPrivaryVisibilitiesSettingSchema] },
		/** 連携プラットフォームのプライバシー表示設定 */
		userLinkedAccountsVisibilitiesSetting: { type: [UserLinkedAccountsVisibilitiesSettingSchema] },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 // WARN 単語の複数形を使用しないでください。Mongooseが自動的に追加します！ */
	collectionName = 'user-setting'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserSettingsSchema = new UserSettingsSchemaFactory()

/**
 * ユーザー登録メール認証コード
 */
class UserVerificationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのメールアドレス - 空でないこと - ユニーク */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 認証コード - 空でないこと */
		verificationCode: { type: String, required: true },
		/** 認証コードの有効期限 - 空でないこと */
		overtimeAt: { type: Number, required: true, unique: true },
		/** 本日のリクエスト回数、乱用防止のため - 空でないこと */
		attemptsTimes: { type: Number, required: true },
		/** 最終リクエスト日時、乱用防止のため - 空でないこと */
		lastRequestDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-verification-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserVerificationCodeSchema = new UserVerificationCodeSchemaFactory()

/**
 * ユーザー招待コード
 */
class UserInvitationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** 招待コード生成ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		creatorUUID: { type: String, required: true },
		/** 招待コード生成ユーザー - 空でないこと */
		creatorUid: { type: Number, required: true },
		/** 招待コード - 空でないこと - ユニーク */
		invitationCode: { type: String, required: true, unique: true },
		/** 招待コード生成日時 - 空でないこと */
		generationDateTime: { type: Number, required: true },
		/** 招待コードが使用待ちとしてマークされているか - 空でないこと */
		isPending: { type: Boolean, required: true },
		/** 招待コードが使用不可としてマークされているか - 空でないこと */
		disabled: { type: Boolean, required: true },
		/** この招待コードを使用したユーザーのUUID */
		assigneeUUID: { type: String },
		/** この招待コードを使用したユーザー */
		assignee: { type: Number },
		/** 招待コード使用日時 */
		usedDateTime: { type: Number },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-invitation-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserInvitationCodeSchema = new UserInvitationCodeSchemaFactory()

/**
 * メールアドレス変更用の認証コード
 */
class UserChangeEmailVerificationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのメールアドレス - 空でないこと - ユニーク */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 認証コード - 空でないこと */
		verificationCode: { type: String, required: true },
		/** 認証コードの有効期限 - 空でないこと */
		overtimeAt: { type: Number, required: true, unique: true },
		/** 本日のリクエスト回数、乱用防止のため - 空でないこと */
		attemptsTimes: { type: Number, required: true },
		/** 最終リクエスト日時、乱用防止のため - 空でないこと */
		lastRequestDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-change-email-verification-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserChangeEmailVerificationCodeSchema = new UserChangeEmailVerificationCodeSchemaFactory()

/**
 * パスワード変更用の認証コード
 */
class UserChangePasswordVerificationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		UUID: { type: String, required: true },
		/** ユーザーID - 空でないこと */
		uid: { type: Number, required: true },
		/** ユーザーのメールアドレス - 空でないこと - ユニーク */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 認証コード - 空でないこと */
		verificationCode: { type: String, required: true },
		/** 認証コードの有効期限 - 空でないこと */
		overtimeAt: { type: Number, required: true, unique: true },
		/** 本日のリクエスト回数、乱用防止のため - 空でないこと */
		attemptsTimes: { type: Number, required: true },
		/** 最終リクエスト日時、乱用防止のため - 空でないこと */
		lastRequestDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-change-password-verification-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserChangePasswordVerificationCodeSchema = new UserChangePasswordVerificationCodeSchemaFactory()

/**
 * ユーザーTOTP認証
 */
class UserTotpAuthenticatorSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		UUID: { type: String, required: true },
		/** TOTP認証を有効にするか - 空でないこと - デフォルト: false */
		enabled: { type: Boolean, required: true, default: false },
		/** 認証キー */
		secret: { type: String },
		/** リカバリーコード */
		recoveryCodeHash: { type: String },
		/** バックアップコード */
		backupCodeHash: { type: [String] },
		/** QRcode */
		otpAuth: { type: String, unique: true },
		/** 試行回数 */
		attempts: { type: Number },
		/** 最終試行日時 */
		lastAttemptTime: { type: Number },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-totp-authenticator'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)

	// コンストラクタ
	constructor() {
		// UUIDとsecretの組み合わせでユニークインデックスを追加
		this.schemaInstance.index({ UUID: 1, secret: 1 }, { unique: true });
	}
}
export const UserTotpAuthenticatorSchema = new UserTotpAuthenticatorSchemaFactory()

/**
 * ユーザーメール認証
 */
class UserEmailAuthenticatorSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		UUID: { type: String, required: true },
		/** ユーザーのメールアドレス */
		emailLowerCase: { type: String, required: true },
		/** メール認証を有効にするか - 空でないこと - デフォルト: false */
		enabled: { type: Boolean, required: true, default: false },
		/** システム専用フィールド - 作成日時 - 空でないこと */
		createDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-email-authenticator'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)

	// コンストラクタ
	constructor() {
		// UUIDとsecretの組み合わせでユニークインデックスを追加
		this.schemaInstance.index({ UUID: 1, email: 1 }, { unique: true });
	}
}
export const UserEmailAuthenticatorSchema = new UserEmailAuthenticatorSchemaFactory()

/**
 * メール認証用の認証コード
 */
class UserEmailAuthenticatorVerificationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのUUID、ユーザーセキュリティコレクションのUUIDに関連付け - 空でないこと */
		UUID: { type: String, required: true },
		/** ユーザーID - 空でないこと */
		uid: { type: Number, required: true },
		/** ユーザーのメールアドレス - 空でないこと - ユニーク */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 認証コード - 空でないこと */
		verificationCode: { type: String, required: true },
		/** 認証コードの有効期限 - 空でないこと */
		overtimeAt: { type: Number, required: true, unique: true },
		/** 本日のリクエスト回数、乱用防止のため - 空でないこと */
		attemptsTimes: { type: Number, required: true },
		/** 最終リクエスト日時、乱用防止のため - 空でないこと */
		lastRequestDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-email-authenticator-verification-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserEmailAuthenticatorVerificationCodeSchema = new UserEmailAuthenticatorVerificationCodeSchemaFactory()

/**
 * パスワード再設定用の認証コード
 */
class UserForgotPasswordVerificationCodeSchemaFactory {
	/** MongoDBスキーマ */
	schema = {
		/** ユーザーのメールアドレス - 空でないこと - ユニーク */
		emailLowerCase: { type: String, required: true, unique: true },
		/** 認証コード - 空でないこと */
		verificationCode: { type: String, required: true },
		/** 認証コードの有効期限 - 空でないこと */
		overtimeAt: { type: Number, required: true, unique: true },
		/** 本日のリクエスト回数、乱用防止のため - 空でないこと */
		attemptsTimes: { type: Number, required: true },
		/** 最終リクエスト日時、乱用防止のため - 空でないこと */
		lastRequestDateTime: { type: Number, required: true },
		/** システム専用フィールド - 最終編集日時 - 空でないこと */
		editDateTime: { type: Number, required: true },
	}
	/** MongoDBコレクション名 */
	collectionName = 'user-reset-password-verification-code'
	/** Mongooseスキーマインスタンス */
	schemaInstance = new Schema(this.schema)
}
export const UserForgotPasswordVerificationCodeSchema = new UserForgotPasswordVerificationCodeSchemaFactory()
