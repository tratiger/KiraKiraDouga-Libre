<script setup lang="ts">
	useHead({ title: t.search });
	const router = useRouter(), route = useRoute();
	const querySearch = computed(() => route.query.query ?? "");
	const tagSearch = computed(() => {
		const tagIds = route.query.tagId;
		if (Array.isArray(tagIds))
			return tagIds.map(tagId => parseInt(tagId!, 10));
		else if (typeof tagIds === "string")
			return [parseInt(tagIds, 10)];
		else
			return [];
	});

	const view = ref<ViewType>("grid");
	const displayPageCount = ref(6);
	const videos = ref<SearchVideoByKeywordResponseDto | ThumbVideoResponseDto>();
	const searchModes = ["keyword", "tag", "user", "advanced_search"] as const;
	const querySearchMode = route.query.mode as typeof searchModes[number] ?? "tag";
	const searchMode = ref<typeof searchModes[number]>(querySearchMode);
	const searchModesSorted = computed(() => searchModes.toSorted((a, b) =>
		a === searchMode.value ? -1 : b === searchMode.value ? 1 : 0));
	// 注意：この関数をサポートするには、Node.jsのバージョンを20以上に更新してください。そうしないとエラーが発生します。 // 02: 本当に！
	const currentLanguage = computed(getCurrentLocale); // 現在のユーザーの言語
	const flyoutTag = ref<FlyoutModel>(); // FlyoutTagにバインドされたパラメータ。targetが空でない場合にFlyoutを表示します
	const tags = reactive<Map<VideoTag["tagId"], VideoTag>>(new Map()); // 動画タグ
	const displayTags = computed<DisplayVideoTag[]>(() => [...tags.values()].map(tagName => getDisplayVideoTagWithCurrentLanguage(currentLanguage.value, tagName))); // 表示用のTAG。上記のtagsよりもシンプルなデータ構造です。
	const contextualToolbar = ref<FlyoutModel>(); // TAGのツールツールチップ
	const hoveredTagContent = ref<[number, string]>(); // マウスがホバーしているTAG
	const hideExceptMe = ref(false);
	const hideTimeoutId = ref<Timeout>();

	const data = reactive({
		selectedTab: "Home",
		search: querySearch.value,
		sort: ref<SortModel>(["upload_date", "descending"]),
		page: 1,
		pages: 99,
	});

	/**
	 * キーワードで動画を検索し、videoに割り当てます
	 * @param keyword 关键字
	 */
	async function searchVideoByKeyword(keyword: string) {
		const searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto = { keyword };
		const videoResult = await api.video.searchVideoByKeyword(searchVideoByKeywordRequest);
		if (videoResult && videoResult.success) {
			videos.value = videoResult;
			data.pages = Math.max(1, Math.ceil(videoResult.videosCount / 50));
		}
	}

	/**
	 * タグIDで動画を検索し、videoに割り当てます
	 * @param tagIds 关键字
	 */
	async function searchVideoByTagIds(tagIds: number[]) {
		const searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto = { tagId: tagIds };
		const videoResult = await api.video.searchVideoByTagIds(searchVideoByVideoTagIdRequest);
		if (videoResult && videoResult.success) {
			videos.value = videoResult;
			data.pages = Math.max(1, Math.ceil(videoResult.videosCount / 50));
		}
	}

	/**
	 * ホームページのように動画を取得し、videoに割り当てます
	 */
	async function getHomeVideo() {
		const videoResult = await api.video.getHomePageThumbVideo();
		if (videoResult && videoResult.success) {
			videos.value = videoResult;
			data.pages = Math.max(1, Math.ceil(videoResult.videosCount / 50));
		}
	}

	/**
	 * 領域にマウスカーソルが入ったら、自動非表示をキャンセルします。
	 */
	function reshowContextualToolbar() {
		clearTimeout(hideTimeoutId.value);
	}

	/**
	 * 動画TAGリストからTAGを削除します（注意：この時点ではTAGリストはバックエンドのデータベースに保存されていません）
	 * @param tagId TAG 编号
	 */
	function removeTag(tagId: number) {
		if (tagId !== undefined || tagId !== null) tags.delete(tagId);
		hideContextualToolbar();
	}

	/**
	 * タグのコンテキストツールバーを表示します。
	 * @param key - 标签键名。
	 * @param tag - 标签内容。
	 * @param e - 鼠标事件。
	 */
	function showContextualToolbar(key: number, tag: string, e: MouseEvent) {
		if (!tag) return;
		if ((e.currentTarget as HTMLSpanElement).querySelector(".text-box:focus")) return;
		reshowContextualToolbar();
		if (hoveredTagContent.value?.[0] === key && hoveredTagContent.value?.[1] === tag) return;
		hoveredTagContent.value = [key, tag];
		hideExceptMe.value = true;
		useEvent("component:hideAllContextualToolbar");
		hideExceptMe.value = false;
		contextualToolbar.value = [e, "top", 0];
	}

	/**
	 * タグのコンテキストツールバーを非表示にします。
	 */
	function hideContextualToolbar() {
		hideTimeoutId.value = setTimeout(() => {
			contextualToolbar.value = undefined;
			hoveredTagContent.value = undefined;
		}, 100);
	}

	/**
	 * 動画データを検索
	 */
	async function searchVideo() {
		const query = querySearch.value; // キーワード
		const tag = tagSearch.value; // 動画タグ
		switch (searchMode.value) {
			case "keyword": {
				if (query)
					await searchVideoByKeyword(query as string);
				else
					await getHomeVideo();
				break;
			}

			case "tag": {
				if (tag && tag.length > 0)
					await searchVideoByTagIds(tag);
				else
					await getHomeVideo();
				break;
			}

			case "user": {
				useToast(t.under_construction.search_mode, "error", 10000);
				console.warn("no support search mode: user");
				await getHomeVideo();
				break;
			}

			case "advanced_search": {
				useToast(t.under_construction.search_mode, "error", 10000);
				console.warn("no support search mode: advanced_search");
				await getHomeVideo();
				break;
			}

			default:
				console.log("do nothing");
				await getHomeVideo();
				break;
		}
	}

	/** 動画検索のデバウンスを作成 */
	const debounceVideoSearcher = useDebounce(searchVideo, 500);

	/** ルート内のキーワードを監視し、変更があった場合はデバウンスして動画を検索します */
	watch(querySearch, debounceVideoSearcher);

	/** ルート内のTAG IDを監視し、変更があった場合はデバウンスして動画を検索します */
	watch(tagSearch, debounceVideoSearcher);

	// 現在がキーワード検索モードで、検索キーワードが変更された場合、URL内の検索キーワードを更新します
	watch(() => data.search, search => {
		if (searchMode.value === "keyword")
			router.push({ path: route.path, query: { ...route.query, query: search || undefined } });
	});

	// 現在がTAG検索モードで、TAGが変更された場合、URL内のtagIdを更新します
	watch(() => displayTags.value, tags => {
		if (searchMode.value === "tag") {
			const tagIds = tags.map(tag => tag.tagId);
			router.push({ path: route.path, query: { ...route.query, tagId: tagIds } });
		}
	});

	// ルートに現在の検索モードを更新し、即時実行します
	watch(() => searchMode.value, searchMode => {
		router.push({ path: route.path, query: { ...route.query, mode: searchMode } });
	});

	// ページ初期化後、URLクエリに検索モードを含めるように設定します
	onMounted(() => {
		router.push({ path: route.path, query: { ...route.query, mode: searchMode.value } });
	});

	/**
	 * 検索ページの初期化時に実行する一連の操作
	 */
	async function searchPageInit() {
		// SSR時に動画を検索
		await searchVideo();

		if (tagSearch.value.length > 0) {
			const getVideoTagByTagIdRequest: GetVideoTagByTagIdRequestDto = { tagId: tagSearch.value };
			const tagsResult = await api.videoTag.getTagsByTagIds(getVideoTagByTagIdRequest);
			if (tagsResult.success && tagsResult.result)
				tagsResult.result.map(tag => tags.set(tag.tagId, tag));
		}
	}
	await searchPageInit();
</script>

<template>
	<div class="container">
		<div class="card-container">
			<div class="center">
				<ThumbGrid :view>
					<ThumbVideo
						v-for="video in videos?.videos"
						:key="video.videoId"
						:videoId="video.videoId"
						:uploader="video.uploader ?? ''"
						:uploaderId="video.uploaderId"
						:image="video.image"
						:date="new Date(video.uploadDate || 0)"
						:watchedCount="video.watchedCount"
						:duration="new Duration(0, video.duration ?? 0)"
					>{{ video.title }}</ThumbVideo>
				</ThumbGrid>
			</div>

			<div class="right">
				<div class="toolbox-card search">
					<TextBox v-if="searchMode !== 'tag'" v-model="data.search" :placeholder="t.search" icon="search" />
					<div v-else class="search-item-tags">
						<Tag
							v-for="tag in displayTags"
							:key="tag.tagId"
							:query="{ q: tag.tagId }"
							@mouseenter="e => showContextualToolbar(tag.tagId, tag.mainTagName, e)"
							@mouseleave="hideContextualToolbar"
						>
							<div v-if="tag.tagId >= 0" class="display-tag">
								<div v-if="tag.mainTagName">{{ tag.mainTagName }}</div>
								<div v-if="tag.originTagName" class="original-tag-name">{{ tag.originTagName }}</div>
							</div>
						</Tag>
						<Tag key="add-tag-button" class="add-tag" :checkable="false" @click="e => flyoutTag = [e, 'y']">
							<Icon name="add" />
						</Tag>
					</div>
					<FlyoutTag v-model="flyoutTag" v-model:tags="tags" />

					<Flyout
						v-model="contextualToolbar"
						noPadding
						class="contextual-toolbar"
						@mouseenter="reshowContextualToolbar"
						@mouseleave="hideContextualToolbar"
					>
						<Button icon="close" @click="removeTag(hoveredTagContent![0])">{{ t.delete }}</Button>
					</Flyout>

					<div class="tags">
						<TransitionGroup>
							<Tag
								v-for="mode in searchModesSorted"
								:key="mode"
								:checked="searchMode === mode"
								@click="searchMode = mode"
							>{{ t[mode] }}</Tag>
						</TransitionGroup>
					</div>
				</div>

				<div class="toolbox-card">
					<section>
						<ToolboxView v-model="view" />
					</section>

					<section>
						<Subheader icon="sort">{{ t.sort.by }}</Subheader>
						<Sort v-model="data.sort">
							<SortItem id="upload_date" preferOrder="descending">{{ t.upload_date }}</SortItem>
							<SortItem id="view" preferOrder="descending">{{ t.sort.view }}</SortItem>
							<SortItem id="danmaku" preferOrder="descending">{{ t.sort.danmaku }}</SortItem>
							<SortItem id="comment" preferOrder="descending">{{ t.sort.comment }}</SortItem>
							<SortItem id="save" preferOrder="descending">{{ t.sort.save }}</SortItem>
							<SortItem id="duration" preferOrder="descending">{{ t.duration }}</SortItem>
							<SortItem id="rating">{{ t.rating }}</SortItem>
						</Sort>
					</section>
					<Pagination v-model="data.page" :pages="data.pages" :displayPageCount enableArrowKeyMove />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.card-container {
		display: flex;
		gap: 16px;

		@include tablet {
			flex-direction: column-reverse;
		}

		.right {
			display: flex;
			flex-direction: column;
			gap: 1rem;

			@include computer {
				$margin-top: 1rem;
				position: sticky;
				top: $margin-top;
				height: fit-content;
				max-height: calc(100dvh - 2 * $margin-top);
			}
		}
	}

	.center {
		width: 100%;
	}

	.sort {
		grid-template-columns: repeat(2, 1fr);
	}

	.toolbox-view {
		width: 100%;
	}

	.tags {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.search-item-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;

		.add-tag {
			aspect-ratio: 1 / 1;
			padding: 6px;
			color: c(icon-color);
			font-size: 18px;
		}
	}

	.display-tag {
		display: flex;
		flex-flow: row wrap;
		gap: 0.5em;

		.original-tag-name {
			color: c(text-color, 50%);
		}
	}

	.toolbox-card.search {
		gap: 16px;
	}

	.contextual-toolbar {
		button {
			--appearance: tertiary;
		}
	}
</style>
