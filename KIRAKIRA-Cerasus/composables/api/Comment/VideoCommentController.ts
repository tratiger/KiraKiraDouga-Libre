import { DELETE, GET, POST } from "../Common";
import type { AdminDeleteVideoCommentRequestDto, AdminDeleteVideoCommentResponseDto, CancelVideoCommentDownvoteRequestDto, CancelVideoCommentUpvoteRequestDto, DeleteSelfVideoCommentRequestDto, DeleteSelfVideoCommentResponseDto, EmitVideoCommentDownvoteRequestDto, EmitVideoCommentDownvoteResponseDto, EmitVideoCommentRequestDto, EmitVideoCommentResponseDto, EmitVideoCommentUpvoteRequestDto, EmitVideoCommentUpvoteResponseDto, GetVideoCommentByKvidRequestDto, GetVideoCommentByKvidResponseDto } from "./VideoCommentControllerDto";

const BACK_END_URI = environment.backendUri;
const VIDEO_COMMENT_API_URI = `${BACK_END_URI}video/comment`;

/**
 * ユーザーが動画コメントを送信します
 * @param emitVideoCommentRequest - ユーザーが送信する動画コメントのリクエストペイロード
 * @returns ユーザーが動画コメントを送信した結果
 */
export const emitVideoComment = async (emitVideoCommentRequest: EmitVideoCommentRequestDto): Promise<EmitVideoCommentResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${VIDEO_COMMENT_API_URI}/emit`, emitVideoCommentRequest, { credentials: "include" }) as EmitVideoCommentResponseDto;
};

/**
 * kvidに基づいて動画コメントリストを取得します
 * @param getVideoCommentByKvidRequest - 動画コメントリストをリクエストするためのクエリパラメータ
 * @returns 動画のコメントリスト
 */
export const getVideoCommentByKvid = async (getVideoCommentByKvidRequest: GetVideoCommentByKvidRequestDto): Promise<GetVideoCommentByKvidResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await GET(`${VIDEO_COMMENT_API_URI}?videoId=${getVideoCommentByKvidRequest.videoId}&page=${getVideoCommentByKvidRequest.pagination.page}&pageSize=${getVideoCommentByKvidRequest.pagination.pageSize}`, { credentials: "include" }) as GetVideoCommentByKvidResponseDto;
};

/**
 * ユーザーが動画コメントに高評価します
 * @param emitVideoCommentUpvoteRequest - ユーザーが動画コメントに高評価するためのリクエストペイロード
 * @returns ユーザーが動画コメントに高評価した結果
 */
export const emitVideoCommentUpvote = async (emitVideoCommentUpvoteRequest: EmitVideoCommentUpvoteRequestDto): Promise<EmitVideoCommentUpvoteResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${VIDEO_COMMENT_API_URI}/upvote`, emitVideoCommentUpvoteRequest, { credentials: "include" }) as EmitVideoCommentUpvoteResponseDto;
};

/**
 * ユーザーが動画コメントに低評価します
 * @param emitVideoCommentDownvoteRequest - ユーザーが動画コメントに低評価するためのリクエストペイロード
 * @returns ユーザーが動画コメントに低評価した結果
 */
export const emitVideoCommentDownvote = async (emitVideoCommentDownvoteRequest: EmitVideoCommentDownvoteRequestDto): Promise<EmitVideoCommentDownvoteResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${VIDEO_COMMENT_API_URI}/downvote`, emitVideoCommentDownvoteRequest, { credentials: "include" }) as EmitVideoCommentDownvoteResponseDto;
};

/**
 * ユーザーが動画コメントの高評価を取り消します
 * @param cancelVideoCommentUpvoteRequest - ユーザーが動画コメントの高評価を取り消すためのリクエストペイロード
 * @returns ユーザーが動画コメントの高評価を取り消した結果
 */
export const cancelVideoCommentUpvote = async (cancelVideoCommentUpvoteRequest: CancelVideoCommentUpvoteRequestDto): Promise<EmitVideoCommentUpvoteResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${VIDEO_COMMENT_API_URI}/upvote/cancel`, cancelVideoCommentUpvoteRequest, { credentials: "include" }) as EmitVideoCommentUpvoteResponseDto;
};

/**
 * ユーザーが動画コメントの低評価を取り消します
 * @param cancelVideoCommentDownvoteRequest - ユーザーが動画コメントの低評価を取り消すためのリクエストペイロード
 * @returns ユーザーが動画コメントの低評価を取り消した結果
 */
export const cancelVideoCommentDownvote = async (cancelVideoCommentDownvoteRequest: CancelVideoCommentDownvoteRequestDto): Promise<EmitVideoCommentDownvoteResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${VIDEO_COMMENT_API_URI}/downvote/cancel`, cancelVideoCommentDownvoteRequest, { credentials: "include" }) as EmitVideoCommentDownvoteResponseDto;
};

/**
 * 自分が投稿した動画コメントを削除します
 * @param deleteSelfVideoCommentRequest - 自分が投稿した動画コメントを削除するためのリクエストペイロード
 * @returns 自分が投稿した動画コメントを削除するリクエストのレスポンス
 */
export const deleteSelfVideoComment = async (deleteSelfVideoCommentRequest: DeleteSelfVideoCommentRequestDto): Promise<DeleteSelfVideoCommentResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${VIDEO_COMMENT_API_URI}/deleteSelfComment`, deleteSelfVideoCommentRequest, { credentials: "include" }) as DeleteSelfVideoCommentResponseDto;
};

/**
 * 管理者が動画コメントを削除します
 * @param dadminDeleteVideoCommentRequest - 管理者が動画コメントを削除するためのリクエストペイロード
 * @returns 管理者が動画コメントを削除するリクエストのレスポンス
 */
export const adminDeleteVideoComment = async (dadminDeleteVideoCommentRequest: AdminDeleteVideoCommentRequestDto): Promise<AdminDeleteVideoCommentResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${VIDEO_COMMENT_API_URI}/adminDeleteComment`, dadminDeleteVideoCommentRequest, { credentials: "include" }) as AdminDeleteVideoCommentResponseDto;
};
