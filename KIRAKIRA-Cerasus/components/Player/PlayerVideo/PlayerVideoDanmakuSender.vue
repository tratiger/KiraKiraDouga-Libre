<script lang="ts">
	const fontSizes = {
		small: 14,
		medium: 20,
		large: 28,
	};

	/**
	 * 基本的な弾幕発射スタイル。
	 */
	export const basicDanmakuCommentStyle = {
		fontWeight: "bold",
		textShadow: "1px 0 1px black, 0 1px 1px black, 0 -1px 1px black, -1px 0 1px black",
	};

	/**
	 * 発射可能な弾幕コンテンツを作成します。
	 * @param text - 弾幕の内容。
	 * @param time - 弾幕の出現時間。
	 * @param format - 弾幕のフォーマット。
	 * @returns 発射可能な弾幕コンテンツ。
	 */
	export function createDanmakuComment(text: string, time: number | undefined, format: DanmakuFormat): DanmakuComment {
		return {
			text,
			time,
			mode: format.mode,
			render() {
				const div = document.createElement("div");
				div.textContent = text;
				div.classList.add("dm");
				if (format.enableRainbow) div.classList.add("dm-rainbow");
				Object.assign(div.style, {
					...basicDanmakuCommentStyle,
					fontSize: `${fontSizes[format.fontSize]}px`,
					color: format.color ? format.color.hashHex : undefined,
					border: "1px solid #337ab7", // ユーザーが**発射**したばかりの弾幕には青い枠が表示されます
				});
				return div;
			},
		};
	}
</script>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** 現在の動画時間。 */
		currentTime: number;
		/** 動画ID。 */
		videoId: number;
		/** 弾幕を入力できますか（ユーザーがブロックされている場合などは入力できません） */
		editable?: boolean;
	}>(), {
		editable: true,
	});

	const sendDanmaku = defineModel<DanmakuComment[]>();

	const content = ref("");
	const flyoutKaomoji = ref<FlyoutModel>();
	const flyoutFormat = ref<FlyoutModel>();
	const textBox = ref<InstanceType<typeof TextBox>>();
	const OFFSET_Y = -5.4;
	const format = reactive({
		fontSize: "medium",
		color: Color.fromHex("#FFFFFF"),
		mode: "rtl",
		enableRainbow: false,
	}) as DanmakuFormat;

	/**
	 * 顔文字を挿入します。
	 * @param kaomoji - 顔文字。
	 */
	function insertKaomoji(kaomoji?: string) {
		const { input } = textBox.value!;
		if (!input) return;
		insertTextToTextBox(input, kaomoji);
		content.value = input.value;
	}

	/**
	 * 弾幕送信イベント。
	 */
	function onSend() {
		if (!content.value) return;

		const text = content.value;

		const emitDanmakuRequestData: EmitDanmakuRequestDto = {
			videoId: props.videoId,
			time: props.currentTime || 0,
			text,
			color: format.color.hex,
			fontSize: format.fontSize,
			mode: format.mode,
			enableRainbow: format.enableRainbow,
		};

		try {
			api.danmaku.emitDanmaku(emitDanmakuRequestData).then(emitDanmakuResult => {
				if (!emitDanmakuResult.success) {
					useToast(t.toast.something_went_wrong, "error");
					console.error("ERROR", "Failed to send danmaku.");
				}
			});
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error");
			console.error("ERROR", "Failed to send danmaku. Request failed:", error);
		}

		sendDanmaku.value = [createDanmakuComment(text, undefined, format)];
		content.value = "";
	}
</script>

<template>
	<FlyoutKaomoji v-model="flyoutKaomoji" @insert="insertKaomoji" />
	<FlyoutDanmakuFormat v-model="flyoutFormat" v-model:format="format" />

	<Comp role="textbox">
		<!-- // TODO: 多言語対応 -->
		<TextBox ref="textBox" v-model="content" :placeholder="editable ? t.danmaku.send : 'あなたはこのユーザーにブロックされているため、弾幕を送信できません。'" :disabled="!editable">
			<template #actions>
				<SoftButton
					v-tooltip:bottom="t.kaomoji"
					icon="kaomoji"
					appearance="textbox-trailingicon"
					:active="!!flyoutKaomoji"
					:disabled="!editable"
					@click="e => flyoutKaomoji = [e, 'y', OFFSET_Y]"
				/>
				<SoftButton
					v-tooltip:bottom="t.format"
					icon="text_format"
					appearance="textbox-trailingicon"
					:active="!!flyoutFormat"
					:disabled="!editable"
					@click="e => flyoutFormat = [e.currentTarget, 'y', OFFSET_Y]"
				/>
				<SoftButton
					v-tooltip:bottom="t.send"
					:disabled="!content || !editable"
					icon="send"
					appearance="textbox-trailingicon"
					@click="onSend"
				/>
			</template>
		</TextBox>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		display: flex;
		flex-shrink: 0;
		width: 100%;
		height: 36px;

		.text-box {
			--square: true;
			width: 100%;
		}
	}
</style>
