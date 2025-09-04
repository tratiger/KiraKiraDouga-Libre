import { GET, POST } from "api/tools/fetch";
import { GetSelfUserInfoRequestDto, GetSelfUserInfoResponseDto, CheckUserTokenResponseDto, UserLogoutResponseDto, UserLoginRequestDto, UserLoginResponseDto, GetBlockedUserRequestDto } from "./UserControllerDto";

const USER_API_URI = `${backendUri}user`;

/**
 * ユーザーログイン
 * @param userLoginRequest ユーザーログイン時に送信するパラメータ
 * @returns ユーザーログインのレスポンスパラメータ
 */
export const userLogin = async (userLoginRequest: UserLoginRequestDto): Promise<UserLoginResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${USER_API_URI}/login`, userLoginRequest, { credentials: "include" }) as UserLoginResponseDto;
};

/**
 * 現在ログインしているユーザーの情報を取得します。前提として、トークンに正しいuidとtokenが含まれている必要があります。同時に、グローバル変数内のユーザー情報を更新します。
 * @param getSelfUserInfoRequest 現在ログインしているユーザーの情報を取得するリクエストパラメータ
 * @param usePinia リクエスト結果をPiniaに注入するかどうか
 * @returns ユーザー情報
 */
export const getSelfUserInfo = async (getSelfUserInfoRequest?: GetSelfUserInfoRequestDto, usePinia: boolean = true): Promise<GetSelfUserInfoResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const selfUserInfo = await POST(`${USER_API_URI}/self`, getSelfUserInfoRequest, { credentials: "include" }) as GetSelfUserInfoResponseDto;
	const selfUserInfoResult = selfUserInfo.result;
	if (selfUserInfo.success && selfUserInfoResult) {
		if (usePinia) {
			const selfUserInfoStore = useSelfUserInfoStore();
			selfUserInfoStore.isLogined = true;
			selfUserInfoStore.uid = selfUserInfoResult.uid;
			selfUserInfoStore.userCreateDateTime = selfUserInfoResult.userCreateDateTime ?? 0;
			selfUserInfoStore.roles = selfUserInfoResult.roles ?? ["user"];
			selfUserInfoStore.userEmail = selfUserInfoResult.email ?? "";
			selfUserInfoStore.userAvatar = selfUserInfoResult.avatar || "";
			selfUserInfoStore.username = selfUserInfoResult.username || "Anonymous"; // TODO: 多言語を使用して、ユーザー名が設定されていないユーザーに国際化されたデフォルトのユーザー名を提供する
			selfUserInfoStore.userNickname = selfUserInfoResult.userNickname || ""; // TODO: 多言語を使用して、ニックネームが設定されていないユーザーに国際化されたデフォルトのニックネームを提供する
			selfUserInfoStore.gender = selfUserInfoResult.gender || "";
			selfUserInfoStore.signature = selfUserInfoResult.signature || "";
			selfUserInfoStore.tags = selfUserInfoResult.label?.map(label => label.labelName) || [];
		}
	} else
		await userLogout(usePinia);
	return selfUserInfo;
};

/**
 * ユーザーのトークンが正当であるかを検証し、同時にユーザーがログインしているかを確認できます。
 * @returns ユーザー情報
 */
export const checkUserToken = async (): Promise<CheckUserTokenResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${USER_API_URI}/check`, { credentials: "include" }) as CheckUserTokenResponseDto;
};

/**
 * ユーザーログアウト
 * @param usePinia Piniaをクリアするかどうか
 * @returns 何も返しませんが、即時クリアのcookieを携帯して元のcookieを上書きし、同時にグローバル変数内のユーザー情報を空にします。
 */
export async function userLogout(usePinia: boolean = true): Promise<UserLogoutResponseDto> {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const logoutResult = await GET(`${USER_API_URI}/logout`, { credentials: "include" }) as UserLogoutResponseDto;
	if (logoutResult.success) {
		if (usePinia) {
			const selfUserInfoStore = useSelfUserInfoStore();
			selfUserInfoStore.isLogined = false;
			selfUserInfoStore.uid = undefined;
			selfUserInfoStore.userCreateDateTime = 0;
			selfUserInfoStore.roles = ["user"];
			selfUserInfoStore.userEmail = "";
			selfUserInfoStore.userAvatar = "";
			selfUserInfoStore.username = "";
			selfUserInfoStore.userNickname = "";
			selfUserInfoStore.gender = "";
			selfUserInfoStore.signature = "";
			selfUserInfoStore.tags = [];
		}
	} else
		console.error("ERROR", "ユーザーのログアウトに失敗しました"); // TODO: 多言語対応
	return logoutResult;
}

/**
 * 管理者がユーザー情報を取得する
 * @param isOnlyShowUserInfoUpdatedAfterReview 前回のレビュー承認後にユーザー情報を変更したユーザーのみ表示するか
 * @param sortBy ソートキー
 * @param sortOrder ソート順。選択可能な値：{ascend: 昇順, descend: 降順}
 * @param page 現在のページ番号
 * @param pageSize 1ページに表示するアイテム数
 * @returns 管理者がユーザー情報を取得するリクエストのレスポンス
 */
export const adminGetUserInfo = async (AdminGetUserInfoRequest: AdminGetUserInfoRequestDto): Promise<AdminGetUserInfoResponseDto> => {
	return await GET(`${USER_API_URI}/adminGetUserInfo?isOnlyShowUserInfoUpdatedAfterReview=${AdminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview}&page=${AdminGetUserInfoRequest.pagination.page}&pageSize=${AdminGetUserInfoRequest.pagination.pageSize}&sortBy=${AdminGetUserInfoRequest.sortBy}&sortOrder=${AdminGetUserInfoRequest.sortOrder}&uid=${AdminGetUserInfoRequest.uid}`, { credentials: "include" }) as AdminGetUserInfoResponseDto;
};

/**
 * 管理者がブロックされたユーザー情報を取得する
 */
export const adminGetBlockedUserInfo = async (GetBlockedUserRequest: GetBlockedUserRequestDto): Promise<GetBlockedUserResponseDto> => {
	return await GET(`${USER_API_URI}/blocked/info?uid=${GetBlockedUserRequest.uid}&page=${GetBlockedUserRequest.pagination.page}&pageSize=${GetBlockedUserRequest.pagination.pageSize}`, { credentials: "include" }) as GetBlockedUserResponseDto;
};

/**
 * 管理者がユーザー情報を削除する
 * @param AdminClearUserInfoRequest 管理者がユーザー情報を削除するリクエストペイロード
 * @returns 管理者がユーザー情報を削除するリクエストのレスポンス
 */
export const adminClearUserInfo = async (AdminClearUserInfoRequest: AdminClearUserInfoRequestDto): Promise<AdminClearUserInfoResponseDto> => {
	return await POST(`${USER_API_URI}/adminClearUserInfo`, AdminClearUserInfoRequest, { credentials: "include" }) as AdminClearUserInfoResponseDto;
};

/**
 * 管理者がユーザー情報を編集する
 * @param AdminEditUserInfoRequest 管理者がユーザー情報を編集するリクエストペイロード
 * @returns 管理者がユーザー情報を編集するリクエストのレスポンス
 */
export const adminEditUserInfo = async (AdminEditUserInfoRequest: AdminEditUserInfoRequestDto): Promise<AdminEditUserInfoResponseDto> => {
	return await POST(`${USER_API_URI}/adminEditUserInfo`, AdminEditUserInfoRequest, { credentials: "include" }) as AdminEditUserInfoResponseDto;
};
