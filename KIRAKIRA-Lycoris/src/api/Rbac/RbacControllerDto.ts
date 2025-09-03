/**
 * RBACを通じてユーザーの権限を確認するためのパラメータ
 */
export type CheckUserRbacParams =
	| { uuid: string; apiPath: string }
	| { uid: number; apiPath: string };

/**
 * RBACを通じてユーザーの権限を確認した結果
 */
export type CheckUserRbacResult = {
	status: 200 | 403 | 500;
	message: string;
};

/**
 * RBAC API パス
 */
type RbacApiPath = {
	/** APIパスのUUID - 空であってはならない - ユニーク */
	apiPathUuid: string;
	/** APIパス - 空であってはならない - ユニーク */
	apiPath: string;
	/** APIパスのタイプ */
	apiPathType?: string;
	/** APIパスの色 - 例：#66CCFFFF */
	apiPathColor?: string;
	/** APIパスの説明 */
	apiPathDescription?: string;
	/** APIパス作成者 - 空であってはならない */
	creatorUuid: string;
	/** APIパス最終更新者 - 空であってはならない */
	lastEditorUuid: string;
	/** システム専用フィールド-作成日時 - 空であってはならない */
	createDateTime: number;
	/** システム専用フィールド-最終編集日時 - 空であってはならない */
	editDateTime: number;
};

/**
 * RBAC API パスの結果
 */
type RbacApiPathResult = RbacApiPath & {
	/** このパスが少なくとも一度割り当てられたかどうか */
	isAssignedOnce: boolean;
};

/**
 * RBAC API パスを作成するリクエストペイロード
 */
export type CreateRbacApiPathRequestDto = {
	/** API パス*/
	apiPath: string;
	/** APIパスのタイプ */
	apiPathType?: string;
	/** APIパスの色 - 例：#66CCFFFF */
	apiPathColor?: string;
	/** APIパスの説明 */
	apiPathDescription?: string;
};

/**
 * RBAC API パスを作成するリクエストのレスポンス
 */
export type CreateRbacApiPathResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacApiPathResult;
};

/**
 * RBAC API パスを削除するリクエストペイロード
 */
export type DeleteRbacApiPathRequestDto = {
	/** API パス*/
	apiPath: string;
};

/**
 * RBAC API パスを削除するリクエストのレスポンス
 */
export type DeleteRbacApiPathResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** このAPIパスがロールにバインドされているかどうか（バインドされている場合は削除不可） */
	isAssigned: boolean;
};

/**
 * API パスを取得するリクエストペイロード
 */
export type GetRbacApiPathRequestDto = {
	/** 検索項目 */
	search: {
		/** API パス*/
		apiPath?: string;
		/** APIパスのタイプ */
		apiPathType?: string;
		/** APIパスの色 - 例：#66CCFFFF */
		apiPathColor?: string;
		/** APIパスの説明 */
		apiPathDescription?: string;
	};
	/** ページネーション検索 */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * API パスを取得するリクエストのレスポンス
 */
export type GetRbacApiPathResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacApiPathResult[];
	/** 成功した場合、合計データを返す */
	count?: number;
};

/**
 * RBAC ロール
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
	/** APIパス作成者 - 空であってはならない */
	creatorUuid: string;
	/** APIパス最終更新者 - 空であってはならない */
	lastEditorUuid: string;
	/** システム専用フィールド-作成日時 - 空であってはならない */
	createDateTime: number;
	/** システム専用フィールド-最終編集日時 - 空であってはならない */
	editDateTime: number;
};

/**
 * RBAC ロールを作成するリクエストペイロード
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
 * RBAC ロールを作成するリクエストのレスポンス
 */
export type CreateRbacRoleResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacRole;
};

/**
 * RBAC ロールを削除するリクエストペイロード
 */
export type DeleteRbacRoleRequestDto = {
	/** ロールの名前 */
	roleName: string;
};

/**
 * RBAC ロールを削除するリクエストのレスポンス
 */
export type DeleteRbacRoleResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};

/**
 * RBAC ロールを取得するリクエストペイロード
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
	/** ページネーション検索 */
	pagination: {
		/** 現在のページ番号 */
		page: number;
		/** 1ページに表示する件数 */
		pageSize: number;
	};
};

/**
 * RBAC ロールを取得するリクエストのレスポンス
 */
export type GetRbacRoleResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
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
 * ロールのAPIパス権限を更新するリクエストペイロード
 */
export type UpdateApiPathPermissionsForRoleRequestDto = {
	/** ロールの名前 */
	roleName: string;
	/** このロールがアクセス権を持つAPIパス */
	apiPathPermissions: string[];
};

/**
 * ロールのAPIパス権限を更新するリクエストのレスポンス
 */
export type UpdateApiPathPermissionsForRoleResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacRole;
};

/**
 * UIDによってユーザーのロールを取得するリクエストペイロード
 */
export type AdminGetUserRolesByUidRequestDto = {
	/** ユーザーのUID */
	uid: number;
};

/**
 * UIDによってユーザーのロールを取得するリクエストのレスポンス
 */
export type AdminGetUserRolesByUidResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
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
		/** ユーザーアバター */
		avatar: string;
		/** ユーザーのロール */
		roles: RbacRole[];
	};
};

/**
 * 管理者がUUIDでユーザーロールを更新する
 */
type AdminUpdateUserRoleByUUID = {
	/** 更新されるユーザーのUUID、UIDは含まない */
	uuid: string;
	uid: never;
	/** 新しいロール */
	newRoles: string[];
};

/**
 * 管理者がUIDでユーザーロールを更新する
 */
type AdminUpdateUserRoleByUID = {
	/** 更新されるユーザーのUID、UUIDは含まない */
	uid: number;
	uuid: never;
	/** 新しいロール */
	newRoles: string[];
};

/**
 * 管理者がユーザーロールを更新するリクエストペイロード
 */
export type AdminUpdateUserRoleRequestDto = AdminUpdateUserRoleByUUID | AdminUpdateUserRoleByUID;

/**
 * 管理者がユーザーロールを更新するリクエストのレスポンス
 */
export type AdminUpdateUserRoleResponseDto = {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** 追加のテキストメッセージ */
	message?: string;
};
