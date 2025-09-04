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
}

/**
 * RBAC APIパス
 */
type RbacApiPath = {
	/** APIパスのUUID - 空でないこと - ユニーク */
	apiPathUuid: string;
	/** APIパス - 空でないこと - ユニーク */
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
}

/**
 * RBAC APIパスの結果
 */
type RbacApiPathResult = RbacApiPath & {
	/** このパスが少なくとも一度割り当てられたかどうか */
	isAssignedOnce: boolean;
}

/**
 * RBAC APIパス作成リクエストペイロード
 */
export type CreateRbacApiPathRequestDto = {
	/** APIパス */
	apiPath: string;
	/** APIパスのタイプ */
	apiPathType?: string;
	/** APIパスの色 - 例：#66CCFFFF */
	apiPathColor?: string;
	/** APIパスの説明 */
	apiPathDescription?: string;
}

/**
 * RBAC APIパス作成レスポンス
 */
export type CreateRbacApiPathResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacApiPathResult;
}

/**
 * RBAC APIパス削除リクエストペイロード
 */
export type DeleteRbacApiPathRequestDto = {
	/** APIパス */
	apiPath: string;
}

/**
 * RBAC APIパス削除レスポンス
 */
export type DeleteRbacApiPathResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** このAPIパスがロールにバインドされているか（バインドされている場合は削除不可） */
	isAssigned: boolean;
}

/**
 * APIパス取得リクエストペイロード
 */
export type GetRbacApiPathRequestDto = {
	/** 検索項目 */
	search: {
		/** APIパス */
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
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
}

/**
 * APIパス取得レスポンス
 */
export type GetRbacApiPathResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacApiPathResult[];
	/** 成功した場合、合計件数を返す */
	count?: number;
}

/**
 * RBACロール
 */
type RbacRole = {
	/** ロールのUUID */
	roleUuid: string;
	/** ロール名 */
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
}

/**
 * RBACロール作成リクエストペイロード
 */
export type CreateRbacRoleRequestDto = {
	/** ロール名 */
	roleName: string;
	/** ロールのタイプ */
	roleType?: string;
	/** ロールの色 - 例：#66CCFFFF */
	roleColor?: string;
	/** ロールの説明 */
	roleDescription?: string;
}

/**
 * RBACロール作成レスポンス
 */
export type CreateRbacRoleResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、作成されたデータを返す */
	result?: RbacRole;
}

/**
 * RBACロール削除リクエストペイロード
 */
export type DeleteRbacRoleRequestDto = {
	/** ロール名 */
	roleName: string;
}

/**
 * RBACロール削除レスポンス
 */
export type DeleteRbacRoleResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}

/**
 * RBACロール取得リクエストペイロード
 */
export type GetRbacRoleRequestDto = {
	/** 検索項目 */
	search: {
		/** ロール名 */
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
		/** 1ページあたりの表示件数 */
		pageSize: number;
	};
}

/**
 * RBACロール取得レスポンス
 */
export type GetRbacRoleResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: (
		& RbacRole
		& { apiPathList: RbacApiPathResult[] }
	)[];
	/** 成功した場合、合計件数を返す */
	count?: number;
}

/**
 * ロールのAPIパス権限更新リクエストペイロード
 */
export type UpdateApiPathPermissionsForRoleRequestDto = {
	/** ロール名 */
	roleName: string;
	/** このロールがアクセス権を持つAPIパス */
	apiPathPermissions: string[];
}

/**
 * ロールのAPIパス権限更新レスポンス
 */
export type UpdateApiPathPermissionsForRoleResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: RbacRole;
}

/**
 * UIDでユーザーのロールを取得するリクエストペイロード
 */
export type AdminGetUserRolesByUidRequestDto = {
	/** ユーザーのUID */
	uid: number;
}

/**
 * UIDでユーザーのロールを取得するレスポンス
 */
export type AdminGetUserRolesByUidResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
	/** 成功した場合、データを返す */
	result?: {
		/** ユーザーのUID */
		uid: number;
		/** ユーザーのUUID */
		uuid: string;
		/** ユーザー名 */
		username: string;
		/** ニックネーム */
		userNickname: string;
		/** アバター */
		avatar: string;
		/** ユーザーのロール */
		roles: RbacRole[];
	};
}

/**
 * 管理者がUUIDでユーザーロールを更新
 */
type AdminUpdateUserRoleByUUID = {
	/** 更新対象ユーザーのUUID（UIDなし） */
  uuid: string;
  uid: never;
	/** 新しいロール */
  newRoles: string[];
};

/**
 * 管理者がUIDでユーザーロールを更新
 */
type AdminUpdateUserRoleByUID = {
	/** 更新対象ユーザーのUID（UUIDなし） */
  uid: number;
  uuid: never;
	/** 新しいロール */
  newRoles: string[];
};

/**
 * 管理者によるユーザーロール更新リクエストペイロード
 */
export type AdminUpdateUserRoleRequestDto = AdminUpdateUserRoleByUUID | AdminUpdateUserRoleByUID;

/**
 * 管理者によるユーザーロール更新レスポンス
 */
export type AdminUpdateUserRoleResponseDto = {
	/** リクエストが成功したか */
	success: boolean;
	/** 追加メッセージ */
	message?: string;
}