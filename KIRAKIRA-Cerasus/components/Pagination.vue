<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/**
		 * 総ページ数。
		 *
		 * このパラメータが文字列の配列である場合、配列モードが有効になり、文字列配列の内容が表示されます。
		 */
		pages: number | string[];
		/** 現在のページ番号（一方向バインディング用）。 */
		current?: number;
		/** コンポーネントに表示される最大ページ数。 */
		displayPageCount?: number;
		/** ユーザーがキーボードの左右矢印キーでページをめくることを許可します。 */
		enableArrowKeyMove?: boolean;
		/** 無効にしますか？ */
		disabled?: boolean;
	}>(), {
		current: 1,
		displayPageCount: 7,
		disabled: false,
	});

	const model = defineModel<number>();
	const currentPage = withOneWayProp(model, () => props.current);
	const array = computed(() => props.pages instanceof Array ? props.pages : null);
	const pages = computed(() => !(props.pages instanceof Array) ? props.pages : props.pages.length);

	if (pages.value < 1)
		throw new RangeError(`Paginationのpagesパラメータが不正です。ページ番号は1未満にできません。現在の値は ${pages.value}。`);
	if (currentPage.value < 1 || currentPage.value > pages.value)
		throw new RangeError(`Paginationのcurrentがページ範囲外です。現在のページ番号の範囲は1～${pages.value}です。現在の設定値は ${currentPage.value}。`);
	if (props.displayPageCount < 3)
		throw new RangeError(`PaginationのdisplayPageCountパラメータが不正です。表示される最大ページ数は3未満にできません。現在の設定値は ${props.displayPageCount}。`);

	/** ページアイテムの座標とページ番号のキーと値のペア。 */
	type PositionPageItemPair = Record<number, number>;

	const showLast = computed(() => props.displayPageCount >= 5);
	const showFirst = computed(() => props.displayPageCount >= 4);
	const actualPages = computed(() => Math.min(pages.value, props.displayPageCount));
	const scrolledItemCount = computed(() => actualPages.value - (+showFirst.value + +showLast.value));
	const scrolledPages = ref<PositionPageItemPair>(getScrolledItems(currentPage.value));
	const scrollArea = ref<HTMLDivElement>();
	const pageEdit = ref<HTMLDivElement>();
	const thumbPosition = computed(() => {
		return (
			currentPage.value < actualPages.value / 2 ? currentPage.value :
			pages.value - currentPage.value < actualPages.value / 2 ? actualPages.value - (pages.value - currentPage.value) :
			props.displayPageCount === 4 && currentPage.value !== 2 ? 3 :
			Math.floor((actualPages.value + 1) / 2)
		) - 1;
	});
	const _currentEdited = ref(String(currentPage.value)); // 型はstringである必要があることに注意してください。
	const currentEdited = computed({
		get: () => _currentEdited.value,
		set: async value_str => {
			const caret = Caret.get();
			_currentEdited.value = value_str; // 強制的にリフレッシュするには2回設定する必要があります。
			await nextTick();
			value_str = value_str.replaceAll(/[^\d]/g, "");
			if (value_str !== "") {
				let value = parseInt(value_str.replaceAll(/[^\d]/g, ""), 10);
				if (value < 1) value = 1;
				else if (value > pages.value) value = pages.value;
				value_str = String(value);
			}
			const requireResetCaret = _currentEdited.value !== value_str;
			_currentEdited.value = value_str;
			await nextTick();
			if (requireResetCaret && caret !== null && pageEdit.value) Caret.set(pageEdit.value, caret);
		},
	});
	const isScrolling = ref(false);
	const isForceSmallRipple = ref(false);
	const newPageNumber = ref<HTMLDivElement>();
	const [DefineUnselectedItem, UnselectedItem] = createReusableTemplate<{
		page: number;
		position?: number;
	}>();

	watch(() => currentPage.value, (page, prevPage) => {
		// #region ガイドレールアニメーション
		const prevItems = getScrolledItems(prevPage);
		const nextItems = getScrolledItems(page);
		const merged = mergePosition(prevItems, nextItems);
		const animationOptions = (hasExistAnimations: boolean) => ({
			duration: isPrefersReducedMotion() ? 0 : 500,
			easing: hasExistAnimations ? eases.easeOutMax : eases.easeInOutSmooth, // 連続して高速スクロールする場合は、イーズアウト補間に切り替えます。
		});
		// `Uncaught (in promise) DOMException: The user aborted a request.` は無視！
		const IGNORE = useNoop;
		if (merged) {
			scrolledPages.value = merged.items;
			if (scrollArea.value)
				for (const _child of scrollArea.value.children) {
					const child = _child.children[0];
					if (!child) continue;
					const hasExistAnimations = removeExistAnimations(child);
					isScrolling.value = true;
					child.animate({
						right: ["0", `${merged.finallyPosition * 36}px`],
					}, animationOptions(hasExistAnimations)).finished.then(() => {
						scrolledPages.value = nextItems;
						isScrolling.value = false;
					}).catch(IGNORE);
				}
		}
		// #endregion
		// #region スライダーアニメーション
		const pageLeft = page < prevPage;
		const setCurrentPage = () => currentEdited.value = String(page);
		if (pageEdit.value && newPageNumber.value) {
			const thumb = pageEdit.value.parentElement!.parentElement!;
			const hasExistAnimations = removeExistAnimations(pageEdit.value, newPageNumber.value);
			const isUserInputPage = currentEdited.value === String(page) && !hasExistAnimations;
			if (!isUserInputPage) {
				if (hasExistAnimations) {
					currentEdited.value = String(prevPage);
					thumb.style.transitionTimingFunction = eases.easeOutMax;
				}
				newPageNumber.value.hidden = false;
				if (!merged) isForceSmallRipple.value = true;
				pageEdit.value.animate({
					left: ["0", `${pageLeft ? 36 : -36}px`],
				}, animationOptions(hasExistAnimations));
				newPageNumber.value.animate({
					left: [`${pageLeft ? -36 : 36}px`, "0"],
				}, animationOptions(hasExistAnimations)).finished.then(() => {
					setCurrentPage();
					if (newPageNumber.value) newPageNumber.value.hidden = true;
					thumb.style.removeProperty("transition-timing-function");
					isForceSmallRipple.value = false;
				}).catch(IGNORE);
			} else setCurrentPage();
		} else setCurrentPage();
		// #endregion
	});

	onMounted(() => {
		document.addEventListener("keydown", onArrowKeydown);
	});

	onBeforeUnmount(() => {
		document.removeEventListener("keydown", onArrowKeydown);
	});

	/**
	 * ページ番号を変更します。
	 * @param page - 新しいページ番号。
	 */
	function changePage(page: number) {
		if (page < 1 || page > pages.value)
			throw new RangeError(`ページ範囲外です。現在のページ番号の範囲は1～${pages.value}ですが、設定値は${page}です。`);
		model.value = page;
	}
	/**
	 * ページ番号を移動します。例：+1, -1。
	 * @param movement - 移動するページ数。
	 */
	function movePage(movement: number) {
		if (movement === 0) return;
		const newPage = currentPage.value + movement;
		if (newPage < 1 || newPage > pages.value) return;
		changePage(newPage);
	}
	/**
	 * キーボードの左右矢印キーが押されたときにページをめくります。
	 * @param e - キーボードイベント。
	 */
	function onArrowKeydown(e: KeyboardEvent) {
		if (!props.enableArrowKeyMove || document.activeElement === pageEdit.value) return;
		const movement =
			e.code === "ArrowLeft" ? -1 :
			e.code === "ArrowRight" ? 1 : 0;
		if (movement) movePage(movement);
	}
	/**
	 * 現在のページ番号に基づいて、ページネーションコントロールのスクロール領域に表示されるページアイテムの配列を取得します。
	 * @param current - 現在のページ番号。
	 * @returns ページネーションコントロールのスクロール領域に表示されるページアイテムの配列。
	 */
	function getScrolledItems(current: number): number[] {
		const result: number[] = [];
		const scrolledItemCount_1 = scrolledItemCount.value - 1;
		let left = Math.floor(scrolledItemCount_1 / 2);
		left = Math.max(current - left, 1 + +showFirst.value);
		let right = left + scrolledItemCount_1;
		if (right > pages.value - +showLast.value) {
			right = pages.value - +showLast.value;
			left = Math.max(right - scrolledItemCount_1, 1 + +showFirst.value);
		}
		for (let i = left; i <= right; i++)
			result.push(i);
		return result;
	}
	/**
	 * 2つの配列をマージし、ページアイテムの座標とページ番号のキーと値のペアを返します。
	 * @param prevItems - 変更前のページアイテムの配列。
	 * @param nextItems - 変更後のページアイテムの配列。
	 * @returns ページアイテムの座標とページ番号のキーと値のペア。
	 */
	function mergePosition(prevItems: number[], nextItems: number[]): {
		items: PositionPageItemPair;
		finallyPosition: number;
	} | false {
		nextItems = nextItems.filter(item => !prevItems.includes(item));
		if (nextItems.length === 0) return false;
		const result = {} as PositionPageItemPair;
		prevItems.forEach((item, i) => result[i] = item);
		const moveToLeft = nextItems[0] < prevItems[0],
			prevLength = prevItems.length,
			nextLength = nextItems.length;
		nextItems.forEach((item, i) => {
			const position = !moveToLeft ? prevLength + i : i - nextLength;
			result[position] = item;
		});
		return { items: result, finallyPosition: nextItems.length * (moveToLeft ? -1 : 1) };
	}
	/**
	 * ページ番号編集中にEnterキーが押されたときのイベント。
	 * @param e - キーボードイベント。
	 */
	function onEnterEdited(e: KeyboardEvent) {
		if (e.code === "Enter") {
			if (currentEdited.value.trim() !== "")
				changePage(parseInt(currentEdited.value, 10));
			(e.target as HTMLDivElement).blur();
		}
	}
	/**
	 * ページ番号編集中にフォーカスが外れたときのイベント。
	 * このとき、選択中のテキストを解除する必要があります。
	 */
	function onBlurEdited() {
		if (currentEdited.value.trim() === "")
			currentEdited.value = String(currentPage.value);
		window.getSelection()?.removeAllRanges();
	}

	/**
	 * ページインデックス値に基づいてページインデックス値を取得します（謎）。
	 *
	 * 実は配列モードに対応するためです。
	 * @param index - ページインデックス値。文字列パラメータ型が唯一使用されるのは、ユーザーがテキストを入力してページをジャンプするときです。
	 * @returns ページインデックス値または配列内のコンテンツ。
	 */
	function getPageName(index: number | string) {
		return !array.value ? index : array.value[+index - 1];
	}
</script>

<template>
	<DefineUnselectedItem v-slot="{ page, position }">
		<SoftButton
			nonfocusable
			:style="{ '--position': position }"
			:text="getPageName(page)"
			:aria-label="t.switch_page_label(page)"
			:aria-selected="currentPage === page"
			:aria-current="currentPage === page && 'page'"
			@click="changePage(page)"
		/>
	</DefineUnselectedItem>

	<Comp
		:inert="disabled"
		role="slider"
		aria-orientation="horizontal"
		:aria-label="t.current_page_label(currentPage, pages)"
		:aria-valuenow="currentPage"
		:aria-valuemin="1"
		:aria-valuemax="pages"
	>
		<div class="track" :class="{ 'small-ripple': isForceSmallRipple }">
			<UnselectedItem v-if="showFirst" :page="1" />
			<div
				v-if="pages >= 3"
				ref="scrollArea"
				class="scroll-area"
				:class="{ 'is-scrolling': isScrolling }"
			>
				<div class="ripples">
					<div>
						<UnselectedItem v-for="(item, position) in scrolledPages" :key="item" :position="position" :page="item" />
					</div>
				</div>
				<div class="texts">
					<div>
						<div
							v-for="(item, position) in scrolledPages"
							:key="item"
							:style="{ '--position': position }"
						>{{ getPageName(item) }}</div>
					</div>
				</div>
			</div>
			<UnselectedItem v-if="pages >= 2 && showLast" :page="pages" />
		</div>
		<div v-ripple class="thumb">
			<form>
				<div
					ref="pageEdit"
					class="page-edit"
					:contenteditable="!array"
					inputmode="numeric"
					@input="e => currentEdited = (e.target as HTMLDivElement).innerText"
					@keydown="onEnterEdited"
					@blur="onBlurEdited"
				>
					{{ getPageName(currentEdited) }}
				</div>
			</form>
			<div ref="newPageNumber" class="new-page-number">{{ getPageName(currentPage) }}</div>
			<div class="focus-stripe"></div>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	$size: 36px;
	$ripple-size: 48px;
	$focus-stripe-height: 2px;

	.track {
		@include control-inner-shadow;
		@include round-small;
		position: relative;
		display: flex;
		width: fit-content;
		overflow: clip;
		background-color: c(inset-bg);

		.soft-button {
			--wrapper-size: #{$size};
			--ripple-size: #{$ripple-size};
			transition: $fallback-transitions, left 0s;
		}

		&.small-ripple .soft-button :deep(button) {
			&:has(> .ripple-circle):not(:hover, :active) {
				@include square(var(--wrapper-size) !important);
			}
		}

		.texts {
			overflow: clip;
			pointer-events: none;

			> * > * {
				@include square($size);
				@include flex-center;
				color: c(icon-color);
				font-weight: 600;
				transition: $fallback-transitions, left 0s;
			}
		}
	}

	:comp {
		position: relative;
		user-select: none;

		&[inert] {
			opacity: 0.4;
		}
	}

	.thumb {
		@include page-active;
		@include square($size);
		@include round-small;
		position: absolute;
		top: 0;
		left: calc(v-bind(thumbPosition) * $size);
		z-index: 3;
		overflow: clip;
		color: white;
		font-weight: bold;
		line-height: $size;
		text-align: center;
		background-color: c(accent);
		transition: $fallback-transitions, all $ease-out-back 500ms, left $ease-in-out-smooth 500ms;

		&:any-hover {
			@include button-shadow-hover;
			background: c(accent-hover);

			&:has(:focus) {
				@include button-shadow-hover-focus;
			}
		}

		&:active {
			@include button-scale-pressed;
			background: c(accent);
		}

		&:has(:focus) {
			@include button-shadow-focus;

			> .focus-stripe {
				top: 0;
			}
		}

		.focus-stripe {
			$focus-stripe-height: 2px;
			top: $focus-stripe-height;
			border-bottom: c(accent-10) $focus-stripe-height solid;
			pointer-events: none;
		}

		> *,
		.page-edit {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		.new-page-number {
			top: 0;
			left: -$size;
		}

		.page-edit {
			position: absolute;
			top: 0;

			&[contenteditable="true"] {
				cursor: text;
			}
		}

		::selection {
			color: c(accent);
			background-color: c(accented-selection);
		}
	}

	%scroll-area-size {
		position: relative;
		width: calc(v-bind(scrolledItemCount) * $size);
		height: $size;
	}

	.scroll-area {
		@extend %scroll-area-size;

		.soft-button {
			color: transparent;
		}

		&.is-scrolling :deep(*::before) {
			pointer-events: none;
		}

		> * {
			@include square(100%);
			position: absolute;
			top: 0;

			> * {
				@extend %scroll-area-size;

				> * {
					position: absolute;
					left: calc(var(--position) * $size);
				}
			}
		}
	}
</style>
