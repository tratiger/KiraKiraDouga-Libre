<script lang="ts">
	export const tabs = [
		{ id: "", icon: "home" }, // ホーム、Markdown自己紹介を上部に配置（GitHubのように）、下にはユーザーが投稿したすべてのコンテンツを表示し、「フォロー（/feed/following）」ページに似た形式
		{ id: "videos", name: "video", icon: "movie" }, // 動画
		// { id: "series", icon: "video_library" }, // シリーズ
		// { id: "posts", name: "post", icon: "post" }, // 投稿
		// { id: "audios", icon: "music" }, // 音声
		// { id: "albums", icon: "photo_library" }, // アルバムまたはフォトアルバム。QQスペースのアルバムに似ており、すべての投稿の画像はデフォルトでここに配置されます。アルバム名は直接「投稿」とすることができます。
		{ id: "collections", name: "collection", icon: "star" },
	];
</script>

<script setup lang="ts">
	definePageMeta({
		pageTransition: {
			name: "page-jump-in",
			mode: "out-in",
		},
		async middleware(to, from) {
			const { tabs } = await import("./user.vue");
			if (to.meta.pageTransition && typeof to.meta.pageTransition !== "boolean") {
				const [path, prevPath] = [removeI18nPrefix(to.path), removeI18nPrefix(from.path)];
				if (path.startsWith("/user/") && prevPath.startsWith("/user/")) {
					const [tab, prevTab] = [path.split("/")[3], prevPath.split("/")[3]];
					const [index, prevIndex] = [tabs.findIndex(i => i.id === tab), tabs.findIndex(i => i.id === prevTab)];
					if (index !== prevIndex)
						to.meta.pageTransition.name = index > prevIndex ? "right" : index < prevIndex ? "left" : "";
				} else
					to.meta.pageTransition.name = "page-jump-in";
			}
		},
	});

	const selfUserInfoStore = useSelfUserInfoStore();

	const headerCookie = useRequestHeaders(["cookie"]);
	await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore: useAppSettingsStore(), selfUserInfoStore, headerCookie });

	const isSelf = ref(false); // 現在のページが自分自身か
	const isFollowing = ref(false); // 現在のページのユーザーをフォローしているか
	const userInfo = ref<GetUserInfoByUidResponseDto>(); // ユーザー情報（自分自身の情報ではない）
	const actionMenu = ref<FlyoutModel>();
	const currentTab = computed(() => currentUserTab());

	const urlUid = ref(); // URL内のUID
	urlUid.value = currentUserUid(); // SSR
	const nuxtApp = useNuxtApp();
	nuxtApp.hook("page:finish", () => {
		urlUid.value = currentUserUid(); // CSR
	});

	const selfUid = computed(() => selfUserInfoStore.userInfo.uid); // 自分のUID（ログイン済みの場合）

	/**
	 * ユーザーをブロックします
	 */
	async function blockUser() {
		try {
			const blockUid = urlUid.value;

			if (blockUid === undefined || blockUid === null || blockUid < 1) {
				console.error("ERROR", "ブロックするユーザーのUID形式が正しくありません。空または0未満にすることはできません");
				// TODO: 使用多语言
				useToast("ブロックするユーザーのUID形式が正しくありません", "error", 5000);
				return;
			}

			if (selfUserInfoStore.userInfo.uid === blockUid) {
				console.error("ERROR", "自分自身をブロックすることはできません");
				// TODO: 使用多语言
				useToast("自分自身をブロックすることはできません", "error", 5000);
				return;
			}

			const blockUserByUidRequest: BlockUserByUidRequestDto = {
				blockUid,
			};
			const blockUserResult = await api.block.blockUserController(blockUserByUidRequest);
			if (blockUserResult.success) {
				// TODO: 使用多语言
				useToast("ユーザーをブロックしました", "success");
				navigate("/");
			} else {
				console.error("ERROR", "ユーザーのブロックに失敗しました");
				// TODO: 使用多语言
				useToast("ユーザーのブロックに失敗しました", "error", 5000);
			}
		} catch (error) {
			console.error("ERROR", "ユーザーをブロック中にエラーが発生しました", error);
			// TODO: 使用多语言
			useToast("ユーザーをブロック中にエラーが発生しました", "error", 5000);
		}
	}

	/**
	 * fetch user profile data
	*/
	async function fetchUserData() {
		if (urlUid.value === selfUserInfoStore.userInfo.uid)
			isSelf.value = true;
		else {
			isSelf.value = false;
			const getUserInfoByUidRequest: GetUserInfoByUidRequestDto = {
				uid: urlUid.value,
			};
			const headerCookie = useRequestHeaders(["cookie"]);
			const userInfoResult = await api.user.getUserInfo(getUserInfoByUidRequest, headerCookie);
			if (!userInfoResult.success)
				useToast("ユーザー情報の取得に失敗しました", "error", 5000); // TODO: 使用多语言

			if (userInfoResult.isBlocked)
				navigateToErrorPage(404);

			isFollowing.value = !!userInfoResult.result?.isFollowing;
			userInfo.value = userInfoResult;
		}
	}

	await fetchUserData();
	watch(() => [urlUid.value, selfUid.value], fetchUserData);

	const titleAffixString = t.user_page.title_affix; // HACK: Bypass "A composable that requires access to the Nuxt instance was called outside of a plugin."
	const titleUserNickname = computed(() => isSelf.value ? selfUserInfoStore.userInfo.userNickname ? titleAffixString(selfUserInfoStore.userInfo.userNickname) : "" : userInfo.value?.result?.userNickname ? titleAffixString(userInfo.value?.result?.userNickname) : "");
	useHead({ title: titleUserNickname });
</script>

<template>
	<div>
		<header>
			<div>
				<div class="content">
					<UserContent
						v-tooltip="isSelf ? t.profile.edit : undefined"
						:avatar="isSelf ? selfUserInfoStore.userInfo.avatar : userInfo?.result?.avatar"
						:username="isSelf ? selfUserInfoStore.userInfo.username : userInfo?.result?.username"
						:nickname="isSelf ? selfUserInfoStore.userInfo.userNickname : userInfo?.result?.userNickname"
						:gender="isSelf ? selfUserInfoStore.userInfo.gender : userInfo?.result?.gender"
						:roles="isSelf ? selfUserInfoStore.userInfo.roles : userInfo?.result?.roles"
						:to="isSelf ? `/settings/profile` : undefined"
						size="huge"
						center
					>
						<template #description>
							{{ isSelf ? selfUserInfoStore.userInfo.signature : userInfo?.result?.signature }}
						</template>
					</UserContent>
					<div class="actions">
						<!-- <SoftButton v-tooltip:top="'ダイレクトメッセージ'" icon="email" /> -->
						<SoftButton v-if="!isSelf" v-tooltip:top="t.more" icon="more_vert" @click="e => actionMenu = [e, 'y']" />
						<Menu v-if="!isSelf" v-model="actionMenu">
							<MenuItem icon="groups">{{ t.add_to_group }}</MenuItem>
							<MenuItem icon="badge">{{ t.modify_memo }}</MenuItem>
							<hr />
							<MenuItem icon="flag">{{ t.report }}</MenuItem>
							<MenuItem icon="block" @click="blockUser">{{ t.block_user }}</MenuItem>
						</Menu>
						<FollowButton v-if="!isSelf" :uid="urlUid" :isFollowing />
						<Button v-if="isSelf" href="/upload">{{ t.manage_content }}</Button>
					</div>
				</div>
				<TabBar v-model="currentTab">
					<TabItem v-for="tab in tabs" :id="tab.id" :key="tab.id" :icon="tab.icon" :to="`/user/${urlUid}/${tab.id}`">{{ t(2)[tab.name || "home"] }}</TabItem>
				</TabBar>
			</div>
		</header>
		<div v-if="!userInfo?.isBlocked" class="slot">
			<NuxtPage />
		</div>
	</div>
</template>

<style scoped lang="scss">
	$header-height: 134px;
	$main-margin-top: 32px;

	header {
		@include card-shadow;
		position: sticky;
		top: 0;
		z-index: 4;
		padding: 0 $page-padding-x;
		background-color: c(surface-color);

		@include tablet {
			padding: 0 $page-padding-x-tablet;
		}

		@include mobile {
			padding: 0 $page-padding-x-mobile;
		}
	}

	.content {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: space-between;
		align-items: center;
		padding: 24px 0;

		.actions {
			display: flex;
			gap: 16px;
			justify-content: flex-end;
			align-items: center;
			margin-left: auto;

			.soft-button {
				--ripple-size: var(--wrapper-size);
			}
		}
	}

	.tab-bar {
		--clipped: true;
		--loose: true;
		--size: big;
		margin: 0 (-$page-padding-x);

		&:deep(.items) {
			padding: 0 $page-padding-x;
		}
	}

	.slot:deep(.container) {
		display: flex;
		gap: 20px;
		align-items: flex-start;
		padding: $main-margin-top $page-padding-x;

		@include tablet {
			flex-direction: column-reverse;
			padding: $page-padding-x-tablet;

			.toolbox-card {
				width: 100%;
			}
		}

		@include mobile {
			padding: $page-padding-x-mobile;
		}

		> .left,
		> .right {
			flex-shrink: 0;

			@include computer {
				position: sticky;
				top: $header-height + $main-margin-top;
			}
		}

		> .center {
			width: 100%;
		}

		&:has(> .center):has(> .left):has(> .right) {
			@media (width < 1280px) {
				flex-direction: column;

				.toolbox-card {
					width: 100%;
				}

				> .left,
				> .right {
					position: static;
				}

				> .right {
					order: 1;
				}

				> .center {
					order: 2;
				}
			}
		}

		.sort {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	header,
	main {
		@include tablet {
			padding: 0 $page-padding-x-tablet;

			.tab-bar {
				margin: 0 (-$page-padding-x-tablet);

				&:deep(.items) {
					padding: 0 $page-padding-x-tablet;
				}
			}
		}

		@include mobile {
			padding: 0 $page-padding-x-mobile;

			.tab-bar {
				margin: 0 (-$page-padding-x-mobile);

				&:deep(.items) {
					padding: 0 calc($page-padding-x-mobile / 2);
				}
			}
		}
	}
</style>
