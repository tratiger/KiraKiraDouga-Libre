import { InferSchemaType, PipelineStage } from "mongoose";
import safeRegex from 'safe-regex';
import { AddRegexRequestDto, AddRegexResponseDto, BlockKeywordRequestDto, BlockKeywordResponseDto, BlockTagRequestDto, BlockTagResponseDto, BlockUserByUidRequestDto, BlockUserByUidResponseDto, CheckContentIsBlockedRequestDto, CheckIsBlockedByOtherUserRequestDto, CheckIsBlockedByOtherUserResponseDto, CheckIsBlockedResponseDto, CheckTagIsBlockedRequestDto, CheckUserIsBlockedRequestDto, CheckUserIsBlockedResponseDto, GetBlockListRequestDto, GetBlockListResponseDto, HideUserByUidRequestDto, HideUserByUidResponseDto, RemoveRegexRequestDto, RemoveRegexResponseDto, ShowUserByUidRequestDto, ShowUserByUidResponseDto, UnblockKeywordRequestDto, UnblockKeywordResponseDto, UnblockTagRequestDto, UnblockTagResponseDto, UnblockUserByUidRequestDto, UnblockUserByUidResponseDto } from "../controller/BlockControllerDto.js";
import { checkUserExistsByUIDService, checkUserTokenByUuidService, getUserUid, getUserUuid } from "./UserService.js";
import { QueryType, SelectType } from "../dbPool/DbClusterPoolTypes.js";
import { abortAndEndSession, commitAndEndSession, createAndStartSession } from "../common/MongoDBSessionTool.js";
import { selectDataFromMongoDB, insertData2MongoDB, deleteDataFromMongoDB, selectDataByAggregateFromMongoDB } from "../dbPool/DbClusterPool.js";
import { BlockListSchema, UnblockListSchema } from "../dbPool/schema/BlockSchema.js";

const MAX_KEYWORD_LENGTH = 30; // キーワードの長さ制限
const MAX_REGEX_LENGTH = 30; // 正規表現の長さ制限

/**
 * ユーザーをブロック
 * @param blockUserByUidRequest ユーザーブロックのリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 */
export const blockUserByUidService = async (blockUserByUidRequest: BlockUserByUidRequestDto, uuid: string, token: string): Promise<BlockUserByUidResponseDto> => {
	try {
		if (!checkBlockUserByUidRequest(blockUserByUidRequest)) {
			return { success: false, message: 'ユーザーブロックリクエストのペイロードが不正です' }
		}

		const { blockUid } = blockUserByUidRequest
		if (!checkUserExistsByUIDService({ uid: blockUid })) {
			console.error('ERROR', 'ユーザーブロックに失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーブロックに失敗しました、ユーザーが存在しません' }
		}

		const userUuid = await getUserUuid(blockUid)
		const operatorUid = await getUserUid(uuid)

		if (!userUuid || !operatorUid) {
			console.error('ERROR', 'ユーザーブロックに失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーブロックに失敗しました、ユーザーが存在しません' }
		}

		if (userUuid === uuid) {
			console.error('ERROR', 'ユーザーブロックに失敗しました、自分自身をブロックすることはできません')
			return { success: false, message: 'ユーザーブロックに失敗しました、自分自身をブロックすることはできません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ユーザーブロックに失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ユーザーブロックに失敗しました、ユーザートークンが不正です' }
		}

		if (await getBlocklistCount('block', uuid) > 500) {
			return { success: false, message: 'ユーザーブロックに失敗しました、ブロックリストが上限に達しました' } // TODO: フォロワー数の判断を追加
		}

		const now = new Date().getTime()
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'block',
			value: userUuid,
			operatorUUID: uuid,
		}
		const blockListSelect: SelectType<BlockListSchemaType> = {
			operatorUid: 1,
		}
		const blockListResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName)
		if (blockListResult.success && blockListResult.result && blockListResult.result.length > 0) {
			return { success: false, message: 'ユーザーブロックに失敗しました、このユーザーは既にブロックされています' }
		}

		const blockListData: BlockListSchemaType = {
			type: 'block',
			value: userUuid,
			operatorUid,
			operatorUUID: uuid,
			createDateTime: now,
		}

		const insertResult = await insertData2MongoDB<BlockListSchemaType>(blockListData, blockListSchemaInstance, blockListCollectionName)
		if (!insertResult.success) {
			console.error('ERROR', 'ユーザーブロックに失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザーブロックに失敗しました、データクエリに失敗しました' }
		}
		return { success: true, message: 'ユーザーブロックに成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'ユーザーブロックに失敗しました、不明なエラー', error)
		return { success: false, message: 'ユーザーブロックに失敗しました' }
	}
}

/**
 * ユーザーを非表示
 * @param blockTagRequest キーワードブロックのリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns キーワードブロックのリクエストレスポンス
 */
export const hideUserByUidService = async (hideUserByUidRequest: HideUserByUidRequestDto, uuid: string, token: string): Promise<HideUserByUidResponseDto> => {
	try {
		if (!checkHideUserByUidRequest(hideUserByUidRequest)) {
			return { success: false, message: 'ユーザー非表示に失敗しました、ユーザー非表示リクエストのペイロードが不正です' }
		}

		const { hideUid } = hideUserByUidRequest
		if (!checkUserExistsByUIDService({ uid: hideUid })) {
			console.error('ERROR', 'ユーザー非表示に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザー非表示に失敗しました、ユーザーが存在しません' }
		}

		const userUuid = await getUserUuid(hideUid)
		const operatorUid = await getUserUid(uuid)

		if (!userUuid || !operatorUid) {
			console.error('ERROR', 'ユーザー非表示に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザー非表示に失敗しました、ユーザーが存在しません' }
		}
		if (userUuid === uuid) {
			console.error('ERROR', 'ユーザー非表示に失敗しました、自分自身を非表示にすることはできません')
			return { success: false, message: 'ユーザー非表示に失敗しました、自分自身を非表示にすることはできません' }
		}
		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ユーザー非表示に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ユーザー非表示に失敗しました、ユーザートークンが不正です' }
		}

		if (await getBlocklistCount('hide', uuid) > 500) {
			return { success: false, message: 'ユーザー非表示に失敗しました、非表示リストが上限に達しました' } // TODO: フォロワー数の判断を追加
		}

		const now = new Date().getTime()
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'hide',
			value: userUuid,
			operatorUUID: uuid,
		}
		const blockListSelect: SelectType<BlockListSchemaType> = {
			operatorUid: 1,
		}
		const blockListResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName)
		if (blockListResult.success && blockListResult.result && blockListResult.result.length > 0) {
			return { success: false, message: 'ユーザー非表示に失敗しました、ユーザーは既に非表示にされています' }
		}

		const blockListData: BlockListSchemaType = {
			type: 'hide',
			value: userUuid,
			operatorUid,
			operatorUUID: uuid,
			createDateTime: now,
		}

		const insertResult = await insertData2MongoDB<BlockListSchemaType>(blockListData, blockListSchemaInstance, blockListCollectionName)
		if (!insertResult.success) {
			console.error('ERROR', 'ユーザー非表示に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザー非表示に失敗しました、データクエリに失敗しました' }
		}
		return { success: true, message: 'ユーザー非表示に成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'ユーザー非表示に失敗しました、不明なエラー', error)
		return { success: false, message: 'ユーザー非表示に失敗しました、不明なエラー' }
	}
}

/**
 * キーワードをブロック
 * @param blockTagRequest キーワードブロックのリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns キーワードブロックのリクエストレスポンス
 */
export const blockKeywordService = async (blockKeywordRequest: BlockKeywordRequestDto, uuid: string, token: string): Promise<BlockKeywordResponseDto> => {
	try {
		if (!checkBlockKeywordRequest(blockKeywordRequest)) {
			return { success: false, message: 'キーワードブロックに失敗しました、キーワードブロックリクエストのペイロードが不正です' }
		}

		const { blockKeyword } = blockKeywordRequest

		if (!safeRegex(blockKeyword)) {
			console.error('ERROR', 'キーワードブロックに失敗しました、安全でないキーワードが入力されました、このキーワードは安全でない正規表現です')
			return { success: false, message: 'キーワードブロックに失敗しました、安全でないキーワードが入力されました' }
		}

		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', 'キーワードブロックに失敗しました、ユーザーが存在しません')
			return { success: false, message: 'キーワードブロックに失敗しました、ユーザーが存在しません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'キーワードブロックに失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'キーワードブロックに失敗しました、ユーザートークンが不正です' }
		}

		if (await getBlocklistCount('keyword', uuid) > 200) {
			return { success: false, message: 'キーワードブロックに失敗しました、ブロックリストが上限に達しました' }
		}

		const now = new Date().getTime()
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'keyword',
			value: blockKeyword,
			operatorUUID: uuid,
		}
		const blockListSelect: SelectType<BlockListSchemaType> = {
			operatorUid: 1,
		}

		const blockListResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName)
		if (blockListResult.success && blockListResult.result && blockListResult.result.length > 0) {
			console.error('ERROR', 'キーワードブロックに失敗しました、このキーワードは既にブロックされています')
			return { success: false, message: 'キーワードブロックに失敗しました、このキーワードは既にブロックされています' }
		}

		const blockListData: BlockListSchemaType = {
			type: 'keyword',
			value: blockKeyword,
			operatorUid,
			operatorUUID: uuid,
			createDateTime: now,
		}

		const insertResult = await insertData2MongoDB<BlockListSchemaType>(blockListData, blockListSchemaInstance, blockListCollectionName)
		if (!insertResult.success) {
			return { success: false, message: 'キーワードブロックに失敗しました' }
		}
		return { success: true, message: 'キーワードブロックに成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'キーワードブロックに失敗しました', error)
		return { success: false, message: 'キーワードブロックに失敗しました' }
	}
}

/**
 * タグをブロック
 * @param blockTagRequest タグブロックのリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns タグブロックのリクエストレスポンス
 */
export const blockTagService = async (blockTagRequest: BlockTagRequestDto, uuid: string, token: string): Promise<BlockTagResponseDto> => {
	try {
		if (!checkBlockTagRequest(blockTagRequest)) {
			return { success: false, message: 'タグブロックリクエストのペイロードが不正です' }
		}

		const tagId = blockTagRequest.tagId.toString()
		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', 'タグブロックに失敗しました、ユーザーが存在しません')
			return { success: false, message: 'タグブロックに失敗しました、ユーザーが存在しません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'タグブロックに失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'タグブロックに失敗しました、ユーザートークンが不正です' }
		}

		if (await getBlocklistCount('tag', uuid) > 100) {
			return { success: false, message: 'タグブロックに失敗しました、ブロックリストが上限に達しました' }
		}

		// TODO: TAGが存在するかどうかを確認
		const now = new Date().getTime()
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'tag',
			value: tagId,
			operatorUUID: uuid,
		}
		const blockListSelect: SelectType<BlockListSchemaType> = {
			operatorUid: 1,
		}

		const blockListResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName)
		if (blockListResult.success && blockListResult.result && blockListResult.result.length > 0) {
			console.error('ERROR', 'タグブロックに失敗しました、このタグは既にブロックされています')
			return { success: false, message: 'タグブロックに失敗しました、このタグは既にブロックされています' }
		}

		const blockListData: BlockListSchemaType = {
			type: 'tag',
			value: tagId,
			operatorUid,
			operatorUUID: uuid,
			createDateTime: now,
		}

		const insertResult = await insertData2MongoDB<BlockListSchemaType>(blockListData, blockListSchemaInstance, blockListCollectionName)
		if (!insertResult.success) {
			console.error('ERROR', 'タグブロックに失敗しました、データクエリに失敗しました')
			return { success: false, message: 'タグブロックに失敗しました、データクエリに失敗しました' }
		}
		return { success: true, message: 'タグブロックに成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'タグブロックに失敗しました、不明なエラー', error)
		return { success: false, message: 'タグブロックに失敗しました、不明なエラー' }
	}
}

/**
 * 正規表現を追加
 * @param addRegexRequest 正規表現追加のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns 正規表現追加のリクエストレスポンス
 */
export const addRegexService = async (addRegexRequest: AddRegexRequestDto, uuid: string, token: string): Promise<AddRegexResponseDto> => {
	try {
		if (!checkAddRegexRequest(addRegexRequest)) {
			return { success: false, message: '正規表現追加リクエストのペイロードが不正です', unsafeRegex: false }
		}

		const { blockRegex } = addRegexRequest

		if (!safeRegex(blockRegex)) {
			console.error('ERROR', '正規表現追加に失敗しました、安全でない正規表現が入力されました')
			return { success: false, message: '正規表現追加に失敗しました、安全でない正規表現が入力されました', unsafeRegex: true }
		}

		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', '正規表現追加に失敗しました、ユーザーが存在しません')
			return { success: false, message: '正規表現追加に失敗しました、ユーザーが存在しません', unsafeRegex: false }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', '正規表現追加に失敗しました、ユーザートークンが不正です')
			return { success: false, message: '正規表現追加に失敗しました、ユーザートークンが不正です', unsafeRegex: false }
		}

		if (await getBlocklistCount('regex', uuid) > 3) {
			return { success: false, message: '正規表現追加に失敗しました、ブロックリストが上限に達しました', unsafeRegex: false }
		}

		const now = new Date().getTime()
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'regex',
			value: blockRegex,
			operatorUUID: uuid,
		}
		const blockListSelect: SelectType<BlockListSchemaType> = {
			operatorUid: 1,
		}

		const blockListResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName)
		if (blockListResult.success && blockListResult.result && blockListResult.result.length > 0) {
			return { success: false, message: '正規表現追加に失敗しました、正規表現は既に存在します', unsafeRegex: false }
		}

		const blockListData: BlockListSchemaType = {
			type: 'regex',
			value: blockRegex,
			operatorUid,
			operatorUUID: uuid,
			createDateTime: now,
		}

		const insertResult = await insertData2MongoDB<BlockListSchemaType>(blockListData, blockListSchemaInstance, blockListCollectionName)
		if (!insertResult.success) {
			return { success: false, message: '正規表現追加に失敗しました', unsafeRegex: false }
		}

		return { success: true, message: '正規表現追加に成功しました', unsafeRegex: false }
	}
	catch (error) {
		console.error('ERROR', '正規表現追加に失敗しました', error)
		return { success: false, message: '正規表現追加に失敗しました', unsafeRegex: false }
	}
}

/**
 * ユーザーブロックを解除
 * @param unblockUserByUidRequest ユーザーブロック解除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns ユーザーブロック解除のリクエストレスポンス
 */
export const unBlockUserService = async (unblockUserByUidRequest: UnblockUserByUidRequestDto, uuid: string, token: string): Promise<UnblockUserByUidResponseDto> => {
	try {
		if (!checkBlockUserByUidRequest(unblockUserByUidRequest)) {
			return { success: false, message: 'ユーザーブロック解除に失敗しました、ユーザーブロック解除リクエストのペイロードが不正です' }
		}

		const { blockUid } = unblockUserByUidRequest
		if (!checkUserExistsByUIDService({ uid: blockUid })) {
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、ユーザーが存在しません' }
		}
		const userUuid = await getUserUuid(blockUid)
		const operatorUid = await getUserUid(uuid)

		if (!userUuid || !operatorUid) {
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、ユーザーが存在しません' }
		}
		if (userUuid === uuid) {
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、自分自身のブロックは解除できません')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、自分自身のブロックは解除できません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、ユーザートークンが不正です' }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'block',
			value: userUuid,
			operatorUUID: uuid,
		}

		const blockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUid: 1,
			operatorUUID: 1,
		}

		// トランザクション開始
		const session = await createAndStartSession()

		const selectResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName, {session})
		if (!selectResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、データクエリに失敗しました' }
		}
		if (selectResult.result.length === 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、ユーザーはブロックされていません')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、ユーザーはブロックされていません' }
		}

		const { collectionName: unblockUserCollectionName, schemaInstance: unblockUserSchemaInstance } = UnblockListSchema
		type UnblockListSchemaType = InferSchemaType<typeof unblockUserSchemaInstance>
		const unblockListData: UnblockListSchemaType = {
			...selectResult.result[0],
			_operatorUid_: operatorUid,
			_operatorUUID_: uuid,
			createDateTime: new Date().getTime(),
		}
		const insertResult = await insertData2MongoDB<UnblockListSchemaType>(unblockListData, unblockUserSchemaInstance, unblockUserCollectionName, {session})
		if (!insertResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、データクエリに失敗しました' }
		}

		const deleteResult = await deleteDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSchemaInstance, blockListCollectionName, {session})
		if (!deleteResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザーブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザーブロック解除に失敗しました、データクエリに失敗しました' }
		}
		await commitAndEndSession(session)
		return { success: true, message: 'ユーザーブロック解除に成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'ユーザーブロック解除に失敗しました、不明なエラー', error)
		return { success: false, message: 'ユーザーブロック解除に失敗しました、不明なエラー' }
	}
}

/**
 * ユーザーを表示
 * @param ShowUserByUidRequestDto ユーザー表示のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns ユーザー表示のリクエストレスポンス
 */
export const showUserService = async (showUserByUidRequest: ShowUserByUidRequestDto, uuid: string, token: string): Promise<ShowUserByUidResponseDto> => {
	try {
		if (!checkHideUserByUidRequest(showUserByUidRequest)) {
			return { success: false, message: 'ユーザー表示に失敗しました、ユーザー表示リクエストのペイロードが不正です' }
		}

		const { hideUid } = showUserByUidRequest
		if (!checkUserExistsByUIDService({ uid: hideUid })) {
			console.error('ERROR', 'ユーザー表示に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザー表示に失敗しました、ユーザーが存在しません' }
		}
		const userUuid = await getUserUuid(hideUid)
		const operatorUid = await getUserUid(uuid)

		if (!userUuid || !operatorUid) {
			console.error('ERROR', 'ユーザー表示に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザー表示に失敗しました、ユーザーが存在しません' }
		}
		if (userUuid === uuid) {
			console.error('ERROR', 'ユーザー表示に失敗しました、自分自身を表示することはできません')
			return { success: false, message: 'ユーザー表示に失敗しました、自分自身を表示することはできません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ユーザー表示に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ユーザー表示に失敗しました、ユーザートークンが不正です' }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'hide',
			value: userUuid,
			operatorUUID: uuid,
		}

		const blockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUid: 1,
			operatorUUID: 1,
		}

		// トランザクション開始
		const session = await createAndStartSession()

		const selectResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName, {session})
		if (!selectResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザー表示に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザー表示に失敗しました、データクエリに失敗しました' }
		}
		if (selectResult.result.length === 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザー表示に失敗しました、ユーザーは非表示にされていません')
			return { success: false, message: 'ユーザー表示に失敗しました、ユーザーは非表示にされていません' }
		}

		const { collectionName: unblockUserCollectionName, schemaInstance: unblockUserSchemaInstance } = UnblockListSchema
		type UnblockListSchemaType = InferSchemaType<typeof unblockUserSchemaInstance>
		const unblockListData: UnblockListSchemaType = {
			...selectResult.result[0],
			_operatorUid_: operatorUid,
			_operatorUUID_: uuid,
			createDateTime: new Date().getTime(),
		}
		const insertResult = await insertData2MongoDB<UnblockListSchemaType>(unblockListData, unblockUserSchemaInstance, unblockUserCollectionName, {session})
		if (!insertResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザー表示に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザー表示に失敗しました、データクエリに失敗しました' }
		}

		const deleteResult = await deleteDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSchemaInstance, blockListCollectionName, {session})
		if (!deleteResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ユーザー表示に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ユーザー表示に失敗しました、データクエリに失敗しました' }
		}
		await commitAndEndSession(session)
		return { success: true, message: 'ユーザー表示に成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'ユーザー表示に失敗しました、不明なエラー', error)
		return { success: false, message: 'ユーザー表示に失敗しました、不明なエラー' }
	}
}

/**
 * タグブロックを解除
 * @param unblockTagRequest タグブロック解除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns タグブロック解除のリクエストレスポンス
 */
export const unBlockTagService = async (unblockTagRequest: UnblockTagRequestDto, uuid: string, token: string): Promise<UnblockTagResponseDto> => {
	try {
		if (!checkBlockTagRequest(unblockTagRequest)) {
			return { success: false, message: 'タグブロック解除に失敗しました、タグブロック解除リクエストのペイロードが不正です' }
		}

		const tagId = unblockTagRequest.tagId.toString()
		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', 'タグブロック解除に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'タグブロック解除に失敗しました、ユーザーが存在しません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'タグブロック解除に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'タグブロック解除に失敗しました、ユーザートークンが不正です' }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'tag',
			value: tagId,
			operatorUUID: uuid,
		}

		const blockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUid: 1,
			operatorUUID: 1,
		}

		// トランザクション開始
		const session = await createAndStartSession()

		const selectResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName, {session})
		if (!selectResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'タグブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'タグブロック解除に失敗しました、データクエリに失敗しました' }
		}
		if (selectResult.result.length === 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'タグブロック解除に失敗しました、タグはブロックされていません')
			return { success: false, message: 'タグブロック解除に失敗しました、タグはブロックされていません' }
		}

		const { collectionName: unblockUserCollectionName, schemaInstance: unblockUserSchemaInstance } = UnblockListSchema
		type UnblockListSchemaType = InferSchemaType<typeof unblockUserSchemaInstance>
		const unblockListData: UnblockListSchemaType = {
			...selectResult.result[0],
			_operatorUid_: operatorUid,
			_operatorUUID_: uuid,
			createDateTime: new Date().getTime(),
		}
		const insertResult = await insertData2MongoDB<UnblockListSchemaType>(unblockListData, unblockUserSchemaInstance, unblockUserCollectionName, {session})
		if (!insertResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'タグブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'タグブロック解除に失敗しました、データクエリに失败しました' }
		}

		const deleteResult = await deleteDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSchemaInstance, blockListCollectionName, {session})
		if (!deleteResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'タグブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'タグブロック解除に失敗しました、データクエリに失敗しました' }
		}
		await commitAndEndSession(session)
		return { success: true, message: 'タグブロック解除に成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'タグブロック解除に失敗しました、不明なエラー', error)
		return { success: false, message: 'タグブロック解除に失敗しました、不明なエラー' }
	}
}

/**
 * キーワードブロックを解除
 * @param unblockKeywordRequest キーワードブロック解除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns キーワードブロック解除のリクエストレスポンス
 */
export const unBlockKeywordService = async (unblockKeywordRequest: UnblockKeywordRequestDto, uuid: string, token: string): Promise<UnblockKeywordResponseDto> => {
	try {
		if (!checkBlockKeywordRequest(unblockKeywordRequest)) {
			return { success: false, message: 'キーワードブロック解除に失敗しました、キーワードブロック解除リクエストのペイロードが不正です' }
		}

		const { blockKeyword: keyword } = unblockKeywordRequest
		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', 'キーワードブロック解除に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'キーワードブロック解除に失敗しました、ユーザーが存在しません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'キーワードブロック解除に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'キーワードブロック解除に失敗しました、ユーザートークンが不正です' }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'keyword',
			value: keyword,
			operatorUUID: uuid,
		}

		const blockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUid: 1,
			operatorUUID: 1,
		}

		// トランザクション開始
		const session = await createAndStartSession()

		const selectResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName, {session})
		if (!selectResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'キーワードブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'キーワードブロック解除に失敗しました、データクエリに失敗しました' }
		}
		if (selectResult.result.length === 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'キーワードブロック解除に失敗しました、キーワードはブロックされていません')
			return { success: false, message: 'キーワードブロック解除に失敗しました、キーワードはブロックされていません' }
		}

		const { collectionName: unblockUserCollectionName, schemaInstance: unblockUserSchemaInstance } = UnblockListSchema
		type UnblockListSchemaType = InferSchemaType<typeof unblockUserSchemaInstance>
		const unblockListData: UnblockListSchemaType = {
			...selectResult.result[0],
			_operatorUid_: operatorUid,
			_operatorUUID_: uuid,
			createDateTime: new Date().getTime(),
		}
		const insertResult = await insertData2MongoDB<UnblockListSchemaType>(unblockListData, unblockUserSchemaInstance, unblockUserCollectionName, {session})
		if (!insertResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'キーワードブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'キーワードブロック解除に失敗しました、データクエリに失敗しました' }
		}

		const deleteResult = await deleteDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSchemaInstance, blockListCollectionName, {session})
		if (!deleteResult) {
			await abortAndEndSession(session)
			console.error('ERROR', 'キーワードブロック解除に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'キーワードブロック解除に失敗しました、データクエリに失敗しました' }
		}
		await commitAndEndSession(session)
		return { success: true, message: 'キーワードブロック解除に成功しました' }
	}
	catch (error) {
		console.error('ERROR', 'キーワードブロック解除に失敗しました、不明なエラー', error)
		return { success: false, message: 'キーワードブロック解除に失敗しました、不明なエラー' }
	}
}

/**
 * 正規表現を削除
 * @param removeRegexRequest 正規表現削除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns 正規表現削除のリクエストレスポンス
 */
export const removeRegexService = async (removeRegexRequest: RemoveRegexRequestDto, uuid: string, token: string): Promise<RemoveRegexResponseDto> => {
	try {
		if (!checkAddRegexRequest(removeRegexRequest)) {
			return { success: false, message: '正規表現削除に失敗しました、正規表現削除リクエストのペイロードが不正です' }
		}

		const { blockRegex: regex } = removeRegexRequest
		const operatorUid = await getUserUid(uuid)

		if (!operatorUid) {
			console.error('ERROR', '正規表現削除に失敗しました、ユーザーが存在しません')
			return { success: false, message: '正規表現削除に失敗しました、ユーザーが存在しません' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', '正規表現削除に失敗しました、ユーザートークンが不正です')
			return { success: false, message: '正規表現削除に失敗しました、ユーザートークンが不正です' }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockListWhere: QueryType<BlockListSchemaType> = {
			type: 'regex',
			value: regex,
			operatorUUID: uuid,
		}

		const blockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUid: 1,
			operatorUUID: 1,
		}

		// トランザクション開始
		const session = await createAndStartSession()

		const selectResult = await selectDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSelect, blockListSchemaInstance, blockListCollectionName, {session})
		if (!selectResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', '正規表現削除に失敗しました、データクエリに失敗しました')
			return { success: false, message: '正規表現削除に失敗しました、データクエリに失敗しました' }
		}
		if (selectResult.result.length === 0) {
			await abortAndEndSession(session)
			console.error('ERROR', '正規表現削除に失敗しました、正規表現はブロックされていません')
			return { success: false, message: '正規表現削除に失敗しました、正規表現はブロックされていません' }
		}

		const { collectionName: unblockUserCollectionName, schemaInstance: unblockUserSchemaInstance } = UnblockListSchema
		type UnblockListSchemaType = InferSchemaType<typeof unblockUserSchemaInstance>
		const unblockListData: UnblockListSchemaType = {
			...selectResult.result[0],
			_operatorUid_: operatorUid,
			_operatorUUID_: uuid,
			createDateTime: new Date().getTime(),
		}
		const insertResult = await insertData2MongoDB<UnblockListSchemaType>(unblockListData, unblockUserSchemaInstance, unblockUserCollectionName, {session})
		if (!insertResult) {
			await abortAndEndSession(session)
			console.error('ERROR', '正規表現削除に失敗しました、データクエリに失敗しました')
			return { success: false, message: '正規表現削除に失敗しました、データクエリに失敗しました' }
		}

		const deleteResult = await deleteDataFromMongoDB<BlockListSchemaType>(blockListWhere, blockListSchemaInstance, blockListCollectionName, {session})
		if (!deleteResult) {
			await abortAndEndSession(session)
			console.error('ERROR', '正規表現削除に失敗しました、データクエリに失敗しました')
			return { success: false, message: '正規表現削除に失敗しました、データクエリに失敗しました' }
		}
		await commitAndEndSession(session)
		return { success: true, message: '正規表現削除に成功しました' }
	}
	catch (error) {
		console.error('ERROR', '正規表現削除に失敗しました、不明なエラー', error)
		return { success: false, message: '正規表現削除に失敗しました、不明なエラー' }
	}
}

/**
 * ユーザーのブロックリストを取得
 * @param getBlockListRequest ユーザーのブロックリスト取得リクエストのペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns ユーザーのブロックリスト
 */
export const getBlockListService = async (getBlockListRequest: GetBlockListRequestDto, uuid?: string, token?: string): Promise<GetBlockListResponseDto> => {
	try {
		if (!checkGetBlockListRequest(getBlockListRequest)) {
			return { success: false, message: 'ブロックリスト取得に失敗しました、ブロックリスト取得リクエストのペイロードが不正です', blocklistCount: -1 }
		}

		if (!uuid || !token) {
			console.warn('WARN', 'WARNING', 'ブロックリスト取得に失敗しました、ユーザーがログインしていません')
			return { success: false, message: 'ブロックリスト取得に失敗しました、ユーザーがログインしていません', blocklistCount: -1 }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ブロックリスト取得に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ブロックリスト取得に失敗しました、ユーザートークンが不正です', blocklistCount: -1 }
		}

		const { type } = getBlockListRequest
		if (!['hide', 'block', 'keyword', 'tag', 'regex'].includes(type)) {
			console.error('ERROR', 'ブロックリスト取得に失敗しました、ブロックリストのタイプが不正です')
			return { success: false, message: 'ブロックリスト取得に失敗しました、ブロックリストのタイプが不正です' }
		}

		let pageSize = undefined
		let skip = 0
		if (getBlockListRequest.pagination && getBlockListRequest.pagination.page > 0 && getBlockListRequest.pagination.pageSize > 0) {
			skip = (getBlockListRequest.pagination.page - 1) * getBlockListRequest.pagination.pageSize
			pageSize = getBlockListRequest.pagination.pageSize
		}

		let getBlocklistPipelineProject: PipelineStage[] = [
			{
				$project: {
					type: 1,
					value: 1,
					createDateTime: 1,
				}
			}
		]

		const shouldJoinUserInfo = ['hide', 'block'].includes(type) // ユーザー情報を関連付ける必要があるかどうかを判断
		const shouldJoinTagInfo = type === 'tag' // TAG情報を関連付ける必要があるかどうかを判断
		
		if (shouldJoinUserInfo) {
			getBlocklistPipelineProject = [
				{
					$lookup: {
						from: 'user-infos',
						localField: 'value',
						foreignField: 'UUID',
						as: 'user_info_data',
					}
				},
				{
					$unwind: {
						path: '$user_info_data',
						preserveNullAndEmptyArrays: true,
					}
				},
				{
					$project: {
						type: 1,
						value: 1,
						createDateTime: 1,
						uid: '$user_info_data.uid',
						username: '$user_info_data.username',
						userNickname: '$user_info_data.userNickname',
						avatar: '$user_info_data.avatar',
					}
				}
			]
		}

		if (shouldJoinTagInfo) {
			getBlocklistPipelineProject = [
				{
					$addFields: {
						tagIdInt: { $toInt: "$value" } // 文字列フィールドを整数に変換
					}
				},
				{
					$lookup: {
						from: 'video-tags',
						localField: 'tagIdInt',
						foreignField: 'tagId',
						as: 'tag_data',
					}
				},
				{
					$unwind: {
						path: '$tag_data',
						preserveNullAndEmptyArrays: true,
					}
				},
				{
					$project: {
						type: 1,
						value: 1,
						createDateTime: 1,
						tag: '$tag_data',
					}
				}
			]
		}

		const countBlocklistPipeline: PipelineStage[] = [
			{
				$match: {
					operatorUUID: uuid,
					type,
				},
			},
			{
				$count: 'totalCount',
			},
		]

		const getBlocklistPipelineMix: PipelineStage[] = [
			{
				$match: {
					operatorUUID: uuid,
					type,
				},
			},
			{ $sort: { 'createDateTime': -1 } },
			{ $skip: skip },
			...(pageSize ? [{ $limit: pageSize }] : []),
			...getBlocklistPipelineProject
		]
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		const blocklistCountResult = await selectDataByAggregateFromMongoDB(blockListSchemaInstance, blockListCollectionName, countBlocklistPipeline)
		const blocklistResult = await selectDataByAggregateFromMongoDB(blockListSchemaInstance, blockListCollectionName, getBlocklistPipelineMix)

		if (!blocklistResult.success || !blocklistCountResult.success) {
			console.error('ERROR', 'ブロックリスト取得に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'ブロックリスト取得に失敗しました、データクエリに失敗しました' }
		}

		return {
			success: true,
			message: blocklistCountResult.result?.[0]?.totalCount > 0 ? 'ブロックリスト取得に成功しました' : 'ブロックリスト取得に成功しました、長さはゼロです',
			blocklistCount: blocklistCountResult.result?.[0]?.totalCount,
			result: blocklistResult.result,
		}

	} catch (error) {
		console.error('ERROR', 'ブロックリスト取得に失敗しました、不明なエラー', error)
		return { success: false, message: 'ブロックリスト取得に失敗しました、不明なエラー' }
	}
}

// /** ブロックリストのタイプ */
// type BlockListFilterCategory = 'block-uuid' | 'block-uid' | 'hide-uuid' | 'hide-uid' | 'keyword' | 'tag-id' | 'regex'
/** ブロックリストのタイプ */
type BlockListFilterCategory = 'block-uuid' | 'hide-uuid' | 'keyword' | 'tag-id' | 'regex'
/** どのプロパティにどのタイプのブロックリストフィルタを使用するかを設定します。attrパラメータは**開発者がハードコードした安全なフィールドでなければならず**、**ユーザーからの入力は禁止**です */
type BlockListAttrs = { attr: string, category: BlockListFilterCategory }[]
/** ブロックリスト機能の追加フィールド Project */
type AdditionalFieldsProject = {
	/** 他のユーザーによってブロックされているかどうか */
	isBlockedByOther?: 1;
}
/** 戻り値、構築済みのMonogoose Pipelineクエリ */
type BlockListFilterResult = { success: boolean, filter: PipelineStage.Match[], additionalFields: AdditionalFieldsProject } 
/**
 * Mongoose Pipeline ブロックリストフィルタを構築
 * @param attrs フィルタリングするプロパティと使用するフィルタリング方法
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns Mongoose Pipeline ブロックリストフィルタ
 */
export const buildBlockListMongooseFilter = async (attrs: BlockListAttrs, uuid?: string, token?: string): Promise<BlockListFilterResult> => {
	// MEME: Is that a dog...?
	try {
		if (!uuid || !token) {
			return { success: false, filter: [], additionalFields: { } }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ブロックリストフィルタの構築に失敗しました、ユーザートークンが不正です')
			return { success: false, filter: [], additionalFields: { } }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>

		const getBlockListWhere: QueryType<BlockListSchemaType> = {
			operatorUUID: uuid,
		}
		
		const getBlockListSelect: SelectType<BlockListSchemaType> = {
			type: 1,
			value: 1,
			operatorUUID: 1,
		}
		
		const { result: blockListResult, success: blockListSuccess } = await selectDataFromMongoDB<BlockListSchemaType>(getBlockListWhere, getBlockListSelect, blockListSchemaInstance, blockListCollectionName)

		const isBlockListOk = blockListSuccess && blockListResult.length > 0

		const blockUuidList = []
		const hideUuidList = []
		const keywordList = []
		const tagIdList = []
		const regexList = []
		for (const block of blockListResult) {
			switch (block.type) {
				case 'block':
					blockUuidList.push(block.value)
					break
				case 'hide':
					hideUuidList.push(block.value)
					break
				case 'keyword':
					keywordList.push(block.value)
					break
				case 'tag':
					tagIdList.push(parseInt(block.value ?? '-1', 10))
					break
				case 'regex':
					regexList.push(block.value)
					break
			}
		}

		// keywordが存在する場合、大きな正規表現を組み立てる
		let keywordReg: RegExp | null = null
		if (keywordList.length > 0) {
			keywordReg = new RegExp(keywordList.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'))
		}

		const additionalFields = { }
		const blockListMongooseFilter = []
		for (const { attr, category } of attrs) {
			if (!isBlockListOk) {
				switch (category) {
					case 'block-uuid': {
						blockListMongooseFilter.push(
							// 1. BlockListコレクションを関連付け、アップローダーがブロックしたユーザーリストを取得（type = 'user'のみ）
							{
								$lookup: {
									from: 'blocklists',
									let: { uuid: `$${attr}` },
									pipeline: [
										{
											$match: {
												$expr: { 
													$and: [
														{ $eq: ['$operatorUUID', '$$uuid'] },
														{ $eq: ['$type', 'block'] },
													],
												},
											},
										},
										{
											$project: {
												_id: 0,
												blockedUserUUID: '$value', // valueフィールドにはブロックされたユーザーのUUIDが保存される
											},
										},
									],
									as: 'block_by_others_data',
								},
							},
							// 2. フィルタリング：アップローダーが現在のユーザーをブロックしている動画を除外
							{
								$addFields: {
									isBlockedByOther: {
										$in: [ uuid, '$block_by_others_data.blockedUserUUID' ]
									},
								},
							},
						)
						additionalFields['isBlockedByOther'] = 1
						break;
					}
				}
				continue
			} else {
				switch (category) {
					case 'block-uuid': {
						if (blockUuidList.length > 0) {
							blockListMongooseFilter.push({ $match: { [attr]: { $nin: blockUuidList } } })
						}
						blockListMongooseFilter.push(
							// 1. BlockListコレクションを関連付け、アップローダーがブロックしたユーザーリストを取得（type = 'user'のみ）
							{
								$lookup: {
									from: 'blocklists',
									let: { uuid: `$${attr}` },
									pipeline: [
										{
											$match: {
												$expr: { 
													$and: [
														{ $eq: ['$operatorUUID', '$$uuid'] },
														{ $eq: ['$type', 'block'] },
													],
												},
											},
										},
										{
											$project: {
												_id: 0,
												blockedUserUUID: '$value', // valueフィールドにはブロックされたユーザーのUUIDが保存される
											},
										},
									],
									as: 'block_by_others_data',
								},
							},
							// 2. フィルタリング：アップローダーが現在のユーザーをブロックしている動画を除外
							{
								$addFields: {
									isBlockedByOther: {
										$in: [ uuid, '$block_by_others_data.blockedUserUUID' ]
									},
								},
							},
						)
						additionalFields['isBlockedByOther'] = 1
						break;
					}
					case 'hide-uuid': {
						if (hideUuidList.length > 0)
							blockListMongooseFilter.push({ $match: { [attr]: { $nin: hideUuidList } } })
						break;
					}
					case 'keyword': {
						if (keywordReg)
							blockListMongooseFilter.push({ $match: { [attr]: { $not: { $regex: keywordReg, $options: 'i' } } } })
						break;
					}
					case 'tag-id': {
						if (tagIdList.length > 0)
							blockListMongooseFilter.push({ $match: { [attr]: { $nin: tagIdList } } })
						break;
					}
					case 'regex': {
						if (regexList.length > 0)
							blockListMongooseFilter.push({ $match: { $nor: regexList.map(rx => ({ [attr]: { $regex: rx, $options: 'i' } })) } })
						break;
					}
				}
			}
		}

		return { success: true, filter: blockListMongooseFilter, additionalFields }
	} catch (error) {
		console.error('ERROR', 'ブロックリストフィルタの構築中にエラーが発生しました、不明なエラー', error)
		return { success: false, filter: [], additionalFields: { } }
	}
}

// /**
//  * コンテンツがブロックされているかどうかを確認
//  * @param uuid ユーザーuuid
//  * @param token ユーザートークン
//  * @param content コンテンツ
//  * @returns コンテンツがブロックされているかどうかのリクエストレスポンス
//  */
// export const checkBlockContentService = async (CheckIsBlockedRequest: CheckContentIsBlockedRequestDto, uuid: string, token: string): Promise<CheckIsBlockedResponseDto> => {
// 	try {
// 		if (!checkCheckContentIsBlockedRequest(CheckIsBlockedRequest)) {
// 			console.error('ERROR', 'コンテンツがブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です')
// 			return { success: true, message: 'コンテンツがブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です', isBlocked: false }
// 		}
// 		const { content } = CheckIsBlockedRequest

// 		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
// 			console.error('ERROR', 'コンテンツがブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です')
// 			return { success: false, message: 'コンテンツがブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です', isBlocked: false }
// 		}


// 		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
// 		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
// 		const keywordWhere: QueryType<BlockListSchemaType> = {
// 			type: 'keyword',
// 			operatorUUID: uuid,
// 		}
// 		const keywordSelect: SelectType<BlockListSchemaType> = {
// 			value: 1,
// 		}

// 		const regexWhere: QueryType<BlockListSchemaType> = {
// 			type: 'regex',
// 			operatorUUID: uuid,
// 		}
// 		const regexSelect: SelectType<BlockListSchemaType> = {
// 			value: 1,
// 		}

// 		const keywordResult = await selectDataFromMongoDB(keywordWhere, keywordSelect, blockListSchemaInstance, blockListCollectionName)
// 		if (!keywordResult.success) {
// 			console.error('ERROR', 'コンテンツがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました')
// 			return { success: false, message: 'コンテンツがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました', isBlocked: false }
// 		}

// 		const regexResult = await selectDataFromMongoDB(regexWhere, regexSelect, blockListSchemaInstance, blockListCollectionName)
// 		if (!regexResult.success) {
// 			console.error('ERROR', 'コンテンツがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました')
// 			return { success: false, message: 'コンテンツがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました', isBlocked: false }
// 		}
// 		const keywordData = keywordResult.result.map((item) => item.value)
// 		const regexData = regexResult.result.map((item) => item.value)

// 		if (keywordData.length > 0 || regexData.length > 0) {
// 			const regexList = regexData.map((regex) => new RegExp(regex, 'i'))
// 			const isBlocked = keywordData.some((keyword) => content.includes(keyword)) || regexList.some((regex) => regex.test(content))
// 			return { success: true, message: 'コンテンツがブロックされているかどうかの確認に成功しました、ブロックされています', isBlocked }
// 		} else {
// 			return { success: true, message: 'コンテンツがブロックされているかどうかの確認に成功しました、ブロックされていません', isBlocked: false }
// 		}

// 	} catch (error) {
// 		console.error('ERROR', 'コンテンツがブロックされているかどうかの確認に失敗しました、不明なエラー', error)
// 		return { success: false, message: 'コンテンツがブロックされているかどうかの確認に失敗しました、不明なエラー', isBlocked: false }
// 	}
// }

// /**
//  * タグがブロックされているかどうかを確認
//  * @param uuid ユーザーuuid
//  * @param token ユーザートークン
//  * @param tagId タグID
//  * @returns タグがブロックされているかどうかのリクエストレスポンス
//  */
// export const checkBlockTagsService = async (CheckIsBlockedRequest: CheckTagIsBlockedRequestDto, uuid: string, token: string): Promise<CheckIsBlockedResponseDto> => {
// 	try {
// 		if (!checkCheckTagIsBlockedRequest(CheckIsBlockedRequest)) {
// 			console.error('ERROR', 'タグがブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です')
// 			return { success: true, message: 'タグがブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です', isBlocked: false }
// 		}
// 		const { tagId } = CheckIsBlockedRequest

// 		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
// 			console.error('ERROR', 'タグがブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です')
// 			return { success: false, message: 'タグがブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です', isBlocked: false }
// 		}
// 		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
// 		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
// 		const tagWhere: QueryType<BlockListSchemaType> = {
// 			type: 'tag',
// 			operatorUUID: uuid,
// 		}
// 		const tagSelect: SelectType<BlockListSchemaType> = {
// 			value: 1,
// 		}
// 		const tagResult = await selectDataFromMongoDB(tagWhere, tagSelect, blockListSchemaInstance, blockListCollectionName)
// 		if (!tagResult.success) {
// 			console.error('ERROR', 'タグがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました')
// 			return { success: false, message: 'タグがブロックされているかどうかの確認に失敗しました、データクエリに失敗しました', isBlocked: false }
// 		}

// 		if (tagResult.result.length > 0) {
// 			const tagData = tagResult.result.map((item) => item.value)
// 			const isBlocked = tagData.some((tag) => tag === tagId)
// 			return { success: true, message: 'タグがブロックされているかどうかの確認に成功しました、ブロックされています', isBlocked }
// 		} else {
// 			return { success: true, message: 'タグがブロックされているかどうかの確認に成功しました、ブロックされていません', isBlocked: false }
// 		}

// 	} catch (error) {
// 		console.error('ERROR', 'タグがブロックされているかどうかの確認に失敗しました、不明なエラー', error)
// 		return { success: false, message: 'タグがブロックされているかどうかの確認に失敗しました、不明なエラー', isBlocked: false }
// 	}
// }

/**
 * ユーザーがブロックまたは非表示にされているかを確認
 * @param UUID ユーザーuuid
 * @param token ユーザートークン
 * @param targetUid ターゲットユーザーUID
 * @returns ユーザーがブロックまたは非表示にされているかどうかのリクエストレスポンス
 */
export const checkBlockUserService = async (checkIsBlockedRequest: CheckUserIsBlockedRequestDto, uuid: string, token: string): Promise<CheckUserIsBlockedResponseDto> => {
	try {
		let isBlocked = false
		let isHidden = false

		if (!checkCheckUserIsBlockedRequest(checkIsBlockedRequest)) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、リクエストペイロードが不正です')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、リクエストペイロードが不正です', isBlocked, isHidden }
		}

		const { uid } = checkIsBlockedRequest

		if (!checkUserExistsByUIDService({ uid })) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザーが存在しません', isBlocked, isHidden }
		}

		const targetUuid = await getUserUuid(uid)
		if (!targetUuid) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザーUUIDが存在しません')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザーUUIDが存在しません', isBlocked, isHidden }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザートークンが不正です')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ユーザートークンが不正です', isBlocked, isHidden }
		}

		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockWhere: QueryType<BlockListSchemaType> = {
			type: 'block',
			value: targetUuid,
			operatorUUID: uuid,
		}
		const hideWhere: QueryType<BlockListSchemaType> = {
			type: 'hide',
			value: targetUuid,
			operatorUUID: uuid,
		}
		const userSelect: SelectType<BlockListSchemaType> = {
			value: 1,
		}

		const blockResult = await selectDataFromMongoDB<BlockListSchemaType>(blockWhere, userSelect, blockListSchemaInstance, blockListCollectionName)
		if (!blockResult.success) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ブロックデータのクエリに失敗しました')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、ブロックデータのクエリに失敗しました', isBlocked, isHidden }
		}

		const hideResult = await selectDataFromMongoDB<BlockListSchemaType>(hideWhere, userSelect, blockListSchemaInstance, blockListCollectionName)
		if (!hideResult.success) {
			console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、非表示データのクエリに失敗しました')
			return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、非表示データのクエリに失敗しました', isBlocked, isHidden }
		}

		if (blockResult.result && Array.isArray(blockResult.result) && blockResult.result?.length > 0) {
			isBlocked = true
		}

		if (hideResult.result && Array.isArray(hideResult.result) && hideResult.result?.length > 0) {
			isHidden = true
		}

		return { success: true, message: 'ユーザーがブロックまたは非表示にされているかの確認が完了しました', isBlocked, isHidden }

	} catch (error) {
		console.error('ERROR', 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、不明なエラー', error)
		return { success: false, message: 'ユーザーがブロックまたは非表示にされているかどうかの確認に失敗しました、不明なエラー', isBlocked: false, isHidden: false }
	}
}

/**
 * 他のユーザーによってブロックされているかを確認
 * @param UUID ユーザーuuid
 * @param token ユーザートークン
 * @param targetUid ターゲットユーザーUID
 * @returns 他のユーザーによってブロックされているかどうかのリクエストレスポンス
 */
export const checkIsBlockedByOtherUserService = async (checkIsBlockedByOtherRequest: CheckIsBlockedByOtherUserRequestDto, uuid: string, token: string): Promise<CheckIsBlockedByOtherUserResponseDto> => {
	try {
		if (!checkCheckIsBlockedByOtherUserRequest(checkIsBlockedByOtherRequest)) {
			console.error('ERROR', '他のユーザーによってブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です')
			return { success: false, message: '他のユーザーによってブロックされているかどうかの確認に失敗しました、リクエストペイロードが不正です', isBlocked: false }
		}
		const { targetUid } = checkIsBlockedByOtherRequest

		if (!checkUserExistsByUIDService({uid: targetUid})) {
			return { success: false, message: '他のユーザーによってブロックされているかどうかの確認に失敗しました、ユーザーが存在しません', isBlocked: false }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', '他のユーザーによってブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です')
			return { success: false, message: '他のユーザーによってブロックされているかどうかの確認に失敗しました、ユーザートークンが不正です', isBlocked: false }
		}
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		type BlockListSchemaType = InferSchemaType<typeof blockListSchemaInstance>
		const blockWhere: QueryType<BlockListSchemaType> = {
			type: 'block',
			operatorUid: targetUid,
			value: uuid,
		}
		const blockSelect: SelectType<BlockListSchemaType> = {
			value: 1,
		}
		const blockResult = await selectDataFromMongoDB<BlockListSchemaType>(blockWhere, blockSelect, blockListSchemaInstance, blockListCollectionName)
		if (!blockResult.success) {
			console.error('ERROR', '他のユーザーによってブロックされているかどうかの確認に失敗しました、データクエリに失敗しました')
			return { success: false, message: '他のユーザーによってブロックされているかどうかの確認に失敗しました、データクエリに失敗しました', isBlocked: false }
		}

		if (blockResult.result && Array.isArray(blockResult.result) && blockResult.result.length > 0 ) {
			return { success: true, message: '他のユーザーによってブロックされているかの確認に成功しました、他のユーザーによってブロックされています', isBlocked: true }
		} else {
			return { success: true, message: '他のユーザーによってブロックされているかの確認に成功しました、他のユーザーによってブロックされていません', isBlocked: false }
		}

	} catch (error) {
		console.error('ERROR', '他のユーザーによってブロックされているかどうかの確認に失敗しました、不明なエラー', error)
		return { success: false, message: '他のユーザーによってブロックされているかどうかの確認に失敗しました、不明なエラー', isBlocked: false }
	}
}

/**
 * 対応するタイプのブロックリストの数量を取得
 * @param blocklistType ブロックリストのタイプ
 * @param uuid ブロックリストの作成者UUID
 * @returns 対応するタイプのブロックリストの数量
 */
const getBlocklistCount = async (blocklistType: string, uuid: string): Promise<number> => {
	try {
		const { collectionName: blockListCollectionName, schemaInstance: blockListSchemaInstance } = BlockListSchema
		const countBlocklistPipeline: PipelineStage[] = [
			{
				$match: {
					operatorUUID: uuid,
					type: blocklistType,
				},
			},
			{
				$count: 'totalCount',
			},
		]
		const BlocklistCountResult = await selectDataByAggregateFromMongoDB(blockListSchemaInstance, blockListCollectionName, countBlocklistPipeline)
		if (!BlocklistCountResult.success) {
			console.error('ERROR', 'ブロックリストの数量取得に失敗しました、データクエリに失敗しました')
			return 0
		}
		return BlocklistCountResult.result?.[0]?.totalCount
	} catch (error) {
		console.error('ERROR', 'ブロックリストの数量取得に失敗しました、不明なエラー', error)
		return 0
	}
}


/**
 * ユーザーブロックリクエストのペイロードを検証
 * @param blockUserByUidRequest ユーザーブロックのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkBlockUserByUidRequest = (blockUserByUidRequest: BlockUserByUidRequestDto): boolean => {
	if (!blockUserByUidRequest.blockUid) {
		console.error('ERROR', 'ユーザーブロックリクエストのペイロードが不正です')
		return false
	}
	return true
}

/**
 * ユーザー非表示リクエストのペイロードを検証
 * @param HideUserByUidRequest ユーザー非表示のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkHideUserByUidRequest = (hideUserByUidRequest: HideUserByUidRequestDto): boolean => {
	if (!hideUserByUidRequest.hideUid) {
		console.error('ERROR', 'ユーザー非表示リクエストのペイロードが不正です')
		return false
	}
	return true
}

/**
 * キーワードブロックリクエストのペイロードを検証
 * @param blockKeywordRequest キーワードブロックのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkBlockKeywordRequest = (blockKeywordRequest: BlockKeywordRequestDto): boolean => {
	if (!blockKeywordRequest?.blockKeyword) {
			console.error('ERROR', 'キーワードブロックリクエストのペイロードが不正です')
			return false
	}
	const keyword = blockKeywordRequest.blockKeyword
	const validKeywordRegex = /^[a-zA-Z0-9\u4e00-\u9fa5\s.,!?@#$%&*()_+-=[\]{}|;:'"`~<>]+$/
	if (
			keyword.trim().length === 0 || // 空の文字列または純粋なスペース
			keyword.length > MAX_KEYWORD_LENGTH || // 長さが制限を超えている
			!validKeywordRegex.test(keyword) // 不正な文字が含まれている
	) {
			console.error('ERROR', 'キーワードブロックリクエストのペイロードが不正です')
			return false
	}

	return true
}

/**
 * タグブロックリクエストのペイロードを検証
 * @param blockTagRequest タグブロックのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkBlockTagRequest = (blockTagRequest: BlockTagRequestDto): boolean => {
	if (!blockTagRequest.tagId) {
		console.error('ERROR', 'タグブロックリクエストのペイロードが不正です')
		return false
	}
	return true
}

/**
 * 正規表現追加リクエストのペイロードを検証
 * @param addRegexRequest 正規表現追加のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAddRegexRequest = (addRegexRequest: AddRegexRequestDto): boolean => {
	if (!addRegexRequest?.blockRegex) {
			console.error('ERROR', '正規表現追加リクエストのペイロードが不正です')
			return false
	}
	const regex = addRegexRequest.blockRegex
	if (
			regex.trim().length === 0 || // 空の文字列または純粋なスペース
			regex.length > MAX_REGEX_LENGTH // 長さが制限を超えている
	) {
			return false
	}
	try {
			new RegExp(regex)
	} catch (e) {
			return false
	}
	return true
}

/**
 * ブロックリスト取得リクエストのペイロードを検証
 * @param request ブロックリスト取得のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetBlockListRequest = (GetBlockListRequest: GetBlockListRequestDto) => {
	return (
		GetBlockListRequest.type !== undefined && GetBlockListRequest.type !== null
	)
}

/**
 * コンテンツがブロックされているかどうかのリクエストペイロードを検証
 * @param CheckIsBlockedRequestDto コンテンツがブロックされているかどうかのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCheckContentIsBlockedRequest = (checkIsBlockedRequest: CheckContentIsBlockedRequestDto): boolean => {
	if (!checkIsBlockedRequest?.content) {
			console.error('ERROR', 'コンテンツがブロックされているかどうかの確認リクエストのペイロードが不正です')
			return false
	}
	const content = checkIsBlockedRequest.content
	if (
			content.trim().length === 0 || // 空の文字列または純粋なスペース
			content.length > 500 // 長さが制限を超えている
	) {
			return false
	}
	return true
}

/**
 * タグがブロックされているかどうかのリクエストペイロードを検証
 * @param CheckIsBlockedRequest コンテンツがブロックされているかどうかのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCheckTagIsBlockedRequest = (checkIsBlockedRequest: CheckTagIsBlockedRequestDto): boolean => {
	return (
		checkIsBlockedRequest.tagId !== undefined && checkIsBlockedRequest.tagId !== null
	)
}

/**
 * ユーザーがブロックされているかどうかのリクエストペイロードを検証
 * @param CheckIsBlockedRequest コンテンツがブロックされているかどうかのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCheckUserIsBlockedRequest = (checkIsBlockedRequest: CheckUserIsBlockedRequestDto): boolean => {
	return (
		checkIsBlockedRequest.uid !== undefined && checkIsBlockedRequest.uid !== null
	)
}

/**
 * 他のユーザーによってブロックされているかどうかのリクエストペイロードを検証
 * @param CheckIsBlockedByOtherUserRequestDto 他のユーザーによってブロックされているかどうかのリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCheckIsBlockedByOtherUserRequest = (checkIsBlockedRequest: CheckIsBlockedByOtherUserRequestDto): boolean => {
	return (
		checkIsBlockedRequest.targetUid !== undefined && checkIsBlockedRequest.targetUid !== null
	)
}
