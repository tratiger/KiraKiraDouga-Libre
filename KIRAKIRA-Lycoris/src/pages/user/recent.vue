<script setup lang="tsx">
	type UserList = AdminGetUserInfoResponseDto["result"];
	const message = useMessage();

	const isOpenUserInfoModal = ref(false);
	const isPassUser = ref(false);
	const isDeleteUser = ref(false);
	const searchUserUid = ref<number | null>(null);
	const currentSortKey = ref<string | null>("uid");
	const currentSortOrder = ref<"ascend" | "descend" | undefined>("ascend");
	const defaultUserInfoData = {
		uid: -1,
		avatar: "",
		userBannerImage: "",
		userNickname: "",
		username: "",
		gender: "",
		signature: "",
		label: [],
	};
	const userInfoData = reactive({ ...defaultUserInfoData });
	const genderMap: Record<string, string> = {
		male: "男性",
		female: "女性",
		unknown: "不明",
	};

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
					<NButton strong secondary size="small" type="info" onClick={() => openUserInfoModal(row)}>{{ icon: () => <Icon name="description" /> }}</NButton>
					<NPopconfirm onPositiveClick={() => clearUserInfo(row.uid)}>
						{{
							trigger: <NButton type="error" strong secondary size="small">{{ icon: <Icon name="delete" /> }}</NButton>,
							default: "このユーザーの情報変更申請を却下してもよろしいですか？",
						}}
					</NPopconfirm>
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
		let apiSortBy: string | undefined;
		let apiSortOrder: "ascend" | "descend" | undefined;
		if (currentSortKey.value && currentSortOrder.value)
			apiSortBy = ["uid", "userNickname"].includes(currentSortKey.value) ? currentSortKey.value :
				currentSortKey.value === "userCreateDateTime" ? "createDateTime" : "uid";
		else
			apiSortBy = apiSortOrder = undefined;

		const getUserListRequest: AdminGetUserInfoRequestDto = {
			isOnlyShowUserInfoUpdatedAfterReview: true,
			uid: searchUserUid.value ?? -1,
			sortBy: apiSortBy ?? "uid",
			sortOrder: apiSortOrder ?? "ascend",
			pagination: {
				page: pagination.page,
				pageSize: pagination.pageSize,
			},
		};
		try {
			const getUserInfoResult = await adminGetUserInfo(getUserListRequest);
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
	 * ユーザー情報をクリアする
	 */
	async function clearUserInfo(uid: number) {
		isDeleteUser.value = true;
		const clearUserInfoRequest: AdminClearUserInfoRequestDto = {
			uid,
		};
		const clearUserInfoResult = await adminClearUserInfo(clearUserInfoRequest);
		if (clearUserInfoResult.success) {
			message.success("ユーザー情報をクリアしました");
			isOpenUserInfoModal.value = false;
			await getUserInfo();
		} else
			message.error("ユーザー情報のクリアに失敗しました");
		isDeleteUser.value = false;
	}

	/**
	 * ユーザー情報を処理する
	 */
	function handleUserInfo(userData: NonNullable<UserList>[number]) {
		Object.assign(userInfoData, {
			uid: userData.uid,
			avatar: userData.avatar,
			userBannerImage: userData.userBannerImage,
			username: userData.username,
			userNickname: userData.userNickname,
			signature: userData.signature,
			gender: userData.gender,
			label: userData.label,
		});
	}

	/**
	 * ユーザーレビューを承認する
	 */
	async function passUserInfo() {
		isPassUser.value = true;
		const passUserInfoRequest: AdminEditUserInfoRequestDto = {
			uid: userInfoData.uid,
			userInfo: {
				isUpdatedAfterReview: false,
			},
		};
		const passUserInfoResult = await adminEditUserInfo(passUserInfoRequest);
		if (passUserInfoResult.success) {
			message.success("ユーザー情報を承認しました");
			isOpenUserInfoModal.value = false;
			await getUserInfo();
		} else
			message.error("ユーザー情報の承認に失敗しました");
		isPassUser.value = false;
	}

	/**
	 * データを設定してユーザー情報モーダルを開く
	 */
	function openUserInfoModal(userData: NonNullable<UserList>[number]) {
		isOpenUserInfoModal.value = true;
		handleUserInfo(userData);
	}

	onMounted(() => { getUserInfo(); });
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA 最近情報を変更したユーザー</PageHeading>
		<NSpace align="center" justify="space-between">
			<NCollapse class="mlb-4">
				<NCollapseItem title="使用方法">
					<NP>ソートオプション</NP>
					<NUl>
						<NLi>UID、ニックネーム、登録日時をクリックしてテーブルをソートできます</NLi>
						<NLi>再度クリックすると「昇順」と「降順」を切り替えられます</NLi>
						<NLi>デフォルトではUIDの昇順で並んでいます</NLi>
					</NUl>
					<NP>承認ボタンをクリックするとユーザー情報を承認できます。ユーザーのUUIDを入力して確認してください<br />承認後、ユーザーは通常のユーザーに戻ります</NP>
					<NP>クリアボタンをクリックするとユーザー情報をクリアできます。ユーザーのUIDを入力して確認してください<br />クリア後、ユーザー情報は削除されます</NP>
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
		<div class="flex justify-end mt-4">
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
		</div>

		<NModal
			v-model:show="isOpenUserInfoModal"
			:maskClosable="false"
			preset="dialog"
			title="ユーザー情報"
			:style="{ width: '700px' }"
		>
			<br />
			<NImage
				width="100%"
				height="120"
				:src="userInfoData.userBannerImage || '/assets/default-bannar.png'"
				class="object-cover rounded-md"
			/>

			<div class="flex items-center mt-4">
				<NAvatar
					round
					:size="50"
					:src="userInfoData.avatar || '/assets/avatar.svg#person'"
				/>
				<div class="ml-3 flex-1">
					<div class="font-bold">
						{{ userInfoData.userNickname }}
						<span class="text-gray-500">@{{ userInfoData.username }}</span>
					</div>
				</div>
				<div class="whitespace-nowrap">
					性別：{{ genderMap[userInfoData.gender] || '不明' }}
				</div>
			</div>

			<div class="mt-4">
				<div class="font-bold mb-2">自己紹介</div>
				<div class="min-h-[80px] bg-gray-100 p-2 rounded-md">
					{{ userInfoData.signature || '自己紹介がありません' }}
				</div>
			</div>

			<div class="mt-4">
				<div class="font-bold mb-2">ユーザー設定タグ</div>
				<div class="flex flex-wrap gap-2">
					<NTag
						v-for="(tag, index) in (userInfoData.label || [])"
						:key="index"
						type="default"
						size="small"
					>
						{{ tag }}
					</NTag>
					<span v-if="(userInfoData.label || []).length === 0"><NTag size="small" type="info">タグがありません</NTag></span>
				</div>
			</div>

			<div style="margin-top: 24px; text-align: right">
				<NPopconfirm @positiveClick="clearUserInfo(userInfoData.uid)">
					<template #trigger>
						<NButton type="error" :loading="isDeleteUser" style="margin-right: 8px"><Icon name="delete" /></NButton>
					</template>
					このユーザーの情報変更申請を却下してもよろしいですか？
				</NPopconfirm>
				<NButton type="success" :loading="isPassUser" @click="passUserInfo()"><Icon name="check" /></NButton>
			</div>
		</NModal>
	</div>
</template>
