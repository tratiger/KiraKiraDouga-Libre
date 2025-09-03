<docs>
	### 動画コメント
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** 動画ID。 */
		videoId: number;
		/** 編集可能かどうか（ユーザーがブロックされている場合などは編集できません） */
		editable?: boolean;
	}>(), {
		editable: true,
	});

	const pageSize = 20; // 1ページあたりのコメント数
	const comments = ref<GetVideoCommentByKvidResponseDto["videoCommentList"]>([]); // コメントデータ
	const commentsCount = ref(0); // コメント数。
	const currentPage = ref(1); // 現在のページ番号
	const loading = ref(false); // コメントを読み込み中ですか？
	const error = ref(false); // 読み込みに失敗しましたか？
	const pinned = ref(false);
	const search = ref("");
	const pageCount = computed(() => Math.max(1, Math.ceil(commentsCount.value / pageSize)));
	const selfUserInfoStore = useSelfUserInfoStore();
	const sort = ref<SortModel>(["rating", "descending"]); // 並べ替え方法

	/**
	 * コメントを送信し、送信されたコメントをコメントリストに追加します
	 */
	useListen("videoComment:emitVideoComment", videoComment => {
		comments.value.push(videoComment);
	});

	/**
	 * コメントを削除し、削除されたコメントのルートに基づいてコメントリストをフィルタリングします
	 * // TODO: パフォーマンスの改善
	 */
	useListen("videoComment:deleteVideoComment", commentRoute => {
		comments.value = comments.value.filter(comment => comment.commentRoute !== commentRoute);
	});

	/**
	 * 動画のコメントデータを取得します
	 */
	async function fetchVideoCommentData() {
		const getVideoCommentByKvidRequest: GetVideoCommentByKvidRequestDto = {
			videoId: props.videoId,
			pagination: {
				page: currentPage.value,
				pageSize,
			},
		};
		loading.value = true;
		error.value = false;
		const videoCommentsResponse = await api.videoComment.getVideoCommentByKvid(getVideoCommentByKvidRequest);
		loading.value = false;
		if (videoCommentsResponse.success) {
			comments.value = videoCommentsResponse.videoCommentList ?? [];
			commentsCount.value = videoCommentsResponse.videoCommentCount ?? 0;
		} else
			error.value = true;
	}

	if (environment.client)
		fetchVideoCommentData();

	watch(currentPage, fetchVideoCommentData);
</script>

<template>
	<Comp>
		<HeadingComments :count="commentsCount" />
		<div class="send">
			<UserAvatar :avatar="selfUserInfoStore.userAvatar" />
			<TextEditorRtf :videoId :editable />
		</div>
		<div class="toolbar">
			<div class="left">
				<Sort v-model="sort">
					<SortItem id="rating">{{ t.rating }}</SortItem>
					<SortItem id="date">{{ t.send_date }}</SortItem>
				</Sort>
			</div>
			<div class="right">
				<SoftButton icon="deletion_history" />
				<TextBox v-model="search" :placeholder="t.search" icon="search" />
				<Pagination v-model="currentPage" :pages="pageCount" :displayPageCount="7" :disabled="loading" />
			</div>
		</div>
		<div v-if="!error" class="items-container" :class="{ loading }">
			<div class="items" :inert="loading">
				<CreationCommentsItem
					v-for="comment in comments"
					:key="comment._id"
					v-model:upvote="comment.upvoteCount"
					v-model:downvote="comment.downvoteCount"
					v-model:isUpvoted="comment.isUpvote"
					v-model:isDownvoted="comment.isDownvote"
					v-model:pinned="pinned"
					:commentId="comment._id"
					:videoId
					:uid="comment.uid"
					:index="comment.commentIndex"
					:commentRoute="comment.commentRoute"
					:nickname="comment.userInfo?.userNickname"
					:username="comment.userInfo?.username"
					:avatar="comment.userInfo?.avatar"
					:date="new Date(comment.editDateTime)"
					:upvote_score="comment.upvoteCount"
				>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<!-- <div v-html="comment.text"></div> -->
					<!-- TODO: コメントはリッチテキストをサポートします。 -->
					<div>{{ comment.text }}</div>
				</CreationCommentsItem>
			</div>
			<div v-if="loading" class="loading-indicator">
				<ProgressRing />
			</div>
		</div>
		<div v-else class="error">
			<Icon name="error" />
			<p>{{ t.toast.something_went_wrong }}</p>
		</div>
		<div class="toolbar bottom">
			<Pagination v-model="currentPage" :pages="pageCount" :displayPageCount="7" :disabled="loading" />
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		header {
			margin-bottom: 16px;
		}
	}

	.heading-comments {
		@include tablet {
			display: none;
		}
	}

	.send {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;

		.user-avatar {
			--size: 40px;
		}

		&:deep(.text-editor-rtf) {
			flex-grow: 1;
		}
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		padding-block: 6px;

		&.bottom {
			justify-content: flex-end;
		}

		> * {
			display: flex;
			flex-wrap: wrap;
			gap: 16px;
			justify-content: flex-end;
			align-items: center;
		}

		.sort {
			grid-auto-flow: column;
		}

		.soft-button {
			--wrapper-size: 36px;
			--ripple-size: 48px;
		}

		.text-box {
			width: 200px;
		}
	}

	.items-container {
		position: relative;

		&.loading .items {
			opacity: 0;
		}

		.loading-indicator {
			position: absolute;
			top: 0;
			right: 0;
			left: 0;
			display: flex;
			justify-content: center;
			padding-block: 32px;

			.progress-ring {
				--size: 30px;
				--thickness: 3px;
			}
		}
	}

	.error {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
		padding-block: 32px;
		color: c(red);

		.icon {
			font-size: 48px;
		}
	}
</style>
