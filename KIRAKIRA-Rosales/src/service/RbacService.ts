import { InferSchemaType, PipelineStage, Query } from "mongoose";
import { AdminGetUserRolesByUidRequestDto, AdminGetUserRolesByUidResponseDto, AdminUpdateUserRoleRequestDto, AdminUpdateUserRoleResponseDto, CheckUserRbacParams, CheckUserRbacResult, CreateRbacApiPathRequestDto, CreateRbacApiPathResponseDto, CreateRbacRoleRequestDto, CreateRbacRoleResponseDto, DeleteRbacApiPathRequestDto, DeleteRbacApiPathResponseDto, DeleteRbacRoleRequestDto, DeleteRbacRoleResponseDto, GetRbacApiPathRequestDto, GetRbacApiPathResponseDto, GetRbacRoleRequestDto, GetRbacRoleResponseDto, UpdateApiPathPermissionsForRoleRequestDto, UpdateApiPathPermissionsForRoleResponseDto } from "../controller/RbacControllerDto.js";
import { checkUserTokenByUuidService, getUserUuid } from "./UserService.js";
import { deleteDataFromMongoDB, findOneAndUpdateData4MongoDB, insertData2MongoDB, selectDataByAggregateFromMongoDB, selectDataFromMongoDB } from "../dbPool/DbClusterPool.js";
import { UserAuthSchema, UserInfoSchema } from "../dbPool/schema/UserSchema.js";
import { RbacApiSchema, RbacRoleSchema } from "../dbPool/schema/RbacSchema.js";
import { v4 as uuidV4 } from 'uuid'
import { QueryType, SelectType, UpdateType } from "../dbPool/DbClusterPoolTypes.js";
import { abortAndEndSession, commitAndEndSession, createAndStartSession } from "../common/MongoDBSessionTool.js";
import { koaCtx } from "../type/koaTypes.js";
import { clearUndefinedItemInObject, isEmptyObject } from "../common/ObjectTool.js";

/**
 * RBAC経由でユーザーの権限を確認する
 * @param params RBAC経由でユーザーの権限を確認するためのパラメータ
 * @returns RBAC経由でユーザーの権限を確認した結果
 */
export const checkUserByRbac = async (params: CheckUserRbacParams): Promise<CheckUserRbacResult> => {
	try {
		const apiPath = params.apiPath
		let uuid: string | undefined = undefined
		let uid: number | undefined = undefined
		if ('uuid' in params) uuid = params.uuid
		if ('uid' in params) uid = params.uid

		if (!uuid && uid === undefined) {
			console.error('ERROR', 'ユーザーがRBAC認証を実行する際に失敗しました、UUIDまたはUIDが提供されていません')
			return { status: 500, message: `ユーザーがRBAC認証を実行する際に失敗しました、UUIDまたはUIDが提供されていません` }
		}

		const match = { UUID: uuid, uid }
		const clearedMatch = clearUndefinedItemInObject(match)

		const checkUserRbacPipeline: PipelineStage[] = [
			// ユーザーを照合
			{
				$match: clearedMatch,
			},
			// rolesコレクションを関連付け
			{
				$lookup: {
					from: "rbac-roles",
					localField: "roles",
					foreignField: "roleName",
					as: "rolesData"
				}
			},
			// rolesData配列を展開（複数のロール）
			{ $unwind: "$rolesData" },
			// apiPathNamePermissions配列を展開（複数の権限）
			{ $unwind: "$rolesData.apiPathPermissions" },
			// 一致するAPIパスをフィルタリング
			{
				$match: {
					"rolesData.apiPathPermissions": apiPath
				}
			},
			// 権限のあるデータのみを返す
			{ $project: { UUID: 1 } }
		]

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>
		const checkUserRbacResult = await selectDataByAggregateFromMongoDB<UserAuth>(userAuthSchemaInstance, userAuthCollectionName, checkUserRbacPipeline)

		if (checkUserRbacResult && checkUserRbacResult.success && checkUserRbacResult.result && Array.isArray(checkUserRbacResult.result) && checkUserRbacResult.result.length > 0) {
			return { status: 200, message: `ユーザー ${uuid ? `UUID: ${uuid}` : `UID: ${uid}`} は ${apiPath} へのアクセス権を持っています` }
		} else {
			return { status: 403, message: `ユーザー ${uuid ? `UUID: ${uuid}` : `UID: ${uid}`} は ${apiPath} へのアクセス権が不足しているか、ユーザーが存在しません` }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーがRBAC認証を実行中にエラーが発生しました、不明なエラー：', error)
		return { status: 500, message: 'ユーザーがRBAC認証を実行中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * Controller層でRBAC経由でユーザーの権限を確認する
 * この関数はcheckUserByRbacの二次的なカプセル化であり、検証失敗時にctxのステータスコードとエラーメッセージを補完する機能を含み、単純なboolean型の結果を返します。この結果はControllerで後続のコードを実行する必要があるかどうかを判断するために使用されます
 * @param params RBAC経由でユーザーの権限を確認するためのパラメータ
 * @param ctx koa context
 * @returns boolean型の権限チェック結果、成功した場合はtrue、失敗した場合はfalseを返す
 */
export const isPassRbacCheck = async (params: CheckUserRbacParams, ctx: koaCtx): Promise<boolean> => {
	try {
		const rbacCheckResult = await checkUserByRbac(params)
		const { status: rbacStatus, message: rbacMessage } = rbacCheckResult
		if (rbacStatus !== 200) {
			ctx.status = rbacStatus
			ctx.body = rbacMessage
			console.warn('WARN', 'WARNING', 'RBAC', `${rbacStatus} - ${rbacMessage}`)
			return false
		}

		return true
	} catch (error) {
		console.error('ERROR', 'Controller層でRBAC認証を実行中にエラーが発生しました、不明なエラー：', error)
		ctx.status = 500
		ctx.body = 'Controller層でRBAC認証を実行中にエラーが発生しました、不明なエラー'
		return false
	}
}

/**
 * RBAC APIパスを作成
 * @param createRbacApiPathRequest RBAC APIパス作成のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBAC APIパス作成のリクエストレスポンス
 */
export const createRbacApiPathService = async (createRbacApiPathRequest: CreateRbacApiPathRequestDto, uuid: string, token: string): Promise<CreateRbacApiPathResponseDto> => {
	try {
		if (!checkCreateRbacApiPathRequest(createRbacApiPathRequest)) {
			console.error('ERROR', 'RBAC APIパスの作成に失敗しました、パラメータが不正です')
			return { success: false, message: 'RBAC APIパスの作成に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBAC APIパスの作成に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'RBAC APIパスの作成に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { apiPath, apiPathType, apiPathColor, apiPathDescription } = createRbacApiPathRequest
		const apiPathUuid = uuidV4()
		const now = new Date().getTime()

		const { collectionName: rbacApiCollectionName, schemaInstance: rbacApiSchemaInstance } = RbacApiSchema
		type RbacApi = InferSchemaType<typeof rbacApiSchemaInstance>

		const rbacApiData: RbacApi = {
			apiPathUuid,
			apiPath,
			apiPathType,
			apiPathColor,
			apiPathDescription,
			creatorUuid: uuid,
			lastEditorUuid: uuid,
			createDateTime: now,
			editDateTime: now
		}

		const insertResult = await insertData2MongoDB<RbacApi>(rbacApiData, rbacApiSchemaInstance, rbacApiCollectionName)
		const insertResultData = insertResult?.result?.[0]

		if (!insertResult.success || !insertResultData) {
			console.error('ERROR', 'RBAC APIパスの作成に失敗しました、データの挿入に失敗しました')
			return { success: false, message: 'RBAC APIパスの作成に失敗しました、データの挿入に失敗しました' }
		}

		return {
			success: true,
			message: 'RBAC APIパスの作成に成功しました',
			result: {
				apiPathUuid: insertResultData.apiPathUuid,
				apiPath: insertResultData.apiPath,
				apiPathType: insertResultData.apiPathType,
				apiPathColor: insertResultData.apiPathColor,
				apiPathDescription: insertResultData.apiPathDescription,
				creatorUuid: insertResultData.creatorUuid,
				lastEditorUuid: insertResultData.lastEditorUuid,
				createDateTime: insertResultData.createDateTime,
				editDateTime: insertResultData.editDateTime,
				isAssignedOnce: false
			}
		}
	} catch (error) {
		console.error('ERROR', 'RBAC APIパスの作成中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'RBAC APIパスの作成中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * RBAC APIパスを削除
 * @param deleteRbacApiPathRequest RBAC APIパス削除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBAC APIパス削除のリクエストレスポンス
 */
export const deleteRbacApiPathService = async (deleteRbacApiPathRequest: DeleteRbacApiPathRequestDto, uuid: string, token: string): Promise<DeleteRbacApiPathResponseDto> => {
	try {
		if (!checkDeleteRbacApiPathRequest(deleteRbacApiPathRequest)) {
			console.error('ERROR', 'RBAC APIパスの削除に失敗しました、パラメータが不正です')
			return { success: false, isAssigned: false, message: 'RBAC APIパスの削除に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBAC APIパスの削除に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, isAssigned: false, message: 'RBAC APIパスの削除に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { apiPath } = deleteRbacApiPathRequest

		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const chackApiPathUnassignedWhere: QueryType<RbacRole> = {
			apiPathPermissions: { $in: [apiPath] }
		}
		const chackApiPathUnassignedSelect: SelectType<RbacRole> = {
			roleName: 1,
		}

		const session = await createAndStartSession()

		const chackApiPathUnassignedResult = await selectDataFromMongoDB<RbacRole>(chackApiPathUnassignedWhere, chackApiPathUnassignedSelect, rbacRoleSchemaInstance, rbacRoleCollectionName, { session })

		if (chackApiPathUnassignedResult.result?.length > 0) {
			await abortAndEndSession(session)
			console.error('ERROR', 'RBAC APIパスの削除に失敗しました、このAPIパスは既にロールにバインドされています。削除する前にロールから削除してください。')
			return { success: false, isAssigned: true, message: 'RBAC APIパスの削除に失敗しました、このAPIパスは既にロールにバインドされています。削除する前にロールから削除してください。' }
		}

		const { collectionName: rbacApiCollectionName, schemaInstance: rbacApiSchemaInstance } = RbacApiSchema
		type RbacApi = InferSchemaType<typeof rbacApiSchemaInstance>

		const deleteRbacApiWhere: QueryType<RbacApi> = {
			apiPath,
		}

		const deleteRbacApiResult = await deleteDataFromMongoDB(deleteRbacApiWhere, rbacApiSchemaInstance, rbacApiCollectionName, { session })

		if (!deleteRbacApiResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'RBAC APIパスの削除に失敗しました、データの削除に失敗しました')
			return { success: false, isAssigned: false, message: 'RBAC APIパスの削除に失敗しました、データの削除に失敗しました' }
		}

		await commitAndEndSession(session)
		return { success: true, isAssigned: false, message: 'RBAC APIパスの削除に成功しました' }
	} catch (error) {
		console.error('ERROR', 'RBAC APIパスの作成中にエラーが発生しました、不明なエラー：', error)
		return { success: false, isAssigned: false, message: 'RBAC APIパスの作成中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * RBAC APIパスを取得
 * @param getRbacApiPathRequest RBAC APIパス取得のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBAC APIパス取得のリクエストレスポンス
 */
export const getRbacApiPathService = async (getRbacApiPathRequest: GetRbacApiPathRequestDto, uuid: string, token: string): Promise<GetRbacApiPathResponseDto> => {
	try {
		if (!checkGetRbacApiPathRequest(getRbacApiPathRequest)) {
			console.error('ERROR', 'RBAC APIパスの取得に失敗しました、パラメータが不正です')
			return { success: false, message: 'RBAC APIパスの取得に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBAC APIパスの取得に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'RBAC APIパスの取得に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { search, pagination } = getRbacApiPathRequest
		const clearedSearch = clearUndefinedItemInObject(search)

		let skip = 0
		let pageSize = undefined
		if (pagination && pagination.page > 0 && pagination.pageSize > 0) {
			skip = (pagination.page - 1) * pagination.pageSize
			pageSize = pagination.pageSize
		}

		const countRbacApiPathPipeline: PipelineStage[] = [
			...(!isEmptyObject(clearedSearch) ? [{
				$match: {
					$and: Object.entries(clearedSearch).map(([key, value]) => ({
						[key]: { $regex: value, $options: "i" } // あいまい検索を生成
					}))
				},
			}] : []),
			{
				$count: 'totalCount', // 総ドキュメント数をカウント
			},
		]

		const getRbacApiPathPipeline: PipelineStage[] = [
			...(!isEmptyObject(clearedSearch) ? [{
				$match: {
					$and: Object.entries(clearedSearch).map(([key, value]) => ({
						[key]: { $regex: value, $options: "i" } // あいまい検索を生成
					}))
				},
			}] : []),
			{
				$lookup: {
					from: "rbac-roles",
					localField: "apiPath",
					foreignField: "apiPathPermissions",
					as: "matchedDocs"
				}
			},
			{
				$addFields: {
					isAssignedOnce: { $gt: [{ $size: "$matchedDocs" }, 0] } // matchedDocsにデータがあればtrue
				}
			},
			{
				$project: {
					matchedDocs: 0 // matchedDocsフィールドを削除し、Aコレクションの元の構造を維持
				}
			},
			{ $skip: skip }, // 指定された数のドキュメントをスキップ
			{ $limit: pageSize }, // 返されるドキュメントの数を制限
		]

		const { collectionName: rbacApiCollectionName, schemaInstance: rbacApiSchemaInstance } = RbacApiSchema
		type RbacApi = InferSchemaType<typeof rbacApiSchemaInstance>

		const rbacApiPathCountPromise = selectDataByAggregateFromMongoDB(rbacApiSchemaInstance, rbacApiCollectionName, countRbacApiPathPipeline)
		const rbacApiPathDataPromise = selectDataByAggregateFromMongoDB<RbacApi & { isAssignedOnce: boolean }>(rbacApiSchemaInstance, rbacApiCollectionName, getRbacApiPathPipeline)

		const [ rbacApiPathCountResult, rbacApiPathDataResult ] = await Promise.all([rbacApiPathCountPromise, rbacApiPathDataPromise])
		const count = rbacApiPathCountResult.result?.[0]?.totalCount
		const result = rbacApiPathDataResult.result

		if (!rbacApiPathCountResult.success || !rbacApiPathDataResult.success
			|| typeof count !== 'number' || count < 0
			|| ( Array.isArray(result) && !result )
		) {
			console.error('ERROR', 'RBAC APIパスの取得に失敗しました、データの取得に失敗しました')
			return { success: false, message: 'RBAC APIパスの取得に失敗しました、データの取得に失敗しました' }
		}

		if (count === 0) {
			return { success: true, message: 'RBAC APIパスが見つかりませんでした', count: 0, result: [] }
		} else {
			return { success: true, message: 'RBAC APIパスのクエリに成功しました', count, result }
		}
	} catch (error) {
		console.error('ERROR', 'RBAC APIパスの取得中にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'RBAC APIパスの取得中にエラーが発生しました、不明なエラー' }
	}
} 

/**
 * RBACロールを作成
 * @param createRbacRoleRequest RBACロール作成のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBACロール作成のリクエストレスポンス
 */
export const createRbacRoleService = async (createRbacRoleRequest: CreateRbacRoleRequestDto, uuid: string, token: string): Promise<CreateRbacRoleResponseDto> => {
	try {
		if (!checkCreateRbacRoleRequest(createRbacRoleRequest)) {
			console.error('ERROR', 'RBACロールの作成に失敗しました、パラメータが不正です')
			return { success: false, message: 'RBACロールの作成に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBACロールの作成に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'RBACロールの作成に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { roleName, roleType, roleColor, roleDescription } = createRbacRoleRequest
		const roleUuid = uuidV4()
		const now = new Date().getTime()

		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const rbacRoleData: RbacRole = {
			roleUuid,
			roleName,
			apiPathPermissions: [],
			roleType,
			roleColor,
			roleDescription,
			creatorUuid: uuid,
			lastEditorUuid: uuid,
			createDateTime: now,
			editDateTime: now
		}

		const insertResult = await insertData2MongoDB<RbacRole>(rbacRoleData, rbacRoleSchemaInstance, rbacRoleCollectionName)
		const insertResultData = insertResult?.result?.[0]

		if (!insertResult.success || !insertResultData) {
			console.error('ERROR', 'RBACロールの作成に失敗しました、データの挿入に失敗しました')
			return { success: false, message: 'RBACロールの作成に失敗しました、データの挿入に失敗しました' }
		}

		return { success: true, message: 'RBACロールの作成に成功しました', result: insertResultData }
	} catch (error) {
		console.error('ERROR', 'RBACロールの作成中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'RBACロールの作成中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * RBACロールを削除
 * @param deleteRbacRoleRequest RBACロール削除のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBACロール削除のリクエストレスポンス
 */
export const deleteRbacRoleService = async (deleteRbacRoleRequest: DeleteRbacRoleRequestDto, uuid: string, token: string): Promise<DeleteRbacRoleResponseDto> => {
	try {
		if (!checkDeleteRbacRoleRequest(deleteRbacRoleRequest)) {
			console.error('ERROR', 'RBACロールの削除に失敗しました、パラメータが不正です')
			return { success: false, message: 'RBACロールの削除に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBACロールの削除に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'RBACロールの削除に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { roleName } = deleteRbacRoleRequest

		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const deleteRbacRoleWhere: QueryType<RbacRole> = {
			roleName,
		}

		const deleteResult = await deleteDataFromMongoDB(deleteRbacRoleWhere, rbacRoleSchemaInstance, rbacRoleCollectionName)

		if (!deleteResult.success) {
			console.error('ERROR', 'RBACロールの削除に失敗しました、データの挿入に失敗しました')
			return { success: false, message: 'RBACロールの削除に失敗しました、データの挿入に失敗しました' }
		}

		return { success: true, message: 'RBACロールの削除に成功しました' }
	} catch (error) {
		console.error('ERROR', 'RBACロールの削除中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'RBACロールの削除中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * RBACロールを取得
 * @param getRbacRoleRequest RBACロール取得のリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns RBACロール取得のリクエストレスポンス
 */
export const getRbacRoleService = async (getRbacRoleRequest: GetRbacRoleRequestDto, uuid: string, token: string): Promise<GetRbacRoleResponseDto> => {
	try {
		if (!checkGetRbacRoleRequest(getRbacRoleRequest)) {
			console.error('ERROR', 'RBACロールの取得に失敗しました、パラメータが不正です')
			return { success: false, message: 'RBACロールの取得に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'RBACロールの取得に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'RBACロールの取得に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { search, pagination } = getRbacRoleRequest
		const clearedSearch = clearUndefinedItemInObject(search)

		let skip = 0
		let pageSize = undefined
		if (pagination && pagination.page > 0 && pagination.pageSize > 0) {
			skip = (pagination.page - 1) * pagination.pageSize
			pageSize = pagination.pageSize
		}

		const countRbacRolePipeline: PipelineStage[] = [
			...(!isEmptyObject(clearedSearch) ? [{
				$match: {
					$and: Object.entries(clearedSearch).map(([key, value]) => ({
						[key]: { $regex: value, $options: "i" } // あいまい検索を生成
					}))
				},
			}] : []),
			{
				$count: 'totalCount', // 総ドキュメント数をカウント
			},
		]

		const getRbacRolePipeline: PipelineStage[] = [
			...(!isEmptyObject(clearedSearch) ? [{
				$match: {
					$and: Object.entries(clearedSearch).map(([key, value]) => ({
						[key]: { $regex: value, $options: "i" } // あいまい検索を生成
					}))
				},
			}] : []),
			{
				$lookup: {
					from: "rbac-api-lists",
					localField: "apiPathPermissions",
					foreignField: "apiPath",
					as: "apiPathList"
				}
			},
			{
				$addFields: {
					apiPathList: "$apiPathList"
				}
			},
			{ $skip: skip }, // 指定された数のドキュメントをスキップ
			{ $limit: pageSize }, // 返されるドキュメントの数を制限
		]
		
		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const rbacRoleCountPromise = selectDataByAggregateFromMongoDB(rbacRoleSchemaInstance, rbacRoleCollectionName, countRbacRolePipeline)
		const rbacRoleDataPromise = selectDataByAggregateFromMongoDB<RbacRole & { apiPathList: GetRbacRoleResponseDto['result'][number]['apiPathList'] }>(rbacRoleSchemaInstance, rbacRoleCollectionName, getRbacRolePipeline)

		const [ rbacRoleCountResult, rbacRoleDataResult ] = await Promise.all([rbacRoleCountPromise, rbacRoleDataPromise])
		const count = rbacRoleCountResult.result?.[0]?.totalCount
		const result = rbacRoleDataResult.result

		if (!rbacRoleCountResult.success || !rbacRoleDataResult.success
			|| typeof count !== 'number' || count < 0
			|| ( Array.isArray(result) && !result )
		) {
			console.error('ERROR', 'RBACロールの取得に失敗しました、データの取得に失敗しました')
			return { success: false, message: 'RBACロールの取得に失敗しました、データの取得に失敗しました' }
		}

		if (count === 0) {
			return { success: true, message: 'RBACロールが見つかりませんでした', count: 0, result: [] }
		} else {
			return { success: true, message: 'RBAC APIパスのクエリに成功しました', count, result }
		}

	} catch (error) {
		console.error('ERROR', 'RBACロールの取得中にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'RBACロールの取得中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ロールにAPIパス権限を更新する
 * @param updateApiPathPermissionsForRoleRequest ロールにAPIパス権限を更新するリクエストペイロード
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns ロールにAPIパス権限を更新するリクエストレスポンス
 */
export const updateApiPathPermissionsForRoleService = async (updateApiPathPermissionsForRoleRequest: UpdateApiPathPermissionsForRoleRequestDto, uuid: string, token: string): Promise<UpdateApiPathPermissionsForRoleResponseDto> => {
	try {
		if (!checkUpdateApiPathPermissionsForRoleRequest(updateApiPathPermissionsForRoleRequest)) {
			console.error('ERROR', 'ロールのAPIパス権限の更新に失敗しました、パラメータが不正です')
			return { success: false, message: 'ロールのAPIパス権限の更新に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ロールのAPIパス権限の更新に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'ロールのAPIパス権限の更新に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { roleName, apiPathPermissions } = updateApiPathPermissionsForRoleRequest
		const uniqueApiPathPermissions = [...new Set(apiPathPermissions)]

		const { collectionName: rbacApiCollectionName, schemaInstance: rbacApiSchemaInstance } = RbacApiSchema
		type RbacApiList = InferSchemaType<typeof rbacApiSchemaInstance>

		const checkApiPathPermissionsCountWhere: QueryType<RbacApiList> = {
			apiPath: { $in: uniqueApiPathPermissions },
		}
		
		const checkApiPathPermissionsCountSelect: SelectType<RbacApiList> = {
			apiPath: 1,
		}

		const session = await createAndStartSession()

		const checkApiPathPermissionsCountResult = await selectDataFromMongoDB<RbacApiList>(checkApiPathPermissionsCountWhere, checkApiPathPermissionsCountSelect, rbacApiSchemaInstance, rbacApiCollectionName, { session })

		if (!checkApiPathPermissionsCountResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ロールのAPIパス権限の更新に失敗しました、APIパスの確認に失敗しました')
			return { success: false, message: 'ロールのAPIパス権限の更新に失敗しました、APIパスの確認に失敗しました' }
		}

		if (checkApiPathPermissionsCountResult.result.length !== uniqueApiPathPermissions.length) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ロールのAPIパス権限の更新に失敗しました、APIパスの確認に失敗しました。存在しないパスをロールに追加しようとした可能性があります。')
			return { success: false, message: 'ロールのAPIパス権限の更新に失敗しました、APIパスの確認に失敗しました。存在しないパスをロールに追加しようとした可能性があります。' }
		}

		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const updateApiPathPermissions4RoleWhere: QueryType<RbacRole> = {
			roleName,
		}
		
		const now = new Date().getTime()
		const updateApiPathPermissions4RoleData: UpdateType<RbacRole> = {
			lastEditorUuid: uuid,
			apiPathPermissions: uniqueApiPathPermissions as RbacRole['apiPathPermissions'], // TODO: Mongoose issue: #12420
			editDateTime: now,
		}

		const updateApiPathPermissions4Role = await findOneAndUpdateData4MongoDB<RbacRole>(updateApiPathPermissions4RoleWhere, updateApiPathPermissions4RoleData, rbacRoleSchemaInstance, rbacRoleCollectionName)

		if (!updateApiPathPermissions4Role.success) {
			await abortAndEndSession(session)
			console.error('ERROR', 'ロールのAPIパス権限の更新に失敗しました、更新に失敗しました')
			return { success: false, message: 'ロールのAPIパス権限の更新に失敗しました、更新に失敗しました' }
		}

		return { success: true, message: 'ロールのAPIパス権限の更新に成功しました', result: updateApiPathPermissions4Role.result }
	} catch (error) {
		console.error('ERROR', 'ロールのAPIパス権限の更新中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'ロールのAPIパス権限の更新中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * 管理者がユーザーのロールを更新する
 * @param adminUpdateUserRoleRequest 管理者がユーザーのロールを更新するリクエストペイロード
 * @param adminUuid 管理者のUUID
 * @param adminToken 管理者のトークン
 * @returns 管理者がユーザーのロールを更新するリクエストレスポンス
 */
export const adminUpdateUserRoleService = async (adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto, adminUuid: string, adminToken: string): Promise<AdminUpdateUserRoleResponseDto> => {
	try {
		if (!checkAdminUpdateUserRoleRequest(adminUpdateUserRoleRequest)) {
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(adminUuid, adminToken)).success) {
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { uid, newRoles } = adminUpdateUserRoleRequest
		let { uuid } = adminUpdateUserRoleRequest
		const uniqueNewRoels = [...new Set(newRoles)]

		if (uid && !uuid) {
			uuid = await getUserUuid(uid) || ''
		}

		if (!uuid) {
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、ユーザーUUIDが見つかりません')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、ユーザーUUIDが見つかりません' }
		}

		const { collectionName: rbacRoleCollectionName, schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>

		const checkNewRoelsCountWhere: QueryType<RbacRole> = {
			roleName: { $in: uniqueNewRoels },
		}
		
		const checkNewRoelsCountSelect: SelectType<RbacRole> = {
			roleName: 1,
		}

		const session = await createAndStartSession()

		const checkNewRoelsCountResult = await selectDataFromMongoDB<RbacRole>(checkNewRoelsCountWhere, checkNewRoelsCountSelect, rbacRoleSchemaInstance, rbacRoleCollectionName, { session })

		if (!checkNewRoelsCountResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、APIパスの確認に失敗しました')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、APIパスの確認に失敗しました' }
		}

		if (checkNewRoelsCountResult.result.length !== uniqueNewRoels.length) {
			await abortAndEndSession(session)
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、ロールの確認に失敗しました。存在しないロールをユーザーにバインドしようとした可能性があります')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、ロールの確認に失敗しました。存在しないロールをユーザーにバインドしようとした可能性があります' }
		}

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const updateApiPathPermissions4RoleWhere: QueryType<UserAuth> = {
			UUID: uuid,
		}
		
		const now = new Date().getTime()
		const updateApiPathPermissions4RoleData: UpdateType<UserAuth> = {
			roles: uniqueNewRoels as UserAuth['roles'], // TODO: Mongoose issue: #12420
			editDateTime: now,
		}

		const updateRoles4UserResult = await findOneAndUpdateData4MongoDB<UserAuth>(updateApiPathPermissions4RoleWhere, updateApiPathPermissions4RoleData, userAuthSchemaInstance, userAuthCollectionName)

		if (!updateRoles4UserResult.success) {
			await abortAndEndSession(session)
			console.error('ERROR', '管理者によるユーザーロールの更新に失敗しました、更新に失敗しました')
			return { success: false, message: '管理者によるユーザーロールの更新に失敗しました、更新に失敗しました' }
		}

		return { success: true, message: '管理者によるユーザーロールの更新に成功しました' }
	} catch (error) {
		console.error('ERROR', '管理者によるユーザーロールの更新中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '管理者によるユーザーロールの更新中にエラーが発生しました、不明なエラー' }
	}
}


/**
 * UIDでユーザーのロールを取得する
 * @param adminGetUserRolesByUidRequest UIDでユーザーのロールを取得するリクエストペイロード
 * @param adminUuid 管理者のUUID
 * @param adminToken 管理者のトークン
 * @returns UIDでユーザーのロールを取得するリクエストレスポンス
 */
export const adminGetUserRolesByUidService = async (adminGetUserRolesByUidRequest: AdminGetUserRolesByUidRequestDto, adminUuid: string, adminToken: string): Promise<AdminGetUserRolesByUidResponseDto> => {
	try {
		if (!checkAdminGetUserRolesByUidRequest(adminGetUserRolesByUidRequest)) {
			console.error('ERROR', 'UIDによるユーザーロールの取得に失敗しました、パラメータが不正です')
			return { success: false, message: 'UIDによるユーザーロールの取得に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(adminUuid, adminToken)).success) {
			console.error('ERROR', 'UIDによるユーザーロールの取得に失敗しました、ユーザートークンの検証に失敗しました')
			return { success: false, message: 'UIDによるユーザーロールの取得に失敗しました、ユーザートークンの検証に失敗しました' }
		}

		const { uid } = adminGetUserRolesByUidRequest

		const adminGetUserRolesPipeline: PipelineStage[] = [
			{
				$match: {
					uid,
				}
			},
			{
				$lookup: {
					from: "rbac-roles",
					localField: "roles",
					foreignField: "roleName",
					as: "userRole"
				}
			},
			{
				$lookup: {
					from: "user-infos",
					localField: "UUID",
					foreignField: "UUID",
					as: "userInfo"
				}
			},
			{
				$unwind: '$userInfo',
			},
			{
				$project: {
					uid: 1,
					uuid: '$UUID',
					username: '$userInfo.username',
					userNickname: '$userInfo.userNickname',
					avatar: '$userInfo.avatar',
					roles: '$userRole',
				}
			},
		]

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const { schemaInstance: userInfoSchemaInstance } = UserInfoSchema
		type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>

		const { schemaInstance: rbacRoleSchemaInstance } = RbacRoleSchema
		type RbacRole = InferSchemaType<typeof rbacRoleSchemaInstance>
		

		const adminGerUserRolesResult = await selectDataByAggregateFromMongoDB<{
			uid: UserAuth['uid'];
			uuid: UserAuth['UUID'];
			username: UserInfo['username'];
			userNickname: UserInfo['userNickname'];
			avatar: UserInfo['avatar'];
			roles: RbacRole[];
		}>(userAuthSchemaInstance, userAuthCollectionName, adminGetUserRolesPipeline)
		const adminGerUserRolesData = adminGerUserRolesResult.result?.[0]

		if (!adminGerUserRolesResult.success || !adminGerUserRolesData) {
			console.error('ERROR', 'UIDによるユーザーロールの取得に失敗しました、データクエリに失敗しました')
			return { success: false, message: 'UIDによるユーザーロールの取得に失敗しました、データクエリに失敗しました' }
		}

		return { success: true, message: 'UIDによるユーザーロールの取得に成功しました', result: adminGerUserRolesData }
	} catch (error) {
		console.error('ERROR', 'UIDによるユーザーロールの取得中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'UIDによるユーザーロールの取得中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * RBAC APIパス作成リクエストのペイロードを検証する
 * @param createRbacApiPathRequest RBAC APIパス作成のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateRbacApiPathRequest = (createRbacApiPathRequest: CreateRbacApiPathRequestDto): boolean => {
	return (
		!!createRbacApiPathRequest.apiPath
		&& createRbacApiPathRequest.apiPathColor ? /^#([0-9A-Fa-f]{8})$/.test(createRbacApiPathRequest.apiPathColor) : true // apiPathColorが空でない場合は、8桁のHAXカラーコード形式（例：#66CCFFFF）に一致するかどうかをテストし、空の場合は直接true
	)
}

/**
 * RBAC APIパス削除リクエストのペイロードを検証する
 * @param deleteRbacApiPathRequest RBAC APIパス削除のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkDeleteRbacApiPathRequest = (deleteRbacApiPathRequest: DeleteRbacApiPathRequestDto): boolean => {
	return ( !!deleteRbacApiPathRequest.apiPath )
}


/**
 * RBAC APIパス取得リクエストのペイロードを検証する
 * @param getRbacApiPathRequest RBAC APIパス取得のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetRbacApiPathRequest = (getRbacApiPathRequest: GetRbacApiPathRequestDto): boolean => {
	return true // 検証するものは特にない
}

/**
 * RBACロール作成リクエストのペイロードを検証する
 * @param createRbacApiPathRequest RBACロール作成のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateRbacRoleRequest = (createRbacRoleRequest: CreateRbacRoleRequestDto): boolean => {
	return (
		!!createRbacRoleRequest.roleName
		&& createRbacRoleRequest.roleColor ? /^#([0-9A-Fa-f]{8})$/.test(createRbacRoleRequest.roleColor) : true // roleColorが空でない場合は、8桁のHAXカラーコード形式（例：#66CCFFFF）に一致するかどうかをテストし、空の場合は直接true
	)
}

/**
 * RBACロール削除リクエストのペイロードを検証する
 * @param createRbacApiPathRequest RBACロール削除のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkDeleteRbacRoleRequest = (deleteRbacRoleRequest: DeleteRbacRoleRequestDto): boolean => {
	return ( !!deleteRbacRoleRequest.roleName )
}

/**
 * RBACロール取得リクエストのペイロードを確認する
 * @param getRbacRoleRequest RBACロール取得のリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetRbacRoleRequest = (getRbacRoleRequest: GetRbacRoleRequestDto): boolean => {
	return true // 確認するものは特にない
}

/**
 * ロールにAPIパス権限を更新するリクエストペイロードを検証する
 * @param updateApiPathPermissionsForRoleRequest ロールにAPIパス権限を更新するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkUpdateApiPathPermissionsForRoleRequest = (updateApiPathPermissionsForRoleRequest: UpdateApiPathPermissionsForRoleRequestDto): boolean => {
	return (
		!!updateApiPathPermissionsForRoleRequest.roleName
		&& !!updateApiPathPermissionsForRoleRequest.apiPathPermissions && Array.isArray(updateApiPathPermissionsForRoleRequest.apiPathPermissions)
		&& updateApiPathPermissionsForRoleRequest.apiPathPermissions.every(apiPath => !!apiPath)
	)
}

/**
 * 管理者がユーザーのロールを更新するリクエストペイロードを検証する
 * @param adminUpdateUserRoleRequest 管理者がユーザーのロールを更新するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAdminUpdateUserRoleRequest = (adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto): boolean => {
	return (
		(!!adminUpdateUserRoleRequest.uuid || (adminUpdateUserRoleRequest.uid !== undefined && adminUpdateUserRoleRequest !== null)) // uuidとuidの少なくとも一方が空でない
		&& !!adminUpdateUserRoleRequest.newRoles && Array.isArray(adminUpdateUserRoleRequest.newRoles)
		&& adminUpdateUserRoleRequest.newRoles.every(role => !!role)
	)
}

/**
 * UIDでユーザーのロールを取得する
 * @param adminGetUserRolesByUidRequest UIDでユーザーのロールを取得するリクエストペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAdminGetUserRolesByUidRequest = (adminGetUserRolesByUidRequest: AdminGetUserRolesByUidRequestDto): boolean => {
	return ( adminGetUserRolesByUidRequest.uid !== undefined && adminGetUserRolesByUidRequest.uid !== null )
}
