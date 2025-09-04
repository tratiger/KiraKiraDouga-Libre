import { addNewUid2FeedGroupService, administratorApproveFeedGroupInfoChangeService, administratorDeleteFeedGroupService, createFeedGroupService, createOrEditFeedGroupInfoService, deleteFeedGroupService, followingUploaderService, getFeedContentService, getFeedGroupCoverUploadSignedUrlService, getFeedGroupListService, removeUidFromFeedGroupService, unfollowingUploaderService } from "../service/FeedService.js";
import { isPassRbacCheck } from "../service/RbacService.js";
import { koaCtx, koaNext } from "../type/koaTypes.js";
import { AddNewUid2FeedGroupRequestDto, AdministratorApproveFeedGroupInfoChangeRequestDto, AdministratorDeleteFeedGroupRequestDto, CreateFeedGroupRequestDto, CreateOrEditFeedGroupInfoRequestDto, DeleteFeedGroupRequestDto, FollowingUploaderRequestDto, GetFeedContentRequestDto, RemoveUidFromFeedGroupRequestDto, UnfollowingUploaderRequestDto } from "./FeedControllerDto.js";

/**
 * ユーザーがクリエイターをフォロー
 * @param ctx context
 * @param next context
 * @return ユーザーがクリエイターをフォローするレスポンス
 */
export const followingUploaderController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<FollowingUploaderRequestDto>
	const { followingUid } = data

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	// RBAC 権限検証、フォロー対象ユーザーに対して
	if (!await isPassRbacCheck({ uid: followingUid, apiPath: ctx.path }, ctx)) {
		return
	}

	const feedingUploaderRequest: FollowingUploaderRequestDto = {
		followingUid: data.followingUid ?? -1
	}
	
	const feedingUploaderResult = await followingUploaderService(feedingUploaderRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * ユーザーがクリエイターのフォローを解除
 * @param ctx context
 * @param next context
 * @return ユーザーがクリエイターのフォローを解除するレスポンス
 */
export const unfollowingUploaderController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<UnfollowingUploaderRequestDto>

	const unfeedingUploaderRequest: UnfollowingUploaderRequestDto = {
		unfollowingUid: data.unfollowingUid ?? -1
	}
	
	const feedingUploaderResult = await unfollowingUploaderService(unfeedingUploaderRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * フィードグループを作成
 * @param ctx context
 * @param next context
 * @return フィードグループ作成レスポンス
 */
export const createFeedGroupController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<CreateFeedGroupRequestDto>

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const createFeedGroupRequest: CreateFeedGroupRequestDto = {
		feedGroupName: data.feedGroupName ?? "",
		withUidList: data.withUidList ?? [],
		withCustomCoverUrl: data.withCustomCoverUrl ?? "",
	}

	const feedingUploaderResult = await createFeedGroupService(createFeedGroupRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * フィードグループに新しいUIDを追加
 * @param ctx context
 * @param next context
 * @return フィードグループに新しいUIDを追加するレスポンス
 */
export const addNewUid2FeedGroupController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<AddNewUid2FeedGroupRequestDto>

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const addNewUser2FeedGroupRequest: AddNewUid2FeedGroupRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
		uidList: data.uidList ?? [],
	}

	const feedingUploaderResult = await addNewUid2FeedGroupService(addNewUser2FeedGroupRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * フィードグループからUIDを削除
 * @param ctx context
 * @param next context
 * @return フィードグループからUIDを削除するレスポンス
 */
export const removeUidFromFeedGroupController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<RemoveUidFromFeedGroupRequestDto>

	const removeUidFromFeedGroupRequest: RemoveUidFromFeedGroupRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
		uidList: data.uidList ?? [],
	}

	const feedingUploaderResult = await removeUidFromFeedGroupService(removeUidFromFeedGroupRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * フィードグループを削除
 * @param ctx context
 * @param next context
 * @return フィードグループ削除レスポンス
 */
export const deleteFeedGroupController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<DeleteFeedGroupRequestDto>

	const deleteFeedGroupRequest: DeleteFeedGroupRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
	}

	const feedingUploaderResult = await deleteFeedGroupService(deleteFeedGroupRequest, uuid, token)
	ctx.body = feedingUploaderResult
	await next()
}

/**
 * ユーザーのアバターアップロード用署名付きURLを取得（60秒間有効）
 * @param ctx context
 * @param next context
 * @return ユーザーのアバターアップロード用署名付きURL取得レスポンス
 */
export const getFeedGroupCoverUploadSignedUrlController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	ctx.body = await getFeedGroupCoverUploadSignedUrlService(uuid, token)
	await next()
}

/**
 * フィードグループ情報を作成または更新
 * フィードグループの名前やアバターURLの更新もこのインターフェースを使用
 * @param ctx context
 * @param next context
 * @return フィードグループ情報作成・更新レスポンス
 */
export const createOrEditFeedGroupInfoController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<CreateOrEditFeedGroupInfoRequestDto>

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const createOrEditFeedGroupInfoRequest: CreateOrEditFeedGroupInfoRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
		feedGroupName: data.feedGroupName ?? "",
		feedGroupCustomCoverUrl: data.feedGroupCustomCoverUrl ?? "",
	}

	ctx.body = await createOrEditFeedGroupInfoService(createOrEditFeedGroupInfoRequest, uuid, token)
	await next()
}

/**
 * // WARN: 管理者のみ
 * 管理者がフィードグループ情報の更新レビューを承認
 * @param ctx context
 * @param next context
 * @return 管理者がフィードグループ情報の更新レビューを承認するレスポンス
 */
export const administratorApproveFeedGroupInfoChangeController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<AdministratorApproveFeedGroupInfoChangeRequestDto>

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const administratorApproveFeedGroupInfoChangeRequest: AdministratorApproveFeedGroupInfoChangeRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
	}

	ctx.body = await administratorApproveFeedGroupInfoChangeService(administratorApproveFeedGroupInfoChangeRequest, uuid, token)
	await next()
}

/**
 * // WARN: 管理者のみ
 * 管理者がフィードグループを削除
 * @param ctx context
 * @param next context
 * @return 管理者がフィードグループを削除するレスポンス
 */
export const administratorDeleteFeedGroupController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const data = ctx.request.body as Partial<AdministratorDeleteFeedGroupRequestDto>

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const administratorDeleteFeedGroupRequest: AdministratorDeleteFeedGroupRequestDto = {
		feedGroupUuid: data.feedGroupUuid ?? "",
	}

	ctx.body = await administratorDeleteFeedGroupService(administratorDeleteFeedGroupRequest, uuid, token)
	await next()
}

/**
 * フィードグループを取得
 * @param ctx context
 * @param next context
 * @return フィードグループ取得レスポンス
 */
export const getFeedGroupListController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')

	ctx.body = await getFeedGroupListService(uuid, token)
	await next()
}

/**
 * フィードコンテンツを取得
 * @param ctx context
 * @param next context
 * @return フィードコンテンツ取得レスポンス
 */
export const getFeedContentController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')

	const page = ctx.query.page as string
	const pageSize = ctx.query.pageSize as string

	const getFeedContentRequest: GetFeedContentRequestDto = {
		feedGroupUuid: uuid ?? "",
		pagination: {
			page: parseInt(page || '1', 10) ?? 1,
			pageSize: parseInt(pageSize, 10) ?? 50,
		},
	}
	
	ctx.body = await getFeedContentService(getFeedContentRequest, uuid, token)
	await next()
}
