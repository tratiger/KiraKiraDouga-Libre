<script setup lang="ts">
	import beepSrc from "assets/audios/NOVA 2022.1 Alert Quick.ogg";
	import type { ToastEvent } from "composables/toast";
	import animationData from "lotties/spinner-dev1.json";

	const useSyncKiraCookieOptions = { isWatchCookieRef: true, isSyncSettings: true, isListenLoginEvent: true };

	// テーマ
	const cookieThemeType = useKiraCookie<ThemeSetType>(COOKIE_KEY.themeTypeCookieKey, SyncUserSettings.updateOrCreateUserThemeTypeSetting, useSyncKiraCookieOptions);
	// カスタムカラー
	const cookieThemeColor = useKiraCookie<string>(COOKIE_KEY.themeColorCookieKey, SyncUserSettings.updateOrCreateUserThemeColorSetting, useSyncKiraCookieOptions);

	const page = ref(1);
	const pages = ref(99);
	const displayPageCount = ref(7);
	const toggle = ref(false);
	const isClicked = ref(false);
	const theme = cookieThemeType;
	const palette = cookieThemeColor;
	const radioValue = ref("");
	const timeoutId = ref<Timeout>();
	const isTagChecked = ref(false);
	const tagInput = ref<string>("タグ名を入力");
	const volume = ref(100);
	const pitch = ref(0);
	const selectedTab = ref("all");
	const logoTextForm = ref<LogoTextFormType>("full");
	const showAlert = ref(false);
	const showModal = ref(false);
	const showProgress = ref(true);
	const progressRingSize = ref(40);
	const progressRingThickness = ref(4);
	const progressBarHeight = ref(4);
	const progressPercent = ref(30);
	const progressIndeterminate = ref(true);
	const progressValue = computed(() => progressIndeterminate.value ? NaN : progressPercent.value);
	const inputValue = ref("");
	const menu = ref<MenuModel>();
	const beep = ref<HTMLAudioElement>();
	const isUploaderLovinIt = ref(true);
	const kiraGoods = ref(["kawaii", "nice"]);
	const isSelectAll = computed<CheckState>(() => kiraGoods.value.length >= 3 ? "checked" : kiraGoods.value.length === 0 ? "unchecked" : "indeterminate");
	const onSelectAllChange = (e: { value: string; checkState: CheckState; checked: boolean }) => {
		kiraGoods.value = [];
		if (e.checked) kiraGoods.value.push("kawaii", "nijigen", "nice");
	};
	const toastMessage = ref("");
	const toastSeverity = ref<ToastEvent["severity"]>("success");
	const longTextTest = "素早い茶色の狐は怠惰な犬を飛び越える".repeat(20);
	const selectedSegmented = ref("list");
	const flyout = ref<FlyoutModel>();
	const flyoutKaomoji = ref<FlyoutModel>();
	const showFlyout = (e: MouseEvent, placement?: Placement) => flyout.value = [e, placement];
	const [DefinePopoverSlot, PopoverSlot] = createReusableTemplate();
	const comboBoxValue = ref("obtuse angle");
	const settingsGridItemSelect = ref("");
	const color = ref(Color.fromHex("#f00"));
	const timecode = ref(new Duration(0));
	const time = ref(Temporal.Now.plainTimeISO());
	const date = ref(Temporal.Now.plainDateISO().withCalendar("gregory"));

	/**
	 * ボタンクリックイベント。
	 * @param e - マウスイベント。
	 */
	async function onClickButton(e: MouseEvent) {
		clearTimeout(timeoutId.value);
		const button = e.target as HTMLButtonElement;
		await animateSize(button, () => isClicked.value = true);
		await new Promise(resolve => timeoutId.value = setTimeout(resolve, 2000));
		await animateSize(button, () => isClicked.value = false);
	}

	/**
	 * スライダーのスライド完了イベント。
	 * @param _value - スライダーの数値。
	 */
	function onSlided(_value: number) {
		const b = beep.value;
		if (!b) return;
		b.currentTime = 0;
		b.play();
		b.preservesPitch = false;
		b.volume = (volume.value / 100) ** 2;
		b.playbackRate = 2 ** (pitch.value / 12);
	}

	useHead({ title: t.components_test_page });
</script>

<template>
	<div class="container">
		<DefinePopoverSlot>
			<div class="modal-content">
				<div>
					<p>動画タイトル</p>
					<TextBox v-model="inputValue" placeholder="動画タイトル" />
				</div>
				<div>
					<p>動画パート</p>
					<TextBox v-model="inputValue" placeholder="動画パート" />
				</div>
			</div>
		</DefinePopoverSlot>

		<div class="component-test">
			<Pagination v-model="page" :pages :displayPageCount enableArrowKeyMove />
			<Segmented v-model="selectedSegmented" :style="{ '--ease': 'ease-in-out' }">
				<SegmentedItem id="list" icon="list">リスト</SegmentedItem>
				<SegmentedItem id="grid" icon="grid">グリッド</SegmentedItem>
				<SegmentedItem id="tile" icon="tile">タイル</SegmentedItem>
			</Segmented>
			<div class="buttons">
				<Button class="test-button" @click="onClickButton">{{ isClicked ? "クリックされました(泣)" : "メインボタン" }}</Button>
				<Button class="test-button" severity="warning">警告ボタン</Button>
				<Button class="test-button" severity="danger">危険ボタン</Button>
				<Button disabled>無効なメインボタン</Button>
				<Button @click="showConfetti">{{ t.confetti }}</Button>
				<Button icon="send">{{ t.send }}</Button>
				<Button @click="showAlert = true">アラートを表示</Button>
				<Button @click="showModal = true">モーダルを表示</Button>
				<Button @click="showFlyout">フライアウトを表示</Button>
				<Button @click="e => flyoutKaomoji = [e, 'y']">顔文字フライアウトを表示</Button>
				<Button class="secondary">セカンダリボタン</Button>
				<Button class="secondary" disabled>無効なセカンダリボタン</Button>
				<Button class="tertiary">ターシャリボタン</Button>
				<Button class="tertiary" disabled>無効なターシャリボタン</Button>
			</div>
			<Alert v-model="showAlert" static />
			<Modal v-model="showModal" title="タイトルバー">
				<PopoverSlot />
			</Modal>
			<Flyout v-model="flyout">
				<PopoverSlot />
			</Flyout>
			<FlyoutKaomoji v-model="flyoutKaomoji" />
			<ToggleSwitch v-model="toggle">切り替えスイッチ {{ toggle ? t.on : t.off }}</ToggleSwitch>
			<ToggleSwitch disabled>{{ t.disabled }} {{ t.off }}</ToggleSwitch>
			<ToggleSwitch on disabled>{{ t.disabled }} {{ t.on }}</ToggleSwitch>
			<hr />
			<RadioButton v-model="radioValue" value="1">選択肢1</RadioButton>
			<RadioButton v-model="radioValue" value="2">選択肢2</RadioButton>
			<hr />
			<RadioButton v-model="theme" value="light">{{ t.scheme.light }}</RadioButton>
			<RadioButton v-model="theme" value="dark">{{ t.scheme.dark }}</RadioButton>
			<RadioButton v-model="theme" value="system">{{ t.scheme.system }}</RadioButton>
			<hr />
			<RadioButton v-model="palette" value="pink">{{ t.palette.pink }}</RadioButton>
			<RadioButton v-model="palette" value="sky">{{ t.palette.sky }}</RadioButton>
			<RadioButton v-model="palette" value="blue">{{ t.palette.blue }}</RadioButton>
			<RadioButton v-model="palette" value="orange">{{ t.palette.orange }}</RadioButton>
			<RadioButton v-model="palette" value="purple">{{ t.palette.purple }}</RadioButton>
			<RadioButton v-model="palette" value="green">{{ t.palette.green }}</RadioButton>
			<RadioButton v-model="palette" value="custom" disabled>{{ t.custom }}</RadioButton>
			<RadioButton checked disabled>{{ t.disabled }} {{ t.on }}</RadioButton>
			<hr />
			<p>KIRAKIRAのどこが好きですか？</p>
			<Checkbox :checkState="isSelectAll" @change="onSelectAllChange">すべて選択</Checkbox>
			<Checkbox v-model="kiraGoods" value="kawaii">可愛い</Checkbox>
			<Checkbox v-model="kiraGoods" value="nice">素晴らしい</Checkbox>
			<Checkbox v-model="kiraGoods" value="nijigen">二次元</Checkbox>
			<Checkbox disabled checkState="unchecked">ネズミさんは大嫌い</Checkbox>
			<Checkbox disabled checkState="checked">無料でどうぞ</Checkbox>
			<hr />
			<ThumbGrid>
				<SettingsGridItem id="a" v-model="settingsGridItemSelect" title="a" />
				<SettingsGridItem id="b" v-model="settingsGridItemSelect" title="b" />
			</ThumbGrid>
			<hr />
			<TextBox v-model="inputValue" placeholder="小さくて柔らかくていい匂い" :style="{ '--size': 'small' }" />
			<TextBox v-model="inputValue" icon="kaomoji" required placeholder="通常" />
			<TextBox v-model="inputValue" icon="emotions" placeholder="XL TECHNO -More Dance Remix-" :style="{ '--size': 'large' }" />
			<SendVerificationCode v-model="inputValue" />
			<em>すべての入力ボックスの内容が同時に入力されるのは正常な現象です。3つの変数を作るのが面倒だったためです。</em>
			<hr />
			<p>彼は演技している可能性がありますか？彼は演技していますか？</p>
			<ComboBox v-for="size in ['small', 'normal', 'large']" :key="size" v-model="comboBoxValue" :style="{ '--size': size }">
				<ComboBoxItem id="not">いいえ</ComboBoxItem>
				<ComboBoxItem id="maybe not">多分違う</ComboBoxItem>
				<ComboBoxItem id="obtuse angle">鈍角</ComboBoxItem>
				<ComboBoxItem id="sa">สา</ComboBoxItem>
				<ComboBoxItem id="archosyrinx">痔瘻</ComboBoxItem>
				<ComboBoxItem id="voice lost">襳襺覛覝襻襼襾謕覧誖誗</ComboBoxItem>
				<ComboBoxItem id="who ask you">誰が聞いた？</ComboBoxItem>
				<ComboBoxItem id="select a">Aを選択</ComboBoxItem>
				<ComboBoxItem id="option 75">選択肢75</ComboBoxItem>
				<ComboBoxItem id="blmfy">blmfy</ComboBoxItem>
				<ComboBoxItem id="A.UV">༼</ComboBoxItem>
				<ComboBoxItem id="long worm">帯状疱疹</ComboBoxItem>
				<ComboBoxItem id="OV">⤳</ComboBoxItem>
				<ComboBoxItem id="snap">咔哄呃昵吖</ComboBoxItem>
				<ComboBoxItem id="eyelid scrub">輪刮眼眶</ComboBoxItem>
			</ComboBox>
			<hr />
			<p>タイムコード</p><TimecodePicker v-model="timecode" />
			<p>時間</p><TimePicker v-model="time" />
			<p>日付</p><DatePicker v-model="date" />
			<hr />
			<HeadingComments :count="233" />
			<hr />
			<Subheader>プログレスバー</Subheader>
			<ToggleSwitch v-model="showProgress">読み込み開始</ToggleSwitch>
			<p>サイズ</p><Slider v-model="progressRingSize" :min="1" :max="150" />
			<p>太さ</p><Slider v-model="progressRingThickness" :min="1" :max="60" />
			<p>高さ</p><Slider v-model="progressBarHeight" :min="1" :max="100" />
			<ToggleSwitch v-model="progressIndeterminate">不確定状態</ToggleSwitch>
			<p>進捗</p><Slider v-model="progressPercent" />
			<div class="buttons">
				<Button :loading="showProgress">ロード中のボタン</Button>
				<Button :loading="showProgress" disabled>ロード中の無効なボタン</Button>
			</div>
			<ProgressRing :hidden="!showProgress" :style="{ '--size': progressRingSize + 'px', '--thickness': progressRingThickness + 'px' }" :value="progressValue" />
			<ProgressBar :hidden="!showProgress" :style="{ height: progressBarHeight + 'px' }" :value="progressValue" />
			<!-- <Lottie loop autoplay :animationData="animationData" /> -->
			<hr />
			<Tag v-model="isTagChecked">{{ t.tag }}</Tag>
			<Tag v-model:input="tagInput" />
			<br />
			<Spoiler>あなたは知りすぎた。</Spoiler>
			<Spoiler color="var(--accent)">あなたは知りすぎた。</Spoiler>
			<p>音量</p><Slider v-model="volume" :defaultValue="100" @changed="onSlided" />
			<p>音程</p><Slider v-model="pitch" :min="-24" :max="24" :defaultValue="0" @changed="onSlided" />
			<div class="capsule-range-container">
				<CapsuleSlider v-model="volume" :defaultValue="100" :displayValue="Math.round" @changed="onSlided" />
			</div>
			<Slider v-model="volume" :defaultValue="100" :style="{ '--size': 'large' }" @changed="onSlided" />
			<em>マウスの中ボタンをクリックするか、タッチスクリーンでコンポーネントを長押しすると、デフォルト値に戻ります。</em>
			<audio ref="beep" :src="beepSrc"></audio>
			<TabBar v-model="selectedTab">
				<TabItem id="all">{{ t.all }}</TabItem>
				<TabItem id="video">{{ t.video }}</TabItem>
				<TabItem id="images">{{ t.image }}</TabItem>
				<TabItem id="long" badge="バッジ">テスト長い長い長い</TabItem>
				<TabItem id="short">短い</TabItem>
			</TabBar>
			<TabBar v-model="selectedTab" vertical>
				<TabItem id="all">{{ t.all }}</TabItem>
				<TabItem id="video">{{ t.video }}</TabItem>
				<TabItem id="images">{{ t.image }}</TabItem>
				<TabItem id="long" badge="バッジ">テスト長い長い長い</TabItem>
				<TabItem id="short">短い</TabItem>
			</TabBar>
			<hr />
			<div>
				<Button :style="{ marginBottom: '1rem' }" @click="menu = null">メニューを表示</Button>
				<Menu v-model="menu">
					<MenuItem icon="copy">コピー</MenuItem>
					<MenuItem icon="cut">切り取り</MenuItem>
					<MenuItem icon="paste">貼り付け</MenuItem>
					<hr />
					<MenuItem icon="delete">削除</MenuItem>
				</Menu>
			</div>
			<hr />
			<div class="toast-test">
				<RadioButton v-model="toastSeverity" value="info">情報</RadioButton>
				<RadioButton v-model="toastSeverity" value="success">成功</RadioButton>
				<RadioButton v-model="toastSeverity" value="warning">警告</RadioButton>
				<RadioButton v-model="toastSeverity" value="error">エラー</RadioButton>
				<section>
					<TextBox v-model="toastMessage" placeholder="メッセージをトーストに送信" />
					<Button icon="send" @click="useToast(toastMessage, toastSeverity)">トーストに送信</Button>
				</section>
			</div>
			<hr />
			<RadioButton v-model="logoTextForm" value="hidden">ロゴを隠す</RadioButton>
			<RadioButton v-model="logoTextForm" value="full">ロゴを全て表示</RadioButton>
			<LogoText :style="{ '--form': logoTextForm }" />
			<hr />
			<div class="flyout-bg" :style="{ width: '344px' }">
				<ColorPicker v-model="color" enableAlpha />
			</div>
			<hr />
			<div :style="{ height: '500px' }">
				<ImageCropper />
			</div>
			<hr />
			<Accordion autoCollapse>
				<AccordionItem title="1番目">
					<h4>タイトル</h4>
					内容
				</AccordionItem>
				<AccordionItem title="2番目">
					<h4>タイトル</h4>
					内容
				</AccordionItem>
				<AccordionItem title="3番目">
					<h4>タイトル</h4>
					内容
				</AccordionItem>
				<AccordionItem title="➕❤️">
					<ToggleSwitch v-model="isUploaderLovinIt" :style="{ marginBottom: '0.75rem' }">➕❤️</ToggleSwitch>
					<UploaderAira :hidden="!isUploaderLovinIt" />
				</AccordionItem>
				<AccordionItem title="スクロールバーテスト">
					<ScrollContainer class="scroll-test">
						<div class="scroll-test-item"></div>
					</ScrollContainer>
				</AccordionItem>
				<AccordionItem title="ツールチップテスト">
					タッチスクリーンデバイスではトリガーされません。
					<div class="tooltip-test">
						<Button v-tooltip="{ title: '上', placement: 'top' }">上</Button>
						<Button v-tooltip="{ title: '右', placement: 'right' }">右</Button>
						<Button v-tooltip="{ title: '下', placement: 'bottom' }">下</Button>
						<Button v-tooltip="{ title: '左', placement: 'left' }">左</Button>
						<Button v-tooltip="{ title: 'ページ境界から最も遠い垂直方向を自動的に探す', placement: 'y' }">垂直方向デフォルト</Button>
						<Button v-tooltip="{ title: 'ページ境界から最も遠い水平方向を自動的に探す', placement: 'x' }">水平方向デフォルト</Button>
						<Button v-tooltip="'デフォルトの位置を設定しない場合、ページ境界から最も遠い方向を自動的に探します'">全方向デフォルト</Button>
						<Button v-tooltip="longTextTest">長いテキスト</Button>
					</div>
				</AccordionItem>
				<AccordionItem title="フライアウトテスト">
					<div class="tooltip-test">
						<Button @click="e => showFlyout(e, 'top')">上</Button>
						<Button @click="e => showFlyout(e, 'right')">右</Button>
						<Button @click="e => showFlyout(e, 'bottom')">下</Button>
						<Button @click="e => showFlyout(e, 'left')">左</Button>
						<Button @click="e => showFlyout(e, 'y')">垂直方向デフォルト</Button>
						<Button @click="e => showFlyout(e, 'x')">水平方向デフォルト</Button>
						<Button @click="e => showFlyout(e)">全方向デフォルト</Button>
						<br />
						<Button @click="e => flyoutKaomoji = [e, 'top']">上に顔文字を展開</Button>
						<Button @click="e => flyoutKaomoji = [e, 'bottom']">下に顔文字を展開</Button>
					</div>
				</AccordionItem>
				<AccordionItem title="ページネーションテスト">
					<div class="pagination-test">
						<Pagination :current="1" :pages="1" :displayPageCount="7" />
						<Pagination :current="1" :pages="2" :displayPageCount="7" />
						<Pagination :current="1" :pages="3" :displayPageCount="7" />
						<Pagination :current="1" :pages="6" :displayPageCount="7" />
						<Pagination :current="1" :pages="10" :displayPageCount="7" />
					</div>
				</AccordionItem>
				<AccordionItem title="フロントエンドデザイナーを発狂させる">
					<section class="marquee-section">
						<marquee>KiRAKiRA☆DOUGA</marquee>
						<marquee direction="up">フロントエンドデザイナーを発狂させる</marquee>
						<marquee direction="down" width="250" height="200" behavior="alternate" class="marquee">
							<marquee behavior="alternate">DVD</marquee>
						</marquee>
					</section>
				</AccordionItem>
			</Accordion>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.component-test > :deep(*) {
		margin: 0.8rem 0.5rem;
	}

	.marquee {
		font-size: 3rem;
		font-style: italic;
		border: red solid;
	}

	.marquee-section {
		color: red;
		font-weight: 900;

		> :not(.marquee) {
			font-family: "Comic Sans MS", "华文彩云", fantasy;
		}
	}

	em {
		display: block;
	}

	.toast-test {
		> * {
			margin: 0.8rem 0;
		}

		> section {
			@include flex-center;
			gap: 10px;

			> button {
				flex-shrink: 0;
			}

			> .text-box {
				width: 100%;
			}
		}
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 400px;

		> * {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
	}

	.test-button :deep(*) {
		text-align: left;
	}

	.scroll-test {
		width: 100%;
		height: 500px;

		.scroll-test-item {
			@include square(200%);
		}
	}

	.tooltip-test {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		padding: 1rem 0;
	}

	.pagination-test {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.capsule-range-container {
		@include round-large;
		max-width: 400px;
		padding: 1rem;
		background-color: black;
	}

	.flyout-bg {
		@include dropdown-flyouts;
		@include round-large;
		@include set-max-size;
		@include acrylic-background;
		padding: 0.75rem 1rem;
	}
</style>
