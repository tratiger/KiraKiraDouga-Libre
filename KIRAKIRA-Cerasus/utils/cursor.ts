type CursorType = "col-resize" | "grabbing" | null;

/**
 * マウスカーソルのスタイルを強制的に指定します。
 * @param cursor - カーソルのスタイル。nullの場合はクリアします。
 */
export function forceCursor(cursor: CursorType) {
	if (!cursor)
		document.documentElement.style.removeProperty("--cursor");
	else
		document.documentElement.style.setProperty("--cursor", cursor);
}
