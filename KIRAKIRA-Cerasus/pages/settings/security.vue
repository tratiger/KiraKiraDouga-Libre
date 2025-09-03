<script setup lang="ts">
	import type { Level, RenderAs } from "qrcode.vue";
	import QrcodeVue from "qrcode.vue";

	const passwordChangeDate = ref(new Date());
	const passwordChangeDateDisplay = computed(() => formatDateWithLocale(passwordChangeDate.value));
	const selfUserInfoStore = useSelfUserInfoStore();
	const appSettingsStore = useAppSettingsStore();
	const selfUserInfo = useSelfUserInfoStore();

	// メールアドレス変更関連
	const showChangeEmail = ref(false);
	const changeEmailVerificationCode = ref("");
	const newEmail = ref("");
	const isInvalidNewEmail = computed(() => !!newEmail.value && !newEmail.value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]{2,}$/));
	const changeEmailPassword = ref("");
	const isChangingEmail = ref(false);

	// パスワード変更関連
	const showChangePassword = ref(false);
	const changePasswordVerificationCode = ref("");
	const oldPassword = ref("");
	const newPassword = ref("");
	const confirmNewPassword = ref("");
	const isChangingPassword = ref(false);

	// 2FA関連
	const checkUser2FAResult = ref<CheckUserHave2FAResponseDto>(); // 取得したユーザーの2FAタイプ
	const authenticatorAddDateDisplay = computed(() => formatDateWithLocale(new Date(checkUser2FAResult.value?.totpCreationDateTime ?? 0)));
	type AuthenticatorType = "none" | "email" | "totp";
	const categoryOf2FAComputed = computed<AuthenticatorType>({ // 2FAのタイプ、副作用あり
		get() {
			return appSettingsStore.authenticatorType === "email" || appSettingsStore.authenticatorType === "totp" ? appSettingsStore.authenticatorType : "none";
		},
		set(newValue: string) {
			if (appSettingsStore.authenticatorType === "totp" && newValue !== "totp" && checkUser2FAResult.value?.type === "totp") {
				// リアクティブ変数がtotpから他の非totpの値に変更され、かつユーザーの2FAタイプがtotpの場合、TOTPのバインド解除モーダルを開き、リアクティブ変数の変更は行わない
				useToast(t.toast.must_remove_totp_first, "warning", 5000);
				openDeleteTotpModel();
			} else if (appSettingsStore.authenticatorType === "email" && newValue !== "email" && checkUser2FAResult.value?.type === "email") {
				// リアクティブ変数がemailから他の非emailの値に変更され、かつユーザーの2FAタイプがemailの場合、Email 2FAの削除モーダルを開き、リアクティブ変数の変更は行わない
				openDeleteEmail2FAModel();
				useToast(t.toast.must_verify_email_first, "warning", 5000);
			} else if (newValue === "email" && appSettingsStore.authenticatorType !== "email" && checkUser2FAResult.value?.type !== "email")
				openCreateEmail2FAModel();
			else
				appSettingsStore.authenticatorType = newValue;
		},
	});
	const hasBoundTotp = computed(() => checkUser2FAResult.value?.success && checkUser2FAResult.value.have2FA && checkUser2FAResult.value?.type === "totp"); // TOTPが既に存在するかどうか。2FAが存在し、タイプがtotpの場合、TOTP編集モーダルを開き、そうでない場合はTOTP作成モーダルを開く
	const isEmail2FADisable = computed(() => checkUser2FAResult.value?.type === "totp" || categoryOf2FAComputed.value === "totp");
	const isTotp2FADisable = computed(() => checkUser2FAResult.value?.type === "email" || categoryOf2FAComputed.value === "email");

	// 警告関連
	const isUnsafeAccount = computed(() => selfUserInfo.isLogined && (appSettingsStore.authenticatorType === "none" || !checkUser2FAResult.value?.have2FA));

	// TOTP 2FA作成関連
	const showCreateTotpModel = ref(false); // TOTP作成モーダルを表示するか
	const otpAuth = ref<string>(""); // TOTP AUTH（QRコード内の値）
	const totpQrcodeLevel = ref<Level>("M"); // QRコードレベル
	const totpQrcodeRenderAs = ref<RenderAs>("svg"); // QRコードレンダリング形式
	const totpQrcodeSize = ref<number>(200); // QRコードサイズ（px）
	const confirmTotpVerificationCode = ref(""); // TOTPバインド確認時にユーザーが入力する確認コード
	const isConfirmTotp = ref(false); // TOTPバインド確認中か
	const backupCode = ref<string[]>([]); // バックアップコード
	const displayBackupCode = computed(() => backupCode.value.join("\t")); // 表示用のバックアップコード、タブで区切る
	const recoveryCode = ref(""); // リカバリーコード

	// TOTP 2FA削除関連
	const showDeleteTotpModel = ref(false); // TOTP削除モーダルを表示するか
	const deleteTotpVerificationCode = ref(""); // TOTP削除時にユーザーが入力する確認コード
	const deleteTotpPassword = ref(""); // TOTP削除時にユーザーが入力するパスワード
	const isDeletingTotp = ref(false); // TOTP削除中か

	// Email 2FA作成関連
	const showCreateEmail2FAModel = ref(false); // Email 2FA作成モーダルを表示するか
	const isCreatingEmail2FA = ref(false); // Email 2FA作成中か

	// Email 2FA削除関連
	const showDeleteEmail2FAModel = ref(false); // Email 2FA削除モーダルを表示するか
	const deleteEmail2FAVerificationCode = ref(""); // Email 2FA削除時にユーザーが入力する確認コード
	const deleteEmail2FAPassword = ref(""); // Email 2FA削除時にユーザーが入力するパスワード
	const isDeletingEmail2FA = ref(false); // Email 2FA削除中か

	/**
	 * メールアドレスを変更
	 */
	async function updateUserEmail() {
		const oldEmail = selfUserInfoStore.userInfo.email ?? "";
		if (!newEmail.value || !changeEmailPassword.value || !changeEmailVerificationCode.value) {
			useToast(t(3).toast.required_not_filled, "warning", 5000);
			return;
		}
		if (oldEmail === newEmail.value) {
			useToast(t.toast.new_email_same, "warning", 5000);
			return;
		}
		isChangingEmail.value = true;
		const passwordHash = await generateHash(changeEmailPassword.value);
		const updateUserEmailRequest: UpdateUserEmailRequestDto = {
			uid: selfUserInfoStore.userInfo.uid ?? -1,
			oldEmail,
			newEmail: newEmail.value,
			passwordHash,
			verificationCode: changeEmailVerificationCode.value,
		};
		const updateUserEmailResult = await api.user.updateUserEmail(updateUserEmailRequest);
		if (updateUserEmailResult.success) {
			await api.user.getSelfUserInfo({ getSelfUserInfoRequest: undefined, appSettingsStore, selfUserInfoStore, headerCookie: undefined });
			useToast(t.toast.email_changed, "success");
			showChangeEmail.value = false;
		} else
			useToast(t.toast.something_went_wrong, "error", 5000);
		newEmail.value = "";
		changeEmailPassword.value = "";
		changeEmailVerificationCode.value = "";
		isChangingEmail.value = false;
	}

	/**
	 * メールアドレスを変更
	 */
	async function updateUserPassword() {
		if (!oldPassword.value || !newPassword.value || !changePasswordVerificationCode.value) {
			useToast(t(3).toast.required_not_filled, "warning");
			return;
		}
		if (newPassword.value !== confirmNewPassword.value) {
			useToast(t.toast.password_mismatch, "warning");
			return;
		}
		isChangingPassword.value = true;
		const oldPasswordHash = await generateHash(oldPassword.value);
		const newPasswordHash = await generateHash(newPassword.value);
		const updateUserPasswordRequest: UpdateUserPasswordRequestDto = {
			oldPasswordHash,
			newPasswordHash,
			verificationCode: changePasswordVerificationCode.value,
		};
		const updateUserPasswordResult = await api.user.updateUserPassword(updateUserPasswordRequest);
		if (updateUserPasswordResult.success) {
			isChangingPassword.value = false;
			showChangePassword.value = false;
			useToast(t.toast.password_changed, "success");
			await api.user.userLogout({ appSettingsStore, selfUserInfoStore });
			useEvent("app:requestLogin");
		} else
			useToast(t.toast.something_went_wrong, "error");
	}

	/**
	 * CookieのUUIDを介してユーザーが2FA認証を有効にしているか確認します
	 */
	async function checkUserHave2FAByUUID() {
		const headerCookie = useRequestHeaders(["cookie"]);
		checkUser2FAResult.value = await api.user.checkUserHave2FAByUUID(headerCookie);
		if (checkUser2FAResult.value?.type)
			categoryOf2FAComputed.value = checkUser2FAResult.value.type;
		else
			categoryOf2FAComputed.value = "none";
	}

	/**
	 * Email 2FA作成モーダルを開きます
	 */
	function openCreateEmail2FAModel() {
		showCreateEmail2FAModel.value = true;
	}

	/**
	 * Email 2FA作成モーダルを閉じます
	 */
	function closeCreateEmail2FAModel() {
		showCreateEmail2FAModel.value = false;
	}

	/**
	 * ユーザーがEmail認証を作成します
	 */
	async function createEmail2FA() {
		isCreatingEmail2FA.value = true;
		try {
			const headerCookie = useRequestHeaders(["cookie"]);
			const createEmail2FAResult = await api.user.createEmail2FA(headerCookie);
			if (!createEmail2FAResult.success) {
				useToast(t.toast.something_went_wrong, "error", 5000);
				isCreatingEmail2FA.value = false;
			}

			if (createEmail2FAResult.isExists) {
				useToast(t.toast.exists_2fa, "warning", 5000);
				isCreatingEmail2FA.value = false;
			}

			isCreatingEmail2FA.value = false;
			showCreateEmail2FAModel.value = false;
			appSettingsStore.authenticatorType = "email";
			useToast(t.toast.email_2fa_enabled, "success", 3000);
			checkUserHave2FAByUUID();
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERRRR", "Failed to enable email 2FA:", error);
			checkUserHave2FAByUUID();
		}
	}

	/**
	 * Email 2FA削除モーダルを開きます
	 */
	function openDeleteEmail2FAModel() {
		showDeleteEmail2FAModel.value = true;
	}

	/**
	 * Email 2FA削除モーダルを閉じ、関連ステータスをクリアします
	 */
	function closeDeleteEmail2FAModel() {
		showDeleteEmail2FAModel.value = false;
		isDeletingEmail2FA.value = false;
		deleteEmail2FAPassword.value = "";
		deleteEmail2FAVerificationCode.value = "";
	}

	/**
	 * Email 2FAを削除
	 */
	async function deleteEmail2FAByVerification() {
		isDeletingEmail2FA.value = true;
		try {
			if (!deleteEmail2FAPassword.value || !deleteEmail2FAVerificationCode.value) {
				isDeletingEmail2FA.value = false;
				useToast(t(2).toast.required_not_filled, "error", 5000);
				return;
			}

			const deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto = {
				passwordHash: await generateHash(deleteEmail2FAPassword.value),
				verificationCode: deleteEmail2FAVerificationCode.value,
			};
			const headerCookie = useRequestHeaders(["cookie"]);
			const deleteEmail2FAResult = await api.user.deleteEmail2FA(deleteUserEmailAuthenticatorRequest, headerCookie);
			if (deleteEmail2FAResult.success) {
				useToast(t.toast.email_2fa_disabled, "success", 5000);
				closeDeleteEmail2FAModel();
				await checkUserHave2FAByUUID();
			} else {
				isDeletingEmail2FA.value = false;
				useToast(t.toast.something_went_wrong, "error", 5000);
			}
		} catch (error) {
			isDeletingEmail2FA.value = false;
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERRRR", "Failed to disable email 2FA:", error);
		}
	}

	/**
	 * TOTPモーダルを開きます
	 */
	function openTotpModel() {
		if (hasBoundTotp.value)
			openDeleteTotpModel();
		else
			openCreateTotpModel();
	}

	/**
	 * TOTP作成モーダルを開きます
	 */
	async function openCreateTotpModel() {
		/**
		 * 0. モーダルを開く
		 * 1. TOTP作成をリクエスト
		 * 2. 作成結果に基づいてQRコードをレンダリングし、バックアップコードとリカバリーコードを表示
		 */

		showCreateTotpModel.value = true;
		const headerCookie = useRequestHeaders(["cookie"]);
		const createTotpAuthenticatorResult = await api.user.createTotpAuthenticator(headerCookie);
		if (createTotpAuthenticatorResult.success && createTotpAuthenticatorResult.result?.otpAuth)
			otpAuth.value = createTotpAuthenticatorResult.result.otpAuth;
	}

	/**
	 * TOTP作成モーダルを閉じ、QRコードデータとバックアップ/リカバリーコードデータをクリアします
	 */
	async function closeCreateTotpModel() {
		isConfirmTotp.value = true;
		await checkUserHave2FAByUUID();

		showCreateTotpModel.value = false;
		otpAuth.value = "";
		confirmTotpVerificationCode.value = "";
		isConfirmTotp.value = false;
		backupCode.value = [];
		recoveryCode.value = "";
	}

	/**
	 * TOTPのバインドを確認
	 */
	async function handleClickConfirmTotp() {
		if (!confirmTotpVerificationCode.value) {
			useToast(t.validation.required.totp_verification_code, "error");
			return;
		}

		isConfirmTotp.value = true;

		try {
			const confirmUserTotpAuthenticatorRequest: ConfirmUserTotpAuthenticatorRequestDto = {
				clientOtp: confirmTotpVerificationCode.value,
				otpAuth: otpAuth.value,
			};
			const headerCookie = useRequestHeaders(["cookie"]);
			const confirmUserTotpAuthenticatorResult = await api.user.confirmUserTotpAuthenticator(confirmUserTotpAuthenticatorRequest, headerCookie);

			if (confirmUserTotpAuthenticatorResult.success && confirmUserTotpAuthenticatorResult.result?.backupCode && confirmUserTotpAuthenticatorResult.result.recoveryCode) {
				backupCode.value = confirmUserTotpAuthenticatorResult.result.backupCode;
				recoveryCode.value = confirmUserTotpAuthenticatorResult.result.recoveryCode;
			}
			await checkUserHave2FAByUUID();
		} catch (error) {
			isConfirmTotp.value = false;
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERRRR", "Failed to add TOTP authenticator:", error);
		}
		isConfirmTotp.value = false;
	}

	/**
	 * TOTPで生成されたバックアップコードとリカバリーコードをダウンロードします。
	 */
	function downloadBackupCodeAndRecoveryCode() {
		const backupCodeAndRecoveryCode = `${t.two_factor_authentication.add_totp.backup_code}\n${displayBackupCode.value}\n\n${t.two_factor_authentication.add_totp.recovery_code}\n${recoveryCode.value}`;
		const filename = `KIRAKIRA TOTP CODE ${selfUserInfoStore.userInfo.username} (UID ${selfUserInfoStore.userInfo.uid}) ${new Date().getTime()}`;
		downloadTxtFileFromString(backupCodeAndRecoveryCode, filename);
	}

	/**
	 * TOTP削除モーダルを開きます
	 */
	function openDeleteTotpModel() {
		showDeleteTotpModel.value = true;
	}

	/**
	 * TOTP削除モーダルを閉じ、関連ステータスをクリアします
	 */
	function closeDeleteTotpModel() {
		showDeleteTotpModel.value = false;
		isDeletingTotp.value = false;
		deleteTotpPassword.value = "";
		deleteTotpVerificationCode.value = "";
	}

	/**
	 * TOTP認証を削除
	 */
	async function deleteTotpByVerification() {
		if (!deleteTotpPassword.value) {
			useToast(t.validation.required.password, "error");
			return;
		}

		if (!deleteTotpVerificationCode.value) {
			useToast(t.validation.required.totp_verification_code, "error");
			return;
		}

		isDeletingTotp.value = true;
		try {
			const passwordHash = await generateHash(deleteTotpPassword.value);
			const deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto = {
				passwordHash,
				clientOtp: deleteTotpVerificationCode.value,
			};
			const headerCookie = useRequestHeaders(["cookie"]);
			const deleteTotpByVerificationCodeResult = await api.user.deleteTotpByVerificationCode(deleteTotpAuthenticatorByTotpVerificationCodeRequest, headerCookie);

			if (deleteTotpByVerificationCodeResult.isCoolingDown)
				useToast(t.toast.cooling_down, "warning");

			if (deleteTotpByVerificationCodeResult.success) {
				closeDeleteTotpModel();
				await checkUserHave2FAByUUID();
			} else
				useToast(t.toast.something_went_wrong, "error", 5000);

			isDeletingTotp.value = false;
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERRRR", "Failed to remove TOTP authenticator:", error);
			isDeletingTotp.value = false;
		}
	}

	await checkUserHave2FAByUUID();
</script>

<template>
	<div>
		<InfoBar v-if="isUnsafeAccount" type="warning" :title="t.severity.warning">
			<Preserves>{{ t.settings.security.is_unsafe_2fa }}</Preserves>
		</InfoBar>
		<section>
			<SettingsChipItem
				icon="email"
				trailingIcon="edit"
				:details="t.current_email + t.colon + selfUserInfoStore.userInfo.email"
				@trailingIconClick="showChangeEmail = true"
			>{{ t.email_address }}</SettingsChipItem>
		</section>
		<section>
			<SettingsChipItem
				icon="password"
				trailingIcon="edit"
				:details="t.modification_date + t.colon + passwordChangeDateDisplay"
				@trailingIconClick="showChangePassword = true"
			>{{ t.password }}</SettingsChipItem>
		</section>
		<Subheader icon="lock">{{ t.two_factor_authentication }}</Subheader>
		<span>{{ t.two_factor_authentication.description }}</span>
		<section list>
			<RadioButton v-model="categoryOf2FAComputed" v-ripple value="none" :details="t.two_factor_authentication.off_description">{{ t.off }}</RadioButton>
			<RadioButton v-model="categoryOf2FAComputed" v-ripple value="email" :details="t.two_factor_authentication.email_description" :disabled="isEmail2FADisable">{{ t.email }}</RadioButton>
			<RadioButton v-model="categoryOf2FAComputed" v-ripple value="totp" :details="t.two_factor_authentication.totp_description" :disabled="isTotp2FADisable">{{ t.two_factor_authentication.totp }}</RadioButton>
		</section>
		<section v-if="categoryOf2FAComputed === 'totp'">
			<SettingsChipItem
				icon="lock"
				:trailingIcon="hasBoundTotp ? 'delete' : 'add'"
				:details="checkUser2FAResult?.totpCreationDateTime ? t.addition_date + t.colon + authenticatorAddDateDisplay : undefined"
				@trailingIconClick="openTotpModel"
			>{{ t.totp_authenticator }}</SettingsChipItem>
		</section>

		<Modal v-model="showChangeEmail" :title="t.change_email" icon="email">
			<div class="change-email-modal">
				<form>
					<TextBox
						v-model="newEmail"
						:required="true"
						:invalid="isInvalidNewEmail"
						type="email"
						icon="email"
						:placeholder="t.new_email"
						autoComplete="new-email"
					/>
					<SendVerificationCode v-model="changeEmailVerificationCode" :email="newEmail" verificationCodeFor="change-email" :disabled="!newEmail || isInvalidNewEmail" />
					<TextBox
						v-model="changeEmailPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password._"
						autoComplete="current-password"
					/>
				</form>
			</div>
			<template #footer-right>
				<Button class="secondary" :disabled="isChangingEmail" @click="showChangePassword = false">{{ t.step.cancel }}</Button>
				<Button @click="updateUserEmail" :disabled="isChangingEmail || !newEmail || !changeEmailPassword || !changeEmailVerificationCode" :loading="isChangingEmail">{{ t.step.apply }}</Button>
			</template>
		</Modal>

		<Modal v-model="showChangePassword" :title="t.password.change" icon="password">
			<div class="change-password-modal">
				<form>
					<SendVerificationCode v-model="changePasswordVerificationCode" verificationCodeFor="change-password" />
					<TextBox
						v-model="oldPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password.current"
						autoComplete="current-password"
					/>
					<TextBox
						v-model="newPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password.new"
						autoComplete="new-password"
					/>
					<TextBox
						v-model="confirmNewPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password.new_retype"
						autoComplete="new-password"
					/>
				</form>
			</div>
			<template #footer-right>
				<Button class="secondary" :disabled="isChangingPassword" @click="showChangePassword = false">{{ t.step.cancel }}</Button>
				<Button @click="updateUserPassword" :disabled="isChangingPassword || !oldPassword || !newPassword || !changePasswordVerificationCode" :loading="isChangingPassword">{{ t.step.apply }}</Button>
			</template>
		</Modal>

		<Modal v-model="showCreateTotpModel" :title="t.two_factor_authentication.add_totp" icon="lock" :hideTitleCloseIcon="true">
			<div class="create-totp-modal">
				<InfoBar type="warning" :title="t.severity.warning">
					{{ t.two_factor_authentication.add_totp.warning }}
				</InfoBar>
				<div v-if="!backupCode || backupCode.length <= 0 || !recoveryCode" class="page">
					<div class="step">
						<ShadingIcon icon="download" />
						<h3><Icon name="counter_1" />{{ t.two_factor_authentication.add_totp.step_install }}</h3>
						<p>
							<TransInterpolation keypath="t.two_factor_authentication.add_totp.step_install_description">
								<template #ente-auth>
									<a href="https://ente.io/auth/" target="_blank">Ente Auth</a>
								</template>
								<template #microsoft-authenticator>
									<a href="https://www.microsoft.com/security/mobile-authenticator-app" target="_blank">Microsoft Authenticator</a>
								</template>
								<template #google-authenticator>
									<a href="https://support.google.com/accounts/answer/1066447" target="_blank">Google Authenticator</a>
								</template>
							</TransInterpolation>
						</p>
					</div>
					<div class="step">
						<ShadingIcon icon="qr_code_scanner" />
						<h3><Icon name="counter_2" />{{ t.two_factor_authentication.add_totp.step_scan }}</h3>
						<div class="totp-qrcode-box">
							<QrcodeVue v-if="otpAuth" :value="otpAuth" :level="totpQrcodeLevel" :renderAs="totpQrcodeRenderAs" :size="totpQrcodeSize" />
						</div>
					</div>
					<div class="step">
						<ShadingIcon icon="edit" />
						<h3><Icon name="counter_3" />{{ t.two_factor_authentication.add_totp.step_enter_code }}</h3>
						<p>
							<Preserves>{{ t.two_factor_authentication.add_totp.step_enter_code_description }}</Preserves>
						</p>
						<form class="totp-confirm-form">
							<TextBox
								v-model="confirmTotpVerificationCode"
								:required="true"
								type="text"
								icon="verified"
								:placeholder="t.totp_verification_code"
								autocomplete="off"
							/>
						</form>
					</div>
				</div>
				<div v-else class="page">
					<div class="step">
						<ShadingIcon icon="lock_reset" />
						<h3><Icon name="counter_4" />{{ t.two_factor_authentication.add_totp.step_save }}</h3>
						<p>
							<Preserves>{{ t.two_factor_authentication.add_totp.step_save_description }}</Preserves>
						</p>
						<br />
						<p>{{ t(2).two_factor_authentication.add_totp.backup_code }}</p>
						<label class="details">{{ t.two_factor_authentication.add_totp.backup_code_description }}</label>
						<pre><code>{{ displayBackupCode }}</code></pre>
						<br />
						<p>{{ t.two_factor_authentication.add_totp.recovery_code }}</p>
						<label class="details">{{ t.two_factor_authentication.add_totp.recovery_code_description }}</label>
						<pre><code>{{ recoveryCode }}</code></pre>
					</div>
				</div>
			</div>

			<template v-if="!backupCode || backupCode.length <= 0 || !recoveryCode" #footer-right>
				<Button class="secondary" @click="closeCreateTotpModel" :disabled="isConfirmTotp">{{ t.step.cancel }}</Button>
				<Button icon="arrow_right" class="icon-behind" @click="handleClickConfirmTotp" :disabled="isConfirmTotp || !confirmTotpVerificationCode" :loading="isConfirmTotp">{{ t.step.next }}</Button>
			</template>
			<template v-else #footer-right>
				<Button icon="download" class="secondary" @click="downloadBackupCodeAndRecoveryCode">{{ t.two_factor_authentication.add_totp.download }}</Button>
				<Button icon="check" @click="closeCreateTotpModel" :disabled="isConfirmTotp" :loading="isConfirmTotp">{{ t.step.finish }}</Button>
			</template>
		</Modal>

		<Modal v-model="showDeleteTotpModel" :title="t.two_factor_authentication.remove_totp" icon="delete">
			<div class="delete-totp-modal">
				<form>
					<TextBox
						v-model="deleteTotpPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password"
						autoComplete="current-password"
					/>
					<TextBox
						v-model="deleteTotpVerificationCode"
						:required="true"
						type="text"
						icon="lock"
						:placeholder="t.totp_verification_code"
						autocomplete="off"
					/>
				</form>
			</div>
			<template #footer-right>
				<Button class="secondary" :disabled="isDeletingTotp" @click="closeDeleteTotpModel">{{ t.step.cancel }}</Button>
				<Button severity="danger" icon="delete" @click="deleteTotpByVerification" :disabled="isDeletingTotp || !deleteTotpVerificationCode" :loading="isDeletingTotp">{{ t.remove }}</Button>
			</template>
		</Modal>

		<Modal v-model="showCreateEmail2FAModel" :title="t.two_factor_authentication.enable_email" icon="lock">
			<div class="enable-email-2fa-modal">
				<p>{{ t.current_email + t.colon + selfUserInfoStore.userInfo.email }}</p>
				<p class="danger-text">{{ t.two_factor_authentication.enable_email.ensure }}</p>
			</div>
			<template #footer-right>
				<Button class="secondary" :disabled="isCreatingEmail2FA" @click="closeCreateEmail2FAModel">{{ t.step.cancel }}</Button>
				<Button severity="warning" @click="createEmail2FA" :disabled="isCreatingEmail2FA" :loading="isCreatingEmail2FA">{{ t.enable }}</Button>
			</template>
		</Modal>

		<Modal v-model="showDeleteEmail2FAModel" :title="t.two_factor_authentication.disable_email" icon="delete">
			<div class="delete-email-2fa-modal">
				<form>
					<TextBox
						v-model="deleteEmail2FAPassword"
						:required="true"
						type="password"
						icon="lock"
						:placeholder="t.password"
						autoComplete="current-password"
					/>
					<SendVerificationCode v-model="deleteEmail2FAVerificationCode" verificationCodeFor="delete-email-2fa" />
				</form>
			</div>
			<template #footer-right>
				<Button class="secondary" :disabled="isDeletingEmail2FA" @click="closeDeleteEmail2FAModel">{{ t.step.cancel }}</Button>
				<Button severity="danger" @click="deleteEmail2FAByVerification" :disabled="isDeletingEmail2FA || !deleteEmail2FAPassword || !deleteEmail2FAVerificationCode" :loading="isDeletingEmail2FA">{{ t.disable }}</Button>
			</template>
		</Modal>
	</div>
</template>

<style scoped lang="scss">
	.change-password-modal {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 24px;
		width: 350px;

		> form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.text-box {
			--size: large;
		}
	}

	.change-email-modal {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 24px;
		width: 350px;

		> form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.text-box {
			--size: large;
		}
	}

	.create-totp-modal {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 8px;
		width: 80dvw;
		max-width: 550px;

		> form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.text-box {
			--size: large;
		}

		.page {
			display: flex;
			flex-direction: column;
			gap: 8px;

			.totp-qrcode-box {
				@include round-small;
				@include chip-shadow;
				display: inline-flex;
				justify-content: center;
				align-items: center;
				width: 150px;
				height: 150px;
				padding: 8px;
				background-color: white;

				> svg {
					@include square(100%);
				}
			}

			.totp-confirm-form {
				margin-top: 8px;
			}

			.step {
				@include chip-shadow;
				@include round-large;
				position: relative;
				padding: 16px;
				overflow: clip;
				background-color: c(surface-color);

				.shading-icon {
					position: absolute;
					z-index: unset;
				}

				> *:not(h3) {
					margin-left: 32px;
				}
			}

			h3 {
				display: flex;
				gap: 8px;
				align-items: center;
				margin-bottom: 6px;

				.icon {
					color: c(accent);
					font-size: 24px;
				}
			}

			pre {
				@include round-small;
				display: flex;
				align-items: center;
				height: 36px;
				margin-top: 4px;
				padding: 0 12px;
				background-color: c(gray-10);
				cursor: text;

				code {
					display: block;
					width: 100%;
					user-select: text;
				}
			}
		}
	}

	.delete-totp-modal {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 24px;
		width: 350px;

		> form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.text-box {
			--size: large;
		}
	}

	.enable-email-2fa-modal,
	.delete-email-2fa-modal {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 24px;
		width: 350px;

		> form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.text-box {
			--size: large;
		}
	}

	.danger-text {
		color: c(red);
	}
</style>
