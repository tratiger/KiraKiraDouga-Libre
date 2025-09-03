/**
 * crypto を使用して、ソルトなしの16進数 SHA-256 ハッシュを非同期で生成します。
 * @param input - 元の文字列。
 * @returns ハッシュ結果。
 */
export async function generateHash(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	// SHA-256 アルゴリズムを使用してハッシュを生成 // NOTE 安全なコンテキストでのみ使用可能、例：HTTPS, localhost, Web/Service Workers または ブラウザ拡張機能など
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	// ハッシュ値を64文字の16進数文字列に変換する
	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
