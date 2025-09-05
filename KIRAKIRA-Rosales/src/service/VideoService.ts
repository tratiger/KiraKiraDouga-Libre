import { Client } from '@elastic/elasticsearch'
import mongoose, { InferSchemaType, PipelineStage } from 'mongoose'
import { createCloudflareImageUploadSignedUrl } from '../cloudflare/index.js'
import { isEmptyObject } from '../common/ObjectTool.js'
import { generateSecureRandomString } from '../common/RandomTool.js'
import { CreateOrUpdateBrowsingHistoryRequestDto } from '../controller/BrowsingHistoryControllerDto.js'
import { ApprovePendingReviewVideoRequestDto, ApprovePendingReviewVideoResponseDto, CheckVideoBlockedByKvidResponseDto, CheckVideoExistRequestDto, CheckVideoExistResponseDto, DeleteVideoRequestDto, DeleteVideoResponseDto, GetVideoByKvidRequestDto, GetVideoByKvidResponseDto, GetVideoByUidRequestDto, GetVideoByUidResponseDto, GetVideoCoverUploadSignedUrlResponseDto, GetVideoFileTusEndpointRequestDto, PendingReviewVideoResponseDto, SearchVideoByKeywordRequestDto, SearchVideoByKeywordResponseDto, SearchVideoByVideoTagIdRequestDto, SearchVideoByVideoTagIdResponseDto, ThumbVideoResponseDto, UploadVideoRequestDto, UploadVideoResponseDto, VideoPartDto } from '../controller/VideoControllerDto.js'
import { DbPoolOptions, deleteDataFromMongoDB, findOneAndUpdateData4MongoDB, insertData2MongoDB, selectDataByAggregateFromMongoDB, selectDataFromMongoDB } from '../dbPool/DbClusterPool.js'
import { OrderByType, QueryType, SelectType, UpdateType } from '../dbPool/DbClusterPoolTypes.js'
import { UserInfoSchema } from '../dbPool/schema/UserSchema.js'
import { RemovedVideoSchema, VideoSchema } from '../dbPool/schema/VideoSchema.js'
import { deleteDataFromElasticsearchCluster, insertData2ElasticsearchCluster, searchDataFromElasticsearchCluster } from '../elasticsearchPool/ElasticsearchClusterPool.js'
import { EsSchema2TsType } from '../elasticsearchPool/ElasticsearchClusterPoolTypes.js'
import { VideoDocument } from '../elasticsearchPool/template/VideoDocument.js'
import { createOrUpdateBrowsingHistoryService } from './BrowsingHistoryService.js'
import { getNextSequenceValueEjectService } from './SequenceValueService.js'
import { checkUserTokenByUuidService, checkUserTokenService, getUserUid, getUserUuid } from './UserService.js'
import { FollowingSchema } from '../dbPool/schema/FeedSchema.js'
import { buildBlockListMongooseFilter, checkBlockUserService, checkIsBlockedByOtherUserService } from './BlockService.js'
import { S3Client, CreateMultipartUploadCommand, PutObjectCommand } from '@aws-sdk/client-s3';  
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';  

/**
 * 動画を更新
 * @param uploadVideoRequest 動画アップロードリクエストのペイロード
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @param esClient Elasticsearchクライアント接続
 * @returns 動画アップロードの結果
 */
export const updateVideoService = async (uploadVideoRequest: UploadVideoRequestDto, uid: number, token: string, esClient?: Client): Promise<UploadVideoResponseDto> => {
	try {
		if (checkUploadVideoRequest(uploadVideoRequest) && esClient && !isEmptyObject(esClient)) {
			if (!(await checkUserTokenService(uid, token)).success) {
				console.error('ERROR', '動画のアップロードに失敗しました、ユーザー検証に失敗しました')
				return { success: false, message: '動画のアップロードに失敗しました、ユーザー検証に失敗しました' }
			}
			if (uploadVideoRequest.uploaderId !== uid) {
				console.error('ERROR', '動画のアップロードに失敗しました、UIDがcookieと一致しません')
				return { success: false, message: '動画のアップロードに失敗しました、アカウントが一致しません' }
			}

			const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
			if (!UUID) {
				console.error('ERROR', '動画のアップロードに失敗しました、UUIDが存在しません', { uid })
				return { success: false, message: '動画のアップロードに失敗しました、UUIDが存在しません' }
			}

			const session = await mongoose.startSession()
			session.startTransaction()
			const __VIDEO_SEQUENCE_EJECT__ = [9, 42, 233, 404, 2233, 10388, 10492, 114514] // KVID生成時にスキップする数字
			const videoIdNextSequenceValueResult = await getNextSequenceValueEjectService('video', __VIDEO_SEQUENCE_EJECT__, 1, 1, session)
			const videoId = videoIdNextSequenceValueResult.sequenceValue
			if (videoIdNextSequenceValueResult?.success && videoId !== null && videoId !== undefined) {
				const nowDate = new Date().getTime()
				const title = uploadVideoRequest.title
				const description = uploadVideoRequest.description
				const videoCategory = uploadVideoRequest.videoCategory
				const videoPart = uploadVideoRequest.videoPart.map(video => ({ ...video, editDateTime: nowDate }))
				const videoTagList = uploadVideoRequest.videoTagList.map(tag => ({ ...tag, editDateTime: nowDate }))

				// MongoDBにアップロードするデータを準備
				const { collectionName, schemaInstance } = VideoSchema
				type Video = InferSchemaType<typeof schemaInstance>
				const video: Video = {
					videoId,
					videoPart: videoPart as Video['videoPart'], // TODO: Mongoose issue: #12420
					title,
					image: uploadVideoRequest.image,
					uploadDate: nowDate,
					watchedCount: 0,
					uploaderUUID: UUID,
					uploaderId: uploadVideoRequest.uploaderId,
					duration: uploadVideoRequest.duration,
					description,
					videoCategory,
					copyright: uploadVideoRequest.copyright,
					originalAuthor: uploadVideoRequest.originalAuthor,
					originalLink: uploadVideoRequest.originalLink,
					pushToFeed: uploadVideoRequest.pushToFeed,
					ensureOriginal: uploadVideoRequest.ensureOriginal,
					videoTagList: videoTagList as Video['videoTagList'], // TODO: Mongoose issue: #12420
					pendingReview: true,
					editDateTime: nowDate,
				}

				// Elasticsearchにアップロードするデータを準備
				const { indexName: esIndexName, schema: videoEsSchema } = VideoDocument
				const videoEsData: EsSchema2TsType<typeof videoEsSchema> = {
					title,
					description,
					kvid: videoId,
					videoCategory,
					videoTagList,
				}

				try {
					const insert2MongoDBPromise = insertData2MongoDB(video, schemaInstance, collectionName, { session })
					const refreshFlag = true
					const insert2ElasticsearchPromise = insertData2ElasticsearchCluster(esClient, esIndexName, videoEsSchema, videoEsData, refreshFlag)
					const [insert2MongoDBResult, insert2ElasticsearchResult] = await Promise.all([insert2MongoDBPromise, insert2ElasticsearchPromise])
					if (insert2MongoDBResult.success && insert2ElasticsearchResult.success) {
						await session.commitTransaction()
						session.endSession()
						return { success: true, videoId, message: '動画のアップロードに成功しました' }
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', '動画のアップロードに失敗しました、データをデータベースまたは検索エンジンにインポートできません')
						return { success: false, message: '動画のアップロードに失敗しました、データをデータベースまたは検索エンジンにインポートできません' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', '動画のアップロードに失敗しました、データをデータベースにインポートできません、エラー：', error)
					return { success: false, message: '動画のアップロードに失敗しました、動画情報を記録できません' }
				}
			} else {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', '動画の自動インクリメントIDの取得に失敗しました', uploadVideoRequest)
				return { success: false, message: '動画のアップロードに失敗しました、動画IDの取得に失敗しました' }
			}
		} else {
			console.error('ERROR', `動画アップロード時のフィールド検証に失敗したか、Esクライアントが接続されていません、ユーザーID：${uploadVideoRequest.uploaderId}`)
			return { success: false, message: 'アップロード時に指定されたパラメータが正しくないか、検索エンジンクライアントが接続されていません' }
		}
	} catch (error) {
		console.error('ERROR', '動画のアップロードに失敗しました：', error)
		return { success: false, message: '動画のアップロードに失敗しました' }
	}
}

/**
 * ホームページの動画を取得 // TODO 推薦アルゴリズムを使用すべきであり、最後にアップロードされた100件の動画を取得すべきではない
 * @returns ホームページの動画取得リクエストのレスポンス
 */
export const getThumbVideoService = async (uuid?: string, token?: string): Promise<ThumbVideoResponseDto> => {
	try {
		const blockListFilter = await buildBlockListMongooseFilter(
			[
				{
					attr: 'uploaderUUID',
					category: 'block-uuid',
				},
				{
					attr: 'uploaderUUID',
					category: 'hide-uuid',
				},
				{
					attr: 'videoTagList.tagId',
					category: 'tag-id',
				},
				{
					attr: 'title',
					category: 'keyword',
				},
				{
					attr: 'title',
					category: 'regex',
				}
			],
			uuid,
			token
		)

		const getThumbVideoPipeline: PipelineStage[] = [
			{
				$lookup: {
					from: 'user-infos',
					localField: 'uploaderUUID',
					foreignField: 'UUID',
					as: 'uploader_info',
				},
			},
			...blockListFilter.filter,
			{ $skip: 0 }, // 指定された数のドキュメントをスキップ // TODO: 現在の値はプレースホルダー
			{ $limit: 100 }, // 返されるドキュメントの数を制限 // TODO: 現在の値はプレースホルダー
			{
				$unwind: '$uploader_info',
			},
			{
				$sort: {
					uploadDate: -1, // uploadDateで降順にソート
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
					...blockListFilter.additionalFields, // ブラックリストフィルターの追加フィールド
				},
			},
		]

		try {
			const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
			type ThumbVideo = InferSchemaType<typeof videoSchemaInstance>
			const result = await selectDataByAggregateFromMongoDB<ThumbVideo>(videoSchemaInstance, videoCollectionName, getThumbVideoPipeline)
			const videoResult = result.result

			if (!result.success || !videoResult) {
				console.error('ERROR', '取得した動画配列の長さが0以下です')
				return { success: false, message: 'ホームページの動画取得時に例外が発生しました、動画数が0です', videosCount: 0, videos: [] }
			}
			const videosCount = videoResult.length
			return { success: true, message: 'ホームページの動画取得に成功しました', videosCount, videos: videoResult }
		} catch (error) {
			console.error('ERROR', 'ホームページの動画取得時に例外が発生しました、クエリに失敗しました：', error)
			return { success: false, message: 'ホームページの動画取得時に例外が発生しました', videosCount: 0, videos: [] }
		}

	} catch (error) {
		console.error('ERROR', 'ホームページの動画取得に失敗しました：', error)
		return { success: false, message: 'ホームページの動画取得に失敗しました', videosCount: 0, videos: [] }
	}
}

/**
 * 動画ID（KVID）に基づいて動画が存在するかどうかを確認
 * @param getVideoByKvidRequest 動画ID（KVID）に基づいて動画が存在するかどうかを確認するリクエストペイロード
 * @returns 動画が存在するかどうか
 */
export const checkVideoExistByKvidService = async (checkVideoExistRequestDto: CheckVideoExistRequestDto): Promise<CheckVideoExistResponseDto> => {
	try {
		if (checkGetVideoByKvidRequest(checkVideoExistRequestDto)) {
			const { collectionName, schemaInstance } = VideoSchema
			type Video = InferSchemaType<typeof schemaInstance>
			const where: QueryType<Video> = {
				videoId: checkVideoExistRequestDto.videoId,
			}
			const select: SelectType<Video> = {
				videoId: 1,
			}
			try {
				const result = await selectDataFromMongoDB<Video>(where, select, schemaInstance, collectionName)
				const videoResult = result.result
				if (result.success && videoResult) {
					const videosCount = videoResult?.length
					if (videosCount === 1) {
						return { success: true, message: "動画が存在します", exist: true }
					} else {
						console.error('ERROR', '取得した動画配列の長さが1ではありません')
						return { success: false, message: "動画情報の取得に失敗しました、動画が存在しません", exist: false }
					}
				} else {
					console.error('ERROR', '取得した動画結果または動画配列が空です')
					return { success: false, message: "動画情報の取得に失敗しました、動画が存在しません", exist: false }
				}
			} catch (error) {
				console.error('ERROR', '動画の取得に失敗しました：', error)
				return { success: false, message: "動画情報の取得に失敗しました、動画が存在しません", exist: false }
			}
		} else {
			console.error('ERROR', 'KVIDが空です')
			return { success: false, message: "動画情報の取得に失敗しました、KVIDが空です", exist: false }
		}
	} catch (error) {
		console.error('ERROR', '動画の取得に失敗しました：', error)
		return { success: false, message: "動画情報の取得に失敗しました、不明なエラー", exist: false }
	}
}

/**
 * 動画がブロックされているかを確認
 * @param videoId 動画のKVID
 * @param selectorUuid ユーザーのUUID
 * @param selectorToken ユーザーのトークン
 */
export const checkVideoBlockedByKvidService = async (videoId: number, selectorUuid: string, selectorToken: string): Promise<CheckVideoBlockedByKvidResponseDto> => {
	try {
		let isBlocked = false
		let isBlockedByOther = false
		let isHidden = false
		const { collectionName, schemaInstance } = VideoSchema
		type Video = InferSchemaType<typeof schemaInstance>
		const where: QueryType<Video> = {
			videoId,
		}
		const select: SelectType<Video> = {
			uploaderUUID: 1,
		}
		const videoResult = await selectDataFromMongoDB<Video>(where, select, schemaInstance, collectionName)
		if (!videoResult.success || !videoResult.result || videoResult.result.length === 0) {
			console.error('ERROR', '動画がブロックされているかの確認に失敗しました、対応する動画が見つかりません')
			return { success: false, message: '動画がブロックされているかの確認に失敗しました、対応する動画が見つかりません'}
		}
		const video = videoResult.result?.[0]
		const uploaderUUID = video.uploaderUUID
		if (!uploaderUUID) {
			console.error('ERROR', '動画がブロックされているかの確認に失敗しました、動画のアップローダーUIDが空です')
			return { success: false, message: '動画がブロックされているかの確認に失敗しました、動画のアップローダーUIDが空です' }
		}
		const targetUid = await getUserUid(uploaderUUID)
		if (!targetUid) {
			console.error('ERROR', '動画がブロックされているかの確認に失敗しました、動画のアップローダーUIDが存在しません')
			return { success: false, message: '動画がブロックされているかの確認に失敗しました、動画のアップローダーUIDが存在しません' }
		}

		const checkBlockUserResult = await checkBlockUserService({ uid: targetUid }, selectorUuid, selectorToken)
		const checkIsBlockedByOtherUserResult = await checkIsBlockedByOtherUserService({ targetUid }, selectorUuid, selectorToken)

		if (!checkBlockUserResult.success && !checkIsBlockedByOtherUserResult.success) {
			console.error('ERROR', '動画がブロックされているかの確認に失敗しました、ユーザーがブロックされているか確認できません')
			return { success: false, message: '動画がブロックされているかの確認に失敗しました、ユーザーがブロックされているか確認できません' }
		}

		// 1. アップローダーが現在のユーザーによって非表示にされているかを確認
		if (checkBlockUserResult.isHidden) {
			isHidden = true
		}
		// 2. 現在のユーザーがアップローダーによってブロックされているかを確認
		if (checkIsBlockedByOtherUserResult.isBlocked) {
			isBlockedByOther = true
		}
		// 3. 現在のユーザーとアップローダーが相互にブロックしているかを確認
		if (checkBlockUserResult.isBlocked && checkIsBlockedByOtherUserResult.isBlocked) {
			return { success: true, message: 'あなたとこのユーザーは相互にブロックしています', isBlockedByOther, isBlocked: true, isHidden }
		}
		// 4. アップローダーが現在のユーザーによってブロックされているかを確認
		if (checkBlockUserResult.isBlocked) {
			return { success: true, message: 'あなたはこのユーザーをブロックしています', isBlockedByOther, isBlocked: true, isHidden }
		}

		return { success: true, message: 'ブロックされていません', isBlocked, isBlockedByOther, isHidden }
	} catch (error) {
		console.error('ERROR', '動画がブロックされているかの確認に失敗しました：', error)
		return { success: false, message: '動画がブロックされているかの確認に失敗しました、不明なエラー'}
	}
}

/**
 * KVIDに基づいて動画を取得
 * @param uploadVideoRequest kvidに基づいて動画を取得するリクエストのペイロード
 * @returns 動画データ
 */
export const getVideoByKvidService = async (getVideoByKvidRequest: GetVideoByKvidRequestDto, selectorUuid?: string, selectorToken?: string): Promise<GetVideoByKvidResponseDto> => {
	try {
		const { videoId } = getVideoByKvidRequest
		const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
		let isHidden = false
		let isBlockedByOther = false

		if (!checkGetVideoByKvidRequest(getVideoByKvidRequest)) {
			console.error('ERROR', '動画ページ - KVIDが空です')
			return { success: false, message: '動画ページ - 必須リクエストパラメータが空です', isBlocked: false, isBlockedByOther, isHidden }
		}

		const getThumbVideoPipeline: PipelineStage[] = [
			{
				$match: {
					videoId, // videoIdで動画をフィルタリング
				},
			},
			{
				$limit: 1, // 誤って複数の動画を取得した場合、最初の1件のみを取得
			},
			{
				$lookup: { // ユーザー情報テーブルを関連付け、アップローダー情報を取得
					from: 'user-infos',
					localField: 'uploaderUUID',
					foreignField: 'UUID',
					as: 'uploader_info',
				},
			},
			{
				$unwind: '$uploader_info', // アップローダー情報を展開
			},
			{
				$project: {
					videoId: 1,
					videoPart: 1,
					title: 1,
					image: 1,
					uploadDate: 1,
					watchedCount: 1,
					uploaderUUID: 1,
					uploaderId: 1,
					duration: 1,
					description: 1,
					editDateTime: 1,
					videoCategory: 1,
					copyright: 1,
					videoTagList: 1,
					ensureOriginal: 1,
					pushToFeed: 1,
					uploaderInfo: {
						uid: '$uploader_info.uid',
						username: '$uploader_info.username',
						userNickname: '$uploader_info.userNickname',
						avatar: '$uploader_info.avatar',
						userBannerImage: '$uploader_info.userBannerImage',
						signature: '$uploader_info.signature',
					},
				},
			},
		]

		try {
			// Pipelineを使用して動画とアップローダーのデータをクエリ
			const result = await selectDataByAggregateFromMongoDB(videoSchemaInstance, videoCollectionName, getThumbVideoPipeline)
			const video = result.result?.[0] as GetVideoByKvidResponseDto['video']

			if (!result.success || !video) {
				console.error('ERROR', '動画ページ - 取得した動画結果または動画配列が空です')
				return { success: false, message: '動画ページ - 動画を取得できませんでした', isBlocked: false, isBlockedByOther, isHidden }
			}

			video.uploaderInfo.isFollowing = false // デフォルトではアップローダーをフォローしていない
			video.uploaderInfo.isSelf = false // デフォルトではアップローダーは自分自身ではない

			if ((await checkUserTokenByUuidService(selectorUuid, selectorToken)).success) { // ユーザーがログインしている場合
				const checkBlockUserResult = await checkBlockUserService({ uid: video.uploaderInfo.uid }, selectorUuid, selectorToken)
				const checkIsBlockedByOtherUserResult = await checkIsBlockedByOtherUserService({ targetUid: video.uploaderInfo.uid }, selectorUuid, selectorToken)
				// 1. アップローダーが現在のユーザーによって非表示にされているかを確認
				if (checkBlockUserResult.isHidden) {
					isHidden = true
				}
				// 2. 現在のユーザーがアップローダーによってブロックされているかを確認
				if (checkIsBlockedByOtherUserResult.isBlocked) {
					isBlockedByOther = true
				}
				// 3. 現在のユーザーとアップローダーが相互にブロックしているかを確認
				if (checkBlockUserResult.isBlocked && checkIsBlockedByOtherUserResult.isBlocked) {
					return { success: true, message: '動画ページ - 動画を取得できませんでした、あなたとこのユーザーは相互にブロックしています', isBlockedByOther, isBlocked: true, isHidden }
				}
				// 4. アップローダーが現在のユーザーによってブロックされているかを確認
				if (checkBlockUserResult.isBlocked) {
					return { success: true, message: '動画ページ - 動画を取得できませんでした、あなたはこのユーザーをブロックしています', isBlockedByOther, isBlocked: true, isHidden }
				}

				// 5. 閲覧履歴を保存
				const createOrUpdateBrowsingHistoryRequest: CreateOrUpdateBrowsingHistoryRequestDto = {
					uuid: selectorUuid,
					category: 'video',
					id: String(video.videoId),
				}
				await createOrUpdateBrowsingHistoryService(createOrUpdateBrowsingHistoryRequest, selectorUuid, selectorToken)

				// 6. アップローダーが現在のログインユーザーにフォローされているかクエリ
				const { collectionName: followingSchemaCollectionName, schemaInstance: followingSchemaInstance } = FollowingSchema
				type Following = InferSchemaType<typeof followingSchemaInstance>
				const followingWhere: QueryType<Following> = {
					followerUuid: selectorUuid,
					followingUuid: video.uploaderUUID,
				}
				const followingSelect: SelectType<Following> = {
					followerUuid: 1,
					followingUuid: 1,
					followingType: 1,
				}
				const selectFollowingDataResult = await selectDataFromMongoDB<Following>(followingWhere, followingSelect, followingSchemaInstance, followingSchemaCollectionName)
				const followingResult = selectFollowingDataResult?.result
				if (selectFollowingDataResult.success && followingResult.length === 1) { // クエリ結果があればフォローしていることを示す
					video.uploaderInfo.isFollowing = true
				}

				// 7. アップローダーのuuidと現在のログインユーザーのuuidが同じ場合、自分で自分の動画を見ていることになる
				if (video.uploaderUUID === selectorUuid) {
					video.uploaderInfo.isSelf = true
				}
			}

			return {
				success: true,
				message: '動画ページ - 動画の取得に成功しました',
				video,
				isBlocked: false,
				isBlockedByOther,
				isHidden,
			}
		} catch (error) {
			console.error('ERROR', '動画ページ - 動画のクエリに失敗しました：', error)
			return { success: false, message: '動画ページ - 動画のクエリに失敗しました', isBlocked: false, isBlockedByOther, isHidden }
		}
	} catch (error) {
		console.error('ERROR', '動画の取得に失敗しました：', error)
		return { success: false, message: '動画の取得に失敗しました：', isBlocked: false, isBlockedByOther: false, isHidden: false }
	}
}

/**
 * UIDに基づいてそのユーザーがアップロードした動画を取得
 * @param getVideoByUidRequest UIDに基づいてそのユーザーがアップロードした動画を取得するリクエストUID
 * @returns リクエストされた動画情報
 */
export const getVideoByUidRequestService = async (getVideoByUidRequest: GetVideoByUidRequestDto, selectorUuid?: string, selectorToken?: string): Promise<GetVideoByUidResponseDto> => {
	try {
		let isHidden = false
		let isBlockedByOther = false
		if (!checkGetVideoByUidRequest(getVideoByUidRequest)) {
			console.error('ERROR', 'UIDによる動画取得に失敗しました、リクエストされたUIDが空です：')
			return { success: false, message: 'UIDによる動画取得に失敗しました、リクエストされたUIDが空です', videosCount: 0, videos: [], isBlockedByOther, isBlocked: false, isHidden }
		}
		const { uid } = getVideoByUidRequest

		if (selectorUuid && selectorToken && (await checkUserTokenByUuidService(selectorUuid, selectorToken)).success) {
			const checkBlockUserResult = await checkBlockUserService({ uid }, selectorUuid, selectorToken)
			const checkIsBlockedByOtherUserResult = await checkIsBlockedByOtherUserService({ targetUid: uid }, selectorUuid, selectorToken)

			// 1. アップローダーが現在のユーザーによって非表示にされているかを確認
			if (checkBlockUserResult.isHidden) {
				isHidden = true
			}
			// 2. 現在のユーザーがアップローダーによってブロックされているかを確認
			if (checkIsBlockedByOtherUserResult.isBlocked) {
				isBlockedByOther = true
			}
			// 3. 現在のユーザーとアップローダーが相互にブロックしているかを確認
			if (checkBlockUserResult.isBlocked && checkIsBlockedByOtherUserResult.isBlocked) {
				return { success: true, message: 'UIDによる動画取得に失敗しました、あなたとこのユーザーは相互にブロックしています', videosCount: 0, videos: [], isBlockedByOther, isBlocked: true, isHidden }
			}
			// 4. アップローダーが現在のユーザーによってブロックされているかを確認
			if (checkBlockUserResult.isBlocked) {
				return { success: true, message: 'UIDによる動画取得に失敗しました、あなたはこのユーザーをブロックしています', videosCount: 0, videos: [], isBlockedByOther, isBlocked: true, isHidden }
			}
		}

		try {
			const { collectionName, schemaInstance } = VideoSchema
			type Video = InferSchemaType<typeof schemaInstance>
			const where: QueryType<Video> = {
				uploaderId: uid,
			}
			const select: SelectType<Video> = {
				videoId: 1,
				videoPart: 1,
				title: 1,
				image: 1,
				uploadDate: 1,
				watchedCount: 1,
				uploaderId: 1,
				duration: 1,
				description: 1,
				editDateTime: 1,
			}
			const result = await selectDataFromMongoDB<Video>(where, select, schemaInstance, collectionName)
			const videoResult = result.result

			if (!result.success || !videoResult) {
				console.error('ERROR', 'UIDによる動画取得に失敗しました、取得結果が失敗または空です')
				return { success: false, message: 'UIDによる動画取得に失敗しました、取得結果が失敗または空です', videosCount: 0, videos: [], isBlockedByOther, isBlocked: false, isHidden }
			}
			const videoResultLength = videoResult?.length
			if (videoResultLength <= 0) {
				return { success: true, message: 'このユーザーは動画をアップロードしていないようです', videosCount: 0, videos: [], isBlockedByOther, isBlocked: false, isHidden }
			}
			return { success: true, message: 'UIDによる動画取得に成功しました', videosCount: videoResultLength, videos: videoResult, isBlockedByOther, isBlocked: false, isHidden }
		} catch (error) {
			console.error('ERROR', 'UIDによる動画取得に失敗しました、動画検索中にエラーが発生しました：', error)
			return { success: false, message: 'UIDによる動画取得に失敗しました、動画検索中にエラーが発生しました', videosCount: 0, videos: [], isBlockedByOther, isBlocked: false, isHidden }
		}
	} catch (error) {
		console.error('ERROR', 'UIDによる動画取得に失敗しました、原因不明：', error)
		return { success: false, message: 'UIDによる動画取得に失敗しました、原因不明', videosCount: 0, videos: [], isBlockedByOther: false, isBlocked: false, isHidden: false }
	}
}

/**
 * キーワードに基づいてElasticsearchで動画を検索
 * @param searchVideoByKeywordRequest リクエストパラメータ、検索キーワード
 * @param client Elasticsearch接続クライアント
 * @returns 動画検索リクエストの結果
 */
export const searchVideoByKeywordService = async (searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto, client: Client | undefined): Promise<SearchVideoByKeywordResponseDto> => {
	try {
		if (checkSearchVideoByKeywordRequest(searchVideoByKeywordRequest) && client && !isEmptyObject(client)) {
			const { indexName: esIndexName, schema: videoEsSchema } = VideoDocument
			const esQuery = {
				query_string: {
					query: searchVideoByKeywordRequest.keyword,
				},
			}
			try {
				const esSearchResult = await searchDataFromElasticsearchCluster(client, esIndexName, videoEsSchema, esQuery)
				if (esSearchResult.success) {
					const videoResult = esSearchResult?.result
					if (videoResult && videoResult?.length > 0) {
						try {
							const videos: SearchVideoByKeywordResponseDto['videos'] = await Promise.all(videoResult.map(async video => {
								const esVideoId = video.kvid
								const esVideoTitle = video.title
								const uploadVideoRequest: GetVideoByKvidRequestDto = {
									videoId: esVideoId,
								}
								const result = await getVideoByKvidService(uploadVideoRequest)
								const videoResult = result?.video
								if (result.success && videoResult && !isEmptyObject(videoResult)) {
									return {
										videoId: videoResult.videoId,
										title: videoResult.title,
										image: videoResult.image,
										uploadDate: videoResult.uploadDate,
										watchedCount: videoResult.watchedCount,
										uploader: videoResult.uploaderInfo?.username,
										uploaderId: videoResult.uploaderId,
										duration: videoResult.duration,
										description: videoResult.description,
									}
								} else {
									return {
										videoId: esVideoId,
										title: esVideoTitle,
									}
								}
							}))
							const videosCount = videos?.length
							if (videos && videosCount !== undefined && videosCount !== null && videosCount > 0) {
								return { success: true, message: 'キーワードによる動画検索に成功しました', videosCount, videos }
							} else {
								console.error('ERROR', 'キーワードによる動画検索に失敗しました、Esでの検索は成功しましたが、MongoDBで一致する動画が見つかりませんでした')
								return { success: false, message: 'キーワードによる動画検索に失敗しました、動画は見つかりましたが、動画情報がデータベースに保存されていません', videosCount: 0, videos: [] }
							}
						} catch (error) {
							console.error('ERROR', 'キーワードによる動画検索に失敗しました、Esでの検索は成功しましたが、MongoDBでの検索で例外が発生しました')
							return { success: false, message: 'キーワードによる動画検索に失敗しました、動画は見つかりましたが、動画データの取得で例外が発生しました', videosCount: 0, videos: [] }
						}
					} else {
						return { success: true, message: 'キーワードによる動画検索に成功しましたが、検索結果は空でした', videosCount: 0, videos: [] }
					}
				} else {
					console.error('ERROR', 'キーワードによる動画検索に失敗しました、Esでの検索に失敗しました')
					return { success: false, message: 'キーワードによる動画検索に失敗しました、検索に失敗しました', videosCount: 0, videos: [] }
				}
			} catch (error) {
				console.error('ERROR', 'キーワードによる動画検索に失敗しました、Esでのデータ検索中に例外が発生しました', error)
				return { success: false, message: 'キーワードによる動画検索に失敗しました、データ検索時に例外が発生しました', videosCount: 0, videos: [] }
			}
		} else {
			console.error('ERROR', 'キーワードによる動画検索に失敗しました、検索キーワードまたはEs接続クライアントが空です')
			return { success: false, message: 'キーワードによる動画検索に失敗しました、必須パラメータが空です', videosCount: 0, videos: [] }
		}
	} catch (error) {
		console.error('ERROR', 'キーワードによる動画検索に失敗しました、原因不明：', error)
		return { success: false, message: 'キーワードによる動画検索に失敗しました、原因不明', videosCount: 0, videos: [] }
	}
}

/**
 * 動画ファイルのTUSアップロードエンドポイントを取得
 * @param uid ユーザーUID
 * @param token ユーザートークン
 * @param getVideoFileTusEndpointRequest 動画ファイルのTUSアップロードエンドポイントを取得するリクエストペイロード
 * @returns 動画ファイルのTUSアップロードエンドポイントアドレス
 */
export const getVideoFileTusEndpointService = async (uid: number, token: string, getVideoFileTusEndpointRequest: GetVideoFileTusEndpointRequestDto): Promise<string | undefined> => {
	try {
		if ((await checkUserTokenService(uid, token)).success) {
			const streamTusEndpointUrl = process.env.CF_STREAM_TUS_ENDPOINT_URL
			const streamToken = process.env.CF_STREAM_TOKEN
			const uploadLength = getVideoFileTusEndpointRequest.uploadLength
			const uploadMetadata = getVideoFileTusEndpointRequest.uploadMetadata

			if (!streamTusEndpointUrl && !streamToken) {
				console.error('ERROR', 'Cloudflare Stream TUSエンドポイントを作成できません、streamTusEndpointUrlとstreamTokenが空の可能性があります。環境変数の設定を確認してください（CF_STREAM_TUS_ENDPOINT_URL, CF_STREAM_TOKEN）')
				return undefined
			}
			try {
				const videoTusEndpointResponse = await fetch(streamTusEndpointUrl, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${streamToken}`,
						'Tus-Resumable': '1.0.0',
						'Upload-Length': `${uploadLength}`,
						'Upload-Metadata': uploadMetadata,
					},
				})
				if (!videoTusEndpointResponse.ok) {
					console.error('ERROR', `Cloudflare Stream TUSエンドポイントを作成できません、HTTPエラー！ステータス：${videoTusEndpointResponse.status}`)
					return undefined
				}
				const videoTusEndpoint = videoTusEndpointResponse.headers.get('location')
				if (videoTusEndpoint) {
					return videoTusEndpoint
				} else {
					console.error('ERROR', 'Cloudflare Stream TUSエンドポイントを作成できません、リクエスト結果が空です')
					return undefined
				}
			} catch (error) {
				console.error('ERROR', 'Cloudflare Stream TUSエンドポイントを作成できません、リクエストの送信に失敗しました', error?.response?.data)
				return undefined
			}
		} else {
			console.error('ERROR', 'Cloudflare Stream TUSエンドポイントを作成できません、ユーザー検証に失敗しました', { uid })
			return undefined
		}
	} catch (error) {
		console.error('ERROR', 'Cloudflare Stream TUSエンドポイントを作成できません、不明なエラー：', error)
		return undefined
	}
}

/**  
 * MinIO用の動画カバー画像アップロード署名付きURLを取得する  
 * @param uid ユーザーID  
 * @param token ユーザートークン  
 * @returns MinIO署名付きURLの結果  
 */  
export const getVideoCoverUploadSignedUrlService = async (uid: number, token: string): Promise<GetVideoCoverUploadSignedUrlResponseDto> => {  
    try {  
        if (await checkUserToken(uid, token)) {  
            const now = new Date().getTime();  
            const fileName = `video-cover-${uid}-${generateSecureRandomString(32)}-${now}`;  
              
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
                Bucket: process.env.MINIO_BUCKET || 'kirakira-videos',  
                Key: fileName,  
                ContentType: 'image/*',  
            });  
  
            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10分間有効  
  
            if (signedUrl && fileName) {  
                return {   
                    success: true,   
                    message: '動画カバー画像のアップロードを開始する準備ができました',   
                    result: { signedUrl, fileName }   
                };  
            } else {  
                return { success: false, message: 'アップロードに失敗しました、画像アップロードURLを生成できません' };  
            }  
        } else {  
            console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、不正なユーザーです', { uid });  
            return { success: false, message: 'アップロードに失敗しました、アップロード権限を取得できません' };  
        }  
    } catch (error) {  
        console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、エラーメッセージ', error, { uid });  
        return { success: false, message: 'アップロードに失敗しました、サーバーエラーが発生しました' };  
    }  
};  

/**  
 * MinIO用の動画ファイル直接アップロードサービス  
 * @param uid ユーザーID  
 * @param token ユーザートークン  
 * @param fileName ファイル名  
 * @param fileSize ファイルサイズ  
 * @returns MinIOマルチパートアップロード開始の結果  
 */  
export const createVideoUploadSessionService = async (uid: number, token: string, fileName: string, fileSize: number): Promise<CreateVideoUploadSessionResponseDto> => {  
    try {  
        if (await checkUserToken(uid, token)) {  
            const now = new Date().getTime();  
            const objectKey = `videos/${uid}/${now}-${fileName}`;  
              
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
  
            // マルチパートアップロード開始  
            const command = new CreateMultipartUploadCommand({  
                Bucket: process.env.MINIO_BUCKET || 'kirakira-videos',  
                Key: objectKey,  
                ContentType: 'video/*',  
            });  
  
            const response = await s3Client.send(command);  
  
            if (response.UploadId) {  
                return {  
                    success: true,  
                    message: '動画アップロードセッションが作成されました',  
                    uploadId: response.UploadId,  
                    objectKey: objectKey,  
                    bucketName: process.env.MINIO_BUCKET || 'kirakira-videos'  
                };  
            } else {  
                return { success: false, message: 'アップロードセッションの作成に失敗しました' };  
            }  
        } else {  
            console.error('ERROR', 'アップロードセッションの作成に失敗しました、不正なユーザーです', { uid });  
            return { success: false, message: 'アップロードセッションの作成に失敗しました、アップロード権限を取得できません' };  
        }  
    } catch (error) {  
        console.error('ERROR', 'アップロードセッションの作成に失敗しました、エラーメッセージ', error, { uid });  
        return { success: false, message: 'アップロードセッションの作成に失敗しました、サーバーエラーが発生しました' };  
    }  
};

/**
 * 動画TAG IDに基づいて動画データを検索
 * @param searchVideoByVideoTagIdRequest 動画TAG IDに基づいて動画を検索するリクエストペイロード
 * @returns 動画TAG IDで動画を取得するリクエストレスポンス
 */
export const searchVideoByVideoTagIdService = async (searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto): Promise<SearchVideoByVideoTagIdResponseDto> => {
	try {
		if (checkSearchVideoByVideoTagIdRequest(searchVideoByVideoTagIdRequest)) {
			const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
			const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema
			type Video = InferSchemaType<typeof videoSchemaInstance>
			type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>

			const where: QueryType<Video> = {
				videoTagList: {
					$all: searchVideoByVideoTagIdRequest.tagId.map(tagId => ({ $elemMatch: { tagId } })),
				},
			}
			const select: SelectType<Video> = {
				videoId: 1,
				videoPart: 1,
				title: 1,
				image: 1,
				uploadDate: 1,
				watchedCount: 1,
				uploaderId: 1,
				duration: 1,
				description: 1,
				editDateTime: 1,
				videoCategory: 1,
				copyright: 1,
				videoTagList: 1,
			}
			const uploaderInfoKey = 'uploaderInfo'
			const option: DbPoolOptions<Video, UserInfo> = {
				virtual: {
					name: uploaderInfoKey, // 仮想属性名
					options: {
						ref: userInfoCollectionName, // 関連付けられた子モデル、末尾にsを付けることを忘れないでください
						localField: 'uploaderId', // 親モデルの関連付けフィールド
						foreignField: 'uid', // 子モデルの関連付けフィールド
						justOne: true, // trueの場合、1つのデータに1つのドキュメントのみを関連付ける（条件に一致するものが多数あっても）
					},
				},
				populate: uploaderInfoKey,
			}
			try {
				const result = await selectDataFromMongoDB<Video, UserInfo>(where, select, videoSchemaInstance, videoCollectionName, option)
				const videoResult = result.result
				if (result.success && videoResult) {
					const videoList = videoResult.map(video => {
						const uploaderInfo = uploaderInfoKey in video && video?.[uploaderInfoKey] as UserInfo
						if (uploaderInfo) { // 取得できた場合、動画アップローダー情報をリクエストレスポンスに追加する
							const uid = uploaderInfo.uid
							const username = uploaderInfo.username
							const userNickname = uploaderInfo.userNickname
							const avatar = uploaderInfo.avatar
							const userBannerImage = uploaderInfo.userBannerImage
							const signature = uploaderInfo.signature
							video.uploaderInfo = { uid, username, userNickname, avatar, userBannerImage, signature }
						}
						return { ...video, uploaderInfo } as SearchVideoByVideoTagIdResponseDto['videos'][number]
					})

					if (videoList) {
						if (videoList.length > 0) {
							return { success: true, message: 'TAG IDによる動画検索に成功しました', videosCount: videoList.length, videos: videoList }
						} else {
							return { success: true, message: 'TAG IDによる検索では動画が見つかりませんでした', videosCount: 0, videos: [] }
						}
					} else {
						console.error('ERROR', 'TAG IDによる検索中にエラーが発生しました、検索結果が空です')
						return { success: true, message: 'TAG IDによる検索中にエラーが発生しました、整理後の検索結果が空です', videosCount: 0, videos: [] }
					}
				} else {
					console.error('ERROR', 'TAG IDによる検索中にエラーが発生しました、検索結果が空です')
					return { success: false, message: 'TAG IDによる検索中にエラーが発生しました、検索結果が空です', videosCount: 0, videos: [] }
				}
			} catch (error) {
				console.error('ERROR', 'TAG IDによる検索中にエラーが発生しました、動画検索中にエラーが発生しました：', error)
				return { success: false, message: 'TAG IDによる検索中にエラーが発生しました、動画検索中にエラーが発生しました', videosCount: 0, videos: [] }
			}
		} else {
			console.error('ERROR', 'TAG IDで動画を取得できません、リクエストパラメータが不正です')
			return { success: false, message: 'TAG IDで動画を取得できません、リクエストパラメータが不正です', videosCount: 0, videos: [] }
		}
	} catch (error) {
		console.error('ERROR', 'TAG IDで動画を取得できません、不明な例外：', error)
		return { success: false, message: 'TAG IDで動画を取得できません、不明な例外', videosCount: 0, videos: [] }
	}
}

/**
 * 動画を1つ削除
 * @param deleteVideoRequest 動画を1つ削除するリクエストペイロード
 * @param adminUid 管理者UID
 * @param adminToken 管理者トークン
 * @param esClient Elasticsearchクライアント接続
 * @returns 動画を1つ削除するリクエストレスポンス
 */
export const deleteVideoByKvidService = async (deleteVideoRequest: DeleteVideoRequestDto, adminUid: number, adminToken: string, esClient: Client): Promise<DeleteVideoResponseDto> => {
	try {
		if (checkDeleteVideoRequest(deleteVideoRequest) && esClient && !isEmptyObject(esClient)) {
			if ((await checkUserTokenService(adminUid, adminToken)).success) {
				const adminUUID = await getUserUuid(adminUid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
				if (!adminUUID) {
					console.error('ERROR', '動画の削除に失敗しました、adminUUIDが存在しません', { adminUid })
					return { success: false, message: '動画の削除に失敗しました、adminUUIDが存在しません' }
				}
				const videoId = deleteVideoRequest.videoId
				const nowDate = new Date().getTime()
				const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
				type Video = InferSchemaType<typeof videoSchemaInstance>
				const deleteWhere: QueryType<Video> = {
					videoId,
				}
				const { indexName: esIndexName } = VideoDocument
				const conditions = {
					kvid: videoId,
				}

				const { collectionName: removedVideoCollectionName, schemaInstance: removedVideoSchemaInstance } = RemovedVideoSchema
				type RemovedVideo = InferSchemaType<typeof removedVideoSchemaInstance>

				// トランザクション開始
				const session = await mongoose.startSession()
				session.startTransaction()
				const option = { session }

				try {
					const getVideoByKvidRequest: GetVideoByKvidRequestDto = {
						videoId,
					}
					const videoResult = await getVideoByKvidService(getVideoByKvidRequest)
					const videoData = videoResult.video
					if (videoResult.success && videoData) {
						const removedVideoData: RemovedVideo = {
							...videoData as Video, // TODO: Mongoose issue: #12420
							pendingReview: false, // 削除済みの動画は審査不要...
							_operatorUUID_: adminUUID,
							_operatorUid_: adminUid,
							editDateTime: nowDate,
						}
						const saveRemovedVideo = await insertData2MongoDB(removedVideoData, removedVideoSchemaInstance, removedVideoCollectionName, option)
						if (saveRemovedVideo.success) {
							const deleteResult = await deleteDataFromMongoDB<Video>(deleteWhere, videoSchemaInstance, videoCollectionName, option)
							const deleteFromElasticsearchResult = await deleteDataFromElasticsearchCluster(esClient, esIndexName, conditions)
							if (deleteResult.success && deleteFromElasticsearchResult) {
								await session.commitTransaction()
								session.endSession()
								return { success: true, message: '動画の削除に成功しました' }
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', '動画の削除に失敗しました、動画の削除に失敗しました')
								return { success: false, message: '動画の削除に失敗しました、動画の削除に失敗しました' }
							}
						} else {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', '動画の削除に失敗しました、コピーの保存に失敗しました')
							return { success: false, message: '動画の削除に失敗しました、コピーの保存に失敗しました' }
						}
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', '動画の削除に失敗しました、動画データのクエリに失敗しました')
						return { success: false, message: '動画の削除に失敗しました、動画データのクエリに失敗しました' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', '動画の削除中にエラーが発生しました、動画の取得に失敗しました！')
					return { success: false, message: '動画の削除中にエラーが発生しました、動画の取得に失敗しました' }
				}
			} else {
				console.error('ERROR', '動画の削除に失敗しました、不正なユーザーです！')
				return { success: false, message: '動画の削除に失敗しました、不正なユーザーです！' }
			}
		} else {
			console.error('ERROR', '動画の削除に失敗しました、パラメータが不正です')
			return { success: false, message: '動画の削除に失敗しました、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '動画の削除中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '動画の削除中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * 審査待ち動画リストを取得
 * @param adminUid 管理者UID
 * @param adminToken 管理者トークン
 * @returns 審査待ち動画リスト取得リクエストのレスポンス
 */
export const getPendingReviewVideoService = async (adminUid: number, adminToken: string): Promise<PendingReviewVideoResponseDto> => {
	try {
		if (!(await checkUserTokenService(adminUid, adminToken)).success) {
			console.error('ERROR', '審査待ち動画リストの取得に失敗しました、ユーザー検証に失敗しました！')
			return { success: false, message: '審査待ち動画リストの取得に失敗しました、ユーザー検証に失敗しました！', videosCount: 0, videos: [] }
		}

		const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
		const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema
		type Video = InferSchemaType<typeof videoSchemaInstance>
		type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>

		const where: QueryType<Video> = {}
		const select: SelectType<Video> = {
			videoId: 1,
			title: 1,
			image: 1,
			uploadDate: 1,
			watchedCount: 1,
			uploaderId: 1,
			duration: 1,
			description: 1,
			editDateTime: 1,
		}
		const orderBy: OrderByType<Video> = {
			editDateTime: -1,
		}
		const uploaderInfoKey = 'uploaderInfo'
		const option: DbPoolOptions<Video, UserInfo> = {
			virtual: {
				name: uploaderInfoKey, // 仮想属性名
				options: {
					ref: userInfoCollectionName, // 関連付けられた子モデル
					localField: 'uploaderId', // 親モデルの関連付けフィールド
					foreignField: 'uid', // 子モデルの関連付けフィールド
					justOne: true, // trueの場合、1つのデータに1つのドキュメントのみを関連付ける（条件に一致するものが多数あっても）
				},
			},
			populate: uploaderInfoKey,
		}

		try {
			const result = await selectDataFromMongoDB<Video, UserInfo>(where, select, videoSchemaInstance, videoCollectionName, option, orderBy)
			const videoResult = result.result
			if (result.success && videoResult) {
				const videosCount = videoResult?.length
				if (videosCount && videosCount > 0) {
					return {
						success: true,
						message: '審査待ち動画の取得に成功しました',
						videosCount,
						videos: videoResult.map(video => {
							if (video) {
								const uploaderInfo = uploaderInfoKey in video && video?.[uploaderInfoKey] as UserInfo
								if (uploaderInfo) {
									const uploader = uploaderInfo.userNickname ?? uploaderInfo.username
									return { ...video, uploader }
								}
							}
							return { ...video, uploader: undefined }
						})
					}
				} else {
					console.error('ERROR', '審査待ち動画リストの取得に失敗しました、取得した動画配列の長さが0以下です')
					return { success: false, message: '審査待ち動画リストの取得に失敗しました、動画数が0です', videosCount: 0, videos: [] }
				}
			} else {
				console.error('ERROR', '審査待ち動画リストの取得に失敗しました、取得した動画結果または動画配列が空です')
				return { success: false, message: '審査待ち動画リストの取得に失敗しました、動画を取得できませんでした', videosCount: 0, videos: [] }
			}
		} catch (error) {
			console.error('ERROR', '審査待ち動画リスト取得時にエラーが発生しました、動画取得時に例外が発生しました、クエリに失敗しました：', error)
			return { success: false, message: '審査待ち動画リスト取得時にエラーが発生しました、クエリに失敗しました', videosCount: 0, videos: [] }
		}
	} catch (error) {
		console.error('ERROR', '審査待ち動画リスト取得時にエラーが発生しました、動画取得中にエラーが発生しました：', error)
		return { success: false, message: '審査待ち動画リスト取得時にエラーが発生しました、動画取得中にエラーが発生しました', videosCount: 0, videos: [] }
	}
}

/**
 * 審査待ちの動画を承認
 * @param approvePendingReviewVideoRequest 審査待ちの動画を1つ承認するリクエストペイロード
 * @param adminUid 管理者UID
 * @param adminToken 管理者トークン
 * @returns 審査待ちの動画を1つ承認するリクエストレスポンス
 */
export const approvePendingReviewVideoService = async (approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto, adminUid: number, adminToken: string): Promise<ApprovePendingReviewVideoResponseDto> => {
	try {
		if (!checkApprovePendingReviewVideoRequest(approvePendingReviewVideoRequest)) {
			console.error('ERROR', '審査待ち動画の承認に失敗しました、パラメータ検証に失敗しました')
			return { success: false, message: '審査待ち動画の承認に失敗しました、パラメータ検証に失敗しました' }
		}
		if (!(await checkUserTokenService(adminUid, adminToken)).success) {
			console.error('ERROR', '審査待ち動画の承認に失敗しました、ユーザー検証に失敗しました！')
			return { success: false, message: '審査待ち動画の承認に失敗しました、ユーザー検証に失敗しました！' }
		}
		try {
			const { videoId } = approvePendingReviewVideoRequest
			const { collectionName: videoCollectionName, schemaInstance: videoSchemaInstance } = VideoSchema
			type Video = InferSchemaType<typeof videoSchemaInstance>
			const updatePendingReviewVideoWhere: QueryType<Video> = {
				videoId,
			}
			const updatePendingReviewVideoData: UpdateType<Video> = {
				pendingReview: false,
			}
			const updatePendingReviewVideoResult = await findOneAndUpdateData4MongoDB<Video>(updatePendingReviewVideoWhere, updatePendingReviewVideoData, videoSchemaInstance, videoCollectionName)
			if (!updatePendingReviewVideoResult.success) {
				console.error('ERROR', '審査待ち動画の承認に失敗しました、更新に失敗しました')
				return { success: false, message: '審査待ち動画の承認に失敗しました、更新に失敗しました' }
			}
			return { success: true, message: '審査待ち動画の承認に成功しました' }
		} catch (error) {
			console.error('ERROR', '審査待ち動画の承認中にエラーが発生しました、更新リクエスト中にエラーが発生しました：', error)
			return { success: false, message: '審査待ち動画の承認中にエラーが発生しました、更新リクエスト中にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', '審査待ち動画の承認中にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '審査待ち動画の承認中にエラーが発生しました、不明なエラー' }
	}
}

/**
 * 動画アップロードリクエストのペイロードを検証
 * @param uploadVideoRequest 動画アップロードリクエストのペイロード
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkUploadVideoRequest = (uploadVideoRequest: UploadVideoRequestDto) => {
	// TODO // WARN ここでは、より安全な検証メカニズムが必要になる可能性があります
	const VIDEO_CATEGORY = ['anime', 'music', 'otomad', 'tech', 'design', 'game', 'misc']
	return (
		uploadVideoRequest.videoPart && uploadVideoRequest.videoPart?.length > 0 && uploadVideoRequest.videoPart.every(checkVideoPartData)
		&& uploadVideoRequest.title
		&& uploadVideoRequest.image
		&& uploadVideoRequest.uploaderId !== null && uploadVideoRequest.uploaderId !== undefined
		&& uploadVideoRequest.duration
		&& VIDEO_CATEGORY.includes(uploadVideoRequest.videoCategory)
		&& uploadVideoRequest.copyright
		&& uploadVideoRequest.pushToFeed !== undefined && uploadVideoRequest.pushToFeed !== null
		&& uploadVideoRequest.ensureOriginal !== undefined && uploadVideoRequest.ensureOriginal !== null
	)
}

/**
 * アップロードされた動画のvideoPartDateパラメータが正しく、漏れがないかを確認する
 * @param videoPartDate 各P動画のデータ
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkVideoPartData = (videoPartDate: VideoPartDto) => {
	return (
		videoPartDate.id !== null && videoPartDate.id !== undefined
		&& videoPartDate.link
		&& videoPartDate.videoPartTitle
	)
}

/**
 * kvidに基づいて動画データを取得する際に渡されるリクエストパラメータを検証
 * @param getVideoByKvidRequest kvidに基づいて動画データを取得する際に渡されるリクエストパラメータ
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkGetVideoByKvidRequest = (getVideoByKvidRequest: GetVideoByKvidRequestDto) => {
	return (getVideoByKvidRequest.videoId !== null && getVideoByKvidRequest.videoId !== undefined)
}

/**
 * uidに基づいて動画リストを取得する際にuidが存在するかどうかを確認する
 * @param getVideoByUidRequest uidに基づいて動画リストデータを取得する際に渡されるリクエストパラメータ
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkGetVideoByUidRequest = (getVideoByUidRequest: GetVideoByUidRequestDto) => {
	return (getVideoByUidRequest.uid !== null && getVideoByUidRequest.uid !== undefined)
}

/**
 * キーワードによる動画検索のリクエストパラメータを検証
 * @param searchVideoByKeywordRequest キーワードによる動画検索のリクエストパラメータ
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkSearchVideoByKeywordRequest = (searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto) => {
	return (!!searchVideoByKeywordRequest.keyword)
}

/**
 * 動画TAG IDに基づいて動画を検索するリクエストペイロードを検証する
 * @param searchVideoByVideoTagIdRequest 動画TAG IDに基づいて動画を検索するリクエストペイロード
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkSearchVideoByVideoTagIdRequest = (searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto): boolean => {
	return (searchVideoByVideoTagIdRequest && searchVideoByVideoTagIdRequest.tagId && searchVideoByVideoTagIdRequest.tagId.length > 0)
}

/**
 * 動画を1つ削除するリクエストペイロードを検証する
 * @param deleteVideoRequest 動画を1つ削除するリクエストペイロード
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkDeleteVideoRequest = (deleteVideoRequest: DeleteVideoRequestDto): boolean => {
	return (!!deleteVideoRequest.videoId && typeof deleteVideoRequest.videoId === 'number' && deleteVideoRequest.videoId >= 0)
}

/**
 * 審査待ちの動画を1つ承認するリクエストペイロードを検証する
 * @param approvePendingReviewVideoRequest 審査待ちの動画を1つ承認するリクエストペイロード
 * @returns 検証結果、正当な場合はtrue、不正な場合はfalseを返す
 */
const checkApprovePendingReviewVideoRequest = (approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto) => {
	return (!!approvePendingReviewVideoRequest.videoId && typeof approvePendingReviewVideoRequest.videoId === 'number' && approvePendingReviewVideoRequest.videoId >= 0)
}
