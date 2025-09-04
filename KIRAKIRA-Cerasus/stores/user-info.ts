export const useSelfUserInfoStore = defineStore("user-info", {
	state: () => ({
		/**
		 * 少なくとも一度有効なユーザー検証が実行されたかどうか？
		 *
		 * 「少なくとも一度有効なユーザー検証」の定義は次のとおりです。
		 * 1. SSRまたはCSR時にユーザー情報の取得に成功した `${USER_API_URI}/self`。
		 * 2. CSR時にユーザートークンの検証に失敗した。（検証に失敗しても、これは有効な検証です）`${USER_API_URI}/check`
		 *
		 * // NOTE: 「有効な検証」とは、ユーザー検証が成功したことを意味するのではなく、プログラムがクライアントから提供された（または提供されなかった）信頼できるCookieを使用して少なくとも一度ユーザー検証を実行したことを意味します。
		 * // NOTE: 厳密な検証が必要な場合や、SSRとCSRが関わる特定の状況下では、isEffectiveCheckOnceがtrueの場合にのみ、isLoginedおよびその他のuseSelfUserInfoStoreのプロパティが有効、正確、信頼できるものとなります。
		 */
		isEffectiveCheckOnce: false,
		/** 既にログインしていますか？ */
		isLogined: false,
		/** ユーザー情報 */
		userInfo: { } as Exclude<GetSelfUserInfoByUuidResponseDto["result"], undefined>,
		/** サイドバーから一時的にアバターを非表示にしますか？ */
		tempHideAvatarFromSidebar: false,
	}),
});
