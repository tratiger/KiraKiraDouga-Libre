import { GetStgEnvBackEndSecretResponse } from "../controller/ConsoleSecretControllerDto.js";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { checkUserTokenByUuidService } from "./UserService.js";

let client: SecretsManagerClient

const SERVER_ENV = process.env.SERVER_ENV

const AWS_SECRET_REGION = process.env.AWS_SECRET_REGION
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_SECRET_ACCESS_SECRET = process.env.AWS_SECRET_ACCESS_SECRET
const AWS_SECRET_NAME = process.env.AWS_SECRET_NAME

if (!!SERVER_ENV && ['dev', 'prod'].includes(SERVER_ENV)) {
	try {
		if (!AWS_SECRET_REGION || !AWS_SECRET_ACCESS_KEY || !AWS_SECRET_ACCESS_SECRET) {
			console.error("ERROR", "AWS認証情報が不足しています。環境変数 AWS_SECRET_REGION、AWS_SECRET_ACCESS_KEY、AWS_SECRET_ACCESS_SECRET を確認してください。")
			process.exit()
		}
	
		// AWS Secrets Manager クライアントを作成
		client = new SecretsManagerClient({
			region: AWS_SECRET_REGION, // カスタムAWSリージョン
			credentials: {
				accessKeyId: AWS_SECRET_ACCESS_KEY, // カスタムアクセスキー
				secretAccessKey: AWS_SECRET_ACCESS_SECRET, // カスタムシークレットキー
			},
		})
	
		console.info()
		console.info('環境変数に基づいてAWS Secret Managerクライアントを作成しました！')
	} catch(error) {
		console.error('ERROR', 'AWS Secrets Manager クライアントの作成に失敗しました：', error)
		process.exit()
	}
} else {
	console.info()
	console.info('AWS Secret Managerクライアントを作成せずにサーバーを起動します。')
}

/**
 * ステージング環境のバックエンド環境変数シークレットを取得する
 * @param uuid ユーザーUUID
 * @param token ユーザートークン
 * @returns ステージング環境のバックエンド環境変数シークレット取得リクエストのレスポンス
 */
export async function getStgEnvBackEndSecretService(uuid: string, token: string): Promise<GetStgEnvBackEndSecretResponse> {
	try {
		if (!SERVER_ENV || !['dev', 'prod'].includes(SERVER_ENV)) {
			console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。接続先のバックエンドが本番またはローカル環境ではありません。')
			return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。接続先のバックエンドが本番またはローカル環境ではありません。', result: {} }
		}

		if (!client) {
			console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。AWS Secret Managerに接続されていません。')
			return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。AWS Secret Managerに接続されていません。', result: {} }
		}

		if (!(await checkUserTokenByUuidService(uuid, token)).success) {
			console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。ユーザートークンの検証に失敗しました。')
			return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。ユーザートークンの検証に失敗しました。', result: {} }
		}

		if (!AWS_SECRET_NAME) {
			console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。環境変数にシークレット名が指定されていません。AWS_SECRET_REGION 環境変数を設定してください。')
			return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットの取得に失敗しました。環境変数にシークレット名が指定されていません。', result: {} }
		}
		
		try {
			const command = new GetSecretValueCommand({ SecretId: AWS_SECRET_NAME });
			const response = await client.send(command);

			try {
				const secerts: Record<string, string> = JSON.parse(response.SecretString);
				return { success: true, message: 'ステージング環境のバックエンド環境変数シークレットの取得に成功しました。', result: { envs: secerts } }
			} catch(error) {
				console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。JSONの解析に失敗しました：', error)
				return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。JSONの解析に失敗しました。', result: {} }
			}
		} catch(error) {
			console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。データの取得に失敗しました：', error)
			return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。データの取得に失敗しました。', result: {} }
		}
	} catch (error) {
		console.error('ERROR', 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。不明なエラー：', error)
		return { success: false, message: 'ステージング環境のバックエンド環境変数シークレットを取得中にエラーが発生しました。不明なエラー。', result: {} }
	}
}
