<docs>
	# 通知フローティングウィンドウ
</docs>

<script setup lang="ts">
	const flyout = defineModel<FlyoutModel>();
	type PageType = "reply" | "mention" | "system";
	const currentPage = ref<PageType>("reply");
	const pages: { name: string; id: PageType; icon: DeclaredIcons }[] = [
		{ name: t.reply, id: "reply", icon: "reply" },
		{ name: t.mention, id: "mention", icon: "at" },
	];
	const transitionName = ref("page-jump-in");
</script>

<template>
	<Flyout v-model="flyout" noPadding>
		<Comp>
			<div class="content">
				<TabBar v-model="currentPage" vertical>
					<TabItem v-for="page in pages" :key="page.id" :id="page.id" :icon="page.icon">{{ page.name }}</TabItem>
				</TabBar>
				<div class="page-wrapper">
					<Transition :name="transitionName" mode="out-in">
						<div v-if="currentPage === 'reply'">
							<FlyoutNotificationItem nickname="わ" username="wow" :uid="8" :date="new Date()" quote="アストンマーティンのフランス赤ワインハッピーアストンマーティンのフランス赤ワインハッピーアストンマーティンのフランス赤ワインハッピーアストンマーティンのフランス赤ワインハッピー">自転車VBあなたたち🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲🚲</FlyoutNotificationItem>
						</div>
						<div v-else-if="currentPage === 'mention'">
							<FlyoutNotificationItem nickname="あ" username="ahh" :uid="8" :date="new Date()">新しいデザインを作成してくれてありがとう<a class="link lite">@言及された人</a>！</FlyoutNotificationItem>
						</div>
					</Transition>
				</div>
			</div>
		</Comp>
	</Flyout>
</template>

<style scoped lang="scss">
	$title-bar-height: 48px;
	$tab-bar-width: 108px;

	:comp {
		container: flyout-notification / inline-size;
		display: flex;
		width: 500px;
		min-height: 400px;

		.tab-bar {
			--full: true;
			min-width: $tab-bar-width;
			padding: 8px;
		}

		.content {
			display: flex;
		}

		.page-wrapper {
			width: calc(100cqw - $tab-bar-width);
			padding: 16px;
			padding-left: 8px;
		}
	}
</style>
