export const useRecentKaomojiStore = defineStore("recent-kaomoji", () => {
	const max = ref(4);
	const kaomojis = reactive(["(╯￣Д￣)╯╘═╛ ", " (ノ=Д=)ノ┻━┻ ", "（╯#-皿-)╯~~╧═╧", "(╯’ – ‘)╯︵ ┻━┻"]);

	/**
	 * 最近使用した顔文字に追加します。
	 * @param kaomoji - 最近選択した顔文字。
	 */
	function add(kaomoji: string) {
		kaomojis.unshift(kaomoji);
		arrayRelist(kaomojis, [...new Set(kaomojis)].slice(0, max.value));
	}

	return { max, kaomojis, add };
},
{
	persist: {
		storage: piniaPluginPersistedstate.localStorage(),
	},
},
);
