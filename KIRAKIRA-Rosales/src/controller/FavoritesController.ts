import { createFavoritesService, getFavoritesService } from '../service/FavoritesService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { CreateFavoritesRequestDto } from './FavoritesControllerDto.js'

/**
 * お気に入りを作成
 * @param ctx context
 * @param next context
 */
export const createFavoritesController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<CreateFavoritesRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const createFavoritesRequest: CreateFavoritesRequestDto = {
		/** お気に入りタイトル - 空でないこと */
		favoritesTitle: data?.favoritesTitle ?? '',
		/** お気に入り紹介 */
		favoritesBio: data.favoritesBio,
		/** お気に入りカバー */
		favoritesCover: data.favoritesCover,
		/** お気に入りの公開設定、デフォルト -1（非公開） */
		favoritesVisibility: data.favoritesVisibility ?? -1,
	}
	const createFavoritesResponse = await createFavoritesService(createFavoritesRequest, uid, token)
	ctx.body = createFavoritesResponse
	await next()
}

/**
 * 現在ログインしているユーザーのお気に入りリストを取得
 * @param ctx context
 * @param next context
 */
export const getFavoritesController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const getFavoritesResponse = await getFavoritesService(uid, token)
	ctx.body = getFavoritesResponse
	await next()
}
