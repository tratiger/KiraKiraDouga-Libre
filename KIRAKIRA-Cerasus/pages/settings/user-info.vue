<docs>
	# ユーザー情報管理
	DELETE: Cerasusに組み込まれている管理設定は、まもなく独立したコンソールプロジェクトLycorisに置き換えられます。
</docs>

<script setup lang="ts">
	const selfUserInfoStore = useSelfUserInfoStore();
	const isAdmin = computed(() => selfUserInfoStore.userInfo.roles?.includes("administrator"));

	const isOnlyShowUserInfoUpdatedAfterReview = ref(false); // 前回の審査通過後にユーザー情報を変更したユーザーのみを表示するかどうか
	const users = ref<AdminGetUserInfoResponseDto>(); // ユーザー情報
	const isLoadingUserInfo = ref(false); // ユーザー情報を読み込み中かどうか
	const pageSize = 20; // ページごとのアイテム数
	const pageCount = computed(() => Math.max(1, Math.ceil(users.value?.totalCount ? users.value.totalCount / pageSize : 0))); // 総ページ数

	const currentPageRef = ref(1);
	const currentPage = computed({ // 現在のページ数
		get() {
			return currentPageRef.value;
		},
		set(page: number) {
			if (!isLoadingUserInfo.value) // TODO: ユーザーデータ読み込み中はページ番号を変更できないようにする、つまり同時に1つのリクエストのみを許可する。
				currentPageRef.value = page;
			else
				useToast("データを読み込み中です。しばらくお待ちください。", "warning", 5000);
		},
	});

	const isOpeningClearUserInfoAlert = ref(false);
	const showClearUserInfoAlert = ref(false);
	const isClearingUserInfo = ref(false);
	const clearedUid = ref();
	const clearedUserInfo = ref<GetUserInfoByUidResponseDto["result"]>();

	const disableCurrentPageEffect = ref(false); // currentPageのwatchの副作用の実行を無効にするかどうか

	/**
	 * 管理者によるユーザー情報取得
	 */
	async function adminGetUserInfo() {
		isLoadingUserInfo.value = true;
		try {
			const headerCookie = useRequestHeaders(["cookie"]);
			const adminGetUserInfoResult = await api.user.adminGetUserInfo(isOnlyShowUserInfoUpdatedAfterReview.value, currentPage.value, pageSize, headerCookie);
			if (adminGetUserInfoResult.success)
				users.value = adminGetUserInfoResult;
			else {
				useToast("ユーザー情報の取得に失敗しました", "error", 5000);
				!!users.value && (users.value = { ...users.value, result: [] });
			}
		} catch (error) {
			useToast("ユーザー情報の取得に失敗しました、ネットワークリクエストの失敗です", "error", 5000);
			!!users.value && (users.value = { ...users.value, result: [] });
		}
		isLoadingUserInfo.value = false;
	}

	/**
	 * 管理者によるユーザー情報の承認
	 * @param UUID - ユーザーのUUID
	 */
	async function approveUserInfo(UUID: string) {
		const approveUserInfoRequest: ApproveUserInfoRequestDto = {
			UUID,
		};
		const approveUserInfoResult = await api.user.approveUserInfo(approveUserInfoRequest);
		if (approveUserInfoResult.success) {
			await adminGetUserInfo();
			useToast("審査通過！", "success");
		}
	}

	/**
	 * ユーザー情報クリアの警告ダイアログを開く
	 */
	async function openClearUserInfoAlert() {
		const uid = clearedUid.value;
		if (uid === undefined || uid === null || uid <= 0) {
			useToast("ユーザーUIDが不正です", "error");
			return;
		}
		isOpeningClearUserInfoAlert.value = true;
		const getUserInfoByUidRequest: GetUserInfoByUidRequestDto = {
			uid,
		};
		const clearedUserInfoResult = await api.user.getUserInfo(getUserInfoByUidRequest);
		if (clearedUserInfoResult.success && clearedUserInfoResult.result) {
			clearedUserInfo.value = clearedUserInfoResult.result;
			showClearUserInfoAlert.value = true;
		} else
			useToast("対象ユーザーのデータを取得できません。UIDが正しいか確認してください", "error", 5000);
		isOpeningClearUserInfoAlert.value = false;
	}

	/**
	 * 管理者があるユーザーの情報をクリアする
	 */
	async function clearUserInfo() {
		const uid = clearedUid.value;
		if (uid === undefined || uid === null || uid <= 0) {
			useToast("ユーザーUIDが不正です", "error");
			return;
		}
		isClearingUserInfo.value = true;
		const adminClearUserInfoRequest: AdminClearUserInfoRequestDto = {
			uid: parseInt(uid, 10),
		};
		const adminClearUserInfoResult = await api.user.adminClearUserInfo(adminClearUserInfoRequest);
		if (adminClearUserInfoResult.success) {
			showClearUserInfoAlert.value = false;
			clearedUid.value = undefined;
			await adminGetUserInfo();
			useToast("ユーザー情報をクリアしました", "success");
		} else
			useToast("対象ユーザーの情報をクリアできません。UIDが正しいか確認してください", "error", 5000);
		isClearingUserInfo.value = false;
	}

	watch(isOnlyShowUserInfoUpdatedAfterReview, async () => {
		disableCurrentPageEffect.value = true; // currentPageのwatchの副作用の実行を阻止する
		currentPage.value = 1;
		await adminGetUserInfo();
		disableCurrentPageEffect.value = false; // currentPageのwatchの副作用の実行を阻止する
	});
	watch(currentPage, async () => {
		!disableCurrentPageEffect.value && await adminGetUserInfo(); // disableCurrentPageEffectの値がfalseの場合のみ実行
	});

	await adminGetUserInfo();

	definePageMeta(
		{
			middleware: [
				(to: unknown) => {
					// WARN: ここでStoreを再作成する必要があります
					const selfUserInfoStore = useSelfUserInfoStore();
					if (!selfUserInfoStore.userInfo.roles?.includes("administrator"))
						return navigate("/settings/appearance");

					if (to && typeof to === "object" && "path" in to && to.path !== "/settings/user-info")
						return navigate("/settings/user-info");
				},
			],
		},
	);
</script>

<template>
	<div>
		<!-- TODO: 多言語対応 -->
		<!-- WARN: このページは多言語対応が必要です -->
		<!-- TODO: 多言語対応 -->

		<Alert v-model="showClearUserInfoAlert" static>
			<h4>このユーザーの情報を本当にクリアしますか？</h4>
			<p>このユーザーのユーザー名、ニックネーム、アバター、自己紹介、性別、ユーザーTAG、誕生日などのユーザー情報がクリアされます。</p>
			<p>クリアされたユーザーは、UUIDをユーザー名として使用します。</p>
			<p>そのユーザーのUUIDが既に使用されている場合、クリアできません。開発チームに連絡して解決してください。</p>
			<div class="clear-user-display">
				<div class="user">
					<UserAvatar :avatar="clearedUserInfo?.avatar" />
					<div class="texts">
						<div class="names">
							<span class="username">{{ clearedUserInfo?.username }}</span> <span v-if="clearedUserInfo?.userNickname">/{{ clearedUserInfo?.userNickname }}</span>
							<!-- <span v-if="memoParen" class="memo" :class="[memoParen]">{{ user?.bio }}</span> -->
							<span class="icons">
								<Icon v-if="clearedUserInfo?.gender === 'male'" name="male" class="male" />
								<Icon v-else-if="clearedUserInfo?.gender === 'female'" name="female" class="female" />
								<span v-else class="other-gender">{{ clearedUserInfo?.gender }}</span>
							</span>
						</div>
						<div class="bio">{{ clearedUserInfo?.signature }}</div>
					</div>
				</div>
			</div>
			<template #footer-left>
				<Button @click="clearUserInfo" :loading="isClearingUserInfo" :disabled="isClearingUserInfo">クリアを確認</Button>
			</template>
			<template #footer-right>
				<Button @click="showClearUserInfoAlert = false" class="secondary">キャンセル</Button>
			</template>
		</Alert>

		<InfoBar type="info" title="ヒント">
			修正後審査：ユーザーが情報を変更すると、すぐに他の人に公開されます。
			<br />
			「新規登録およびユーザー情報を更新した審査待ちのユーザーのみ表示」オプションを有効にして、ユーザー情報を審査できます。
			<br />
			ブロックされたユーザーは自分の情報を変更できませんが、ユーザーをブロックしても既存の情報は削除されません。このページの「ユーザー情報をクリア」機能を使用してください。
		</InfoBar>

		<Subheader icon="placeholder">ユーザー情報をクリア</Subheader>
		<div class="clear-user" v-if="isAdmin">
			<div class="input">
				<TextBox
					type="number"
					v-model="clearedUid"
					placeholder="ユーザー情報をクリア"
					size="large"
					icon="person"
				/>
				<span>情報をクリアしたい対象ユーザーのUIDを入力してください。例えば、UID114の場合は数字の114を入力するだけです。</span>
			</div>
			<Button @click="openClearUserInfoAlert" :disabled="!isAdmin || isOpeningClearUserInfoAlert" :loading="isOpeningClearUserInfoAlert">ユーザー情報をクリア</Button>
		</div>

		<Subheader icon="account_circle" v-if="isOnlyShowUserInfoUpdatedAfterReview">審査待ちユーザー</Subheader>
		<Subheader icon="account_circle" v-else>すべてのユーザー</Subheader>
		<section list>
			<ToggleSwitch v-model="isOnlyShowUserInfoUpdatedAfterReview" icon="visibility">新規登録およびユーザー情報を更新した審査待ちのユーザーのみ表示</ToggleSwitch>
		</section>

		<Pagination v-model="currentPage" :pages="pageCount" :displayPageCount="7" />

		<section v-if="isAdmin && !isLoadingUserInfo && !isOnlyShowUserInfoUpdatedAfterReview">
			<SettingsChipItem
				v-for="user in users?.result"
				:key="user.uid"
				:image="user.avatar"
				icon="account_circle"
				:details="`UID ${user.uid}, UUID ${user.UUID}` + (user.signature?.trim() ? ` - ${user.signature}` : '')"
				trailingIcon="open_in_new"
				:href="`/user/${user.uid}`"
			>
				<div class="name">
					<span class="nickname">{{ user.userNickname }}</span>
					<span class="username">@{{ user.username }}</span>
					<div class="icons">
						<Icon v-if="user.gender === 'male' " name="male" class="male" />
						<Icon v-else-if="user.gender === 'female'" name="female" class="female" />
						<Icon v-if="user.roles?.includes('administrator')" name="build_circle" class="admin" />
					</div>
				</div>
			</SettingsChipItem>
		</section>

		<section v-if="isAdmin && !isLoadingUserInfo && isOnlyShowUserInfoUpdatedAfterReview">
			<SettingsChipItem
				v-for="user in users?.result"
				:key="user.uid"
				:image="user.avatar"
				icon="account_circle"
				:details="`UID ${user.uid}, UUID ${user.UUID}` + (user.signature?.trim() ? ` - ${user.signature}` : '')"
				trailingIcon="check"
				@trailingIconClick="() => approveUserInfo(user.UUID)"
			>
				<div class="name">
					<span class="nickname">{{ user.userNickname }}</span>
					<span class="username">@{{ user.username }}</span>
					<div class="icons">
						<Icon v-if="user.gender === 'male' " name="male" class="male" />
						<Icon v-else-if="user.gender === 'female'" name="female" class="female" />
						<Icon v-if="user.roles?.includes('administrator')" name="build_circle" class="admin" />
					</div>
				</div>
			</SettingsChipItem>
		</section>
	</div>
</template>

<style scoped lang="scss">
	.text-box {
		--size: large;
	}

	.clear-user {
		display: flex;
		gap: 8px;
		align-items: flex-start;

		.input {
			display: flex;

			flex: 1;
			flex-direction: column;
			gap: 8px;

			span {
				color: c(icon-color);
				font-size: 12px;
				text-align: right;
			}
		}

		button {
			margin-top: 3px;
		}
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;

		.nickname {
			@include hide-if-empty;
			font-weight: bold;
		}

		.username {
			color: c(icon-color);
		}

		.icons {
			@include flex-center;

			.male {
				color: c(blue);
			}

			.female {
				color: c(pink);
			}

			.admin {
				color: c(red);
			}
		}
	}
</style>
