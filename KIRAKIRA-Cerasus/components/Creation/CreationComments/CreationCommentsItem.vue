<script setup lang="ts">
	import NumberFlow from "@number-flow/vue";

	const props = withDefaults(defineProps<{
		/** コメントの一意のID */
		commentId: string;
		/** コメントが属する動画のID */
		videoId: number;
		/** コメント投稿者のアバターURL。 */
		avatar?: string;
		/** コメント投稿者のニックネーム。 */
		nickname?: string;
		/** コメント投稿者のユーザー名。 */
		username?: string;
		/** コメント投稿者のロール */
		roles?: string[];
		/** コメントのシーケンス番号。 */
		index?: number; // コメント数がほとんどの場合2桁以下であると仮定することはできないため、シーケンス番号の前に0を付けることには賛成しません。
		/** コメントの投稿日。 */
		date?: Date;
		/** ユーザーUID。 */
		uid: number;
		/** コメントのルート */
		commentRoute: string;
	}>(), {
		avatar: undefined,
		username: "匿名ユーザー",
		index: undefined,
		date: () => new Date(),
		uid: undefined,
	});

	/** このコメントに加算される値。 */
	const upvote = defineModel("upvote", { default: 0 });
	/** すでに賛成票をクリックしましたか？ */
	const isUpvoted = defineModel("isUpvoted", { default: false });
	/** このコメントから減算される値。 */
	const downvote = defineModel("downvote", { default: 0 });
	/** すでに反対票をクリックしましたか？ */
	const isDownvoted = defineModel("isDownvoted", { default: false });
	const menu = ref<FlyoutModel>();
	/** ピン留めされていますか？ */
	const pinned = defineModel("pinned", { default: false });
	const unpinnedCaption = computed(() => pinned.value ? "unpin" : "pin");

	const voteLock = ref(false);

	const userSelfInfoStore = useSelfUserInfoStore();
	const isSelfComment = computed(() => props.uid === userSelfInfoStore.userInfo.uid); // このコメントが自分で送信したものかどうか
	const isAdmin = computed(() => userSelfInfoStore.userInfo.roles?.includes("administrator")); // ユーザーが管理者かどうか

	/**
	 * 賛成票、反対票ボタンのクリックイベント。
	 * @param button - クリックされたボタンが賛成票か反対票か。
	 * @param [noNestingDolls] - 再帰呼び出しを防ぐための入れ子禁止。
	 */
	function onClickVotes(button: "upvote" | "downvote", noNestingDolls: boolean = false) {
		// const states = { upvote, isUpvoted, downvote, isDownvoted };
		// const value = states[button], clicked = states[`${button}Clicked`]; // 面向字符串编程。
		// const another = button === "like" ? "dislike" : "like";
		// const isActive = clicked.value = !clicked.value, gain = isActive ? 1 : -1;
		// value.value += gain;
		// if (isActive && states[`${another}Clicked`].value && !noNestingDolls) onClickUpvote(another, true);

		const commentId = props.commentId; // 動画コメントID
		const videoId = props.videoId; // 動画ID

		if (!props.index || !commentId || videoId === undefined || videoId === null) { // nullでないことの検証
			useToast(t.toast.something_went_wrong, "error");
			return;
		}

		if (voteLock.value) { // リクエストの「ペシミスティックロック」がロック状態の場合、エラープロンプトを表示して停止します
			useToast(t.toast.too_many_requests, "error");
			return;
		}

		if (!userSelfInfoStore.isLogined) { // ユーザーがログインしていない場合、賛成/反対票を投じることはできません
			useEvent("app:requestLogin");
			return;
		}

		if (button === "upvote") // 賛成票か反対票かを判断
			if (isUpvoted.value) // 賛成票が投じられた動画コメントが以前に賛成票を投じられていた場合は、賛成票を取り消し、そうでない場合は賛成票を投じます
				// 賛成票を取り消す
				cancelVideoCommentUpvote(commentId, videoId);
			else
				// 賛成票
				emitVideoCommentUpvote(commentId, videoId);
		else
			if (isDownvoted.value) // 反対票が投じられた動画コメントが以前に反対票を投じられていた場合は、反対票を取り消し、そうでない場合は反対票を投じます
				// 反対票を取り消す
				cancelVideoCommentDownvote(commentId, videoId);
			else
				// 反対票
				emitVideoCommentDownvote(commentId, videoId);
	}

	/**
	 * 動画コメントの賛成票
	 * @param commentId - 動画コメントID
	 * @param videoId - 動画ID
	 */
	function emitVideoCommentUpvote(commentId: string, videoId: number) {
		voteLock.value = true; // リクエストロック：ロック
		const emitVideoCommentUpvoteRequest: EmitVideoCommentUpvoteRequestDto = { id: commentId, videoId };
		api.videoComment.emitVideoCommentUpvote(emitVideoCommentUpvoteRequest).catch(error => {
			voteLock.value = false; // リクエストロック：解放
			useToast(t.toast.something_went_wrong, "error");
			console.error("ERROR", "Failed to upvote:", error);
		}).finally(() => {
			voteLock.value = false; // リクエストロック：解放
		});

		isUpvoted.value = true; // 賛成票アイコンをハイライトに設定
		upvote.value++; // 賛成票数を増やす
		if (isDownvoted.value) { // ユーザーが賛成票を投じる前にすでに反対票を投じていた場合は、反対票のハイライトをキャンセルし、反対票の数を減らします
			isDownvoted.value = false;
			downvote.value--;
		}
	}

	/**
	 * 動画コメントの賛成票を取り消す
	 * @param commentId - 動画コメントID
	 * @param videoId - 動画ID
	 */
	function cancelVideoCommentUpvote(commentId: string, videoId: number) {
		voteLock.value = true; // リクエストロック：ロック
		const cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto = { id: commentId, videoId };
		api.videoComment.cancelVideoCommentUpvote(cancelVideoCommentUpvoteRequest).catch(error => {
			voteLock.value = false; // リクエストロック：解放
			useToast(t.toast.something_went_wrong, "error");
			console.error("ERROR", "Failed to undo upvote:", error);
		}).finally(() => {
			voteLock.value = false; // リクエストロック：解放
		});

		isUpvoted.value = false; // 賛成票アイコンのハイライトをキャンセル
		upvote.value--; // 賛成票数を減らす
	}

	/**
	 * 動画コメントの反対票
	 * @param commentId - 動画コメントID
	 * @param videoId - 動画ID
	 */
	function emitVideoCommentDownvote(commentId: string, videoId: number) {
		voteLock.value = true; // リクエストロック：ロック
		const emitVideoCommentDownvoteRequest: EmitVideoCommentDownvoteRequestDto = { id: commentId, videoId };
		api.videoComment.emitVideoCommentDownvote(emitVideoCommentDownvoteRequest).catch(error => {
			voteLock.value = false; // リクエストロック：解放
			useToast(t.toast.something_went_wrong, "error");
			console.error("ERROR", "Failed to downvote:", error);
		}).finally(() => {
			voteLock.value = false; // リクエストロック：解放
		});

		isDownvoted.value = true; // 反対票アイコンをハイライトに設定
		downvote.value++; // 反対票数を増やす
		if (isUpvoted.value) { // ユーザーが反対票を投じる前にすでに賛成票を投じていた場合は、賛成票のハイライトをキャンセルし、賛成票の数を減らします
			upvote.value--;
			isUpvoted.value = false;
		}
	}

	/**
	 * 動画コメントの反対票を取り消す
	 * @param commentId - 動画コメントID
	 * @param videoId - 動画ID
	 */
	function cancelVideoCommentDownvote(commentId: string, videoId: number) {
		voteLock.value = true; // リクエストロック：ロック
		const cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto = { id: commentId, videoId };
		api.videoComment.cancelVideoCommentDownvote(cancelVideoCommentDownvoteRequest).catch(error => {
			voteLock.value = false; // リクエストロック：解放
			useToast(t.toast.something_went_wrong, "error");
			console.error("ERROR", "Failed to undo downvote:", error);
		}).finally(() => {
			voteLock.value = false; // リクエストロック：解放
		});

		isDownvoted.value = false; // 反対票アイコンのハイライトをキャンセル
		downvote.value--; // 反対票数を減らす
	}

	/**
	 * 自分のコメントを削除する
	 * @param commentRoute - コメントのルート
	 * @param videoId - KVID 動画ID
	 */
	async function deleteSelfComment(commentRoute?: string, videoId?: number) {
		if (!commentRoute || !videoId) return;
		const deleteSelfVideoCommentRequest: DeleteSelfVideoCommentRequestDto = {
			videoId,
			commentRoute,
		};
		const deleteVideoResult = await api.videoComment.deleteSelfVideoComment(deleteSelfVideoCommentRequest);
		if (deleteVideoResult.success) {
			useToast(t.toast.comment_delete_success, "success", 5000);
			useEvent("videoComment:deleteVideoComment", commentRoute);
		} else
			useToast(t.toast.something_went_wrong, "error", 5000);
			// TODO: パフォーマンスの問題
	}

	/**
	 * 管理者がコメントを削除する
	 * @param commentRoute - コメントのルート
	 * @param videoId - KVID 動画ID
	 */
	async function adminDeleteVideoComment(commentRoute?: string, videoId?: number) {
		if (!commentRoute || !videoId) return;
		const adminDeleteVideoCommentRequest: AdminDeleteVideoCommentRequestDto = {
			videoId,
			commentRoute,
		};
		const deleteVideoResult = await api.videoComment.adminDeleteVideoComment(adminDeleteVideoCommentRequest);
		if (deleteVideoResult.success) {
			useToast(t.toast.comment_delete_success, "success", 5000);
			useEvent("videoComment:deleteVideoComment", commentRoute);
		} else
			useToast(t.toast.something_went_wrong, "error", 5000);
			// TODO: パフォーマンスの問題
	}
</script>

<template>
	<Comp>
		<UserContent
			:avatar
			:uid
			:nickname
			:username
			:date
			:index
			:pinned
		>
			<div class="comments">
				<slot></slot>
			</div>

			<template #footerLeft>
				<div class="votes">
					<SoftButton v-tooltip:bottom="t.upvote" icon="arrow_up" :active="isUpvoted" @click="onClickVotes('upvote')" />
					<NumberFlow :value="upvote - downvote" />
					<SoftButton v-tooltip:bottom="t.downvote" icon="arrow_down" :active="isDownvoted" @click="onClickVotes('downvote')" />
				</div>
			</template>

			<template #footerRight>
				<SoftButton v-tooltip:bottom="t.reply" icon="reply" />
				<SoftButton v-tooltip:bottom="t.more" icon="more_vert" @click="e => menu = [e, 'y']" />
				<Menu v-model="menu">
					<MenuItem v-if="isSelfComment" icon="delete" @click="deleteSelfComment(commentRoute, videoId)">{{ t.delete }}</MenuItem>
					<MenuItem v-if="isAdmin" icon="delete" @click="adminDeleteVideoComment(commentRoute, videoId)">{{ t.delete }}{{ t.admin_operation_suffix }}</MenuItem>
					<MenuItem :icon="unpinnedCaption" @click="pinned = !pinned">{{ t[unpinnedCaption] }}</MenuItem>
					<hr />
					<MenuItem icon="flag">{{ t.report }}</MenuItem>
				</Menu>
			</template>
		</UserContent>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		position: relative;
		padding: 16px 0;

		// &:not(:last-child) {
		// 	border-bottom: 1px solid c(divider, 10%);
		// }

		.content {
			width: 100%;

			> :not(:last-child) {
				margin-bottom: 8px;
			}
		}
	}

	.user-content {
		width: 100%;
	}

	.comments {
		text-align: justify;

		&,
		:deep(*) {
			user-select: text;
		}
	}

	.footer {
		> * {
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 20px;
		}

		.right {
			margin-left: auto;
		}

		.votes {
			display: flex;
			gap: 4px;
			align-items: center;
			margin-left: -8px;
		}
	}
</style>
