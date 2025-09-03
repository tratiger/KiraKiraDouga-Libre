/**
 * 基本的な弾幕データ
 */
type BasicDanmakuDto = {
	/** 空でないこと - KVID 動画ID */
	videoId: number;
	/** 空でないこと - 弾幕送信タイミング、単位：秒（小数をサポート） */
	time: number;
	/** 空でないこと - 弾幕テキスト */
	text: string;
	/** 空でないこと - 弾幕色 */
	color: string;
	/** 空でないこと - 弾幕フォントサイズ。バックエンドは3種類のデータのみを保存し、フロントエンドでCSSのピクセル値にマッピングします */
	fontSize: 'small' | 'medium' | 'large';
	/** 空でないこと - 弾幕モード。デフォルトは'rtl'（右から左へ） */
	mode: 'ltr' | 'rtl' | 'top' | 'bottom';
	/** 空でないこと - 虹色弾幕を有効にするか。デフォルトは無効 */
	enableRainbow: boolean;
}

/**
 * 弾幕送信リクエストデータ
 */
export type EmitDanmakuRequestDto = BasicDanmakuDto & {}

/**
 * 弾幕送信レスポンスデータ
 */
export type EmitDanmakuResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 送信成功時、送信した弾幕のデータを返す */
	danmaku?: EmitDanmakuRequestDto;
}

/**
 * 動画の弾幕リスト取得リクエストペイロード
 */
export type GetDanmakuByKvidRequestDto = {
	/** 空でないこと - KVID 動画ID */
	videoId: number;
}

/**
 * 動画の弾幕リスト取得レスポンス内の弾幕
 */
export type GetDanmakuByKvidDto = BasicDanmakuDto & {
	/** 弾幕の最終編集日時 */
	editDateTime: number;
}

/**
 * 動画の弾幕リスト取得レスポンス
 */
export type GetDanmakuByKvidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、弾幕データリストを返す（ユーザーIDは含まず、最終編集日時を含む） */
	danmaku?: (GetDanmakuByKvidDto & { isBlockedByOther?: boolean })[];
}
