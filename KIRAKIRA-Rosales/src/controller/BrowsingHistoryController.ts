import { createOrUpdateBrowsingHistoryService, getUserBrowsingHistoryWithFilterService } from '../service/BrowsingHistoryService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { CreateOrUpdateBrowsingHistoryRequestDto, GetUserBrowsingHistoryWithFilterRequestDto } from './BrowsingHistoryControllerDto.js'

/**
 * ユーザーの閲覧履歴を更新または作成
 * @param ctx context
 * @param next context
 */
export const createOrUpdateUserBrowsingHistoryController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<CreateOrUpdateBrowsingHistoryRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const createOrUpdateBrowsingHistoryRequest: CreateOrUpdateBrowsingHistoryRequestDto = {
		/** ユーザーのUUID - 空でないこと */
		uuid: data.uuid,
		/** 閲覧コンテンツのタイプ（例: video, photoなど） - 空でないこと */
		category: data.category,
		/** 閲覧コンテンツのユニークID - 空でないこと */
		id: data.id,
		/** 閲覧位置のアンカー。動画の場合は再生時間、アルバムの場合は前回閲覧したn番目の写真など。互換性のためにStringを使用 */
		anchor: data.anchor ?? null,
	}
	const createBrowsingHistoryResponse = await createOrUpdateBrowsingHistoryService(createOrUpdateBrowsingHistoryRequest, uuid, token)
	ctx.body = createBrowsingHistoryResponse
	await next()
}

/**
 * 全てまたはフィルタリングされたユーザーの閲覧履歴を、最終閲覧日時順（降順）で取得
 * @param ctx context
 * @param next context
 */
export const getUserBrowsingHistoryWithFilterController = async (ctx: koaCtx, next: koaNext) => {
	const videoTitle = ctx.query.videoTitle as string
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const getUserBrowsingHistoryWithFilterRequest: GetUserBrowsingHistoryWithFilterRequestDto = {
		/** フィルタリング条件 - 動画タイトル */
		videoTitle,
	}
	const getUserBrowsingHistoryWithFilterResponse = await getUserBrowsingHistoryWithFilterService(getUserBrowsingHistoryWithFilterRequest, uid, token)
	ctx.body = getUserBrowsingHistoryWithFilterResponse
	await next()
}
