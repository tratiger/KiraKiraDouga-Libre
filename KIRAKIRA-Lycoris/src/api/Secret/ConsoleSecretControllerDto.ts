/**
 * ステージング環境のバックエンド環境変数シークレットを取得するリクエストのレスポンス
 */
export type GetStgEnvBackEndSecretResponse = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** ステージング環境のバックエンド環境変数シークレット */
	result: {
		envs?: Record<string, string>;
	};
};
