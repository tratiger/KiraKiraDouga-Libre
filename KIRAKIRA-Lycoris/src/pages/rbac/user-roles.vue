<script setup lang="ts">
	const dialog = useDialog();

	const isEnableEditUserRole = ref(false);
	const isShowSubmitUserRolesModal = ref(false);
	const inputUid = ref<number>();
	const isUpdatingUserRole = ref(false);

	type RbacRole = GetRbacRoleResponseDto["result"];
	const rbacRole = ref<RbacRole>([]);
	const rbacRoleOption = computed(() => rbacRole.value?.map(role => {
		return {
			label: role.roleName,
			value: role.roleName,
		};
	}));

	const userRolesFormModel = ref<{
		uid: number | undefined;
		uuid: string | undefined;
		username: string | undefined;
		userNickname: string | undefined;
		userRoles: string[] | undefined;
	}>({
		uid: undefined,
		uuid: undefined,
		username: undefined,
		userNickname: undefined,
		userRoles: undefined,
	});

	/**
	 * UIDによってユーザーのロールを取得する
	 */
	async function adminFetchUserRole() {
		if (inputUid.value === undefined || inputUid.value === null) return;

		const adminGetUserRolesByUidRequest: AdminGetUserRolesByUidRequestDto = {
			uid: inputUid.value ?? 0,
		};
		const userRolesResult = await adminGetUserRolesController(adminGetUserRolesByUidRequest);
		if (userRolesResult.success)
			userRolesFormModel.value = {
				uid: userRolesResult.result?.uid,
				uuid: userRolesResult.result?.uuid,
				username: userRolesResult.result?.username,
				userNickname: userRolesResult.result?.userNickname,
				userRoles: userRolesResult.result?.roles.map(role => role.roleName),
			};
	}

	/**
	 * RBACロールを取得する
	 */
	async function fetchRbacRole() {
		const getRbacRoleRequest: GetRbacRoleRequestDto = {
			search: {},
			pagination: {
				page: 1,
				pageSize: 1000,
			},
		};
		const rbacRoleResult = await getRbacRoleController(getRbacRoleRequest);
		if (rbacRoleResult.success)
			rbacRole.value = rbacRoleResult.result;
		else
			console.error("ERROR", "RBACロールの取得に失敗しました。");
	}

	/**
	 * 管理者がユーザーのロールを更新する
	 */
	async function adminUpdateUserRoles() {
		if (!userRolesFormModel.value.uuid || !userRolesFormModel.value.userRoles) return;

		isUpdatingUserRole.value = true;

		const adminUpdateUserRoleRequest: AdminUpdateUserRoleRequestDto = {
			uuid: userRolesFormModel.value.uuid,
			uid: undefined as never,
			newRoles: userRolesFormModel.value.userRoles,
		};

		const adminUpdateUserRolesResult = await adminUpdateUserRoleController(adminUpdateUserRoleRequest);

		if (adminUpdateUserRolesResult.success) {
			await adminFetchUserRole();
			isEnableEditUserRole.value = false;
			isShowSubmitUserRolesModal.value = false;
		} else
			dialog.error({
				title: "管理者によるユーザーロールの更新に失敗しました",
				content: adminUpdateUserRolesResult.message,
				positiveText: "OK",
			});

		isUpdatingUserRole.value = false;
	}

	onMounted(fetchRbacRole);
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA RBAC ユーザーロール管理</PageHeading>
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
					ユーザーのロールを照会したり、ロールを割り当てたり、割り当てを解除したりすることができます。<br />
					以下の特殊な名前を持つロールは特別な効果があるため、割り当てや解除の際には特に注意してください：
				</NP>
				<NUl>
					<NLi><b>root</b> - RBACの管理権限を持ちます</NLi>
					<NLi><b>adminsitrator</b> - コンテンツの管理権限を持ちます</NLi>
					<NLi><b>developer</b> - 特定の開発リソースへのアクセス権を持ちます</NLi>
					<NLi><b>user</b> - 一般ユーザー</NLi>
					<NLi><b>blocked</b> - ブロックされたユーザー</NLi>
				</NUl>
				<NP>注意：blockedロールは他のロールと互いに排他的です</NP>
			</NCollapseItem>
		</NCollapse>
		<NFlex justify="center">
			<NInputNumber v-model:value="inputUid" placeholder="照会したいユーザーのUID" :showButton="false" />
			<NButton @click="adminFetchUserRole"><template #icon><Icon name="search" /></template>照会</NButton>
		</NFlex>
		<NDivider />
		<NForm
			ref="formRef"
			:model="userRolesFormModel"
			labelPlacement="left"
			:labelWidth="160"
			class="max-is-[640px]"
		>
			<NFormItem label="ユーザーUID" path="uid">
				<NInputNumber v-model:value="userRolesFormModel.uid" placeholder="ユーザーを照会後に表示" :showButton="false" :disabled="true" />
			</NFormItem>
			<NFormItem label="ユーザーUUID" path="uuid">
				<NInput v-model:value="userRolesFormModel.uuid" placeholder="ユーザーを照会後に表示" :disabled="true" />
			</NFormItem>
			<NFormItem label="ユーザー名" path="username">
				<NInput v-model:value="userRolesFormModel.username" placeholder="ユーザーを照会後に表示" :disabled="true" />
			</NFormItem>
			<NFormItem label="ニックネーム" path="userNickname">
				<NInput v-model:value="userRolesFormModel.userNickname" placeholder="ユーザーを照会後に表示" :disabled="true" />
			</NFormItem>
			<NFormItem label="編集を有効にする">
				<NSwitch v-model:value="isEnableEditUserRole" />
			</NFormItem>
			<NFormItem label="ユーザーロール" path="userRoles">
				<NTransfer
					:disabled="!isEnableEditUserRole || !userRolesFormModel.uuid"
					v-model:value="userRolesFormModel.userRoles"
					:options="rbacRoleOption"
					sourceFilterable
					targetFilterable
				/>
			</NFormItem>
			<!-- TODO: ラベルのプレースホルダーは欲しいけど、ラベルテキストは表示したくない。label=" "のようなエレガントでない方法しかないのか？ -->
			<NFormItem label=" ">
				<NButton :disabled="!isEnableEditUserRole || !userRolesFormModel.uuid" @click="isShowSubmitUserRolesModal = true">
					ユーザーロールを更新
				</NButton>
			</NFormItem>
		</NForm>

		<NModal
			v-model:show="isShowSubmitUserRolesModal"
			:maskClosable="false"
			preset="dialog"
			title="ユーザーのロールを更新してもよろしいですか？"
			negativeText="キャンセル"
			@positiveClick="adminUpdateUserRoles"
		>
			<NForm>
				<NFormItem label="ユーザーUID">
					<NInputNumber v-model:value="userRolesFormModel.uid" :showButton="false" :disabled="true" class="is-full" />
				</NFormItem>
				<NFormItem label="ユーザーUUID">
					<NInput v-model:value="userRolesFormModel.uuid" :showButton="false" :disabled="true" />
				</NFormItem>
				<NFormItem label="ユーザーのロールは以下の内容に更新されます">
					<NFlex>
						<NTag v-for="role in userRolesFormModel.userRoles" :key="role">{{ role }}</NTag>
					</NFlex>
				</NFormItem>
			</NForm>
			<template #action>
				<NButton @click="isShowSubmitUserRolesModal = false">キャンセル</NButton>
				<NButton :loading="isUpdatingUserRole" type="warning" :secondary="true" @click="adminUpdateUserRoles">更新を確認</NButton>
			</template>
		</NModal>
	</div>
</template>
