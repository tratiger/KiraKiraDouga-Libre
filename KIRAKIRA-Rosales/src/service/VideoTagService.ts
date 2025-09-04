import { CreateVideoTagRequestDto, CreateVideoTagResponseDto, GetVideoTagByTagIdRequestDto, GetVideoTagByTagIdResponseDto, SearchVideoTagRequestDto, SearchVideoTagResponseDto } from '../controller/VideoTagControllerDto.js'
import { checkUserTokenService } from './UserService.js'
import { getNextSequenceValueService } from './SequenceValueService.js'
import { VideoTagSchema } from '../dbPool/schema/VideoTagSchema.js'
import { InferSchemaType } from 'mongoose'
import { insertData2MongoDB, selectDataFromMongoDB } from '../dbPool/DbClusterPool.js'
import { QueryType, SelectType } from '../dbPool/DbClusterPoolTypes.js'

/**
 * 動画タグを作成
 * @param createVideoTagRequest 動画タグ作成のリクエストペイロード、つまりタグデータ
 * @param uid ユーザーID
 * @param token ユーザーセキュリティトークン
 * @returns 動画タグ作成のレスポンス結果
 */
export const createVideoTagService = async (createVideoTagRequest: CreateVideoTagRequestDto, uid: number, token: string): Promise<CreateVideoTagResponseDto> => {
	try {
		if (checkCreateVideoTagRequest(createVideoTagRequest)) {
			if ((await checkUserTokenService(uid, token)).success) {
				try {
					const { collectionName, schemaInstance } = VideoTagSchema
					type videoTagListType = InferSchemaType<typeof schemaInstance>

					const videoTagIdNextSequenceValueResult = await getNextSequenceValueService('video-tag', 1)
					const tagId = videoTagIdNextSequenceValueResult.sequenceValue
					const nowDate = new Date().getTime()
					const tagNameList = createVideoTagRequest.tagNameList

					if (tagId !== undefined && tagId !== null) {
						// MongoDBにアップロードするデータを準備
						const videoTagListData: videoTagListType = {
							tagId,
							tagNameList: tagNameList as videoTagListType['tagNameList'], // TODO: Mongoose issue: #12420
							editDateTime: nowDate,
						}
						const insert2MongoDBResult = await insertData2MongoDB(videoTagListData, schemaInstance, collectionName)
						if (insert2MongoDBResult?.success) {
							return { success: true, message: '動画TAGの作成に成功しました', result: { tagId, tagNameList } }
						} else {
							console.error('ERROR', '動画TAGの作成時にエラーが発生しました、MongoDBへのTAGデータの挿入に失敗しました')
							return { success: false, message: '動画TAGの作成時にエラーが発生しました、データ挿入に失敗しました' }
						}
					} else {
						console.error('ERROR', '動画TAGの作成時にエラーが発生しました、取得したTAGの自動インクリメント番号が空です')
						return { success: false, message: '動画TAGの作成時にエラーが発生しました、生成されたTAG番号が空です' }
					}
				} catch (error) {
					console.error('ERROR', '動画TAGの作成時にエラーが発生しました、TAGの自動インクリメント番号の取得中にエラーが発生しました')
					return { success: false, message: '動画TAGの作成時にエラーが発生しました、TAG番号の取得中にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', '動画TAGの作成時にエラーが発生しました、不正なユーザーです')
				return { success: false, message: '動画TAGの作成時にエラーが発生しました、ユーザーがログインしていないか、検証に失敗しました' }
			}
		} else {
			console.error('ERROR', '動画TAGの作成時にエラーが発生しました、リクエストパラメータが正しくありません')
			return { success: false, message: '動画TAGの作成時にエラーが発生しました、リクエストパラメータが正しくありません' }
		}
	} catch (error) {
		console.error('ERROR', '動画TAGの作成時にエラーが発生しました、原因不明：', error)
		return { success: false, message: '動画TAGの作成時にエラーが発生しました、原因不明' }
	}
}

/**
 * データベースで動画TAGをあいまい検索
 * @param searchVideoTagRequest データベースで動画TAGを検索するリクエストレスポンス
 * @returns 検索された動画TAGのリスト
 */
export const searchVideoTagService = async (searchVideoTagRequest: SearchVideoTagRequestDto): Promise<SearchVideoTagResponseDto> => {
	try {
		if (checkSearchVideoTagRequest(searchVideoTagRequest)) {
			const { collectionName, schemaInstance } = VideoTagSchema
			type VideoTag = InferSchemaType<typeof schemaInstance>

			const regex = new RegExp(searchVideoTagRequest.tagNameSearchKey, 'i') // 大文字と小文字を区別しない
			const where: QueryType<VideoTag> = {
				'tagNameList.tagName.name': { $regex: regex },
			}
			const select: SelectType<VideoTag> = {
				tagId: 1,
				tagNameList: 1,
			}

			try {
				const searchVideoTagResult = await selectDataFromMongoDB<VideoTag>(where, select, schemaInstance, collectionName)
				const result = searchVideoTagResult?.result as unknown as SearchVideoTagResponseDto['result']
				if (searchVideoTagResult.success) {
					if (result?.length > 0) {
						return { success: true, message: '動画TAGの検索に成功しました', result }
					} else {
						return { success: true, message: '動画TAGの検索結果が空です', result: [] }
					}
				} else {
					console.error('ERROR', '動画TAGの検索中にエラーが発生しました、MongoDBでのデータクエリに失敗しました')
					return { success: false, message: '動画TAGの検索に失敗しました、クエリに失敗しました' }
				}
			} catch (error) {
				console.error('ERROR', '動画TAGの検索中にエラーが発生しました、MongoDBでのデータクエリ中にエラーが発生しました：', error)
				return { success: false, message: '動画TAGの検索中にエラーが発生しました、データクエリ中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', '動画TAGの検索中にエラーが発生しました、パラメータが不正です')
			return { success: false, message: '動画TAGの検索中にエラーが発生しました、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '動画TAGの検索中にエラーが発生しました、原因不明：', error)
		return { success: false, message: '動画TAGの検索中にエラーが発生しました、原因不明' }
	}
}

/**
 * TAG IDに基づいてデータベース内の動画TAGを照合するリクエストパラメータ
 * @param getVideoTagByTagIdRequest TAG IDに基づいてデータベース内の動画TAGを照合する
 * @returns TAG IDに基づいてデータベース内の動画TAGを照合するリクエストレスポンス
 */
export const getVideoTagByTagIdService = async (getVideoTagByTagIdRequest: GetVideoTagByTagIdRequestDto): Promise<GetVideoTagByTagIdResponseDto> => {
	try {
		if (checkGetVideoTagByTagIdRequest(getVideoTagByTagIdRequest)) {
			const { collectionName, schemaInstance } = VideoTagSchema
			type VideoTag = InferSchemaType<typeof schemaInstance>

			const where: QueryType<VideoTag> = {
				tagId: { $in: getVideoTagByTagIdRequest.tagId },
			}
			const select: SelectType<VideoTag> = {
				tagId: 1,
				tagNameList: 1,
			}

			try {
				const searchVideoTagResult = await selectDataFromMongoDB<VideoTag>(where, select, schemaInstance, collectionName)
				const result = searchVideoTagResult?.result as unknown as SearchVideoTagResponseDto['result']
				if (searchVideoTagResult.success) {
					if (result?.length > 0) {
						return { success: true, message: '動画TAGの取得に成功しました', result }
					} else {
						return { success: true, message: '動画TAGの取得結果が空です', result: [] }
					}
				} else {
					console.error('ERROR', '動画TAGの取得中にエラーが発生しました、MongoDBでのデータクエリに失敗しました')
					return { success: false, message: '動画TAGの取得に失敗しました、クエリに失敗しました' }
				}
			} catch (error) {
				console.error('ERROR', '動画TAGの取得中にエラーが発生しました、MongoDBでのデータクエリ中にエラーが発生しました：', error)
				return { success: false, message: '動画TAGの取得中にエラーが発生しました、データクエリ中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', '動画TAGの取得中にエラーが発生しました、パラメータが不正です')
			return { success: false, message: '動画TAGの取得中にエラーが発生しました、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '動画TAGの取得中にエラーが発生しました、原因不明：', error)
		return { success: false, message: '動画TAGの取得中にエラーが発生しました、原因不明' }
	}
}

/**
 * 動画TAG作成リクエストが有効かどうかを検証する
 * @param createVideoTagRequest 動画TAG作成リクエスト
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCreateVideoTagRequest = (createVideoTagRequest: CreateVideoTagRequestDto): boolean => {
	const isAllTagItemNotNull = createVideoTagRequest?.tagNameList?.every(tag => tag && tag.lang && tag.tagName?.length > 0 && tag.tagName.every(tagName => !!tagName.name))
	return (
		createVideoTagRequest && createVideoTagRequest?.tagNameList?.length > 0
		&& isAllTagItemNotNull
	)
}

/**
 * TAG検索リクエストのパラメータが有効かどうかを検証する
 * @param searchVideoTagRequest TAG検索リクエストのパラメータ
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkSearchVideoTagRequest = (searchVideoTagRequest: SearchVideoTagRequestDto): boolean => {
	return !!searchVideoTagRequest.tagNameSearchKey
}

/**
 * TAG IDに基づいてデータベース内の動画TAGを照合するリクエストパラメータが有効かどうかを確認する
 * @param getVideoTagByTagIdRequest TAG IDに基づいてデータベース内の動画TAGを照合するリクエストパラメータ
 * @returns 有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetVideoTagByTagIdRequest = (getVideoTagByTagIdRequest: GetVideoTagByTagIdRequestDto): boolean => {
	return !!getVideoTagByTagIdRequest && getVideoTagByTagIdRequest.tagId && getVideoTagByTagIdRequest.tagId.length > 0
}
