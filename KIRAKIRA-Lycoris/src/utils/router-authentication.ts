import { GetSelfUserInfoResponseDto } from "api/User/UserControllerDto";

/**
 * cookieに基づいてユーザー情報を取得し、そのユーザーが指定されたロールリストのいずれかに属しているかを確認します。
 * @param roles ユーザーのロール
 * @returns チェック結果
 */
export async function getUserInfoAndCheckRole(roles: string[]) {
	const userInfo = await getSelfUserInfo(undefined, false); // Piniaを更新せず、データのみ取得
	if (userInfo.success && roles.some(role => !!userInfo.result?.roles?.includes(role)))
		return true;
	else
		return false;
}

/**
 * 渡されたユーザー情報に基づいて、ユーザーが特定のロールに属しているかを確認します。
 * @param roles ユーザーのロール
 * @param selfUserInfo ユーザー情報
 * @returns チェック結果
 */
export function checkUserRole(roles: string[], selfUserInfo: GetSelfUserInfoResponseDto): boolean {
	if (noBackend) return true;
	if (selfUserInfo.success && roles.some(role => !!selfUserInfo.result?.roles?.includes(role)))
		return true;
	else
		return false;
}
