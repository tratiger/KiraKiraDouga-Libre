<script setup lang="ts">
	const props = defineProps<{
		/** 認証コードの用途。 */
		verificationCodeFor: "registration" | "change-email" | "change-password" | "delete-email-2fa";
		/** メールアドレス。 */ // WARN verificationCodeForがchange-passwordの場合、このパラメータは不要です。
		email?: string;
		/** 無効？ */
		disabled?: boolean;
	}>();

	const emits = defineEmits<{
		send: [];
	}>();

	const value = defineModel<string>({ required: true });
	// const { timeout, isTimeouted, isResent, startTimeout } = useSendVerificationCodeTimeout(); // ゴミPiniaは展開をサポートしていません。
	const timeout = useSendVerificationCodeTimeout();
	const pattern = /^\d{6}$/;
	const isSendingEmail = ref(false); // メール送信中か

	/**
	 * 登録用認証コードを送信
	 */
	async function requestSendRegisterVerificationCodeEmail() {
		if (!props.email) {
			useToast(t.validation.required.email, "warning", 5000);
			return;
		}
		const locale = getCurrentLocaleLangCode();
		const requestSendVerificationCodeRequest: RequestSendVerificationCodeRequestDto = {
			email: props.email,
			clientLanguage: locale,
		};
		const requestSendVerificationCodeResponse = await api.user.requestSendVerificationCode(requestSendVerificationCodeRequest);
		if (!requestSendVerificationCodeResponse.isTimeout)
			console.log(requestSendVerificationCodeResponse);
		else
			useToast(t.toast.too_many_requests, "warning", 5000);
	}

	/**
	 * メールアドレス変更用の認証コードをリクエスト送信
	 */
	async function requestSendChangeEmailVerificationCodeEmail() {
		if (!props.email) {
			useToast(t.validation.required.email, "warning", 5000);
			return;
		}
		const locale = getCurrentLocaleLangCode();
		const requestSendChangeEmailVerificationCodeRequest: RequestSendChangeEmailVerificationCodeRequestDto = {
			newEmail: props.email,
			clientLanguage: locale,
		};
		const requestSendChangeEmailVerificationCodeResult = await api.user.requestSendChangeEmailVerificationCode(requestSendChangeEmailVerificationCodeRequest);
		if (requestSendChangeEmailVerificationCodeResult.success && requestSendChangeEmailVerificationCodeResult.isCoolingDown)
			useToast(t.toast.cooling_down, "error", 5000);
	}

	/**
	 * パスワード変更用の認証コードをリクエスト送信
	 */
	async function requestSendChangePasswordVerificationCodeEmail() {
		const locale = getCurrentLocaleLangCode();
		const requestSendChangePasswordVerificationCodeRequest: RequestSendChangePasswordVerificationCodeRequestDto = {
			clientLanguage: locale,
		};
		const requestSendChangePasswordVerificationCodeResult = await api.user.requestSendChangePasswordVerificationCode(requestSendChangePasswordVerificationCodeRequest);
		if (requestSendChangePasswordVerificationCodeResult.success && requestSendChangePasswordVerificationCodeResult.isCoolingDown)
			useToast(t.toast.cooling_down, "error", 5000);
	}

	/**
	 * メール認証システム削除用の認証コードをリクエスト送信
	 */
	async function requestSendDeleteEmail2FAVerificationCodeEmail() {
		const locale = getCurrentLocaleLangCode();
		const sendUserDeleteEmailAuthenticatorVerificationCodeRequest: SendUserDeleteEmailAuthenticatorVerificationCodeRequestDto = {
			clientLanguage: locale,
		};
		const sendUserEmailAuthenticatorVerificationCodeResult = await api.user.sendDeleteUserEmailAuthenticatorVerificationCode(sendUserDeleteEmailAuthenticatorVerificationCodeRequest);
		if (sendUserEmailAuthenticatorVerificationCodeResult.success && sendUserEmailAuthenticatorVerificationCodeResult.isCoolingDown)
			useToast(t.toast.cooling_down, "error", 5000);
	}

	/**
	 * 認証コードを送信します。
	 */
	async function sendVerificationCode() {
		isSendingEmail.value = true;
		try {
			switch (props.verificationCodeFor) {
				case "registration":
					await requestSendRegisterVerificationCodeEmail();
					break;
				case "change-email":
					await requestSendChangeEmailVerificationCodeEmail();
					break;
				case "change-password":
					await requestSendChangePasswordVerificationCodeEmail();
					break;
				case "delete-email-2fa":
					await requestSendDeleteEmail2FAVerificationCodeEmail();
					break;
				default:
					console.error("ERROR", "verificationCodeFor is not defined.");
					throw new Error("verificationCodeFor is not defined.");
			}
			startTimeout();
		} catch (error) {
			useToast(t.toast.verification_code_send_failed, "error", 5000);
			console.error("ERROR", "Failed to send verification code:", error);
		}
		isSendingEmail.value = false;
	}

	/**
	 * カウントダウンを開始します
	 */
	function startTimeout() {
		timeout.startTimeout();
	}
</script>

<template>
	<TextBox
		v-model="value"
		required
		icon="verified"
		:placeholder="t.verification_code"
		:pattern
		autoComplete="one-time-code"
	>
		<template #actions>
			<Button :disabled="!timeout.isTimeouted || props.disabled === true || isSendingEmail" @click="startTimeout(); sendVerificationCode();">
				{{ (timeout.isResent ? t.resend : t.send) + (timeout.isTimeouted ? "" : ` (${timeout.timeout})`) }}
			</Button>
		</template>
	</TextBox>
</template>

<style scoped lang="scss">
	@layer components {
		.text-box {
			--size: large;
		}
	}

	button {
		--appearance: secondary;
		font-variant-numeric: tabular-nums;
	}
</style>
