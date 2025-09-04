import mongoose, { InferSchemaType, PipelineStage } from 'mongoose'
import { GetUserInfoByUidRequestDto } from '../controller/UserControllerDto.js'
import { AdminDeleteVideoCommentRequestDto, AdminDeleteVideoCommentResponseDto, CancelVideoCommentDownvoteRequestDto, CancelVideoCommentDownvoteResponseDto, CancelVideoCommentUpvoteRequestDto, CancelVideoCommentUpvoteResponseDto, DeleteSelfVideoCommentRequestDto, DeleteSelfVideoCommentResponseDto, EmitVideoCommentDownvoteRequestDto, EmitVideoCommentDownvoteResponseDto, EmitVideoCommentRequestDto, EmitVideoCommentResponseDto, EmitVideoCommentUpvoteRequestDto, EmitVideoCommentUpvoteResponseDto, GetVideoCommentByKvidRequestDto, GetVideoCommentByKvidResponseDto, GetVideoCommentDownvotePropsDto, GetVideoCommentDownvoteResultDto, GetVideoCommentUpvotePropsDto, GetVideoCommentUpvoteResultDto, VideoCommentResult } from '../controller/VideoCommentControllerDto.js'
import { findOneAndPlusByMongodbId, insertData2MongoDB, selectDataFromMongoDB, updateData4MongoDB, deleteDataFromMongoDB, selectDataByAggregateFromMongoDB } from '../dbPool/DbClusterPool.js'
import { QueryType, SelectType } from '../dbPool/DbClusterPoolTypes.js'
import { RemovedVideoCommentSchema, VideoCommentDownvoteSchema, VideoCommentSchema, VideoCommentUpvoteSchema } from '../dbPool/schema/VideoCommentSchema.js'
import { getNextSequenceValueService } from './SequenceValueService.js'
import { checkUserTokenByUuidService, checkUserTokenService, getUserInfoByUidService, getUserUid, getUserUuid } from './UserService.js'
import { buildBlockListMongooseFilter } from './BlockService.js'
import { checkVideoBlockedByKvidService } from './VideoService.js'

/**
 * @param emitVideoCommentRequest ユーザーが送信したコメントデータ
 * @param uid cookie内のユーザーID
 * @param token cookie内のユーザートークン
 * @returns ユーザーがコメントを送信した結果
 */
export const emitVideoCommentService = async (emitVideoCommentRequest: EmitVideoCommentRequestDto, uuid: string, token: string): Promise<EmitVideoCommentResponseDto> => {
	try {
		if (!checkEmitVideoCommentRequest(emitVideoCommentRequest)) {
			console.error('ERROR', 'ビデオコメントの送信に失敗しました、コメントデータの検証に失敗しました：', { videoId: emitVideoCommentRequest.videoId, uuid })
			return { success: false, message: 'ビデオコメントの送信に失敗しました、ビデオコメントデータが不正です' }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ビデオコメントの送信に失敗しました、ユーザー検証に失敗しました', { videoId: emitVideoCommentRequest.videoId, uuid })
			return { success: false, message: 'ビデオコメントの送信に失敗しました、ユーザー検証に失敗しました' }
		}

		if (!uuid) {
			console.error('ERROR', 'コメントの送信に失敗しました、UUIDが存在しません', { uuid })
			return { success: false, message: 'コメントの送信に失敗しました、UUIDが存在しません' }
		}
		const uid = await getUserUid(uuid)
		if (uid === undefined || uid === null || uid < 1) {
			console.error('ERROR', 'コメントの送信に失敗しました、送信者のUIDの取得に失敗しました。', { uuid })
			return { success: false, message: 'コメントの送信に失敗しました、送信者のUIDの取得に失敗しました。' }
		}

		const { videoId } = emitVideoCommentRequest
		const selectorUuid = uuid
		const selectorToken = token
		const checkVideoBlockedResult = await checkVideoBlockedByKvidService(videoId, selectorUuid, selectorToken)
		if (!checkVideoBlockedResult.success) {
			console.error('ERROR', 'コメントの送信に失敗しました、動画がブロックされているかの確認に失敗しました', { uuid })
			return { success: false, message: 'コメントの送信に失敗しました、動画がブロックされているかの確認に失敗しました' }
		}
		if (checkVideoBlockedResult.isBlockedByOther) {
			console.error('ERROR', 'コメントの送信に失敗しました、他のユーザーによってブロックされています', { uuid })
			return { success: false, message: 'コメントの送信に失敗しました、他のユーザーによってブロックされています' }
		}
		if (checkVideoBlockedResult.isBlocked) {
			console.error('ERROR', 'コメントの送信に失敗しました、アップローダーをブロックしています', { uuid })
			return { success: false, message: 'コメントの送信に失敗しました、アップローダーをブロックしています' }
		}

		const session = await mongoose.startSession()
		session.startTransaction()
		try {
			const getCommentIndexResult = await getNextSequenceValueService(`KVID-${emitVideoCommentRequest.videoId}`, 1, 1, session) // ビデオIDをキーとして次の値を取得、つまりコメントフロア
			const commentIndex = getCommentIndexResult.sequenceValue
			if (!getCommentIndexResult.success || commentIndex === undefined || commentIndex === null) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', 'ビデオコメントの送信に失敗しました、フロアデータの取得に失敗しました、ビデオIDに基づいて次のシーケンス値を取得できません', { videoId: emitVideoCommentRequest.videoId, uid })
				return { success: false, message: 'ビデオコメントの送信に失敗しました、フロアデータの取得に失敗しました' }
			}

			const { collectionName, schemaInstance } = VideoCommentSchema
			type VideoComment = InferSchemaType<typeof schemaInstance>
			const nowDate = new Date().getTime()
			const videoComment: VideoComment = {
				...emitVideoCommentRequest,
				UUID: uuid,
				uid,
				commentRoute: `${emitVideoCommentRequest.videoId}.${commentIndex}`,
				commentIndex,
				emitTime: nowDate,
				upvoteCount: 0,
				downvoteCount: 0,
				subComments: [] as VideoComment['subComments'], // TODO: Mongoose issue: #12420
				subCommentsCount: 0,
				editDateTime: nowDate,
			}
			const insertData2MongoDBResult = await insertData2MongoDB(videoComment, schemaInstance, collectionName, { session })
			if (!insertData2MongoDBResult || !insertData2MongoDBResult.success) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', 'ビデオコメントの送信に失敗しました、結果が返されませんでした', { videoId: emitVideoCommentRequest.videoId, uid })
				return { success: false, message: 'ビデオコメントの送信に失敗しました、ビデオコメントデータの保存に失敗しました' }
			}

			try {
				const getUserInfoByUidRequest: GetUserInfoByUidRequestDto = { uid: videoComment.uid }
				const videoCommentSenderUserInfo = await getUserInfoByUidService(getUserInfoByUidRequest)
				const videoCommentSenderUserInfoResult = videoCommentSenderUserInfo.result
				if (!videoCommentSenderUserInfo.success || !videoCommentSenderUserInfoResult) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.warn('WARN', 'WARNING', 'ビデオコメントの送信に成功しましたが、エコーデータが空です', { videoId: emitVideoCommentRequest.videoId, uid })
					return { success: false, message: 'ビデオコメントの送信に成功しました、ページを更新してみてください' }
				}

				const videoCommentResult: VideoCommentResult = {
					_id: insertData2MongoDBResult.result?.[0]?._id?.toString(),
					...videoComment,
					userInfo: {
						userNickname: videoCommentSenderUserInfoResult.userNickname,
						username: videoCommentSenderUserInfoResult.username,
						avatar: videoCommentSenderUserInfoResult.avatar,
						userBannerImage: videoCommentSenderUserInfoResult.userBannerImage,
						signature: videoCommentSenderUserInfoResult.signature,
						gender: videoCommentSenderUserInfoResult.gender,
					},
					isUpvote: false,
					isDownvote: false,
				}

				await session.commitTransaction()
				session.endSession()
				return { success: true, message: 'ビデオコメントの送信に成功しました！', videoComment: videoCommentResult }
			} catch (error) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.warn('WARN', 'WARNING', 'ビデオコメントの送信に成功しましたが、エコーデータの取得に失敗しました', error, { videoId: emitVideoCommentRequest.videoId, uid })
				return { success: false, message: 'ビデオコメントの送信に成功しました、ページを更新してください' }
			}
		} catch (error) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', 'ビデオコメントの送信に失敗しました、MongoDBに保存できませんでした', error, { videoId: emitVideoCommentRequest.videoId, uid })
			return { success: false, message: 'ビデオコメントの送信に失敗しました、ビデオコメントデータの保存に失敗しました' }
		}
	} catch (error) {
		console.error('ERROR', 'ビデオコメントの送信に失敗しました、エラー情報：', error, { videoId: emitVideoCommentRequest.videoId, uuid })
		return { success: false, message: 'ビデオコメントの送信に失敗しました、不明なエラー' }
	}
}

/**
 * KVIDに基づいてビデオコメントリストを取得し、現在のユーザーが取得したコメントに「いいね」/「よくないね」を付けたかどうかを確認します。もし付けた場合、対応する値はtrueになります
 * @param getVideoCommentByKvidRequest ビデオコメントリストをリクエストするクエリパラメータ
 * @returns ビデオのビデオコメントリスト
 */
export const getVideoCommentListByKvidService = async (getVideoCommentByKvidRequest: GetVideoCommentByKvidRequestDto, uuid: string, token: string): Promise<GetVideoCommentByKvidResponseDto> => {
	// WARN // TODO さらに多くのセキュリティ検証を追加して、スクレイピングを防止する必要があります！
	try {
		if (!checkGetVideoCommentByKvidRequest(getVideoCommentByKvidRequest)) {
			console.error('ERROR', 'ビデオコメントリストの取得に失敗しました、データ検証に失敗しました', { getVideoCommentByKvidRequest })
			return { success: false, message: 'ビデオコメントリストの取得に失敗しました、データ検証に失敗しました', videoCommentCount: 0, videoCommentList: [] }
		}
		if (uuid !== undefined && uuid !== null && token) { // ユーザーを検証し、検証が成功した場合、現在のユーザーが特定のビデオに対して「いいね」/「よくないね」を付けたコメントのコメントIDリストを取得します
			if (!(await checkUserTokenByUuidService(uuid, token)).success) {
				console.error('ERROR', 'ビデオコメントリストの取得に失敗しました、ユーザー検証に失敗しました', { getVideoCommentByKvidRequest })
				return { success: false, message: 'ビデオコメントリストの取得に失敗しました、ユーザー検証に失敗しました', videoCommentCount: 0, videoCommentList: [] }
			}
		}

		const videoId = getVideoCommentByKvidRequest.videoId
		let pageSize = undefined
		let skip = 0
		if (getVideoCommentByKvidRequest.pagination && getVideoCommentByKvidRequest.pagination.page > 0 && getVideoCommentByKvidRequest.pagination.pageSize > 0) {
			skip = (getVideoCommentByKvidRequest.pagination.page - 1) * getVideoCommentByKvidRequest.pagination.pageSize
			pageSize = getVideoCommentByKvidRequest.pagination.pageSize
		}

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
				}
			],
			uuid,
			token
		)

		// ビデオのコメント総数を取得するパイプライン
		const countVideoCommentPipeline: PipelineStage[] = [
			// 1. コメント情報をクエリ
			{
				$match: {
					videoId // videoIdでコメントを絞り込む
				}
			},
			...blockListFilter.filter,
			// 2. 総数を集計
			{
				$count: 'totalCount', // 総ドキュメント数を集計
			}
		]

		// ビデオコメントを取得するパイプライン
		const getVideoCommentsPipeline: PipelineStage[] = [
			// 1. コメント情報をクエリ
			{
				$match: {
					videoId // videoIdでコメントを絞り込む
				}
			},
			...blockListFilter.filter,
			// 2. ユーザーテーブルを関連付けてコメント送信者の情報を取得
			{
				$lookup: {
					from: 'user-infos', // WARN: 複数形を忘れないでください
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data',
				}
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true, // 空の配列とnull値を保持
				}
			},
			// 3. フロアで昇順にソート
			{ $sort: { 'commentIndex': 1 } },
			// 4. ページネーションクエリ
			{ $skip: skip }, // 指定された数のドキュメントをスキップ
			...(pageSize ? [{ $limit: pageSize }] : []), // 返されるドキュメントの数を制限
			// 5. ターゲットユーザーのいいねデータを関連付け
			{
				$lookup: {
					from: 'video-comment-upvotes', // ユーザービデオコメントいいねテーブル名 // WARN: 複数形を忘れないでください
					let: { commentId: { $toString: '$_id' } }, // 現在のコメントの_id
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$commentId', '$$commentId'] }, // コメントIDを照合
										{ $eq: ['$UUID', uuid] }, // ユーザーUUIDを照合
										{ $eq: ['$invalidFlag', false] }, // 有効ないいねのみをカウント
									]
								}
							}
						}
					],
					as: 'userUpvote',
				}
			},
			// 6. このユーザーのよくないねデータのみを関連付け
			{
				$lookup: {
					from: 'video-comment-downvotes', // ユーザービデオコメントよくないねテーブル名 // WARN: 複数形を忘れないでください
					let: { commentId: { $toString: '$_id' } },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$commentId', '$$commentId'] },
										{ $eq: ['$UUID', uuid] }, // ユーザーUUIDを照合
										{ $eq: ['$invalidFlag', false] }, // 有効なよくないねのみをカウント
									]
								}
							}
						}
					],
					as: 'userDownvote',
				}
			},
			// 7. ユーザーがいいねまたはよくないねを付けたかどうかを判断
			{
				$addFields: {
					isUpvote: { $gt: [{ $size: '$userUpvote' }, 0] }, // いいねしたかどうか
					isDownvote: { $gt: [{ $size: '$userDownvote' }, 0] }, // よくないねしたかどうか
				}
			},
			// 8. 不要なフィールドをクリーンアップし、必要なデータを返す
			{
				$project: {
					_id: 1, // コメントのID
					content: 1, // コメント内容
					commentRoute: 1, // コメントのルート
					videoId: 1,
					UUID: 1, // コメント送信者のUUID
					uid: 1, // コメント送信者のUID
					emitTime: 1, // コメント送信時間
					text: 1, // コメント本文
					upvoteCount: 1, // コメントいいね数
					downvoteCount: 1, // コメントよくないね数
					commentIndex: 1, // コメントフロア数
					subCommentsCount: 1, // このコメントの次のレベルの子コメント数
					editDateTime: 1, // 最終編集時間
					isUpvote: 1, // いいねしたかどうか
					isDownvote: 1, // よくないねしたかどうか
					userInfo: {
						username: '$user_info_data.username', // ユーザー名
						userNickname: '$user_info_data.userNickname', // ユーザーニックネーム
						avatar: '$user_info_data.avatar', // ユーザーアバターのリンク
						signature: '$user_info_data.signature', // ユーザーの自己紹介
						gender: '$user_info_data.gender' // ユーザーの性別
					},
					...blockListFilter.additionalFields, // ブラックリストフィルターの追加フィールド
				}
			}
		]

		const { collectionName, schemaInstance } = VideoCommentSchema
		const videoCommentsCountResult = await selectDataByAggregateFromMongoDB(schemaInstance, collectionName, countVideoCommentPipeline)
		const videoCommentsResult = await selectDataByAggregateFromMongoDB(schemaInstance, collectionName, getVideoCommentsPipeline)

		if (!videoCommentsResult.success || !videoCommentsCountResult.success) {
			console.error('ERROR', 'ビデオコメントリストの取得に失敗しました、データのクエリに失敗しました', { getVideoCommentByKvidRequest })
			return { success: false, message: 'ビデオコメントリストの取得に失敗しました、データのクエリに失敗しました', videoCommentCount: 0, videoCommentList: [] }
		}

		return {
			success: true,
			message: videoCommentsCountResult.result?.[0]?.totalCount > 0 ? 'ビデオコメントリストの取得に成功しました' : 'ビデオコメントリストの取得に成功しました、長さはゼロです',
			videoCommentCount: videoCommentsCountResult.result?.[0]?.totalCount,
			videoCommentList: videoCommentsResult.result,
		}
	} catch (error) {
		console.error('ERROR', 'ビデオコメントリストの取得に失敗しました、エラー情報：', error, { getVideoCommentByKvidRequest })
		return { success: false, message: 'ビデオコメントリストの取得に失敗しました、原因不明', videoCommentCount: 0, videoCommentList: [] }
	}
}

/**
 * @param getVideoCommentUpvoteProps 特定のユーザーが特定のビデオのコメントに対して「いいね」を付けた状況を取得するためのパラメータ
 * @returns 特定のユーザーが特定のビデオのコメントに対して「いいね」を付けた状況
 */
const getVideoCommentUpvoteByUid = async (getVideoCommentUpvoteProps: GetVideoCommentUpvotePropsDto): Promise<GetVideoCommentUpvoteResultDto> => {
	try {
		if (checkGetVideoCommentUpvoteProps(getVideoCommentUpvoteProps)) {
			try {
				const { collectionName, schemaInstance } = VideoCommentUpvoteSchema
				type VideoCommentUpvote = InferSchemaType<typeof schemaInstance>
				const where: QueryType<VideoCommentUpvote> = {
					videoId: getVideoCommentUpvoteProps.videoId,
					uid: getVideoCommentUpvoteProps.uid,
					invalidFlag: false,
				}
				const select: SelectType<VideoCommentUpvote> = {
					videoId: 1,
					commentId: 1,
					uid: 1,
					editDateTime: 1,
				}
				const result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
				const videoCommentUpvoteList = result.result
				if (result.success) {
					if (videoCommentUpvoteList && videoCommentUpvoteList.length > 0) {
						return { success: true, message: 'ユーザーのいいね状況の取得に成功しました', videoCommentUpvoteResult: videoCommentUpvoteList }
					} else {
						return { success: true, message: 'ユーザーのいいね状況は空です', videoCommentUpvoteResult: [] }
					}
				} else {
					console.warn('WARN', 'WARNING', 'ユーザーのいいね状況の取得に失敗しました、クエリ失敗または結果が空です：', { getVideoCommentUpvoteProps })
					return { success: false, message: 'ユーザーのいいね状況の取得に失敗しました、クエリに失敗しました', videoCommentUpvoteResult: [] }
				}
			} catch (error) {
				console.warn('WARN', 'WARNING', 'ユーザーのいいね状況の取得に失敗しました、クエリに失敗しました：', error, { getVideoCommentUpvoteProps })
				return { success: false, message: 'ユーザーのいいね状況の取得に失敗しました、クエリに失敗しました', videoCommentUpvoteResult: [] }
			}
		} else {
			console.warn('WARN', 'WARNING', 'ユーザーのいいね状況の取得に失敗しました、クエリパラメータの検証に失敗しました', { getVideoCommentUpvoteProps })
			return { success: false, message: 'ユーザーのいいね状況の取得に失敗しました、必須パラメータが空です', videoCommentUpvoteResult: [] }
		}
	} catch (error) {
		console.warn('WARN', 'WARNING', 'ユーザーのいいね状況の取得に失敗しました、エラー情報：', error, { getVideoCommentUpvoteProps })
		return { success: false, message: 'ユーザーのいいね状況の取得に失敗しました、不明なエラー', videoCommentUpvoteResult: [] }
	}
}

/**
 * @param getVideoCommentDownvoteProps 特定のユーザーが特定のビデオのコメントに対して「よくないね」を付けた状況を取得するためのパラメータ
 * @returns 特定のユーザーが特定のビデオのコメントに対して「よくないね」を付けた状況
 */
const getVideoCommentDownvoteByUid = async (getVideoCommentDownvoteProps: GetVideoCommentDownvotePropsDto): Promise<GetVideoCommentDownvoteResultDto> => {
	try {
		if (checkGetVideoCommentDownvoteProps(getVideoCommentDownvoteProps)) {
			try {
				const { collectionName, schemaInstance } = VideoCommentDownvoteSchema
				type VideoCommentDownvote = InferSchemaType<typeof schemaInstance>
				const where: QueryType<VideoCommentDownvote> = {
					videoId: getVideoCommentDownvoteProps.videoId,
					uid: getVideoCommentDownvoteProps.uid,
					invalidFlag: false,
				}
				const select: SelectType<VideoCommentDownvote> = {
					videoId: 1,
					commentId: 1,
					uid: 1,
					editDateTime: 1,
				}
				const result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
				const videoCommentDownvoteList = result.result
				if (result.success) {
					if (videoCommentDownvoteList && videoCommentDownvoteList.length > 0) {
						return { success: true, message: 'ユーザーのよくないね状況の取得に成功しました', videoCommentDownvoteResult: videoCommentDownvoteList }
					} else {
						return { success: true, message: 'ユーザーのよくないね状況は空です', videoCommentDownvoteResult: [] }
					}
				} else {
					console.warn('WARN', 'WARNING', 'ユーザーのよくないね状況の取得に失敗しました、クエリ失敗または結果が空です：', { getVideoCommentDownvoteProps })
					return { success: false, message: 'ユーザーのよくないね状況の取得に失敗しました、クエリに失敗しました', videoCommentDownvoteResult: [] }
				}
			} catch (error) {
				console.warn('WARN', 'WARNING', 'ユーザーのよくないね状況の取得に失敗しました、クエリに失敗しました：', error, { getVideoCommentDownvoteProps })
				return { success: false, message: 'ユーザーのよくないね状況の取得に失敗しました、クエリに失敗しました', videoCommentDownvoteResult: [] }
			}
		} else {
			console.warn('WARN', 'WARNING', 'ユーザーのよくないね状況の取得に失敗しました、クエリパラメータの検証に失敗しました', { getVideoCommentDownvoteProps })
			return { success: false, message: 'ユーザーのよくないね状況の取得に失敗しました、必須パラメータが空です', videoCommentDownvoteResult: [] }
		}
	} catch (error) {
		console.warn('WARN', 'WARNING', 'ユーザーのよくないね状況の取得に失敗しました、エラー情報：', error, { getVideoCommentDownvoteProps })
		return { success: false, message: 'ユーザーのよくないね状況の取得に失敗しました、不明なエラー', videoCommentDownvoteResult: [] }
	}
}

/**
 * @param emitVideoCommentUpvoteRequest ユーザーがビデオコメントに「いいね」を付けるリクエストペイロード
 * @param uid ユーザーUID
 * @param token ユーザーUIDに対応するトークン
 * @returns ユーザーがビデオコメントに「いいね」を付けた結果
 */
export const emitVideoCommentUpvoteService = async (emitVideoCommentUpvoteRequest: EmitVideoCommentUpvoteRequestDto, uid: number, token: string): Promise<EmitVideoCommentUpvoteResponseDto> => {
	// WARN // TODO さらに多くのセキュリティ検証を追加して、スクレイピングを防止する必要があります！
	try {
		if (checkEmitVideoCommentUpvoteRequestData(emitVideoCommentUpvoteRequest)) {
			if ((await checkUserTokenService(uid, token)).success) { // ユーザーを検証し、検証が成功した場合のみいいねを付けられる
				const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
				if (!UUID) {
					console.error('ERROR', 'コメントのいいねに失敗しました、UUIDが存在しません', { uid })
					return { success: false, message: 'コメントのいいねに失敗しました、UUIDが存在しません' }
				}
				const { collectionName: videoCommentUpvoteCollectionName, schemaInstance: correctVideoCommentUpvoteSchema } = VideoCommentUpvoteSchema
				type VideoCommentUpvote = InferSchemaType<typeof correctVideoCommentUpvoteSchema>
				const videoId = emitVideoCommentUpvoteRequest.videoId
				const commentId = emitVideoCommentUpvoteRequest.id
				const nowDate = new Date().getTime()
				const videoCommentUpvote: VideoCommentUpvote = {
					videoId,
					commentId,
					UUID,
					uid,
					invalidFlag: false,
					deleteFlag: false,
					editDateTime: nowDate,
				}

				if (!(await checkUserHasUpvoted(commentId, uid))) { // ユーザーがこのビデオコメントにいいねを付けていない場合のみ、いいねを付けられる
					try {
						const insertData2MongoDBResult = await insertData2MongoDB(videoCommentUpvote, correctVideoCommentUpvoteSchema, videoCommentUpvoteCollectionName)
						if (insertData2MongoDBResult && insertData2MongoDBResult.success) {
							try {
								const { collectionName: videoCommentCollectionName, schemaInstance: correctVideoCommentSchema } = VideoCommentSchema
								const upvoteBy = 'upvoteCount'
								const updateResult = await findOneAndPlusByMongodbId(commentId, upvoteBy, correctVideoCommentSchema, videoCommentCollectionName)
								if (updateResult && updateResult.success) {
									try {
										if (await checkUserHasDownvoted(commentId, uid)) { // ユーザーがビデオコメントにいいねを付ける際、以前にこのビデオコメントによくないねを付けていた場合、ビデオコメントのよくないねをキャンセルする必要がある
											const cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto = {
												id: commentId,
												videoId,
											}
											const cancelVideoCommentDownvoteResult = await cancelVideoCommentDownvoteService(cancelVideoCommentDownvoteRequest, uid, token)
											if (cancelVideoCommentDownvoteResult.success) {
												return { success: true, message: 'ビデオコメントのいいねに成功しました' }
											} else {
												console.error('ERROR', 'ビデオコメントのいいねに成功しましたが、よくないねのキャンセルに失敗しました', { emitVideoCommentUpvoteRequest, uid })
												return { success: false, message: 'ビデオコメントのいいねに成功しましたが、よくないねのキャンセルに失敗しました' }
											}
										} catch (error) {
											console.error('ERROR', 'ビデオコメントのいいねに成功しましたが、よくないねのキャンセルのリクエストに失敗しました', error, { emitVideoCommentUpvoteRequest, uid })
											return { success: false, message: 'ビデオコメントのいいねに成功しましたが、よくないねのキャンセルに失敗しました' }
										}
									} else {
										return { success: true, message: 'ビデオコメントのいいねに成功しました' }
									}
								} else {
									console.error('ERROR', 'ビデオコメントのいいねデータの保存に成功しましたが、いいね合計が増加しませんでした', { emitVideoCommentUpvoteRequest, uid })
									return { success: false, message: 'ビデオコメントのいいねデータの保存に成功しましたが、いいね合計が増加しませんでした' }
								}
							} catch (error) {
								console.error('ERROR', 'ビデオコメントのいいねデータの保存に成功しましたが、いいね合計の増加に失敗しました', error, { emitVideoCommentUpvoteRequest, uid })
								return { success: false, message: 'ビデオコメントのいいねデータの保存に成功しましたが、いいね合計の増加に失敗しました' }
							}
						} else {
							console.error('ERROR', 'ビデオコメントのいいねに失敗しました', { emitVideoCommentUpvoteRequest, uid })
							return { success: false, message: 'ビデオコメントのいいねに失敗しました、データの保存に失敗しました' }
						}
					} catch (error) {
						console.error('ERROR', 'ビデオコメントのいいねに失敗しました、MongoDBに保存できませんでした', error, { emitVideoCommentUpvoteRequest, uid })
						return { success: false, message: 'ビデオコメントのいいねに失敗しました、データの保存に失敗しました' }
					}
				} else {
					console.error('ERROR', 'ユーザーがいいねを付ける際にエラーが発生しました、ユーザーは既にいいねを付けています', { emitVideoCommentUpvoteRequest, uid })
					return { success: false, message: 'ユーザーがいいねを付ける際にエラーが発生しました、ユーザーは既にいいねを付けています' }
				}
			} else {
				console.error('ERROR', 'ユーザーがいいねを付ける際にエラーが発生しました、ユーザー検証に失敗しました', { emitVideoCommentUpvoteRequest, uid })
				return { success: false, message: 'ユーザーがいいねを付ける際にエラーが発生しました、ユーザー検証に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーがいいねを付ける際にエラーが発生しました、いいねデータの検証に失敗しました：', { emitVideoCommentUpvoteRequest, uid })
			return { success: false, message: 'ユーザーがいいねを付ける際にエラーが発生しました、データが不正です' }
		}
	} catch (error) {
		console.error('ERROR', 'いいねに失敗しました、不明なエラー：', error, { emitVideoCommentUpvoteRequest, uid })
		return { success: false, message: 'いいねに失敗しました、不明なエラー' }
	}
}

/**
 * @param cancelVideoCommentUpvoteRequest ユーザーがビデオコメントのいいねをキャンセルするリクエストパラメータ
 * @param uid ユーザーUID
 * @param token ユーザーUIDに対応するトークン
 * @returns ユーザーがビデオコメントのいいねをキャンセルした結果
 */
export const cancelVideoCommentUpvoteService = async (cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto, uid: number, token: string): Promise<CancelVideoCommentUpvoteResponseDto> => {
	try {
		if (checkCancelVideoCommentUpvoteRequest(cancelVideoCommentUpvoteRequest)) {
			if ((await checkUserTokenService(uid, token)).success) { // ユーザーを検証し、検証が成功した場合のみいいねをキャンセルできる
				try {
					const { collectionName: videoCommentUpvoteCollectionName, schemaInstance: correctVideoCommentUpvoteSchema } = VideoCommentUpvoteSchema
					type VideoCommentUpvote = InferSchemaType<typeof correctVideoCommentUpvoteSchema>
					const commentId = cancelVideoCommentUpvoteRequest.id
					const cancelVideoCommentUpvoteWhere: QueryType<VideoCommentUpvote> = {
						videoId: cancelVideoCommentUpvoteRequest.videoId,
						commentId,
						uid,
					}
					const cancelVideoCommentUpvoteUpdate: QueryType<VideoCommentUpvote> = {
						invalidFlag: true,
					}
					const updateResult = await updateData4MongoDB(cancelVideoCommentUpvoteWhere, cancelVideoCommentUpvoteUpdate, correctVideoCommentUpvoteSchema, videoCommentUpvoteCollectionName)
					if (updateResult && updateResult.success && updateResult.result) {
						if (updateResult.result.matchedCount > 0 && updateResult.result.modifiedCount > 0) {
							try {
								const { collectionName: videoCommentCollectionName, schemaInstance: correctVideoCommentSchema } = VideoCommentSchema
								const upvoteBy = 'upvoteCount'
								const updateResult = await findOneAndPlusByMongodbId(commentId, upvoteBy, correctVideoCommentSchema, videoCommentCollectionName, -1)
								if (updateResult.success) {
									return { success: true, message: 'ユーザーのいいねキャンセルに成功しました' }
								} else {
									console.warn('WARN', 'WARNING', 'ユーザーのいいねキャンセルに成功しましたが、いいね総数が更新されませんでした')
									return { success: true, message: 'ユーザーのいいねキャンセルに成功しましたが、いいね総数が更新されませんでした' }
								}
							} catch (error) {
								console.warn('WARN', 'WARNING', 'ユーザーのいいねキャンセルに成功しましたが、いいね総数の更新に失敗しました')
								return { success: true, message: 'ユーザーのいいねキャンセルに成功しましたが、いいね総数の更新に失敗しました' }
							}
						} else {
							console.error('ERROR', 'ユーザーがいいねをキャンセルする際にエラーが発生しました、更新数が0です', { cancelVideoCommentUpvoteRequest, uid })
							return { success: false, message: 'ユーザーがいいねをキャンセルする際にエラーが発生しました、更新できません' }
						}
					}
				} catch (error) {
					console.error('ERROR', 'ユーザーがいいねをキャンセルする際にエラーが発生しました、データの更新時にエラーが発生しました', error, { cancelVideoCommentUpvoteRequest, uid })
					return { success: false, message: 'ユーザーがいいねをキャンセルする際にエラーが発生しました、データの更新時にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', 'ユーザーがいいねをキャンセルする際にエラーが発生しました、ユーザー検証に失敗しました', { cancelVideoCommentUpvoteRequest, uid })
				return { success: false, message: 'ユーザーがいいねをキャンセルする際にエラーが発生しました、ユーザー検証に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーがいいねをキャンセルする際にエラーが発生しました、パラメータが不正または必須パラメータが空です', { cancelVideoCommentUpvoteRequest, uid })
			return { success: false, message: 'ユーザーがいいねをキャンセルする際にエラーが発生しました、パラメータが異常です' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーがいいねをキャンセルする際にエラーが発生しました、不明なエラー', error, { cancelVideoCommentUpvoteRequest, uid })
		return { success: false, message: 'ユーザーがいいねをキャンセルする際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * @param commentId コメントのID
 * @param uid ユーザーUID
 * @returns 検証結果、ユーザーが既にいいねを付けている場合はtrue、付けていない場合はfalseを返す
 */
const checkUserHasUpvoted = async (commentId: string, uid: number): Promise<boolean> => {
	try {
		if (commentId && uid !== undefined && uid !== null) {
			try {
				const { collectionName, schemaInstance } = VideoCommentUpvoteSchema
				type VideoCommentUpvote = InferSchemaType<typeof schemaInstance>
				const where: QueryType<VideoCommentUpvote> = {
					uid,
					commentId,
					invalidFlag: false,
				}
				const select: SelectType<VideoCommentUpvote> = {
					videoId: 1,
					commentId: 1,
					uid: 1,
				}
				const result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
				if (result.success) {
					if (result.result && result.result.length > 0) {
						return true // クエリ結果が見つかった場合、ユーザーが既にいいねを付けていることを証明するため、trueを返す
					} else {
						return false // クエリに成功したが結果が見つからなかった場合、ユーザーがいいねを付けていないことを証明するため、falseを返す
					}
				} else {
					return false // 悲観的：クエリに失敗した場合、ユーザーがいいねを付けていないと見なす
				}
			} catch (error) {
				console.error('ユーザーが特定のコメントに既にいいねを付けているか検証中にエラーが発生しました：ユーザーのいいねデータの取得に失敗しました', { commentId, uid })
				return false
			}
		} else {
			console.error('ユーザーが特定のコメントに既にいいねを付けているか検証中にエラーが発生しました：データの検証に失敗しました', { commentId, uid })
			return false
		}
	} catch (error) {
		console.error('ユーザーが特定のコメントに既にいいねを付けているか検証中にエラーが発生しました：', error, { commentId, uid })
		return false
	}
}

/**
 * @param emitVideoCommentDownvoteRequest ユーザーがビデオコメントによくないねを付けるリクエストペイロード
 * @param uid ユーザーUID
 * @param token ユーザーUIDに対応するトークン
 * @returns ユーザーがビデオコメントによくないねを付けた結果
 */
export const emitVideoCommentDownvoteService = async (emitVideoCommentDownvoteRequest: EmitVideoCommentDownvoteRequestDto, uid: number, token: string): Promise<EmitVideoCommentDownvoteResponseDto> => {
	// WARN // TODO さらに多くのセキュリティ検証を追加して、スクレイピングを防止する必要があります！
	try {
		if (checkEmitVideoCommentDownvoteRequestData(emitVideoCommentDownvoteRequest)) {
			if ((await checkUserTokenService(uid, token)).success) { // ユーザーを検証し、検証が成功した場合のみよくないねを付けられる
				const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
				if (!UUID) {
					console.error('ERROR', 'コメントのよくないねに失敗しました、UUIDが存在しません', { uid })
					return { success: false, message: 'コメントのよくないねに失敗しました、UUIDが存在しません' }
				}
				const { collectionName: videoCommentDownvoteCollectionName, schemaInstance: correctVideoCommentDownvoteSchema } = VideoCommentDownvoteSchema
				type VideoCommentDownvote = InferSchemaType<typeof correctVideoCommentDownvoteSchema>
				const videoId = emitVideoCommentDownvoteRequest.videoId
				const commentId = emitVideoCommentDownvoteRequest.id
				const nowDate = new Date().getTime()
				const videoCommentDownvote: VideoCommentDownvote = {
					videoId,
					commentId,
					UUID,
					uid,
					invalidFlag: false,
					deleteFlag: false,
					editDateTime: nowDate,
				}

				if (!(await checkUserHasDownvoted(commentId, uid))) { // ユーザーがこのビデオコメントによくないねを付けていない場合のみ、よくないねを付けられる
					try {
						const insertData2MongoDBResult = await insertData2MongoDB(videoCommentDownvote, correctVideoCommentDownvoteSchema, videoCommentDownvoteCollectionName)
						if (insertData2MongoDBResult && insertData2MongoDBResult.success) {
							try {
								const { collectionName: videoCommentCollectionName, schemaInstance: correctVideoCommentSchema } = VideoCommentSchema
								const downvoteBy = 'downvoteCount'
								const updateResult = await findOneAndPlusByMongodbId(commentId, downvoteBy, correctVideoCommentSchema, videoCommentCollectionName)
								if (updateResult && updateResult.success) {
									try {
										if (await checkUserHasUpvoted(commentId, uid)) { // ユーザーがビデオコメントによくないねを付ける際、以前にこのビデオコメントにいいねを付けていた場合、ビデオコメントのいいねをキャンセルする必要がある
											const cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto = {
												id: commentId,
												videoId,
											}
											const cancelVideoCommentUpvoteResult = await cancelVideoCommentUpvoteService(cancelVideoCommentUpvoteRequest, uid, token)
											if (cancelVideoCommentUpvoteResult.success) {
												return { success: true, message: 'ビデオコメントのよくないねに成功しました' }
											} else {
												console.error('ERROR', 'ビデオコメントのよくないねに成功しましたが、いいねのキャンセルに失敗しました', { emitVideoCommentDownvoteRequest, uid })
												return { success: false, message: 'ビデオコメントのよくないねに成功しましたが、いいねのキャンセルに失敗しました' }
											}
										} catch (error) {
											console.error('ERROR', 'ビデオコメントのよくないねに成功しましたが、いいねのキャンセルのリクエストに失敗しました', error, { emitVideoCommentDownvoteRequest, uid })
											return { success: false, message: 'ビデオコメントのよくないねに成功しましたが、いいねのキャンセルに失敗しました' }
										}
									} else {
										return { success: true, message: 'ビデオコメントのよくないねに成功しました' }
									}
								} else {
									console.error('ERROR', 'ビデオコメントのよくないねデータの保存に成功しましたが、よくないね合計が増加しませんでした', { emitVideoCommentDownvoteRequest, uid })
									return { success: false, message: 'ビデオコメントのよくないねデータの保存に成功しましたが、よくないね合計が増加しませんでした' }
								}
							} catch (error) {
								console.error('ERROR', 'ビデオコメントのよくないねデータの保存に成功しましたが、よくないね合計の増加に失敗しました', error, { emitVideoCommentDownvoteRequest, uid })
								return { success: false, message: 'ビデオコメントのよくないねデータの保存に成功しましたが、よくないね合計の増加に失敗しました' }
							}
						} else {
							console.error('ERROR', 'ビデオコメントのよくないねに失敗しました', { emitVideoCommentDownvoteRequest, uid })
							return { success: false, message: 'ビデオコメントのよくないねに失敗しました、データの保存に失敗しました' }
						}
					} catch (error) {
						console.error('ERROR', 'ビデオコメントのよくないねに失敗しました、MongoDBに保存できませんでした', error, { emitVideoCommentDownvoteRequest, uid })
						return { success: false, message: 'ビデオコメントのよくないねに失敗しました、データの保存に失敗しました' }
					}
				} else {
					console.error('ERROR', 'ユーザーがよくないねを付ける際にエラーが発生しました、ユーザーは既によくないねを付けています', { emitVideoCommentDownvoteRequest, uid })
					return { success: false, message: 'ユーザーがよくないねを付ける際にエラーが発生しました、ユーザーは既によくないねを付けています' }
				}
			} else {
				console.error('ERROR', 'ユーザーがよくないねを付ける際にエラーが発生しました、ユーザー検証に失敗しました', { emitVideoCommentDownvoteRequest, uid })
				return { success: false, message: 'ユーザーがよくないねを付ける際にエラーが発生しました、ユーザー検証に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーがよくないねを付ける際にエラーが発生しました、よくないねデータの検証に失敗しました：', { emitVideoCommentDownvoteRequest, uid })
			return { success: false, message: 'ユーザーがよくないねを付ける際にエラーが発生しました、データが不正です' }
		}
	} catch (error) {
		console.error('ERROR', 'よくないねに失敗しました、不明なエラー：', error, { emitVideoCommentDownvoteRequest, uid })
		return { success: false, message: 'よくないねに失敗しました、不明なエラー' }
	}
}

/**
 * @param cancelVideoCommentDownvoteRequest ユーザーがビデオコメントのよくないねをキャンセルするリクエストパラメータ
 * @param uid ユーザーUID
 * @param token ユーザーUIDに対応するトークン
 * @returns ユーザーがビデオコメントのよくないねをキャンセルした結果
 */
export const cancelVideoCommentDownvoteService = async (cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto, uid: number, token: string): Promise<CancelVideoCommentDownvoteResponseDto> => {
	try {
		if (checkCancelVideoCommentDownvoteRequest(cancelVideoCommentDownvoteRequest)) {
			if ((await checkUserTokenService(uid, token)).success) { // ユーザーを検証し、検証が成功した場合のみよくないねをキャンセルできる
				try {
					const { collectionName: videoCommentDownvoteCollectionName, schemaInstance: correctVideoCommentDownvoteSchema } = VideoCommentDownvoteSchema
					type VideoCommentDownvote = InferSchemaType<typeof correctVideoCommentDownvoteSchema>
					const commentId = cancelVideoCommentDownvoteRequest.id
					const cancelVideoCommentDownvoteWhere: QueryType<VideoCommentDownvote> = {
						videoId: cancelVideoCommentDownvoteRequest.videoId,
						commentId,
						uid,
					}
					const cancelVideoCommentDownvoteUpdate: QueryType<VideoCommentDownvote> = {
						invalidFlag: true,
					}
					const updateResult = await updateData4MongoDB(cancelVideoCommentDownvoteWhere, cancelVideoCommentDownvoteUpdate, correctVideoCommentDownvoteSchema, videoCommentDownvoteCollectionName)
					if (updateResult && updateResult.success && updateResult.result) {
						if (updateResult.result.matchedCount > 0 && updateResult.result.modifiedCount > 0) {
							try {
								const { collectionName: videoCommentCollectionName, schemaInstance: correctVideoCommentSchema } = VideoCommentSchema
								const downvoteBy = 'downvoteCount'
								const updateResult = await findOneAndPlusByMongodbId(commentId, downvoteBy, correctVideoCommentSchema, videoCommentCollectionName, -1)
								if (updateResult.success) {
									return { success: true, message: 'ユーザーのよくないねキャンセルに成功しました' }
								} else {
									console.warn('WARN', 'WARNING', 'ユーザーのよくないねキャンセルに成功しましたが、よくないね総数が更新されませんでした')
									return { success: true, message: 'ユーザーのよくないねキャンセルに成功しましたが、よくないね総数が更新されませんでした' }
								}
							} catch (error) {
								console.warn('WARN', 'WARNING', 'ユーザーのよくないねキャンセルに成功しましたが、よくないね総数の更新に失敗しました')
								return { success: true, message: 'ユーザーのよくないねキャンセルに成功しましたが、よくないね総数の更新に失敗しました' }
							}
						} else {
							console.error('ERROR', 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、更新数が0です', { cancelVideoCommentDownvoteRequest, uid })
							return { success: false, message: 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、更新できません' }
						}
					}
				} catch (error) {
					console.error('ERROR', 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、データの更新時にエラーが発生しました', error, { cancelVideoCommentDownvoteRequest, uid })
					return { success: false, message: 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、データの更新時にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、ユーザー検証に失敗しました', { cancelVideoCommentDownvoteRequest, uid })
				return { success: false, message: 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、ユーザー検証に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、パラメータが不正または必須パラメータが空です', { cancelVideoCommentDownvoteRequest, uid })
			return { success: false, message: 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、パラメータが異常です' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、不明なエラー', error, { cancelVideoCommentDownvoteRequest, uid })
		return { success: false, message: 'ユーザーがよくないねをキャンセルする際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * @param commentId コメントのID
 * @param uid ユーザーUID
 * @returns 検証結果、ユーザーが既によくないねを付けている場合はtrue、付けていない場合はfalseを返す
 */
const checkUserHasDownvoted = async (commentId: string, uid: number): Promise<boolean> => {
	try {
		if (commentId && uid !== undefined && uid !== null) {
			try {
				const { collectionName, schemaInstance } = VideoCommentDownvoteSchema
				type VideoCommentDownvote = InferSchemaType<typeof schemaInstance>
				const where: QueryType<VideoCommentDownvote> = {
					uid,
					commentId,
					invalidFlag: false,
				}
				const select: SelectType<VideoCommentDownvote> = {
					videoId: 1,
					commentId: 1,
					uid: 1,
				}
				const result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
				if (result.success) {
					if (result.result && result.result.length > 0) {
						return true // クエリ結果が見つかった場合、ユーザーが既によくないねを付けていることを証明するため、trueを返す
					} else {
						return false // クエリに成功したが結果が見つからなかった場合、ユーザーがよくないねを付けていないことを証明するため、falseを返す
					}
				} else {
					return false // 悲観的：クエリに失敗した場合、ユーザーがよくないねを付けていないと見なす
				}
			} catch (error) {
				console.error('ユーザーが特定のコメントに既によくないねを付けているか検証中にエラーが発生しました：ユーザーのよくないねデータの取得に失敗しました', { commentId, uid })
				return false
			}
		} else {
			console.error('ユーザーが特定のコメントに既によくないねを付けているか検証中にエラーが発生しました：データの検証に失敗しました', { commentId, uid })
			return false
		}
	} catch (error) {
		console.error('ユーザーが特定のコメントに既によくないねを付けているか検証中にエラーが発生しました：', error, { commentId, uid })
		return false
	}
}

/**
 * @param deleteSelfVideoCommentRequest 自分が投稿したビデオコメントを削除するリクエストペイロード
 * @param uid ユーザーUID
 * @param token ユーザーUIDに対応するトークン
 * @returns 自分が投稿したビデオコメントを削除するリクエストレスポンス
 */
export const deleteSelfVideoCommentService = async (deleteSelfVideoCommentRequest: DeleteSelfVideoCommentRequestDto, uid: number, token: string): Promise<DeleteSelfVideoCommentResponseDto> => {
	try {
		if (!checkDeleteSelfVideoCommentRequest(deleteSelfVideoCommentRequest)) {
			console.error('ビデオコメントの削除に失敗しました、パラメータが不正です')
			return { success: false, message: 'ビデオコメントの削除に失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenService(uid, token)).success) {
			console.error('ビデオコメントの削除に失敗しました、ユーザー検証に失敗しました')
			return { success: false, message: 'ビデオコメントの削除に失敗しました、ユーザー検証に失敗しました' }
		}

		const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
		if (!UUID) {
			console.error('ERROR', '自分が投稿したビデオコメントの削除に失敗しました、UUIDが存在しません', { uid })
			return { success: false, message: '自分が投稿したビデオコメントの削除に失敗しました、UUIDが存在しません' }
		}

		const { commentRoute, videoId } = deleteSelfVideoCommentRequest
		const now = new Date().getTime()
		const { collectionName: videoCommentSchemaName, schemaInstance: videoCommentSchemaInstance } = VideoCommentSchema
		const { collectionName: removedVideoCommentSchemaName, schemaInstance: removedVideoCommentSchemaInstance } = RemovedVideoCommentSchema
		type VideoComment = InferSchemaType<typeof videoCommentSchemaInstance>
		type RemovedVideoComment = InferSchemaType<typeof removedVideoCommentSchemaInstance>

		const deleteSelfVideoCommentWhere: QueryType<VideoComment> | QueryType<RemovedVideoComment> = {
			commentRoute,
			videoId,
		}

		const deleteSelfVideoCommentSelect: SelectType<VideoComment> = {
			commentRoute: 1,
			videoId: 1,
			UUID: 1,
			uid: 1,
			emitTime: 1,
			text: 1,
			upvoteCount: 1,
			downvoteCount: 1,
			commentIndex: 1,
			subComments: 1,
			subCommentsCount: 1,
			editDateTime: 1,
		}

		try {
			const deleteSelfVideoCommentSelectResult = await selectDataFromMongoDB<VideoComment>(deleteSelfVideoCommentWhere, deleteSelfVideoCommentSelect, videoCommentSchemaInstance, videoCommentSchemaName)
			if (!deleteSelfVideoCommentSelectResult.success || !deleteSelfVideoCommentSelectResult.result || deleteSelfVideoCommentSelectResult.result.length !== 1) {
				console.error('ビデオコメントの削除に失敗しました、ビデオコメントの検索結果が空または長さに制限を超えています')
				return { success: false, message: 'ビデオコメントの削除に失敗しました、ビデオコメントの検索結果が空または長さに制限を超えています' }
			}

			const videoData = deleteSelfVideoCommentSelectResult.result[0]
			if (videoData.uid !== uid) {
				console.error('ビデオコメントの削除に失敗しました、自分のコメントのみ削除できます')
				return { success: false, message: 'ビデオコメントの削除に失敗しました、自分のコメントのみ削除できます' }
			}

			const session = await mongoose.startSession()
			session.startTransaction()
			try {
				const removedVideoCommentData: RemovedVideoComment = {
					...deleteSelfVideoCommentSelectResult.result[0],
					_operatorUUID_: UUID,
					_operatorUid_: uid,
					editDateTime: now,
				}
				const deleteSelfVideoCommentSaveResult = await insertData2MongoDB<RemovedVideoComment>(removedVideoCommentData, removedVideoCommentSchemaInstance, removedVideoCommentSchemaName, { session })
				if (!deleteSelfVideoCommentSaveResult.success) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ビデオコメントの削除に失敗しました、削除済みビデオコメントの保存に失敗しました')
					return { success: false, message: 'ビデオコメントの削除に失敗しました、記録に失敗しました' }
				}

				const deleteSelfVideoCommentDeleteResult = await deleteDataFromMongoDB<VideoComment>(deleteSelfVideoCommentWhere, videoCommentSchemaInstance, videoCommentSchemaName, { session })
				if (!deleteSelfVideoCommentDeleteResult.success) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ビデオコメントの削除に失敗しました、削除に失敗しました')
					return { success: false, message: 'ビデオコメントの削除に失敗しました、削除に失敗しました' }
				}

				await session.commitTransaction()
				session.endSession()
				return { success: true, message: 'ビデオコメントの削除に成功しました' }
			} catch (error) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ビデオコメントの削除中にエラーが発生しました：削除済みビデオコメントの保存中にエラーが発生しました', error)
				return { success: false, message: 'ビデオコメントの削除中にエラーが発生しました：記録を保存できません' }
			}
		} catch (error) {
			console.error('ビデオコメントの削除中にエラーが発生しました：ビデオコメントの検索中にエラーが発生しました', error)
			return { success: false, message: 'ビデオコメントの削除中にエラーが発生しました：ビデオコメントの検索中にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ビデオコメントの削除中にエラーが発生しました：不明なエラー', error)
		return { success: false, message: 'ビデオコメントの削除中にエラーが発生しました：不明なエラー' }
	}
}

/**
 * @param adminDeleteVideoCommentRequest 管理者がビデオコメントを削除するリクエストペイロード
 * @param adminUid 管理者UID
 * @param adminToken 管理者トークン
 * @returns 管理者がビデオコメントを削除するリクエストレスポンス
 */
export const adminDeleteVideoCommentService = async (adminDeleteVideoCommentRequest: AdminDeleteVideoCommentRequestDto, adminUid: number, adminToken: string): Promise<AdminDeleteVideoCommentResponseDto> => {
	try {
		if (!checkAdminDeleteVideoCommentRequest(adminDeleteVideoCommentRequest)) {
			console.error('管理者がビデオコメントを削除するのに失敗しました、パラメータが不正です')
			return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、パラメータが不正です' }
		}

		if (!(await checkUserTokenService(adminUid, adminToken)).success) {
			console.error('管理者がビデオコメントを削除するのに失敗しました、ユーザー検証に失敗しました')
			return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、ユーザー検証に失敗しました' }
		}

		const adminUUID = await getUserUuid(adminUid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
		if (!adminUUID) {
			console.error('ERROR', '管理者がビデオコメントを削除するのに失敗しました、adminUUIDが存在しません', { adminUid })
			return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、adminUUIDが存在しません' }
		}

		const { commentRoute, videoId } = adminDeleteVideoCommentRequest
		const now = new Date().getTime()
		const { collectionName: videoCommentSchemaName, schemaInstance: videoCommentSchemaInstance } = VideoCommentSchema
		const { collectionName: removedVideoCommentSchemaName, schemaInstance: removedVideoCommentSchemaInstance } = RemovedVideoCommentSchema
		type VideoComment = InferSchemaType<typeof videoCommentSchemaInstance>
		type RemovedVideoComment = InferSchemaType<typeof removedVideoCommentSchemaInstance>

		const deleteSelfVideoCommentWhere: QueryType<VideoComment> | QueryType<RemovedVideoComment> = {
			commentRoute,
			videoId,
		}

		const deleteSelfVideoCommentSelect: SelectType<VideoComment> = {
			commentRoute: 1,
			videoId: 1,
			UUID: 1,
			uid: 1,
			emitTime: 1,
			text: 1,
			upvoteCount: 1,
			downvoteCount: 1,
			commentIndex: 1,
			subComments: 1,
			subCommentsCount: 1,
			editDateTime: 1,
		}

		try {
			const deleteSelfVideoCommentSelectResult = await selectDataFromMongoDB<VideoComment>(deleteSelfVideoCommentWhere, deleteSelfVideoCommentSelect, videoCommentSchemaInstance, videoCommentSchemaName)
			if (!deleteSelfVideoCommentSelectResult.success || !deleteSelfVideoCommentSelectResult.result || deleteSelfVideoCommentSelectResult.result.length !== 1) {
				console.error('管理者がビデオコメントを削除するのに失敗しました、ビデオコメントの検索結果が空または長さに制限を超えています')
				return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、ビデオコメントの検索結果が空または長さに制限を超えています' }
			}

			const session = await mongoose.startSession()
			session.startTransaction()
			try {
				const adminRemovedVideoCommentData: RemovedVideoComment = {
					...deleteSelfVideoCommentSelectResult.result[0],
					_operatorUUID_: adminUUID,
					_operatorUid_: adminUid,
					editDateTime: now,
				}
				const adminDeleteVideoCommentSaveResult = await insertData2MongoDB<VideoComment>(adminRemovedVideoCommentData, removedVideoCommentSchemaInstance, removedVideoCommentSchemaName, { session })
				if (!adminDeleteVideoCommentSaveResult.success) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('管理者がビデオコメントを削除するのに失敗しました、削除済みビデオコメントの保存に失敗しました')
					return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、記録に失敗しました' }
				}

				const deleteSelfVideoCommentDeleteResult = await deleteDataFromMongoDB<VideoComment>(deleteSelfVideoCommentWhere, videoCommentSchemaInstance, videoCommentSchemaName, { session })
				if (!deleteSelfVideoCommentDeleteResult.success) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('管理者がビデオコメントを削除するのに失敗しました、削除に失敗しました')
					return { success: false, message: '管理者がビデオコメントを削除するのに失敗しました、削除に失敗しました' }
				}

				await session.commitTransaction()
				session.endSession()
				return { success: true, message: '管理者がビデオコメントを削除するのに成功しました' }
			} catch (error) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('管理者がビデオコメントを削除する際にエラーが発生しました：削除済みビデオコメントの保存中にエラーが発生しました', error)
				return { success: false, message: '管理者がビデオコメントを削除する際にエラーが発生しました：記録を保存できません' }
			}
		} catch (error) {
			console.error('管理者がビデオコメントを削除する際にエラーが発生しました：ビデオコメントの検索中にエラーが発生しました', error)
			return { success: false, message: '管理者がビデオコメントを削除する際にエラーが発生しました：ビデオコメントの検索中にエラーが発生しました' }
		}
	} catch (error) {
		console.error('管理者がビデオコメントを削除する際にエラーが発生しました：不明なエラー', error)
		return { success: false, message: '管理者がビデオコメントを削除する際にエラーが発生しました：不明なエラー' }
	}
}

/**
 * @param emitVideoCommentRequest ビデオコメント
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkEmitVideoCommentRequest = (emitVideoCommentRequest: EmitVideoCommentRequestDto): boolean => {
	return (
		emitVideoCommentRequest.text && emitVideoCommentRequest.text.length < 20000 // ビデオコメント本文が空でなく、20000文字未満であること
		&& emitVideoCommentRequest.videoId !== undefined && emitVideoCommentRequest.videoId !== null // ビデオコメントにビデオIDが欠落していないこと
	)
}

/**
 * @param getVideoCommentUpvoteProps 特定のユーザーが特定のビデオのコメントに対して「いいね」を付けた状況を取得するためのパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetVideoCommentUpvoteProps = (getVideoCommentUpvoteProps: GetVideoCommentUpvotePropsDto): boolean => {
	return (
		getVideoCommentUpvoteProps.videoId !== undefined && getVideoCommentUpvoteProps.videoId !== null
		&& getVideoCommentUpvoteProps.uid !== undefined && getVideoCommentUpvoteProps.uid !== null
	)
}

/**
 * @param getVideoCommentDownvoteProps 特定のユーザーが特定のビデオのコメントに対して「よくないね」を付けた状況を取得するためのパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetVideoCommentDownvoteProps = (getVideoCommentDownvoteProps: GetVideoCommentDownvotePropsDto): boolean => {
	return (
		getVideoCommentDownvoteProps.videoId !== undefined && getVideoCommentDownvoteProps.videoId !== null
		&& getVideoCommentDownvoteProps.uid !== undefined && getVideoCommentDownvoteProps.uid !== null
	)
}

/**
 * KVIDに基づいてビデオコメントを取得するリクエストのパラメータを検証する
 * @param getVideoCommentByKvidRequest KVIDに基づいてビデオコメントを取得するリクエストのパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkGetVideoCommentByKvidRequest = (getVideoCommentByKvidRequest: GetVideoCommentByKvidRequestDto): boolean => {
	return (getVideoCommentByKvidRequest.videoId !== undefined && getVideoCommentByKvidRequest.videoId !== null)
}

/**
 * @param emitVideoCommentUpvoteRequest ユーザーがいいねを付けるリクエストパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkEmitVideoCommentUpvoteRequestData = (emitVideoCommentUpvoteRequest: EmitVideoCommentUpvoteRequestDto): boolean => {
	return (
		emitVideoCommentUpvoteRequest.videoId !== undefined && emitVideoCommentUpvoteRequest.videoId !== null
		&& !!emitVideoCommentUpvoteRequest.id
	)
}

/**
 * @param cancelVideoCommentUpvoteRequest ユーザーがいいねをキャンセルするリクエストパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCancelVideoCommentUpvoteRequest = (cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto): boolean => {
	return (
		cancelVideoCommentUpvoteRequest.videoId !== undefined && cancelVideoCommentUpvoteRequest.videoId !== null
		&& !!cancelVideoCommentUpvoteRequest.id
	)
}

/**
 * @param emitVideoCommentDownvoteRequest ユーザーがよくないねを付けるリクエストパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkEmitVideoCommentDownvoteRequestData = (emitVideoCommentDownvoteRequest: EmitVideoCommentDownvoteRequestDto): boolean => {
	return (
		emitVideoCommentDownvoteRequest.videoId !== undefined && emitVideoCommentDownvoteRequest.videoId !== null
		&& !!emitVideoCommentDownvoteRequest.id
	)
}

/**
 * @param cancelVideoCommentDownvoteRequest ユーザーがよくないねをキャンセルするリクエストパラメータ
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkCancelVideoCommentDownvoteRequest = (cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto): boolean => {
	return (
		cancelVideoCommentDownvoteRequest.videoId !== undefined && cancelVideoCommentDownvoteRequest.videoId !== null
		&& !!cancelVideoCommentDownvoteRequest.id
	)
}

/**
 * @param deleteSelfVideoCommentRequest ビデオコメントを削除するリクエストペイロード
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkDeleteSelfVideoCommentRequest = (deleteSelfVideoCommentRequest: DeleteSelfVideoCommentRequestDto): boolean => {
	return (
		deleteSelfVideoCommentRequest.videoId !== undefined && deleteSelfVideoCommentRequest.videoId !== null
		&& !!deleteSelfVideoCommentRequest.commentRoute
	)
}

/**
 * @param adminDeleteVideoCommentRequest 管理者がビデオコメントを削除するリクエストペイロード
 * @returns 検証結果、有効な場合はtrue、無効な場合はfalseを返す
 */
const checkAdminDeleteVideoCommentRequest = (adminDeleteVideoCommentRequest: AdminDeleteVideoCommentRequestDto): boolean => {
	return (
		adminDeleteVideoCommentRequest.videoId !== undefined && adminDeleteVideoCommentRequest.videoId !== null
		&& !!adminDeleteVideoCommentRequest.commentRoute
	)
}
