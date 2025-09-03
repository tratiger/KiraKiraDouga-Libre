import { addRegexService, blockKeywordService, blockTagService, blockUserByUidService, getBlockListService, hideUserByUidService, removeRegexService, showUserService, unBlockKeywordService, unBlockTagService, unBlockUserService } from '../service/BlockService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { AddRegexRequestDto, BlockKeywordRequestDto, BlockTagRequestDto, BlockUserByUidRequestDto, GetBlockListRequestDto, HideUserByUidRequestDto, RemoveRegexRequestDto, ShowUserByUidRequestDto, UnblockKeywordRequestDto, UnblockTagRequestDto, UnblockUserByUidRequestDto } from './BlockControllerDto.js'

/**
 * ユーザーをブロック
 * @param ctx context
 * @param next context
 */
export const blockUserByUidController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<BlockUserByUidRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const blockUserByUidRequest: BlockUserByUidRequestDto = {
		blockUid: data.blockUid ?? -1,
	}

	ctx.body = await blockUserByUidService(blockUserByUidRequest, uuid, token)
	await next()
}

/**
 * ユーザーを非表示
 * @param ctx context
 * @param next context
 */
export const hideUserByUidController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<HideUserByUidRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const hideUserByUidRequest: HideUserByUidRequestDto = {
		hideUid: data.hideUid ?? -1,
	}

	ctx.body = await hideUserByUidService(hideUserByUidRequest, uuid, token)
	await next()
}

/**
 * キーワードをブロック
 * @param ctx context
 * @param next context
 */
export const blockKeywordController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<BlockKeywordRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const blockKeywordRequest: BlockKeywordRequestDto = {
		blockKeyword: data.blockKeyword ?? '',
	}

	ctx.body = await blockKeywordService(blockKeywordRequest, uuid, token)
	await next()
}

/**
 * タグをブロック
 * @param ctx context
 * @param next context
 */
export const blockTagController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<BlockTagRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const blockTagRequest: BlockTagRequestDto = {
		tagId: data.tagId,
	}

	ctx.body = await blockTagService(blockTagRequest, uuid, token)
	await next()
}

/**
 * 正規表現を追加
 * @param ctx context
 * @param next context
 */
export const addRegexController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<AddRegexRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const addRegexRequest: AddRegexRequestDto = {
		blockRegex: data.blockRegex ?? '',
	}

	ctx.body = await addRegexService(addRegexRequest, uuid, token)
	await next()
}

/**
 * ユーザーのブロックを解除
 * @param ctx context
 * @param next context
 */
export const unblockUserByUidController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<UnblockUserByUidRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const unblockUserByUidRequest: UnblockUserByUidRequestDto = {
		blockUid: data.blockUid ?? -1,
	}

	ctx.body = await unBlockUserService(unblockUserByUidRequest, uuid, token)
	await next()
}

/**
 * ユーザーを表示
 * @param ctx context
 * @param next context
 */
export const showUserByUidController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<ShowUserByUidRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const showUserByUidRequest: ShowUserByUidRequestDto = {
		hideUid: data.hideUid ?? -1,
	}

	ctx.body = await showUserService(showUserByUidRequest, uuid, token)
	await next()
}

/**
 * キーワードのブロックを解除
 * @param ctx context
 * @param next context
 */
export const unblockKeywordController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<UnblockKeywordRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const unblockKeywordRequest: UnblockKeywordRequestDto = {
		blockKeyword: data.blockKeyword ?? '',
	}

	ctx.body = await 	unBlockKeywordService(unblockKeywordRequest, uuid, token)
	await next()
}

/**
 * タグのブロックを解除
 * @param ctx context
 * @param next context
 */
export const unblockTagController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<UnblockTagRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const unblockTagRequest: UnblockTagRequestDto = {
		tagId: data.tagId ?? -1,
	}

	ctx.body = await unBlockTagService(unblockTagRequest, uuid, token)
	await next()
}

/**
 * 正規表現を削除
 * @param ctx context
 * @param next context
 */
export const removeRegexController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<RemoveRegexRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const removeRegexRequest: RemoveRegexRequestDto = {
		blockRegex: data.blockRegex ?? '',
	}
	ctx.body = await removeRegexService(removeRegexRequest, uuid, token)
	await next()
}

/**
 * ユーザーのブラックリストを取得
 * @param ctx context
 * @param next context
 */
export const getBlockListController = async (ctx: koaCtx, next: koaNext) => {
	const page = ctx.query.page as string
	const pageSize = ctx.query.pageSize as string
	const type = ctx.query.type as string
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const getBlockListRequest: GetBlockListRequestDto = {
		type: type ?? '',
		pagination: {
			page: parseInt(page || '1', 10) ?? 1,
			pageSize: parseInt(pageSize, 10) ?? Number.MAX_SAFE_INTEGER,
		},
	}

	ctx.body = await getBlockListService(getBlockListRequest, uuid, token)
	await next()
}
