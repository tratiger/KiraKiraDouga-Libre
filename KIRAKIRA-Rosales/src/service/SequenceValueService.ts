import { ClientSession } from 'mongoose'
import { getNextSequenceValuePool } from '../dbPool/DbClusterPool.js'

// NOTE: 自己増分シーケンスがデフォルトでスキップする値
const __DEFAULT_SEQUENCE_EJECT__: number[] = [9, 42, 233, 404, 2233, 10388, 10492, 114514]

/**
 * 自己増分IDの取得結果
 * @param success 実行結果。プログラムが正常に実行された場合はtrue、失敗した場合はfalseを返す
 * @param sequenceId 自己増分項目のID
 * @param sequenceValue 自己増分IDの値
 * @param message 追加情報
 */
type SequenceNumberResultType = {
	success: boolean;
	sequenceId?: string;
	sequenceValue?: number;
	message?: string;
}

/**
 * 自己増分シーケンスの次の値を取得する
 * @param sequenceId 自己増分シーケンスのキー
 * @param sequenceDefaultNumber シーケンスの初期値。デフォルト：0。シーケンスが既に作成されている場合は無効。この値は負数でもかまいません
 * @param sequenceStep シーケンスのステップ。デフォルト：1。このメソッドを呼び出すたびに異なるステップを指定できます。この値は負数でもかまいません
 * @param session トランザクション
 * @returns クエリのステータスと結果。自己増分シーケンスの次の値である必要があります
 */
export const getNextSequenceValueService = async (sequenceId: string, sequenceDefaultNumber: number = 0, sequenceStep: number = 1, session?: ClientSession): Promise<SequenceNumberResultType> => {
	try {
		if (sequenceId) {
			try {
				const getNextSequenceValue = await getNextSequenceValuePool(sequenceId, sequenceDefaultNumber, sequenceStep, { session })
				const sequenceValue = getNextSequenceValue?.result
				if (getNextSequenceValue.success && sequenceValue !== null && sequenceValue !== undefined) {
					return { success: true, sequenceId, sequenceValue, message: '自己増分IDの取得に成功しました' }
				} else {
					console.error('ERROR', 'プログラムエラー、取得した自己増分IDが空です', { error: getNextSequenceValue.error, message: getNextSequenceValue.message })
					return { success: false, sequenceId, message: 'プログラムエラー、取得した自己増分IDが異常です' }
				}
			} catch (error) {
				console.error('ERROR', '自己増分IDの取得に失敗しました、MongoDBへの自己増分IDデータクエリで例外が発生しました：', error)
				return { success: false, sequenceId, message: 'プログラムエラー、自己増分IDの保存・取得時に例外が発生しました' }
			}
		} else {
			console.error('ERROR', '自己増分IDの取得に失敗しました、必須パラメータsequenceIdが空です')
			return { success: false, message: 'プログラムエラー、自己増分IDの取得時に例外が発生しました、必須パラメータがありません' }
		}
	} catch (error) {
		console.error('ERROR', '自己増分IDの取得に失敗しました、getAndAddOneBySequenceIdが異常終了しました：', error)
		return { success: false, message: 'プログラムエラー、自己増分ID取得プログラムの実行中に例外が発生しました' }
	}
}

/**
 * 自己増分シーケンスの次の値を取得しますが、ejectで指定された配列内の「不正な値」をスキップして、次の「正当な」値まで自己増分できます
 * @param sequenceId 自己増分シーケンスのキー
 * @param eject シーケンス作成時に能動的にスキップする数値の配列。この関数を呼び出すたびに指定する必要があります。指定しない場合は__DEFAULT_SEQUENCE_EJECT__がデフォルトのスキップ配列として使用されます
 * @param sequenceDefaultNumber シーケンスの初期値。デフォルト：0。シーケンスが既に作成されている場合は無効。この値は負数でもかまいません
 * @param sequenceStep シーケンスのステップ。デフォルト：1。このメソッドを呼び出すたびに異なるステップを指定できます。この値は負数でもかまいません
 * @param session トランザクション
 * @returns クエリのステータスと結果。自己増分シーケンスの次の値である必要があります
 */
export const getNextSequenceValueEjectService = async (sequenceId: string, eject: number[] = __DEFAULT_SEQUENCE_EJECT__, sequenceDefaultNumber: number = 0, sequenceStep: number = 1, session?: ClientSession): Promise<SequenceNumberResultType> => {
	try {
		let getNextSequenceValueServiceResult: SequenceNumberResultType
		let nextSequenceValue: number
		do {
			getNextSequenceValueServiceResult = await getNextSequenceValueService(sequenceId, sequenceDefaultNumber, sequenceStep, session)
			nextSequenceValue = getNextSequenceValueServiceResult?.sequenceValue

			// 取得に失敗した場合や返された値が空の場合は、ループを直接抜けます
			if (!getNextSequenceValueServiceResult.success || nextSequenceValue === null || nextSequenceValue === undefined) {
				console.error('ERROR', '自己増分IDのループ取得中に例外が発生しました、データが異常です')
				return { success: false, sequenceId, message: '自己増分IDのループ取得中に例外が発生しました、返された結果が空または失敗した可能性があります' }
			}
		} while (eject && eject.includes(nextSequenceValue))
		return { success: true, sequenceId, sequenceValue: nextSequenceValue, message: '自己増分シーケンスの取得に成功しました' }
	} catch (error) {
		console.error('ERROR', '自己増分IDのループ取得中に例外が発生しました')
		return { success: false, sequenceId, message: '自己増分IDのループ取得プログラムの実行中に例外が発生しました' }
	}
}




