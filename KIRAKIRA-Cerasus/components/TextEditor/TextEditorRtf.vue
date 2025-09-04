<script setup lang="tsx">
	import { useEditor, EditorContent } from "@tiptap/vue-3";
	import StarterKit from "@tiptap/starter-kit";
	import { Underline } from "@tiptap/extension-underline";
	import VueComponent from "helpers/editor-extension";
	import { SoftButton } from "#components";

	const props = defineProps<{
		/** 動画ID。 */
		videoId: number;
		/** 編集可能かどうか */
		editable: boolean;
	}>();

	const emits = defineEmits<{
		input: [e: InputEvent];
		keydown: [e: KeyboardEvent];
		keyup: [e: KeyboardEvent];
	}>();

	type ActiveType = string | boolean;
	const rtfEditor = refComp();
	const flyoutKaomoji = ref<FlyoutModel>();
	const flyoutKaomojiMini = ref<FlyoutModel>();
	const textLength = ref(0);
	const isSendingComment = ref(false);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			VueComponent.ThumbVideo,
			VueComponent.CursorShadow,
		],
		content: !props.editable ? 'あなたはこのユーザーによってブロックされているため、コメントを送信できません。' : undefined, // TODO: 多言語対応
		/* content: `
			<p>私はVue.jsでTiptapを実行しています。🎉</p>
			<p>見えますか？これはVueコンポーネントです。私たちは本当に未来に生きています。</p>
		`, */
		autofocus: false,
		editable: props.editable,
		injectCSS: false,
		onUpdate(props) {
			textLength.value = props.editor.getText().length;
		},
		onCreate({ editor }) {
			const proseMirror = editor.view.dom;
			addEventListeners(proseMirror, "keydown", "keyup", e => stopPropagationExceptKey(e, "F11", "Ctrl + KeyM"));
			proseMirror.addEventListener("input", e => emits("input", e as InputEvent)); // e 的类型默认为 Event 而并非 InputEvent 是预期行为，参见：https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1174
			proseMirror.addEventListener("keydown", e => emits("keydown", e));
			proseMirror.addEventListener("keyup", e => emits("keyup", e));
		},
	});

	/** テキストを太字に切り替えます。 */
	const toggleBold = () => { editor.value?.chain().focus().toggleBold().run(); };
	/** テキストを斜体に切り替えます。 */
	const toggleItalic = () => { editor.value?.chain().focus().toggleItalic().run(); };
	/** テキストに下線を引きます。 */
	const toggleUnderline = () => { editor.value?.chain().focus().toggleUnderline().run(); };
	// なぜかStarterKitにtoggleUnderlineが提供されていないので、@tiptap/extension-underlineを別途インストールするしかありません。
	/** テキストに取り消し線を引きます。 */
	const toggleStrike = () => { editor.value?.chain().focus().toggleStrike().run(); };

	/** リッチテキストエディタのカーソル位置にVueコンポーネントを追加します。 */
	const addVueComponents = () => { editor.value?.commands.insertContent("<thumb-video></thumb-video>"); };
	/** カーソル位置でミニ顔文字入力パネルを開きます。 */
	const showRecentKaomojis = () => { flyoutKaomojiMini.value = [getCursorPixel(), "y"]; };
	/** メンションパネルを開きます。 */
	const showAtList = () => { };

	/**
	 * 顔文字を挿入します。
	 * @param kaomoji - 顔文字。
	 */
	function insertKaomoji(kaomoji?: string) {
		editor.value?.commands.focus();
		kaomoji && editor.value?.commands.insertContent(kaomoji);
	}

	/**
	 * テキストカーソルの位置を取得します。
	 * @returns テキストカーソルの位置。
	 */
	function getCursorPixel() {
		if (!editor.value) return;
		const id = "cursor-" + crypto.randomUUID();
		const selection = editor.value.state.selection;
		editor.value.commands.insertContentAt(selection.$anchor.pos, `<cursor id="${id}">1</cursor>`);
		const shadow = rtfEditor.value?.querySelector(`[data-id="${id}"]`);
		const rect = shadow?.getBoundingClientRect();
		editor.value.commands.setTextSelection({ from: selection.from, to: selection.to + 1 });
		kill(shadow);
		return rect;
	}

	/**
	 * sends comment to the backend.
	 */
	async function sendComment() {
		try {
			isSendingComment.value = true;
			// TODO: // WARN ユーザーが入力した文字をBase64でエンコードする必要があります
			const content = editor.value?.getText() ?? ""; // Get plain text currently to avoid web attack.
			const emitVideoCommentRequest: EmitVideoCommentRequestDto = {
				videoId: props.videoId,
				text: content,
			};
			// TODO: 非同期でコメントを送信したいのですが、フロア番号はコメントが正常にバックエンドに送信された後にのみ取得できます。うーん...
			const emitVideoCommentResult = await api.videoComment.emitVideoComment(emitVideoCommentRequest);
			const videoComment = emitVideoCommentResult.videoComment;
			if (emitVideoCommentResult?.success && videoComment) {
				editor.value?.commands.clearContent()
				textLength.value = 0
				useEvent("videoComment:emitVideoComment", videoComment);
				useToast(t.toast.comment_sent, "success", 5000);
			} else {
				useToast(t.toast.something_went_wrong, "error", 5000);
				console.error("ERROR", "Failed to send comment: request failed.");
			}
			isSendingComment.value = false;
		} catch (error) {
			useToast(t.toast.something_went_wrong, "error", 5000);
			console.error("ERROR", "Failed to send comment:", error);
			isSendingComment.value = false;
		}
	}

	/**
	 * アクティブ状態ですか？
	 * @param active - 検証するオプション。文字列の場合はエディタで対応するフォーマットを探し、ブール値の場合はそのまま返します。
	 * @returns アクティブ状態。
	 */
	function isActive(active?: ActiveType) {
		return typeof active === "boolean" ? active : !!active && editor.value?.isActive(active);
	}

	const ToolItem = (() => {
		interface Props {
			tooltip?: string;
			active?: ActiveType;
			disabled?: boolean;
			icon?: DeclaredIcons;
			onClick?: (e: MouseEvent) => void;
		}
		return (props => (
			<SoftButton
				v-tooltip:bottom={props.tooltip}
				active={isActive(props.active)}
				disabled={props.disabled}
				icon={props.icon}
				onClick={props.onClick}
			/>
		)) as VueJsx<Props>;
	})();

	/*
	 * カスタムショートカットキーのリッスン。
	 * 現在のショートカットキー：
	 * `Ctrl + M` - 顔文字のクイック入力パネルを開きます。
	 */
</script>

<template>
	<FlyoutKaomoji v-model="flyoutKaomoji" @insert="insertKaomoji" />
	<FlyoutKaomojiMini v-model="flyoutKaomojiMini" @insert="insertKaomoji" @escape="insertKaomoji" />

	<Comp ref="rtfEditor" @keyup.stop.ctrl.m="showRecentKaomojis">
		<ClientOnly>
			<EditorContent :editor />
		</ClientOnly>
		<div class="toolbar">
			<div class="left">
				<ToolItem :tooltip="t.format.bold" icon="format_bold" active="bold" @click="toggleBold" :disabled="!props.editable" />
				<ToolItem :tooltip="t.format.italic" icon="format_italic" active="italic" @click="toggleItalic" :disabled="!props.editable" />
				<ToolItem :tooltip="t.format.underline" icon="format_underline" active="underline" @click="toggleUnderline" :disabled="!props.editable" />
				<ToolItem :tooltip="t.format.strikethrough" icon="format_strikethrough" active="strike" @click="toggleStrike" :disabled="!props.editable" />
				<ToolItem :tooltip="t.mention" icon="at" @click="showAtList" :disabled="!props.editable" />
				<ToolItem :tooltip="t.kaomoji" icon="kaomoji" :active="!!flyoutKaomoji" @click="e => flyoutKaomoji = [e, 'y', -3]" :disabled="!props.editable" />
				<ToolItem :tooltip="t.image" icon="photo" @click="addVueComponents" :disabled="!props.editable" />
			</div>
			<div class="right">
				<span class="text-length">{{ textLength }}</span>
				<ToolItem :tooltip="t.send" icon="send" :disabled="!textLength || isSendingComment || !props.editable" :loading="isSendingComment" @click="sendComment" />
			</div>
		</div>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		@include round-large;
		@include control-inner-shadow;
		overflow: clip;
		background-color: c(inset-bg);

		> :first-child {
			display: block;
			min-height: 3em;
			padding: 12px;
		}

		.toolbar {
			@include round-large(bottom);
			@include card-in-card-shadow;
			$height: 36px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: $height;
			padding-right: 4px;
			overflow: clip;

			.left {
				@include no-scrollar;
				overflow: auto clip;
			}

			> * {
				display: flex;
				gap: 4px;
				align-items: center;

				.soft-button {
					--wrapper-size: #{$height};
					--icon-size: 20px;
				}

				.text-length {
					display: block;
					margin: 0 8px;
					color: c(icon-color);
					font-variant-numeric: tabular-nums;
				}
			}
		}
	}
</style>
