/**
 * テキストカーソル補助操作オブジェクト。
 */
export const Caret = {
	/**
	 * テキストカーソルの位置を取得します。
	 * @param input - 入力要素（もしあれば）。
	 * @returns テキストカーソルの位置。
	 */
	get(input?: MaybeRef<HTMLInputElement>) {
		if (input) {
			input = toValue(input);
			return input.selectionStart;
		}
		const selection = window.getSelection();
		if (selection === null) return null;
		return selection.anchorOffset;
	},

	/**
	 * テキストカーソルの位置を設定します。
	 * @param element - HTML DOM要素。
	 * @param offset - テキストカーソルの位置。
	 */
	set(element: MaybeRef<Element>, offset: number) {
		element = toValue(element);

		if (element instanceof HTMLInputElement) {
			element.setSelectionRange(offset, offset);
			return;
		}

		const range = document.createRange();
		const selection = window.getSelection();
		if (selection === null) return;

		if (!element.textContent) return;
		offset = Math.min(offset, element.textContent.length) - 1;
		if (offset < 0) return;
		range.setStart(element, offset);
		range.collapse(true);

		selection.removeAllRanges();
		selection.addRange(range);
	},

	/**
	 * テキストの選択をクリアします。
	 *
	 * 注意：選択したテキストを削除するのではなく、選択を解除するだけです。
	 */
	clear() {
		if (window.getSelection) {
			if (window.getSelection()?.empty) // Chrome
				window.getSelection()?.empty();
			else if (window.getSelection()?.removeAllRanges) // Firefox
				window.getSelection()?.removeAllRanges();
		} else if (document.selection) // IE?
			document.selection.empty();
	},
};

/**
 * 指定されたテキストボックスのカーソル位置にテキストを挿入します。テキストが選択されている場合は、それを置き換えます。
 * @param input - 入力ボックス。
 * @param text - 挿入するテキスト。
 */
export function insertTextToTextBox(input: MaybeRef<HTMLInputElement | HTMLTextAreaElement>, text: string = "") {
	input = toValue(input);
	const { selectionStart: start, selectionEnd: end, value } = input;
	if (start === null || end === null) return;
	const newValue = value.slice(0, start) + text + value.slice(end);
	const newCaret = start + text.length;
	input.value = newValue;
	input.setSelectionRange(newCaret, newCaret);
}
