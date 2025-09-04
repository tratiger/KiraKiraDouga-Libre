/**
 * Elasticsearchドキュメントスキーマアイテムのtypeパラメータで許可される型
 */
type EsDocumentItemConstructorType = StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | unknown[] | ArrayConstructor | Record<string, EsDocumentItemType>

/**
 * Elasticsearchドキュメントスキーマアイテムの型
 */
type EsDocumentItemType = {
	type: EsDocumentItemConstructorType;
	required?: boolean;
}

type ArrayElementType<T> = T extends (infer U)[] ? U : T

/**
 * コンストラクタ型から対応するTypeScriptの基本型へマッピングします。オブジェクトの場合は再帰的に判断します
 */
type ConstructorTypeMapper<T> =
	T extends StringConstructor ? string :
		T extends NumberConstructor ? number :
			T extends BooleanConstructor ? boolean :
				T extends DateConstructor ? Date :
					T extends unknown[] ? EsSchema2TsType< ArrayElementType<T> >[] :
						T extends ArrayConstructor ? Array<unknown> :
							T extends Record<string, EsDocumentItemType> ? EsSchema2TsType<T> :
								never

/**
 * ガード型。Elasticsearchドキュメントスキーマアイテムにtypeが定義されていることを保証します。定義されていない場合はneverを返します
 */
type PropertyType<T> = T extends { type: infer R } ? ConstructorTypeMapper<R> : never

/**
 * ElasticsearchドキュメントスキーマをTs型に変換します
 *
 * この方法で定義されたスキーマとインデックス名は関連付けを確立でき、スキーマが正しいインデックス名に一致することを保証します（これはRustの「[スライス型](https://kaisery.github.io/trpl-zh-cn/ch04-03-slices.html)」の概念が解決しようとする問題に似ています）
 *
 * // WARN: required属性の値は true as const のように宣言する必要があります。単にtrueやfalseと書くだけでなく、必ず as const を付けてください。そうしないと有効になりません
 *
 * @example
 * // 例：スキーマとインデックス名を含むElasticsearchドキュメントオブジェクトを定義します
 * const fooDocument = {
 *   schema: {
 *     foo: { type: String },
 *     bar: { type: String, required: true as const },
 *     baz: {
 *       type: {
 *         foo1: { type: String },
 *         bar1: { type: Number, required: false as const },
 *       },
 *     },
 *   },
 *   indexName: 'test-index',
 * }
 *
 * // 上記のスキーマをEsSchema2TsTypeを使用して変換します
 * type fooDocumentType = EsSchema2TsType<typeof fooDocument.schema>;
 *
 * // 変換後のTypeScript型：
 * // type fooDocumentType = {
 * //   foo?: string,
 * //   bar: string,
 * //   baz?: {
 * //     foo1?: string,
 * //     bar1?: number,
 * //   },
 * // }
 *
 */
export type EsSchema2TsType<T> = {
	[P in keyof T as T[P] extends { required: true } ? P : never]: PropertyType<T[P]>;
} & {
	[P in keyof T as T[P] extends { required: true } ? never : P]+?: PropertyType<T[P]>;
}


// /**
//  * Elasticsearch 搜索时的数据类型映射
//  */
// type QueryTypeMapper<T> =
// 	T extends Record<string, string> ? string :
// 		T extends Record<string, number> ? number :
// 			T extends Record<string, boolean> ? boolean :
// 				T extends Record<string, QueryTypeMapper<T> > ? QueryTypeMapper<T> :
// 					never


// /** Elasticsearch Query，相当于 SQL 中的 WHERE LIKE */
// export type EsQueryType<T> = {
// 	[K in keyof T]?: QueryTypeMapper<T[K]>;
// }

/** Elasticsearchでの操作実行結果 */
export type EsResultType<T> = {
	/** Elasticsearchでの操作が成功したかどうか。成功ならtrue、失敗ならfalse */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 操作の実行結果 */
	result?: T[];
}
