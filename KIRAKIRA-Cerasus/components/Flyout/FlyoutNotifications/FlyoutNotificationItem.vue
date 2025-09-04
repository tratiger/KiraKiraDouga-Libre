<docs>
	# 通知フローティングウィンドウの各通知内容
</docs>

<script setup lang="ts">
	const props = defineProps<{
		/** 送信者のニックネーム。 */
		nickname?: string;
		/** ユーザー名。 */
		username?: string;
		/** ユーザーUID。 */
		uid?: number;
		/** 通知日。 */
		date: Date;
		/** 引用内容。 */
		quote?: string;
		/** コメントの一意のID。 */
		commentId?: string;
		/** コメントが属する動画のID。 */
		videoId?: number;
	}>();

	const menu = ref<FlyoutModel>();
</script>

<template>
	<Comp>
		<UserContent :nickname :username :uid :date>
			<div class="content">
				<slot></slot>
			</div>

			<template #quote v-if="quote">
				{{ quote }}
			</template>
			<template #footerRight>
				<SoftButton v-tooltip:bottom="t.reply" icon="reply" />
				<SoftButton v-tooltip:bottom="t.more" icon="more_vert" @click="e => menu = [e, 'bottom']" />
				<!-- TODO: リッチテキストを作成した後、展開するには**書式付き**が必要です。 -->
				<SoftButton icon="chevron_down" />
				<Menu v-model="menu">
					<MenuItem icon="delete">{{ t.delete }}</MenuItem>
					<MenuItem icon="pin">{{ t.pin }}</MenuItem>
					<MenuItem icon="flag">{{ t.report }}</MenuItem>
				</Menu>
			</template>
		</UserContent>
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		@include round-small;
		@include chip-shadow;
		display: flex;
		gap: 16px;
		padding: 16px;
		background-color: c(surface-color, 75%);
	}

	.user-content {
		flex-grow: 1;

		&:deep(.user-avatar) {
			@include square(42px);
		}
	}

	.content {
		overflow: clip;
		white-space: nowrap;
		text-align: left;
		text-overflow: ellipsis;
		hyphens: auto;

		&:lang(zh, ja) {
			text-overflow: "⋯⋯";
		}

		@supports (display: -webkit-box) { // -webkit-box のみ複数行の省略記号をサポートします
			$title-line-height: 22px;
			// stylelint-disable-next-line value-no-vendor-prefix
			display: -webkit-box;
			max-height: $title-line-height * 2;
			line-height: $title-line-height;
			-webkit-line-clamp: 2;
			white-space: normal;
			-webkit-box-orient: vertical;
		}
	}
</style>
