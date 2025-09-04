<script setup lang="ts">
	const videos = ref<ThumbVideoResponseDto>();
	const route = useRoute();
	const { query } = route;
	const transitionName = ref("page-jump-in");

	const data = reactive({
		selectedTab: "Home",
		search: query.search ?? "none",
		sortCategory: query.sortCategory!,
		sortDirection: query.sortDirection!,
		page: +(query.page ?? 1),
	});

	/**
	 * ホームページの動画データをリクエストします。
	 */
	async function fetchHomePageVideoData() {
		try {
			const headerCookie = useRequestHeaders(["cookie"]);
			videos.value = await api.video.getHomePageThumbVideo(headerCookie);
		} catch (error) {
			// TODO: anyting can do if data fetch field in the home page? -add a 'refresh' button?
			console.error("ERROR", "Unable to fetch home page video data", error);
			useToast("動画データの取得に失敗しました。ページを再読み込みしてください。", "error", 5000);
		}
	}

	/**
	 * ホームページ動画の監視プロセス。
	 * ホームページの動画データがない場合、3秒待機後、5秒ごとに動画データを再リクエストし、3回試行します。
	 */
	function homePageDaemon() {
		observeEmptyVarbAndRequestData(
			videos, // 監視対象のリアクティブ変数
			(value: typeof videos) => value.value?.videos.length === 0, // 検出メソッド
			fetchHomePageVideoData, // 失敗した場合に実行する操作
			{ delay: 3000, intervalTime: 3000, attempts: 3 }, // 設定
		);
	}

	await fetchHomePageVideoData(); // SSR
	onMounted(homePageDaemon); // Client Mounted

	const categoryItemCount = ref(0);
	const pageCount = ref(1);
	const categoryList = ["Anime", "Music", "Otomad", "Tech", "Design", "Game", "Misc"];
	const categories = ref<Map<string | undefined, number | undefined>>();
	const resultTimestamp = ref(0);

	// ユーザーログインイベント発生時にホームページの動画データを再取得
	useListen("user:login", async loginStatus => {
		if (loginStatus)
			await fetchHomePageVideoData();
	});
</script>

<template>
	<div class="container">
		<TabBar v-model="data.selectedTab" @movingForTransition="name => transitionName = name">
			<TabItem
				id="Home"
			>{{ t.home }}</TabItem>
			<TabItem
				v-for="cat in categoryList"
				:id="cat"
				:key="cat"
				:badge="categories?.get(cat.toLowerCase())"
			>
				{{ t.category[cat.toLowerCase()] }}
			</TabItem>
		</TabBar>
		<InfoBar :title="t.announcement" lite>
			<TransInterpolation keypath="announcement.homepage">
				<template #discord-server>
					<a href="https://discord.gg/uVd9ZJzEy7" target="_blank">{{ t.platform.discord.server }}</a>
				</template>
			</TransInterpolation>
		</InfoBar>
		<Subheader icon="upload" :badge="categoryItemCount">{{ t.latest }}</Subheader>
		<Transition :name="transitionName" mode="out-in">
			<ThumbGrid :key="resultTimestamp">
				<ThumbVideo
					v-for="video in videos?.videos"
					:key="video.videoId"
					:videoId="video.videoId"
					:uploader="video.uploaderNickname ?? video.uploader ?? 'Unknown uploader'"
					:uploaderId="video.uploaderId"
					:image="video.image"
					:date="new Date(video.uploadDate || 0)"
					:watchedCount="video.watchedCount"
					:duration="new Duration(0, video.duration ?? 0)"
				>{{ video.title }}</ThumbVideo>
			</ThumbGrid>
		</Transition>
		<!-- <Pagination v-model="data.page" :pages="Math.max(1, pageCount)" :displayPageCount="12" enableArrowKeyMove /> -->
	</div>
</template>

<style scoped lang="scss">
	.container {
		display: flex;
		flex-direction: column;
		gap: 16px;

		@include not-mobile {
			padding-top: 0 !important;
		}
	}

	.tab-bar {
		--loose: true;
		margin: 0 (-$page-padding-x);

		&:deep(.items) {
			padding: 0 $page-padding-x;
		}

		@include mobile {
			display: none;
		}
	}
</style>
