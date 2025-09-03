import { getStgEnvBackEndSecretService } from "../service/ConsoleSecretService.js"
import { isPassRbacCheck } from "../service/RbacService.js"
import { koaCtx, koaNext } from "../type/koaTypes.js"

/**
 * ステージング環境のバックエンド環境変数シークレットを取得
 * @param ctx context
 * @param next context
 */
export const getStgEnvBackEndSecretController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid') ?? ''
	const token = ctx.cookies.get('token') ?? ''

	// RBAC 権限検証
	if (!await isPassRbacCheck({ uuid, apiPath: ctx.path }, ctx)) {
		return
	}

	const getStgEnvBackEndSecretResponse = await getStgEnvBackEndSecretService(uuid, token)
	ctx.body = getStgEnvBackEndSecretResponse
	await next()
}
