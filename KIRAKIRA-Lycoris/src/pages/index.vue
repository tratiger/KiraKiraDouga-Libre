<script setup lang="ts">
	const selfUserInfoStore = useSelfUserInfoStore();

	const email = ref("");
	const password = ref("");
	const clientOtp = ref(""); // TOTP 認証コード

	/**
	 * ログイン
	 */
	async function requestLogin() {
		if (!email && !password) {
			console.error("メールアドレスとパスワードを入力してログインしてください");
			alert("メールアドレスとパスワードを入力してログインしてください");
		}

		const passwordHash = await generateHash(password.value);
		const userLoginRequest = {
			email: email.value,
			passwordHash,
			clientOtp: clientOtp.value,
		};

		const loginResult = await userLogin(userLoginRequest);
		if (loginResult.success && loginResult.UUID)
			location.reload(); // ログイン成功後、ページをリロード...
	}

	/**
	 * ログアウト
	 */
	async function logout() {
		await userLogout();
		location.reload(); // ページをリロードしてみる...
	}

	const emailRule: FormItemRule = {
		trigger: ["input", "blur-sm"],
		type: "email",
		validator() {
			if (!email.value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
				return new Error("無効なメールアドレスです");
		},
	};
</script>

<template>
	<div class="container">
		<div v-if="!selfUserInfoStore.isLogined">
			<NCard title="ログイン">
				<NForm>
					<NFormItem label="メールアドレス" :rule="emailRule">
						<NInput v-model:value="email" placeholder="メールアドレスを入力してください" type="text" />
					</NFormItem>
					<NFormItem label="パスワード">
						<NInput v-model:value="password" placeholder="パスワードを入力してください" type="password" />
					</NFormItem>
					<NP>
						管理者コンソールは現在、TOTP認証コードでのログインのみをサポートしています！<br />
						2FAを有効にしていない場合は入力不要です<br />
						メール認証をご利用の場合は、KIRAKIRAメインサイトでログインするか、認証方法をTOTPに変更してください。
					</NP>
					<NFormItem label="TOTP 認証コード">
						<NInput v-model:value="clientOtp" placeholder="TOTP認証コードを入力してください" />
					</NFormItem>
					<div>
						<NButton type="primary" round attrType="button" @click="requestLogin">ログイン</NButton>
					</div>
				</NForm>
			</NCard>
		</div>
		<div v-else>
			<NFlex vertical size="large">
				<NAlert type="success">ログイン済みです</NAlert>
				<NCard title="あなたのロール">
					<NFlex>
						<NTag v-for="role in selfUserInfoStore.roles" :key="role">{{ role }}</NTag>
					</NFlex>
				</NCard>
				<div>
					<NButton type="error" round attrType="button" @click="logout">ログアウト</NButton>
				</div>
			</NFlex>
		</div>
	</div>
</template>
