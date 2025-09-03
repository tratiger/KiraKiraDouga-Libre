import { POST } from "../Common";
import type { AdminUpdateUserRoleRequestDto, AdminUpdateUserRoleResponseDto } from "./RbacControllerDto";

const BACK_END_URI = environment.backendUri;
const BROWSING_HISTORY_API_URI = `${BACK_END_URI}rbac`;

/**
 * 管理员更新用户角色
 * @param adminUpdateUserRoleRequest - 管理员更新用户角色的请求载荷
 * @returns 管理员更新用户角色的请求响应
 */
export const adminUpdateUserRoleController = async (adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto): Promise<AdminUpdateUserRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const adminUpdateUserRoleResult = await POST(`${BROWSING_HISTORY_API_URI}/adminUpdateUserRole`, adminUpdateUserRoleRequest, { credentials: "include" });
	return adminUpdateUserRoleResult as AdminUpdateUserRoleResponseDto;
};
