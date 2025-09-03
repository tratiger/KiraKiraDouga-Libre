import EmailTemplate from "./EmailTemplate.js";

// 言語ファイル
import English from "../locales/English.js"; // 英語
import ChineseSimplified from "../locales/Chinese Simplified.js"; // 簡体字中国語
import French from "../locales/French.js"; // フランス語
import Japanese from "../locales/Japanese.js"; // 日本語
import Cantonese from "../locales/Cantonese.js"; // 広東語
import Indonesian from "../locales/Indonesian.js"; // インドネシア語
import Korean from "../locales/Korean.js"; // 韓国語
import ChineseTraditional from "../locales/Chinese Traditional.js"; // 繁体字中国語
import Vietnamese from "../locales/Vietnamese.js"; // ベトナム語


const languagePacks = {
	"zh-Hans-CN": ChineseSimplified,
	"zht": ChineseTraditional,
	"en": English,
	"fr": French,
	"ja": Japanese,
	"yue": Cantonese,
	"id": Indonesian,
	"ko": Korean,
	"vi": Vietnamese,
};

/**
 * クライアントの言語を判断し、対応する言語パックを返します
 * @param clientLanguage クライアントの言語
 * @param targetMail 対象のメール
 * @returns 対応する言語パックの内容、またはnull
 */
export const getI18nLanguagePack = (clientLanguage: string, targetMail: string) => {
	const languagePack = languagePacks[clientLanguage as keyof typeof languagePacks] ?? English;
	let messages = languagePack[targetMail as keyof typeof languagePack] as Record<string, string>;
	if (!messages) {
		messages = English[targetMail as keyof typeof English] as Record<string, string>;
		if (!messages) return null;
	}
	const { mailTitle } = messages;
	let mailHtml = EmailTemplate;
	Object.entries(messages).forEach(([key, value]) => mailHtml = mailHtml.replaceAll(`{{${key}}}`, value.replaceAll("\n", "<br>")));
	return { mailTitle, mailHtml };
};
