import { InferSchemaType, PipelineStage } from "mongoose";
import { AddNewUid2FeedGroupRequestDto, AddNewUid2FeedGroupResponseDto, AdministratorApproveFeedGroupInfoChangeRequestDto, AdministratorApproveFeedGroupInfoChangeResponseDto, AdministratorDeleteFeedGroupRequestDto, AdministratorDeleteFeedGroupResponseDto, CreateFeedGroupRequestDto, CreateFeedGroupResponseDto, CreateOrEditFeedGroupInfoRequestDto, CreateOrEditFeedGroupInfoResponseDto, DeleteFeedGroupRequestDto, DeleteFeedGroupResponseDto, FOLLOWING_TYPE, FollowingUploaderRequestDto, FollowingUploaderResponseDto, GetFeedContentRequestDto, GetFeedContentResponseDto, GetFeedGroupCoverUploadSignedUrlResponseDto, GetFeedGroupListResponseDto, RemoveUidFromFeedGroupRequestDto, RemoveUidFromFeedGroupResponseDto, UnfollowingUploaderRequestDto, UnfollowingUploaderResponseDto} from "../controller/FeedControllerDto.js";
import { FeedGroupSchema, FollowingSchema, UnfollowingSchema } from "../dbPool/schema/FeedSchema.js";
import { checkUserExistsByUuidService, checkUserTokenByUuidService, getUserUuid } from "./UserService.js";
import { QueryType, SelectType, UpdateType } from "../dbPool/DbClusterPoolTypes.js";
import { deleteDataFromMongoDB, findOneAndUpdateData4MongoDB, insertData2MongoDB, selectDataByAggregateFromMongoDB, selectDataFromMongoDB } from "../dbPool/DbClusterPool.js";
import { abortAndEndSession, commitAndEndSession, createAndStartSession } from "../common/MongoDBSessionTool.js";
import { CheckUserExistsByUuidRequestDto } from "../controller/UserControllerDto.js";
import { v4 as uuidV4 } from 'uuid'
import { generateSecureRandomString } from "../common/RandomTool.js";
import { createMinIOImageUploadSignedUrl } from "../minio/index.js"; 
import { VideoSchema } from "../dbPool/schema/VideoSchema.js";

/**
 * ユーザーがクリエイターをフォローする
 * @param followingUploaderRequest ユーザーがクリエイターをフォローするリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーがクリエイターをフォローするリクエストレスポンス
 */
export const followingUploaderService = async (followingUploaderRequest: FollowingUploaderRequestDto, uuid: string, token: string): Promise<FollowingUploaderResponseDto> => {
	try {
		if (!checkFollowingUploaderRequest(followingUploaderRequest)) {
			console.error('ERROR', 'ユーザーのフォローに失敗しました：パラメータが不正です。')
			return { success: false, message: 'ユーザーのフォローに失敗しました：パラメータが不正です。' }
		}

		const now = new Date().getTime()
		const followerUuid = uuid
		const { followingUid } = followingUploaderRequest

		const followingUuid = await getUserUuid(followingUid) as string

		if (followerUuid === followingUuid) {
			console.error('ERROR', 'ユーザーのフォローに失敗しました、自分自身をフォローすることはできません。')
			return { success: false, message: 'ユーザーのフォローに失敗しました：自分自身をフォローすることはできません。' }
		}

		if (!(await checkUserTokenByUuidService(followerUuid, token)).success) {
			console.error('ERROR', 'ユーザーのフォローに失敗しました、不正なユーザーです。')
			return { success: false, message: 'ユーザーのフォローに失敗しました、不正なユーザー' }
		}

		const checkFollowingUuidResult = await checkUserExistsByUuidService({ uuid: followingUuid })
		if (!checkFollowingUuidResult.success || (checkFollowingUuidResult.success && !checkFollowingUuidResult.exists)) {
			console.error('ERROR', 'ユーザーのフォローに失敗しました、フォロー対象のユーザーが存在しません。')
			return { success: false, message: 'ユーザーのフォローに失敗しました、フォロー対象のユーザーが存在しません。' }
		}

		const { collectionName: followingCollectionName, schemaInstance: followingSchemaInstance } = FollowingSchema
		type Following = InferSchemaType<typeof followingSchemaInstance>

		const getFollowingDataWhere: QueryType<Following> = {
			followerUuid,
			followingUuid,
		}

		const getFollowingDataSelect: SelectType<Following> = {
			followerUuid: 1,
			followingUuid: 1,
		}

		const session = await createAndStartSession()

		const getFollowingData = await selectDataFromMongoDB<Following>(getFollowingDataWhere, getFollowingDataSelect, followingSchemaInstance, followingCollectionName, { session })
		const getFollowingDataResult = getFollowingData.result
		if (getFollowingDataResult.length > 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーのフォローに失敗しました、ユーザーは既にフォローされています。')
			return { success: false, message: 'ユーザーのフォローに失敗しました、ユーザーは既にフォローされています。' }
		}

		const followingData: Following = {
			followerUuid,
			followingUuid,
			followingType: FOLLOWING_TYPE.normal,
			isFavorite: false,
			followingEditDateTime: now,
			followingCreateTime: now,
		}

		const insertFollowingDataResult = await insertData2MongoDB<Following>(followingData, followingSchemaInstance, followingCollectionName, { session })

		if (!insertFollowingDataResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーのフォローに失敗しました、データの挿入に失敗しました。')
			return { success: false, message: 'ユーザーのフォローに失敗しました、データの挿入に失敗しました。' }
		}

		await commitAndEndSession(session)
		return { success: true, message: 'ユーザーのフォローに成功しました！' }
	} catch (error) {
		console.error('ERROR', 'ユーザーのフォロー中にエラーが発生しました：原因不明。', error)
		return { success: false, message: 'ユーザーのフォロー中にエラーが発生しました：原因不明。' }
	}
}

/**
 * ユーザーがクリエイターのフォローを解除する
 * @param unfollowingUploaderRequest ユーザーがクリエイターのフォローを解除するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーがクリエイターのフォローを解除するリクエストレスポンス
 */
export const unfollowingUploaderService = async (unfollowingUploaderRequest: UnfollowingUploaderRequestDto, uuid: string, token: string): Promise<UnfollowingUploaderResponseDto> => {
	try {
		if (!checkUnfollowingUploaderRequest(unfollowingUploaderRequest)) {
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、パラメータが不正です。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました：パラメータが不正です。' }
		}

		const now = new Date().getTime()
		const followerUuid = uuid
		const { unfollowingUid } = unfollowingUploaderRequest

		const unfollowingUuid = await getUserUuid(unfollowingUid) as string

		if (followerUuid === unfollowingUuid) {
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、自分自身のフォローは解除できません。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました：自分自身のフォローは解除できません。' }
		}

		if (!(await checkUserTokenByUuidService(followerUuid, token)).success) {
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、不正なユーザーです。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました、不正なユーザー' }
		}

		const checkFollowingUuidResult = await checkUserExistsByUuidService({ uuid: unfollowingUuid })
		if (!checkFollowingUuidResult.success || (checkFollowingUuidResult.success && !checkFollowingUuidResult.exists)) {
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、フォロー解除対象のユーザーが存在しません。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました、フォロー解除対象のユーザーが存在しません。' }
		}

		const { collectionName: followingCollectionName, schemaInstance: followingSchemaInstance } = FollowingSchema
		const { collectionName: unfollowingCollectionName, schemaInstance: unfollowingSchemaInstance } = UnfollowingSchema
		type Following = InferSchemaType<typeof followingSchemaInstance>
		type Unfollowing = InferSchemaType<typeof unfollowingSchemaInstance>

		const followingWhere: QueryType<Following> = {
			followerUuid,
			followingUuid: unfollowingUuid,
		}
		const followingSelect: SelectType<Following> = {
			followerUuid: 1,
			followingUuid: 1,
			followingType: 1,
			isFavorite: 1,
			followingEditDateTime: 1,
			followingCreateTime: 1,
		}

		const session = await createAndStartSession()

		const selectUnfollowingDataResult = await selectDataFromMongoDB<Following>(followingWhere, followingSelect, followingSchemaInstance, followingCollectionName, { session })
		const selectUnfollowingData = selectUnfollowingDataResult.result?.[0]

		if (!selectUnfollowingDataResult.success || selectUnfollowingDataResult.result.length !== 1 || !selectUnfollowingData) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、フォローデータの読み取りに失敗しました。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました、フォローデータの読み取りに失敗しました。' }
		}

		const unfollowingData: Unfollowing = {
			...selectUnfollowingData,
			unfollowingReasonType: 'normal',
			unfollowingDateTime: now,
			unfollowingEditDateTime: now,
			unfollowingCreateTime: now,
		}

		const insertUnfollowingDataResult = await insertData2MongoDB<Unfollowing>(unfollowingData, unfollowingSchemaInstance, unfollowingCollectionName, { session })

		if (!insertUnfollowingDataResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、レコードの処理に失敗しました。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました、レコードの処理に失敗しました。' }
		}

		const deleteFollowingDataResult = await deleteDataFromMongoDB<Following>(followingWhere, followingSchemaInstance, followingCollectionName, { session })

		if (!deleteFollowingDataResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーのフォロー解除に失敗しました、フォローレコードの削除に失敗しました。')
			return { success: false, message: 'ユーザーのフォロー解除に失敗しました、フォローレコードの削除に失敗しました。' }
		}

		await commitAndEndSession(session)
		return { success: true, message: 'ユーザーのフォロー解除に成功しました！' }
	} catch (error) {
		console.error('ERROR', 'ユーザーのフォロー解除中にエラーが発生しました：原因不明。', error)
		return { success: false, message: 'ユーザーのフォロー解除中にエラーが発生しました：原因不明。' }
	}
}

/**
 * フィードグループを作成
 * @param createFeedGroupRequest フィードグループ作成のリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループ作成のリクエストレスポンス
 */
export const createFeedGroupService = async (createFeedGroupRequest: CreateFeedGroupRequestDto, uuid: string, token: string): Promise<CreateFeedGroupResponseDto> => {
	try {
		if (!checkCreateFeedGroupRequest(createFeedGroupRequest)) {
			console.error('ERROR', 'フィードグループの作成に失敗しました、パラメータが不正です。')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループの作成に失敗しました、パラメータが不正です。' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループの作成に失敗しました、不正なユーザーです。')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループの作成に失敗しました、不正なユーザー' }
		}

		const { feedGroupName, withUidList: uidList, withCustomCoverUrl } = createFeedGroupRequest
		const uuidList = []
		if (uidList && Array.isArray(uidList) && uidList.length > 0) {
			if (uidList.length > 50) {
				console.error('ERROR', 'フィードグループの作成に失敗しました、一度に追加するUIDが多すぎます')
				return { success: false, tooManyUidInOnce: true, message: 'フィードグループの作成に失敗しました、一度に追加するUIDが多すぎます' }
			}

			let isCorrectUuidList = true
			uidList.forEach(async uid => {
				const uuid = await getUserUuid(uid) as string
				const checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto = {
					uuid,
				}
				const uuidExistsResult = await checkUserExistsByUuidService(checkUserExistsByUuidRequest)
				if (!uuidExistsResult.success || !uuidExistsResult.exists) {
					isCorrectUuidList = false
				}

				uuidList.push(uuid)
			})

			if (!isCorrectUuidList) {
				console.error('ERROR', 'フィードグループの作成に失敗しました、UUIDリストが不正です。')
				return { success: false, tooManyUidInOnce: false, message: 'フィードグループの作成に失敗しました、UUIDリストが不正です' }
			}
		}

		const now = new Date().getTime()
		const feedGroupUuid = uuidV4()

		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const feedGroupData: FeedGroup = {
			feedGroupUuid,
			feedGroupName,
			feedGroupCreatorUuid: uuid,
			uuidList: [...new Set<string>(uuidList)],
			customCover: withCustomCoverUrl,
			isUpdatedAfterReview: true,
			createDateTime: now,
			editDateTime: now,
		}

		const insertFeedGroupDataResult = await insertData2MongoDB<FeedGroup>(feedGroupData, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!insertFeedGroupDataResult.success) {
			console.error('ERROR', 'フィードグループの作成に失敗しました、データの挿入に失敗しました。')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループの作成に失敗しました、データの挿入に失敗しました' }
		}

		return { success: true, tooManyUidInOnce: false, message: 'フィードグループの作成に成功しました。' }
	} catch (error) {
		console.error('ERROR', 'フィードグループの作成中にエラーが発生しました：原因不明。', error)
		return { success: false, tooManyUidInOnce: false, message: 'フィードグループの作成中にエラーが発生しました：原因不明。' }
	}
}

/**
 * フィードグループに新しいUIDを追加する
 * @param addNewUser2FeedGroupRequest フィードグループに新しいUIDを追加するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループに新しいUIDを追加するリクエストレスポンス
 */
export const addNewUid2FeedGroupService = async (addNewUser2FeedGroupRequest: AddNewUid2FeedGroupRequestDto, uuid: string, token: string): Promise<AddNewUid2FeedGroupResponseDto> => {
	try {
		if (!checkAddNewUser2FeedGroupRequest(addNewUser2FeedGroupRequest)) {
			console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、パラメータが不正です。')
			return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、パラメータが不正です。' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、不正なユーザーです。')
			return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、不正なユーザー' }
		}

		const { feedGroupUuid, uidList } = addNewUser2FeedGroupRequest

		const uuidList = []
		if (uidList && Array.isArray(uidList) && uidList.length > 0) {
			if (uidList.length > 50) {
				console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、一度に追加するUIDが多すぎます')
				return { success: false, tooManyUidInOnce: true, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、一度に追加するUIDが多すぎます' }
			}

			let isCorrectUuidList = true
			uidList.forEach(async uid => {
				const uuid = await getUserUuid(uid) as string
				const checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto = {
					uuid,
				}
				const uuidExistsResult = await checkUserExistsByUuidService(checkUserExistsByUuidRequest)
				if (!uuidExistsResult.success || !uuidExistsResult.exists) {
					isCorrectUuidList = false
				}

				uuidList.push(uuid)
			})

			if (!isCorrectUuidList) {
				console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、UUIDリストが不正です。')
				return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、UUIDリストが不正です' }
			}
		}

		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const getFeedGroupSelect: SelectType<FeedGroup> = {
			feedGroupUuid: 1,
			uuidList: 1,
		}
		const feedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
			feedGroupCreatorUuid: uuid, // 変更するのが自分が作成したフィードグループであることを確認
		}

		const session = await createAndStartSession()

		const getFeedGroupDataResult = await selectDataFromMongoDB<FeedGroup>(feedGroupWhere, getFeedGroupSelect, feedGroupSchemaInstance, feedGroupCollectionName, { session })
		const getFeedGroupData = getFeedGroupDataResult.result?.[0]

		if (!getFeedGroupDataResult.success || !getFeedGroupData.feedGroupUuid) {
			await abortAndEndSession(session)
			console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、更新するフィードリストが存在しないか、現在のユーザーによって作成されたものではありません')
			return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、更新するフィードリストが存在しないか、現在のユーザーによって作成されたものではありません' }
		}

		const newUuidList = [...new Set<string>(uuidList.concat(getFeedGroupData.uuidList ?? []))]

		if (newUuidList.length > 10000) {
			await abortAndEndSession(session)
			console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、フィードグループのユーザーが多すぎます')
			return { success: false, tooManyUidInOnce: false, isOverload: true, message: 'フィードグループへの新しいUIDの追加に失敗しました、フィードグループのユーザーが多すぎます' }
		}

		const now = new Date().getTime()
		const updateFeedGroupData: UpdateType<FeedGroup> = {
			uuidList: newUuidList,
			editDateTime: now,
		}

		const findOneAndUpdateFeedGroupDataResult = await findOneAndUpdateData4MongoDB<FeedGroup>(feedGroupWhere, updateFeedGroupData, feedGroupSchemaInstance, feedGroupCollectionName, { session })
		const findOneAndUpdateFeedGroupData = findOneAndUpdateFeedGroupDataResult.result?.[0]

		if (!findOneAndUpdateFeedGroupDataResult.success || !findOneAndUpdateFeedGroupData) {
			await abortAndEndSession(session)
			console.error('ERROR', 'フィードグループへの新しいUIDの追加に失敗しました、更新に失敗しました')
			return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に失敗しました、更新に失敗しました' }
		}

		await commitAndEndSession(session)
		return { success: true, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加に成功しました', feedGroupResult: findOneAndUpdateFeedGroupData }
	} catch (error) {
		console.error('ERROR', 'フィードグループへの新しいUIDの追加中にエラーが発生しました：原因不明。', error)
		return { success: false, tooManyUidInOnce: false, isOverload: false, message: 'フィードグループへの新しいUIDの追加中にエラーが発生しました：原因不明。' }
	}
}

/**
 * フィードグループからUIDを削除する
 * @param removeUidFromFeedGroupRequest フィードグループからUIDを削除するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループからUIDを削除するリクエストレスポンス
 */
export const removeUidFromFeedGroupService = async (removeUidFromFeedGroupRequest: RemoveUidFromFeedGroupRequestDto, uuid: string, token: string): Promise<RemoveUidFromFeedGroupResponseDto> => {
	try {
		if (!checkRemoveUidFromFeedGroupRequest(removeUidFromFeedGroupRequest)) {
			console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、パラメータが不正です。')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に失敗しました、パラメータが不正です。' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、不正なユーザーです。')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に失敗しました、不正なユーザー' }
		}

		const { feedGroupUuid, uidList } = removeUidFromFeedGroupRequest

		const uuidList = []
		if (uidList && Array.isArray(uidList) && uidList.length > 0) {
			if (uidList.length > 50) {
				console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、一度に削除するUIDが多すぎます')
				return { success: false, tooManyUidInOnce: true, message: 'フィードグループからのUIDの削除に失敗しました、一度に削除するUIDが多すぎます' }
			}

			let isCorrectUuidList = true
			uidList.forEach(async uid => {
				const uuid = await getUserUuid(uid) as string
				const checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto = {
					uuid,
				}
				const uuidExistsResult = await checkUserExistsByUuidService(checkUserExistsByUuidRequest)
				if (!uuidExistsResult.success || !uuidExistsResult.exists) {
					isCorrectUuidList = false
				}

				uuidList.push(uuid)
			})

			if (!isCorrectUuidList) {
				console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、UUIDリストが不正です。')
				return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に失敗しました、UUIDリストが不正です' }
			}
		}

		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const getFeedGroupSelect: SelectType<FeedGroup> = {
			feedGroupUuid: 1,
			uuidList: 1,
		}
		const feedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
			feedGroupCreatorUuid: uuid, // 変更するのが自分が作成したフィードグループであることを確認
		}

		const session = await createAndStartSession()

		const getFeedGroupDataResult = await selectDataFromMongoDB<FeedGroup>(feedGroupWhere, getFeedGroupSelect, feedGroupSchemaInstance, feedGroupCollectionName, { session })
		const getFeedGroupData = getFeedGroupDataResult.result?.[0]

		if (!getFeedGroupDataResult.success || !getFeedGroupData.feedGroupUuid) {
			await abortAndEndSession(session)
			console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、更新するフィードリストが存在しないか、現在のユーザーによって作成されたものではありません')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に失敗しました、更新するフィードリストが存在しないか、現在のユーザーによって作成されたものではありません' }
		}

		const oldUuidList = [...new Set<string>(getFeedGroupData.uuidList ?? [])]
		const shouldRemoveUuidList = [...new Set<string>(uuidList)]
		const differenceUuidList = oldUuidList.filter(uuid => !shouldRemoveUuidList.includes(uuid))
		const now = new Date().getTime()
		const updateFeedGroupData: UpdateType<FeedGroup> = {
			uuidList: differenceUuidList,
			editDateTime: now,
		}

		const findOneAndUpdateFeedGroupDataResult = await findOneAndUpdateData4MongoDB<FeedGroup>(feedGroupWhere, updateFeedGroupData, feedGroupSchemaInstance, feedGroupCollectionName, { session })
		const findOneAndUpdateFeedGroupData = findOneAndUpdateFeedGroupDataResult.result?.[0]

		if (!findOneAndUpdateFeedGroupDataResult.success || !findOneAndUpdateFeedGroupData) {
			await abortAndEndSession(session)
			console.error('ERROR', 'フィードグループからのUIDの削除に失敗しました、更新に失敗しました')
			return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に失敗しました、更新に失敗しました' }
		}

		await commitAndEndSession(session)
		return { success: true, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除に成功しました', feedGroupResult: findOneAndUpdateFeedGroupData }
	} catch (error) {
		console.error('ERROR', 'フィードグループからのUIDの削除中にエラーが発生しました：原因不明。', error)
		return { success: false, tooManyUidInOnce: false, message: 'フィードグループからのUIDの削除中にエラーが発生しました：原因不明。' }
	}
}

/**
 * フィードグループを削除
 * @param deleteFeedGroupRequest フィードグループ削除のリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループ削除のリクエストレスポンス
 */
export const deleteFeedGroupService = async (deleteFeedGroupRequest: DeleteFeedGroupRequestDto, uuid: string, token: string): Promise<DeleteFeedGroupResponseDto> => {
	try {
		if (!checkDeleteFeedGroupRequest(deleteFeedGroupRequest)) {
			console.error('ERROR', 'フィードグループの削除に失敗しました、パラメータが不正です')
			return { success: false, message: 'フィードグループの削除に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループの削除に失敗しました、不正なユーザーです')
			return { success: false, message: 'フィードグループの削除に失敗しました、不正なユーザー' }
		}

		const { feedGroupUuid } = deleteFeedGroupRequest
		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const deleteFeedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
			feedGroupCreatorUuid: uuid, // 削除するのが自分が作成したフィードグループであることを確認
		}

		const deleteFeedGroupResult = await deleteDataFromMongoDB<FeedGroup>(deleteFeedGroupWhere, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!deleteFeedGroupResult.success) {
			console.error('ERROR', 'フィードグループの削除に失敗しました、削除に失敗しました')
			return { success: false, message: 'フィードグループの削除に失敗しました、削除に失敗しました' }
		}

		return { success: true, message: 'フィードグループの削除に成功しました' }
	} catch (error) {
		console.error('ERROR', 'フィードグループの削除中にエラーが発生しました：原因不明', error)
		return { success: false, message: 'フィードグループの削除中にエラーが発生しました：原因不明' }
	}
}

/**  
 * MinIO用フィードグループカバー画像アップロード署名付きURLを取得する  
 * @param uuid ユーザーのUUID  
 * @param token ユーザーのトークン  
 * @returns MinIO署名付きURLの結果  
 */  
export const getFeedGroupCoverUploadSignedUrlService = async (uuid: string, token: string): Promise<GetFeedGroupCoverUploadSignedUrlResponseDto> => {  
    try {  
        if (!(await checkUserTokenByUuidService(uuid, token)).success) {  
            console.error('ERROR', 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に失敗しました、ユーザー検証に失敗しました');  
            return { success: false, message: 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に失敗しました、ユーザー検証に失敗しました' };  
        }  
          
        const now = new Date().getTime();  
        const fileName = `feed-group-cover-${uuid}-${generateSecureRandomString(32)}-${now}`;  
          
        try {  
            // MinIO S3クライアントの設定  
            const s3Client = new S3Client({  
                region: 'us-east-1',  
                endpoint: process.env.MINIO_ENDPOINT,  
                credentials: {  
                    accessKeyId: process.env.MINIO_ACCESS_KEY!,  
                    secretAccessKey: process.env.MINIO_SECRET_KEY!,  
                },  
                forcePathStyle: true,  
            });  
  
            // 署名付きURL生成  
            const command = new PutObjectCommand({  
                Bucket: process.env.MINIO_BUCKET || 'kirakira-images',  
                Key: fileName,  
                ContentType: 'image/*',  
            });  
  
            const signedUrl = await createMinIOImageUploadSignedUrl(fileName, 660) // 10分間有効  
  
            if (signedUrl) {  
                return {   
                    success: true,   
                    message: 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に成功しました',   
                    result: { fileName, signedUrl }   
                };  
            } else {  
                return { success: false, message: 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に失敗しました、URLを生成できません' };  
            }  
        } catch (error) {  
            console.error('ERROR', 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に失敗しました、リクエストに失敗しました', error);  
            return { success: false, message: 'フィードグループのカバー画像をアップロードするための署名付きURLの取得に失敗しました、リクエストに失敗しました' };  
        }  
    } catch (error) {  
        console.error('ERROR', 'フィードグループのカバー画像をアップロードするための署名付きURLの取得中にエラーが発生しました：', error);  
        return { success: false, message: 'フィードグループのカバー画像をアップロードするための署名付きURLの取得中にエラーが発生しました、原因不明' };  
    }  
};


/**
 * フィードグループ情報を作成または更新する
 * フィードグループの名前やアバターURLの更新はすべてこのインターフェースで行う
 *
 * @param createOrEditFeedGroupInfoRequest フィードグループ情報を作成または更新するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループ情報を作成または更新するリクエストレスポンス
 */
export const createOrEditFeedGroupInfoService = async (createOrEditFeedGroupInfoRequest: CreateOrEditFeedGroupInfoRequestDto, uuid: string, token: string): Promise<CreateOrEditFeedGroupInfoResponseDto> => {
	try {
		if (!checkCreateOrEditFeedGroupInfoRequest(createOrEditFeedGroupInfoRequest)) {
			console.error('ERROR', 'フィードグループ情報の作成または更新に失敗しました、パラメータが不正です')
			return { success: false, message: 'フィードグループ情報の作成または更新に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループ情報の作成または更新に失敗しました、不正なユーザーです')
			return { success: false, message: 'フィードグループ情報の作成または更新に失敗しました、不正なユーザーです' }
		}

		const { feedGroupUuid, feedGroupName, feedGroupCustomCoverUrl } = createOrEditFeedGroupInfoRequest
		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const now = new Date().getTime()

		const updateFeedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
			feedGroupCreatorUuid: uuid, // 変更するのが自分が作成したフィードグループであることを確認
		}
		const updateFeedGroupData: UpdateType<FeedGroup> = {
			feedGroupName,
			customCover: feedGroupCustomCoverUrl,
			isUpdatedAfterReview: true,
			editDateTime: now,
		}

		const findOneAndUpdateFeedGroupDataResult = await findOneAndUpdateData4MongoDB<FeedGroup>(updateFeedGroupWhere, updateFeedGroupData, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!findOneAndUpdateFeedGroupDataResult.success || !findOneAndUpdateFeedGroupDataResult.result) {
			console.error('ERROR', 'フィードグループ情報の作成または更新に失敗しました、更新に失敗しました')
			return { success: false, message: 'フィードグループ情報の作成または更新に失敗しました、更新に失敗しました' }
		}

		return { success: false, message: 'フィードグループ情報の作成または更新に成功しました', feedGroupResult: findOneAndUpdateFeedGroupDataResult.result }
	} catch (error) {
		console.error('ERROR', 'フィードグループ情報の作成または更新中にエラーが発生しました：原因不明', error)
		return { success: false, message: 'フィードグループ情報の作成または更新中にエラーが発生しました：原因不明' }
	}
}

/**
 * // WARN: 管理者のみ
 * 管理者がフィードグループ情報の更新レビューを承認する
 * @param administratorApproveFeedGroupInfoChangeRequest 管理者がフィードグループ情報の更新レビューを承認するリクエストペイロード
 * @param administratorUuid 管理者のUUID
 * @param administratorToken 管理者のトークン
 * @returns 管理者がフィードグループ情報の更新レビューを承認するリクエストレスポンス
 */
export const administratorApproveFeedGroupInfoChangeService = async (administratorApproveFeedGroupInfoChangeRequest: AdministratorApproveFeedGroupInfoChangeRequestDto, administratorUuid: string, administratorToken: string): Promise<AdministratorApproveFeedGroupInfoChangeResponseDto> => {
	try {
		if (!checkAdministratorApproveFeedGroupInfoChangeRequest(administratorApproveFeedGroupInfoChangeRequest)) {
			console.error('ERROR', '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(administratorUuid, administratorToken)).success) {
			console.error('ERROR', '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、不正なユーザーです')
			return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、不正なユーザーです' }
		}

		const { feedGroupUuid } = administratorApproveFeedGroupInfoChangeRequest
		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const now = new Date().getTime()

		const updateFeedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
		}
		const updateFeedGroupData: UpdateType<FeedGroup> = {
			isUpdatedAfterReview: false,
			editDateTime: now,
		}

		const findOneAndUpdateFeedGroupDataResult = await findOneAndUpdateData4MongoDB<FeedGroup>(updateFeedGroupWhere, updateFeedGroupData, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!findOneAndUpdateFeedGroupDataResult.success || !findOneAndUpdateFeedGroupDataResult.result) {
			console.error('ERROR', '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、更新に失敗しました')
			return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認に失敗しました、更新に失敗しました' }
		}

		return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認に成功しました' }
	} catch (error) {
		console.error('ERROR', '管理者によるフィードグループ情報の更新レビュー承認中にエラーが発生しました：', error)
		return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認中にエラーが発生しました、原因不明' }
	}
}

/**
 * // WARN: 管理者のみ
 * 管理者がフィードグループを削除する
 * @param administratorDeleteFeedGroupRequest 管理者がフィードグループを削除するリクエストペイロード
 * @param administratorUuid 管理者のUUID
 * @param administratorToken 管理者のトークン
 * @returns 管理者がフィードグループを削除するリクエストレスポンス
 */
export const administratorDeleteFeedGroupService = async (administratorDeleteFeedGroupRequest: AdministratorDeleteFeedGroupRequestDto, administratorUuid: string, administratorToken: string): Promise<AdministratorDeleteFeedGroupResponseDto> => {
	try {
		if (!checkAdministratorDeleteFeedGroupRequest(administratorDeleteFeedGroupRequest)) {
			console.error('ERROR', '管理者によるフィードグループの削除に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者によるフィードグループの削除に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(administratorUuid, administratorToken)).success) {
			console.error('ERROR', '管理者によるフィードグループの削除に失敗しました、不正なユーザーです')
			return { success: false, message: '管理者によるフィードグループの削除に失敗しました、不正なユーザーです' }
		}

		const { feedGroupUuid } = administratorDeleteFeedGroupRequest
		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const deleteFeedGroupWhere: QueryType<FeedGroup> = {
			feedGroupUuid,
		}

		const administratorDeleteFeedGroupResult = await deleteDataFromMongoDB<FeedGroup>(deleteFeedGroupWhere, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!administratorDeleteFeedGroupResult.success) {
			console.error('ERROR', '管理者によるフィードグループの削除に失敗しました、更新に失敗しました')
			return { success: false, message: '管理者によるフィードグループの削除に失敗しました、更新に失敗しました' }
		}

		return { success: false, message: '管理者によるフィードグループ情報の更新レビュー承認に成功しました' }
	} catch (error) {
		console.error('ERROR', '管理者によるフィードグループの削除中にエラーが発生しました：', error)
		return { success: false, message: '管理者によるフィードグループの削除中にエラーが発生しました、原因不明' }
	}
}

/**
 * フィードグループを取得
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードグループ取得のリクエストレスポンス
 */
export const getFeedGroupListService = async (uuid: string, token: string): Promise<GetFeedGroupListResponseDto> => {
	try {
		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'フィードグループの取得に失敗しました、不正なユーザーです')
			return { success: false, message: 'フィードグループの取得に失敗しました、不正なユーザーです' }
		}

		const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
		type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

		const getFeedGroupWhere: QueryType<FeedGroup> = {
			feedGroupCreatorUuid: uuid,
		}

		const getFeedGroupSelect: SelectType<FeedGroup> = {
			feedGroupUuid: 1, // フィードグループのUUID
			feedGroupName: 1, // フィードグループの名前
			feedGroupCreatorUuid: 1, // フィードグループ作成者のUUID
			uuidList: 1, // フィードグループ内のユーザー
			customCover: 1, // フィードグループのカスタムカバー
			editDateTime: 1, // システム専用フィールド - 最終編集日時
			createDateTime: 1, // システム専用フィールド - 作成日時
		}

		const getFeedGroupResult = await selectDataFromMongoDB<FeedGroup>(getFeedGroupWhere, getFeedGroupSelect, feedGroupSchemaInstance, feedGroupCollectionName)

		if (!getFeedGroupResult.success || !getFeedGroupResult.result) {
			console.error('ERROR', 'フィードグループの取得に失敗しました、クエリに失敗しました')
			return { success: false, message: 'フィードグループの取得に失敗しました、クエリに失敗しました' }
		}

		return { success: true, message: 'フィードグループの取得に成功しました', result: getFeedGroupResult.result }
	} catch (error) {
		console.error('ERROR', 'フィードグループの取得中にエラーが発生しました：', error)
		return { success: false, message: 'フィードグループの取得中にエラーが発生しました、原因不明' }
	}
}

/**
 * フィードコンテンツを取得
 * @param getFeedContentRequest フィードコンテンツ取得のリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns フィードコンテンツ取得のリクエストレスポンス
 */
export const getFeedContentService = async (getFeedContentRequest: GetFeedContentRequestDto, uuid: string, token: string): Promise<GetFeedContentResponseDto> => {
	try {
		if (!checkGetFeedContentRequest(getFeedContentRequest)) {
			console.error('ERROR', 'フィードコンテンツの取得に失敗しました、パラメータが不正です')
			return { success: false, message: 'フィードコンテンツの取得に失敗しました、パラメータが不正です', isLonely: false }
		}

		if (!(await checkUserTokenByUuidService(uuid, uuid)).success) {
			console.error('ERROR', 'フィードコンテンツの取得に失敗しました、不正なユーザーです')
			return { success: false, message: 'フィードコンテンツの取得に失敗しました、不正なユーザーです', isLonely: false }
		}

		const { feedGroupUuid, pagination } = getFeedContentRequest

		const uuidList = []
		if (feedGroupUuid) {
			const { collectionName: feedGroupCollectionName, schemaInstance: feedGroupSchemaInstance } = FeedGroupSchema
			type FeedGroup = InferSchemaType<typeof feedGroupSchemaInstance>

			const getFeedGroupUuidListWhere: QueryType<FeedGroup> = {
				feedGroupUuid,
			}

			const getFeedGroupUuidListSelect: SelectType<FeedGroup> = {
				uuidList: 1, // フィードグループ内のユーザー
			}

			const getFeedGroupUserListResult = await selectDataFromMongoDB<FeedGroup>(getFeedGroupUuidListWhere, getFeedGroupUuidListSelect, feedGroupSchemaInstance, feedGroupCollectionName)
			const uuidListResult = getFeedGroupUserListResult.result?.[0]?.uuidList

			if (!getFeedGroupUserListResult.success) {
				console.error('ERROR', 'フィードコンテンツの取得に失敗しました、フィードグループ内のユーザーのクエリに失敗しました')
				return { success: false, message: 'フィードコンテンツの取得に失敗しました、フィードグループ内のユーザーのクエリに失敗しました', isLonely: { noUserInFeedGroup: true } }
			}

			if (Array.isArray(uuidListResult) && uuidList.length <= 0) {
				console.warn('WARN', 'WARNING', '選択したフィードグループにユーザーがいません')
				return { success: true, message: '選択したフィードグループにユーザーがいません', isLonely: { noUserInFeedGroup: true }, result: { count: 0, content: [] } }
			}

			uuidList.push(uuidListResult)
		} else {
			const { collectionName: followingCollectionName, schemaInstance: followingSchemaInstance } = FollowingSchema
			type Following = InferSchemaType<typeof followingSchemaInstance>

			const getFollowingUuidListWhere: QueryType<Following> = {
				followerUuid: uuid,
			}

			const getFollowingUuidListSelect: SelectType<Following> = {
				followingUuid: 1,
			}

			const getFollowingUserListResult = await selectDataFromMongoDB<Following>(getFollowingUuidListWhere, getFollowingUuidListSelect, followingSchemaInstance, followingCollectionName)
			const uuidListResult = getFollowingUserListResult.result?.map(followingResult => followingResult.followingUuid)

			if (!getFollowingUserListResult.success) {
				console.error('ERROR', 'フィードコンテンツの取得に失敗しました、ユーザーがフォローしているユーザーのクエリに失敗しました')
				return { success: false, message: 'フィードコンテンツの取得に失敗しました、ユーザーがフォローしているユーザーのクエリに失敗しました', isLonely: { noFollowing: true } }
			}

			if (Array.isArray(uuidListResult) && uuidList.length <= 0) {
				console.warn('WARN', 'WARNING', 'あなたは誰もフォローしていません')
				return { success: true, message: 'あなたは誰もフォローしていません', isLonely: { noFollowing: true }, result: { count: 0, content: [] } }
			}

			uuidList.push(uuidListResult)
		}

		// uuidに基づいて動画を照合する基本パイプライン
		const feedContentMatchPipeline: PipelineStage[] = [
			{
				$match: {
					uploaderUUID: { $in: uuidList },
				},
			},
		]

		// フィード動画の総数を取得するパイプライン
		const countFeedContentBasePipeline: PipelineStage[] = [
			{
				$count: 'totalCount', // 総ドキュメント数をカウント
			}
		]

		let skip = 0
		let pageSize = undefined
		if (pagination && pagination.page > 0 && pagination.pageSize > 0) {
			skip = (pagination.page - 1) * pagination.pageSize
			pageSize = pagination.pageSize
		}

		// 動画情報を照合するパイプライン
		const getFeedContentBasePipeline: PipelineStage[] = [
			{
				$lookup: {
					from: 'user-infos',
					localField: 'uploaderUUID',
					foreignField: 'UUID',
					as: 'uploader_info',
				},
			},
			{ $skip: skip }, // 指定された数のドキュメントをスキップ
			{ $limit: pageSize }, // 返されるドキュメントの数を制限
			{
				$unwind: '$uploader_info',
			},
			{
				$sort: {
					uploadDate: -1, // uploadDateで降順ソート
				},
			},
			{
				$project: {
					videoId: 1,
					title: 1,
					image: 1,
					uploadDate: 1,
					watchedCount: 1,
					uploaderId: 1, // アップローダーのUID
					duration: 1,
					description: 1,
					editDateTime: 1,
					uploader: '$uploader_info.username', // アップローダーの名前
					uploaderNickname: '$uploader_info.userNickname', // アップローダーのニックネーム
				}
			}
		]

		const countFeedContentPipeline = feedContentMatchPipeline.concat(countFeedContentBasePipeline)
		const getFeedContentPipeline = feedContentMatchPipeline.concat(getFeedContentBasePipeline)

		const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
		type ThumbVideo = InferSchemaType<typeof videoSchemaInstance>

		const feedContentCountPromise = selectDataByAggregateFromMongoDB(videoSchemaInstance, videoCollectionName, countFeedContentPipeline)
		const feedContentDataPromise = selectDataByAggregateFromMongoDB<ThumbVideo>(videoSchemaInstance, videoCollectionName, getFeedContentPipeline)

		const [ feedContentCountResult, feedContentDataResult ] = await Promise.all([feedContentCountPromise, feedContentDataPromise])
		const count = feedContentCountResult.result?.[0]?.totalCount
		const content = feedContentDataResult.result

		if ( !feedContentCountResult.success || !feedContentDataResult.success
			|| typeof count !== 'number' || count < 0
			|| ( Array.isArray(content) && !content )
		) {
			console.error('ERROR', 'フィードコンテンツの取得に失敗しました、動画データのクエリに失敗しました')
			return { success: false, message: 'フィードコンテンツの取得に失敗しました、動画データのクエリに失敗しました', isLonely: false }
		}

		return {
			success: true,
			message: count > 0 ? 'フィードコンテンツの取得に成功しました' : 'フィードコンテンツの取得に成功しました、長さはゼロです',
			isLonely: false,
			result: {
				count,
				content,
			},
		}
	} catch (error) {
		console.error('ERROR', 'フィードコンテンツの取得中にエラーが発生しました：', error)
		return { success: false, message: 'フィードコンテンツの取得中にエラーが発生しました、原因不明', isLonely: false }
	}
}

/**
 * ユーザーがクリエイターをフォローするリクエストペイロードを検証する
 * @param followingUploaderRequest ユーザーがクリエイターをフォローするリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkFollowingUploaderRequest = (followingUploaderRequest: FollowingUploaderRequestDto): boolean => {
	return ( followingUploaderRequest.followingUid !== undefined && followingUploaderRequest.followingUid !== null && followingUploaderRequest.followingUid > 0 )
}

/**
 * ユーザーがクリエイターのフォローを解除するリクエストペイロードを検証する
 * @param unfollowingUploaderRequest ユーザーがクリエイターのフォローを解除するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkUnfollowingUploaderRequest = (unfollowingUploaderRequest: UnfollowingUploaderRequestDto): boolean => {
	return ( unfollowingUploaderRequest.unfollowingUid !== undefined && unfollowingUploaderRequest.unfollowingUid !== null && unfollowingUploaderRequest.unfollowingUid > 0 )
}

/**
 * フィードグループ作成リクエストのペイロードを検証する
 * @param createFeedGroupRequest フィードグループ作成のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateFeedGroupRequest = (createFeedGroupRequest: CreateFeedGroupRequestDto): boolean => {
	return ( !!createFeedGroupRequest.feedGroupName )
}

/**
 * フィードグループに新しいUIDを追加するリクエストペイロードを検証する
 * @param addNewUser2FeedGroupRequest フィードグループに新しいUIDを追加するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAddNewUser2FeedGroupRequest = (addNewUser2FeedGroupRequest: AddNewUid2FeedGroupRequestDto): boolean => {
	return (
		!!addNewUser2FeedGroupRequest.feedGroupUuid
		&& !!addNewUser2FeedGroupRequest.uidList && addNewUser2FeedGroupRequest.uidList.every(uid => uid !== undefined && uid !== null && uid > 0)
	)
}

/**
 * フィードグループからUIDを削除するリクエストペイロードを検証する
 * @param removeUidFromFeedGroupRequest フィードグループからUIDを削除するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkRemoveUidFromFeedGroupRequest = (removeUidFromFeedGroupRequest: RemoveUidFromFeedGroupRequestDto): boolean => {
	return (
		!!removeUidFromFeedGroupRequest.feedGroupUuid
		&& !!removeUidFromFeedGroupRequest.uidList && removeUidFromFeedGroupRequest.uidList.every(uid => uid !== undefined && uid !== null && uid > 0)
	)
}

/**
 * フィードグループ削除リクエストのペイロードを検証する
 * @param deleteFeedGroupRequest フィードグループ削除のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkDeleteFeedGroupRequest = (deleteFeedGroupRequest: DeleteFeedGroupRequestDto): boolean => {
	return ( !!deleteFeedGroupRequest.feedGroupUuid )
}

/**
 * フィードグループ情報を作成または更新するリクエストペイロードを検証する
 * @param createOrEditFeedGroupInfoRequest フィードグループ情報を作成または更新するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateOrEditFeedGroupInfoRequest = (createOrEditFeedGroupInfoRequest: CreateOrEditFeedGroupInfoRequestDto): boolean => {
	return ( !!createOrEditFeedGroupInfoRequest.feedGroupUuid )
}

/**
 * 管理者がフィードグループ情報の更新レビューを承認するリクエストペイロードを検証する
 * @param administratorApproveFeedGroupInfoChangeRequest 管理者がフィードグループ情報の更新レビューを承認するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAdministratorApproveFeedGroupInfoChangeRequest = (administratorApproveFeedGroupInfoChangeRequest: AdministratorApproveFeedGroupInfoChangeRequestDto): boolean => {
	return ( !!administratorApproveFeedGroupInfoChangeRequest.feedGroupUuid )
}

/**
 * 管理者がフィードグループ情報の更新レビューを承認するリクエストペイロードを検証する
 * @param administratorDeleteFeedGroupRequest 管理者がフィードグループ情報の更新レビューを承認するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAdministratorDeleteFeedGroupRequest = (administratorDeleteFeedGroupRequest: AdministratorDeleteFeedGroupRequestDto): boolean => {
	return ( !!administratorDeleteFeedGroupRequest.feedGroupUuid )
}

/**
 * フィードコンテンツ取得リクエストのペイロードを検証する
 * @param getFeedContentRequest フィードコンテンツ取得のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetFeedContentRequest = (getFeedContentRequest: GetFeedContentRequestDto): boolean => {
	return (
		!!getFeedContentRequest.pagination
		&& getFeedContentRequest.pagination.page >= 0 && getFeedContentRequest.pagination.pageSize > 0 && getFeedContentRequest.pagination.pageSize <= 200
	);
}
