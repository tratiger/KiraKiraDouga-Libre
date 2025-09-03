<docs>
	初回ログイン時、ニックネームがない場合、またはニックネームがルール違反の場合に表示されるページ。
</docs>

<script setup lang="ts">
	useHead({ title: "KIRAKIRA☆DOUGAファミリーへようこそ" }); // TODO: 多言語
	const next = Array.isArray(useRoute().query.next) ?
		useRoute().query.next?.[0] ?? "/" :
		useRoute().query.next as string ?? "/"; // FIXME: なぜArray.isArrayは三項演算子の三番目が絶対にArray型でないと推論できないのか

	const container = ref<HTMLDivElement>();

	const profile = reactive({
		name: "",
		nameValid: false,
		nickname: "",
		bio: "",
		gender: "",
		birthday: Temporal.Now.plainDateISO().withCalendar("gregory"),
		tags: [] as string[],
	});
	const isRead = ref(false);
	const showWelcome = ref(false);
	const avatarBlob = ref<string>(); // アバターファイル
	const cropper = ref<InstanceType<typeof ImageCropper>>(); // 画像トリミングインスタンス
	const isAvatarCropperOpened = ref(false); // ユーザーアバター画像トリミングが有効か
	const isUploadingUserAvatar = ref(false); // アバターをアップロード中か
	const userAvatarUploadFile = ref<string | undefined>(); // ユーザーがアップロードしたアバターファイルのBlob
	const userAvatarFileInput = ref<HTMLInputElement>(); // 非表示の画像アップロードInput要素
	const isUpdatingUserInfo = ref<boolean>(false); // ユーザー情報をアップロード中か
	const validData = computed(() => isRead.value && profile.nameValid && profile.gender);

	/**
	 * 登録完了。
	 */
	async function finish() {
		isUpdatingUserInfo.value = true;
		const updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto = {
			avatar: avatarBlob.value,
			username: profile.name.normalize(),
			userNickname: profile.nickname.normalize(),
			signature: profile.bio.normalize(),
			gender: profile.gender.normalize(),
			userBirthday: Temporal.Now.plainDateISO().withCalendar("gregory").toString(),
			label: profile.tags.map((tag, index) => ({ id: index, labelName: tag.normalize() })),
		};
		try {
			const updateOrCreateUserInfoResult = await api.user.updateOrCreateUserInfo(updateOrCreateUserInfoRequest);
			if (updateOrCreateUserInfoResult.success) {
				await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore: useAppSettingsStore(), selfUserInfoStore: useSelfUserInfoStore(), headerCookie: undefined });
				isUpdatingUserInfo.value = false;
			}
		} catch (error) {
			isUpdatingUserInfo.value = false;
			useToast("ユーザー情報の更新に失敗しました！", "error"); // TODO: 多言語
			console.error("ユーザー情報の更新に失敗しました！", error);
		}

		const main = container.value?.parentElement;
		if (main) {
			main.scrollTo({ top: 0, left: 0, behavior: "smooth" });
			await main.animate([{}, { translate: "0 100%", opacity: 0 }], { duration: 600, easing: eases.easeInMax, fill: "forwards" }).finished;
			showWelcome.value = true;
			await delay(1200);
		}
		navigate(next);
	}

	/**
	 * アバター変更イベント。サーバーに新しい画像を送信します。
	 */
	async function handleSubmitAvatarImage() {
		try {
			isUploadingUserAvatar.value = true;
			const blobImageData = await cropper.value?.getCropBlobData();
			if (blobImageData) {
				const userAvatarUploadSignedUrlResult = await api.user.getUserAvatarUploadSignedUrl();
				const userAvatarUploadSignedUrl = userAvatarUploadSignedUrlResult.userAvatarUploadSignedUrl;
				const userAvatarUploadFilename = userAvatarUploadSignedUrlResult.userAvatarFilename;
				if (userAvatarUploadSignedUrlResult.success && userAvatarUploadSignedUrl && userAvatarUploadFilename) {
					const uploadResult = await api.user.uploadUserAvatar(userAvatarUploadFilename, blobImageData, userAvatarUploadSignedUrl);
					if (uploadResult) {
						avatarBlob.value = userAvatarUploadFilename;
						isAvatarCropperOpened.value = false;
						clearBlobUrl(); // メモリを解放
					}
					isUploadingUserAvatar.value = false;
				}
			} else {
				useToast("トリミング後の画像を取得できません！", "error"); // TODO: 多言語
				console.error("ERROR", "トリミング後の画像を取得できません");
			}
		} catch (error) {
			useToast("アバターのアップロードに失敗しました！", "error"); // TODO: 多言語
			console.error("ERROR", "ユーザーアバターのアップロード中にエラーが発生しました", error);
			isUploadingUserAvatar.value = false;
		}
	}

	/**
	 * アバタークリックイベント。ファイルアップロードのクリックをシミュレートし、ファイルエクスプローラーを呼び出します
	 */
	function handleUploadAvatarImage() {
		userAvatarFileInput.value?.click();
	}

	/**
	 * アップロードされた画像がある場合、画像トリミングツールを開きます。
	 *
	 * つまり、ユーザーがローカルファイルを選択したイベントです。
	 * @param e - ユーザーがファイルをアップロードする `<input>` 要素のchangeイベントである必要があります。
	 */
	async function handleOpenAvatarCropper(e?: Event) {
		e?.stopPropagation();
		const fileInput = e?.target as HTMLInputElement | undefined;
		const image = fileInput?.files?.[0];

		if (image) {
			if (!/\.(a?png|jpe?g|jfif|pjp(eg)?|gif|svg|webp)$/i.test(fileInput.value)) {
				useToast("画像ファイルのみアップロードできます！", "error"); // TODO: 多言語
				console.error("ERROR", "選択されたアバター画像の形式はサポートされていません！");
				return;
			}

			userAvatarUploadFile.value = await fileToBlob(image);
			isAvatarCropperOpened.value = true;
			fileInput.value = ""; // ユーザーがアップロードしたファイルを読み取った後、inputをクリアする必要があります。これにより、ユーザーが次回同じファイルをアップロードしたときにchangeイベントがトリガーされないのを防ぎます。
		}
	}

	/**
	 * アップロードが完了した画像をクリアし、メモリを解放します。
	 */
	function clearBlobUrl() {
		if (userAvatarUploadFile.value) {
			URL.revokeObjectURL(userAvatarUploadFile.value);
			userAvatarUploadFile.value = undefined;
		}
	}

	useEventListener(userAvatarFileInput, "change", handleOpenAvatarCropper); // アバターファイルの変更イベントを監視
</script>

<template>
	<!-- TODO: 多言語対応 -->
	<Modal v-model="isAvatarCropperOpened" title="アバターを更新">
		<div class="avatar-cropper">
			<ImageCropper
				ref="cropper"
				:image="userAvatarUploadFile"
				:fixed="true"
				:fixedNumber="[1, 1]"
				:full="true"
				:centerBox="true"
				:infoTrue="true"
				:mode="'contain '"
			/>
		</div>
		<template #footer-right>
			<!-- TODO: 多言語対応 -->
			<Button class="secondary" @click="isAvatarCropperOpened = false">キャンセル</Button>
			<!-- TODO: 多言語対応 -->
			<Button :loading="isUploadingUserAvatar" @click="handleSubmitAvatarImage">アバターを更新</Button>
		</template>
	</Modal>

	<div class="banner">
		<LogoCover noAnimation noTitle />
		<h1><LogoText />ファミリーへようこそ</h1>
	</div>
	<div ref="container" class="container">
		<div class="card">
			<div class="card-rectangle"></div>
			<h2>個人情報を入力</h2>
			<div class="items">
				<div class="avatar">
					<UserAvatar :avatar="avatarBlob" @click="handleUploadAvatarImage" />
					<span>アバターをアップロード</span>
					<input ref="userAvatarFileInput" type="file" accept="image/*" hidden />
				</div>

				<SettingsUserProfile v-model="profile" />

				<Checkbox v-model:single="isRead"><PopupWindowLink href="https://otomad.github.io/cssc/license.htm">「KIRAKIRA☆DOUGA利用規約」</PopupWindowLink>を読み、同意します</Checkbox>

				<Button icon="check" :disabled="!validData || isUpdatingUserInfo" :loading="isUpdatingUserInfo" @click="finish">KIRAKIRA☆DOUGAの旅を始めよう</Button>
			</div>
		</div>
	</div>
	<ClientOnlyTeleport to="body">
		<div v-if="showWelcome" class="welcome">
			<div class="avatar">
				<UserAvatar :avatar="avatarBlob" />
				<ProgressRing />
			</div>
			<div class="content-wrapper">
				<div v-for="i in 2" :key="i" class="content" :class="{ 'content-visible': i === 2 }">
					<p class="welcome-text">ようこそ</p>
					<p class="name">{{ profile.name }}</p>
				</div>
			</div>
		</div>
	</ClientOnlyTeleport>
</template>

<style scoped lang="scss">
	.banner {
		--i: 0;
		position: relative;

		.logo-cover {
			--width: 100%;
			--height: 280px;
			position: absolute;
			top: 0;
			pointer-events: none;
			mask-image: linear-gradient(white, transparent);
		}

		h1 {
			@include flex-center;
			flex-wrap: wrap;
			gap: 16px;
			width: 100%;
			padding: 30px 0;
			font-size: 48px;

			@include tablet {
				zoom: 0.6;
			}

			@include mobile {
				zoom: 0.4;
			}
		}

		.logo-text {
			--form: full;
			zoom: 2.5;
		}
	}

	h1,
	h2 {
		color: c(accent);
	}

	.container {
		--i: 1;
		padding-top: 0;
		padding-bottom: 0;

		h2 {
			font-size: 24px;
		}

		.card {
			position: relative;
			padding: 24px 32px;

			.card-rectangle {
				@include round-large(top);
				@include card-shadow-with-blur;
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100lvh;
				background-color: c(main-bg, 80%);

				~ * {
					position: relative;
				}
			}

			.items {
				display: flex;
				flex-direction: column;
				gap: 20px;
				align-items: stretch;
				margin-top: 24px;

				.avatar {
					display: flex;
					gap: 16px;
					align-items: center;

					span {
						color: c(icon-color);
						font-size: 16px;
					}
				}

				button {
					margin-left: auto;
				}

				.checkbox:deep() {
					padding: 0 14px;

					label {
						margin-left: 13px;
					}
				}
			}
		}
	}

	.banner,
	.container {
		animation: float-up 600ms calc(150ms * var(--i)) $ease-out-smooth backwards;
	}

	.welcome {
		@include flex-center;
		position: fixed;
		inset: 0;
		gap: 30px;
		cursor: progress;

		.avatar {
			position: relative;
			animation: scale-in 600ms $ease-out-back forwards;

			.user-avatar {
				@include square(128px);
				pointer-events: none;
			}

			.progress-ring {
				--size: 128px;
				--thickness: 5px;
				position: absolute;
				top: 0;
				z-index: 2;
				animation: fade-in 500ms 400ms $ease-out-sine backwards;
			}
		}

		.content-wrapper {
			$ease-scaler-or-mover: cubic-bezier(0.3, 0, 0, 1);
			position: relative;
			display: grid;
			grid-template-rows: 1fr;
			grid-template-columns: 0fr;
			animation: avatar-mover 600ms 400ms $ease-scaler-or-mover forwards;

			.content {
				$ease-text-move: cubic-bezier(0.1, 0.5, 0, 1);
				overflow: clip;
				white-space: nowrap;

				&:not(.content-visible) {
					visibility: hidden;
				}

				&.content-visible {
					position: absolute;
					overflow: visible;
				}

				.welcome-text {
					margin-bottom: 10px;
					font-size: 24px;
					animation: name-move 700ms 450ms $ease-text-move both;
				}

				.name {
					font-size: 38px;
					font-weight: bold;
					animation: name-move 700ms 500ms $ease-text-move both;
				}
			}
		}
	}

	@keyframes avatar-mover {
		to {
			grid-template-columns: 1fr;
		}
	}

	@keyframes name-move {
		0% {
			translate: 200px;
			opacity: 0;
		}

		1% {
			translate: 200px;
			opacity: 1;
		}

		100% {
			translate: 0;
			opacity: 1;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes float-up {
		from {
			translate: 0 2rem;
			opacity: 0;
		}
	}

	.avatar-cropper {
		@include square(350px, true);

		@media (width <= 450px) {
			--size: 80dvw;
			// 画像トリミングツールについては、レスポンシブ対応は推奨されません。トリミングツール内部の画像はサイズが変更されないためです。しかし、極端に小さいサイズへの対応や、画像アップロード時にブラウザの幅が急激に変化する可能性は低いため、この機能は残しています。
		}
	}
</style>
