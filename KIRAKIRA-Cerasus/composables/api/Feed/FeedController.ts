import type { FollowingUploaderRequestDto, FollowingUploaderResponseDto, UnfollowingUploaderRequestDto, UnfollowingUploaderResponseDto } from "./FeedControllerDto";

const BACK_END_URI = environment.backendUri;
const FEED_API_URI = `${BACK_END_URI}feed`;

/**
 * ユーザーがクリエイターをフォローします
 * @param followingUploaderRequest - ユーザーがクリエイターをフォローするリクエストペイロード
 * @returns ユーザーがクリエイターをフォローするリクエストのレスポンス
 */
export const followingUploader = (followingUploaderRequest: FollowingUploaderRequestDto) => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return useFetch<FollowingUploaderResponseDto>(
		`${FEED_API_URI}/following`,
		{
			method: "POST",
			body: { ...followingUploaderRequest },
			credentials: "include",
		},
	);
};

/**
 * ユーザーがクリエイターのフォローを解除します
 * @param unfollowingUploaderRequest - ユーザーがクリエイターのフォローを解除するリクエストペイロード
 * @returns ユーザーがクリエイターのフォローを解除するリクエストのレスポンス
 */
export const unfollowingUploader = (unfollowingUploaderRequest: UnfollowingUploaderRequestDto) => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return useFetch<UnfollowingUploaderResponseDto>(
		`${FEED_API_URI}/unfollowing`,
		{
			method: "POST",
			body: { ...unfollowingUploaderRequest },
			credentials: "include",
		},
	);
};
