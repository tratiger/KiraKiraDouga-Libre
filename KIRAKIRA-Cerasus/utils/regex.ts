import safeRegex from "safe-regex";

/**
 * 文字列が正規表現のように見えるかどうかを判断します。
 * @param str - テスト対象の文字列。
 * @returns 文字列が正規表現のように見えるか？
 */
export function isLooksLikeRegexString(str: string) {
	// 1. 基本フォーマット：スラッシュで始まり、スラッシュで終わり、0〜6文字の正規表現フラグが続く
	const regexSyntax = /^\/(.+)\/([gimsuy]*)$/;
	const match = str.match(regexSyntax);
	if (!match) return false;

	// 2. patternとflagsが実際にRegExpを構築できるか検証する
	try {
		new RegExp(match[1], match[2]);
		return true;
	} catch {
		return false;
	}
}

/**
 * 正規表現が不正かどうかを検出します。
 * @param str - 検出対象の正規表現文字列。
 * @returns 正規表現が不正か？
 */
export function isIllegalRegexString(str: string) {
	try {
		return !safeRegex(str);
	} catch (error) {
		console.warn("WARN", "WARNING", "Error in isIllegalRegexString, default result is 'true' (your regex is illegal)", error);
		return true;
	}
}
