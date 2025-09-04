<script setup lang="ts">
	const props = defineProps<{
		/** アバターURL。 */
		avatar?: string;
		/** ニックネーム。 */
		nickname: string;
		/** ユーザー名。 */
		username: string;
		/** ロール。 */
		roles?: string[];
		/** フォロワー数。 */
		followers: number;
		/** フォロー済みですか？ */
		isFollowing: boolean;
		/** 自分自身ですか？ */
		isSelf?: boolean;
		/** ユーザーUID。 */
		uid: number;
	}>();
</script>

<template>
	<Comp>
		<UserContent :avatar="avatar" :nickname="nickname" :followers="followers" :uid="uid" center>
			<template #description>
				{{ followers }} {{ t(followers).follower }}
			</template>
		</UserContent>
		<FollowButton v-if="!isSelf" :uid :isFollowing />
	</Comp>
</template>

<style scoped lang="scss">
	:comp {
		display: flex;
		gap: 12px;
		align-items: center;

		> :not(.user-content) {
			flex-shrink: 0;
		}

		.user-content {
			width: 100%;
		}
	}
</style>
