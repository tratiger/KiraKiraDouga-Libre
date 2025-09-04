<script setup lang="ts">
	const visibilities = reactive<{ name: string; icon?: string; logo?: string; privacy: PrivacyType }[]>([
		{ name: t.user.birthday, icon: "birthday", privacy: "public" },
		{ name: t.user.age, icon: "calendar", privacy: "public" },
		{ name: t.following, icon: "person_add", privacy: "public" },
		{ name: t(0).follower, icon: "person_heart", privacy: "public" },
		{ name: t(0).collection, icon: "star", privacy: "public" },
		{ name: t.platform.twitter, logo: "twitter", privacy: "public" },
		{ name: t.platform.qq, logo: "qq", privacy: "public" },
		{ name: t.platform.wechat, logo: "wechat", privacy: "public" },
		{ name: t.platform.bilibili, logo: "bilibili", privacy: "public" },
		{ name: t.platform.niconico, logo: "niconico", privacy: "public" },
		{ name: t.platform.youtube, logo: "youtube", privacy: "public" },
		{ name: t.platform.otomad_wiki, logo: "otomadwiki", privacy: "public" },
		{ name: t.platform.weibo, logo: "weibo", privacy: "public" },
		{ name: t.platform.tieba, logo: "tieba", privacy: "public" },
		{ name: t.platform.cloudmusic, logo: "cloudmusic", privacy: "public" },
		{ name: t.platform.discord, logo: "discord", privacy: "public" },
		{ name: t.platform.telegram, logo: "telegram", privacy: "public" },
		{ name: t.platform.midishow, logo: "midi", privacy: "public" },
		{ name: t.platform.linkedin, logo: "linkedin", privacy: "public" },
		{ name: t.platform.facebook, logo: "facebook", privacy: "public" },
		{ name: t.platform.instagram, logo: "instagram", privacy: "public" },
		{ name: t.platform.tiktok, logo: "tiktok", privacy: "public" },
		{ name: t.platform.pixiv, logo: "pixiv", privacy: "public" },
		{ name: t.platform.github, logo: "github", privacy: "public" },
		{ name: t.platform.bluesky, logo: "bluesky", privacy: "public" },
		{ name: t.platform.kwai, logo: "kwai", privacy: "public" },
		{ name: t.platform.rednote, logo: "rednote", privacy: "public" },
		// { name: "電話番号", icon: "phone", privacy: "private" },
	]);

	const enableCookie = computed({
		get: () => true,
		set: value => !value && useToast(t.toast.failed_to_disable_cookies, "error"),
	});

	const isApplyingVisibilitiesSetting = ref(false);
	const isReactVisibilitiesSetting = ref(false);
	const isFetchingVisibilitiesSetting = ref(false);
	const isPending = computed(() => isApplyingVisibilitiesSetting.value || isReactVisibilitiesSetting.value || isFetchingVisibilitiesSetting.value);

	const privaryVisibilities = ref<UserPrivaryVisibilitiesSettingDto[]>([]); // ユーザープライバシー情報可視性データ。
	const linkedAccountVisibilities = ref<UserLinkedAccountsVisibilitiesSettingDto[]>([]); // ユーザー連携プラットフォーム可視性データ。

	const PRIVARY_VISIBILITIES_SETTING_ITEMS = [
		{ id: "privary.birthday", name: t.user.birthday, icon: "birthday" },
		{ id: "privary.age", name: t.user.age, icon: "calendar" },
		{ id: "privary.follow", name: t.following, icon: "person_add" },
		{ id: "privary.fans", name: t(0).follower, icon: "person_heart" },
		{ id: "privary.favorites", name: t(0).collection, icon: "star" },
	];

	const LINKED_ACCOUNT_VISIBILITIES_SETTING_ITEMS = [
		{ id: "platform.twitter", name: t.platform.twitter, logo: "twitter" }, // Twitter → X
		{ id: "platform.qq", name: t.platform.qq, logo: "qq" },
		{ id: "platform.wechat", name: t.platform.wechat, logo: "wechat" }, // WeChat
		{ id: "platform.bilibili", name: t.platform.bilibili, logo: "bilibili" },
		{ id: "platform.niconico", name: t.platform.niconico, logo: "niconico" },
		{ id: "platform.youtube", name: t.platform.youtube, logo: "youtube" },
		{ id: "platform.otomad_wiki", name: t.platform.otomad_wiki, logo: "otomadwiki" }, // 音MADウィキ
		{ id: "platform.weibo", name: t.platform.weibo, logo: "weibo" }, // Sina Weibo
		{ id: "platform.tieba", name: t.platform.tieba, logo: "tieba" }, // Baidu Tieba
		{ id: "platform.cloudmusic", name: t.platform.cloudmusic, logo: "cloudmusic" }, // NetEase Cloud Music
		{ id: "platform.discord", name: t.platform.discord, logo: "discord" },
		{ id: "platform.telegram", name: t.platform.telegram, logo: "telegram" },
		{ id: "platform.midishow", name: t.platform.midishow, logo: "midi" },
		{ id: "platform.linkedin", name: t.platform.linkedin, logo: "linkedin" }, // LinkedIn (海外版)
		{ id: "platform.facebook", name: t.platform.facebook, logo: "facebook" },
		{ id: "platform.instagram", name: t.platform.instagram, logo: "instagram" },
		// TODO: 使用多语言
		{ id: "platform.douyin", name: "Douyin", logo: "tiktok" }, // Douyin
		// TODO: 使用多语言
		{ id: "platform.tiktok", name: "TikTok", logo: "tiktok" }, // TikTok (Douyin海外版)
		{ id: "platform.pixiv", name: t.platform.pixiv, logo: "pixiv" },
		{ id: "platform.github", name: t.platform.github, logo: "github" },
	];

	/**
	 * あるプライバシー項目の可視性設定を取得します。
	 * @param privaryId - プライバシー項目の名前。
	 * @returns そのプライバシー項目に対するユーザーの可視性設定。
	 */
	function getPrivaryVisibilitiesSetting(privaryId: string): PrivacyType {
		const filtedPrivaryVisibilities = privaryVisibilities.value.filter(privaryVisibilitie => privaryVisibilitie.privaryId === privaryId);
		if (filtedPrivaryVisibilities.length === 1)
			return filtedPrivaryVisibilities[0].visibilitiesType;
		else
			return "public";
	}

	/**
	 * privaryVisibilitiesを更新するメソッド。
	 * 新しい設定がprivaryVisibilitiesに存在する場合は対応する項目を更新し、存在しない場合は追加します。
	 * @param visibilitieSetting - 新しいプライバシー設定。
	 */
	function updatePrivaryVisibilities(visibilitieSetting: { id: string; visibilitiesType: PrivacyType }) {
		// 渡されたvisibilitieSettingのprivaryIdと同じprivaryIdを持つ項目をprivaryVisibilitiesの中から探します
		const index = privaryVisibilities.value.findIndex(item => item.privaryId === visibilitieSetting.id);

		if (index !== -1) // 存在する場合、対応する項目を更新します
			privaryVisibilities.value[index] = { ...visibilitieSetting, privaryId: visibilitieSetting.id };
		else // 存在しない場合、新しい項目を追加します
			privaryVisibilities.value.push({ ...visibilitieSetting, privaryId: visibilitieSetting.id });
	}

	/**
	 * ある連携プラットフォームアカウントの可視性設定を取得します。
	 * @param platformId - プライバシー項目の名前。
	 * @returns そのプラットフォーム連携アカウントに対するユーザーの可視性設定。
	 */
	function getLinkedAccountVisibilitiesSetting(platformId: string): PrivacyType {
		const filtedLinkedAccountVisibilities = linkedAccountVisibilities.value.filter(linkedAccountVisibilitie => linkedAccountVisibilitie.platformId === platformId);
		if (filtedLinkedAccountVisibilities.length === 1)
			return filtedLinkedAccountVisibilities[0].visibilitiesType;
		else
			return "public";
	}

	/**
	 * linkedAccountVisibilitiesを更新するメソッド。
	 * 新しい設定がlinkedAccountVisibilitiesに存在する場合は対応する項目を更新し、存在しない場合は追加します。
	 * @param linkedAccountVisibilities - 新しいプライバシー設定。
	 */
	function updateLinkedAccountVisibilities(visibilitieSetting: { id: string; visibilitiesType: PrivacyType }) {
		// 渡されたvisibilitieSettingのplatformIdと同じplatformIdを持つ項目をlinkedAccountVisibilitiesの中から探します
		const index = linkedAccountVisibilities.value.findIndex(item => item.platformId === visibilitieSetting.id);

		if (index !== -1) // 存在する場合、対応する項目を更新します
			linkedAccountVisibilities.value[index] = { ...visibilitieSetting, platformId: visibilitieSetting.id };
		else // 存在しない場合、新しい項目を追加します
			linkedAccountVisibilities.value.push({ ...visibilitieSetting, platformId: visibilitieSetting.id });
	}

	/**
	 * 個人情報プライバシー列の可視性を一括設定します。
	 * @param privacy - プライバシーの可視性。
	 */
	function setColonPrivacyVisibility(privacy: PrivacyType) {
		privaryVisibilities.value = PRIVARY_VISIBILITIES_SETTING_ITEMS.map(item => { return { privaryId: item.id, visibilitiesType: privacy }; });
	}

	/**
	 * 連携アカウントプライバシー列の可視性を一括設定します。
	 * @param privacy - プライバシーの可視性。
	 */
	function setColonLinkedAccountVisibility(privacy: PrivacyType) {
		linkedAccountVisibilities.value = LINKED_ACCOUNT_VISIBILITIES_SETTING_ITEMS.map(item => { return { platformId: item.id, visibilitiesType: privacy }; });
	}

	/**
	 * すべてのプライバシー項目設定をリセットします
	 * 保存前の状態にリセットします
	 */
	async function resetColonVisibility() {
		isReactVisibilitiesSetting.value = true;
		await getVisibilitiesSettings();
		isReactVisibilitiesSetting.value = false;
	}

	/**
	 * 現在のユーザープライバシー可視性設定を適用します。
	 */
	async function applyVisibilitiesSetting() {
		isApplyingVisibilitiesSetting.value = true;
		try {
			const updateOrCreateUserSettingsRequest: UpdateOrCreateUserSettingsRequestDto = {
				userPrivaryVisibilitiesSetting: privaryVisibilities.value,
				userLinkedAccountsVisibilitiesSetting: linkedAccountVisibilities.value,
			};
			const updateUserSettingsResult = await api.user.updateUserSettings(updateOrCreateUserSettingsRequest);
			if (updateUserSettingsResult.success)
				useToast("適用成功", "success");
			else
				useToast("ユーザープライバシー設定の適用に失敗しました。ページを更新して再試行してください", "error", 5000);
		} catch (error) {
			useToast("ユーザープライバシー設定の適用中にエラーが発生しました", "error", 5000);
			console.error("ERROR", "ユーザープライバシー設定の更新中にエラーが発生しました：", error);
		}
		isApplyingVisibilitiesSetting.value = false;
	}

	/**
	 * ユーザーのプライバシー可視性設定を取得します
	 */
	async function getVisibilitiesSettings() {
		isFetchingVisibilitiesSetting.value = true;
		try {
			const headerCookie = useRequestHeaders(["cookie"]);
			const userSettings = await api.user.getUserSettings({ headerCookie });
			if (userSettings.success) {
				privaryVisibilities.value = userSettings.userSettings?.userPrivaryVisibilitiesSetting ?? [];
				linkedAccountVisibilities.value = userSettings.userSettings?.userLinkedAccountsVisibilitiesSetting ?? [];
			}
		} catch (error) {
			useToast("ユーザー設定の取得中にエラーが発生しました。ページを更新してください", "error", 5000);
			console.error("ERROR", "ユーザー設定の取得中にエラーが発生しました：", error);
		}
		isFetchingVisibilitiesSetting.value = false;
	}

	await getVisibilitiesSettings();
</script>

<template>
	<div>
		<InfoBar type="warning" :title="t.severity.warning">
			<!-- TODO: 「連携プラットフォームの可視性設定は保存できますが、この機能は開発中であり、期待通りに動作しません。」に変更 -->
			{{ t.under_construction.page }}
		</InfoBar>

		<Subheader icon="cookie">{{ t.privacy.cookie }}</Subheader>
		<section list>
			<ToggleSwitch v-model="enableCookie" v-ripple icon="cookie">{{ t.privacy.allow_cookies }}</ToggleSwitch>
		</section>

		<div class="privacy-header">
			<Subheader icon="visibility">{{ t.privacy.info_visibility }}</Subheader>
			<div class="options">
				<SoftButton v-tooltip:top="t.privacy.public" icon="visibility" @click="setColonPrivacyVisibility('public')" />
				<SoftButton v-tooltip:top="t.privacy.following" icon="person_add" @click="setColonPrivacyVisibility('following')" />
				<SoftButton v-tooltip:top="t.privacy.private" icon="visibility_off" @click="setColonPrivacyVisibility('private')" />
			</div>
		</div>
		<section list>
			<SettingsPrivacyItem
				v-for="item in PRIVARY_VISIBILITIES_SETTING_ITEMS"
				:key="item.name"
				:modelValue="{ id: item.id, visibilitiesType: getPrivaryVisibilitiesSetting(item.id) }"
				@update:modelValue="$event => updatePrivaryVisibilities($event)"
				:icon="item.icon || 'placeholder'"
			>{{ item.name }}</SettingsPrivacyItem>
		</section>

		<!-- DELETE: 連携プラットフォームの設定は間もなく廃止され、GitHubのようなリンク形式に変更されます。 -->
		<!-- <div class="privacy-header">
			<Subheader icon="visibility">連携プラットフォームの可視性</Subheader>
			<div class="options">
				<SoftButton v-tooltip:top="t.privacy.public" icon="visibility" @click="setColonLinkedAccountVisibility('public')" />
				<SoftButton v-tooltip:top="t.privacy.following" icon="person_add" @click="setColonLinkedAccountVisibility('following')" />
				<SoftButton v-tooltip:top="t.privacy.private" icon="visibility_off" @click="setColonLinkedAccountVisibility('private')" />
			</div>
		</div>

		<section list>
			<SettingsPrivacyItem
				v-for="item in LINKED_ACCOUNT_VISIBILITIES_SETTING_ITEMS"
				:key="item.name"
				:modelValue="{ id: item.id, visibilitiesType: getLinkedAccountVisibilitiesSetting(item.id) }"
				@update:modelValue="$event => updateLinkedAccountVisibilities($event)"
				:icon="'mono-logo/' + item.logo"
			>{{ item.name }}</SettingsPrivacyItem>
		</section> -->

		<div class="submit">
			<Button icon="reset" :disabled="isPending" :loading="isReactVisibilitiesSetting" class="secondary" @click="resetColonVisibility()">{{ t.step.reset }}</Button>
			<Button icon="check" :disabled="isPending" :loading="isApplyingVisibilitiesSetting" @click="applyVisibilitiesSetting">{{ t.step.apply }}</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.privacy-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: -8px;

		.soft-button {
			--ripple-size: 50px;
		}
	}

	.options {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-right: 10px;
	}
</style>
