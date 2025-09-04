/**
 * キュークラス。
 * dataが空の場合にundefinedを返し、ジェネリック制約を使用します。
 */
export class Queue<T> {
	data: T[];
	
	constructor(data: T[]) {
		this.data = data;
	}
	
	/**
	 * 新しい要素を配列の末尾に追加し、配列の新しい長さを返します。
	 * @param item - 配列に追加する新しい要素。
	 */
	push(item: T) {
		this.data.push(item);
	}
	
	/**
	 * 配列から最初の要素を削除して返します。配列が空の場合はundefinedを返し、配列は変更されません。
	 * @returns 削除された要素。
	 */
	pop() {
		return this.data.shift();
	}
	
	/**
	 * 配列の先頭に新しい要素を挿入し、配列の新しい長さを返します。
	 * @param item - 配列の先頭に挿入する要素。
	 */
	join(item: T) {
		this.data.unshift(item);
	}
}
