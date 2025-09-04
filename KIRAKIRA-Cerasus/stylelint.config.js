import propertiesOrder from "./stylelint-properties-order.js";

/** @type {import("stylelint").Config} */
export default {
	defaultSeverity: "error",
	extends: [
		"stylelint-config-standard",
		"stylelint-config-standard-scss",
	],
	overrides: [ // .vue/html ファイルの <style> タグ内のスタイルをスキャンします
		{
			files: ["**/*.{vue,html}"],
			customSyntax: "postcss-html",
		},
	],
	plugins: [
		"stylelint-scss",
		"stylelint-order",
		"@stylistic/stylelint-plugin",
	],
	languageOptions: {
		syntax: {
			properties: {
				// WARN: https://github.com/stylelint/stylelint/issues/8607
				"container-type": "normal | [[size | inline-size] || scroll-state]",
				// WARN: https://github.com/stylelint/stylelint/issues/8609
				"top": "| <anchor()>",
				"right": "| <anchor()>",
				"bottom": "| <anchor()>",
				"left": "| <anchor()>",
			},
			types: {
				// WARN: https://github.com/stylelint/stylelint/issues/8610
				"radial-gradient()": "| <color-interpolation-method>",
				"conic-gradient()": "| <color-interpolation-method>",
				"repeating-linear-gradient()": "| <color-interpolation-method>",
				"repeating-radial-gradient()": "| <color-interpolation-method>",
				"repeating-conic-gradient()": "| <color-interpolation-method>",
			},
		},
	},
	rules: {
		"media-feature-name-no-vendor-prefix": true, // autoprefixerでサポートされているブラウザプレフィックスを使用しないでください。
		"at-rule-no-vendor-prefix": true,
		"selector-no-vendor-prefix": true,
		"property-no-vendor-prefix": true,
		"value-no-vendor-prefix": true,
		"@stylistic/color-hex-case": "lower", // カラー値は小文字にする必要があります。
		"color-hex-length": "short", // カラー値は可能な限り短くする必要があります。
		"color-named": "always-where-possible", // 色に名前がある場合は、その名前で記述する必要があります。
		"function-disallowed-list": [/^rgb/, /^hsl/, /^hwb/], // 色は16進数でのみ表現でき、rgb、rgbaなどでの表現は許可されていません。
		"@stylistic/indentation": ["tab", { baseIndentLevel: "auto" }],
		"length-zero-no-unit": true,
		// "selector-class-pattern": /^[A-Za-z0-9]+$/, // ハイフンに戻しました。
		"value-keyword-case": null, // v-bindと競合します。
		"@stylistic/value-list-comma-newline-after": null,
		"@stylistic/max-line-length": null,
		"@stylistic/no-eol-whitespace": [true, { "ignore": ["empty-lines"] }],
		"no-descending-specificity": null,
		"function-url-quotes": "always",
		"@stylistic/string-quotes": "double",
		"@stylistic/block-opening-brace-space-before": "always",
		"@stylistic/block-closing-brace-empty-line-before": "never",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower",
		"import-notation": null,
		"at-rule-no-unknown": null,
		"function-no-unknown": null,
		"property-no-unknown": [true, { "severity": "warning" }],
		"declaration-property-value-no-unknown": null, // [true, { "severity": "warning" }],
		"declaration-empty-line-before": null,
		"custom-property-empty-line-before": null,
		"selector-pseudo-class-no-unknown": [true, {
			"ignorePseudoClasses": ["deep", "slotted", "global", "export", "vertical", "horizontal", "decrement", "increment", "component", "comp", "any-hover", "lang-latin"],
		}],
		"declaration-block-no-duplicate-properties": true,
		"declaration-block-no-duplicate-custom-properties": true,
		"font-family-no-duplicate-names": true,
		"keyframe-block-no-duplicate-selectors": true,
		"custom-property-no-missing-var-function": true,
		"keyframe-declaration-no-important": true,
		"font-family-no-missing-generic-family-keyword": true,
		"font-family-name-quotes": "always-where-recommended",
		"comment-empty-line-before": null,
		"function-calc-no-unspaced-operator": null, // calc() を入力し終える前に右下隅でエラーが頻発する問題を一時的に解決します。
		/* "comment-empty-line-before": ["always", {
			"except": ["first-nested"],
			"ignore": ["stylelint-commands"],
			"severity": "warning",
		}], */
		"at-rule-empty-line-before": ["always", {
			"except": ["first-nested"],
			"ignore": ["after-comment"],
			"ignoreAtRules": ["import", "include", "else", "return", "forward", "use", "debug", "extend"],
		}],
		"unit-disallowed-list": [
			"vw", "vh", "vmin", "vmax", // 代わりに dvw、dvh、dvmin、dvmax を使用してください。
			"cm", "mm", "Q", "in", "pc", "pt", "mozmm", // このような単位が合理的だと思いますか？
		],
		"number-max-precision": null,
		"scss/dollar-variable-empty-line-before": null,
		"scss/double-slash-comment-empty-line-before": null,
		/* "scss/double-slash-comment-empty-line-before": ["always", {
			"except": ["first-nested"],
			"ignore": ["between-comments", "stylelint-commands"],
			"severity": "warning",
		}], */
		"scss/at-extend-no-missing-placeholder": null, // 通常のクラス名を継承できます。
		/* "scss/dollar-variable-first-in-block": [true, {
			"ignore": ["comments", "imports"],
			"except": ["root", "function"],
		}], */
		"@stylistic/declaration-block-trailing-semicolon": "always",
		"@stylistic/declaration-block-semicolon-space-after": "always-single-line",
		"@stylistic/declaration-block-semicolon-space-before": "never",
		"@stylistic/declaration-colon-space-after": "always-single-line",
		"@stylistic/declaration-colon-space-before": "never",
		"@stylistic/function-comma-space-after": "always-single-line",
		"@stylistic/function-comma-space-before": "never",
		"@stylistic/function-parentheses-space-inside": "never-single-line",
		"@stylistic/media-feature-colon-space-after": "always",
		"@stylistic/media-feature-colon-space-before": "never",
		"@stylistic/media-feature-parentheses-space-inside": "never",
		"@stylistic/media-feature-range-operator-space-after": "always",
		"@stylistic/media-feature-range-operator-space-before": "always",
		"@stylistic/media-query-list-comma-space-after": "always-single-line",
		"@stylistic/media-query-list-comma-space-before": "never",
		"@stylistic/selector-attribute-brackets-space-inside": "never",
		"@stylistic/selector-attribute-operator-space-after": "never",
		"@stylistic/selector-attribute-operator-space-before": "never",
		"@stylistic/selector-combinator-space-after": "always",
		"@stylistic/selector-combinator-space-before": "always",
		"@stylistic/selector-list-comma-newline-after": "always",
		"@stylistic/selector-list-comma-newline-before": "never-multi-line",
		"@stylistic/selector-list-comma-space-after": "always-single-line",
		"@stylistic/selector-list-comma-space-before": "never",
		"@stylistic/selector-pseudo-class-parentheses-space-inside": "never",
		"@stylistic/value-list-comma-space-after": "always-single-line",
		"@stylistic/value-list-comma-space-before": "never",
		"order/order": [
			{
				"type": "at-rule",
				"name": "include",
				"hasBlock": false,
			},
			"dollar-variables",
			"custom-properties",
			"declarations",
			// "at-rules", // <-- important, `@media` should go before `&:pseudo`
			"rules",
		],
		"order/properties-order": [propertiesOrder, { "unspecified": "bottom", "severity": "warning" }],
	},
};
