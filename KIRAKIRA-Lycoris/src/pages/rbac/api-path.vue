<script setup lang="tsx">
	const dialog = useDialog();

	type RbacApiPath = GetRbacApiPathResponseDto["result"];

	const isShowCreateNewApiPathModal = ref(false);
	const isCreatingApiPath = ref(false);
	const EMPTY_API_PATH_DATA = {
		apiPath: "",
		apiPathType: "",
		apiPathColor: "",
		apiPathDescription: "",
	};
	const createNewApiPathModal = ref<CreateRbacApiPathRequestDto>({ ...EMPTY_API_PATH_DATA });

	const isShowDeleteApiPathModal = ref(false);
	const isDeletingApiPath = ref(false);
	const currentDeletingApiPath = ref("");
	const userInputDeleteingApiPath = ref("");

	const columns: DataTableColumns<NonNullable<RbacApiPath>[number]> = [
		{
			title: "API パス",
			key: "apiPath",
			render: row => {
				const color = row.isAssignedOnce && row.apiPathColor || "#EEEEEEFF";
				return <NTag color={{ color, textColor: getContrastiveColor(color) }}>{row.apiPath}</NTag>;
			},
		},
		{
			title: "少なくとも一つのロールに紐付いているか",
			key: "isAssignedOnce",
			render: row => <div id={`${row.apiPath}-isAssignedOnce-col`}><Icon name={row.isAssignedOnce ? "check" : "close"} /></div>,
		},
		{
			title: "タイプ",
			key: "apiPathType",
		},
		{
			title: "表示色",
			key: "apiPathColor",
		},
		{
			title: "備考",
			key: "apiPathDescription",
		},
		{
			title: "操作",
			key: "actions",
			render: row => <NButton strong secondary size="small" type="error" onClick={() => openDeleteApiPathModal(row.apiPath ?? "")}>{{ icon: <Icon name="delete" /> }}</NButton>,
		},
	];

	const rbacApiPath = ref<RbacApiPath>([]);
	const rbacApiPathCount = ref(0);
	const pagination = reactive({
		page: 1,
		pageSize: 50,
		showSizePicker: true,
		pageSizes: [5, 10, 20, 50, 100, 200],
		onChange: async (page: number) => {
			pagination.page = page;
			await fetchRbacApiPath();
		},
		onUpdatePageSize: async (pageSize: number) => {
			pagination.pageSize = pageSize;
			pagination.page = 1;
			await fetchRbacApiPath();
		},
	});
	const rbacApiPathPageCount = computed(() => getPageCountByDataCount(rbacApiPathCount.value, pagination.pageSize));

	/**
	 * RBAC APIパスを取得する
	 */
	async function fetchRbacApiPath() {
		const getRbacApiPathRequest: GetRbacApiPathRequestDto = {
			search: {},
			pagination: {
				page: pagination.page,
				pageSize: pagination.pageSize,
			},
		};
		const rbacApiPathResult = await getRbacApiPathController(getRbacApiPathRequest);
		if (rbacApiPathResult.success) {
			rbacApiPath.value = rbacApiPathResult.result;
			rbacApiPathCount.value = rbacApiPathResult.count ?? 0;
		} else
			console.error("ERROR", "RBAC APIパスの取得に失敗しました。");
	}

	/**
	 * 削除中のAPIパス名を更新し、APIパス削除フォームを開く
	 * @param apiPathName 削除中のAPIパス名
	 */
	function openDeleteApiPathModal(apiPahtName: string) {
		currentDeletingApiPath.value = apiPahtName;
		isShowDeleteApiPathModal.value = true;
	}

	/**
	 * APIパス削除フォームを開き、削除中のAPIパス名をクリアする
	 */
	function closeDeleteApiPathModal() {
		isShowDeleteApiPathModal.value = false;
		currentDeletingApiPath.value = "";
	}

	/**
	 * RBAC APIパスを削除する
	 * @param apiPath 削除するRBAC APIパスの名前
	 */
	async function deleteApiPath(apiPath: string) {
		const deleteRbacApiPathRequest: DeleteRbacApiPathRequestDto = {
			apiPath,
		};

		const deleteRbacApiPathResult = await deleteRbacApiPathController(deleteRbacApiPathRequest);

		if (!deleteRbacApiPathResult.success || deleteRbacApiPathResult.isAssigned)
			dialog.error({
				title: "RBAC APIパスの削除に失敗しました",
				content: deleteRbacApiPathResult.message,
				positiveText: "OK",
			});
		else
			closeDeleteApiPathModal();

		await fetchRbacApiPath();
		isDeletingApiPath.value = false;
	}

	/**
	 * フォームデータをクリアし、APIパス作成モーダルを開く
	 */
	function openCreateApiPathModal() {
		createNewApiPathModal.value = { ...EMPTY_API_PATH_DATA };
		isShowCreateNewApiPathModal.value = true;
	}

	/**
	 * APIパス作成モーダルを閉じ、フォームデータをクリアする
	 */
	function closeCreateApiPathModal() {
		isShowCreateNewApiPathModal.value = false;
		createNewApiPathModal.value = { ...EMPTY_API_PATH_DATA };
	}

	/**
	 * フォームを送信し、新しいAPIパスを作成する
	 */
	async function createApiPath() {
		if (!createNewApiPathModal.value.apiPath) {
			console.error("ERROR", "APIパスの作成に失敗しました、パラメータが不正です");
			return;
		}
		isCreatingApiPath.value = true;
		const createRbacApiPathResult = await createRbacApiPathController(createNewApiPathModal.value);

		await fetchRbacApiPath();
		if (createRbacApiPathResult.success)
			closeCreateApiPathModal();
		else
			dialog.error({
				title: "新しいAPIパスの作成に失敗しました",
				content: createRbacApiPathResult.message,
				positiveText: "OK",
			});

		isCreatingApiPath.value = false;
	}
	onMounted(fetchRbacApiPath);
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA RBAC API パス管理</PageHeading>
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
					新しいAPIパスを追加できますが、そのためにはバックエンドの該当APIのController層がRBACで管理されている必要があります。そうでなければ、APIパスを追加しても無効です。<br />
					また、APIパスを削除することもできますが、そのAPIパスがいかなるロールにも紐付いていないことが条件です。
				</NP>
				<NP>どのロールにも紐付いていないAPIパスは灰色で表示され、ロールに紐付いているAPIパスはユーザーが設定した色で表示されます。</NP>
			</NCollapseItem>
		</NCollapse>
		<NFlex class="mlb-2">
			<NButton @click="openCreateApiPathModal"><template #icon><Icon name="add" /></template>新規追加</NButton>
		</NFlex>
		<NDataTable
			:columns="columns"
			:data="rbacApiPath"
			:pagination="false"
			:bordered="false"
			:rowKey="row => row.apiPath"
		/>
		<NFlex justify="end" class="mbs-4">
			<NPagination
				:displayOrder="['quick-jumper', 'pages', 'size-picker']"
				:pageCount="rbacApiPathPageCount"
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
			class="is-[600px]"
			v-model:show="isShowCreateNewApiPathModal"
			:maskClosable="false"
			preset="card"
			title="新しいAPIパスを作成"
		>
			<NForm>
				<NFormItem label="APIパス名" :rule="{ required: true }">
					<NInput :status="!createNewApiPathModal.apiPath ? 'error' : 'success'" v-model:value="createNewApiPathModal.apiPath" placeholder="（必須）ユニークで短いAPIパス名、例：/02/koa/hello" />
				</NFormItem>
				<NFormItem label="APIパスのタイプ">
					<NInput v-model:value="createNewApiPathModal.apiPathType" placeholder='APIパスを識別するためのもの、例："video"' />
				</NFormItem>
				<NFormItem label="APIパスの表示色">
					<NFlex vertical :size="0" class="is-full">
						<small class="n-form-item-label text-xs min-bs-0">色を設定すると、異なるAPIパスを区別しやすくなります</small>
						<NColorPicker v-model:value="createNewApiPathModal.apiPathColor" :modes="['hex']" :showAlpha="true" />
					</NFlex>
				</NFormItem>
				<NFormItem label="APIパスの説明">
					<NInput v-model:value="createNewApiPathModal.apiPathDescription" type="textarea" :autosize="{ minRows: 3 }" placeholder="APIパスの詳細な説明" />
				</NFormItem>
			</NForm>
			<template #footer>
				<NFlex class="justify-end">
					<NButton @click="closeCreateApiPathModal">キャンセル</NButton>
					<NButton :disabled="!createNewApiPathModal.apiPath" :loading="isCreatingApiPath" type="primary" :secondary="true" @click="createApiPath">作成を確認</NButton>
				</NFlex>
			</template>
		</NModal>

		<NModal
			v-model:show="isShowDeleteApiPathModal"
			:maskClosable="false"
			preset="dialog"
			:title="`APIパス ${currentDeletingApiPath} を削除してもよろしいですか？`"
		>

			<NFormItem label="削除を確認するには、APIパス名を再度入力してください">
				<NInput v-model:value="userInputDeleteingApiPath" placeholder="APIパス名" />
			</NFormItem>

			<template #action>
				<NButton @click="closeDeleteApiPathModal">キャンセル</NButton>
				<NButton :disabled="currentDeletingApiPath !== userInputDeleteingApiPath" :loading="isDeletingApiPath" type="warning" :secondary="true" @click="deleteApiPath(currentDeletingApiPath)">削除を確認</NButton>
			</template>
		</NModal>
	</div>
</template>
