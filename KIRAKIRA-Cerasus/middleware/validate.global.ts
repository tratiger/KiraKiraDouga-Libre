import { httpResponseStatusCodes } from "helpers/http-status";

const MEDIA_INFO_MODULE_WASM = "MediaInfoModule.wasm";
// const navigate = (path: string) => navigateTo(useLocalePath()(path));

export default defineNuxtRouteMiddleware(async (to, from) => {
	if (environment.client && environment.development)
		console.log("to", to, "\nfrom", from, "\nrouteBaseName(to)", useNuxtApp().$getRouteBaseName(to));

	if (environment.client)
		document.getElementById(STOP_TRANSITION_ID)?.remove();

	const routePath = getRoutePath({ route: to });
	const routeSlug = getLocaleRouteSlug(to), prevRouteSlug = getLocaleRouteSlug(from);
	const appSettingsStore = useAppSettingsStore();
	const settingPageId = currentSettingsPage(routeSlug);
	if (routeSlug[0] === "settings" && prevRouteSlug[0] !== "settings")
		appSettingsStore.exitSettingRoute = "/" + getRoutePath({ route: from });
	if (routePath === "settings")
		return navigate("/settings/" + appSettingsStore.lastSettingPage);
	if (settingPageId) {
		if (settingPageId === "exit")
			return navigate(appSettingsStore.getExitSettingRoute);
		appSettingsStore.lastSettingPage = settingPageId;
		return;
	}
	if (routeSlug[0] === "video") {
		const checkKvidResult = await checkKvid(routeSlug[1]);
		if (checkKvidResult === true) { // `checkKvidResult === true` is necessary!
			if (!routeSlug[1] || routeSlug.length >= 3 && !to.name)
				return navigate(`/video/${routeSlug[1]}`);
		} else
			return navigateToErrorPage(301);
	}
	if (routeSlug[0] === "user") {
		const uid = await getUserInfo(routeSlug[1]);
		if (typeof uid === "bigint") {
			if (!routeSlug[1] || routeSlug.length >= 3 && !to.name)
				return navigate(`/user/${uid}`);
		} else
			return navigateToErrorPage(404);
	}
	if (routeSlug.at(-1) === MEDIA_INFO_MODULE_WASM)
		return navigateTo(`/${MEDIA_INFO_MODULE_WASM}`);
	if (routeSlug[0] === "error") {
		const routeNumber = +routeSlug[1];
		if (routeSlug[1] === "") // 空文字列が0に変換されることについて……
			return;
		if (routeNumber === 404)
			return;
		if (routeNumber === 601)
			return navigateTo("/unsupported");
		if (routeNumber === 233)
			return abortNavigation({
				statusCode: 233,
				message: "楽しかった",
			});
		if (Number.isFinite(routeNumber)) // テスト、入力されたルートが数字であれば、対応する数字のエラーコードをトリガーできます。
			// isFiniteではなくNumber.isFiniteを使用することを忘れないでください。ご存知のように、"" == 0です……
			return abortNavigation({
				statusCode: routeNumber,
				message: httpResponseStatusCodes[routeNumber],
			});
	}
});

/**
 * KVIDが存在するかどうかを確認しますか？
 * @param kvidString - URL内のKVID文字列。
 * @returns 存在する場合はtrue、それ以外の場合はErrorを返します。
 */
async function checkKvid(kvidString: string): Promise<true | Error> {
	try {
		const match = kvidString.match(/(\d+)/);
		if (match) {
			const kvidBigInt = BigInt(match[0]);
			const kvidNumber = Number(kvidBigInt);
			if (kvidNumber.toString().includes("e")) return new Error(`入力したKVID: ${kvidNumber} はチルノが理解できる数値範囲を超えています`);
			const getVideoByKvidRequest: CheckVideoExistRequestDto = {
				videoId: kvidNumber,
			};
			const videoInfoResult = await api.video.checkVideoExistByKvid(getVideoByKvidRequest);
			if (videoInfoResult.success && videoInfoResult.exist)
				return true;
			else
				return new Error("入力したKVIDは存在しません");
		} else
			return new Error("KVIDを入力してください");
	} catch (e) {
		return new Error("入力したKVIDは不正です");
	}
}

/**
 * ユーザーがログインしている場合は、cookieのuidとtokenに基づいてユーザー情報を取得します（ユーザートークンの検証機能も兼ねています）。
 * ログインしていないか、検証に失敗した場合は、グローバル変数のユーザー情報をクリアし、残りのcookieをクリアします。
 * @param uid - 他のユーザーのUIDを明示的に指定します。
 */
async function getUserInfo(uid?: string) {
	// UIDが指定されている場合、そのUIDのユーザーページを開きます。
	if (uid) {
		let uidBigInt: bigint;
		try {
			uidBigInt = BigInt(uid);
		} catch { return new Error(`入力したUID: ${uid} は不正です`); }
		const uidNumber = Number(uidBigInt);
		if (uidNumber.toString().includes("e")) return new Error(`入力したUID: ${uidBigInt} はチルノが理解できる数値範囲を超えています`);
		const userInfoResult = await api.user.userExistsCheckByUID({ uid: uidNumber }); // TODO: UIDはnumberではなく、stringまたはbigintで保存するのが望ましいです。
		if (userInfoResult.success && userInfoResult.exists) return uidBigInt;
		else return new Error(`入力したUID: ${uidBigInt} のユーザーは存在しません`);
	}
	// UIDが指定されていない場合、自分のユーザーページを開きます。
	const checkUserResult = await api.user.checkUserToken();
	if (checkUserResult.success && checkUserResult.userTokenOk)
		try {
			const selfUserInfoStore = useSelfUserInfoStore();
			await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore: useAppSettingsStore(), selfUserInfoStore, headerCookie: undefined });
			if (!selfUserInfoStore.isLogined || selfUserInfoStore.userInfo.uid === undefined) throw new Error("Unlogined");
			return BigInt(selfUserInfoStore.userInfo.uid);
		} catch (error) { return new Error("ログイン情報が無効です。再度ログインしてください"); }
	else return new Error("まだログインしていません。ログインしてから再度お試しください");
}
