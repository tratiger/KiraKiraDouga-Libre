import type { GetUserBrowsingHistoryWithFilterRequestDto, GetUserBrowsingHistoryWithFilterResponseDto } from "./BrowsingHistoryControllerDto";

const BACK_END_URI = environment.backendUri;
const BROWSING_HISTORY_API_URI = `${BACK_END_URI}history`;

/**
 * すべてまたはフィルタリングされたユーザーの閲覧履歴を、特定のコンテンツの最終アクセス日時で降順にソートして取得します
 * @param getUserBrowsingHistoryWithFilterRequest - すべてまたはフィルタリングされたユーザーの閲覧履歴を取得するためのリクエストパラメータ
 * @param headerCookie - クライアントサイドからSSRリクエストを行う際に渡されるヘッダーのCookie部分。SSR時にバックエンドAPIに渡します
 * @returns すべてまたはフィルタリングされたユーザーの閲覧履歴を取得するリクエストのレスポンス結果
 */
export const getUserBrowsingHistoryWithFilter = async (getUserBrowsingHistoryWithFilterRequest: GetUserBrowsingHistoryWithFilterRequestDto, headerCookie: { cookie?: string | undefined }): Promise<GetUserBrowsingHistoryWithFilterResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	const { data: result } = await useFetch<GetUserBrowsingHistoryWithFilterResponseDto>(`${BROWSING_HISTORY_API_URI}/filter?videoTitle=${getUserBrowsingHistoryWithFilterRequest.videoTitle}`, { headers: headerCookie, credentials: "include" });
	if (result.value)
		return result.value;
	else
		return { success: false, message: "すべてまたはフィルタリングされたユーザーの閲覧履歴の取得に失敗しました" };
};
