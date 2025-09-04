import parser from "postcss-selector-parser";

const latinLangs = ["en", "vi", "id", "fr"] as const;

// 注意点として、:langセレクタは複数の言語を同時に選択することをサポートしていません。つまり、次のように書くことはできません：
// :lang(zh, en, ja)
// 以下のように書く必要があります：
// :is(:lang(zh), :lang(en), :lang(ja))

const transformPseudo: parser.SyncProcessor = selectors => {
	selectors.walk(selector => {
		if (selector.type === "pseudo" && selector.value.match(/:lang-latin$/)) {
			const newSelectorValue = `:is(${latinLangs.map(lang => `:lang(${lang})`).join(", ")})`;
			const newSelector = parser.pseudo({ value: newSelectorValue });
			selector.replaceWith(newSelector);
		}
	});
};

const componentRoot: PostCSSPlugin = (_opts = {}) => {
	return {
		postcssPlugin: "postcss-component-root",
		Rule(rule, _helper) {
			if (rule.selector.match(/:lang-latin(?![-_\w])/))
				rule.selector = parser(transformPseudo).processSync(rule.selector);
		},
	};
};
componentRoot.postcss = true;

export default componentRoot;
