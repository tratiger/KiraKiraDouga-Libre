export { };

/**
 * グローバルな名前空間に入る型を宣言するか、グローバルな名前空間の既存の宣言に追加します。
 */
declare global {
	// type HtmlContext = Record<"body" | "bodyAppend" | "bodyAttrs" | "bodyPrepend" | "head" | "htmlAttrs", string[]>;

	/**
	 * ブール値とその文字列形式。
	 */
	type Booleanish = boolean | BooleanString;
	/**
	 * ブール値の文字列形式。
	 */
	type BooleanString = "true" | "false";
	/**
	 * 数字とその文字列形式。
	 */
	type Numberish = number | string;
	/**
	 * 人間が直接読める任意の型で、文字列、数値、bigintを含みます。
	 */
	type Readable = string | number | bigint;
	/**
	 * 警告を回避してanyを使いたいと聞きましたが？
	 */
	type Any = Parameters<typeof alert>[0];
	/**
	 * 何であれ、とにかくオブジェクトです。
	 */
	type AnyObject = Record<PropertyKey, Any>;
	/**
	 * なぜRecordはキーの型を手動で指定する必要があるのか？余計な手間です。
	 * @template T - 値の型。
	 */
	type RecordValue<T> = Record<PropertyKey, T>;
	/**
	 * 2次元の点を表すタプル。
	 */
	type TwoD = [number, number];
	/**
	 * 3次元の点を表すタプル。
	 */
	type ThreeD = [number, number, number];
	/**
	 * 4次元の点を表すタプル。
	 */
	type FourD = [number, number, number, number];
	/**
	 * 型を指定するか、その型を返す引数なしの関数を指定します。
	 * @template T - 指定された型、および引数なしの関数が返すその型。
	 */
	type TypeOrReturnToType<T> = T | (() => T);
	/**
	 * このオブジェクトは内部で作成され、`setTimeout()` および `setInterval()` から返されます。これを `clearTimeout()` または `clearInterval()` に渡して、スケジュールされた操作をキャンセルできます。
	 *
	 * デフォルトでは、`setTimeout()` または `setInterval()` を使用してタイマーをスケジュールすると、タイマーがアクティブである限りNode.jsのイベントループは実行し続けます。これらの関数から返される各 `Timeout` オブジェクトは、このデフォルトの動作を制御するために使用できる `timeout.ref()` および `timeout.unref()` 関数をエクスポートします。
	 */
	interface Timeout extends NodeJS.Timeout { }
	/**
	 * SCSSで定義された変数の値。numbersプロパティは数値型に変換された値を表します。
	 */
	interface IScssVariables extends DeepReadonly<Record<string, string> & { numbers: Record<string, number> }> { }
	/**
	 * SCSSで定義された変数の値を使用します。numbersプロパティは数値型に変換された値を表します。
	 */
	declare function useScssVariables(): IScssVariables;
	interface Window {
		/**
		 * Internet Explorerでのみ利用可能なActiveXオブジェクトで、新しいブラウザではundefinedを返します。
		 */
		ActiveXObject: undefined;
	}
	interface Document {
		/**
		 * Internet Explorerで利用可能なテキスト選択オブジェクト。
		 *
		 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/getSelection)
		 */
		selection: Selection | null;
	}
	interface ScreenOrientation {
		/**
		 * `ScreenOrientation` インターフェースの `lock()` プロパティは、ドキュメントの向きを指定された方向にロックします。
		 *
		 * なんとVSCodeがこの定義を削除してしまいました。
		 *
		 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ScreenOrientation/lock)
		 */
		lock(type: "any" | "natural" | "landscape" | "portrait" | OrientationType): Promise<void>;
	}
}
