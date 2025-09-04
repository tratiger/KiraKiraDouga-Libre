// import { userTabs } from "layouts/user-page.vue";

const SETTINGS = "/settings";
// const USER = "/user";

/**
 * ページ切り替えアニメーションを設定します。
 * @param pageTransition - ページ切り替え参照変数。
 * @returns ルート切り替えリアクティブ変数。
 */
export function usePageTransition() {
	/** ページ切り替え参照変数。 */
	const pageTransition = ref("page-forward");

	watchRoute((slug, prevSlug, path, prevPath) => {
		pageTransition.value = "page-jump-in";
		if (prevPath.startsWith(path)) pageTransition.value = "page-backward";
		if (path.startsWith(prevPath)) pageTransition.value = "page-forward";
		if (path.startsWith(SETTINGS) !== prevPath.startsWith(SETTINGS)) pageTransition.value = "";
		if (prevPath === path) pageTransition.value = "page-backward";
		// if (path.startsWith(USER) && prevPath.startsWith(USER)) {
		// 	const [tab, prevTab] = [slug[2] || "", prevSlug[2] || ""];
		// 	const [index, prevIndex] = [userTabs.indexOf(tab), userTabs.indexOf(prevTab)];
		// 	pageTransition.value = index > prevIndex ? "right" : index < prevIndex ? "left" : "";
		// }
	});

	return pageTransition;
}

/**
 * ルートに基づいてレイアウトを動的に切り替えます。
 * @returns ルート切り替えリアクティブ変数。
 */
export function useDynamicLayout() {
	const layout = ref<LayoutKey>("responsive");

	watchRoute(slug => {
		if (slug[0] === "welcome") layout.value = "immersive";
		else layout.value = "responsive";
	}, true);

	return layout;
}
