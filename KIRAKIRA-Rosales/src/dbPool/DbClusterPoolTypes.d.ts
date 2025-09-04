import { Types } from 'mongoose'

/**
 * データ操作の結果リスト（結果はオブジェクト配列）
 */
export type DbPoolResultsType<T> = {
	/** 操作が成功したかどうか */
	success: boolean;
	/** 追加メッセージ */
	message: string;
	/** エラー情報（もしあれば） */
	error?: unknown;
	/** データ操作の結果配列（もしあれば） */
	result?: T[];
}

/**
 * データ操作の結果（結果はオブジェクト）
 */
export type DbPoolResultType<T> = {
	/** 操作が成功したかどうか */
	success: boolean;
	/** 追加メッセージ */
	message: string;
	/** エラー情報（もしあれば） */
	error?: unknown;
	/** データ操作の結果オブジェクト（もしあれば） */
	result?: T;
}

/**
 * success 更新操作が成功したかどうか
 * message 追加メッセージ
 * error エラー情報（もしあれば）
 * result 更新操作の結果（もしあれば）
	* acknowledged 更新が成功したかどうか
	* matchedCount 一致した数（更新操作前に、更新されるべきデータに一致した数）
	* modifiedCount 実際に更新された数（更新操作後に、実際に更新されたデータ）
 */
export type UpdateResultType = {
	success: boolean;
	message: string;
	error?: unknown;
	result?: {
		acknowledged: boolean;
		matchedCount: number;
		modifiedCount: number;
	};
}

/**
 * MongoDBで使用可能なクエリ条件
 */
type MongoDBConditionsType<T> = {
	$gt?: number; // より大きい
	$gte?: number; // 以上
	$lt?: number; // より小さい
	$lte?: number; // 以下
	$ne?: number; // 等しくない

	$and?: QueryType<T>[]; // AND
	$or?: QueryType<T>[]; // OR
	$not?: QueryType<T>; // NOT

	$exists?: boolean; // プロパティが存在するかどうか。例: { 'phone.number': { $exists: true } } は phone.number を含むすべてのドキュメントを検索します
	$type?: string; // フィールドの型に一致します。例: { age: { $type: 'number' } }

	$in?: unknown[]; // フィールド値が配列内のいずれかの値に一致します。例: { status: { $in: ['A', 'B'] } }
	$nin?: unknown[]; // フィールド値が配列内のどの値とも一致しません
	$all?: unknown[]; //  配列フィールドに指定されたすべての要素が含まれます。例: { tags: { $all: ['tech', 'health'] } }
	$size?: number; // 配列のサイズ。例: { tags: { $size: 3 } }

	$elemMatch?: MongoDBConditionsType<T>; // データベース内の配列に、提供された条件に一致する要素が少なくとも1つあることを保証します

	$regex?: RegExp; // 正規表現
}

// データベースクエリ、SQLのWHEREに相当します
export type QueryType<T> = {
	[K in keyof T]?: T[K] extends Types.DocumentArray<unknown> ? MongoDBConditionsType<T> : T[K] | MongoDBConditionsType<T>;
} & Record< string, boolean | string | number | MongoDBConditionsType<T> >

// データベース更新、SQLのUPDATE SETに相当します
export type UpdateType<T> = {
	[K in keyof T]?: T[K];
}

// データベースSelectプロジェクション、SQLのSELECTに相当します
export type SelectType<T> = {
	[K in keyof T]?: 1;
}

// データベースソート、SQLのORDER BYに相当します
export type OrderByType<T> = {
	[K in keyof T]?: 1 | -1;
}
