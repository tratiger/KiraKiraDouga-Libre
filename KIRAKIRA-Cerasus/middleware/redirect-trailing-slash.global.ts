/*
 * URLの末尾のスラッシュを削除します。
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineNuxtRouteMiddleware((to, from) => {
	if (to.path !== "/" && to.path.endsWith("/")) {
		const { path, query, hash } = to;
		const nextPath = path.replace(/\/+$/, "") || "/";
		const nextRoute = { path: nextPath, query, hash };
		return navigateTo(nextRoute, { redirectCode: 301 });
	}
});
