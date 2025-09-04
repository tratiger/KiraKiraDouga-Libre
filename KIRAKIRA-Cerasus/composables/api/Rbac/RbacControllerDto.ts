/**
 * RBACによるユーザー権限チェックのパラメータ
 */
export type CheckUserRbacParams =
	| { uuid: string; apiPath: string }
	| { uid: number; apiPath: string };

/**
 * RBACによるユーザー権限チェックの結果
 */
export type CheckUserRbacResult = {
	status: 200 | 403 | 500;
	message: string;
};

/**
 * RBAC APIパス
 */
type RbacApiPath = {
	/** APIパスのUUID - 空でないこと - 一意 */
	apiPathUuid: string;
	/** APIパス - 空でないこと - 一意 */
	apiPath: string;
	/** APIパスのタイプ */
	apiPathType?: string;
	/** APIパスの色 - 例：#66CCFFFF */
	apiPathColor?: string;
	/** APIパスの説明 */
	apiPathDescription?: string;
	/** APIパス作成者 - 空でないこと */
	creatorUuid: string;
	/** APIパス最終更新者 - 空でないこと */
	lastEditorUuid: string;
	/** システム専用フィールド - 作成日時 - 空でないこと */
	createDateTime: number;
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: number;
};

/**
 * RBAC APIパスの結果
 */
type RbacApiPathResult = RbacApiPath & {
	/** このパスは少なくとも一度割り当てられているか */
	isAssignedOnce: boolean;
};

/**
 * RBAC APIパス作成のリクエストペイロード
 */
export type CreateRbacApiPathRequestDto = {
	/** APIパス*/
	apiPath: string;
	/** APIパスのタイプ */
	apiPathType?: string;
	/** APIパスの色 - 例：#66CCFFFF */
	apiPathColor?: string;
	/** APIパスの説明 */
	apiPathDescription?: string;
};

/**
 * RBAC APIパス作成のリクエストレスポンス
 */
export type CreateRbacApiPathResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacApiPathResult;
};

/**
 * RBAC APIパス削除のリクエストペイロード
 */
export type DeleteRbacApiPathRequestDto = {
	/** APIパス*/
	apiPath: string;
};

/**
 * RBAC APIパス削除のリクエストレスポンス
 */
export type DeleteRbacApiPathResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** このAPIパスはロールにバインドされていますか（バインドされている場合は削除不可） */
	isAssigned: boolean;
};

/**
 * APIパス取得のリクエストペイロード
 */
export type GetRbacApiPathRequestDto = {
	/** 検索項目 */
	search: {
		/** APIパス*/
		apiPath?: string;
		/** APIパスのタイプ */
		apiPathType?: string;
		/** APIパスの色 - 例：#66CCFFFF */
		apiPathColor?: string;
		/** APIパスの説明 */
		apiPathDescription?: string;
	};
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * APIパス取得のリクエストレスポンス
 */
export type GetRbacApiPathResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacApiPathResult[];
	/** 成功した場合、合計データを返す */
	count?: number;
};

/**
 * RBACロール
 */
type RbacRole = {
	/** ロールのUUID */
	roleUuid: string;
	/** ロールの名前 */
	roleName: string;
	/** ロールのタイプ */
	roleType?: string;
	/** ロールの色 - 例：#66CCFFFF */
	roleColor?: string;
	/** ロールの説明 */
	roleDescription?: string;
	/** このロールがアクセス権を持つAPIパス */
	apiPathPermissions: string[];
	/** APIパス作成者 - 空でないこと */
	creatorUuid: string;
	/** APIパス最終更新者 - 空でないこと */
	lastEditorUuid: string;
	/** システム専用フィールド - 作成日時 - 空でないこと */
	createDateTime: number;
	/** システム専用フィールド - 最終編集日時 - 空でないこと */
	editDateTime: number;
};

/**
 * RBACロール作成のリクエストペイロード
 */
export type CreateRbacRoleRequestDto = {
	/** ロールの名前 */
	roleName: string;
	/** ロールのタイプ */
	roleType?: string;
	/** ロールの色 - 例：#66CCFFFF */
	roleColor?: string;
	/** ロールの説明 */
	roleDescription?: string;
};

/**
 * RBACロール作成のリクエストレスポンス
 */
export type CreateRbacRoleResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacRole;
};

/**
 * RBACロール削除のリクエストペイロード
 */
export type DeleteRbacRoleRequestDto = {
	/** ロールの名前 */
	roleName: string;
};

/**
 * RBACロール削除のリクエストレスポンス
 */
export type DeleteRbacRoleResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};

/**
 * RBACロール取得のリクエストペイロード
 */
export type GetRbacRoleRequestDto = {
	/** 検索項目 */
	search: {
		/** ロールの名前 */
		roleName?: string;
		/** ロールのタイプ */
		roleType?: string;
		/** ロールの色 - 例：#66CCFFFF */
		roleColor?: string;
		/** ロールの説明 */
		roleDescription?: string;
	};
	/** ページネーションクエリ */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * RBACロール取得のリクエストレスポンス
 */
export type GetRbacRoleResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: (
		& RbacRole
		& { apiPathList: RbacApiPathResult[] }
	)[];
	/** 成功した場合、合計データを返す */
	count?: number;
};

/**
 * ロールのAPIパス権限更新のリクエストペイロード
 */
export type UpdateApiPathPermissionsForRoleRequestDto = {
	/** ロールの名前 */
	roleName: string;
	/** このロールがアクセス権を持つAPIパス */
	apiPathPermissions: string[];
};

/**
 * ロールのAPIパス権限更新のリクエストレスポンス
 */
export type UpdateApiPathPermissionsForRoleResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacRole;
};

/**
 * UIDによるユーザーロール取得のリクエストペイロード
 */
export type AdminGetUserRolesByUidRequestDto = {
	/** ユーザーのUID */
	uid: number;
};

/**
 * UIDによるユーザーロール取得のリクエストレスポンス
 */
export type AdminGetUserRolesByUidResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: {
		/** ユーザーのUID */
		uid: number;
		/** ユーザーのUUID */
		uuid: string;
		/** ユーザー名 */
		username: string;
		/** ユーザーニックネーム */
		userNickname: string;
		/** ユーザーアイコン */
		avatar: string;
		/** ユーザーのロール */
		roles: RbacRole[];
	};
};

/**
 * 管理者によるUUIDでのユーザーロール更新
 */
type AdminUpdateUserRoleByUUID = {
	/** 更新対象ユーザーのUUID（UIDなし） */
	uuid: string;
	uid: never;
	/** 新しいロール */
	newRoles: string[];
};

/**
 * 管理者によるUIDでのユーザーロール更新
 */
type AdminUpdateUserRoleByUID = {
	/** 更新対象ユーザーのUID（UUIDなし） */
	uid: number;
	uuid: never;
	/** 新しいロール */
	newRoles: string[];
};

/**
 * 管理者によるユーザーロール更新のリクエストペイロード
 */
export type AdminUpdateUserRoleRequestDto = AdminUpdateUserRoleByUUID | AdminUpdateUserRoleByUID;

/**
 * 管理者によるユーザーロール更新のリクエストレスポンス
 */
export type AdminUpdateUserRoleResponseDto = {
	/** リクエスト成功か */
	success: boolean;
	/** 付加テキストメッセージ */
	message?: string;
};
