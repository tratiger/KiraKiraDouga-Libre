/**
 * ステージング環境のバックエンド環境変数シークレット取得レスポンス
 */
export type GetStgEnvBackEndSecretResponse = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** ステージング環境のバックエンド環境変数シークレット */
	result: {
		envs?: Record<string, string>;
	};
}
