import mongoose, { ClientSession } from "mongoose"

/**
 * トランザクションを作成して開始します
 * @returns 既に開始されているトランザクション
 * @throws error トランザクションの作成または開始に失敗しました
 */
export const createAndStartSession = async (): Promise<ClientSession> => {
	try {
		const session = await mongoose.startSession()
		session.startTransaction()
		return session
	} catch (error) {
		throw new Error('MongoDBセッションの開始に失敗しました', error)
	}
}

/**
 * トランザクションをロールバックして終了します
 * @param session トランザクションセッション
 * @returns トランザクションのロールバックと終了に成功した場合はtrue、それ以外の場合はfalseを返します
 */
export const abortAndEndSession = async (session: ClientSession): Promise<boolean> => {
	if (!session) {
		return false
	}

	if (!session.inTransaction()) {
		return false
	}

	await session.abortTransaction()
	session.endSession()
	return true
}

/**
 * トランザクションをコミットして終了します
 * @param session トランザクションセッション
 * @returns トランザクションのコミットと終了に成功した場合はtrue、それ以外の場合はfalseを返します
 */
export const commitAndEndSession = async (session: ClientSession): Promise<boolean> => {
	if (!session) {
		return false
	}

	await session.commitTransaction()
	session.endSession()
}
