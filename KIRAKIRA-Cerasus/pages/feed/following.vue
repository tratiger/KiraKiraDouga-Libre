<docs>
	# フォロー中

	フォロー中のユーザーが新しい投稿をした場合や、フォロー中のコレクションが更新された場合などを表示します。
	現在、動画の表示のみをサポートしています。

	TODO: スクロールしてさらに読み込む。Twitterのように、できるだけ違和感なく（一番下に着く前に読み込みを開始する）ようにしたいです。
</docs>

<script setup lang="ts">
	const loadingMore = ref(false);
	const reachedEnd = ref(true);
	const refreshing = ref(false);
</script>

<template>
	<div class="container">
		<PullToRefresh v-model:refreshing="refreshing" />
		<!-- TODO: ビューを切り替える -->
		<div class="feed">
			<UserContent
				v-for="i in 10"
				:key="i"
				:uid="1"
				nickname="プレースホルダー"
				username="プレースホルダー"
				avatarInside
			>
				<template #description>
					<DateTime :dateTime="new Date()" showTime />
				</template>
				<ThumbGrid view="list">
					<ThumbVideo
						:videoId="1"
					>
						プレースホルダー
					</ThumbVideo>
				</ThumbGrid>
			</UserContent>
			<div v-if="loadingMore || reachedEnd" class="bottom">
				<ProgressRing v-if="loadingMore" />
				<p v-if="reachedEnd">¯\_(ツ)_/¯</p>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.conatiner {
		position: relative;
	}

	.feed {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.user-content {
		@include card-shadow;
		@include round-large;
		padding: 16px;
	}

	.thumb-grid {
		margin-bottom: -8px;
	}

	.bottom {
		@include flex-center;
		width: 100%;
		padding: 8px 0;
		color: c(icon-color, 50%);

		.progress-ring {
			--size: 30px;
			--thickness: 3px;
		}
	}
</style>
