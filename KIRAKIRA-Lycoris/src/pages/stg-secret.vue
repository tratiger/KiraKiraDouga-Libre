<script setup lang="ts">
	const message = useMessage();
	type SecretType = "hidden" | "dotenv" | "windows" | "bash";
	const secretType = ref<SecretType>("hidden");
	const getShownText = (shown: boolean) => shown ? "表示" : "非表示";

	type StgEnvBackEndSecret = GetStgEnvBackEndSecretResponse["result"];
	const stgEnvBackEndSecretData = ref<StgEnvBackEndSecret["envs"]>(); // 環境変数データ（オブジェクト形式）
	const computedDotenvStgEnvBackEndSecretData = computed(() => { // 環境変数データ（.env 文字列形式）
		return Object.entries(stgEnvBackEndSecretData.value ?? {})
			.map(([key, value]) => `${key}="${value}"`)
			.join("\n");
	});
	const computedWindwowsStgEnvBackEndSecretData = computed(() => { // 環境変数データ（Windows Powershell 文字列形式）
		return Object.entries(stgEnvBackEndSecretData.value ?? {})
			.map(([key, value]) => `$env:${key}="${value}"`)
			.join("\n") + "\n\nclear";
	});
	const computedBashStgEnvBackEndSecretData = computed(() => { // 環境変数データ（Bash 文字列形式）
		return Object.entries(stgEnvBackEndSecretData.value ?? {})
			.map(([key, value]) => `export ${key}="${value}"`)
			.join("\n") + "\n\nclear";
	});

	/**
	 * 環境変数のシークレットをクリップボードにコピーします。
	 */
	function copySecret() {
		if (secretType.value === "hidden")
			return;
		else if (secretType.value === "dotenv")
			navigator.clipboard.writeText(computedDotenvStgEnvBackEndSecretData.value).then(() => {
				message.info("シークレットをコピーしました");
			});
		else if (secretType.value === "windows")
			navigator.clipboard.writeText(computedWindwowsStgEnvBackEndSecretData.value).then(() => {
				message.info("シークレットをコピーしました");
			});
		else if (secretType.value === "bash")
			navigator.clipboard.writeText(computedBashStgEnvBackEndSecretData.value).then(() => {
				message.info("シークレットをコピーしました");
			});
	}

	/**
	 * ステージング環境のバックエンド環境変数シークレットを取得します。
	 */
	async function getStgEnvBackEndSecret() {
		const stgEnvBackEndSecretResult = await getStgEnvBackEndSecretController();
		if (stgEnvBackEndSecretResult.success)
			stgEnvBackEndSecretData.value = stgEnvBackEndSecretResult.result.envs;
	}

	onMounted(getStgEnvBackEndSecret);
</script>

<template>
	<div class="container">
		<PageHeading>KIRAKIRA ステージング環境 環境変数</PageHeading>
		<NFlex size="small">
			<NTag type="error">シークレットは厳重に管理してください</NTag>
			<NTag>まず使用説明書をお読みください</NTag>
		</NFlex>
		<NCollapse class="mlb-4">
			<NCollapseItem title="使用方法">
				<NP>下のボタンをクリックすると、KIRAKIRAステージング環境の環境変数が表示されます。</NP>
				<NP>
					これらの環境変数には、バックエンドプログラムのポート、Cloudflareのシークレット、データベースのシークレット、検索エンジンのシークレット、メールサービスのシークレット、および以下のシークレットを取得するために使用するシークレットが含まれています。<br />
					<b>シークレットの公開や不正利用は、重大なプライバシー漏洩事故につながり、法律に違反する可能性があります！</b>
				</NP>
				<NP>ベストプラクティス：必要な時にのみ取得し、これらのシークレットをローカルに保存しないでください。プログラム起動前に一度だけコピー＆ペーストし、その後クリップボードをクリアしてください。</NP>
				<NP>一部のLinuxディストリビューションのセキュリティ格言を引用させていただきます：</NP>
				<NBlockquote>
					<NP>We trust you have received the usual lecture from the local System Administrator. It usually boils down to these three things:</NP>
					<NOl class="paren-after">
						<NLi>Respect the privacy of others.</NLi>
						<NLi>Think before you type.</NLi>
						<NLi>With great power comes great responsibility.</NLi>
					</NOl>
				</NBlockquote>
				<NBlockquote>
					<NP>私たちは、あなたがシステム管理者から日常の注意事項について、いつものように説明を受けたと信じています。それは通常、次の3つのことに要約されます：</NP>
					<NOl class="paren-after">
						<NLi>他人のプライバシーを尊重すること。</NLi>
						<NLi>タイプする前によく考えること（結果とリスク）。</NLi>
						<NLi>大きな力には大きな責任が伴うこと。</NLi>
					</NOl>
				</NBlockquote>
			</NCollapseItem>
		</NCollapse>
		<NFlex class="mbe-4 justify-between">
			<NFlex>
				<NButton :secondary="secretType !== 'dotenv'" strong type="warning" @click="secretType = secretType !== 'dotenv' ? 'dotenv' : 'hidden'">{{ getShownText(secretType !== "dotenv") }} .env 形式の環境変数</NButton>
				<NButton :secondary="secretType !== 'windows'" strong type="warning" @click="secretType = secretType !== 'windows' ? 'windows' : 'hidden'">{{ getShownText(secretType !== "windows") }} Windows PowerShell 形式の環境変数</NButton>
				<NButton :secondary="secretType !== 'bash'" strong type="warning" @click="secretType = secretType !== 'bash' ? 'bash' : 'hidden'">{{ getShownText(secretType !== "bash") }} Bash (macOS / Linux) 形式の環境変数</NButton>
			</NFlex>
			<NFlex>
				<NButton :disabled="secretType === 'hidden'" strong secondary @click="copySecret">
					<template #icon>
						<Icon name="contentCopy" />
					</template>
					コピー
				</NButton>
			</NFlex>
		</NFlex>

		<NCollapseTransition :show="secretType !== 'hidden'">
			<NCode v-if="secretType === 'dotenv'" :code="computedDotenvStgEnvBackEndSecretData" showLineNumbers language="bash" />
			<NCode v-else-if="secretType === 'windows'" :code="computedWindwowsStgEnvBackEndSecretData" showLineNumbers language="powershell" />
			<NCode v-else-if="secretType === 'bash'" :code="computedBashStgEnvBackEndSecretData" showLineNumbers language="bash" />
		</NCollapseTransition>
	</div>
</template>
