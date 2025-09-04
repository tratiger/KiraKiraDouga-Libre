import { resolve } from "path";

/**
 * ディレクトリのエイリアスを定義します。
 * @param dirname - ルートディレクトリのアドレス。
 * @param paths - ディレクトリ。
 * @returns エイリアスオブジェクト。
 */
export default function defineAlias(dirname: string, ...paths: string[]) {
	const aliases = {} as Record<string, string>;
	for (const path of paths) {
		const aliasName = path.match(/(?<=\/)[^/]*(?=\/*$)/)?.[0] ?? path;
		aliases[aliasName] = resolve(dirname, path);
	}
	return aliases;
}
