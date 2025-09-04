import { GET, POST, uploadFile2CloudflareImages } from "api/Common";
import type {
	AdminClearUserInfoRequestDto,
	AdminClearUserInfoResponseDto, AdminGetUserInfoResponseDto,
	ApproveUserInfoRequestDto, ApproveUserInfoResponseDto,
	CheckInvitationCodeRequestDto, CheckInvitationCodeResponseDto,
	CheckUserHave2FARequestDto,
	CheckUserHave2FAResponseDto,
	CheckUserTokenResponseDto,
	CheckUsernameRequestDto, CheckUsernameResponseDto,
	ConfirmUserTotpAuthenticatorRequestDto,
	ConfirmUserTotpAuthenticatorResponseDto, CreateInvitationCodeResponseDto,
	CreateUserEmailAuthenticatorResponseDto,
	CreateUserTotpAuthenticatorResponseDto,
	DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto,
	DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto,
	DeleteUserEmailAuthenticatorRequestDto,
	DeleteUserEmailAuthenticatorResponseDto, ForgotPasswordRequestDto, ForgotPasswordResponseDto, GetBlockedUserResponseDto, GetMyInvitationCodeResponseDto,
	GetSelfUserInfoRequestDto, GetSelfUserInfoResponseDto, GetUserAvatarUploadSignedUrlResponseDto,
	GetUserInfoByUidRequestDto, GetUserInfoByUidResponseDto, GetUserSettingsRequestDto,
	GetUserSettingsResponseDto, RequestSendChangeEmailVerificationCodeRequestDto,
	RequestSendChangeEmailVerificationCodeResponseDto, RequestSendChangePasswordVerificationCodeRequestDto,
	RequestSendChangePasswordVerificationCodeResponseDto, RequestSendForgotPasswordVerificationCodeRequestDto, RequestSendForgotPasswordVerificationCodeResponseDto, RequestSendVerificationCodeRequestDto,
	RequestSendVerificationCodeResponseDto,
	SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto,
	SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto,
	SendUserEmailAuthenticatorVerificationCodeRequestDto,
	SendUserEmailAuthenticatorVerificationCodeResponseDto, UpdateOrCreateUserInfoResponseDto, UpdateOrCreateUserSettingsRequestDto,
	UpdateOrCreateUserSettingsResponseDto, UpdateUserEmailRequestDto, UpdateUserEmailResponseDto, UpdateUserPasswordRequestDto,
	UpdateUserPasswordResponseDto,
	UserEmailExistsCheckRequestDto, UserEmailExistsCheckResponseDto,
	UserExistsCheckByUIDRequestDto,
	UserExistsCheckByUIDResponseDto, UserLoginRequestDto,
	UserLoginResponseDto, UserLogoutResponseDto, UserRegistrationRequestDto, UserRegistrationResponseDto,
} from "./UserControllerDto";

const BACK_END_URI = environment.backendUri;
const USER_API_URI = `${BACK_END_URI}user`;

/**
 * ユーザー登録
 * @param userRegistrationData - ユーザー登録時に送信されるパラメータ
 * @returns ユーザー登録のレスポンスパラメータ
 */
export const registration = async (userRegistrationData: UserRegistrationRequestDto): Promise<UserRegistrationResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/registering`, userRegistrationData, { credentials: "include" }) as UserRegistrationResponseDto;
};

/**
 * ユーザーログイン
 * @param userLoginRequest - ユーザーログイン時に送信されるパラメータ
 * @returns ユーザーログインのレスポンスパラメータ
 */
export const login = async (userLoginRequest: UserLoginRequestDto): Promise<UserLoginResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/login`, userLoginRequest, { credentials: "include" }) as UserLoginResponseDto;
};

/**
 * ユーザーのメールアドレスが既に登録されているかを確認します
 * @param userExistsCheckRequest - ユーザーのメールアドレスが存在するかどうかを検証するために送信されるパラメータ
 * @returns ユーザーのメールアドレスが既に存在するかどうかを検証した後のレスポンスパラメータ
 */
export const userExistsCheck = async (userExistsCheckRequest: UserEmailExistsCheckRequestDto): Promise<UserEmailExistsCheckResponseDto> => {
	return await GET(`${USER_API_URI}/existsCheck?email=${userExistsCheckRequest.email}`) as UserEmailExistsCheckResponseDto;
};

/**
 * ユーザーのメールアドレス変更
 * @param updateUserEmailRequest - ユーザーのメールアドレス変更リクエストのペイロード
 * @returns ユーザーのメールアドレス変更のレスポンスパラメータ
 */
export const updateUserEmail = async (updateUserEmailRequest: UpdateUserEmailRequestDto): Promise<UpdateUserEmailResponseDto> => {
	return await POST(`${USER_API_URI}/update/email`, updateUserEmailRequest, { credentials: "include" }) as UpdateUserEmailResponseDto;
};

/**
 * ユーザー情報の作成または更新
 * @param updateOrCreateUserInfoRequest - ユーザー情報の作成または更新リクエストのペイロード
 * @returns ユーザー情報の作成または更新のレスポンス結果
 */
export const updateOrCreateUserInfo = async (updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto): Promise<UpdateOrCreateUserInfoResponseDto> => {
	return await POST(`${USER_API_URI}/update/info`, updateOrCreateUserInfoRequest, { credentials: "include" }) as UpdateOrCreateUserInfoResponseDto;
};

type AppSettingsStoreType = ReturnType<typeof useAppSettingsStore>;
type SelfUserInfoStoreType = ReturnType<typeof useSelfUserInfoStore>;
/**
 * 現在ログインしているユーザーの情報を取得します。前提として、トークンに正しいuidとtokenが含まれている必要があります。同時に、グローバル変数のユーザー情報を充実させます
 * @param getSelfUserInfoRequest - 現在ログインしているユーザーの情報を取得するためのリクエストパラメータ
 * @param pinia - pinia
 * @returns ユーザー情報
 */
export const getSelfUserInfo = async (props: { getSelfUserInfoRequest: GetSelfUserInfoRequestDto | undefined; appSettingsStore: AppSettingsStoreType | undefined; selfUserInfoStore: SelfUserInfoStoreType | undefined; headerCookie: { cookie?: string | undefined } | undefined }): Promise<GetSelfUserInfoResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	const { data } = await useFetch<GetSelfUserInfoResponseDto>(
		`${USER_API_URI}/self`,
		{
			method: "POST",
			headers: props.headerCookie,
			body: { ...props.getSelfUserInfoRequest },
			credentials: "include",
		},
	);
	const selfUserInfoResult = data.value?.result;
	if (data.value?.success && selfUserInfoResult) {
		if (props.appSettingsStore)
			props.appSettingsStore.authenticatorType = selfUserInfoResult.authenticatorType || "none";
		if (props.selfUserInfoStore) {
			props.selfUserInfoStore.isEffectiveCheckOnce = true; // ユーザー情報の取得に成功した場合にのみtrueに設定
			props.selfUserInfoStore.isLogined = true;
			props.selfUserInfoStore.userInfo = data.value.result ?? {};
		}
	} else if (props.appSettingsStore && props.selfUserInfoStore)
		await userLogout({ appSettingsStore: props.appSettingsStore, selfUserInfoStore: props.selfUserInfoStore });
	return data.value as GetSelfUserInfoResponseDto;
};

/**
 * 渡されたUIDでユーザー情報を取得します（サーバーサイドレンダリング有効）
 * @param getUserInfoByUidRequest - 渡されたUID
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザー情報
 */
export const getUserInfo = async (getUserInfoByUidRequest: GetUserInfoByUidRequestDto, headerCookie?: { cookie?: string | undefined }): Promise<GetUserInfoByUidResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const result = await $fetch<GetUserInfoByUidResponseDto>(
		`${USER_API_URI}/info?uid=${getUserInfoByUidRequest.uid}`,
		{
			credentials: "include",
			headers: headerCookie,
			cache: "no-cache",
		},
	);
	return result;
};

/**
 * 渡されたUIDでユーザーが存在するかどうかを確認します
 * @param userExistsCheckByUIDRequest - ユーザーが存在するかどうかのリクエストペイロード
 * @returns ユーザーが存在するかどうかのレスポンス結果
 */
export const userExistsCheckByUID = async (userExistsCheckByUIDRequest: UserExistsCheckByUIDRequestDto): Promise<UserExistsCheckByUIDResponseDto> => {
	if (userExistsCheckByUIDRequest && userExistsCheckByUIDRequest.uid) {
		const { data: result } = await useFetch(`${USER_API_URI}/exists?uid=${userExistsCheckByUIDRequest.uid}`, { credentials: "include" }); // useFetchを使用してサーバーサイドレンダリングを有効にする
		return result.value as UserExistsCheckByUIDResponseDto;
	}
	return { success: false, message: "UIDが渡されていません", exists: false };
};

/**
 * ユーザートークンが正当かどうかを検証し、同時にユーザーがログインしているかどうかも検証できます
 * @returns ユーザー情報
 */
export const checkUserToken = async (): Promise<CheckUserTokenResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const result = await GET(`${USER_API_URI}/check`, { credentials: "include" }) as CheckUserTokenResponseDto;
	
	const selfUserInfoStore = useSelfUserInfoStore();
	if (result.success && result.userTokenOk)
		selfUserInfoStore.isLogined = true;
	if (environment.client && result && (!result.success || !result.userTokenOk))
		selfUserInfoStore.isEffectiveCheckOnce = true;
	return result;
};

/**
 * ユーザーログアウト
 * @returns 何も返しませんが、即時クリアされるクッキーを携帯し、元のクッキーを上書きします。同時に、グローバル変数のユーザー情報を空にします
 */
export async function userLogout(props: { appSettingsStore: AppSettingsStoreType | undefined; selfUserInfoStore: SelfUserInfoStoreType | undefined }): Promise<UserLogoutResponseDto> {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const logoutResult = await GET(`${USER_API_URI}/logout`, { credentials: "include" }) as UserLogoutResponseDto;
	if (logoutResult.success) {
		if (props.appSettingsStore)
			props.appSettingsStore.authenticatorType = "none";
		if (props.selfUserInfoStore) {
			props.selfUserInfoStore.isLogined = false;
			props.selfUserInfoStore.userInfo = {};
		}
	} else
		console.error("ERROR", "ログアウトに失敗しました。", logoutResult);
	return logoutResult;
}

/**
 * ユーザーアバターの更新：ユーザーがアバターをアップロードするための署名付きURLを取得します。アップロードは60秒に制限されています
 * @returns ユーザーアバターアップロード用の署名付きURL取得リクエストのレスポンス
 */
export const getUserAvatarUploadSignedUrl = async (): Promise<GetUserAvatarUploadSignedUrlResponseDto> => {
	return await GET(`${USER_API_URI}/avatar/preUpload`, { credentials: "include" }) as GetUserAvatarUploadSignedUrlResponseDto;
};

/**
 * 署名付きURLに基づいてユーザーアバターをアップロードします
 * @param fileName - アバターのファイル名
 * @param avatarBlobData - Blobでエンコードされたユーザーアバターファイル
 * @param signedUrl - 署名付きURL
 * @returns アップロードに成功した場合はtrue、失敗した場合はfalseを返します
 */
export const uploadUserAvatar = async (fileName: string, avatarBlobData: Blob, signedUrl: string): Promise<boolean> => {
	try {
		await uploadFile2CloudflareImages(fileName, signedUrl, avatarBlobData, 60000);
		return true;
	} catch (error) {
		console.error("ERROR", "アバターのアップロードに失敗しました:", error, { avatarBlobData, signedUrl });
		return false;
	}
};

/**
 * ユーザー設定を取得します。getUserSettingsRequestが渡され、cookie（uid、token）が提供されている場合は、getUserSettingsRequestのパラメータを使用します
 * @param getUserSettingsRequest - ユーザートークン
 * @returns ユーザー設定
 */
export const getUserSettings = async (request?: { getUserSettingsRequest?: GetUserSettingsRequestDto; headerCookie?: { cookie?: string | undefined } }): Promise<GetUserSettingsResponseDto> => {
	// NOTE: use { Cookie: request?.headerCookie?.cookie ?? "" } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const userSettings = await POST( // WARN: ここではネイティブのfetchメソッドを使用する必要があります。useFetchは使用しないでください。なぜなら、getUserSettingsはNuxtの管理外のミドルウェアから呼び出されるためです。
		`${USER_API_URI}/settings`,
		request?.getUserSettingsRequest,
		{
			credentials: "include",
		},
		{
			Cookie: request?.headerCookie?.cookie ?? "",
		},
	) as GetUserSettingsResponseDto;
	return userSettings;
};

/**
 * ユーザー設定を更新します
 * @param updateOrCreateUserSettingsRequest - 更新する設定項目
 * @returns ユーザー設定。同時に、更新された設定項目はset-cookieレスポンスヘッダーを生成します
 */
export const updateUserSettings = async (updateOrCreateUserSettingsRequest: UpdateOrCreateUserSettingsRequestDto): Promise<UpdateOrCreateUserSettingsResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/settings/update`, updateOrCreateUserSettingsRequest, { credentials: "include" }) as UpdateOrCreateUserSettingsResponseDto;
};

/**
 * 確認コードの送信を要求します
 * @param requestSendVerificationCodeRequest - 確認コード送信リクエストのペイロード
 * @returns 確認コード送信リクエストのレスポンス
 */
export const requestSendVerificationCode = async (requestSendVerificationCodeRequest: RequestSendVerificationCodeRequestDto): Promise<RequestSendVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/requestSendVerificationCode`, requestSendVerificationCodeRequest, { credentials: "include" }) as RequestSendVerificationCodeResponseDto;
};

/**
 * 招待コードが利用可能かを確認します
 * @param checkInvitationCodeRequestDto - 招待コードが利用可能かを確認するリクエストのペイロード
 * @returns 招待コードが利用可能かを確認するリクエストのレスポンス
 */
export const checkInvitationCode = async (checkInvitationCodeRequestDto: CheckInvitationCodeRequestDto): Promise<CheckInvitationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/checkInvitationCode`, checkInvitationCodeRequestDto, { credentials: "include" }) as CheckInvitationCodeResponseDto;
};

/**
 * 招待コードを生成します
 * @returns 招待コード生成リクエストのレスポンス
 */
export const createInvitationCode = async (): Promise<CreateInvitationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/createInvitationCode`, undefined, { credentials: "include" }) as CreateInvitationCodeResponseDto;
};

/**
 * ユーザーのすべての招待コードを取得します
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザーのすべての招待コード
 */
export const getMyInvitationCode = async (headerCookie: { cookie?: string | undefined }): Promise<GetMyInvitationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	try {
		const { data: result } = await useFetch(`${USER_API_URI}/myInvitationCode`, { headers: headerCookie, credentials: "include" });
		return result.value as GetMyInvitationCodeResponseDto;
	} catch (error) {
		console.error("ERROR", "ユーザーの招待コードの取得に失敗しました", error);
		return { success: false, message: "ユーザーの招待コードの取得に失敗しました", invitationCodeResult: [] };
	}
};

/**
 * メールアドレス変更の確認メール送信を要求します
 * @param requestSendChangeEmailVerificationCodeRequest - メールアドレス変更の確認メール送信リクエストのペイロード
 * @returns メールアドレス変更の確認メール送信リクエストのレスポンス
 */
export const requestSendChangeEmailVerificationCode = async (requestSendChangeEmailVerificationCodeRequest: RequestSendChangeEmailVerificationCodeRequestDto): Promise<RequestSendChangeEmailVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/requestSendChangeEmailVerificationCode`, requestSendChangeEmailVerificationCodeRequest, { credentials: "include" }) as RequestSendChangeEmailVerificationCodeResponseDto;
};

/**
 * パスワード変更の確認メール送信を要求します
 * @param requestSendChangePasswordVerificationCodeRequest - パスワード変更の確認メール送信リクエストのペイロード
 * @returns パスワード変更の確認メール送信リクエストのレスポンス
 */
export const requestSendChangePasswordVerificationCode = async (requestSendChangePasswordVerificationCodeRequest: RequestSendChangePasswordVerificationCodeRequestDto): Promise<RequestSendChangePasswordVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/requestSendChangePasswordVerificationCode`, requestSendChangePasswordVerificationCodeRequest, { credentials: "include" }) as RequestSendChangePasswordVerificationCodeResponseDto;
};

/**
 * ユーザーのパスワード変更
 * @param updateUserPasswordRequest - ユーザーのパスワード変更リクエストのペイロード
 * @returns ユーザーのパスワード変更のレスポンスパラメータ
 */
export const updateUserPassword = async (updateUserPasswordRequest: UpdateUserPasswordRequestDto): Promise<UpdateUserPasswordResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/update/password`, updateUserPasswordRequest, { credentials: "include" }) as UpdateUserPasswordResponseDto;
};

/**
 * パスワードを忘れた場合の確認メール送信を要求します
 * @param requestSendForgotPasswordVerificationCodeRequest - パスワードを忘れた場合の確認メール送信リクエストのペイロード
 * @returns パスワードを忘れた場合の確認メール送信リクエストのレスポンス
 */
export const requestSendForgotPasswordVerificationCode = async (requestSendForgotPasswordVerificationCodeRequest: RequestSendForgotPasswordVerificationCodeRequestDto): Promise<RequestSendForgotPasswordVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/requestSendForgotPasswordVerificationCode`, requestSendForgotPasswordVerificationCodeRequest, { credentials: "include" }) as RequestSendForgotPasswordVerificationCodeResponseDto;
};

/**
 * パスワードの回復（更新）
 * @param forgotPasswordRequest - パスワードの回復（更新）リクエストのペイロード
 * @returns パスワードの回復（更新）リクエストのレスポンス
 */
export const forgotAndResetPassword = async (forgotPasswordRequest: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/forgot/password`, forgotPasswordRequest, { credentials: "include" }) as ForgotPasswordResponseDto;
};

/**
 * ユーザー名が利用可能かを確認します
 * @param checkUsernameRequest - ユーザーのパスワード変更リクエストのペイロード
 * @returns ユーザーのパスワード変更のレスポンスパラメータ
 */
export const checkUsername = async (checkUsernameRequest: CheckUsernameRequestDto): Promise<CheckUsernameResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${USER_API_URI}/checkUsername?username=${checkUsernameRequest.username}`, { credentials: "include" }) as CheckUsernameResponseDto;
};

// /**
//  * UIDに基づいてユーザーをブロックする
//  * @param blockUserByUIDRequest ブロックするユーザーのリクエストペイロード
//  * @returns ブロックするユーザーのリクエストのレスポンス
//  */
// export const blockUserByUID = async (blockUserByUIDRequest: BlockUserByUIDRequestDto): Promise<BlockUserByUIDResponseDto> => {
// 	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
// 	return await POST(`${USER_API_URI}/blockUser`, blockUserByUIDRequest, { credentials: "include" }) as BlockUserByUIDResponseDto;
// };

// /**
//  * UIDに基づいてユーザーを再アクティブ化する
//  * @param reactivateUserByUIDRequest 再アクティブ化するユーザーのリクエストペイロード
//  * @returns 再アクティブ化するユーザーのリクエストのレスポンス
//  */
// export const reactivateUserByUID = async (reactivateUserByUIDRequest: ReactivateUserByUIDRequestDto): Promise<ReactivateUserByUIDResponseDto> => {
// 	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
// 	return await POST(`${USER_API_URI}/reactivateUser`, reactivateUserByUIDRequest, { credentials: "include" }) as ReactivateUserByUIDResponseDto;
// };

/**
 * すべてのブロックされたユーザーの情報を取得します
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns すべてのブロックされたユーザーの情報を取得するリクエストのレスポンス
 */
export const getBlockedUser = async (headerCookie: { cookie?: string | undefined }): Promise<GetBlockedUserResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(`${USER_API_URI}/blocked/info`, { headers: headerCookie, credentials: "include" });
	const userInfoResult = result.value as GetBlockedUserResponseDto;
	const finalUserInfoResult = userInfoResult?.result?.map(userInfo => {
		const finalResult = {
			avatar: "",
			...userInfo,
		};
		return finalResult;
	});
	return { ...userInfoResult, result: finalUserInfoResult };
};

/**
 * 管理者がユーザー情報を取得します
 * @param isOnlyShowUserInfoUpdatedAfterReview - 最終レビュー承認後にユーザー情報が変更されたユーザーのみを表示するかどうか
 * @param page - 現在のページ番号
 * @param pageSize - 1ページに表示するアイテム数
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns 管理者がユーザー情報を取得するためのリクエストのレスポンス
 */
export const adminGetUserInfo = async (isOnlyShowUserInfoUpdatedAfterReview: boolean, page: number, pageSize: number, headerCookie: { cookie?: string | undefined }): Promise<AdminGetUserInfoResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(`${USER_API_URI}/adminGetUserInfo?isOnlyShowUserInfoUpdatedAfterReview=${isOnlyShowUserInfoUpdatedAfterReview}&page=${page}&pageSize=${pageSize}`, { headers: headerCookie, credentials: "include" });
	return result.value as AdminGetUserInfoResponseDto;
};

/**
 * 管理者によるユーザー情報審査承認
 * @param approveUserInfoRequest - 管理者によるユーザー情報審査承認のリクエストペイロード
 * @returns 管理者によるユーザー情報審査承認のリクエストのレスポンス
 */
export const approveUserInfo = async (approveUserInfoRequest: ApproveUserInfoRequestDto): Promise<ApproveUserInfoResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/approveUserInfo`, approveUserInfoRequest, { credentials: "include" }) as ApproveUserInfoResponseDto;
};

/**
 * 管理者が特定のユーザーの情報をクリアします
 * @param adminClearUserInfoRequest - 管理者が特定のユーザーの情報をクリアするためのリクエストペイロード
 * @returns 管理者が特定のユーザーの情報をクリアするためのリクエストのレスポンス
 */
export const adminClearUserInfo = async (adminClearUserInfoRequest: AdminClearUserInfoRequestDto): Promise<AdminClearUserInfoResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/adminClearUserInfo`, adminClearUserInfoRequest, { credentials: "include" }) as AdminClearUserInfoResponseDto;
};

/**
 * UUIDでユーザーが2FA認証を有効にしているか確認します
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns UUIDでユーザーが2FA認証を有効にしているか確認するリクエストのレスポンス
 */
export const checkUserHave2FAByUUID = async (headerCookie: { cookie?: string | undefined }): Promise<CheckUserHave2FAResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(`${USER_API_URI}/checkUserHave2FAByUUID`, { headers: headerCookie, credentials: "include" });
	const checkUserHave2FAResponse = result.value as CheckUserHave2FAResponseDto;
	if (checkUserHave2FAResponse.success) {
		const appSettings = useAppSettingsStore();
		appSettings.authenticatorType = checkUserHave2FAResponse.type || "none";
	}
	return checkUserHave2FAResponse;
};

/**
 * メールアドレスでユーザーが2FA認証を有効にしているか確認します
 * @param checkUserHave2FARequest - メールアドレスでユーザーが2FA認証を有効にしているか確認するリクエストのペイロード
 * @returns メールアドレスでユーザーが2FA認証を有効にしているか確認するリクエストのレスポンス
 */
export const checkUserHave2FAByEmail = async (checkUserHave2FARequest: CheckUserHave2FARequestDto): Promise<CheckUserHave2FAResponseDto> => {
	const { data: result } = await useFetch(`${USER_API_URI}/checkUserHave2FAByEmail?email=${checkUserHave2FARequest.email}`);
	return result.value as CheckUserHave2FAResponseDto;
};

/**
 * ユーザーがTOTP認証システムを作成します
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザーがTOTP認証システムを作成するリクエストのレスポンス
 */
export const createTotpAuthenticator = async (headerCookie: { cookie?: string | undefined }): Promise<CreateUserTotpAuthenticatorResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(`${USER_API_URI}/createTotpAuthenticator`, { method: "POST", headers: headerCookie, credentials: "include" });
	return result.value as CreateUserTotpAuthenticatorResponseDto;
};

/**
 * ユーザーがTOTPデバイスの紐付けを確認します
 * @param confirmUserTotpAuthenticatorRequest - ユーザーがTOTPデバイスの紐付けを確認するリクエストのペイロード
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザーがTOTPデバイスの紐付けを確認するリクエストのレスポンス
 */
export const confirmUserTotpAuthenticator = async (confirmUserTotpAuthenticatorRequest: ConfirmUserTotpAuthenticatorRequestDto, headerCookie: { cookie?: string | undefined }): Promise<ConfirmUserTotpAuthenticatorResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(
		`${USER_API_URI}/confirmUserTotpAuthenticator`,
		{
			method: "POST",
			body: { ...confirmUserTotpAuthenticatorRequest },
			headers: headerCookie,
			credentials: "include",
		},
	);
	return result.value as ConfirmUserTotpAuthenticatorResponseDto;
};

/**
 * ログイン済みユーザーがパスワードとTOTP認証コードで認証システムを削除します
 * @param deleteTotpAuthenticatorByTotpVerificationCodeRequest - ログイン済みユーザーがパスワードとTOTP認証コードで認証システムを削除するためのリクエストペイロード
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ログイン済みユーザーがパスワードとTOTP認証コードで認証システムを削除するためのリクエストのレスポンス
 */
export const deleteTotpByVerificationCode = async (deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto, headerCookie: { cookie?: string | undefined }): Promise<DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(
		`${USER_API_URI}/deleteTotpAuthenticatorByTotpVerificationCodeController`,
		{
			method: "DELETE",
			body: { ...deleteTotpAuthenticatorByTotpVerificationCodeRequest },
			headers: headerCookie,
			credentials: "include",
		},
	);
	return result.value as DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto;
};

/**
 * ユーザーがメール認証システムを作成します
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザーがメール認証システムを作成するリクエストのレスポンス
 */
export const createEmail2FA = async (headerCookie: { cookie?: string | undefined }): Promise<CreateUserEmailAuthenticatorResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(
		`${USER_API_URI}/createEmailAuthenticator`,
		{
			method: "POST",
			headers: headerCookie,
			credentials: "include",
		},
	);

	return result.value as CreateUserEmailAuthenticatorResponseDto;
};

/**
 * メール認証システムの確認コードを送信します
 * @param sendUserEmailAuthenticatorVerificationCodeRequest - メール認証システムの確認コードを送信するリクエストのペイロード
 * @returns メール認証システムの確認コードを送信するリクエストのレスポンス
 */
export const sendUserEmailAuthenticatorVerificationCode = async (sendUserEmailAuthenticatorVerificationCodeRequest: SendUserEmailAuthenticatorVerificationCodeRequestDto): Promise<SendUserEmailAuthenticatorVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/sendUserEmailAuthenticator`, sendUserEmailAuthenticatorVerificationCodeRequest, { credentials: "include" }) as SendUserEmailAuthenticatorVerificationCodeResponseDto;
};

/**
 * メール認証システムの削除確認コードを送信します
 * @param sendDeleteUserEmailAuthenticatorVerificationCodeRequest - メール認証システムの削除確認コードを送信するリクエストのペイロード
 * @returns メール認証システムの削除確認コードを送信するリクエストのレスポンス
 */
export const sendDeleteUserEmailAuthenticatorVerificationCode = async (sendDeleteUserEmailAuthenticatorVerificationCodeRequest: SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto): Promise<SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/sendDeleteUserEmailAuthenticator`, sendDeleteUserEmailAuthenticatorVerificationCodeRequest, { credentials: "include" }) as SendUserEmailAuthenticatorVerificationCodeResponseDto;
};

/**
 * ユーザーがメール2FAを削除します
 * @param deleteUserEmailAuthenticatorRequest - ユーザーがメール2FAを削除するリクエストのペイロード
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns ユーザーがメール2FAを削除するリクエストのレスポンス
 */
export const deleteEmail2FA = async (deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto, headerCookie: { cookie?: string | undefined }): Promise<DeleteUserEmailAuthenticatorResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(
		`${USER_API_URI}/deleteUserEmailAuthenticator`,
		{
			method: "DELETE",
			body: { ...deleteUserEmailAuthenticatorRequest },
			headers: headerCookie,
			credentials: "include",
		},
	);

	return result.value as CreateUserEmailAuthenticatorResponseDto;
};
