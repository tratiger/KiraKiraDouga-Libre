import { entries } from "../utils/object";

type Preprocessor = "scss" | "sass" | "less" | "stylus" | "postcss";
type AtRule = "import" | "use" | "require" | "forward" | "useAsGlobal";

type Entries = Record<Preprocessor, Partial<Record<AtRule, string[]>>> & { hoistUseStatements: boolean };

/**
 * すべてのスタイルファイルでインポートする必要があるスタイルを指定します。
 * @param userOptions - ユーザーが設定した先行インポート項目。
 * @returns グローバルにインポートされるスタイルリソース。
 */
export default function styleResources(userOptions: Partial<Entries>) {
	type PreprocessorOptions = { [p in Preprocessor]?: { additionalData: string } };
	const options = {} as PreprocessorOptions;
	for (const [preprocessor, atRules] of entries(userOptions)) {
		if (preprocessor === "hoistUseStatements" || typeof atRules !== "object") continue;
		let additionalData = "";
		for (const [atRule, paths] of entries(atRules)) {
			if (paths.length === 0) continue;
			additionalData += paths.map(path => {
				switch (atRule) {
					default:
						return `@${atRule} "${path}";`;
					case "useAsGlobal":
						return `@use "${path}" as *;`;
				}
			}).join("\n") + "\n";
		}
		if (additionalData.trim() !== "") options[preprocessor] = { additionalData };
	}
	return options;
}
