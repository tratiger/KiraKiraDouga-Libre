import { isPassRbacCheck } from '../service/RbacService.js'
import { approvePendingReviewVideoService, checkVideoExistByKvidService, deleteVideoByKvidService, getPendingReviewVideoService, getThumbVideoService, getVideoByKvidService, getVideoByUidRequestService, getVideoCoverUploadSignedUrlService, getVideoFileTusEndpointService, searchVideoByKeywordService, searchVideoByVideoTagIdService, updateVideoService } from '../service/VideoService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { ApprovePendingReviewVideoRequestDto, CheckVideoExistRequestDto, DeleteVideoRequestDto, GetVideoByKvidRequestDto, GetVideoByUidRequestDto, GetVideoFileTusEndpointRequestDto, SearchVideoByKeywordRequestDto, SearchVideoByVideoTagIdRequestDto, UploadVideoRequestDto } from './VideoControllerDto.js'

/**
 * 動画をアップロード
 * @param ctx context
 * @param next context
 * @returns 動画アップロード結果
 */
export const updateVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const data = ctx.request.body as Partial<UploadVideoRequestDto>
	const uploadVideoRequest: UploadVideoRequestDto = {
		title: data.title || '',
		videoPart: data.videoPart || [],
		image: data.image || '',
		uploaderId: data.uploaderId ?? -1,
		duration: data.duration ?? -1,
		description: data.description || '',
		videoCategory: data.videoCategory || '',
		copyright: data.copyright || '',
		originalAuthor: data.originalAuthor,
		originalLink: data.originalLink,
		pushToFeed: data.pushToFeed,
		ensureOriginal: data.ensureOriginal,
		videoTagList: data.videoTagList || [],
	}
	const esClient = ctx.elasticsearchClient
	const uploadVideoResponse = await updateVideoService(uploadVideoRequest, uid, token, esClient)
	ctx.body = uploadVideoResponse
	await next()
}

/**
 * ホームページに表示する動画を取得
 * // TODO: 現在は全動画を取得しているが、将来的にはおすすめ動画に最適化する
 * @param ctx context
 * @param next context
 * @returns ホームページに表示する動画
 */
export const getThumbVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const getThumbVideoResponse = await getThumbVideoService(uuid, token)
	ctx.body = getThumbVideoResponse
	await next()
}

/**
 * kvidで動画が存在するか取得
 * @param ctx context
 * @param next context
 * @returns 動画が存在するかどうか
 */
export const checkVideoExistController = async (ctx: koaCtx, next: koaNext) => {
	const videoId = ctx.query.videoId as string
	const CheckVideoExistRequestDto: CheckVideoExistRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await checkVideoExistByKvidService(CheckVideoExistRequestDto)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * kvidで動画詳細情報を取得
 * @param ctx context
 * @param next context
 * @returns 動画情報
 */
export const getVideoByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const videoId = ctx.query.videoId as string
	const uploadVideoRequest: GetVideoByKvidRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await getVideoByKvidService(uploadVideoRequest, uuid, token)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * UIDでユーザーがアップロードした動画を取得
 * @param ctx context
 * @param next context
 * @returns 取得した動画情報
 */
export const getVideoByUidController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const uid = ctx.query.uid as string
	const getVideoByUidRequest: GetVideoByUidRequestDto = {
		uid: uid ? parseInt(uid, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await getVideoByUidRequestService(getVideoByUidRequest, uuid, token)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * キーワードで動画を検索
 * @param ctx context
 * @param next context
 * @returns 取得した動画情報
 */
export const searchVideoByKeywordController = async (ctx: koaCtx, next: koaNext) => {
	const keyword = ctx.query.keyword as string
	const searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto = {
		keyword: keyword ?? '', // WARN '' means you can't find any video
	}
	const esClient = ctx.elasticsearchClient
	const searchVideoByKeywordResponse = await searchVideoByKeywordService(searchVideoByKeywordRequest, esClient)
	ctx.body = searchVideoByKeywordResponse
	await next()
}

/**
 * 動画ファイルTUSアップロードエンドポイントを取得
 * @param ctx context
 * @param next context
 * @returns 取得した動画情報
 */
export const getVideoFileTusEndpointController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const getVideoFileTusEndpointRequest: GetVideoFileTusEndpointRequestDto = {
		uploadLength: parseInt(ctx.get('Upload-Length'), 10),
		uploadMetadata: ctx.get('Upload-Metadata') || '',
	}

	const destination = await getVideoFileTusEndpointService(uid, token, getVideoFileTusEndpointRequest)
	ctx.set({
		'Access-Control-Expose-Headers': 'Location',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Origin': '*',
		Location: destination,
	})
	ctx.body = destination ? 'true' : 'false'
	await next()
}


/**
 * 動画カバー画像アップロード用署名付きURLを取得
 * @param ctx context
 * @param next context
 * @returns 動画カバー画像アップロード用署名付きURLレスポンス
 */
export const getVideoCoverUploadSignedUrlController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	ctx.body = await getVideoCoverUploadSignedUrlService(uid, token)
	await next()
}


/**
 * 動画TAG IDで動画データを検索
 * @param ctx context
 * @param next context
 * @returns 動画TAG IDで検索した動画データ
 */
export const searchVideoByVideoTagIdController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<SearchVideoByVideoTagIdRequestDto>
	const searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto = {
		tagId: data.tagId ?? [],
	}

	ctx.body = await searchVideoByVideoTagIdService(searchVideoByVideoTagIdRequest)
	await next()
}

/**
 * 動画IDで動画を削除
 * @param ctx context
 * @param next context
 * @returns 動画IDで動画を削除したレスポンス
 */
export const deleteVideoByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const data = ctx.request.body as Partial<DeleteVideoRequestDto>
	const deleteVideoRequest: DeleteVideoRequestDto = {
		videoId: data.videoId ?? -1,
	}

	const esClient = ctx.elasticsearchClient
	ctx.body = await deleteVideoByKvidService(deleteVideoRequest, uid, token, esClient)
	await next()
}

/**
 * レビュー待ち動画リストを取得
 * @param ctx context
 * @param next context
 * @returns レビュー待ち動画リスト取得レスポンス
 */
export const getPendingReviewVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	ctx.body = await getPendingReviewVideoService(uid, token)
	await next()
}

/**
 * レビュー待ち動画を承認
 * @param ctx context
 * @param next context
 * @returns レビュー待ち動画承認レスポンス
 */
export const approvePendingReviewVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const data = ctx.request.body as Partial<ApprovePendingReviewVideoRequestDto>
	const approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto = {
		videoId: data.videoId ?? -1,
	}

	ctx.body = await approvePendingReviewVideoService(approvePendingReviewVideoRequest, uid, token)
	await next()
}

