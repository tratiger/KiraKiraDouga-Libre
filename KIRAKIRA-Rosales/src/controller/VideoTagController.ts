import { isPassRbacCheck } from '../service/RbacService.js'
import { createVideoTagService, getVideoTagByTagIdService, searchVideoTagService } from '../service/VideoTagService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { CreateVideoTagRequestDto, GetVideoTagByTagIdRequestDto, SearchVideoTagRequestDto } from './VideoTagControllerDto.js'

/**
 * ユーザーが動画TAGを作成
 * @param ctx context
 * @param next context
 */
export const createVideoTagController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<CreateVideoTagRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const createVideoTagRequest: CreateVideoTagRequestDto = {
		/** 各言語に対応するTAG名 */
		tagNameList: data.tagNameList,
	}
	const createVideoTagResponse = await createVideoTagService(createVideoTagRequest, uid, token)
	ctx.body = createVideoTagResponse
	await next()
}


/**
 * TAG名でデータベース内の動画TAGを検索
 * @param ctx context
 * @param next context
 */
export const searchVideoTagController = async (ctx: koaCtx, next: koaNext) => {
	const tagNameSearchKey = ctx.query.tagName as string
	const searchVideoTagRequest: SearchVideoTagRequestDto = {
		/** TAG検索キーワード */
		tagNameSearchKey,
	}
	const searchVideoTagResponse = await searchVideoTagService(searchVideoTagRequest)
	ctx.body = searchVideoTagResponse
	await next()
}


/**
 * TAG IDでデータベース内の動画TAGを検索
 * @param ctx context
 * @param next context
 */
export const getVideoTagByTagIdController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<GetVideoTagByTagIdRequestDto>
	const getVideoTagByTagIdRequest: GetVideoTagByTagIdRequestDto = {
		tagId: data.tagId ?? [],
	}
	const getVideoTagByTagIdResponse = await getVideoTagByTagIdService(getVideoTagByTagIdRequest)
	ctx.body = getVideoTagByTagIdResponse
	await next()
}
