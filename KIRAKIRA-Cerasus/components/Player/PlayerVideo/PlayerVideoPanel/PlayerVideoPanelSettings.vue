<script setup lang="ts">
	const props = defineProps<{
		/** 動画は再生中ですか？ */
		playing?: boolean;
		/** 動画のカバー画像アドレス。 */
		thumbnail: string;
		/** 動画プレーヤー設定。 */
		settings: PlayerVideoSettings;
	}>();

	type Filters = keyof PlayerVideoSettings["filter"] | "rotation90" | "rotation180" | "rotation270";

	/* TODO: 多言語対応。 */
	const filters: Record<Exclude<Filters, "rotation">, [string, CSSProperties]> = {
		horizontalFlip: ["水平反転", { scale: "-1 1" }],
		verticalFlip: ["垂直反転", { scale: "1 -1" }],
		rotation90: ["90°回転", { rotate: "90deg" }],
		rotation180: ["180°回転", { rotate: "180deg" }],
		rotation270: ["270°回転", { rotate: "270deg" }],
		grayscale: ["白黒", { filter: "grayscale(1)" }],
		invert: ["色反転", { filter: "invert(1)" }],
		sepia: ["セピア", { filter: "sepia(1)" }],
		hue: ["色相調整", { filter: "hue-rotate(180deg)" }],
		saturate: ["彩度調整", { filter: "saturate(5)" }],
		contrast: ["コントラスト調整", { filter: "contrast(5)" }],
		brightness: ["明るさ調整", { filter: "brightness(2)" }],
	};

	const filterBooleanProxy = new Proxy(props.settings.filter, {
		get(target, prop: Filters) {
			const propOriginal = (prop.startsWith("rotation") ? "rotation" : prop) as keyof PlayerVideoSettings["filter"];
			const value = target[propOriginal];
			return ({
				rotation90: value === 90,
				rotation180: value === 180,
				rotation270: value === 270,
				hue: value as number % 360 !== 0,
				saturate: value !== 1,
				contrast: value !== 1,
				brightness: value !== 1,
			} as Record<Filters, boolean>)[prop] ?? value as boolean;
		},
		set(target, prop: Filters, newValue: boolean) {
			if (prop.startsWith("rotation")) {
				if (!newValue) target.rotation = 0;
				else {
					const rotation = +prop.match(/\d+$/)![0];
					target.rotation = rotation as never;
				}
				return true;
			}
			/* eslint-disable @stylistic/indent */
			prop === "hue" ? target.hue = newValue ? 180 : 0 :
			prop === "saturate" ? target.saturate = newValue ? 5 : 1 :
			prop === "contrast" ? target.contrast = newValue ? 5 : 1 :
			prop === "brightness" ? target.brightness = newValue ? 2 : 1 :
			target[prop as never] = newValue as never;
			/* eslint-enable @stylistic/indent */
			return true;
		},
	}) as unknown as Record<Filters, boolean>;

	const selectedSettingsTab = defineModel<string>("selectedSettingsTab", { default: "player" });
	const blockWordsToggle = ref(false);
	const blockWordsSelectedTab = ref("block-keywords");
	const transitionName = defineModel<string>("transitionName", { default: "page-jump-in" });
</script>

<template>
	<div class="wrapper">
		<Comp>
			<ScrollContainer overflowX="clip">
				<Transition :name="transitionName" mode="out-in">
					<div v-if="selectedSettingsTab === 'player' " class="page-player">
						<!-- TODO: 何を自動再生するかを詳しく説明する必要があります。パート、コレクションの次のエピソード、または関連動画？ -->
						<ToggleSwitch v-model="settings.autoplay" v-ripple icon="autoplay">{{ t.player.autoplay }}</ToggleSwitch>
						<p class="subheading">{{ t.danmaku }}</p>
						<!-- TODO: 多言語対応。フォントサイズのスケーリング機能の可用性を確認し、スケーリング値を表示します。 -->
						<SettingsSlider
							v-model="settings.danmaku.fontSizeScale"
							:min="0"
							:max="2"
							:defaultValue="1"
							icon="font_size"
						>フォントサイズのスケーリング</SettingsSlider>
						<SettingsSlider
							v-model="settings.danmaku.opacity"
							:min="0"
							:max="1"
							:defaultValue="1"
							icon="opacity"
						>{{ t.opacity }}</SettingsSlider>
						<p class="subheading">{{ t.player.control_bar }}</p>
						<ToggleSwitch v-model="settings.controller.showStop" v-ripple icon="stop">
							{{ !settings.controller.showFrameByFrame ? t.player.control_bar.stop : t.player.control_bar.first_last_frame }}
							<template #details>{{ !settings.controller.showFrameByFrame ? t.player.control_bar.stop_description : t.player.control_bar.first_last_frame_description }}</template>
						</ToggleSwitch>
						<ToggleSwitch v-model="settings.controller.showReplay" v-ripple icon="replay">
							{{ t.player.control_bar.replay }}
							<template #details>{{ t.player.control_bar.replay_description }}</template>
						</ToggleSwitch>
						<ToggleSwitch v-model="settings.controller.showFrameByFrame" v-ripple icon="slow_forward">
							{{ t.player.control_bar.frame_by_frame }}
							<template #details>{{ t.player.control_bar.frame_by_frame_description }}</template>
						</ToggleSwitch>
						<ToggleSwitch v-model="settings.controller.autoResumePlayAfterSeeking" v-ripple icon="play">
							{{ t.player.control_bar.auto_resume_play_after_seeking }}
						</ToggleSwitch>
					</div>

					<div v-else-if="selectedSettingsTab === 'filters'">
						<div class="grid">
							<CheckCard v-for="([filter, style], key) in filters" :key="key" v-model="filterBooleanProxy[key]">
								{{ filter }}
								<template #image>
									<NuxtImg
										:style
										:src="thumbnail"
										:alt="`preview-${filter}`"
										:draggable="false"
										format="avif"
										width="200"
										height="200"
										:placeholder="[20, 20, 100, 2]"
									/>
								</template>
							</CheckCard>
						</div>
					</div>

					<div v-else-if="selectedSettingsTab === 'block-words'">
						<!-- TODO: 多言語対応 -->
						<ToggleSwitch v-model="blockWordsToggle" v-ripple icon="visibility_off">ブロックを有効にする</ToggleSwitch>

						<TabBar v-model="blockWordsSelectedTab">
							<TabItem id="block-keywords">ブロックテキスト</TabItem>
							<TabItem id="block-regex">ブロック正規表現</TabItem>
							<TabItem id="block-users">ブロックユーザー</TabItem>
						</TabBar>
					</div>
				</Transition>
			</ScrollContainer>
		</Comp>
		<ShadingIcon icon="settings" position="right bottom" rotating :elastic="playing" large />
	</div>
</template>

<style scoped lang="scss">
	$padding: 16px;
	$icon-size: 24px;
	$gap: 16px;

	:comp {
		position: relative;
		z-index: 11;
		flex-grow: 1;
		height: 100%;
		contain: strict;

		> .scroll-container {
			height: 100%;

			&:deep(.scroller) {
				overscroll-behavior: contain;
			}
		}
	}

	.wrapper {
		@include square(100%);
		position: relative;
	}

	.tab-bar {
		--full: true;
	}

	.shading-icon {
		position: absolute;
	}

	p.subheading {
		display: flex;
		align-items: center;
		height: 36px;
		padding-left: $padding + $icon-size + $gap;
		color: c(accent);
		font-weight: 600;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		padding: 16px;

		.check-card {
			--width: 100%;
			--height: unset;
			--aspect-ratio: 1 / 1;
			--float-offset: 6px;
		}
	}

	.toggle-switch {
		padding-block: 12px;
		padding-inline: $padding;

		&:deep(.icon) {
			margin-right: $gap;
			font-size: $icon-size;
		}

		p.subheading + & {
			margin-block-start: 0;
		}
	}
</style>
