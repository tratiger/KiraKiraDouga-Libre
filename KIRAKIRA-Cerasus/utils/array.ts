/*
 * JSのArrayには削除メソッドが標準で備わっていないし、prototypeを拡張するのも推奨されない。
 */

/**
 * 配列から指定されたインデックスの項目を削除します。
 * @param array - 配列。
 * @param index - インデックス値。
 */
export function arrayRemoveAt<T>(array: T[], index: number): void {
	array.splice(index, 1);
}

/**
 * 配列から指定された項目を削除します。重複する項目が複数ある場合は、最初のものだけを削除します。
 * @param array - 配列。
 * @param items - 項目。
 * @returns 正常に削除された数。
 */
export function arrayRemoveItem<T>(array: T[], ...items: T[]): number {
	let successes = 0;
	for (const item of items) {
		const index = array.indexOf(item);
		if (index === -1) continue;
		array.splice(index, 1);
		successes++;
	}
	return successes;
}

/**
 * 配列から指定されたすべての項目を削除します。
 * @param array - 配列。
 * @param items - 項目。
 * @returns 正常に削除された数。
 */
export function arrayRemoveAllItem<T>(array: T[], ...items: T[]) {
	let successes = 0;
	for (let i = array.length - 1; i >= 0; i--)
		if (items.includes(array[i])) {
			array.splice(i, 1);
			successes++;
		}
	return successes;
}

/**
 * 配列にその項目が含まれていない場合にのみ、配列の末尾に追加します。
 * @param array - 配列。
 * @param items - 項目。
 */
export function arrayPushUniquely<T>(array: T[], ...items: T[]) {
	for (const item of items)
		if (!array.includes(item))
			array.push(item);
}

/**
 * 配列を空にします。
 * @param array - 配列。
 */
export function arrayClearAll<T>(array: T[]): void {
	array.splice(0, Infinity);
}

/**
 * 元の配列を空にしてから、新しいデータを再注入します。
 * @param array - 元の配列。
 * @param items - 新しいデータ。
 */
export function arrayRelist<T>(array: T[], items: Iterable<T>): void {
	array.splice(0, Infinity, ...items);
}

/**
 * 配列に項目が含まれているかどうかを切り替えます。含まれている場合は削除し、含まれていない場合は追加します。
 * @param array - 配列。
 * @param item - 項目。
 * @param force - trueに設定すると追加のみ、falseに設定すると削除のみの一方向操作になります。
 */
export function arrayToggle<T>(array: T[], item: T, force?: boolean): void {
	const index = array.indexOf(item);
	if (index === -1 || force)
		array.push(item);
	else
		arrayRemoveAt(array, index);
}

/**
 * 配列からランダムに1つの項目を返します。
 * @param array - 配列。
 * @param record - ランダム記録。提供された場合、すべての項目が抽出されるまで同じ項目は抽出されません。
 * @returns 配列からランダムに選ばれた1つの項目。
 */
export function randomOne<T>(array: T[], record?: MaybeRef<number[]>): T {
	if (array.length === 0) return null as T;
	record = toValue(record);
	let index = randBetween(0, array.length - 1);
	if (record !== undefined) {
		if (record.length !== array.length + 1 || record.every((n, i) => !i || n)) {
			let last = +record[0];
			if (!Number.isFinite(last)) last = -1;
			arrayRelist(record, Array(array.length + 1).fill(0));
			record[0] = last;
		}
		while (record[index + 1] || index === record[0])
			index = randBetween(0, array.length - 1);
		record[index + 1] = 1;
		record[0] = index;
	}
	return array[index];
}

/**
 * 定数配列からオブジェクトにマッピングします。
 * @param array - **定数**の文字列配列。
 * @param callbackFn - オブジェクトの値を生成するコールバック関数。
 * @returns マッピングされたオブジェクト。
 */
export function arrayMapObjectConst<const T extends string, U>(array: readonly T[], callbackFn: (value: T, index: number, array: readonly T[]) => U) {
	return Object.fromEntries(array.map((value, index, array) => ([value, callbackFn(value, index, array)] as [T, U]))) as Record<T, U>;
}

/**
 * 任意の配列からオブジェクトにマッピングします。
 * @param array - 任意の配列。
 * @param callbackFn - オブジェクトのキーと値のタプルを生成するコールバック関数。
 * @returns マッピングされたオブジェクト。
 */
export function arrayMapObject<T, K extends PropertyKey, U>(array: T[], callbackFn: (value: T, index: number, array: T[]) => [K, U]) {
	return Object.fromEntries(array.map((value, index, array) => callbackFn(value, index, array))) as Record<K, U>;
}

/**
 * 配列の重複を除去します。
 * @param array - 配列。
 * @returns 注意：新しい配列が返されます。
 */
export function arrayToRemoveDuplicates<T>(array: T[]) {
	return [...new Set(array)];
}
