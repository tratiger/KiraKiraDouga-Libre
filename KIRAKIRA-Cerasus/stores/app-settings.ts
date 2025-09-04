export const useAppSettingsStore = defineStore("app-settings", {
	state: () => ({
		lastSettingPage: "appearance",
		exitSettingRoute: "/",

		isOpenVideoInNewTab: false, // 動画を新しいタブで開くかどうか
		akkarinGuestAvatar: false,
		relativeDate: false,

		backgroundImage: {
			imageIndex: -1,
			opacity: 0.2,
			tint: 0.75,
			blur: 0,
		},

		player: {
			autoplay: false,
			audio: {
				volume: 1,
				muted: false,
			},
			rate: {
				preservesPitch: false,
				continuousControl: false,
			},
			danmaku: {
				opacity: 1,
				fontSizeScale: 1,
			},
			controller: {
				showStop: false,
				showReplay: false,
				showFrameByFrame: false,
				autoResumePlayAfterSeeking: false,
			},
			quality: {
				auto: true,
				preferred: 0,
			},
		},

		authenticatorType: "none", // 2FAのタイプ
	}),
	getters: {
		getExitSettingRoute: state => {
			let route = state.exitSettingRoute;
			if (!route.startsWith("/")) route = "/" + route;
			return route;
		},
	},
	persist: {
		storage: piniaPluginPersistedstate.localStorage(),
	},
});
