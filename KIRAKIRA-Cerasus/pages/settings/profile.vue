<script setup lang="ts">
	const banner = "static/images/banner-20220717.png";

	// const avatar = "/static/images/avatars/aira.webp";
	const selfUserInfoStore = useSelfUserInfoStore();
	const appSettingsStore = useAppSettingsStore();

	const newAvatar = ref<string>(); // 新しくアップロードされたアバター
	const correctAvatar = computed(() => newAvatar.value ?? selfUserInfoStore.userInfo.avatar); // 正しく表示されるアバター（ユーザーが新しいアバターをアップロードしていない場合は、グローバル変数の古いアバターを使用）
	const userAvatarUploadFile = ref<string | undefined>(); // ユーザーがアップロードしたアバターファイルのBlob
	const isAvatarCropperOpen = ref(false); // ユーザーアバター画像トリミングツールが開いているか
	const newAvatarImageBlob = ref<Blob>(); // ユーザーがトリミングした後のアバター
	const userAvatarFileInput = ref<HTMLInputElement>(); // 非表示の画像アップロードInput要素
	const isUpdateUserInfo = ref<boolean>(false); // ユーザー情報をアップロード中か
	const isResetUserInfo = ref<boolean>(false); // ユーザー情報をリセット中か
	const profile = reactive({
		name: selfUserInfoStore.userInfo.username?.normalize() ?? "",
		nickname: selfUserInfoStore.userInfo.userNickname?.normalize() ?? "",
		bio: selfUserInfoStore.userInfo.signature?.normalize() ?? "",
		gender: selfUserInfoStore.userInfo.gender?.normalize() ?? "",
		birthday: (() => {
			try {
				return Temporal.PlainDate.from(selfUserInfoStore.userInfo.userBirthday!);
			} catch {
				return Temporal.Now.plainDateISO().withCalendar("gregory");
			}
		})(),
		tags: selfUserInfoStore.userInfo.label?.map(label => label.labelName?.normalize()) ?? [],
	});
	const cropper = ref<InstanceType<typeof ImageCropper>>(); // 画像トリミングツールのインスタンス
	const isUploadingUserAvatar = ref(false); // アバターをアップロード中か
	const showConfirmResetAlert = ref(false); // リセット警告ダイアログを表示するか

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
				useToast(t.toast.unsupported_image_format, "error");
				console.error("ERROR", t.toast.unsupported_image_format);
				return;
			}

			userAvatarUploadFile.value = await fileToBlob(image);
			isAvatarCropperOpen.value = true;
			fileInput.value = ""; // ユーザーがアップロードしたファイルを読み取った後、inputをクリアする必要があります。これにより、ユーザーが次回同じファイルをアップロードしたときにchangeイベントがトリガーされないのを防ぎます。
		}
	}

	/**
	 * アバターをトリミングするためにクリックします
	 */
	async function handleChangeAvatarImage() {
		isUploadingUserAvatar.value = true;
		try {
			const blobImageData = await cropper.value?.getCropBlobData();
			if (blobImageData) {
				const imageBlobUrl = URL.createObjectURL(blobImageData);
				newAvatar.value = imageBlobUrl;
				newAvatarImageBlob.value = blobImageData;
			} else
				useToast(t.toast.something_went_wrong, "error", 5000);
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERROR", "Failed to update avatar.", error);
		}
		isUploadingUserAvatar.value = false;
		isAvatarCropperOpen.value = false;
	}

	/**
	 * アバター変更イベント。サーバーに新しい画像を送信します。
	 */
	async function handleSubmitAvatarImage() {
		try {
			const blobImageData = newAvatarImageBlob.value;
			if (blobImageData) {
				const userAvatarUploadSignedUrlResult = await api.user.getUserAvatarUploadSignedUrl();
				const userAvatarUploadSignedUrl = userAvatarUploadSignedUrlResult.userAvatarUploadSignedUrl;
				const userAvatarUploadFilename = userAvatarUploadSignedUrlResult.userAvatarFilename;
				if (userAvatarUploadSignedUrlResult.success && userAvatarUploadSignedUrl && userAvatarUploadFilename) {
					const uploadResult = await api.user.uploadUserAvatar(userAvatarUploadFilename, blobImageData, userAvatarUploadSignedUrl);
					if (uploadResult) {
						newAvatar.value = userAvatarUploadFilename;
						clearBlobUrl(); // メモリを解放
					}
				}
			} else {
				useToast(t.toast.something_went_wrong, "error");
				console.error("ERROR", "Failed to get cropped image data.");
			}
		} catch (error) {
			useToast(t.toast.avatar_upload_failed, "error");
			console.error("ERROR", "Failed to upload avatar.", error);
		}
	}

	/**
	 * cookieのuidとtokenに基づいてユーザー情報を取得します。
	 *
	 * 同時にユーザートークンの検証機能も持ちます。
	 */
	async function getSelfUserInfoController() {
		try {
			const headerCookie = useRequestHeaders(["cookie"]);
			await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore, selfUserInfoStore, headerCookie });
		} catch (error) {
			console.error("ユーザー情報を取得できません。再ログインしてみてください", error);
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

	/**
	 * Update the user profile.
	 */
	async function updateProfile() {
		isUpdateUserInfo.value = true;
		if (newAvatarImageBlob.value)
			try {
				await handleSubmitAvatarImage();
			} catch (error) {
				useToast(t.toast.avatar_upload_failed, "error");
				console.error("ERROR", "Failed to upload avatar.", error);
			}

		const updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto = {
			avatar: correctAvatar.value,
			username: profile.name.normalize(),
			userNickname: profile.nickname.normalize(),
			signature: profile.bio.normalize(),
			gender: profile.gender.normalize(),
			userBirthday: profile.birthday.toString(),
			label: profile.tags?.map((tag, index) => ({ id: index, labelName: tag.normalize() })),
		};
		try {
			const updateOrCreateUserInfoResult = await api.user.updateOrCreateUserInfo(updateOrCreateUserInfoRequest);
			if (updateOrCreateUserInfoResult.success) {
				await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore, selfUserInfoStore, headerCookie: undefined });
				isUpdateUserInfo.value = false;
				newAvatarImageBlob.value = undefined;
				useToast(t.toast.profile_updated, "success");
			} else {
				isUpdateUserInfo.value = false;
				useToast(t.toast.something_went_wrong, "error");
			}
		} catch (error) {
			isUpdateUserInfo.value = false;
			useToast(t.toast.something_went_wrong, "error");
			console.error("Failed to update profile.", error);
		}
	}

	/**
	 * リセット確認の警告ダイアログを表示します
	 */
	function resetConfirm() {
		showConfirmResetAlert.value = true;
	}

	/**
	 * reset all user info.
	 * ユーザー設定をリセット
	 * 古いユーザー情報をリクエストし、Piniaのユーザーデータを変更してから、上記のリスナーをトリガーします
	 */
	async function reset() {
		isResetUserInfo.value = true;
		const updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto = {
			avatar: "",
			userNickname: "",
			signature: "",
			gender: "",
			userBirthday: undefined,
			label: [],
		};
		try {
			const updateOrCreateUserInfoResult = await api.user.updateOrCreateUserInfo(updateOrCreateUserInfoRequest);
			if (updateOrCreateUserInfoResult.success) {
				await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore, selfUserInfoStore, headerCookie: undefined });
				isResetUserInfo.value = false;
				showConfirmResetAlert.value = false;
			} else {
				isResetUserInfo.value = false;
				useToast(t.toast.something_went_wrong, "error");
			}
		} catch (error) {
			isResetUserInfo.value = false;
			useToast(t.toast.something_went_wrong, "error");
			console.error("Failed to reset profile.", error);
		}
	}

	/**
	 * Piniaのユーザーデータを現在のコンポーネントのリアクティブ変数 "profile" にコピーします
	 */
	function copyPiniaUserInfoToProfile() {
		profile.name = selfUserInfoStore.userInfo.username?.normalize() ?? "";
		profile.nickname = selfUserInfoStore.userInfo.userNickname?.normalize() ?? "";
		profile.bio = selfUserInfoStore.userInfo.signature?.normalize() ?? "";
		profile.gender = selfUserInfoStore.userInfo.gender?.normalize() ?? "";
		profile.tags = selfUserInfoStore.userInfo.label?.map(label => label.labelName?.normalize()) ?? [];
	}

	useEventListener(userAvatarFileInput, "change", handleOpenAvatarCropper); // アバターファイルの変更イベントを監視

	onMounted(async () => await getSelfUserInfoController());
	onBeforeUnmount(clearBlobUrl); // メモリを解放
	watch(selfUserInfoStore, copyPiniaUserInfoToProfile); // Piniaのユーザーデータを監視し、変更があれば現在のコンポーネントのリアクティブ変数 "profile" にコピーします
	useListen("user:login", async loginStatus => { // ユーザーログインイベントが発生したら、最新のユーザー情報をリクエストし、Piniaのユーザーデータを変更してから、上記のリスナーをトリガーします
		if (loginStatus)
			await getSelfUserInfoController();
	});
</script>

<template>
	<div>
		<Alert v-model="showConfirmResetAlert" static>
			{{ t.confirm.reset_profile }}
			<template #footer-left>
				<Button @click="reset" :loading="isResetUserInfo" :disabled="isUpdateUserInfo || isResetUserInfo">{{ t.step.ok }}</Button>
			</template>
			<template #footer-right>
				<Button @click="showConfirmResetAlert = false" class="secondary">{{ t.step.cancel }}</Button>
			</template>
		</Alert>

		<Modal v-model="isAvatarCropperOpen" :title="t.profile.edit_avatar">
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
				<Button class="secondary" @click="isAvatarCropperOpen = false">{{ t.step.cancel }}</Button>
				<Button :loading="isUploadingUserAvatar" @click="handleChangeAvatarImage">{{ t.step.ok }}</Button>
			</template>
		</Modal>

		<div v-ripple class="banner">
			<NuxtImg :src="banner" alt="banner" draggable="false" format="avif" />
			<span>{{ t.profile.edit_banner }}</span>
		</div>

		<div class="change-avatar" @click="handleUploadAvatarImage">
			<UserAvatar :avatar="correctAvatar" hoverable />
			<span>{{ t.profile.edit_avatar }}</span>
			<input ref="userAvatarFileInput" type="file" accept="image/*" hidden />
		</div>

		<div class="items">
			<SettingsUserProfile v-model="profile" />
		</div>

		<div class="submit">
			<Button icon="delete" class="secondary" @click="resetConfirm" :disabled="isUpdateUserInfo || isResetUserInfo">{{ t.step.reset }}</Button>
			<Button icon="check" @click="updateProfile" :loading="isUpdateUserInfo" :disabled="isUpdateUserInfo || isResetUserInfo">{{ t.step.save }}</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.banner {
		@include round-large;
		position: relative;
		overflow: clip;
		background-color: c(gray-5);

		> img {
			z-index: 1;
			width: 100%;
			height: 150px;
			object-fit: cover;
			cursor: pointer;

			&:any-hover {
				scale: 105%;
				filter: brightness(0.75) blur(2px);

				& + span {
					opacity: 1;
				}
			}

			&:not(:any-hover) {
				transition-duration: 1s;
			}
		}

		span {
			position: absolute;
			right: 0;
			bottom: 0;
			z-index: 5;
			margin: 1rem;
			color: white;
			opacity: 0;
			pointer-events: none;
		}
	}

	.change-avatar {
		z-index: 5;
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		margin: -48px 0 12px 24px;
		color: c(icon-color);
		pointer-events: none;

		.user-avatar {
			--size: 64px;
			pointer-events: auto;

			&:any-hover + span {
				opacity: 1;
			}
		}

		span {
			margin-bottom: 0.5rem;
			opacity: 0;
			pointer-events: none;
		}
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.avatar-cropper {
		@include square(350px, true);

		@media (width <= 450px) {
			--size: 80dvw;
			// 画像トリミングツールについては、レスポンシブ対応は推奨されません。トリミングツール内部の画像はサイズが変更されないためです。しかし、極端に小さいサイズへの対応や、画像アップロード時にブラウザの幅が急激に変化する可能性は低いため、この機能は残しています。
		}
	}
</style>
