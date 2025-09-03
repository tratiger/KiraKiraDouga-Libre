import { AdminGetUserRolesByUidRequestDto, AdminGetUserRolesByUidResponseDto, AdminUpdateUserRoleRequestDto, AdminUpdateUserRoleResponseDto, CreateRbacApiPathRequestDto, CreateRbacApiPathResponseDto, CreateRbacRoleRequestDto, CreateRbacRoleResponseDto, DeleteRbacApiPathRequestDto, DeleteRbacApiPathResponseDto, DeleteRbacRoleRequestDto, DeleteRbacRoleResponseDto, GetRbacApiPathRequestDto, GetRbacApiPathResponseDto, GetRbacRoleRequestDto, GetRbacRoleResponseDto, UpdateApiPathPermissionsForRoleRequestDto, UpdateApiPathPermissionsForRoleResponseDto } from "./RbacControllerDto";

const RBAC_API_URI = `${backendUri}rbac`;

/**
 * RBAC APIパスを取得する
 * @param getRbacApiPathRequest RBAC APIパスを取得するリクエストペイロード
 * @returns RBAC APIパス
 */
export const getRbacApiPathController = async (getRbacApiPathRequest: GetRbacApiPathRequestDto): Promise<GetRbacApiPathResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${RBAC_API_URI}/getRbacApiPath${getUrlQuery({ ...getRbacApiPathRequest.search, ...getRbacApiPathRequest.pagination })}`, { credentials: "include" }) as GetRbacApiPathResponseDto;
};

/**
 * RBAC APIパスを削除する
 * @param deleteRbacApiPathRequest RBAC APIパスを削除するリクエストペイロード
 * @returns 削除結果
 */
export const deleteRbacApiPathController = async (deleteRbacApiPathRequest: DeleteRbacApiPathRequestDto): Promise<DeleteRbacApiPathResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${RBAC_API_URI}/deleteRbacApiPath`, deleteRbacApiPathRequest, { credentials: "include" }) as DeleteRbacApiPathResponseDto;
};

/**
 * RBAC APIパスを作成する
 * @param createRbacApiPathRequest RBAC APIパスを作成するリクエストペイロード
 * @returns RBAC APIパスを作成するリクエストのレスポンス
 */
export const createRbacApiPathController = async (createRbacApiPathRequest: CreateRbacApiPathRequestDto): Promise<CreateRbacApiPathResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${RBAC_API_URI}/createRbacApiPath`, createRbacApiPathRequest, { credentials: "include" }) as CreateRbacApiPathResponseDto;
};

/**
 * RBACロールを取得する
 * @param getRbacRoleRequest RBACロールを取得するリクエストペイロード
 * @returns RBACロール
 */
export const getRbacRoleController = async (getRbacRoleRequest: GetRbacRoleRequestDto): Promise<GetRbacRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${RBAC_API_URI}/getRbacRole${getUrlQuery({ ...getRbacRoleRequest.search, ...getRbacRoleRequest.pagination })}`, { credentials: "include" }) as GetRbacRoleResponseDto;
};

/**
 * RBACロールを削除する
 * @param deleteRbacRoleRequest RBACロールを削除するリクエストペイロード
 * @returns 削除結果
 */
export const deleteRbacRoleController = async (deleteRbacRoleRequest: DeleteRbacRoleRequestDto): Promise<DeleteRbacRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${RBAC_API_URI}/deleteRbacRole`, deleteRbacRoleRequest, { credentials: "include" }) as DeleteRbacRoleResponseDto;
};

/**
 * RBACロールを作成する
 * @param createRbacRoleRequest RBACロールを作成するリクエストペイロード
 * @returns RBACロールを作成するリクエストのレスポンス
 */
export const createRbacRoleController = async (createRbacRoleRequest: CreateRbacRoleRequestDto): Promise<CreateRbacRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${RBAC_API_URI}/createRbacRole`, createRbacRoleRequest, { credentials: "include" }) as CreateRbacRoleResponseDto;
};

/**
 * ロールのAPIパス権限を更新する
 * @param updateApiPathPermissionsForRoleRequest ロールのAPIパス権限を更新するリクエストペイロード
 * @returns ロールのAPIパス権限を更新するリクエストのレスポンス
 */
export const updateApiPathPermissionsForRoleController = async (updateApiPathPermissionsForRoleRequest: UpdateApiPathPermissionsForRoleRequestDto): Promise<UpdateApiPathPermissionsForRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${RBAC_API_URI}/updateApiPathPermissionsForRole`, updateApiPathPermissionsForRoleRequest, { credentials: "include" }) as UpdateApiPathPermissionsForRoleResponseDto;
};

/**
 * UIDによってユーザーのロールを取得する
 * @param adminGetUserRolesByUidRequest UIDによってユーザーのロールを取得するリクエストペイロード
 * @returns UIDによってユーザーのロールを取得するリクエストのレスポンス
 */
export const adminGetUserRolesController = async (adminGetUserRolesByUidRequest: AdminGetUserRolesByUidRequestDto): Promise<AdminGetUserRolesByUidResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${RBAC_API_URI}/adminGetUserRolesByUid?uid=${adminGetUserRolesByUidRequest.uid}`, { credentials: "include" }) as AdminGetUserRolesByUidResponseDto;
};

/**
 * 管理者がユーザーロールを更新する
 * @param adminUpdateUserRoleRequest 管理者がユーザーロールを更新するリクエストペイロード
 * @returns 管理者がユーザーロールを更新するリクエストのレスポンス
 */
export const adminUpdateUserRoleController = async (adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto): Promise<AdminUpdateUserRoleResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${RBAC_API_URI}/adminUpdateUserRole`, adminUpdateUserRoleRequest, { credentials: "include" }) as AdminUpdateUserRoleResponseDto;
};
