import { isPassRbacCheck } from '../service/RbacService.js'
import { adminDeleteVideoCommentService, cancelVideoCommentDownvoteService, cancelVideoCommentUpvoteService, deleteSelfVideoCommentService, emitVideoCommentDownvoteService, emitVideoCommentService, emitVideoCommentUpvoteService, getVideoCommentListByKvidService } from '../service/VideoCommentService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { AdminDeleteVideoCommentRequestDto, CancelVideoCommentDownvoteRequestDto, CancelVideoCommentUpvoteRequestDto, DeleteSelfVideoCommentRequestDto, EmitVideoCommentDownvoteRequestDto, EmitVideoCommentRequestDto, EmitVideoCommentUpvoteRequestDto, GetVideoCommentByKvidRequestDto } from './VideoCommentControllerDto.js'

/**
 * ユーザーが動画コメントを送信
 * @param ctx context
 * @param next context
 */
export const emitVideoCommentController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<EmitVideoCommentRequestDto>
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const emitVideoCommentRequest: EmitVideoCommentRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメント本文 */
		text: data.text,
	}
	const emitVideoCommentResponse = await emitVideoCommentService(emitVideoCommentRequest, uuid, token)
	ctx.body = emitVideoCommentResponse
	await next()
}

/**
 * KVIDで動画コメントリストを取得し、現在のユーザーが高評価/低評価しているか確認。していれば対応する値がtrueになる
 * @param ctx context
 * @param next context
 */
export const getVideoCommentListByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const videoId = ctx.query.videoId as string
	const page = ctx.query.page as string
	const pageSize = ctx.query.pageSize as string
	const getVideoCommentByKvidRequest: GetVideoCommentByKvidRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
		pagination: {
			page: parseInt(page || '1', 10) ?? 1,
			pageSize: parseInt(pageSize, 10) ?? Number.MAX_SAFE_INTEGER,
		},
	}
	const UUID = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const videoCommentListResponse = await getVideoCommentListByKvidService(getVideoCommentByKvidRequest, UUID, token)
	ctx.body = videoCommentListResponse
	await next()
}

/**
 * ユーザーが動画コメントに高評価
 * @param ctx context
 * @param next context
 */
export const emitVideoCommentUpvoteController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<EmitVideoCommentUpvoteRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const emitVideoCommentUpvoteRequest: EmitVideoCommentUpvoteRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントID */
		id: data.id,
	}
	const emitVideoCommentUpvoteResponse = await emitVideoCommentUpvoteService(emitVideoCommentUpvoteRequest, uid, token)
	ctx.body = emitVideoCommentUpvoteResponse
	await next()
}

/**
 * ユーザーが動画コメントに低評価
 * @param ctx context
 * @param next context
 */
export const emitVideoCommentDownvoteController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<EmitVideoCommentDownvoteRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const emitVideoCommentUpvoteRequest: EmitVideoCommentDownvoteRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントID */
		id: data.id,
	}
	const emitVideoCommentDownvoteResponse = await emitVideoCommentDownvoteService(emitVideoCommentUpvoteRequest, uid, token)
	ctx.body = emitVideoCommentDownvoteResponse
	await next()
}

/**
 * ユーザーが動画コメントの高評価を取り消し
 * @param ctx context
 * @param next context
 */
export const cancelVideoCommentUpvoteController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<CancelVideoCommentUpvoteRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントID */
		id: data.id,
	}
	const emitVideoCommentResponse = await cancelVideoCommentUpvoteService(cancelVideoCommentUpvoteRequest, uid, token)
	ctx.body = emitVideoCommentResponse
	await next()
}

/**
 * ユーザーが動画コメントの低評価を取り消し
 * @param ctx context
 * @param next context
 */
export const cancelVideoCommentDownvoteController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<CancelVideoCommentDownvoteRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントID */
		id: data.id,
	}
	const emitVideoCommentResponse = await cancelVideoCommentDownvoteService(cancelVideoCommentDownvoteRequest, uid, token)
	ctx.body = emitVideoCommentResponse
	await next()
}

/**
 * 自身が投稿した動画コメントを削除
 * @param ctx context
 * @param next context
 */
export const deleteSelfVideoCommentController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<DeleteSelfVideoCommentRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	const deleteSelfVideoCommentRequest: DeleteSelfVideoCommentRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントのルート */
		commentRoute: data.commentRoute,
	}
	const deleteSelfVideoCommentResponse = await deleteSelfVideoCommentService(deleteSelfVideoCommentRequest, uid, token)
	ctx.body = deleteSelfVideoCommentResponse
	await next()
}

/**
 * 管理者が動画コメントを削除
 * @param ctx context
 * @param next context
 */
export const adminDeleteVideoCommentController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<AdminDeleteVideoCommentRequestDto>
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uid, apiPath: ctx.path }, ctx)) {
		return
	}

	const adminDeleteVideoCommentRequest: AdminDeleteVideoCommentRequestDto = {
		/** KVID 動画ID */
		videoId: data.videoId,
		/** コメントのルート */
		commentRoute: data.commentRoute,
	}
	const adminDeleteVideoCommentResponse = await adminDeleteVideoCommentService(adminDeleteVideoCommentRequest, uid, token)
	ctx.body = adminDeleteVideoCommentResponse
	await next()
}
