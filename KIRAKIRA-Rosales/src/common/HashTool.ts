import bcrypt from 'bcrypt'

const HASH_ROUND = 8 // Bcryptハッシュのラウンド数。数値が大きいほど処理が遅くなり、安全になります。 // WARN 絶対に変更しないでください！
/**
 * Bcryptを使用してパスワードをハッシュ化します
 * @param password 元のパスワード
 * @returns ハッシュ化されたパスワード
 */
export function hashPasswordSync(password: string): string {
	return bcrypt.hashSync(password, HASH_ROUND)
}

/**
 * Bcryptでハッシュ化されたパスワードを検証します
 * @param passwordOrigin 元のパスワード
 * @param passwordHash Bcryptでハッシュ化されたパスワード
 * @returns 検証結果。有効な場合はtrue、無効な場合はfalseを返します
 */
export function comparePasswordSync(passwordOrigin: string, passwordHash: string): boolean {
	return bcrypt.compareSync(passwordOrigin, passwordHash)
}
