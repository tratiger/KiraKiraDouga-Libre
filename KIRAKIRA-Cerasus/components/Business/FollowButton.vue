<docs>
	# フォロー/フォロー解除ボタン。
</docs>

<script setup lang="ts">
	const props = defineProps<{
		/** ユーザーUID。 */
		uid: number;
		/** フォロー済みか？（初期化時） */
		isFollowing: boolean;
	}>();

	const isFollowing = ref(props.isFollowing); // フォロー中か
	const isTogglingFollow = ref(false); // ユーザーのフォローまたはフォロー解除リクエストを送信中か
	const followButton = ref<InstanceType<typeof Button>>(); // フォローボタンのインスタンス
	const unfollowMenu = ref<FlyoutModel>(); // 「フォロー中」ボタンをクリックしたときに表示されるフォロー解除メニュー

	/**
	 * フォローボタンクリックイベント。
	 * @param e - マウスイベント。
	 */
	async function onFollowButtonClick(e: MouseEvent) {
		const button = e.target as HTMLButtonElement;
		if (!isFollowing.value)
			await animateSize(button, async () => {
				await followingUser();
			});
		else
			unfollowMenu.value = [e, "y"];
	}

	/**
	 * フォロー解除ボタンクリックイベント。
	 */
	async function onUnfollowButtonClick() {
		if (!followButton.value) return;
		const button = followButton.value.$el as HTMLButtonElement;
		await animateSize(button, async () => {
			await unfollowingUser();
		});
	}

	/**
	 * 現在のURLに対応するユーザーをフォローします。
	 */
	async function followingUser() {
		isTogglingFollow.value = true;
		try {
			const followingUploaderRequest: FollowingUploaderRequestDto = {
				followingUid: props.uid ?? -1,
			};
			const { data } = await api.feed.followingUploader(followingUploaderRequest);
			if (data.value?.success)
				isFollowing.value = true;
			else
				useToast(t.toast.something_went_wrong, "error", 5000);
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERROR", "ユーザーフォロー時にエラーが発生しました：", error);
		}
		isTogglingFollow.value = false;
	}

	/**
	 * 現在のURLに対応するユーザーのフォローを解除します。
	 */
	async function unfollowingUser() {
		isTogglingFollow.value = true;
		try {
			const unfollowingUploaderRequest: UnfollowingUploaderRequestDto = {
				unfollowingUid: props.uid ?? -1,
			};
			const { data } = await api.feed.unfollowingUploader(unfollowingUploaderRequest);
			if (data.value?.success)
				isFollowing.value = false;
			else {
				isFollowing.value = true;
				useToast(t.toast.something_went_wrong, "error", 5000);
			}
		} catch (error) {
			isFollowing.value = true;
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERROR", "ユーザーのフォロー解除時にエラーが発生しました：", error);
		}
		isTogglingFollow.value = false;
	}
</script>

<template>
	<Button
		ref="followButton"
		class="follow-button"
		:icon="isFollowing ? 'check' : 'add'"
		:disabled="isTogglingFollow"
		:loading="isTogglingFollow"
		@click="onFollowButtonClick"
	>
		{{ isFollowing ? t.following : t.follow_verb }}
		<Menu v-model="unfollowMenu">
			<MenuItem icon="close" @click="onUnfollowButtonClick">{{ t.unfollow_verb }}</MenuItem>
		</Menu>
	</Button>
</template>
