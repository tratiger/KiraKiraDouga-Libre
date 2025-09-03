<script setup lang="tsx">
	type UserList = GetBlockedUserResponseDto["result"];
	const message = useMessage();

	const isShowUnbanUserModal = ref(false);
	const isUnbanUser = ref(false);
	const currentUnbanUserInfo = ref<string>("");
	const userInputUnbanUserInfo = ref<string>("");

	const searchUserUid = ref<number | null>(null);
	const currentSortKey = ref<string | null>("uid");
	const currentSortOrder = ref<"ascend" | "descend" | undefined>("ascend");

	const columns = computed<DataTableColumns<NonNullable<UserList>[number]>>(() => [
		{
			title: "UID",
			key: "uid",
			sorter: "default",
			sortOrder: currentSortKey.value === "uid" ? currentSortOrder.value : false,
		},
		{
			title: "UUID",
			key: "UUID",
		},
		{
			title: "ニックネーム",
			key: "userNickname",
			sorter: "default",
			sortOrder: currentSortKey.value === "userNickname" ? currentSortOrder.value : false,
		},
		{
			title: "ユーザー名",
			key: "username",
		},
		{
			title: "メールアドレス",
			key: "email",
		},
		{
			title: "ロール",
			key: "roles",
			render(row) {
				if (!row.roles?.length) return h(NTag, { style: { marginRight: "6px" }, type: "info", bordered: false }, { default: () => "user" });
				const roles = row.roles.map(roleKey => {
					return h(NTag, { style: { marginRight: "6px" }, type: "info", bordered: false }, { default: () => roleKey });
				});
				return roles;
			},
		},
		{
			title: "登録日時",
			key: "userCreateDateTime",
			sorter: "default",
			sortOrder: currentSortKey.value === "userCreateDateTime" ? currentSortOrder.value : false,
			render(row) {
				if (row.userCreateDateTime === undefined) return h(NText, { depth: 3 }, () => "未記録");
				const result = formatDateTime(row.userCreateDateTime);
				if (!result) return h(NText, { depth: 3 }, () => "未記録");
				return h("div", { class: "time-wrapper" }, [h("div", result.formatted),
				]);
			} },
		{
			title: "操作",
			key: "actions",
			render: row => (
				<NFlex>
					<NButton strong secondary size="small" type="success" onClick={() => openUnbanUserModal(row.UUID)}>{{ icon: () => <Icon name="check" /> }}</NButton>
				</NFlex>
			),
		},
	]);

	const userList = ref<UserList>([]);
	const userListCount = ref(0);
	const pagination = reactive({
		page: 1,
		pageSize: 50,
		showSizePicker: true,
		pageSizes: [5, 10, 20, 50, 100, 200],
		onChange: async (page: number) => {
			pagination.page = page;
			await getUserInfo();
		},
		onUpdatePageSize: async (pageSize: number) => {
			pagination.pageSize = pageSize;
			pagination.page = 1;
			await getUserInfo();
		},
	});
	const userListPageCount = computed(() => getPageCountByDataCount(userListCount.value, pagination.pageSize));

	/**
	 * ユーザーリストを取得する
	 */
	async function getUserInfo() {
		let apiSortBy: string | undefined = undefined;
		let apiSortOrder: "ascend" | "descend" | undefined = undefined;
		if (currentSortKey.value && currentSortOrder.value) {
			switch (currentSortKey.value) {
				case "uid":
					apiSortBy = "uid";
					break;
				case "userNickname":
					apiSortBy = "userNickname";
					break;
				case "userCreateDateTime":
					apiSortBy = "createDateTime";
					break;
				default:
					apiSortBy = "uid";
					break;
			}
			apiSortOrder = currentSortOrder.value;
		} else {
			apiSortBy = undefined;
			apiSortOrder = undefined;
		}
		const GetBlockedUserRequest: GetBlockedUserRequestDto = {
			uid: searchUserUid.value ?? -1,
			sortBy: apiSortBy ?? "uid",
			sortOrder: apiSortOrder ?? "ascend",
			pagination: {
				page: pagination.page,
				pageSize: pagination.pageSize,
			},
		};
		try {
			const getUserInfoResult = await adminGetBlockedUserInfo(GetBlockedUserRequest);
			if (getUserInfoResult.success) {
				userList.value = getUserInfoResult.result;
				userListCount.value = getUserInfoResult.totalCount ?? 0;
			} else
				console.error("ERROR", "ユーザーリストの取得に失敗しました。");
		} catch (error) {
			console.error("ERROR", "ユーザーリストのリクエスト中にエラーが発生しました:", error);
		}
	}

	/**
	 * ソート順の変更を処理する
	 * @param options ソートオプション
	 */
	async function handleSorterChange(options: { columnKey: string | number | null; sorter: string; order: "ascend" | "descend" | undefined }) {
		currentSortKey.value = options.columnKey as string | null;
		currentSortOrder.value = options.order;
		pagination.page = 1;
		await getUserInfo();
	}

	/**
	 * ユーザーのブロックを解除する
	 */
	async function unbanUser() {
		if (userInputUnbanUserInfo.value === "") return;
		if (userInputUnbanUserInfo.value !== currentUnbanUserInfo.value) return;
		isUnbanUser.value = true;
		const unbanUserRequest: AdminUpdateUserRoleRequestDto = {
			uuid: currentUnbanUserInfo.value,
			uid: undefined as never,
			newRoles: ["user"],
		};
		const unbanUserResult = await adminUpdateUserRoleController(unbanUserRequest);
		if (unbanUserResult.success) {
			closeUnbanUserModal();
			message.success("ユーザーのブロックを解除しました");
			await getUserInfo();
		} else
			message.error("ユーザーのブロック解除に失敗しました");
		isUnbanUser.value = false;
	}

	/**
	 * ブロック解除中のユーザーUUIDを更新し、ブロック解除フォームを開く
	 * @param banUUID ブロック解除中のユーザー情報
	 */
	function openUnbanUserModal(banUUID: string) {
		currentUnbanUserInfo.value = banUUID;
		isShowUnbanUserModal.value = true;
	}

	/**
	 * ブロック解除フォームを閉じ、ブロック解除中のユーザー情報をクリアする
	 */
	function closeUnbanUserModal() {
		isShowUnbanUserModal.value = false;
		currentUnbanUserInfo.value = "";
	}

	onMounted(() => { getUserInfo(); });
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA ブロック済みユーザー</PageHeading>
		<NSpace align="center" justify="space-between">
			<NCollapse class="mlb-4">
				<NCollapseItem title="使用方法">
					<NP>ソートオプション</NP>
					<NUl>
						<NLi>UID、ニックネーム、登録日時をクリックしてテーブルをソートできます</NLi>
						<NLi>再度クリックすると「昇順」と「降順」を切り替えられます</NLi>
						<NLi>デフォルトではUIDの昇順で並んでいます</NLi>
					</NUl>
					<NP>ブロック解除ボタンをクリックするとユーザーのブロックを解除できます。ユーザーのUUIDを入力して確認してください</NP>
					<NP>ブロック解除後、ユーザーは通常のユーザーに戻ります</NP>
				</NCollapseItem>
			</NCollapse>
			<NFlex align="center" justify="right">
				<NInputNumber v-model:value="searchUserUid" placeholder="照会したいユーザーのUID" :showButton="false" />
				<NButton @click="getUserInfo()"><template #icon><Icon name="search" /></template>照会</NButton>
			</NFlex>
		</NSpace>

		<NDataTable
			:columns="columns"
			:data="userList"
			:pagination="false"
			:bordered="false"
			:rowKey="row => row.uid"
			:remote="true"
			@update:sorter="handleSorterChange"
		/>
		<NFlex justify="end" class="mbs-4">
			<NPagination
				:displayOrder="['quick-jumper', 'pages', 'size-picker']"
				:pageCount="userListPageCount"
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
			v-model:show="isShowUnbanUserModal"
			:maskClosable="false"
			preset="dialog"
			:title="`このユーザーのブロックを解除してもよろしいですか？`"
		>
			<br />
			<NFormItem :label="`ブロックを解除するには、ユーザーのUUIDを入力してください: ${currentUnbanUserInfo}`">
				<NInput v-model:value="userInputUnbanUserInfo" placeholder="ユーザーUUID" />
			</NFormItem>

			<template #action>
				<NButton @click="closeUnbanUserModal">キャンセル</NButton>
				<NButton :disabled="currentUnbanUserInfo !== userInputUnbanUserInfo" :loading="isUnbanUser" type="warning" :secondary="true" @click="unbanUser()">ブロック解除を確認</NButton>
			</template>
		</NModal>

	</div>
</template>
