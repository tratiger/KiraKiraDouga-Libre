/**
 * ユーザー登録時に送信するパラメータ
 */
export type UserRegistrationRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** 認証コード */
	verificationCode: string;
	/** フロントエンドでBcryptでハッシュ化されたパスワード */
	passwordHash: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 登録時に使用した招待コード */
	invitationCode?: string;
	/** ユーザー名 */
	username: string;
	/** ユーザーニックネーム */
	userNickname?: string;
};

/**
 * ユーザー登録のレスポンスパラメータ
 */
export type UserRegistrationResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーのUUID */
	UUID?: string;
	/** ユーザーID */
	uid?: number;
	/** 登録に成功した場合、トークンを返す。失敗した場合は偽の値（undefined、null、または ""） */
	token?: string;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーログイン時に送信するパラメータ
 */
export type UserLoginRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドでハッシュ化されたパスワード */
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
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーのメールアドレス */
	email?: string;
	/** ユーザーのUUID */
	UUID?: string;
	/** ユーザーID */
	uid?: number;
	/** ログインに成功した場合、トークンを返す。失敗した場合は偽の値（undefined、null、または ""） */
	token?: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 追加のテキストメッセージ */
	message?: string;
	/** クールダウン中かどうか */
	isCoolingDown?: boolean;
	/** 認証アプリのタイプ */
	authenticatorType?: "email" | "totp" | "none";
};

/**
 * ユーザーが存在するかどうかの確認リクエストパラメータ
 */
export type UserExistsCheckByUIDRequestDto = {
	/** ユーザーUID */
	uid: number;
};

/**
 * ユーザーが存在するかどうかの確認リクエストのレスポンス
 */
export type UserExistsCheckByUIDResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーが存在する場合はtrue、存在しない場合はfalse */
	exists: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのメールアドレスが存在するか確認するために送信するパラメータ
 */
export type UserEmailExistsCheckRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
};

/**
 * ユーザーのメールアドレスが既に存在するか確認した結果のレスポンスパラメータ
 */
export type UserEmailExistsCheckResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーが存在するか、クエリに失敗した場合（ペシミスティック）はtrue、存在しない場合はfalse */
	exists: boolean; // WARN: ユーザーが既に存在するか、クエリに失敗した場合（ペシミスティック）はtrueを返し、ユーザーが誤って重複したメールアドレスで登録するのを防ぎます。
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがメールアドレスを変更するリクエストのパラメータ
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
	/** 認証コード */
	verificationCode: string;
};

/**
 * ユーザーがメールアドレスを変更した結果のレスポンスパラメータ
 */
export type UpdateUserEmailResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ハッシュ化される前のパスワードとユーザー情報
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
	/** 連携アカウントのプラットフォーム - 例："X" */
	platformId: string;
	/** 連携アカウントのユニークID */
	accountUniqueId: string;
};

/**
 * ユーザーのウェブサイト
 */
export type UserWebsite = {
	/** ウェブサイト名 - 例："私の個人ホームページ" */
	websiteName: string;
	/** ウェブサイトURL */
	websiteUrl: string;
};

/**
 * ユーザー情報を更新または作成するリクエストパラメータ
 */
export type UpdateOrCreateUserInfoRequestDto = {
	/** ユーザー名 */
	username?: string;
	/** ユーザーニックネーム */
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
	/** ユーザーのウェブサイト */
	userWebsite?: UserWebsite;
};

/**
 * ユーザー情報を更新または作成したリクエストの結果
 */
export type UpdateOrCreateUserInfoResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {} & UpdateOrCreateUserInfoRequestDto;
};

/**
 * 現在ログインしているユーザーの情報を取得するリクエストパラメータ
 */
export type GetSelfUserInfoRequestDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザーの認証トークン */
	token: string;
};

/**
 * UUIDによって現在ログインしているユーザーの情報を取得するリクエストパラメータ
 */
export type GetSelfUserInfoByUuidRequestDto = {
	/** UUID */
	uuid: string;
	/** ユーザーの認証トークン */
	token: string;
};

/**
 * 現在ログインしているユーザーの情報を取得するリクエストのレスポンス
 */
export type GetSelfUserInfoResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
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
			/** 使用した招待コード */
			invitationCode?: string;
		}
		& UpdateOrCreateUserInfoRequestDto
	);
};

/**
 * UUIDによって現在ログインしているユーザーの情報を取得するリクエストのレスポンス
 */
export type GetSelfUserInfoByUuidResponseDto = {} & GetSelfUserInfoResponseDto;

/**
 * UIDによってユーザー情報を取得するリクエストペイロード
 */
export type GetUserInfoByUidRequestDto = {
	/** ターゲットユーザーのUID */
	uid: number;
};

/**
 * ユーザーがブロックされている状態
 */
type BlockState = { isBlockedByOther: boolean; isBlocked: boolean; isHidden: boolean };

/**
 * UIDによってユーザー情報を取得するリクエストのレスポンス
 */
export type GetUserInfoByUidResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {
		/** ユーザー名 */
		username?: string;
		/** ユーザーニックネーム */
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
		 * 問い合わせたユーザーが自分自身であるかどうか。
		 * このフィールドの値がtrueの場合、通常は誤ったリクエストを意味します。なぜなら、自分自身の情報を問い合わせるための専用のインターフェースがあるからです。
		 */
		isSlef: boolean;
	};
} & BlockState;

/**
 * UIDとTOKENによってユーザーを検証した結果
 */
export type CheckUserTokenResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** ユーザー検証結果。正常なユーザーはtrue、不正なユーザーはfalse */
	userTokenOk?: boolean;
};

/**
 * ユーザーログアウトのレスポンス
 */
export type UserLogoutResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがアバターをアップロードするための署名付きURLを取得する。アップロードは60秒以内に制限されます。
 */
export type GetUserAvatarUploadSignedUrlResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーがアバターをアップロードするための署名付きURL */
	userAvatarUploadSignedUrl?: string;
	/** ユーザーがアップロードするアバターのファイル名 */
	userAvatarFilename?: string;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのプライバシーデータの可視性設定
 */
type UserPrivaryVisibilitiesSettingDto = {
	/** ユーザーのプライバシーデータ項目のID - 空であってはならない - 例：'birthday', 'follow', 'fans' */
	privaryId: string;
	/** 表示方法 - 空であってはならない - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: "public" | "following" | "private";
};

/**
 * ユーザーの連携プラットフォームのプライバシー可視性設定
 */
type UserLinkedAccountsVisibilitiesSettingDto = {
	/** 連携アカウントのタイプ - 空であってはならない - 例："X" */
	platformId: string;
	/** 表示方法 - 空であってはならない - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: "public" | "following" | "private";
};

/**
 * 基本的なユーザーの個人設定タイプ
 */
export type BasicUserSettingsDto = {
	/** Cookieを有効にするか - ブール値 */
	enableCookie?: boolean;
	/** テーマの外観設定（テーマタイプ） - 選択可能な値：{light: ライト, dark: ダーク, system: システムに従う} */
	themeType?: "light" | "dark" | "system";
	/** テーマカラー - 文字列、カラー文字列 */
	themeColor?: string;
	/** ユーザーカスタムテーマカラー - 文字列、HEXカラー文字列、シャープなし */
	themeColorCustom?: string;
	/** 壁紙（背景画像URL） - 文字列 */
	wallpaper?: string;
	/** カラーサイドバーを有効にするか - ブール値 */
	coloredSideBar?: boolean;
	/** データ通信量の使用設定 - 文字列、{standard: 標準, limit: データ節約モード, preview: 先行読み込み} */
	dataSaverMode?: "standard" | "limit" | "preview";
	/** 検索推薦を無効にするか - ブール値 */
	noSearchRecommendations?: boolean;
	/** 関連動画の推薦を無効にするか - ブール値 */
	noRelatedVideos?: boolean;
	/** 検索履歴を無効にするか - ブール値 */
	noRecentSearch?: boolean;
	/** 視聴履歴を無効にするか - ブール値 */
	noViewHistory?: boolean;
	/** 新しいウィンドウで動画を開くか - ブール値 */
	openInNewWindow?: boolean;
	/** 表示言語 - 文字列 */
	currentLocale?: string;
	/** ユーザーのタイムゾーン - 文字列 */
	timezone?: string;
	/** ユーザーの単位系 - 文字列、メートル法やヤード・ポンド法など */
	unitSystemType?: string;
	/** 開発者モードに入っているか - ブール値 */
	devMode?: boolean;
	/** ユーザーのウェブサイトのプライバシー設定 - 許可される値：{public: 公開, following: フォロー中のみ, private: 非公開} */
	userWebsitePrivacySetting?: "public" | "following" | "private";
	/** ユーザーのプライバシーデータの可視性設定 */
	userPrivaryVisibilitiesSetting?: UserPrivaryVisibilitiesSettingDto[];
	/** ユーザーの連携アカウントのプライバシー設定 */
	userLinkedAccountsVisibilitiesSetting?: UserLinkedAccountsVisibilitiesSettingDto[];
	// /** 実験的：直角モードを有効にする - ブール値 */
	// sharpAppearanceMode?: boolean;
	// /** 実験的：フラットモードを有効にする - ブール値 */
	// flatAppearanceMode?: boolean;
};

/**
 * ページレンダリング用のユーザー設定を取得するリクエストパラメータ
 */
export type GetUserSettingsRequestDto = {} & GetSelfUserInfoRequestDto;

/**
 * ページレンダリング用のユーザー設定を取得するリクエストのレスポンス
 */
export type GetUserSettingsResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーの個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー設定を更新または作成するリクエストパラメータ
 */
export type UpdateOrCreateUserSettingsRequestDto = {} & BasicUserSettingsDto;

/**
 * ユーザー設定を更新または作成するリクエストのレスポンス
 */
export type UpdateOrCreateUserSettingsResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーの個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー登録用のメール認証コード送信リクエストのペイロード
 */
export type RequestSendVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス - 空であってはならない - ユニーク */
	email: string;
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
};

/**
 * ユーザーメール認証コード送信リクエストのレスポンス
 */
export type RequestSendVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
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
	/** 招待コードを生成したユーザーのUID - 空であってはならない */
	creatorUid: number;
	/** 招待コードを生成したユーザーのUUID - 空であってはならない */
	creatorUUID: string;
	/** 招待コード - 空であってはならない */
	invitationCode: string;
	/** 招待コードの生成日時 - 空であってはならない */
	generationDateTime: number;
	/** 招待コードが使用待ちとしてマークされているか - 空であってはならない */
	isPending: boolean;
	/** 招待コードが無効としてマークされているか - 空であってはならない */
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
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 招待コード生成器がクールダウン中かどうか（招待コード生成期限を超えたら再度生成可能） */
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
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 招待コードリスト */
	invitationCodeResult: InvitationCode[];
};

/**
 * 管理者が招待コードによってユーザーを検索するリクエストのレスポンス
 */
export type AdminGetUserByInvitationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 招待コード検索結果 */
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
	/** 登録者UID */
	registrantUid: number;
	/** 登録者UUID */
	registrantUUID: string;
};

/**
 * 招待コードを使用したリクエストのレスポンス
 */
export type UseInvitationCodeResultDto = {
	/** 認証コードの使用に成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 招待コードが利用可能かチェックするリクエストのペイロード
 */
export type CheckInvitationCodeRequestDto = {
	/** 使用された招待コード */
	invitationCode: string;
};

/**
 * 招待コードが利用可能かチェックするリクエストのレスポンス
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
 * ユーザーのメールアドレス変更用の認証コード送信リクエストのペイロード
 */
export type RequestSendChangeEmailVerificationCodeRequestDto = {
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
	/** ユーザーの新しいメールアドレス */
	newEmail: string;
};

/**
 * ユーザーのメールアドレス変更用の認証コード送信リクエストのレスポンス
 */
export type RequestSendChangeEmailVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン期間に達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーのパスワード変更用の認証コード送信リクエストのペイロード
 */
export type RequestSendChangePasswordVerificationCodeRequestDto = {
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
};

/**
 * ユーザーのパスワード変更用の認証コード送信リクエストのレスポンス
 */
export type RequestSendChangePasswordVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン期間に達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがパスワードを変更するリクエストのパラメータ
 */
export type UpdateUserPasswordRequestDto = {
	/** ユーザーの古いパスワード */
	oldPasswordHash: string;
	/** ユーザーの新しいパスワード */
	newPasswordHash: string;
	/** 認証コード */
	verificationCode: string;
};

/**
 * ユーザーがパスワードを変更した結果のレスポンスパラメータ
 */
export type UpdateUserPasswordResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * パスワードを忘れた場合のメール認証コード送信リクエストのペイロード
 */
export type RequestSendForgotPasswordVerificationCodeRequestDto = {
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
};

/**
 * パスワードを忘れた場合のメール認証コード送信リクエストのレスポンス
 */
export type RequestSendForgotPasswordVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン期間に達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * パスワード再設定（更新）のリクエストペイロード
 */
export type ForgotPasswordRequestDto = {
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
	/** ユーザーの新しいパスワード */
	newPasswordHash: string;
	/** 認証コード */
	verificationCode: string;
};

/**
 * パスワード再設定（更新）のリクエストのレスポンス
 */
export type ForgotPasswordResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザー名が利用可能かチェックするリクエストのペイロード
 */
export type CheckUsernameRequestDto = {
	/** ユーザー名 */
	username: string;
};

/**
 * ユーザー名が利用可能かチェックするリクエストのレスпоンス
 */
export type CheckUsernameResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 利用可能なユーザー名かどうか */
	isAvailableUsername: boolean;
};

/**
 * 管理者がすべてのブロックされたユーザー情報を取得するリクエストペイロード
 */
export type GetBlockedUserRequestDto = {
	/** ソート対象のフィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** 検索するUID */
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
 * 管理者がすべてのブロックされたユーザー情報を取得するリクエストのレスポンス
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
 * 管理者がユーザー情報を取得するリクエストペイロード
 */
export type AdminGetUserInfoRequestDto = {
	/** 前回のレビュー承認後にユーザー情報を変更したユーザーのみ表示するか */
	isOnlyShowUserInfoUpdatedAfterReview: boolean;
	/** ソート対象のフィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** 検索するUID */
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
 * 管理者がユーザー情報を取得するリクエストのレスポンス
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
 * 管理者がユーザー情報レビューを承認するリクエストペイロード
 */
export type ApproveUserInfoRequestDto = {
	/** ユーザーのUUID */
	UUID: string;
};

/**
 * 管理者がユーザー情報レビューを承認するリクエストのレスポンス
 */
export type ApproveUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 管理者が特定のユーザーの情報をクリアするリクエストペイロード
 */
export type AdminClearUserInfoRequestDto = {
	/** ユーザーのUID */
	uid: number;
};

/**
 * 管理者が特定のユーザーの情報をクリアするリクエストのレスポンス
 */
export type AdminClearUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 管理者がユーザー情報を編集するリクエストペイロード
 */
export type AdminEditUserInfoRequestDto = {
	/** ユーザーのUID */
	uid: number;
	/** 編集するユーザー情報 */
	userInfo?: {
		/** ユーザー名 */
		username?: string;
		/** ユーザーニックネーム */
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
		/** レビュー状態 */
		isUpdatedAfterReview?: boolean;
	};
};

/**
 * 管理者がユーザー情報を編集するリクエストのレスポンス
 */
export type AdminEditUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ログイン済みユーザーがパスワードとTOTP認証コードで認証アプリを削除するリクエストペイロード
 */
export type DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto = {
	/** ユーザーのTOTP認証アプリの認証コード */
	clientOtp: string;
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
};

/**
 * ログイン済みユーザーがパスワードとメール認証コードでユーザーの認証アプリを削除するリクエストのレスポンス
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
 * ユーザーがTOTP認証アプリを作成するリクエストのレスポンス
 */
export type CreateUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証アプリが既に存在するかどうか */
	isExists: boolean;
	/** 既に存在する場合、認証アプリのタイプを返す */
	existsAuthenticatorType?: "email" | "totp";
	/** TOTP認証アプリ情報 */
	result?: {
		/** TOTPのユニークID、認証アプリのQRコード */
		otpAuth?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがEmail認証アプリを作成するリクエストのレスポンス
 */
export type CreateUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証アプリが既に存在するかどうか */
	isExists: boolean;
	/** 既に存在する場合、認証アプリのタイプを返す */
	existsAuthenticatorType?: "email" | "totp";
	/** Email認証アプリ情報 */
	result?: {
		/** Email */
		email?: string;
		/** Email Lower Case */
		emailLowerCase?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがTOTPデバイスのバインドを確認するリクエストペイロード
 */
export type ConfirmUserTotpAuthenticatorRequestDto = {
	/** ユーザーのデバイスで生成されたTOTP認証コード */
	clientOtp: string;
	/** TOTPのユニークID */
	otpAuth: string;
};

/**
 * ユーザーがTOTPデバイスのバインドを確認するリクエストのレスポンス
 */
export type ConfirmUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 結果 */
	result?: {
		/** 認証アプリのバックアップコード */
		backupCode?: string[];
		/** 認証アプリのリカバリーコード */
		recoveryCode?: string;
	};
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがEmail認証アプリの認証メールを送信するリクエストペイロード
 */
export type SendUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
};

/**
 * ユーザーがEmail認証アプリの認証メールを送信するリクエストのレスポンス
 */
export type SendUserEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** クールダウン期間に達したかどうか */
	isCoolingDown: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがEmail認証アプリ削除の認証メールを送信するリクエストペイロード
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのクライアントが使用する言語 */
	clientLanguage: string;
};

/**
 * ユーザーがEmail認証アプリ削除の認証メールを送信するリクエストのレスポンス
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto = {} & SendUserEmailAuthenticatorVerificationCodeResponseDto;

/**
 * Email認証アプリの認証コードが正しいか検証するリクエストペイロード
 */
export type CheckEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** メール認証コード */
	verificationCode: string;
};

/**
 * Email認証アプリの認証コードが正しいか検証するリクエストのレスポンス
 */
export type CheckEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * ユーザーがEmail 2FAを削除するリクエストペイロード
 */
export type DeleteUserEmailAuthenticatorRequestDto = {
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** メール認証コード */
	verificationCode: string;
};

/**
 * ユーザーがEmail 2FAを削除するリクエストのレスポンス
 */
export type DeleteUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * 2FAが有効かチェックするリクエストペイロード
 */
export type CheckUserHave2FARequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
};

/**
 * 2FAが有効かチェックするリクエストのレスポンス
 */
export type CheckUserHave2FAResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証アプリが存在するかどうか */
	have2FA: boolean;
	/** 存在する場合、2FAのタイプを返す */
	type?: "email" | "totp";
	/** 存在し、結果がtotpの場合、2FAの作成日時を返す */
	totpCreationDateTime?: number;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * UUIDに基づいてユーザーが存在するか検証するリクエストペイロード
 */
export type CheckUserExistsByUuidRequestDto = {
	/** ユーザーのUUID */
	uuid: string;
};

/**
 * UUIDに基づいてユーザーが存在するか検証するリクエストのレスポンス
 */
export type CheckUserExistsByUuidResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** ユーザーが既に存在するかどうか */
	exists: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};
