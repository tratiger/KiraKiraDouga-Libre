import { InferSchemaType, PipelineStage } from 'mongoose'
import { EmitDanmakuRequestDto, EmitDanmakuResponseDto, GetDanmakuByKvidDto, GetDanmakuByKvidRequestDto, GetDanmakuByKvidResponseDto } from '../controller/DanmakuControllerDto.js'
import { insertData2MongoDB, selectDataByAggregateFromMongoDB, selectDataFromMongoDB } from '../dbPool/DbClusterPool.js'
import { QueryType, SelectType } from '../dbPool/DbClusterPoolTypes.js'
import { DanmakuSchema } from '../dbPool/schema/DanmakuSchema.js'
import { checkUserTokenByUuidService, checkUserTokenService, getUserUid, getUserUuid } from './UserService.js'
import { buildBlockListMongooseFilter, checkIsBlockedByOtherUserService } from './BlockService.js'
import { checkVideoBlockedByKvidService, getVideoByKvidService } from './VideoService.js'

/**
 * ユーザーが弾幕を送信する
 * @param emitDanmakuRequest ユーザーが送信した弾幕データ
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーが弾幕を送信した結果
 */
export const emitDanmakuService = async (emitDanmakuRequest: EmitDanmakuRequestDto, uuid: string, token: string): Promise<EmitDanmakuResponseDto> => {
	try {
		if (!checkEmitDanmakuRequest(emitDanmakuRequest)) {
			console.error('ERROR', '弾幕の送信に失敗しました、弾幕データの検証に失敗しました：', { emitDanmakuRequest, uuid, token })
			return { success: false, message: '弾幕の送信に失敗しました、弾幕データが不正です' }
		}

		const { videoId } = emitDanmakuRequest
		const uid = await getUserUid(uuid)
		if (!uid) {
			console.error('ERROR', '弾幕の送信に失敗しました、ユーザーIDが存在しません', { emitDanmakuRequest, uuid, token })
			return { success: false, message: '弾幕の送信に失敗しました、ユーザーIDが存在しません' }
		}
		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', '弾幕の送信に失敗しました、ユーザーの検証に失敗しました', { emitDanmakuRequest, uuid, token })
			return { success: false, message: '弾幕の送信に失敗しました、ユーザーの検証に失敗しました' }
		}

		// 動画がブロックされているか確認
		const selectorUuid = uuid
		const selectorToken = token
		const checkVideoBlockedResult = await checkVideoBlockedByKvidService(videoId, selectorUuid, selectorToken)
		if (!checkVideoBlockedResult.success) {
			console.error('ERROR', '弾幕の送信に失敗しました、動画がブロックされているかの確認に失敗しました', { uid, token })
			return { success: false, message: '弾幕の送信に失敗しました、動画がブロックされているかの確認に失敗しました' }
		}

		if (checkVideoBlockedResult.isBlockedByOther) {
			console.error('ERROR', '弾幕の送信に失敗しました、他のユーザーによってブロックされています', { uid, token })
			return { success: false, message: '弾幕の送信に失敗しました、他のユーザーによってブロックされています' }
		}
		if (checkVideoBlockedResult.isBlocked) {
			console.error('ERROR', '弾幕の送信に失敗しました、アップローダーをブロックしています', { uid, token })
			return { success: false, message: '弾幕の送信に失敗しました、アップローダーをブロックしています' }
		}

		const { collectionName, schemaInstance } = DanmakuSchema
		type Danmaku = InferSchemaType<typeof schemaInstance>
		const nowDate = new Date().getTime()
		const danmaku: Danmaku = {
			UUID: uuid,
			uid,
			...emitDanmakuRequest,
			editDateTime: nowDate,
		}
		try {
			const insertData2MongoDBResult = await insertData2MongoDB(danmaku, schemaInstance, collectionName)
			if (insertData2MongoDBResult && insertData2MongoDBResult.success) {
				return { success: true, message: '弾幕の送信に成功しました！', danmaku: emitDanmakuRequest }
			}
		} catch (error) {
			console.error('ERROR', '弾幕の送信に失敗しました、MongoDBに保存できませんでした', error)
			return { success: false, message: '弾幕の送信に失敗しました、弾幕データの保存に失敗しました' }
		}

	} catch (error) {
		console.error('ERROR', '弾幕の送信に失敗しました、エラー情報：', error, { emitDanmakuRequest, uuid, token })
		return { success: false, message: '弾幕の送信に失敗しました、原因不明' }
	}
}

/**
 * kvidに基づいて動画の弾幕リストを取得する
 * @param getDanmakuByKvidRequest 弾幕リストをリクエストするクエリパラメータ
 * @returns 動画の弾幕リスト
 */
export const getDanmakuListByKvidService = async (getDanmakuByKvidRequest: GetDanmakuByKvidRequestDto, uuid?: string, token?: string): Promise<GetDanmakuByKvidResponseDto> => {
	try {
		if (!checkGetDanmakuByKvidRequest(getDanmakuByKvidRequest)) {
			console.error('ERROR', '弾幕リストの取得に失敗しました、データ検証に失敗しました', getDanmakuByKvidRequest)
			return { success: false, message: '弾幕リストの取得に失敗しました、データ検証に失敗しました' }
		}

		const { videoId } = getDanmakuByKvidRequest
		const { collectionName, schemaInstance } = DanmakuSchema
		type Danmaku = InferSchemaType<typeof schemaInstance>

		try {
			const blockListFilter = await buildBlockListMongooseFilter(
				[
					{
						attr: 'UUID',
						category: 'block-uuid',
					},
					{
						attr: 'UUID',
						category: 'hide-uuid',
					},
					{
						attr: 'text',
						category: 'keyword',
					},
					{
						attr: 'text',
						category: 'regex',
					},
				],
				uuid,
				token
			)

			const getDanmakuPipeline: PipelineStage[] = [
				{
					$match: {
						videoId,
					}
				},
				...blockListFilter.filter,
				{
					$sort: {
						editDateTime: 1, // editDateTimeで昇順ソート
					},
				},
				{
					$project: {
						videoId: 1,
						UUID: 1,
						uid: 1,
						time: 1,
						text: 1,
						color: 1,
						fontSize: 1,
						mode: 1,
						enableRainbow: 1,
						editDateTime: 1,
						...blockListFilter.additionalFields, // ブロックリストフィルターの追加フィールド
					}
				}
			]

			const danmakuResult = await selectDataByAggregateFromMongoDB<Danmaku>(schemaInstance, collectionName, getDanmakuPipeline)

			if (!danmakuResult.success) {
				console.error('ERROR', '弾幕リストの取得に失敗しました、クエリ失敗または結果が空です：', getDanmakuByKvidRequest)
				return { success: false, message: '弾幕リストの取得に失敗しました、クエリに失敗しました' }
			}

			const danmakuList = danmakuResult.result?.map(danmaku => {
				const fontSize = ['small', 'medium', 'large'].includes(danmaku.fontSize) ? danmaku.fontSize : 'medium'
				return { ...danmaku, uuid: danmaku.UUID, fontSize } as GetDanmakuByKvidDto
			})

			if (danmakuList && danmakuList.length > 0) {
				return { success: true, message: '弾幕リストの取得に成功しました', danmaku: danmakuList }
			} else {
				return { success: true, message: '弾幕リストは空です', danmaku: [] }
			}
		} catch (error) {
			console.error('ERROR', '弾幕リストの取得に失敗しました、クエリに失敗しました：', error, getDanmakuByKvidRequest)
			return { success: false, message: '弾幕リストの取得に失敗しました、クエリに失敗しました' }
		}
	} catch (error) {
		console.error('ERROR', '弾幕リストの取得に失敗しました、エラー情報：', error, getDanmakuByKvidRequest)
		return { success: false, message: '弾幕リストの取得に失敗しました、原因不明' }
	}
}

/**
 * ユーザーが送信した弾幕のリクエストペイロードを検証する
 * @param emitDanmakuRequest ユーザーが送信した弾幕データ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkEmitDanmakuRequest = (emitDanmakuRequest: EmitDanmakuRequestDto): boolean => {
	const hexColorRegex = /^([0-9A-F]{3}([0-9A-F]{1})?|[0-9A-F]{6}([0-9A-F]{2})?)$/i
	if (!emitDanmakuRequest.color || !(hexColorRegex.test(emitDanmakuRequest.color))) {
		console.error('ERROR', '弾幕の送信中にエラーが発生しました、弾幕データが不正です：色が空または形式が間違っています', emitDanmakuRequest)
		return false
	}
	if (emitDanmakuRequest.enableRainbow === undefined || emitDanmakuRequest.enableRainbow === null) {
		console.error('ERROR', '弾幕の送信中にエラーが発生しました、弾幕データが不正です：虹色弾幕を有効にするかどうかが空または形式が間違っています', emitDanmakuRequest)
		return false
	}
	if (!emitDanmakuRequest.fontSize || !(['small', 'medium', 'large'].includes(emitDanmakuRequest.fontSize))) {
		console.error('ERROR', '弾幕の送信中にエラーが発生しました、弾幕データが不正です：フォントサイズが空または形式が間違っています', emitDanmakuRequest)
		return false
	}
	if (!emitDanmakuRequest.mode || !(['ltr', 'rtl', 'top', 'bottom'].includes(emitDanmakuRequest.mode))) {
		console.error('ERROR', '弾幕の送信中にエラーが発生しました、弾幕データが不正です：弾幕モードが空または形式が間違っています', emitDanmakuRequest)
		return false
	}
	if (!emitDanmakuRequest.text || emitDanmakuRequest.time === undefined || emitDanmakuRequest.time === null || !emitDanmakuRequest.videoId) {
		console.error('ERROR', '弾幕の送信中にエラーが発生しました、弾幕データが不正です：必要なリクエストパラメータが空または形式が間違っています', emitDanmakuRequest)
		return false
	}

	return true
}

/**
 * 弾幕リスト取得リクエストのペイロードを検証する
 * @param getDanmakuByKvidRequest ユーザーが弾幕リストをリクエストするペイロード
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetDanmakuByKvidRequest = (getDanmakuByKvidRequest: GetDanmakuByKvidRequestDto): boolean => {
	// TODO 現在の動画が既存の動画であるかどうかを判断するために、さらに検証を追加する必要があるかもしれません
	return (getDanmakuByKvidRequest.videoId !== undefined && getDanmakuByKvidRequest.videoId !== null)
}
