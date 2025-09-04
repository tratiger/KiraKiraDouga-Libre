<script setup lang="ts">
	const flyout = defineModel<FlyoutModel>();
	const tags = defineModel<Map<VideoTag["tagId"], VideoTag>>("tags"); // TAGデータ
	const emit = defineEmits<{
		(e: "add-new-tag", tag: VideoTag): void;
	}>();

	const original = ref<[number, string] | undefined>();
	const search = ref("");
	const isSearched = computed(() => !!search.value.trim());
	const matchedTags = ref<VideoTag[]>([]);
	const showCreateNew = ref(false); // 「TAGを作成」ボタンを表示するかどうか
	const showTagEditor = ref(false); // TAG（作成）エディタを表示するかどうか
	const isCreatingTag = ref(false); // TAGを作成中かどうか
	const languages = [
		{ langId: "zhs", langName: getLocaleName("zh-Hans") },
		{ langId: "en", langName: getLocaleName("en") },
		{ langId: "ja", langName: getLocaleName("ja") },
		{ langId: "zht", langName: getLocaleName("zh-Hant") },
		{ langId: "ko", langName: getLocaleName("ko") },
		{ langId: "vi", langName: getLocaleName("vi") },
		{ langId: "id", langName: getLocaleName("id") },
		{ langId: "ar", langName: getLocaleName("ar") },
		{ langId: "other", langName: t.other },
	] as const; // 選択可能な言語リスト
	type LanguageList = typeof languages[number];
	type EditorType = { language: LanguageList | { langId: ""; langName: "" }; values: string[]; default: [number, string] | null; original: [number, string] | null }[];
	const editor = reactive<EditorType>([]); // TAGエディタインスタンス
	const availableLanguages = ref<LanguageList[][]>([]); // ユーザーがすでに選択した言語以外の言語
	const currentLanguage = computed(getCurrentLocale); // 現在のユーザーの言語

	/**
	 * 動画TAGを検索
	 */
	async function searchVideoTag() {
		showCreateNew.value = true;
		const text = halfwidth(search.value.trim().replaceAll(/\s+/g, " ").toLowerCase());
		if (text)
			try {
				const result = await api.videoTag.searchVideoTag({ tagNameSearchKey: text });
				if (result?.success && result.result && result.result.length > 0) {
					matchedTags.value = result.result;
					const hasSameWithInput = checkTagUnique(text, result.result);
					if (hasSameWithInput) showCreateNew.value = false;
					else showCreateNew.value = true;
				} else showCreateNew.value = true;
			} catch (error) {
				console.error("ERROR", "Failed to search tag:", error);
				useToast(t.toast.something_went_wrong, "error");
			}
	}
	const debounceVideoTagSearcher = useDebounce(searchVideoTag, 500);

	/**
	 * ユーザーが検索ボックスにテキストを入力したときのイベント。
	 */
	async function onInput() {
		await debounceVideoTagSearcher();
	}

	/**
	 * TAGエディタで生成されたデータをバックエンドストレージに適した形式に変換します
	 * @param editor TAGエディタデータ
	 * @returns 保存に適したTAGデータ
	 *
	 * @example
	 * 次のようなデータがあるとします。
	 * const foo = [
	 *		{
	 *			default: "StarCitizen",
	 *			language: {
	 *				langId: "en",
	 *				langName: "",
	 *			},
	 *			value: ["StarCitizen", "SC"],
	 *		}, {
	 *			default: null,
	 *			language: {
	 *				langId: "zhs",
	 *				langName: "",
	 *			},
	 *			value: ["星际公民"],
	 *		},
	 *	]
	 *
	 * editorData2Dto(foo)を実行すると、結果は次のようになります。
	 *	{
	 *		tagNameList: [
	 *			{
	 *				lang: "en",
	 *				tagName: [
	 *					{
	 *						name: "StarCitizen",
	 *						isDefault: true,
	 *						isOriginalTagName: true,
	 *					}, {
	 *						name: "SC",
	 *						isDefault: false,
	 *						isOriginalTagName: false,
	 *					},
	 *				],
	 *			}, {
	 *				lang: "zhs",
	 *				tagName: [
	 *					{
	 *						name: "星际公民",
	 *						isDefault: false,
	 *						isOriginalTagName: false,
	 *					},
	 *				],
	 *			},
	 *		],
	 *	}
	 */
	function editorData2TagDto(editor: EditorType): CreateVideoTagRequestDto {
		const tagNameList = editor.filter(tag => !!tag.language.langId || !!tag.values?.[0]).map(filteredTag => {
			return {
				lang: filteredTag.language.langId,
				tagName: filteredTag.values.map(tagName => {
					return {
						name: tagName,
						isDefault: tagName === filteredTag.default?.[1], // TODO: デフォルトのTAGが指定されていない場合はどうなりますか？
						isOriginalTagName: tagName === filteredTag.default?.[1] && tagName === filteredTag.original?.[1],
					};
				}),
			};
		});
		return { tagNameList };
	}

	/**
	 * TAGデータが有効かどうかを確認します
	 * @param createVideoTagRequest TAGデータ
	 * @returns boolean 有効な場合はtrue、無効な場合はfalseを返します
	 */
	function checkTagData(createVideoTagRequest: CreateVideoTagRequestDto): boolean {
		const isAllTagItemNotNull = createVideoTagRequest?.tagNameList?.every(tag => tag && tag.lang && tag.tagName?.length > 0 && tag.tagName.every(tagName => !!tagName.name));

		return (
			createVideoTagRequest && createVideoTagRequest?.tagNameList?.length > 0
			&& isAllTagItemNotNull
		);
	}

	/**
	 * タグエディタを切り替えます。
	 * @param shown - 表示しますか？
	 */
	async function switchTagEditor(shown: true | "ok" | "cancel") {
		if (shown === "ok") {
			const tagData = editorData2TagDto(editor);
			if (checkTagData(tagData)) {
				isCreatingTag.value = true;
				const result = await api.videoTag.createVideoTag(tagData);
				if (result.result?.tagId !== null && result.result?.tagId !== undefined) {
					tags.value?.set(result.result.tagId, result.result);
					emit("add-new-tag", result.result);
				}
				isCreatingTag.value = false;
				onFlyoutHide();
			} else
				// useToast(t.toast.no_language_selected, "warning");
				useToast(t.toast.required_not_filled, "warning");
		} else if (shown === "cancel") showTagEditor.value = false;
		else {
			const text = search.value.trim().replaceAll(/\s+/g, " ");
			arrayClearAll(editor);
			editor.push({ language: { langId: "", langName: "" }, values: [text], default: null, original: null });
			showTagEditor.value = true;
		}
	}

	/**
	 * ユーザーが検索したTAGをクリックして、動画のTAGリストに追加します。
	 * @param tag ユーザーがクリックしたTAGデータ。
	 */
	function addTag(tag: VideoTag) {
		if (tag.tagId !== undefined && tag.tagId !== null && tag.tagId >= 0) {
			tags.value?.set(tag.tagId, tag);
			emit("add-new-tag", tag);
		}
	}

	watch(editor, editor => {
		if (editor.at(-1)?.language.langId !== "")
			editor.push({ language: { langId: "", langName: "" }, values: [], default: null, original: null });
		availableLanguages.value = [];
		const allComboBoxLanguages = editor.map(item => item.language.langId);
		editor.forEach(({ language, default: def }, index) => {
			if (!language && def) {
				editor[index].default = null;
				useToast(t.toast.no_language_selected, "warning");
			}
			availableLanguages.value[index] = languages.filter(lang => {
				if (lang.langId === language.langId) return true;
				else if (allComboBoxLanguages.includes(lang.langId)) return false;
				else return true;
			});
		});
	}, { deep: true });

	/**
	 * フローティングウィンドウを閉じた後のイベント。
	 */
	function onFlyoutHide() {
		showTagEditor.value = false;
		search.value = "";
	}
</script>

<template>
	<Flyout v-model="flyout" noPadding :ignoreOutsideElementClasses="['contextual-toolbar']">
		<Comp>
			<Transition :name="showTagEditor ? 'page-forward' : 'page-backward'" mode="out-in">
				<div v-if="!showTagEditor" class="page-search">
					<div class="list-wrapper">
						<Transition>
							<div v-if="!isSearched" class="empty">
								<Icon name="tag" />
								<p>{{ t.unselected.tag }}</p>
							</div>
							<div v-else class="list">
								<TransitionGroup>
									<div v-for="tag in matchedTags" :key="tag.tagId" v-ripple class="list-item">
										<div class="content" @click="addTag(tag)">
											<div class="tag-name">
												<div v-if="getSearchHit(search, currentLanguage, tag)" class="hit-tag">{{ getSearchHit(search, currentLanguage, tag) }}</div>
												<div>{{ getDisplayVideoTagWithCurrentLanguage(currentLanguage, tag).mainTagName }}</div>
												<div
													v-if="getSearchHit(search, currentLanguage, tag) !== getDisplayVideoTagWithCurrentLanguage(currentLanguage, tag).originTagName && getDisplayVideoTagWithCurrentLanguage(currentLanguage, tag).mainTagName !== getDisplayVideoTagWithCurrentLanguage(currentLanguage, tag).originTagName"
													class="original-tag"
												>
													{{ getDisplayVideoTagWithCurrentLanguage(currentLanguage, tag).originTagName }}
												</div>
											</div>
											<p class="count">{{ t(100).video_count(100) }}</p>
										</div>
										<div class="trailing-icons">
											<SoftButton icon="edit" @click.stop />
										</div>
									</div>
									<div v-if="showCreateNew" key="add-tag-button" v-ripple class="list-item create-new" @click="switchTagEditor(true)">
										<div class="leading-icons">
											<Icon name="add" />
										</div>
										<div class="content">
											<p class="title">{{ t.tag.new }}</p>
										</div>
									</div>
								</TransitionGroup>
							</div>
						</Transition>
					</div>
					<TextBox v-model="search" icon="search" :placeholder="t.tag.search" @input="onInput" />
				</div>
				<div v-else class="page-editor">
					<div class="list-wrapper">
						<div class="list">
							<template v-for="(item, index) in editor" :key="index">
								<ComboBox v-model="item.language.langId" :placeholder="t.unselected.language">
									<ComboBoxItem v-for="lang in availableLanguages[index]" :id="lang.langId" :key="lang.langId">{{ lang.langName }}</ComboBoxItem>
								</ComboBox>
								<TagsEditor v-model="item.values" v-model:default="item.default" v-model:editorOriginal="item.original" v-model:original="original" />
							</template>
						</div>
					</div>
					<div class="submit">
						<Button class="secondary" :disabled="isCreatingTag" @click="switchTagEditor('cancel')">{{ t.step.cancel }}</Button>
						<Button :disabled="isCreatingTag" :loading="isCreatingTag" @click="switchTagEditor('ok')">{{ t.step.ok }}</Button>
					</div>
				</div>
			</Transition>
		</Comp>
	</Flyout>
</template>

<style scoped lang="scss">
	$width: 500px;
	$height: 360px;
	$translate: 30px;

	:comp {
		position: relative;
		width: $width;
		height: $height;
	}

	.page-search {
		display: flex;
		flex-direction: column;
		height: 100%;

		.text-box {
			--square: true;
		}

		.empty {
			@include flex-center;
			flex-direction: column;
			gap: 8px;
			height: 100%;
			color: c(icon-color);
			font-size: 16px;

			.icon {
				font-size: 42px;
			}

			&.v-enter-from,
			&.v-leave-to {
				translate: 0 (-$translate);
				opacity: 0;
			}
		}

		.list-wrapper {
			position: relative;
			height: 100%;
			overflow: auto;

			.list {
				&.v-enter-from,
				&.v-leave-to {
					translate: 0 $translate;
					opacity: 0;
				}
			}
		}

		.empty,
		.list {
			position: absolute;
			width: 100%;
		}

		.list-item {
			display: flex;
			gap: 4px;
			align-items: center;
			width: 100%;
			padding: 8px 16px;
			cursor: pointer;

			&:first-child {
				padding-top: 16px;
			}

			&.create-new {
				color: c(icon-color);
			}

			.leading-icons {
				display: flex;

				.icon {
					font-size: 24px;
				}
			}

			&:has(.leading-icons .icon) {
				padding: 8px 12px;

				&:only-child {
					padding: 16px 12px;
				}
			}

			.content {
				flex-grow: 1;
			}

			.tag-name {
				display: flex;
				flex-direction: row;
			}

			.hit-tag {
				padding-right: 0.5em;
				font-weight: bold;
			}

			.original-tag {
				padding-left: 0.5em;
			}

			.count {
				font-size: 10px;
			}

			&:any-hover {
				background-color: c(hover-overlay);
			}

			.soft-button {
				--ripple-size: 80px;
			}

			&.v-enter-from,
			&.v-leave-to {
				translate: 0 $translate;
				opacity: 0;
			}

			&.v-leave-active {
				position: absolute;
			}
		}
	}

	.page-editor {
		display: flex;
		flex-direction: column;
		height: 100%;

		.list-wrapper {
			position: relative;
			height: 100%;
			overflow: hidden auto; // FIXME: ページのスクロールを有効にすると、ドロップダウンメニューを開いたときに要素がはみ出してしまいます。
		}

		.list {
			position: absolute;
			display: grid;
			grid-template-columns: 110px auto;
			gap: 16px 8px;
			width: 100%;
			margin: 16px;

			&::after {
				content: "";
			}
		}

		.submit {
			position: relative;
			bottom: 0;
			display: flex;
			gap: 5px;
			margin: 16px;
			margin-top: 0;

			> :first-child {
				margin-left: auto;
			}
		}
	}

	.flyout,
	.flyout .page-editor .list-wrapper {
		&:has(.combo-box .show) {
			overflow: visible;
		}
	}
</style>
