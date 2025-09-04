<docs>
	# ズーム式サイドスライドナビゲーションメニュー（旧版モバイルQQ風）
</docs>

<script setup lang="ts">
	const shown = defineModel<boolean>({ default: false });

	const drawerItems: { name: string; icon: DeclaredIcons; route?: string }[] = [
		{ name: t.history, icon: "history", route: "/history" },
		{ name: t(2).collection, icon: "star", route: "/collections" },
		{ name: t.upload, icon: "upload", route: "/upload" },
	];

	/**
	 * ルートに移動します。
	 * @param route - ルート。
	 */
	function to(route?: string) {
		if (route === undefined) return;
		shown.value = false;
		navigate(route);
	}

	const selfUserInfoStore = useSelfUserInfoStore();

	/**
	 * ユーザーアバタークリックイベント。未ログイン時はログインを促し、ログイン済みなら個人ページに移動します。
	 */
	function onClickUser() {
		shown.value = false;
		if (!selfUserInfoStore.isLogined) useEvent("app:requestLogin");
		else to("/user");
	}
</script>

<template>
	<Comp>
		<div class="user">
			<UserAvatar
				v-tooltip="selfUserInfoStore.isLogined ? selfUserInfoStore.userInfo.userNickname : t.login"
				:avatar="selfUserInfoStore.isLogined ? selfUserInfoStore.userInfo.avatar : undefined"
				@click="onClickUser"
			/>
			<p class="nickname">{{ selfUserInfoStore.isLogined ? selfUserInfoStore.userInfo.userNickname : t.pleaseLogin }}</p>
			<p v-if="selfUserInfoStore.isLogined" class="username">@{{ selfUserInfoStore.userInfo.username }}</p>
			<p v-if="selfUserInfoStore.isLogined && selfUserInfoStore.userInfo.signature" class="bio">{{ selfUserInfoStore.userInfo.signature }}</p>
		</div>
		<div class="grid">
			<div v-for="item in drawerItems" :key="item.icon" v-ripple class="drawer-item" @click="to(item.route)">
				<Icon :name="item.icon" />
				<label>{{ item.name }}</label>
			</div>
		</div>
		<div class="tab-bar vertical"><!-- TabBarのふり -->
			<TabItem id="settings" v-ripple icon="settings" _internalIsVertical @click="to('/settings')">{{ t.settings }}</TabItem>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: 60dvw;
		padding: 24px;
	}

	.user {
		.nickname {
			margin-top: 16px;
			font-size: 16px;
			font-weight: bold;
		}

		.username {
			margin-top: 4px;
			color: c(icon-color);
			font-size: 12px;
		}

		.bio {
			margin-top: 12px;
			font-size: 12px;
		}
	}

	.tab-bar {
		margin-inline: -14px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-block: 12px;

		.drawer-item {
			@include round-large;
			@include card-in-card-shadow;
			display: flex;
			flex-direction: column;
			gap: 4px;
			align-items: center;
			padding-block: 12px;
			color: c(icon-color);
			font-size: 13px;
			background-color: c(main-bg, 50%);
			cursor: pointer;

			.icon {
				font-size: 32px;
			}

			&:any-hover {
				@include chip-shadow;
			}

			&:active {
				@include button-scale-pressed;
			}
		}
	}
</style>
