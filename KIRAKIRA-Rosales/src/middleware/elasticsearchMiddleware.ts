import { Client } from '@elastic/elasticsearch'
import { connectElasticSearchCluster } from '../elasticsearchPool/ElasticsearchClusterPool.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'

let client: Client
try {
	client = await connectElasticSearchCluster()
} catch (error) {
	console.error('ERROR', 'Elasticsearch クライアントの作成に失敗しました：', error)
	process.exit()
}

export default async function elasticsearchMiddleware(ctx: koaCtx, next: koaNext) {
	if (client) {
		ctx.elasticsearchClient = client
	} else {
		console.error('ERROR', 'Elasticsearch クライアントの作成に失敗しました：client が空です')
		process.exit()
	}
	await next()
}
