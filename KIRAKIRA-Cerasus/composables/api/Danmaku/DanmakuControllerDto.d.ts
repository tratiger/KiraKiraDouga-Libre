/**
 * 基本的な弾幕データ
 */
type BasicDanmakuDto = {
	/** 空でない - KVID 動画ID */
	videoId: number;
	/** 空でない - 弾幕の送信タイミング、単位：秒（小数をサポート） */
	time: number;
	/** 空でない - 弾幕テキスト */
	text: string;
	/** 空でない - 弾幕の色 */
	color: string;
	/** 空でない - 弾幕のフォントサイズ、バックエンドでは3つのデータのみを保存し、フロントエンドでCSSで利用可能なピクセル値にマッピングします */
	fontSize: "small" | "medium" | "large";
	/** 空でない - 弾幕の発射モード、デフォルトは 'rtl' —— 右から左へ発射 */
	mode: "ltr" | "rtl" | "top" | "bottom";
	/** 空でない - 虹色弾幕を有効にするかどうか、デフォルトでは無効 */
	enableRainbow: boolean;
};

/**
 * 弾幕送信リクエストのデータ
 */
export type EmitDanmakuRequestDto = BasicDanmakuDto & {};

/**
 * 弾幕送信レスポンスのデータ
 */
export type EmitDanmakuResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 送信に成功した場合、送信時の弾幕データを返します */
	danmaku?: EmitDanmakuRequestDto;
};

/**
 * 動画の弾幕リストを取得するリクエストのペイロード
 */
export type GetDanmakuByKvidRequestDto = {
	/** 空でない - KVID 動画ID */
	videoId: number;
};

/**
 * 動画の弾幕リストを取得するレスポンスの弾幕
 */
export type GetDanmakuByKvidDto = BasicDanmakuDto & {
	/** 弾幕の最終編集日時 */
	editDateTime: number;
};

/**
 * 動画の弾幕リストを取得するレスポンス
 */
export type GetDanmakuByKvidResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 送信に成功した場合、弾幕のデータリストを返します（ユーザーIDは含まず、最終編集日時を含む） */
	danmaku?: (GetDanmakuByKvidDto & { isBlockedByOther?: boolean })[];
};
