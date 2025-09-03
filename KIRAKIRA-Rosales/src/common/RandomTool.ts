import crypto from 'crypto'

/**
 * 予測不可能なランダムな文字列を生成します。パフォーマンスは比較的低いです
 *
 * @param length 生成するランダムな文字列の長さ
 * @returns ランダムな文字列
 */
export const generateSecureRandomString = (length: number): string => {
	try {
		if (length && typeof length === 'number' && length > 0 && !!Number.isInteger(length)) {
			const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
			let result = ''
			while (length > 0) {
				const bytes = crypto.randomBytes(length)
				for (let i = 0; i < bytes.length && length > 0; i++) {
					const randomValue = bytes[i]
					if (randomValue < 256 - (256 % charset.length)) { // Avoid bias
						result += charset.charAt(randomValue % charset.length)
						length--
					}
				}
			}
			return result
		} else {
			console.error('something error in function generateSecureRandomString, required data length is empty or not > 0 or not Integer')
			return ''
		}
	} catch (e) {
		console.error('something error in function generateSecureRandomString', e)
		return ''
	}
}

/**
 * 予測可能なランダムな文字列を生成します。パフォーマンスは良好です // WARN
 *
 * @param length 生成するランダムな文字列の長さ
 * @returns ランダムな文字列
 */
export const generateRandomString = (length: number): string => {
	try {
		if (length && typeof length === 'number' && length > 0 && !!Number.isInteger(length)) {
			let text = ''
			const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

			for (let i = 0; i < length; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length))

			return text
		} else {
			console.error('something error in function generateSecureRandomString, required data length is empty or not > 0 or not Integer')
			return ''
		}
	} catch (e) {
		console.error('something error in function generateRandomString', e)
		return ''
	}
}

/**
 * 指定された範囲内のランダムな整数を返します（両端の値を含む）
 * @param num1 最初の数値
 * @param num2 2番目の数値
 * @returns 2つの数値の範囲内のランダムな整数
 */
export const getRandomNumberInRange = (num1: number, num2: number): number => {
	// num1がnum2より大きい場合、それらの値を交換します
	if (num1 > num2) {
		[num1, num2] = [num2, num1]
	}
	return Math.floor(Math.random() * (num2 - num1 + 1)) + num1
}

/**
 * 予測不可能な数字の検証コードを生成します
 * @param length 検証コードの桁数
 * @returns 予測不可能な数字の検証コード
 */
export const generateSecureVerificationNumberCode = (length: number): string => {
	const buffer = crypto.randomBytes(length) // n個のランダムなバイトを生成します
	const code = Array.from(buffer, byte => (byte % 10).toString()).join('') // ランダムなバイトを剰余演算で数値に変換します
	return code
}

/**
 * 渡された長さと文字セットに基づいて、予測不可能なランダムな文字列を生成します
 * @param length ランダムな文字列の桁数
 * @param charset ランダムな文字列の文字セット
 * @returns 予測不可能なランダムな文字列
 */
export const generateSecureVerificationStringCode = (length: number, charset: string): string => {
	const buffer = crypto.randomBytes(length) // n個のランダムなバイトを生成します
	const code = Array.from(buffer, byte => charset[byte % charset.length]).join('') // ランダムなバイトを文字セットにマッピングします
	return code
}
