import { Client } from '@elastic/elasticsearch'
import { isEmptyObject } from '../common/ObjectTool.js'
import { EsResultType, EsSchema2TsType } from './ElasticsearchClusterPoolTypes.js'
import type { estypes } from '@elastic/elasticsearch';

type QueryDslQueryContainer = estypes.QueryDslQueryContainer;
/**
 * Elasticsearch接続を作成します。この関数はアプリケーションのライフサイクルで一度だけ呼び出されるべきです（only in elasticsearchMiddleware.ts）
 * @returns Elasticsearchクライアント接続
 */
export const connectElasticSearchCluster = async (): Promise<Client> => {
	try {
		const ELASTICSEARCH_ADMIN_USERNAME = process.env.ELASTICSEARCH_ADMIN_USERNAME
		const ELASTICSEARCH_ADMIN_PASSWORD = process.env.ELASTICSEARCH_ADMIN_PASSWORD
		const ELASTICSEARCH_CLUSTER_HOST = process.env.ELASTICSEARCH_CLUSTER_HOST

		if (!ELASTICSEARCH_ADMIN_USERNAME) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：ELASTICSEARCH_ADMIN_USERNAMEが空です。環境変数の設定を確認してください')
			process.exit()
		}
		if (!ELASTICSEARCH_ADMIN_PASSWORD) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：ELASTICSEARCH_ADMIN_PASSWORDが空です。環境変数の設定を確認してください')
			process.exit()
		}
		if (!ELASTICSEARCH_CLUSTER_HOST) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：ELASTICSEARCH_CLUSTER_HOSTが空です。環境変数の設定を確認してください')
			process.exit()
		}

		const ELASTICSEARCH_CLUSTER_HOST_LIST = ELASTICSEARCH_CLUSTER_HOST?.split(',')?.map(host => `https://${host}`)

		if (!ELASTICSEARCH_CLUSTER_HOST_LIST || ELASTICSEARCH_CLUSTER_HOST_LIST?.length <= 0) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：ELASTICSEARCH_CLUSTER_HOST_LISTが空です。環境変数の設定を確認してください。クラスターアドレスはカンマで区切られたクラスターアドレスとポート番号で構成する必要があります。例：XXX.XXX.XXX.XXX:32000,YYY.YYY.YYY.YYY:32000,ZZZ.ZZZ.ZZZ.ZZZ:32000')
			process.exit()
		}

		const client = new Client({
			node: ELASTICSEARCH_CLUSTER_HOST_LIST,
			auth: {
				username: ELASTICSEARCH_ADMIN_USERNAME,
				password: ELASTICSEARCH_ADMIN_PASSWORD,
			},
			tls: {
				rejectUnauthorized: false, // これによりSSL証明書の検証が無視されます
			},
		})

		try {
			await client.ping()
		} catch (error) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：PINGがエラーを返しました：', error)
			process.exit()
		}

		try {
			const elasticsearchClusterInfoResult = await client.info()
			console.info()
			console.info('Elasticsearch Cluster Connect successfully!')
			console.info(`cluster_name: ${elasticsearchClusterInfoResult?.cluster_name}, cluster_uuid: ${elasticsearchClusterInfoResult?.cluster_uuid}, current_connect_name: ${elasticsearchClusterInfoResult?.name}, version: ${elasticsearchClusterInfoResult?.version?.number}, tagline: ${elasticsearchClusterInfoResult?.tagline}`)
		} catch (error) {
			console.error('ERROR', '検索エンジンクラスターの作成または接続に失敗しました：INFOがエラーを返しました：', error)
			process.exit()
		}

		return client
	} catch (error) {
		console.error('ERROR', '検索エンジン接続の作成に失敗しました：connectElasticSearchClusterが予期せず終了しました：', error)
		process.exit()
	}
}

/**
 * データベースクラスターからドキュメントを削除します
 * @param client Elasticsearch接続。ctxに保存されているべきです
 * @param indexName インデックス名。このフィールドはスキーマと同じオブジェクトに配置する必要があります（スキーマとインデックス名が関連付けられるため）
 * @param conditions データ削除の条件
 * @returns 削除結果。成功した場合はtrue、失敗した場合はfalseを返します
 */
export const deleteDataFromElasticsearchCluster = async (client: Client, indexName: string, conditions: Record<string, string | number>): Promise<boolean> => {
	try {
		// boolクエリ条件を構築します
		const mustConditions = Object.keys(conditions).map(field => ({
			match: { [field]: conditions[field] },
		}))

		// 条件に一致するドキュメントを検索します
		const searchResponse = await client.search({
			index: indexName,
			body: {
				query: {
					bool: {
						must: mustConditions,
					},
				},
			},
		})

		// レスポンスにhitsが含まれていることを確認します
		if (searchResponse.hits && searchResponse.hits.hits) {
			// 検索結果をループして各ドキュメントを削除します
			const hits = searchResponse.hits.hits
			for (const hit of hits) {
				await client.delete({
					index: indexName,
					id: hit._id,
				})
			}
			return true
		} else {
			console.error('ERROR', 'No documents found matching the conditions.')
			return false
		}
	} catch (error) {
		console.error('ERROR', '検索エンジンでのデータ削除中に不明なエラーが発生しました', error)
		return false
	}
}

/**
 * Elasticsearchクラスターにデータを挿入し、リフレッシュします（refreshFlagがtrueの場合は即時リフレッシュ、デフォルトはfalseでクラスターの自動リフレッシュを待ちます）
 * @param client Elasticsearch接続。ctxに保存されているべきです
 * @param indexName インデックス名。このフィールドはスキーマと同じオブジェクトに配置する必要があります（スキーマとインデックス名が関連付けられるため）
 * @param schema 挿入するインデックスのスキーマ（Elasticsearchではインデックス・テンプレートと呼びます）。主な機能はジェネリックTを提供し、dataの型を限定することです。このフィールドはindexNameと同じオブジェクトに配置する必要があります
 * @param data 挿入するデータ。型はスキーマの型から推論されます
 * @param refreshFlag データ挿入後に即時リフレッシュするかどうか（高並列処理のシナリオでは非推奨）
 * @returns 挿入結果。成功した場合は {success: true}、それ以外は {success: false} を返します
 */
export const insertData2ElasticsearchCluster = async <T>(client: Client, indexName: string, schema: T, data: EsSchema2TsType<T>, refreshFlag: boolean = false): Promise< EsResultType< EsSchema2TsType<T> > > => {
	try {
		if (!isEmptyObject(schema as object) && !isEmptyObject(data) && indexName && client && !isEmptyObject(client)) {
			try {
				const indexResult = await client.index< EsSchema2TsType<T> >({
					index: indexName,
					document: data,
				})
				if (indexResult && indexResult.result) {
					if (refreshFlag) {
						// データインデックス後、手動でrefreshを実行すると検索結果に表示されます。手動で実行しない場合、クラスターは一定時間ごとに自動で実行します
						try {
							const refreshResult = await client.indices.refresh({ index: indexName })
							if (refreshResult) {
								return { success: true, message: 'Elasticsearchへのデータ挿入に成功し、手動リフレッシュにも成功しました', result: [indexResult.result] as unknown as EsSchema2TsType<T>[] }
							} else {
								return { success: true, message: 'Elasticsearchへのデータ挿入に成功しましたが、リフレッシュ結果が空です', result: [indexResult.result] as unknown as EsSchema2TsType<T>[] }
							}
						} catch (error) {
							console.warn('WARN', 'WARNING', 'Elasticsearchへのデータ挿入に成功しましたが、リフレッシュ時にエラーが発生しました', error)
							return { success: true, message: 'Elasticsearchへのデータ挿入に成功しましたが、リフレッシュ時にエラーが発生しました', result: [indexResult.result] as unknown as EsSchema2TsType<T>[] }
						}
					} else {
						return { success: true, message: 'Elasticsearchへのデータ挿入に成功しました。自動リフレッシュをお待ちください', result: [indexResult.result] as unknown as EsSchema2TsType<T>[] }
					}
				} else {
					console.error('ERROR', 'Elasticsearchへのデータ挿入中にエラーが発生しました。インデックス結果が異常です')
					return { success: false, message: 'Elasticsearchへのデータ挿入中にエラーが発生しました。インデックス結果が異常です' }
				}
			} catch (error) {
				console.error('ERROR', 'Elasticsearchへのデータ挿入中にエラーが発生しました。インデックス中にエラーが発生しました', error)
				return { success: false, message: 'Elasticsearchへのデータ挿入中にエラーが発生しました。インデックス中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', 'Elasticsearchへのデータ挿入中にエラーが発生しました。schema、data、indexName、またはclientが空です')
			return { success: false, message: 'Elasticsearchへのデータ挿入中にエラーが発生しました。必要なデータが空です' }
		}
	} catch (error) {
		console.error('ERROR', 'Elasticsearchへのデータ挿入中に不明なエラーが発生しました', error)
		return { success: false, message: 'Elasticsearchへのデータ挿入中に不明なエラーが発生しました' }
	}
}

/**
 * Elasticsearchクラスターからデータを検索します
 * @param client Elasticsearch接続。ctxに保存されているべきです
 * @param indexName インデックス名。このフィールドはスキーマと同じオブジェクトに配置する必要があります（スキーマとインデックス名が関連付けられるため）
 * @param schema 挿入するインデックスのスキーマ（Elasticsearchではインデックス・テンプレートと呼びます）。主な機能はジェネリックTを提供し、dataの型を限定することです。このフィールドはindexNameと同じオブジェクトに配置する必要があります
 * @param query クエリパラメータ。データベースのWHEREに似ていますが、Elasticsearch独自のロジックがあるため、公式ドキュメントを参照することをお勧めします。
 * @returns クエリ結果
 */
export const searchDataFromElasticsearchCluster = async <T>(client: Client, indexName: string, schema: T, query: QueryDslQueryContainer): Promise< EsResultType< EsSchema2TsType<T> > > => {
	try {
		if (client && !isEmptyObject(client) && indexName && schema && !isEmptyObject(schema as object) && query && !isEmptyObject(query)) {
			try {
				const result = await client.search({
					index: indexName,
					query,
				})
				if (result && !isEmptyObject(result) && !result.timed_out) {
					const hits = result?.hits?.hits
					if (hits?.length && hits.length > 0) {
						return { success: true, message: 'Elasticsearchでの検索に成功しました', result: hits.map(hit => hit._source as EsSchema2TsType<T>) }
					} else {
						return { success: true, message: 'Elasticsearchでの検索に成功しましたが、結果はありませんでした', result: [] }
					}
				} else {
					console.error('ERROR', 'Elasticsearchでのデータ検索に失敗しました。結果が空か異常です')
					return { success: false, message: 'Elasticsearchでのデータ検索に失敗しました。結果が空か異常です' }
				}
			} catch (error) {
				console.error('ERROR', 'Elasticsearchでのデータ検索に失敗しました。検索中にエラーが発生しました', error)
				return { success: false, message: 'Elasticsearchでのデータ検索に失敗しました。検索中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', 'Elasticsearchでのデータ検索に失敗しました。必要なパラメータが空です')
			return { success: false, message: 'Elasticsearchでのデータ検索に失敗しました。必要なパラメータが空です' }
		}
	} catch (error) {
		console.error('ERROR', 'Elasticsearchでのデータ検索に失敗しました。不明なエラーです', error)
		return { success: false, message: 'Elasticsearchでのデータ検索に失敗しました。不明なエラーです' }
	}
}





