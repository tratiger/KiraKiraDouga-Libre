import { emitDanmakuService, getDanmakuListByKvidService } from '../service/DanmakuService.js'
import { isPassRbacCheck } from '../service/RbacService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { EmitDanmakuRequestDto, GetDanmakuByKvidRequestDto } from './DanmakuControllerDto.js'

/**
 * ユーザーが弾幕を送信
 * @param ctx context
 * @param next context
 * @returns 弾幕送信結果
 */
export const emitDanmakuController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<EmitDanmakuRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const emitDanmakuRequest: EmitDanmakuRequestDto = {
		/** 空でないこと - KVID 動画ID */
		videoId: data.videoId,
		/** 空でないこと - 弾幕送信タイミング、単位：秒（小数をサポート） */
		time: data.time,
		/** 空でないこと - 弾幕テキスト */
		text: data.text,
		/** 空でないこと - 弾幕色 */
		color: data.color,
		/** 空でないこと - 弾幕フォントサイズ。バックエンドは3種類のデータのみを保存し、フロントエンドでタイプに応じてCSSで利用可能なピクセルにマッピングします */
		fontSize: data.fontSize,
		/** 空でないこと - 弾幕モード。デフォルトは'rtl'（右から左へ） */
		mode: data.mode,
		/** 空でないこと - 虹色弾幕を有効にするか。デフォルトは無効 */
		enableRainbow: data.enableRainbow,
	}
	const emitDanmakuResponse = await emitDanmakuService(emitDanmakuRequest, uuid, token)
	ctx.body = emitDanmakuResponse
	await next()
}


export const getDanmakuListByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const videoId = ctx.query.videoId as string
	const getDanmakuByKvidRequest: GetDanmakuByKvidRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
	}
	const danmakuListResponse = await getDanmakuListByKvidService(getDanmakuByKvidRequest)
	ctx.body = danmakuListResponse
	await next()
}
