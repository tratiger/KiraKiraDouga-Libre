/**
 * ユーザー登録時に送信されるパラメータ
 */
export type UserRegistrationRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** 認証コード */
	verificationCode: string;
	/** フロントエンドで一度Bcryptハッシュ化されたパスワード */
	passwordHash: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 登録時に使用した招待コード */
	invitationCode?: string;
	/** ユーザー名 */
	username: string;
	/** ニックネーム */
	userNickname?: string;
}

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
	/** 登録に成功した場合、トークンを返す。失敗した場合は偽値（undefined、null、または""） */
	token?: string;
	/** 追加メッセージ */
	message?: string;
}

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
}

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
	/** ログインに成功した場合、トークンを返す。失敗した場合は偽値（undefined、null、または""） */
	token?: string;
	/** パスワードのヒント */
	passwordHint?: string;
	/** 追加メッセージ */
	message?: string;
	/** クールダウン中か */
	isCoolingDown?: boolean;
	/** 認証タイプの種類 */
	authenticatorType?: 'email' | 'totp' | 'none';
}

/**
 * ユーザーが存在するか確認するリクエストパラメータ
 */
export type UserExistsCheckByUIDRequestDto = {
	/** ユーザーUID */
	uid: number;
}

/**
 * ユーザーが存在するか確認するレスポンス
 */
export type UserExistsCheckByUIDResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーが存在する場合はtrue、存在しない場合はfalse */
	exists: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーのメールアドレスが存在するか確認するために送信されるパラメータ
 */
export type UserEmailExistsCheckRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
}

/**
 * ユーザーのメールアドレスが既に存在するか確認した結果のレスポンスパラメータ
 */
export type UserEmailExistsCheckResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザーが存在する場合、またはクエリに失敗した場合（ペシミスティック）はtrue、存在しない場合はfalse */
	exists: boolean; // WARN: ユーザーが既に存在するか、クエリに失敗した場合（ペシミスティック）は、ユーザーが誤って重複したメールアドレスで登録するのを防ぐためにtrueを返します。
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがメールアドレスを変更するリクエストのパラメータ
 */
export type UpdateUserEmailRequestDto = {
	/** ユーザーID */
	uid: number;
	/** 古いメールアドレス */
	oldEmail: string;
	/** 新しいメールアドレス */
	newEmail: string;
	/** 一度ハッシュ化されたユーザーパスワード */
	passwordHash: string;
	/** 認証コード */
	verificationCode: string;
}

/**
 * ユーザーがメールアドレスを変更した結果のレスポンスパラメータ
 */
export type UpdateUserEmailResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ハッシュ化される前のパスワードとユーザー情報
 */
export type BeforeHashPasswordDataType = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
}

/**
 * ユーザーの個人タグ
 */
export type UserLabel = {
	/** タグID */
	id: number;
	/** タグ名 */
	labelName: string;
}

/**
 * ユーザーの連携アカウント
 */
export type UserLinkedAccounts = {
	/** 連携アカウントのプラットフォーム - 例："X" */
	platformId: string;
	/** 連携アカウントのユニークID */
	accountUniqueId: string;
}

/**
 * ユーザーの連携ウェブサイト
 */
export type UserWebsite = {
	/** 連携ウェブサイト名 - 例："私のホームページ" */
	websiteName: string;
	/** 連携ウェブサイトURL */
	websiteUrl: string;
}

/**
 * ユーザー情報更新・作成時のリクエストパラメータ
 */
export type UpdateOrCreateUserInfoRequestDto = {
	/** ユーザー名 */
	username?: string;
	/** ニックネーム */
	userNickname?: string;
	/** アバターのリンク */
	avatar?: string;
	/** ユーザー背景画像のリンク */
	userBannerImage?: string;
	/** 自己紹介 */
	signature?: string;
	/** 性別、男性、女性、カスタム（文字列） */
	gender?: string;
	/** 個人タグ */
	label?: UserLabel[];
	/** 誕生日 */
	userBirthday?: string;
	/** プロフィールページのMarkdown */
	userProfileMarkdown?: string;
	/** 連携アカウント */
	userLinkedAccounts?: UserLinkedAccounts[];
	/** 連携ウェブサイト */
	userWebsite?: UserWebsite;
}

/**
 * ユーザー情報更新・作成リクエストの結果
 */
export type UpdateOrCreateUserInfoResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {} & UpdateOrCreateUserInfoRequestDto;
}

/**
 * 現在ログインしているユーザーの情報を取得するリクエストパラメータ
 */
export type GetSelfUserInfoRequestDto = {
	/** ユーザーID */
	uid: number;
	/** ユーザーのIDトークン */
	token: string;
}

/**
 * UUIDで現在ログインしているユーザーの情報を取得するリクエストパラメータ
 */
export type GetSelfUserInfoByUuidRequestDto = {
	/** UUID */
	uuid: string;
	/** ユーザーのIDトークン */
	token: string;
}

/**
 * 現在ログインしているユーザーの情報を取得するレスポンス
 */
export type GetSelfUserInfoResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
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
}

/**
 * UUIDで現在ログインしているユーザーの情報を取得するレスポンス
 */
export type GetSelfUserInfoByUuidResponseDto = {} & GetSelfUserInfoResponseDto

/**
 * UIDでユーザー情報を取得するリクエストペイロード
 */
export type GetUserInfoByUidRequestDto = {
	/** 対象ユーザーのUID */
	uid: number;
}

/**
 * ユーザーのブロック状態
 */
type BlockState = { isBlockedByOther: boolean, isBlocked: boolean; isHidden: boolean }

/**
 * UIDでユーザー情報を取得するレスポンス
 */
export type GetUserInfoByUidResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** リクエスト結果 */
	result?: {
		/** ユーザー名 */
		username?: string;
		/** ニックネーム */
		userNickname?: string;
		/** アバターのリンク */
		avatar?: string;
		/** ユーザー背景画像のリンク */
		userBannerImage?: string;
		/** 自己紹介 */
		signature?: string;
		/** 性別、男性、女性、カスタム（文字列） */
		gender?: string;
		/** 個人タグ */
		label?: UserLabel[];
		/** ユーザー作成日時 */
		userCreateDateTime?: number;
		/** ユーザーのロール */
		roles?: string[];
		/** このユーザーをフォローしているか */
		isFollowing: boolean;
		/**
		 * 問い合わせたユーザーが自分自身か。
		 * このフィールドがtrueの場合、通常は誤ったリクエストを意味します。なぜなら、自分自身の情報を問い合わせるための専用のインターフェースがあるからです。
		 */
		isSlef: boolean;
	};
} & BlockState

/**
 * UIDとTOKENでユーザーを検証した結果
 */
export type CheckUserTokenResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ユーザー検証結果。正常なユーザーはtrue、不正なユーザーはfalse */
	userTokenOk?: boolean;
}

/**
 * ユーザーログアウトのレスポンス
 */
export type UserLogoutResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * アバターアップロード用署名付きURL取得（60秒間有効）
 */
export type GetUserAvatarUploadSignedUrlResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** アバターアップロード用署名付きURL */
	userAvatarUploadSignedUrl?: string;
	/** アバターアップロード用ファイル名 */
	userAvatarFilename?: string;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザープライバシーデータの表示設定
 */
type UserPrivaryVisibilitiesSettingDto = {
	/** プライバシーデータ項目ID - 空でないこと - 例：'birthday', 'follow', 'fans' */
	privaryId: string;
	/** 表示方法 - 空でないこと - 許可される値: {public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: 'public' | 'following' | 'private';
}

/**
 * 連携プラットフォームのプライバシー表示設定
 */
type UserLinkedAccountsVisibilitiesSettingDto = {
	/** 連携アカウントタイプ - 空でないこと - 例："X" */
	platformId: string;
	/** 表示方法 - 空でないこと - 許可される値: {public: 公開, following: フォロー中のみ, private: 非公開} */
	visibilitiesType: 'public' | 'following' | 'private';
}

/**
 * 基本的なユーザー個人設定タイプ
 */
export type BasicUserSettingsDto = {
	/** Cookieを有効にするか - 真偽値 */
	enableCookie?: boolean;
	/** テーマ設定（テーマタイプ） - 選択可能な値: {light: ライト, dark: ダーク, system: システムに従う} */
	themeType?: 'light' | 'dark' | 'system';
	/** テーマカラー - 文字列、カラーコード */
	themeColor?: string;
	/** カスタムテーマカラー - 文字列、#を含まない16進数カラーコード */
	themeColorCustom?: string;
	/** 壁紙（背景画像URL） - 文字列 */
	wallpaper?: string;
	/** カラーナビゲーションバーを有効にするか - 真偽値 */
	coloredSideBar?: boolean;
	/** データ通信量の使用設定 - 文字列, {standard: 標準, limit: 節約, preview: 先読み} */
	dataSaverMode?: 'standard' | 'limit' | 'preview';
	/** 検索推薦を無効にする - 真偽値 */
	noSearchRecommendations?: boolean;
	/** 関連動画の推薦を無効にする - 真偽値 */
	noRelatedVideos?: boolean;
	/** 検索履歴を無効にする - 真偽値 */
	noRecentSearch?: boolean;
	/** 視聴履歴を無効にする - 真偽値 */
	noViewHistory?: boolean;
	/** 動画を新しいウィンドウで開くか - 真偽値 */
	openInNewWindow?: boolean;
	/** 表示言語 - 文字列 */
	currentLocale?: string;
	/** タイムゾーン - 文字列 */
	timezone?: string;
	/** 単位系 - 文字列、メートル法、ヤード・ポンド法など */
	unitSystemType?: string;
	/** 開発者モードを有効にするか - 真偽値 */
	devMode?: boolean;
	/** 連携ウェブサイトのプライバシー設定 - 許可される値: {public: 公開, following: フォロー中のみ, private: 非公開} */
	userWebsitePrivacySetting?: 'public' | 'following' | 'private';
	/** プライバシーデータの表示設定 */
	userPrivaryVisibilitiesSetting?: UserPrivaryVisibilitiesSettingDto[];
	/** 連携アカウントのプライバシー設定 */
	userLinkedAccountsVisibilitiesSetting?: UserLinkedAccountsVisibilitiesSettingDto[];
	// /** 实验性：启用直角模式 - 布尔 */
	// sharpAppearanceMode?: boolean;
	// /** 实验性：启用扁平模式 - 布尔 */
	// flatAppearanceMode?: boolean;
}

/**
 * ページレンダリング用ユーザー設定取得リクエストパラメータ
 */
export type GetUserSettingsRequestDto = {} & GetSelfUserInfoRequestDto

/**
 * ページレンダリング用ユーザー設定取得レスポンス
 */
export type GetUserSettingsResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザー個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザー設定更新・作成リクエストパラメータ
 */
export type UpdateOrCreateUserSettingsRequestDto = {} & BasicUserSettingsDto

/**
 * ユーザー設定更新・作成レスポンス
 */
export type UpdateOrCreateUserSettingsResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** ユーザー個人設定 */
	userSettings?: { uid: number; editDateTime: number } & BasicUserSettingsDto;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザー登録メール認証コード送信リクエストペイロード
 */
export type RequestSendVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス - 空でないこと - ユニーク */
	email: string;
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
}

/**
 * ユーザーメール認証コード送信レスポンス
 */
export type RequestSendVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** タイムアウトしたか */
	isTimeout: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 招待コードの型
 */
type InvitationCode = {
	/** 招待コード生成ユーザーのUID - 空でないこと */
	creatorUid: number;
	/** 招待コード生成ユーザーのUUID - 空でないこと */
	creatorUUID: string;
	/** 招待コード - 空でないこと */
	invitationCode: string;
	/** 招待コード生成日時 - 空でないこと */
	generationDateTime: number;
	/** 招待コードが使用待ちとしてマークされているか - 空でないこと */
	isPending: boolean;
	/** 招待コードが使用不可としてマークされているか - 空でないこと */
	disabled: boolean;
	/** この招待コードを使用したユーザー */
	assignee?: number;
	/** 招待コード使用日時 */
	usedDateTime?: number;
}

/**
 * 招待コード生成レスポンス
 */
export type CreateInvitationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 招待コード生成がクールダウン中か（生成期限を超えると再度生成可能） */
	isCoolingDown: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 生成された招待コード */
	invitationCodeResult?: InvitationCode;
}

/**
 * 自身の招待コード取得レスポンス
 */
export type GetMyInvitationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 招待コードリスト */
	invitationCodeResult: InvitationCode[];
}

/**
 * 管理者による招待コードでのユーザー検索レスポンス
 */
export type AdminGetUserByInvitationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 招待コード検索結果 */
	userInfoResult: {
		/** ユーザーUID */
		uid?: number;
		/** ユーザーUUID */
		uuid?: string;
	};
}

/**
 * 招待コード使用リクエストペイロード
 */
export type UseInvitationCodeDto = {
	/** 使用された招待コード */
	invitationCode: string;
	/** 登録者のUID */
	registrantUid: number;
	/** 登録者のUUID */
	registrantUUID: string;
}

/**
 * 招待コード使用レスポンス
 */
export type UseInvitationCodeResultDto = {
	/** 認証コードの使用に成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 招待コードが利用可能か確認するリクエストペイロード
 */
export type CheckInvitationCodeRequestDto = {
	/** 使用する招待コード */
	invitationCode: string;
}

/**
 * 招待コードが利用可能か確認するレスポンス
 */
export type CheckInvitationCodeResponseDto = {
	/** 招待コードの生成に成功したか */
	success: boolean;
	/** 利用可能な招待コードか */
	isAvailableInvitationCode: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーメールアドレス変更認証コード送信リクエストペイロード
 */
export type RequestSendChangeEmailVerificationCodeRequestDto = {
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
	/** 新しいメールアドレス */
	newEmail: string;
}

/**
 * ユーザーメールアドレス変更認証コード送信レスポンス
 */
export type RequestSendChangeEmailVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン中か */
	isCoolingDown: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーパスワード変更認証コード送信リクエストペイロード
 */
export type RequestSendChangePasswordVerificationCodeRequestDto = {
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
}

/**
 * ユーザーパスワード変更認証コード送信レスポンス
 */
export type RequestSendChangePasswordVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン中か */
	isCoolingDown: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーパスワード変更リクエストパラメータ
 */
export type UpdateUserPasswordRequestDto = {
	/** 古いパスワード */
	oldPasswordHash: string;
	/** 新しいパスワード */
	newPasswordHash: string;
	/** 認証コード */
	verificationCode: string;
}

/**
 * ユーザーパスワード変更レスポンスパラメータ
 */
export type UpdateUserPasswordResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * パスワード忘れ認証コード送信リクエストペイロード
 */
export type RequestSendForgotPasswordVerificationCodeRequestDto = {
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
}

/**
 * パスワード忘れ認証コード送信レスポンス
 */
export type RequestSendForgotPasswordVerificationCodeResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** クールダウン中か */
	isCoolingDown: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * パスワード再設定（更新）リクエストペイロード
 */
export type ForgotPasswordRequestDto = {
	/** パスワードを忘れたアカウントのメールアドレス */
	email: string;
	/** 新しいパスワード */
	newPasswordHash: string;
	/** 認証コード */
	verificationCode: string;
}

/**
 * パスワード再設定（更新）レスポンス
 */
export type ForgotPasswordResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザー名が利用可能か確認するリクエストペイロード
 */
export type CheckUsernameRequestDto = {
	/** ユーザー名 */
	username: string;
}

/**
 * ユーザー名が利用可能か確認するレスポンス
 */
export type CheckUsernameResponseDto = {
	/** 実行結果。成功した場合はtrue、失敗した場合はfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 利用可能なユーザー名か */
	isAvailableUsername: boolean;
}

/**
 * 管理者が全ブロックユーザー情報を取得するリクエストペイロード
 */
export type GetBlockedUserRequestDto = {
	/** ソート対象フィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** UIDで検索 */
	uid?: number;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
};

/**
 * 管理者が全ブロックユーザー情報を取得するレスポンス
 */
export type GetBlockedUserResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** レスポンス結果、ブロックされたユーザー */
	result?: (
		GetUserInfoByUidResponseDto["result"] & {
			uid: number;
			UUID: string;
		}
	)[];
	/** データ総数 */
	totalCount: number;
}

/**
 * 管理者がユーザー情報を取得するリクエストペイロード
 */
export type AdminGetUserInfoRequestDto = {
	/** 前回のレビュー承認後にユーザー情報が変更されたユーザーのみ表示するか */
	isOnlyShowUserInfoUpdatedAfterReview: boolean;
	/** ソート対象フィールド */
	sortBy: string;
	/** ソート順 */
	sortOrder: string;
	/** UIDで検索 */
	uid?: number;
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
}

/**
 * 管理者がユーザー情報を取得するレスポンス
 */
export type AdminGetUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** リクエスト結果 */
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
}

/**
 * 管理者がユーザー情報のレビューを承認するリクエストペイロード
 */
export type ApproveUserInfoRequestDto = {
	/** ユーザーのUUID */
	UUID: string;
}

/**
 * 管理者がユーザー情報のレビューを承認するレスポンス
 */
export type ApproveUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 管理者が特定ユーザーの情報をクリアするリクエストペイロード
 */
export type AdminClearUserInfoRequestDto = {
	/** ユーザーのUID */
	uid: number;
}

/**
 * 管理者が特定ユーザーの情報をクリアするレスポンス
 */
export type AdminClearUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

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
		/** ニックネーム */
		userNickname?: string;
		/** アバターのリンク */
		avatar?: string;
		/** ユーザー背景画像のリンク */
		userBannerImage?: string;
		/** 自己紹介 */
		signature?: string;
		/** 性別、男性、女性、カスタム（文字列） */
		gender?: string;
		/** 誕生日 */
		userBirthday?: string;
		/** プロフィールページのMarkdown */
		userProfileMarkdown?: string;
		/** レビュー状態 */
		isUpdatedAfterReview?: boolean;
	}
}

/**
 * 管理者がユーザー情報を編集するレスポンス
 */
export type AdminEditUserInfoResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ログイン済みユーザーがパスワードとTOTP認証コードで認証を削除するリクエストペイロード
 */
export type DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto = {
	/** ユーザーのTOTP認証アプリの認証コード */
	clientOtp: string;
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
}

/**
 * ログイン済みユーザーがパスワードとメール認証コードで認証を削除するレスポンス
 */
export type DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** クールダウン中か */
	isCoolingDown?: boolean;
}

/**
 * ユーザーがTOTP認証を作成するレスポンス
 */
export type CreateUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証が既に存在するか */
	isExists: boolean;
	/** 存在する場合、認証タイプを返す */
	existsAuthenticatorType?: 'email' | 'totp';
	/** TOTP認証情報 */
	result?: {
		/** TOTPのユニークID、認証アプリのQRコード */
		otpAuth?: string;
	};
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがEmail認証を作成するレスポンス
 */
export type CreateUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証が既に存在するか */
	isExists: boolean;
	/** 存在する場合、認証タイプを返す */
	existsAuthenticatorType?: 'email' | 'totp';
	/** Email認証情報 */
	result?: {
		/** Email */
		email?: string;
		/** Email（小文字） */
		emailLowerCase?: string;
	};
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがTOTPデバイスのバインドを確認するリクエストペイロード
 */
export type ConfirmUserTotpAuthenticatorRequestDto = {
	/** ユーザーのデバイスで生成されたTOTP認証コード */
	clientOtp: string;
	/** TOTPのユニークID */
	otpAuth: string;
}

/**
 * ユーザーがTOTPデバイスのバインドを確認するレスポンス
 */
export type ConfirmUserTotpAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 結果 */
	result?: {
		/** 認証バックアップコード */
		backupCode?: string[];
		/** 認証リカバリーコード */
		recoveryCode?: string;
	};
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがEmail認証の認証メールを送信するリクエストペイロード
 */
export type SendUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** フロントエンドで一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
}

/**
 * ユーザーがEmail認証の認証メールを送信するレスポンス
 */
export type SendUserEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** タイムアウトしたか */
	isCoolingDown: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがEmail認証削除の認証メールを送信するリクエストペイロード
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのクライアント言語 */
	clientLanguage: string;
}

/**
 * ユーザーがEmail認証削除の認証メールを送信するレスポンス
 */
export type SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto = {} & SendUserEmailAuthenticatorVerificationCodeResponseDto

/**
 * Email認証コードが正しいか検証するリクエストペイロード
 */
export type CheckEmailAuthenticatorVerificationCodeRequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
	/** メール認証コード */
	verificationCode: string;
}

/**
 * Email認証コードが正しいか検証するレスポンス
 */
export type CheckEmailAuthenticatorVerificationCodeResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * ユーザーがEmail 2FAを削除するリクエストペイロード
 */
export type DeleteUserEmailAuthenticatorRequestDto = {
	/** 一度ハッシュ化されたパスワード */
	passwordHash: string;
	/** メール認証コード */
	verificationCode: string;
}

/**
 * ユーザーがEmail 2FAを削除するレスポンス
 */
export type DeleteUserEmailAuthenticatorResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * 2FAが有効か確認するリクエストペイロード
 */
export type CheckUserHave2FARequestDto = {
	/** ユーザーのメールアドレス */
	email: string;
}

/**
 * 2FAが有効か確認するレスポンス
 */
export type CheckUserHave2FAResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** 認証が存在するか */
	have2FA: boolean;
	/** 存在する場合、2FAのタイプを返す */
	type?: 'email' | 'totp';
	/** 存在し、結果がtotpの場合、2FAの作成日時を返す */
	totpCreationDateTime?: number;
	/** 追加メッセージ */
	message?: string;
}

/**
 * UUIDでユーザーが存在するか検証するリクエストペイロード
 */
export type CheckUserExistsByUuidRequestDto = {
	/** ユーザーのUUID */
	uuid: string;
}

/**
 * UUIDでユーザーが存在するか検証するレスポンス
 */
export type CheckUserExistsByUuidResponseDto = {
	/** 実行結果 */
	success: boolean;
	/** ユーザーが既に存在するか */
	exists: boolean;
	/** 追加メッセージ */
	message?: string;
}
