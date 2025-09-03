<script setup lang="tsx">
	const dialog = useDialog();

	type RbacRole = GetRbacRoleResponseDto["result"];

	const isShowDeleteRoleModal = ref(false);
	const unableToEditRole = ref(true);
	const currentDeletingRole = ref("");
	const userInputDeleteingRole = ref("");
	const isDeletingRole = ref(false);

	const isShowCreateNewRoleModal = ref(false);
	const isCreatingRole = ref(false);
	const EMPTY_ROLE_CREATE_DATA = {
		roleName: "",
		roleType: "",
		roleColor: "",
		roleDescription: "",
	};
	const createRoleFormModal = ref<CreateRbacRoleRequestDto>({ ...EMPTY_ROLE_CREATE_DATA });

	type RbacApiPath = GetRbacApiPathResponseDto["result"];
	const rbacApiPath = ref<RbacApiPath>([]);
	const isShowEditRoleModal = ref(false);
	const isEditingRole = ref(false);
	const EMPTY_ROLE_UPDATE_DATA = {
		roleName: "",
		apiPathPermissions: [],
	};
	const updateApiPathPermissionsForRoleFormModal = ref<UpdateApiPathPermissionsForRoleRequestDto>(EMPTY_ROLE_UPDATE_DATA);

	const apiPathEls = reactive<(Element | ComponentPublicInstance)[]>([]);
	function fixEllipsis() {
		for (let element of apiPathEls) {
			if ("$el" in element) element = element.$el as Element;
			if (!element?.parentElement || !(element instanceof HTMLElement)) continue;
			const right = element.offsetLeft + element.offsetWidth;
			const visibleWidth = element.parentElement.offsetWidth;
			element.classList.toggle("invisible", right - visibleWidth > -22.5);
		}
	}
	watch(apiPathEls, () => fixEllipsis());
	useEventListener(window, "resize", () => fixEllipsis());

	const columns: DataTableColumns<NonNullable<RbacRole>[number]> = [
		{
			title: "ロール名",
			key: "roleName",
			render: row => <NTag color={{ color: row.roleColor, textColor: getContrastiveColor(row.roleColor!) }}>{row.roleName}</NTag>,
		},
		{
			title: "アクセス可能なAPIパス",
			key: "apiPathPermissions",
			ellipsis: true,
			width: "min(400px, 40dvw)",
			render: row => {
				apiPathEls.length = 0;
				return row.apiPathPermissions.map(apiPath => <NTag class="mie-2" ref={el => el && apiPathEls.push(el)}>{apiPath}</NTag>);
			},
			className: "[&>*]:relative",
		},
		{
			type: "expand",
			renderExpand: rowData => [
				<div id={`${rowData.roleName}-expand-title`} class="mbe-2">{`ロール ${rowData.roleName} は以下のAPIパスへのアクセス権を持っています`}</div>,
				...rowData.apiPathList.map(apiPath => <NTag color={{ color: apiPath.apiPathColor, textColor: getContrastiveColor(apiPath.apiPathColor!) }} class="mie-2 mbe-1">{apiPath.apiPath}</NTag>),
			],
		},
		{
			title: "タイプ",
			key: "roleType",
		},
		{
			title: "表示色",
			key: "roleColor",
		},
		{
			title: "備考",
			key: "roleDescription",
		},
		{
			title: "操作",
			key: "actions",
			render: row => (
				<NFlex size="small">
					<NButton strong secondary size="small" onClick={() => openEditRoleModal(row)}>{{ icon: <Icon name="edit" /> }}</NButton>
					<NButton strong secondary size="small" type="error" onClick={() => openDeleteRoleModal(row.roleName ?? "")}>{{ icon: <Icon name="delete" /> }}</NButton>
				</NFlex>
			),
		},
	];

	const rbacRole = ref<RbacRole>([]);
	const rbacRoleCount = ref(0);
	const pagination = reactive({
		page: 1,
		pageSize: 50,
		showSizePicker: true,
		pageSizes: [5, 10, 20, 50, 100, 200],
		onChange: async (page: number) => {
			pagination.page = page;
			await fetchRbacRole();
		},
		onUpdatePageSize: async (pageSize: number) => {
			pagination.pageSize = pageSize;
			pagination.page = 1;
			await fetchRbacRole();
		},
	});
	const rbacRolePageCount = computed(() => getPageCountByDataCount(rbacRoleCount.value, pagination.pageSize));

	/**
	 * RBACロールを取得する
	 */
	async function fetchRbacRole() {
		const getRbacRoleRequest: GetRbacRoleRequestDto = {
			search: {},
			pagination: {
				page: pagination.page,
				pageSize: pagination.pageSize,
			},
		};
		const rbacRoleResult = await getRbacRoleController(getRbacRoleRequest);
		if (rbacRoleResult.success) {
			rbacRole.value = rbacRoleResult.result;
			rbacRoleCount.value = rbacRoleResult.count ?? 0;
		} else
			console.error("ERROR", "RBACロールの取得に失敗しました。");
	}

	/**
	 * データをクリアしてロール作成モーダルを開く
	 */
	function openCreateRoleModal() {
		createRoleFormModal.value = { ...EMPTY_ROLE_CREATE_DATA };
		isShowCreateNewRoleModal.value = true;
	}

	/**
	 * ロール作成モーダルを閉じてデータをクリアする
	 */
	function closeCreateRoleModal() {
		isShowCreateNewRoleModal.value = false;
		createRoleFormModal.value = { ...EMPTY_ROLE_CREATE_DATA };
	}

	/**
	 * RBACロールを作成する
	 */
	async function createRole() {
		const createRbacRoleRequest: CreateRbacRoleRequestDto = { ...createRoleFormModal.value };
		if (!createRbacRoleRequest.roleName) {
			console.error("ERROR", "ロールの作成に失敗しました、パラメータが不正です");
			return;
		}
		isCreatingRole.value = true;
		const createRbacRoleResult = await createRbacRoleController(createRbacRoleRequest);
		if (createRbacRoleResult.success) {
			await fetchRbacRole();
			closeCreateRoleModal();
		}

		isCreatingRole.value = false;
	}

	/**
	 * RBAC APIパスを取得する
	 */
	async function fetchRbacApiPath() {
		const getRbacApiPathRequest: GetRbacApiPathRequestDto = {
			search: {},
			pagination: {
				page: 1,
				pageSize: 100000,
			},
		};
		const rbacApiPathResult = await getRbacApiPathController(getRbacApiPathRequest);
		if (rbacApiPathResult.success)

			rbacApiPath.value = rbacApiPathResult.result;
		else
			console.error("ERROR", "RBAC APIパスの取得に失敗しました。");
	}

	/**
	 * RBACロールを削除する
	 * @param roleName 削除するRBACロールの名前
	 */
	async function fetchDeleteRbacRole(roleName: string) {
		isDeletingRole.value = true;
		const deleteRbacRoleRequest: DeleteRbacRoleRequestDto = {
			roleName,
		};

		const deleteRbacApiPathResult = await deleteRbacRoleController(deleteRbacRoleRequest);
		if (!deleteRbacApiPathResult.success)
			dialog.error({
				title: "RBACロールの削除に失敗しました",
				content: deleteRbacApiPathResult.message,
				positiveText: "OK",
			});

		await fetchRbacRole();
		closeDeleteRoleModal();
		isDeletingRole.value = false;
	}

	/**
	 * ロール削除モーダルを開く
	 * @param roleName 削除するロールの名前
	 */
	function openDeleteRoleModal(roleName: string) {
		currentDeletingRole.value = roleName;
		userInputDeleteingRole.value = "";
		isShowDeleteRoleModal.value = true;
	}

	/**
	 * ロール削除モーダルを閉じる
	 */
	function closeDeleteRoleModal() {
		currentDeletingRole.value = "";
		userInputDeleteingRole.value = "";
		isShowDeleteRoleModal.value = false;
	}

	/**
	 * データを設定してロール編集モーダルを開く
	 * @param roleData 更新中のロールデータ
	 */
	async function openEditRoleModal(roleData: NonNullable<RbacRole>[number]) {
		unableToEditRole.value = true;
		updateApiPathPermissionsForRoleFormModal.value = {
			roleName: roleData.roleName,
			apiPathPermissions: roleData.apiPathPermissions.map(apiPath => apiPath),
		};
		isShowEditRoleModal.value = true;
		await fetchRbacApiPath();
		unableToEditRole.value = false;
	}

	/**
	 * ロール編集モーダルを閉じてデータをクリアする
	 */
	function closeEditRoleModal() {
		unableToEditRole.value = true;
		isShowEditRoleModal.value = false;
		updateApiPathPermissionsForRoleFormModal.value = EMPTY_ROLE_UPDATE_DATA;
	}

	/**
	 * ロールのAPIパスを更新する
	 */
	async function updateApiPathPermissionsForRole() {
		isEditingRole.value = true;
		const updateApiPathPermissionsForRoleResult = await updateApiPathPermissionsForRoleController(updateApiPathPermissionsForRoleFormModal.value);
		if (updateApiPathPermissionsForRoleResult.success) {
			await fetchAllDataInRolePage();
			closeEditRoleModal();
		} else
			dialog.error({
				title: "ロールのAPIパス更新時にエラーが発生しました",
				content: updateApiPathPermissionsForRoleResult.message,
				positiveText: "OK",
			});
		isEditingRole.value = false;
	}

	/**
	 * role.vueページのすべての初期化データを取得する
	 */
	async function fetchAllDataInRolePage() {
		await fetchRbacRole();
	}

	onMounted(fetchAllDataInRolePage);
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA RBAC ロール管理</PageHeading>
		<NCollapse class="mlb-4">
			<NCollapseItem title="使用方法">
				<NP>KIRAKIRA RBACの権限管理は、APIパスを最小単位として行われます。</NP>
				<NUl>
					<NLi>一人のユーザーは複数のロールを持つことができます</NLi>
					<NLi>一つのロールは複数のユーザーに対応できます</NLi>
					<NLi>一つのロールは複数のAPIへのアクセス権を持つことができます</NLi>
					<NLi>一つのAPIは複数のロールに対応できます</NLi>
				</NUl>
				<NP>
					ロールを追加または削除できます。<br />
					以下の特殊な名前を持つロールは特別な効果があるため、作成、割り当て（紐付け/解除）、削除の際には特に注意してください：
				</NP>
				<NUl>
					<NLi><b>root</b> - RBACの管理権限を持ちます</NLi>
					<NLi><b>adminsitrator</b> - コンテンツの管理権限を持ちます</NLi>
					<NLi><b>developer</b> - 特定の開発リソースへのアクセス権を持ちます</NLi>
					<NLi><b>user</b> - 一般ユーザー</NLi>
					<NLi><b>blocked</b> - ブロックされたユーザー</NLi>
				</NUl>
			</NCollapseItem>
		</NCollapse>
		<NFlex class="mlb-2">
			<NButton @click="openCreateRoleModal"><template #icon><Icon name="add" /></template>新規追加</NButton>
		</NFlex>
		<NDataTable
			:columns="columns"
			:data="rbacRole"
			:pagination="false"
			:bordered="false"
			:resizable="true"
			:rowKey="row => row.roleName"
		/>
		<NFlex justify="end" class="mbs-4">
			<NPagination
				:displayOrder="['quick-jumper', 'pages', 'size-picker']"
				:pageCount="rbacRolePageCount"
				:page="pagination.page"
				:pageSize="pagination.pageSize"
				:pageSizes="pagination.pageSizes"
				:onUpdate:page="pagination.onChange"
				:onUpdate:pageSize="pagination.onUpdatePageSize"
				showQuickJumper
				showSizePicker
			/>
		</NFlex>

		<NModal
			v-model:show="isShowDeleteRoleModal"
			:maskClosable="false"
			preset="dialog"
			:title="`ロール ${currentDeletingRole} を削除してもよろしいですか？`"
		>
			<NFormItem label="削除を確認するには、ロール名を再度入力してください">
				<NInput v-model:value="userInputDeleteingRole" placeholder="ロール名" />
			</NFormItem>

			<template #action>
				<NButton @click="closeDeleteRoleModal">キャンセル</NButton>
				<NButton :disabled="currentDeletingRole !== userInputDeleteingRole" :loading="isDeletingRole" type="warning" :secondary="true" @click="fetchDeleteRbacRole(currentDeletingRole)">削除を確認</NButton>
			</template>
		</NModal>

		<NModal
			class="is-[600px]"
			v-model:show="isShowCreateNewRoleModal"
			:maskClosable="false"
			preset="card"
			title="新しいロールを作成"
		>
			<NForm>
				<NFormItem label="ロール名" :rule="{ required: true }">
					<NInput :status="!createRoleFormModal.roleName ? 'error' : 'success'" v-model:value="createRoleFormModal.roleName" placeholder="（必須）ユニークで短いロール名" />
				</NFormItem>
				<NFormItem label="ロールのタイプ">
					<NInput v-model:value="createRoleFormModal.roleType" placeholder='ロールを識別するためのもの、例："maintenance"' />
				</NFormItem>
				<NFormItem label="ロールの表示色">
					<NFlex vertical :size="0" class="is-full">
						<small class="n-form-item-label text-xs min-bs-0">色を設定すると、異なるロールを区別しやすくなります</small>
						<NColorPicker v-model:value="createRoleFormModal.roleColor" :modes="['hex']" :showAlpha="true" />
					</NFlex>
				</NFormItem>
				<NFormItem label="ロールの説明">
					<NInput v-model:value="createRoleFormModal.roleDescription" type="textarea" :autosize="{ minRows: 3 }" placeholder="ロールの詳細な説明" />
				</NFormItem>
			</NForm>
			<template #footer>
				<NFlex class="justify-end">
					<NButton @click="closeCreateRoleModal">キャンセル</NButton>
					<NButton :disabled="!createRoleFormModal?.roleName" :loading="isCreatingRole" type="primary" :secondary="true" @click="createRole">作成を確認</NButton>
				</NFlex>
			</template>
		</NModal>

		<NModal
			class="is-[600px]"
			v-model:show="isShowEditRoleModal"
			:maskClosable="false"
			preset="card"
			title="ロールがアクセスできるAPIパスを編集"
		>
			<NForm>
				<NFormItem label="ロール名">
					<NInput :disabled="true" v-model:value="updateApiPathPermissionsForRoleFormModal.roleName" placeholder="ロール名" />
				</NFormItem>
				<NFormItem label="ロールがアクセスできるAPIパス">
					<NTransfer
						v-model:value="updateApiPathPermissionsForRoleFormModal.apiPathPermissions"
						:options="rbacApiPath?.map(apiPath => ({
							label: apiPath.apiPath,
							value: apiPath.apiPath,
						}))"
						:disabled="unableToEditRole"
						sourceFilterable
						targetFilterable
					/>
				</NFormItem>
			</NForm>
			<template #footer>
				<NFlex class="justify-end">
					<NButton @click="closeEditRoleModal">キャンセル</NButton>
					<NButton :disabled="!updateApiPathPermissionsForRoleFormModal.roleName" :loading="isEditingRole" type="primary" :secondary="true" @click="updateApiPathPermissionsForRole">ロールの更新を確認</NButton>
				</NFlex>
			</template>
		</NModal>
	</div>
</template>
