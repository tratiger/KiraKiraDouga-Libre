export const useSelfUserInfoStore = defineStore("user-info", {
	state: () => ({
		/**
		 * 少なくとも一度、有効なユーザー検証が実行されたか？
		 *
		 * 「少なくとも一度の有効なユーザー検証」の定義は以下の通りです：
		 * 1. SSRまたはCSR時にユーザー情報 `${USER_API_URI}/self` の取得に成功した。
		 * 2. CSR時にユーザートークンの検証に失敗した。（検証には失敗したが、これも有効な検証の一環です）`${USER_API_URI}/check`
		 *
		 * // NOTE: 「有効な検証」とは、ユーザー検証が成功したことを指すのではなく、プログラムがクライアントから提供された（または提供されなかった）信頼できるCookieを使用して、少なくとも一度ユーザー検証を実行したことを指します。
		 * // NOTE: 厳格な検証が必要な場合や、SSRとCSRが両方関わる状況では、isEffectiveCheckOnceがtrueの場合にのみ、isLoginedおよび他のuseSelfUserInfoStoreのプロパティが有効、正確、信頼できるものとなります。
		 */
		isEffectiveCheckOnce: false,
		/** ログイン済みか？ */
		isLogined: false,
		/** 現在ログインしているユーザーのUID */
		uid: undefined as undefined | number,
		/** ユーザーのメールアドレス */
		userEmail: undefined as undefined | string,
		/** 現在のユーザーの登録日時 */
		userCreateDateTime: 0,
		/** 現在のユーザーのロール */
		roles: ["user"],
		/** 現在ログインしているユーザーのユーザー名。 */
		username: "",
		/** 現在ログインしているユーザーのニックネーム */
		userNickname: "",
		/** 現在ログインしているユーザーのアバター */
		userAvatar: "",
		/** 現在ログインしているユーザーの性別 */
		gender: "",
		/** 現在ログインしているユーザーの自己紹介またはプロフィール */
		signature: "",
		/** 現在ログインしているユーザーの誕生日 */
		birthday: 0,
		/** 現在ログインしているユーザーのタグ */
		tags: [] as string[],
		/** サイドバーから一時的にアバターを隠すか？ */
		tempHideAvatarFromSidebar: false,
	}),
});
