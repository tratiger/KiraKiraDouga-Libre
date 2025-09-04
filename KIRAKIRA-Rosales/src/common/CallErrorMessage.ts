/**
 * 長い文字列を毎回コピーすることなく、エラーテキストを自動生成します
 * @param message: string 追加表示文字列
 */
export const callErrorMessage = (message: string) => {
	return `<p>この先のエリアは、また後で探索しに来てくださいね。</p>   <p>KIRAKIRA 開発チームへのご参加を心よりお待ちしております: employee@kirakira.com</p>   <br/>   <div>${message}</div>`
}
