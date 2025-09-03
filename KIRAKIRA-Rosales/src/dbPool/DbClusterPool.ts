import { ReadPreferenceMode } from 'mongodb'
import mongoose, { AnyKeys, ClientSession, InferSchemaType, Model, PipelineStage, Schema } from 'mongoose'
import { DbPoolResultsType, DbPoolResultType, OrderByType, QueryType, SelectType, UpdateResultType, UpdateType } from './DbClusterPoolTypes.js'
import { SequenceValueSchema } from './schema/SequenceSchema.js'
import { UserInfoSchema, UserTotpAuthenticatorSchema } from './schema/UserSchema.js'

/**
 * 仮想プロパティ、関連クエリ用
 *
 * @example 仮想プロパティ 'uploader' を定義し、ユーザー名で関連付けます（SQL JOINのように理解できます）
 * videoSchema.virtual('uploader', {
 *   ref: 'User', // Userモデルに関連付け
 *   localField: 'uploaderUsername', // Videoモデルの関連付け用フィールド
 *   foreignField: 'username', // Userモデルの関連付け用フィールド
 *   justOne: true // ユーザーのドキュメントを1つだけ返します
 * });
 * const Video = mongoose.model('Video', videoSchema);
 *
 * // クエリ時にpopulateメソッドを使用してこの仮想プロパティを照会します
 * Video.find().populate('uploader')
 *
 */
type MongoDBVirtualSettingType<T, P> = {
	name: string; // 仮想プロパティ名
	options: {
		ref: string; // 関連付けられたサブモデル
		localField: Extract<keyof T, string>; // 親モデルの関連付け用フィールド
		foreignField: Extract<keyof P, string>; // サブモデルの関連付け用フィールド
		justOne: boolean; // trueの場合、1つのデータに1つのドキュメントのみを関連付けます（条件に合うものが多数あっても）
	};
	// model: {
	// 	modelName: string;
	// 	model: Model<P>;
	// };
}

/** 基本的なMongooseオプション */
type BaseDbPoolOptions = {
		/** トランザクションのセッション */
		session?: ClientSession;
		/** 読み取り優先設定。接続作成時の読み取り優先設定を上書きします。sessionが空でない場合、readPreferenceはprimaryに設定する必要があります（通常は自動設定） */
		readPreference?: ReadPreferenceMode;
}

/** どの型にも現れないユニークな型を識別子として定義します */
type DbPoolOptionsMarkerType = { __FLAG_DB_POOL_OPTIONS_MARKER_TYPE_F6WEISS8900SWEDE5URV3KCAL98HBY8PG5JP4Y5XK1OOXXNBWJ70NVR4SURCOAT3SIB9AXML3Y4LXRCWNOGDH7CRKGNUIGJ7O5__: never } // どの型にも現れないユニークな型を識別子として定義します

/** Mongooseオプション */
export type DbPoolOptions<T = unknown, P = DbPoolOptionsMarkerType> =
	P extends DbPoolOptionsMarkerType ?
		BaseDbPoolOptions
	:
		BaseDbPoolOptions & {
			/** 仮想プロパティ、関連クエリ用 // WARN 何をしているか理解している場合を除き、設定しないでください！ */
			virtual?: MongoDBVirtualSettingType<T, P>;
			/** populateメソッドで関連付けられる仮想プロパティ名、関連クエリ用 // WARN 何をしているか理解している場合を除き、設定しないでください！ */
			populate?: MongoDBVirtualSettingType<T, P>['name'];
		}

/**
 * MongoDBレプリカセットに接続します。このメソッドはシステム初期化時に呼び出すべきです
 */
export const connectMongoDBCluster = async (): Promise<void> => {
	try {
		const databaseProtocol = process.env.MONGODB_PROTOCOL
		const databaseHost = process.env.MONGODB_CLUSTER_HOST
		const databaseTlsCa = process.env.MONGODB_TLS_CA_BASE64 ? Buffer.from(process.env.MONGODB_TLS_CA_BASE64, 'base64').toString('utf-8') : ''
		const databaseTlsCert = process.env.MONGODB_TLS_CERT_BASE64 ? Buffer.from(process.env.MONGODB_TLS_CERT_BASE64, 'base64').toString('utf-8') : ''
		const databaseTlsKey = process.env.MONGODB_TLS_KEY_BASE64 ? Buffer.from(process.env.MONGODB_TLS_KEY_BASE64, 'base64').toString('utf-8') : ''
		const databaseName = process.env.MONGODB_NAME
		const databaseUsername = process.env.MONGODB_USERNAME
		const databasePassword = process.env.MONGODB_PASSWORD

		if (!databaseHost) {
			console.error('ERROR', 'データベース接続の作成に失敗しました。databaseHostが空です')
			process.exit()
		}
		if (!databaseName) {
			console.error('ERROR', 'データベース接続の作成に失敗しました。databaseNameが空です')
			process.exit()
		}
		if (!databaseUsername) {
			console.error('ERROR', 'データベース接続の作成に失敗しました。databaseUsernameが空です')
			process.exit()
		}
		if (!databasePassword) {
			console.error('ERROR', 'データベース接続の作成に失敗しました。databasePasswordが空です')
			process.exit()
		}

		const protocol = databaseProtocol === 'mongodb+srv' ? 'mongodb+srv' : 'mongodb'
		const mongoURL = `${protocol}://${databaseUsername}:${databasePassword}@${databaseHost}/${databaseName}?authSource=admin`

		const connectionOptions = {
			readPreference: ReadPreferenceMode.secondaryPreferred, // デフォルトの読み取り優先設定はセカンダリからの読み取りを優先しますが、トランザクション使用時など特定の状況ではプライマリからの読み取りが優先されます。
		}

		if (databaseProtocol === 'mongodb+srv' && !databaseTlsCa) {
			connectionOptions['tlsAllowInvalidCertificates'] = true
			console.warn('WARN', 'WARNING', "Your MongoDB connection protocol is 'mongodb+srv', but can not find any TLS credentials. Communications with the database may be eavesdropped!")
		}

		if (databaseTlsCa && databaseTlsCert && databaseTlsKey) {
			connectionOptions['tls'] = true
			connectionOptions['ca'] = databaseTlsCa
			connectionOptions['cert'] = databaseTlsCert
			connectionOptions['key'] = databaseTlsKey
			connectionOptions['tlsAllowInvalidCertificates'] = false
		}

		try {
			mongoose.set('strictQuery', true) // trueに設定すると、クエリ時にスキーマで定義されていないフィールドが渡された場合、それらのフィールドは無視されます
			await mongoose.connect(mongoURL, connectionOptions)

			// ここに事前に登録が必要なModelを配置します
			// ユーザー情報は、他のテーブルがMongooseの仮想プロパティを使用してユーザー情報データを関連付けられるように、事前に登録する必要があります
			mongoose.model(UserInfoSchema.collectionName, UserInfoSchema.schemaInstance)
			// ユーザのTOTP認証コレクションは事前に登録する必要があり、そうしないとトランザクション実行時にエラーが発生します。
			mongoose.model(UserTotpAuthenticatorSchema.collectionName, UserTotpAuthenticatorSchema.schemaInstance)

			console.info()
			console.info('MongoDB Cluster Connect successfully!')
		} catch (error) {
			console.error('ERROR', 'データベース接続の作成に失敗しました：', error)
			process.exit()
		}
	} catch (error) {
		console.error('ERROR', 'データベース接続の作成に失敗しました：connectMongoDBClusterが予期せず終了しました：', error)
		process.exit()
	}
}

/**
 * データベースにデータを挿入します
 * @param data 挿入されるデータ
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データが挿入されるMongoDBコレクションの名前（単数名詞を入力すると、自動的に複数形のコレクション名が作成されます）
 * @param options 設定項目
 * @returns データ挿入のステータスと結果
 */
export const insertData2MongoDB = async <T, P = DbPoolOptionsMarkerType>(data: T, schema: Schema, collectionName: string, options?: DbPoolOptions<T, P>): Promise< DbPoolResultsType<T & {_id: string}> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}
		mongoModel.createIndexes()
		const model = new mongoModel(data)
		try {
			const result = await model.save(options) as unknown as T & {_id: string}
			return { success: true, message: 'データ挿入成功', result: [result] }
		} catch (error) {
			console.error('ERROR', 'データ挿入失敗：', error)
			throw { success: false, message: 'データ挿入失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'insertData2MongoDBでエラーが発生しました')
		throw { success: false, message: 'データ挿入失敗、insertData2MongoDBでエラーが発生しました：', error }
	}
}

/**
 * MongoDBデータベースからデータを削除します
 * @param where クエリ条件
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ削除時に使用するMongoDBコレクションの名前（単数名詞を入力すると、自動的に複数形のコレクション名が作成されます）
 * @param options 設定項目
 * @returns 削除ステータスと結果
 */
export const deleteDataFromMongoDB = async <T, P = DbPoolOptionsMarkerType>(where: QueryType<T>, schema: Schema<T>, collectionName: string, options?: DbPoolOptions<T, P>): Promise< DbPoolResultType<mongoose.mongo.DeleteResult> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}

		try {
			const result = await mongoModel.deleteOne(where, options)
			return { success: true, message: 'データクエリ成功', result }
		} catch (error) {
			console.error('ERROR', 'データクエリ失敗：', error)
			throw { success: false, message: 'データクエリ失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'selectDataFromMongoDBでエラーが発生しました')
		throw { success: false, message: 'データクエリ失敗、selectDataFromMongoDBでエラーが発生しました：', error }
	}
}

/**
 * MongoDBデータベースでデータを検索します
 * @param where クエリ条件
 * @param select プロジェクション（SQLのSELECT句と理解できます）
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ検索時に使用するMongoDBコレクションの名前（単数名詞を入力すると、自動的に複数形のコレクション名が作成されます）
 * @param options 設定項目
 * @returns クエリのステータスと結果
 */
/** ページネーションクエリ */
type Pagination = {
	/** 現在のページ番号 */
	page: number;
	/** 1ページあたりの表示件数 */
	pageSize: number;
}
export const selectDataFromMongoDB = async <T, P = DbPoolOptionsMarkerType>(where: QueryType<T>, select: SelectType<T>, schema: Schema<T>, collectionName: string, options?: DbPoolOptions<T, P>, sort?: OrderByType<T>, pagination?: Pagination): Promise< DbPoolResultsType<T> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		if (options && 'virtual' in options && options.virtual) {
			if (mongoose.models[options.virtual.options.ref]) {
				schema.virtual(options.virtual.name, options.virtual.options)
			}
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}

		let pageSize = undefined
		let skip = 0
		if (pagination && pagination.page > 0 && pagination.pageSize > 0) {
			skip = (pagination.page - 1) * pagination.pageSize
			pageSize = pagination.pageSize
		}

		try {
			let result
			if (options && 'populate' in options && options.populate) {
				result = (await mongoModel.find(where, select, options).populate({ path: options.populate, strictPopulate: false }).sort(sort).skip(skip).limit(pageSize)).map(results => results.toObject({ virtuals: true }) as T)
			} else {
				result = (await mongoModel.find(where, select, options).sort(sort).skip(skip).limit(pageSize)).map(results => results.toObject() as T)
			}
			return { success: true, message: 'データクエリ成功', result }
		} catch (error) {
			console.error('ERROR', 'データクエリ失敗：', error)
			throw { success: false, message: 'データクエリ失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'selectDataFromMongoDBでエラーが発生しました')
		throw { success: false, message: 'データクエリ失敗、selectDataFromMongoDBでエラーが発生しました：', error }
	}
}

/**
 * MongoDBデータベースでAggregateを使用してデータを検索します
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ検索時に使用するMongoDBコレクションの名前（単数名詞を入力すると、自動的に複数形のコレクション名が作成されます）
 * @param props 集計クエリのステップ
 * @returns クエリのステータスと結果
 */
export const selectDataByAggregateFromMongoDB = async <T>(schema: Schema<T>, collectionName: string, props: PipelineStage[]): Promise< DbPoolResultsType<T> > => {
	try {
		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}

		try {
			const result = (await mongoModel.aggregate(props)) as T[]
			return { success: true, message: 'データ集計クエリ成功', result }
		} catch (error) {
			console.error('ERROR', 'データ集計クエリ失敗：', error)
			throw { success: false, message: 'データ集計クエリ失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'selectDataByAggregateFromMongoDBでエラーが発生しました')
		throw { success: false, message: 'データ集計クエリ失敗、selectDataByAggregateFromMongoDBでエラーが発生しました：', error }
	}
}

/**
 * データベースのデータを更新します
 * @param where クエリ条件
 * @param update 更新が必要なデータ
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ検索時に使用するMongoDBコレクションの名前（単数名詞を入力すると、自動的に複数形のコレクション名が作成されます）
 * @param options 設定項目
 * @returns データ更新の結果
 */
export const updateData4MongoDB = async <T, P = DbPoolOptionsMarkerType>(where: QueryType<T>, update: UpdateType<T>, schema: Schema<T>, collectionName: string, options?: DbPoolOptions<T, P>): Promise<UpdateResultType> => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}
		try {
			const updateResult = await mongoModel.updateMany(where, { $set: update }, options)
			const acknowledged = updateResult.acknowledged
			const matchedCount = updateResult.matchedCount
			const modifiedCount = updateResult.modifiedCount
			if (acknowledged && matchedCount > 0) {
				if (modifiedCount > 0) {
					return { success: true, message: 'データ更新成功', result: { acknowledged, matchedCount, modifiedCount } }
				} else {
					console.warn('WARN', 'WARNING', 'データに一致し更新を試みましたが、データは更新されませんでした（更新不要）。更新前後の値が同じ可能性があります', { where, update })
					return { success: true, message: 'データの更新を試みましたが、更新は不要でした', result: { acknowledged, matchedCount, modifiedCount } }
				}
			} else {
				console.warn('ERROR', 'データの更新を試みましたが、一致するデータが見つからなかったため失敗しました', { where, update })
				return { success: false, message: 'データの更新を試みましたが、一致するデータが見つからなかったため失敗した可能性があります', result: { acknowledged, matchedCount, modifiedCount } }
			}
		} catch (error) {
			console.error('ERROR', 'データ更新失敗：', error, { where, update })
			throw { success: false, message: 'データ更新失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'データ更新失敗、不明なエラー')
		throw { success: false, message: 'データ更新失敗、updateData4MongoDBでエラーが発生しました：', error }
	}
}

/**
 * データベースから一致するデータを1件探し更新後、結果を返します // WARN: ビジネスロジックでクエリ条件が複数件に一致しないようにしてください。複数件一致した場合、最初の1件のみが更新され、データ不整合の原因となります！
 * @param where クエリ条件 // WARN: ビジネスロジックでクエリ条件が複数件に一致しないようにしてください。複数件一致した場合、最初の1件のみが更新され、データ不整合の原因となります！
 * @param update 更新が必要なデータ
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ検索時に使用するMongoDBコレクションの名前（単数名詞を入力すると自動的に複数形になります）、スキーマと一致させる必要があります
 * @param options 設定項目
 * @param upsert 見つからない場合に作成するかどうか（デフォルトで作成）
 * @returns 更新後のデータ
 */
export const findOneAndUpdateData4MongoDB = async <T, P = DbPoolOptionsMarkerType>(where: QueryType<T>, update: UpdateType<T>, schema: Schema<T>, collectionName: string, options?: DbPoolOptions<T, P>, upsert: boolean = true): Promise< DbPoolResultType<T> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}
		try {
			const updateResult = (await mongoModel.findOneAndUpdate(where, { $set: update }, { new: true, upsert, ...options }))?.toObject() as T

			if (updateResult) {
				return { success: true, message: 'データ更新成功', result: updateResult }
			} else {
				console.warn('ERROR', 'データ更新失敗、返された結果がありません', { where, update })
				return { success: false, message: 'データ更新失敗、返された結果がありません' }
			}
		} catch (error) {
			console.error('ERROR', 'データ更新失敗：', error, { where, update })
			throw { success: false, message: 'データ更新失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'データ更新失敗、不明なエラー')
		throw { success: false, message: 'データ更新失敗、findOneAndUpdateData4MongoDBでエラーが発生しました：', error }
	}
}

/**
 * 自動インクリメントシーケンスの次の値を作成または取得し、インクリメントします
 * // WARN: 自動インクリメント値を取得するには、Pool層を直接呼び出すのではなく、SequenceValueServiceのgetNextSequenceValueEjectServiceメソッドまたはgetNextSequenceValueServiceメソッドを呼び出してください
 * @param sequenceId 自動インクリメントシーケンスのキー
 * @param sequenceDefaultNumber シーケンスの初期値。デフォルト: 0。シーケンスが既に作成されている場合は無効。負の値も可能です
 * @parma sequenceStep シーケンスのステップ長。デフォルト: 1。このメソッドを呼び出すたびに異なるステップ長を指定できます。負の値も可能です
 * @param options 設定項目
 * @returns クエリのステータスと結果。自動インクリメントシーケンスの次の値である必要があります
 */
export const getNextSequenceValuePool = async (sequenceId: string, sequenceDefaultNumber: number = 0, sequenceStep: number = 1, options?: DbPoolOptions): Promise< DbPoolResultType<number> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		const { collectionName, schemaInstance } = SequenceValueSchema
		type Schema = InferSchemaType<typeof schemaInstance>
		let mongoModel: Model<Schema>

		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model(collectionName, schemaInstance)
		}
		try {
			let sequenceDocument = await mongoModel.findOne({ _id: sequenceId })
			if (!sequenceDocument) {
				sequenceDocument = await mongoModel.findOneAndUpdate(
					{ _id: sequenceId },
					{ $inc: { sequenceValue: sequenceDefaultNumber } }, // ドキュメントが初めて作成されるとき、ステップ長を設定することで初期値を設定します
					{ upsert: true, new: true, ...options },
				)
			} else {
				sequenceDocument = await mongoModel.findOneAndUpdate(
					{ _id: sequenceId },
					{ $inc: { sequenceValue: sequenceStep } }, // ドキュメントが既に存在する場合、ステップ長を1倍だけ増やします
					{ new: true, ...options },
				)
			}
			if (sequenceDocument.sequenceValue !== undefined && !sequenceDocument.sequenceValue !== null) {
				return { success: true, message: '自動インクリメントIDのクエリ成功', result: sequenceDocument.sequenceValue as number }
			} else {
				console.error('ERROR', '自動インクリメントIDのクエリ結果が空です：')
				throw { success: false, message: '自動インクリメントIDのクエリ結果が空です' }
			}
		} catch (error) {
			console.error('ERROR', '自動インクリメントIDのクエリ失敗：', error)
			throw { success: false, message: '自動インクリメントIDのクエリ失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'getNextSequenceValuePoolでエラーが発生しました')
		throw { success: false, message: '自動インクリメントIDのクエリ時にエラーが発生しました', error }
	}
}

/**
 * 指定されたスキーマとコレクション名で、MongoDBの一意のIDによって値を見つけ、自動インクリメントします
 * @param mongodbId MongoDBの一意のID
 * @param key 検索されたMongoDBドキュメント内の自動インクリメントされる項目
 * @param schema MongoDBスキーマオブジェクト
 * @param collectionName データ検索時に使用するMongoDBコレクションの名前（単数名詞を入力すると自動的に複数形になります）、スキーマと一致させる必要があります
 * @parma sequenceStep 自動インクリメントのステップ長。デフォルト: 1。呼び出しごとに異なるステップ長を指定でき、負の値も可能です
 * @param options 設定項目
 * @returns クエリのステータスと結果。成功した場合、自動インクリメントシーケンスの次の値である必要があります
 */
type KeysMatching<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]
export const findOneAndPlusByMongodbId = async <T extends Record<string, unknown>, U extends KeysMatching<T, number>, P = unknown>(mongodbId: string, key: U, schema: Schema<T>, collectionName: string, sequenceStep: number = 1, options?: DbPoolOptions<T, P>): Promise< DbPoolResultType<number> > => {
	try {
		// トランザクションセッションが存在するか確認し、存在する場合はreadPreferenceを'primary'に設定します
		if (options?.session) {
			options.readPreference = 'primary'
		}

		let mongoModel: Model<T>
		// モデルが既に存在するか確認します
		if (mongoose.models[collectionName]) {
			mongoModel = mongoose.models[collectionName]
		} else {
			mongoModel = mongoose.model<T>(collectionName, schema)
		}
		try {
			const sequenceDocument = await mongoModel.findOneAndUpdate(
				{ _id: mongodbId },
				{ $inc: ({ [key]: sequenceStep }) as AnyKeys<T> }, // key: 自動インクリメントキー; sequenceStep: ステップ長（負数も可）
				{ new: false, options },
			)
			return { success: true, message: '自動インクリメント成功', result: sequenceDocument.sequenceValue as number }
		} catch (error) {
			console.error('ERROR', '自動インクリメント失敗：', error)
			throw { success: false, message: '自動インクリメント失敗', error }
		}
	} catch (error) {
		console.error('ERROR', 'findOneAndPlusByMongodbId でエラーが発生しました')
		throw { success: false, message: '自動インクリメント時にエラーが発生しました', error }
	}
}
