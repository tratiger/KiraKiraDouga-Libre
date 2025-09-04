/**
 * ユーザー登録時に送信されるパラメータ
 */
export type UserRegistrationRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** 確認コード */
	verificationCode: string;
	/** フロントエンドでBcryptで一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 登録時に使用する招待コード */
	invitationCode?: string;
	/** ユーザー名 */
	username: string;
	/** ニックネーム */
	userNickname?: string;
};

/**
 * ユーザー登録のレスポンスパラメータ
 */
export type UserRegistrationResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーのUUID */
	UUID?: string;
	/** ユーザーID */
	uid?: number;
	/** 登録に成功した場合はトークンを返し、失敗した場合は偽の値（undefined、null、または ""）を返します */
	token?: string;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーログイン時に送信されるパラメータ
 */
export type UserLoginRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** ユーザーが入力したワンタイムパスワード */
	clientOtp?: string;
	/** ユーザーが入力したメール認証コード */
	verificationCode?: string;
};

/**
 * ユーザーログインのレスポンスパラメータ
 */
export type UserLoginResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーのメールアドレス */
	email?: string;
	/** ユーザーのUUID */
	UUID?: string;
	/** ユーザーID */
	uid?: number;
	/** ログインに成功した場合はトークンを返し、失敗した場合は偽の値（undefined、null、または ""）を返します */
	token?: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 追加のテキストメッセージ */
	message?: string;
	/** クールダウン中かどうか */
	isCoolingDown?: boolean;
	/** 認証システムのタイプ */
	authenticatorType?: "email" | "totp" | "none";
};

/**
 * ユーザーが存在するかどうかを確認するリクエストパラメータ
 */
export type UserExistsCheckByUIDRequestDto = {
	/** ユーザーUID */
	uid: number;
};

/**
 * ユーザーが存在するかどうかを確認するリクエストのレスポンス
 */
export type UserExistsCheckByUIDResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーが存在する場合はtrue、存在しない場合はfalseを返します */
	exists: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのメールアドレスが存在するかどうかを検証するために送信されるパラメータ
 */
export type UserEmailExistsCheckRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
};

/**
 * ユーザーのメールアドレスが既に存在するかどうかを検証した後のレスポンスパラメータ
 */
export type UserEmailExistsCheckResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーが存在するか、クエリに失敗した場合（ペシミスティック）はtrueを返し、存在しない場合はfalseを返します */
	exists: boolean; // WARN: ユーザーが既に存在するか、クエリに失敗した場合（ペシミスティック）は、ユーザーが誤って重複したメールアドレスで登録するのを防ぐために、常にtrueを返します。
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのメールアドレス変更リクエストのパラメータ
 */
export type UpdateUserEmailRequestDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザーの古いメールアドレス */
	oldEmail: string;
	/** ユーザーの新しいメールアドレス */
	newEmail: string;
	/** 一度ハッシュ化されたユーザーパスワード */
	passwordHash: string;
	/** 確認コード */
	verificationCode: string;
};

/**
 * ユーザーのメールアドレス変更のレスポンスパラメータ
 */
export type UpdateUserEmailResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ハッシュ化されるのを待っているパスワードとユーザー情報
 */
export type BeforeHashPasswordDataType = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
};

/**
 * ユーザーの個人タグ
 */
export type UserLabel = {
	/** タグID */
	id: number;
	/** タグ名 */
	labelName: string;
};

/**
 * ユーザーの連携アカウント
 */
export type UserLinkedAccounts = {
	/** 連携アカウントのプラットフォーム - 例：「X」 */
	platformId: string;
	/** 連携アカウントの一意の識別子 */
	accountUniqueId: string;
};

/**
 * ユーザーの連携ウェブサイト
 */
export type UserWebsite = {
	/** 連携ウェブサイト名 - 例：「私のホームページ」 */
	websiteName: string;
	/** 連携ウェブサイトのURL */
	websiteUrl: string;
};

/**
 * ユーザー情報の更新または作成時のリクエストパラメータ
 */
export type UpdateOrCreateUserInfoRequestDto = {
	/** ユーザー名 */
	username?: string;
	/** ニックネーム */
	userNickname?: string;
	/** ユーザーアバターのリンク */
	avatar?: string;
	/** ユーザーのバナー画像のリンク */
	userBannerImage?: string;
	/** ユーザーの自己紹介 */
	signature?: string;
	/** ユーザーの性別、男性、女性、カスタム（文字列） */
	gender?: string;
	/** ユーザーの個人タグ */
	label?: UserLabel[];
	/** ユーザーの誕生日 */
	userBirthday?: string;
	/** ユーザープロフィールのMarkdown */
	userProfileMarkdown?: string;
	/** ユーザーの連携アカウント */
	userLinkedAccounts?: UserLinkedAccounts[];
	/** ユーザーの連携ウェブサイト */
	userWebsite?: UserWebsite;
};

/**
 * ユーザー情報の更新または作成リクエストの結果
 */
export type UpdateOrCreateUserInfoResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {} & UpdateOrCreateUserInfoRequestDto;
};

/**
 * 現在ログインしているユーザーの情報を取得するためのリクエストパラメータ
 */
export type GetSelfUserInfoRequestDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザーのIDトークン */
	token: string;
};

/**
 * UUIDを使用して現在ログインしているユーザーの情報を取得するためのリクエストパラメータ
 */
export type GetSelfUserInfoByUuidRequestDto = {
	/** UUID */
	uuid: string;
	/** ユーザーのIDトークン */
	token: string;
};

/**
 * 現在ログインしているユーザーの情報を取得するためのリクエストのレスポンス
 */
export type GetSelfUserInfoResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: (
		{
			/** ユーザーID */
			uid?: number;
			/** UUID */
			uuid?: string;
			/** ユーザーのメールアドレス */
			email?: string;
			/** ユーザー作成日時 */
			userCreateDateTime?: number;
			/** ユーザーのロール */
			roles?: string[];
			/** 2FAのタイプ */
			authenticatorType?: string;
			/** 使用された招待コード */
			invitationCode?: string;
		}
		& UpdateOrCreateUserInfoRequestDto
	);
};

/**
 * UUIDを使用して現在ログインしているユーザーの情報を取得するためのリクエストのレスポンス
 */
export type GetSelfUserInfoByUuidResponseDto = {} & GetSelfUserInfoResponseDto;

/**
 * UIDを使用してユーザー情報を取得するためのリクエストペイロード
 */
export type GetUserInfoByUidRequestDto = {
	/** ターゲットユーザーのUID */
	uid: number;
};

/**
 * ユーザーのブロック状態
 */
type BlockState = { isBlockedByOther: boolean; isBlocked: boolean; isHidden: boolean };

/**
 * UIDを使用してユーザー情報を取得するためのリクエストのレスポンス
 */
export type GetUserInfoByUidResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {
		/** ユーザー名 */
		username?: string;
		/** ニックネーム */
		userNickname?: string;
		/** ユーザーアバターのリンク */
		avatar?: string;
		/** ユーザーのバナー画像のリンク */
		userBannerImage?: string;
		/** ユーザーの自己紹介 */
		signature?: string;
		/** ユーザーの性別、男性、女性、カスタム（文字列） */
		gender?: string;
		/** ユーザーの個人タグ */
		label?: UserLabel[];
		/** ユーザー作成日時 */
		userCreateDateTime?: number;
		/** ユーザーのロール */
		roles?: string[];
		/** このユーザーをフォローしているかどうか */
		isFollowing: boolean;
		/**
		 * クエリ対象のユーザーが自分自身であるかどうか。
		 * このフィールドの値がtrueの場合、通常は誤ったリクエストが発生したことを意味します。なぜなら、自分自身の情報を照会するための専用のインターフェースがあるからです。
		 */
		isSelf: boolean;
	};
} & BlockState;

/**
 * UIDとTOKENでユーザーを検証した結果
 */
export type CheckUserTokenResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** ユーザー検証結果、正常なユーザーはtrue、不正なユーザーはfalse */
	userTokenOk?: boolean;
};

/**
 * ユーザーログアウトのレスポンス
 */
export type UserLogoutResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがアバターをアップロードするための署名付きURLを取得します。アップロードは60秒に制限されています
 */
export type GetUserAvatarUploadSignedUrlResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーがアバターをアップロードするための署名付きURL */
	userAvatarUploadSignedUrl?: string;
	/** ユーザーがアップロードするアバターのファイル名 */
	userAvatarFilename?: string;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザープライバシーデータの可視性設定
 */
type UserPrivaryVisibilitiesSettingDto = {
	/** ユーザープライバシーデータ項目のID - 空でないこと - 例：'birthday', 'follow', 'fans' */
	privaryId: string;
	/** 表示方法 - 空でないこと - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: "public" | "following" | "private";
};

/**
 * ユーザー連携プラットフォームのプライバシー可視性設定
 */
type UserLinkedAccountsVisibilitiesSettingDto = {
	/** 連携アカウントの種類 - 空でないこと - 例：「X」 */
	platformId: string;
	/** 表示方法 - 空でないこと - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: "public" | "following" | "private";
};

/**
 * 基本的なユーザー個人設定のタイプ
 */
export type BasicUserSettingsDto = {
	/** Cookieを有効にするかどうか - ブール値 */
	enableCookie?: boolean;
	/** テーマの外観設定（テーマタイプ） - 選択可能な値：{light: ライト, dark: ダーク, system: システムに従う} */
	themeType?: "light" | "dark" | "system";
	/** テーマカラー - 文字列、カラー文字列 */
	themeColor?: string;
	/** ユーザー定義のテーマカラー - 文字列、シャープなしの16進数カラー文字列 */
	themeColorCustom?: string;
	/** 壁紙（背景画像のURL） - 文字列 */
	wallpaper?: string;
	/** カラーサイドバーを有効にするかどうか - ブール値 */
	coloredSideBar?: boolean;
	/** データ使用量の設定 - 文字列、{standard: 標準, limit: データ節約モード, preview: 先読み} */
	dataSaverMode?: "standard" | "limit" | "preview";
	/** 検索候補を無効にする - ブール値 */
	noSearchRecommendations?: boolean;
	/** 関連動画の推薦を無効にする - ブール値 */
	noRelatedVideos?: boolean;
	/** 検索履歴を無効にする - ブール値 */
	noRecentSearch?: boolean;
	/** 視聴履歴を無効にする - ブール値 */
	noViewHistory?: boolean;
	/** 動画を新しいウィンドウで開くかどうか - ブール値 */
	openInNewWindow?: boolean;
	/** 表示言語 - 文字列 */
	currentLocale?: string;
	/** ユーザーのタイムゾーン - 文字列 */
	timezone?: string;
	/** ユーザーの単位系 - 文字列、目盛りまたは分割値、ヤード・ポンド法または米国慣用単位など */
	unitSystemType?: string;
	/** 開発者モードに入ったかどうか - ブール値 */
	devMode?: boolean;
	/** ユーザー連携ウェブサイトのプライバシー設定 - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	userWebsitePrivacySetting?: "public" | "following" | "private";
	/** ユーザープライバシーデータの可視性設定 */
	userPrivaryVisibilitiesSetting?: UserPrivaryVisibilitiesSettingDto[];
	/** ユーザー連携アカウントのプライバシー設定 */
	userLinkedAccountsVisibilitiesSetting?: UserLinkedAccountsVisibilitiesSettingDto[];
	// /** 实验性：启用直角模式 - 布尔 */
	// sharpAppearanceMode?: boolean;
	// /** 实验性：启用扁平模式 - 布尔 */
	// flatAppearanceMode?: boolean;
};

/**
 * ページレンダリング用のユーザー設定を取得するためのリクエストパラメータ
 */
export type GetUserSettingsRequestDto = {} & GetSelfUserInfoRequestDto;

/**
 * ページレンダリング用のユーザー設定を取得するためのリクエストのレスポンス
 */
export type GetUserSettingsResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーの個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー設定の更新または作成のためのリクエストパラメータ
 */
export type UpdateOrCreateUserSettingsRequestDto = {} & BasicUserSettingsDto;

/**
 * ユーザー設定の更新または作成のためのリクエストのレスポンス
 */
export type UpdateOrCreateUserSettingsResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** ユーザーの個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー登録メール認証コード送信リクエストのペイロード
 */
export type RequestSendVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス - 空でないこと - 一意 */
	email: string;
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
};

/**
 * ユーザーメール認証コード送信リクエストのレスポンス
 */
export type RequestSendVerificationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** タイムアウトに達したかどうか */
	isTimeout: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 招待コードのタイプ
 */
type InvitationCode = {
	/** 招待コードを生成したユーザーのUID - 空でないこと */
	creatorUid: number;
	/** 招待コードを生成したユーザーのUUID - 空でないこと */
	creatorUUID: string;
	/** 招待コード - 空でないこと */
	invitationCode: string;
	/** 招待コードの生成日時 - 空でないこと */
	generationDateTime: number;
	/** 招待コードが使用待ちとしてマークされている - 空でないこと */
	isPending: boolean;
	/** 招待コードが使用不可としてマークされている - 空でないこと */
	disabled: boolean;
	/** この招待コードを使用したユーザー */
	assignee?: number;
	/** 招待コードが使用された日時 */
	usedDateTime?: number;
};

/**
 * 招待コード生成リクエストのレスポンス
 */
export type CreateInvitationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 招待コードジェネレーターがクールダウン中かどうか（招待コードの生成期限を超えた後に再度生成可能） */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 生成された招待コード */
	invitationCodeResult?: InvitationCode;
};

/**
 * 自分の招待コードを取得するリクエストのレスポンス
 */
export type GetMyInvitationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 招待コードリスト */
	invitationCodeResult: InvitationCode[];
};

/**
 * 管理者が招待コードに基づいてユーザーを照会するリクエストのレスポンス
 */
export type AdminGetUserByInvitationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 招待コードの照会結果 */
	userInfoResult: {
		/** ユーザーUID */
		uid?: number;
		/** ユーザーUUID */
		uuid?: string;
	};
};

/**
 * 招待コードを使用するリクエストのペイロード
 */
export type UseInvitationCodeDto = {
	/** 使用された招待コード */
	invitationCode: string;
	/** 登録者のUID */
	registrantUid: number;
	/** 登録者のUUID */
	registrantUUID: string;
};

/**
 * 招待コードを使用するリクエストのレスポンス
 */
export type UseInvitationCodeResultDto = {
	/** 確認コードの使用に成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 招待コードが利用可能かどうかを確認するリクエストのペイロード
 */
export type CheckInvitationCodeRequestDto = {
	/** 使用された招待コード */
	invitationCode: string;
};

/**
 * 招待コードが利用可能かどうかを確認するリクエストのレスポンス
 */
export type CheckInvitationCodeResponseDto = {
	/** 招待コードの生成に成功したかどうか */
	success: boolean;
	/** 利用可能な招待コードかどうか */
	isAvailableInvitationCode: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのメールアドレス変更の確認コードを要求するリクエストのペイロード
 */
export type RequestSendChangeEmailVerificationCodeRequestDto = {
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
	/** ユーザーの新しいメールアドレス */
	newEmail: string;
};

/**
 * ユーザーのメールアドレス変更の確認コードを要求するリクエストのレスポンス
 */
export type RequestSendChangeEmailVerificationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** タイムアウトに達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーパスワード変更の確認コードを要求するリクエストのペイロード
 */
export type RequestSendChangePasswordVerificationCodeRequestDto = {
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
};

/**
 * ユーザーパスワード変更の確認コードを要求するリクエストのレスポンス
 */
export type RequestSendChangePasswordVerificationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** タイムアウトに達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのパスワード変更リクエストのパラメータ
 */
export type UpdateUserPasswordRequestDto = {
	/** ユーザーの古いパスワード */
	oldPasswordHash: string;
	/** ユーザーの新しいメールアドレス */
	newPasswordHash: string;
	/** 確認コード */
	verificationCode: string;
};

/**
 * ユーザーのパスワード変更のレスポンスパラメータ
 */
export type UpdateUserPasswordResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * パスワードを忘れた場合のメール認証コード送信リクエストのペイロード
 */
export type RequestSendForgotPasswordVerificationCodeRequestDto = {
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
};

/**
 * パスワードを忘れた場合のメール認証コード送信リクエストのレスポンス
 */
export type RequestSendForgotPasswordVerificationCodeResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** タイムアウトに達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * パスワードの回復（更新）リクエストのペイロード
 */
export type ForgotPasswordRequestDto = {
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
	/** ユーザーの新しいメールアドレス */
	newPasswordHash: string;
	/** 確認コード */
	verificationCode: string;
};

/**
 * パスワードの回復（更新）リクエストのレスポンス
 */
export type ForgotPasswordResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー名が利用可能かを確認するリクエストのペイロード
 */
export type CheckUsernameRequestDto = {
	/** ユーザー名 */
	username: string;
};

/**
 * ユーザー名が利用可能かを確認するリクエストのレスポンス
 */
export type CheckUsernameResponseDto = {
	/** 実行結果、プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返します */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 利用可能なユーザー名かどうか */
	isAvailableUsername: boolean;
};

/**
 * 管理者がすべてのブロックされたユーザー情報を取得するためのリクエストペイロード
 */
export type GetBlockedUserRequestDto = {
	/** ソートフィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** UIDで検索 */
	uid?: number;
	/** ページネーション検索 */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * 管理者がすべてのブロックされたユーザー情報を取得するためのリクエストのレスポンス
 */
export type GetBlockedUserResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエストのレスポンス、ブロックされたユーザー */
	result?: (
		GetUserInfoByUidResponseDto["result"] & {
			uid: number;
			UUID: string;
		}
	)[];
	/** データ総数 */
	totalCount: number;
};

/**
 * 管理者がユーザー情報を取得するためのリクエストペイロード
 */
export type AdminGetUserInfoRequestDto = {
	/** 最終レビュー承認後にユーザー情報が変更されたユーザーのみを表示するかどうか */
	isOnlyShowUserInfoUpdatedAfterReview: boolean;
	/** ソートフィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** UIDで検索 */
	uid?: number;
	/** ページネーション検索 */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * 管理者がユーザー情報を取得するためのリクエストのレスポンス
 */
export type AdminGetUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエストのレスポンス */
	result?: (
		GetSelfUserInfoResponseDto["result"] & {
			uid: number;
			UUID: string;
			avatar: string;
			userBannerImage: string;
			editDateTime: number;
			editOperatorUUID: string;
			isUpdatedAfterReview: boolean;
		}
	)[];
	/** データ総数 */
	totalCount: number;
};

/**
 * 管理者によるユーザー情報審査承認のリクエストペイロード
 */
export type ApproveUserInfoRequestDto = {
	/** ユーザーのUUID */
	UUID: string;
};

/**
 * 管理者によるユーザー情報審査承認のリクエストのレスポンス
 */
export type ApproveUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 管理者が特定のユーザーの情報をクリアするためのリクエストペイロード
 */
export type AdminClearUserInfoRequestDto = {
	/** ユーザーのUID */
	uid: number;
};

/**
 * 管理者が特定のユーザーの情報をクリアするためのリクエストのレスポンス
 */
export type AdminClearUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 管理者によるユーザー情報編集のリクエストペイロード
 */
export type AdminEditUserInfoRequestDto = {
	/** ユーザーのUID */
	uid: number;
	/** ユーザー情報の編集 */
	userInfo?: {
		/** ユーザー名 */
		username?: string;
		/** ニックネーム */
		userNickname?: string;
		/** ユーザーアバターのリンク */
		avatar?: string;
		/** ユーザーのバナー画像のリンク */
		userBannerImage?: string;
		/** ユーザーの自己紹介 */
		signature?: string;
		/** ユーザーの性別、男性、女性、カスタム（文字列） */
		gender?: string;
		/** ユーザーの誕生日 */
		userBirthday?: string;
		/** ユーザープロフィールのMarkdown */
		userProfileMarkdown?: string;
		/** 審査状態 */
		isUpdatedAfterReview?: boolean;
	};
};

/**
 * 管理者によるユーザー情報編集のリクエストのレスポンス
 */
export type AdminEditUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ログイン済みユーザーがパスワードとTOTP認証コードで認証システムを削除するためのリクエストペイロード
 */
export type DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto = {
	/** ユーザーのTOTP認証システムの確認コード */
	clientOtp: string;
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
};

/**
 * ログイン済みユーザーがパスワードとメール認証コードでユーザーの認証システムを削除するためのリクエストのレスポンス
 */
export type DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** クールダウン中かどうか */
	isCoolingDown?: boolean;
};

/**
 * ユーザーがTOTP認証システムを作成するリクエストのレスポンス
 */
export type CreateUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証システムが既に存在するかどうか */
	isExists: boolean;
	/** 存在する場合、認証システムのタイプを返します */
	existsAuthenticatorType?: "email" | "totp";
	/** TOTP認証システム情報 */
	result?: {
		/** TOTPの一意のID、認証システムのQRコード */
		otpAuth?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがメール認証システムを作成するリクエストのレスポンス
 */
export type CreateUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証システムが既に存在するかどうか */
	isExists: boolean;
	/** 存在する場合、認証システムのタイプを返します */
	existsAuthenticatorType?: "email" | "totp";
	/** メール認証システム情報 */
	result?: {
		/** メールアドレス */
		email?: string;
		/** メールアドレス（小文字） */
		emailLowerCase?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがTOTPデバイスの紐付けを確認するリクエストのペイロード
 */
export type ConfirmUserTotpAuthenticatorRequestDto = {
	/** ユーザーデバイスで生成されたTOTP認証コード */
	clientOtp: string;
	/** TOTPの一意のID */
	otpAuth: string;
};

/**
 * ユーザーがTOTPデバイスの紐付けを確認するリクエストのレスポンス
 */
export type ConfirmUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 結果 */
	result?: {
		/** 認証システムのバックアップコード */
		backupCode?: string[];
		/** 認証システムの回復コード */
		recoveryCode?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがメール認証システムの確認メールを送信するリクエストのペイロード
 */
export type SendUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
};

/**
 * ユーザーがメール認証システムの確認メールを送信するリクエストのレスポンス
 */
export type SendUserEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** タイムアウトに達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがメール認証システムの削除確認メールを送信するリクエストのペイロード
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーが使用するクライアントの言語 */
	clientLanguage: string;
};

/**
 * ユーザーがメール認証システムの削除確認メールを送信するリクエストのレスポンス
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto = {} & SendUserEmailAuthenticatorVerificationCodeResponseDto;

/**
 * メール認証システムの確認コードが正しいか検証するリクエストのペイロード
 */
export type CheckEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** メール認証コード */
	verificationCode: string;
};

/**
 * メール認証システムの確認コードが正しいか検証するリクエストのレスポンス
 */
export type CheckEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがメール2FAを削除するリクエストのペイロード
 */
export type DeleteUserEmailAuthenticatorRequestDto = {
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** メール認証コード */
	verificationCode: string;
};

/**
 * ユーザーがメール2FAを削除するリクエストのレスポンス
 */
export type DeleteUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 2FAが有効になっているかを確認するリクエストのペイロード
 */
export type CheckUserHave2FARequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
};

/**
 * 2FAが有効になっているかを確認するリクエストのレスポンス
 */
export type CheckUserHave2FAResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証システムが存在するかどうか */
	have2FA: boolean;
	/** 存在する場合、2FAのタイプを返します */
	type?: "email" | "totp";
	/** 存在し、結果がtotpの場合、2FAの作成日時を返します */
	totpCreationDateTime?: number;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * UUIDに基づいてユーザーが存在するかどうかを検証するリクエストのペイロード
 */
export type CheckUserExistsByUuidRequestDto = {
	/** ユーザーのUUID */
	uuid: string;
};

/**
 * UUIDに基づいてユーザーが存在するかどうかを検証するリクエストのレスポンス
 */
export type CheckUserExistsByUuidResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** ユーザーが既に存在するかどうか */
	exists: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};
