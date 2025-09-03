import { GetStgEnvBackEndSecretResponse } from "./ConsoleSecretControllerDto";

const SECRET_API_URI = `${backendUri}secret`;

/**
 * ステージング環境のバックエンド環境変数のシークレットを取得する
 * @returns ステージング環境のバックエンド環境変数のシークレットを取得するリクエストのレスポンス
 */
export const getStgEnvBackEndSecretController = async (): Promise<GetStgEnvBackEndSecretResponse> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${SECRET_API_URI}/getStgEnvBackEndSecret`, { credentials: "include" }) as GetStgEnvBackEndSecretResponse;
};
