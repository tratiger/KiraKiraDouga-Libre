import { POST } from "../Common";
import type { AdminUpdateUserRoleRequestDto, AdminUpdateUserRoleResponseDto } from "./RbacControllerDto";

const BACK_END_URI = environment.backendUri;
const BROWSING_HISTORY_API_URI = `${BACK_END_URI}rbac`;

/**
 * 管理者がユーザーロールを更新します
 * @param adminUpdateUserRoleRequest - 管理者がユーザーロールを更新するためのリクエストペイロード
 * @returns 管理者がユーザーロールを更新するリクエストのレスポンス
 */
export const adminUpdateUserRoleController = async (adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto): Promise<AdminUpdateUserRoleResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	const adminUpdateUserRoleResult = await POST(`${BROWSING_HISTORY_API_URI}/adminUpdateUserRole`, adminUpdateUserRoleRequest, { credentials: "include" });
	return adminUpdateUserRoleResult as AdminUpdateUserRoleResponseDto;
};
