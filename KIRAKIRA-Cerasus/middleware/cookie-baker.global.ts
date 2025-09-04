export default defineNuxtRouteMiddleware(async (to, from) => {
	try {
		await cookieBaker();
	} catch (error) {
		console.error("ERROR", "ウェブクッキー☆を焼いているときに予期せぬエラーが発生しました：", error);
		if (from.path !== "/")
			navigateTo("/");
	}
});
