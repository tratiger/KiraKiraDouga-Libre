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
		// { name: "电话号码", icon: "phone", privacy: "private" },
	]);

	const enableCookie = computed({
		get: () => true,
		set: value => !value && useToast(t.toast.failed_to_disable_cookies, "error"),
	});

	const isApplyingVisibilitiesSetting = ref(false);
	const isReactVisibilitiesSetting = ref(false);
	const isFetchingVisibilitiesSetting = ref(false);
	const isPending = computed(() => isApplyingVisibilitiesSetting.value || isReactVisibilitiesSetting.value || isFetchingVisibilitiesSetting.value);

	const privaryVisibilities = ref<UserPrivaryVisibilitiesSettingDto[]>([]); // 用户隐私信息可视性数据。
	const linkedAccountVisibilities = ref<UserLinkedAccountsVisibilitiesSettingDto[]>([]); // 用户关联平台可视性数据。

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
		{ id: "platform.wechat", name: t.platform.wechat, logo: "wechat" }, // 微信
		{ id: "platform.bilibili", name: t.platform.bilibili, logo: "bilibili" },
		{ id: "platform.niconico", name: t.platform.niconico, logo: "niconico" },
		{ id: "platform.youtube", name: t.platform.youtube, logo: "youtube" },
		{ id: "platform.otomad_wiki", name: t.platform.otomad_wiki, logo: "otomadwiki" }, // 音 MAD 维基
		{ id: "platform.weibo", name: t.platform.weibo, logo: "weibo" }, // 新浪微博
		{ id: "platform.tieba", name: t.platform.tieba, logo: "tieba" }, // 百度贴吧
		{ id: "platform.cloudmusic", name: t.platform.cloudmusic, logo: "cloudmusic" }, // 网易云音乐
		{ id: "platform.discord", name: t.platform.discord, logo: "discord" },
		{ id: "platform.telegram", name: t.platform.telegram, logo: "telegram" },
		{ id: "platform.midishow", name: t.platform.midishow, logo: "midi" },
		{ id: "platform.linkedin", name: t.platform.linkedin, logo: "linkedin" }, // 领英（海外版）
		{ id: "platform.facebook", name: t.platform.facebook, logo: "facebook" },
		{ id: "platform.instagram", name: t.platform.instagram, logo: "instagram" },
		// TODO: 使用多语言
		{ id: "platform.douyin", name: "抖音", logo: "tiktok" }, // 抖音
		// TODO: 使用多语言
		{ id: "platform.tiktok", name: "TikTok", logo: "tiktok" }, // TikTok（抖音海外版）
		{ id: "platform.pixiv", name: t.platform.pixiv, logo: "pixiv" },
		{ id: "platform.github", name: t.platform.github, logo: "github" },
	];

	/**
	 * 获取某一项隐私的可见性设置。
	 * @param privaryId - 隐私项名称。
	 * @returns 用户对该隐私项的可见性设置。
	 */
	function getPrivaryVisibilitiesSetting(privaryId: string): PrivacyType {
		const filtedPrivaryVisibilities = privaryVisibilities.value.filter(privaryVisibilitie => privaryVisibilitie.privaryId === privaryId);
		if (filtedPrivaryVisibilities.length === 1)
			return filtedPrivaryVisibilities[0].visibilitiesType;
		else
			return "public";
	}

	/**
	 * 更新 privaryVisibilities 的方法。
	 * 如果新的设置在 privaryVisibilities 中存在，则更新对应项，如果不存在，则追加。
	 * @param visibilitieSetting - 新的隐私设置。
	 */
	function updatePrivaryVisibilities(visibilitieSetting: { id: string; visibilitiesType: PrivacyType }) {
		// 找到 privaryVisibilities 中与传入的 visibilitieSetting 的 privaryId 相同的项
		const index = privaryVisibilities.value.findIndex(item => item.privaryId === visibilitieSetting.id);

		if (index !== -1) // 如果存在，更新对应项
			privaryVisibilities.value[index] = { ...visibilitieSetting, privaryId: visibilitieSetting.id };
		else // 如果不存在，追加新项
			privaryVisibilities.value.push({ ...visibilitieSetting, privaryId: visibilitieSetting.id });
	}

	/**
	 * 获取某一平台关联账号的可见性设置。
	 * @param platformId - 隐私项名称。
	 * @returns 用户对该平台关联账号的可见性设置。
	 */
	function getLinkedAccountVisibilitiesSetting(platformId: string): PrivacyType {
		const filtedLinkedAccountVisibilities = linkedAccountVisibilities.value.filter(linkedAccountVisibilitie => linkedAccountVisibilitie.platformId === platformId);
		if (filtedLinkedAccountVisibilities.length === 1)
			return filtedLinkedAccountVisibilities[0].visibilitiesType;
		else
			return "public";
	}

	/**
	 * 更新 linkedAccountVisibilities 的方法。
	 * 如果新的设置在 linkedAccountVisibilities 中存在，则更新对应项，如果不存在，则追加。
	 * @param linkedAccountVisibilities - 新的隐私设置。
	 */
	function updateLinkedAccountVisibilities(visibilitieSetting: { id: string; visibilitiesType: PrivacyType }) {
		// 找到 linkedAccountVisibilities 中与传入的 visibilitieSetting 的 platformId 相同的项
		const index = linkedAccountVisibilities.value.findIndex(item => item.platformId === visibilitieSetting.id);

		if (index !== -1) // 如果存在，更新对应项
			linkedAccountVisibilities.value[index] = { ...visibilitieSetting, platformId: visibilitieSetting.id };
		else // 如果不存在，追加新项
			linkedAccountVisibilities.value.push({ ...visibilitieSetting, platformId: visibilitieSetting.id });
	}

	/**
	 * 快速设置个人信息隐私列的可见性。
	 * @param privacy - 隐私可见性。
	 */
	function setColonPrivacyVisibility(privacy: PrivacyType) {
		privaryVisibilities.value = PRIVARY_VISIBILITIES_SETTING_ITEMS.map(item => { return { privaryId: item.id, visibilitiesType: privacy }; });
	}

	/**
	 * 快速设置关联账号隐私列的可见性。
	 * @param privacy - 隐私可见性。
	 */
	function setColonLinkedAccountVisibility(privacy: PrivacyType) {
		linkedAccountVisibilities.value = LINKED_ACCOUNT_VISIBILITIES_SETTING_ITEMS.map(item => { return { platformId: item.id, visibilitiesType: privacy }; });
	}

	/**
	 * 快速重置所有隐私项设置
	 * 重置为保存前的状态
	 */
	async function resetColonVisibility() {
		isReactVisibilitiesSetting.value = true;
		await getVisibilitiesSettings();
		isReactVisibilitiesSetting.value = false;
	}

	/**
	 * 应用用户当前隐私可见性设置。
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
				useToast("应用成功", "success");
			else
				useToast("应用用户隐私设置失败，请刷新页面后重试", "error", 5000);
		} catch (error) {
			useToast("应用用户隐私设置时出错", "error", 5000);
			console.error("ERROR", "更新用户隐私设置时出错：", error);
		}
		isApplyingVisibilitiesSetting.value = false;
	}

	/**
	 * 获取用户的隐私可见性设置
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
			useToast("获取用户设置时出错，请刷新页面", "error", 5000);
			console.error("ERROR", "获取用户设置时出错出错：", error);
		}
		isFetchingVisibilitiesSetting.value = false;
	}

	await getVisibilitiesSettings();
</script>

<template>
	<div>
		<InfoBar type="warning" :title="t.severity.warning">
			<!-- TODO: 改为：尽管你可以保存关联平台可见性设置，但该功能正在开发中，无法按预期工作。 -->
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

		<!-- DELETE: 即将取消关联平台设定，改为与 GitHub 类似的链接。 -->
		<!-- <div class="privacy-header">
			<Subheader icon="visibility">关联平台可见性</Subheader>
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
