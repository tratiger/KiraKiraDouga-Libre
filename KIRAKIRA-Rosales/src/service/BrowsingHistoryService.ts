import { InferSchemaType, PipelineStage } from 'mongoose'
import { CreateOrUpdateBrowsingHistoryRequestDto, CreateOrUpdateBrowsingHistoryResponseDto, GetUserBrowsingHistoryWithFilterRequestDto, GetUserBrowsingHistoryWithFilterResponseDto } from '../controller/BrowsingHistoryControllerDto.js'
import { selectDataByAggregateFromMongoDB, findOneAndUpdateData4MongoDB } from '../dbPool/DbClusterPool.js'
import { QueryType } from '../dbPool/DbClusterPoolTypes.js'
import { BrowsingHistorySchema } from '../dbPool/schema/BrowsingHistorySchema.js'
import { checkUserTokenByUuidService, checkUserTokenService, getUserUid } from './UserService.js'

/**
 * ユーザーの閲覧履歴を更新または作成する
 * @param createBrowsingHistoryRequest ユーザーの閲覧履歴の更新または作成リクエストペイロード
 * @param uid ユーザーID
 * @param token ユーザーセキュリティトークン
 * @returns ユーザーの閲覧履歴の更新または作成レスポンス結果
 */
export const createOrUpdateBrowsingHistoryService = async (createOrUpdateBrowsingHistoryRequest: CreateOrUpdateBrowsingHistoryRequestDto, cookieUuid: string, token: string): Promise<CreateOrUpdateBrowsingHistoryResponseDto> => {
	try {
		const { uuid, category, id, anchor } = createOrUpdateBrowsingHistoryRequest
		const nowDate = new Date().getTime()

		if (!checkCreateOrUpdateBrowsingHistoryRequest(createOrUpdateBrowsingHistoryRequest)) {
			console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、パラメータが不正です')
			return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、パラメータが不正です' }
		}

		if (uuid !== cookieUuid) {
			console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、履歴を更新する対象ユーザーが現在のログインユーザーと一致しません。他のユーザーの履歴を更新することは許可されていません！')
			return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、履歴を更新する対象ユーザーが現在のログインユーザーと一致しません。他のユーザーの履歴を更新することは許可されていません！' }
		}

		if (!(await checkUserTokenByUuidService(cookieUuid, token)).success) {
			console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、ユーザーの検証に失敗しました')
			return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、ユーザーの検証に失敗しました' }
		}

		const uid = await getUserUid(uuid) 
		if (uid === undefined || typeof uid !== 'number' || uid <= 0) {
			console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、UIDが存在しません', { uuid })
			return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、UIDが存在しません' }
		}

		const { collectionName, schemaInstance } = BrowsingHistorySchema
		type BrowsingHistoryType = InferSchemaType<typeof schemaInstance>

		// データを検索
		const BrowsingHistoryWhere: QueryType<BrowsingHistoryType> = {
			UUID: uuid,
			uid,
			category,
			id,
		}

		// MongoDBにアップロードするデータを準備
		const BrowsingHistoryData: BrowsingHistoryType = {
			UUID: uuid,
			uid,
			category,
			id,
			anchor,
			lastUpdateDateTime: nowDate,
			editDateTime: nowDate,
		}

		try {
			const insert2MongoDResult = await findOneAndUpdateData4MongoDB(BrowsingHistoryWhere, BrowsingHistoryData, schemaInstance, collectionName)
			const result = insert2MongoDResult.result
			if (insert2MongoDResult.success && result) {
				return { success: true, message: 'ユーザーの閲覧履歴の更新または作成に成功しました', result: result as CreateOrUpdateBrowsingHistoryResponseDto['result'] }
			}
		} catch (error) {
			console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、データの挿入中にエラーが発生しました')
			return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、データの挿入中にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、原因不明：', error)
		return { success: false, message: 'ユーザーの閲覧履歴の更新または作成中にエラーが発生しました、原因不明' }
	}
}

/**
 * 全てまたはフィルタリングされたユーザーの閲覧履歴を取得し、特定のコンテンツへの最終アクセス時間で降順にソートする
 * @param getUserBrowsingHistoryWithFilterRequest ユーザーの閲覧履歴取得リクエストペイロード
 * @param uid ユーザーID
 * @param token ユーザーセキュリティトークン
 * @returns ユーザーの閲覧履歴取得リクエストレスポンス、全てまたはフィルタリングされたユーザーの閲覧履歴
 */
export const getUserBrowsingHistoryWithFilterService = async (getUserBrowsingHistoryWithFilterRequest: GetUserBrowsingHistoryWithFilterRequestDto, uid: number, token: string): Promise<GetUserBrowsingHistoryWithFilterResponseDto> => {
	try {
		if (checkGetUserBrowsingHistoryWithFilterRequest(getUserBrowsingHistoryWithFilterRequest)) {
			if ((await checkUserTokenService(uid, token)).success) {
				const { collectionName, schemaInstance } = BrowsingHistorySchema

				// TODO: 以下のAggregateは動画履歴の検索にのみ適用されます
				const videoHistoryAggregateProps: PipelineStage[] = [
					{
						$match: {
							category: 'video',
							uid,
						},
					},
					{
						$addFields: {
							id_number: { $toInt: '$id' }, // video_idを文字列から数値に変換
						},
					},
					{
						$lookup: {
							from: 'videos',
							localField: 'id_number',
							foreignField: 'videoId',
							as: 'video_info',
						},
					},
					{
						$unwind: '$video_info',
					},
					{
						$match: {
							'video_info.title': { $regex: getUserBrowsingHistoryWithFilterRequest.videoTitle ?? '', $options: 'i' }, // 正規表現を使用してあいまい検索、大文字小文字を区別しない
						},
					},
					{
						$lookup: {
							from: 'user-infos',
							localField: 'video_info.uploaderId', // 動画テーブルにauthor_idフィールドがあると仮定
							foreignField: 'uid',
							as: 'uploader_info',
						},
					},
					{
						$unwind: '$uploader_info',
					},
					{
						$sort: {
							lastUpdateDateTime: -1, // lastUpdateDateTimeで降順ソート
						},
					},
					{
						$project: {
							uid: 1,
							category: 1,
							id: '$id_number',
							anchor: 1,
							videoId: '$video_info.videoId',
							title: '$video_info.title',
							image: '$video_info.image',
							uploadDate: '$video_info.uploadDate',
							watchedCount: '$video_info.watchedCount',
							uploader: '$uploader_info.username',
							uploaderId: '$uploader_info.uid',
							duration: '$video_info.duration',
							description: '$video_info.description',
							lastUpdateDateTime: '$lastUpdateDateTime',
						},
					},
				]

				try {
					const result = await selectDataByAggregateFromMongoDB(schemaInstance, collectionName, videoHistoryAggregateProps)
					const browsingHistory = result.result
					if (result.success && browsingHistory) {
						if (browsingHistory.length > 0) {
							return { success: true, message: 'ユーザーの閲覧履歴の取得に成功しました', result: browsingHistory }
						} else {
							return { success: true, message: 'ユーザーの閲覧履歴は空です', result: [] }
						}
					} else {
						console.error('ERROR', 'ユーザーの閲覧履歴取得中にエラーが発生しました、データが取得できませんでした')
						return { success: false, message: 'ユーザーの閲覧履歴取得中にエラーが発生しました、データが取得できませんでした' }
					}
				} catch (error) {
					console.error('ERROR', 'ユーザーの閲覧履歴取得中にエラーが発生しました、ユーザーの閲覧履歴データの取得に失敗しました')
					return { success: false, message: 'ユーザーの閲覧履歴取得中にエラーが発生しました、ユーザーの閲覧履歴データの取得に失敗しました' }
				}
			} else {
				console.error('ERROR', 'ユーザーの閲覧履歴取得中にエラーが発生しました、ユーザーの検証に失敗しました')
				return { success: false, message: 'ユーザーの閲覧履歴取得中にエラーが発生しました、ユーザーの検証に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーの閲覧履歴取得中にエラーが発生しました、リクエストパラメータが不正です')
			return { success: false, message: 'ユーザーの閲覧履歴取得中にエラーが発生しました、リクエストパラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーの閲覧履歴取得中にエラーが発生しました、原因不明：', error)
		return { success: false, message: 'ユーザーの閲覧履歴取得中にエラーが発生しました、原因不明' }
	}
}

/**
 * ユーザーの閲覧履歴作成リクエストのパラメータを検証する
 * @param createBrowsingHistoryRequest ユーザーの閲覧履歴作成リクエストのパラメータ
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateOrUpdateBrowsingHistoryRequest = (createOrUpdateBrowsingHistoryRequest: CreateOrUpdateBrowsingHistoryRequestDto): boolean => {
	return (
		!! createOrUpdateBrowsingHistoryRequest.uuid
		&& (createOrUpdateBrowsingHistoryRequest.category === 'video' || createOrUpdateBrowsingHistoryRequest.category === 'photo' || createOrUpdateBrowsingHistoryRequest.category === 'comment')
		&& !!createOrUpdateBrowsingHistoryRequest.id
	)
}

/**
 * ユーザーの閲覧履歴取得リクエストのペイロードを検証する
 * @param getUserBrowsingHistoryWithFilterRequest ユーザーの閲覧履歴取得リクエストのペイロード
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetUserBrowsingHistoryWithFilterRequest = (getUserBrowsingHistoryWithFilterRequest: GetUserBrowsingHistoryWithFilterRequestDto): boolean => {
	if (getUserBrowsingHistoryWithFilterRequest.videoTitle && getUserBrowsingHistoryWithFilterRequest.videoTitle.length > 200) { // 動画タイトルのフィルタリングフィールドが存在し、かつ長さが200を超える場合は不正とみなす
		return false
	} else {
		return true
	}
}
