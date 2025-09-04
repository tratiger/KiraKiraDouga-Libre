import { SMTPClient } from 'emailjs'
import { resolve } from 'path'

/**
 * メール本文のデータ、textとhtmlのどちらかは空にできません
 */
type EmailBodyType =
	| { text: string; html?: string }
	| { text?: string; html: string }
	| { text: string; html: string }

/**
 * 電子メールを送信する
 * @param to 受信者
 * @param title 電子メールの件名（subject）
 * @param body 電子メールの本文、詳細はEmailBodyTypeを参照
 * @returns 電子メールの送信結果
 */
export const sendMail = async (to: string, title: string, body: EmailBodyType) => {
	const smtpHost = process.env.SMTP_ENDPOINT
	const smtpPort = process.env.SMTP_PORT
	const smtpUsername = process.env.SMTP_USER_NAME
	const smtpPassword = process.env.SMTP_PASSWORD
	const KIRAKIRA_EMAIL_SENDER_ADDRESS = 'KIRAKIRA <no-reply@kirakira.moe>'

	if (!smtpHost) {
		console.error('ERROR', 'メールの送信に失敗しました。環境変数のsmtpHostが空です')
		throw new Error('メールの送信に失敗しました。smtpHostがnullです')
	}

	if (smtpPort === undefined || smtpPort === null) {
		console.error('ERROR', 'メールの送信に失敗しました。環境変数のsmtpPortが空か、不正なポートです')
		throw new Error('メールの送信に失敗しました。smtpPortがnullです')
	}

	if (!smtpUsername) {
		console.error('ERROR', 'メールの送信に失敗しました。環境変数のsmtpUsernameが空です')
		throw new Error('メールの送信に失敗しました。smtpUsernameがnullです')
	}

	if (!smtpPassword) {
		console.error('ERROR', 'メールの送信に失敗しました。環境変数のsmtpPasswordが空です')
		throw new Error('メールの送信に失敗しました。smtpPasswordがnullです')
	}

	if (!to) {
		console.error('ERROR', 'メールの送信に失敗しました。受信者が空です')
		throw new Error('メールを送信できません、受信者(TO)が空です')
	}

	if (!title) {
		console.error('ERROR', 'メールの送信に失敗しました。メールの件名（subject）が空です')
		throw new Error('メールを送信できません、メールの件名（subject）が空です')
	}

	if (title.length > 200) {
		console.warn('WARN', 'WARNING', '警告：現在のメールの件名（subject）の長さが200文字を超えています。長さを短くしてください。1000文字を超えるとメールは送信できません。')
	}

	if (title.length > 1000) {
		console.error('ERROR', 'メールの送信に失敗しました。メールの件名（subject）が長すぎます')
		throw new Error('メールを送信できません、件名（subject）が長すぎます')
	}

	if (!body.text && !body.html) {
		console.error('ERROR', 'メールの送信に失敗しました。メール本文のtextとhtmlが両方とも空です。少なくとも一方のデータを提供してください')
		throw new Error('メールを送信できません、本文のtextとhtmlがnullです')
	}

	// SMTPクライアントを設定し、ポートを指定します
	const client = new SMTPClient({
		user: smtpUsername, // あなたのSMTPユーザー名
		password: smtpPassword, // あなたのSMTPパスワード
		host: smtpHost, // あなたの地域に応じて適切なSMTPサーバーアドレスを選択してください
		port: parseInt(smtpPort, 10), // ポートを指定します（例：587または465）
		tls: true, // TLSを有効にする
		ssl: false,
	})

	// メール内容を設定
	const message = {
		text: body.text,
		from: KIRAKIRA_EMAIL_SENDER_ADDRESS, // 送信者のメールアドレス
		to, // 受信者のメールアドレス
		subject: title, // メールの件名
		attachment: [
			{
				data: body.html,
				alternative: true,
			},
			// #region 添付画像を埋め込む
			/* {
				path: resolve(import.meta.dirname, "../assets/images", "background.png"),
				type: "image/png",
				headers: { "Content-ID": "<background>" },
			}, */
			// 残念ながら、多くのメールクライアントはCSSのbackground-imageによる埋め込み画像表示をサポートしていません！
			{
				path: resolve(import.meta.dirname, "../assets/images", "banner.png"),
				type: "image/png",
				headers: { "Content-ID": "<banner>" },
			},
			// #endregion
		],
	}

	try {
		const result = await client.sendAsync(message)
		return { success: true, result, message: 'メールの送信に成功しました' }
	} catch (error) {
		console.error('ERROR', 'メールの送信に失敗しました、エラーが発生しました', error)
		return { success: false, result: undefined, message: 'メールの送信に失敗しました' }
	}
}

/**
 * Emailアドレスが有効かどうかを検証します
 * @param email 検証対象のEmailアドレス
 * @returns 検証結果、無効な場合はtrueを返します
 */
export function isInvalidEmail(email: string): boolean {
	return !email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]{2,}$/)
}
