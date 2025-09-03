import { DELETE, GET, POST } from "../Common";
import type { AddRegexRequestDto, AddRegexResponseDto, BlockKeywordRequestDto, BlockKeywordResponseDto, BlockTagRequestDto, BlockTagResponseDto, BlockUserByUidRequestDto, BlockUserByUidResponseDto, GetBlockListRequestDto, GetBlockListResponseDto, HideUserByUidRequestDto, HideUserByUidResponseDto, RemoveRegexRequestDto, RemoveRegexResponseDto, ShowUserByUidRequestDto, ShowUserByUidResponseDto, UnblockKeywordRequestDto, UnblockKeywordResponseDto, UnblockTagRequestDto, UnblockTagResponseDto, UnblockUserByUidRequestDto, UnblockUserByUidResponseDto } from "./BlockControllerDto";

const BACK_END_URI = environment.backendUri;
const BLOCK_API_URI = `${BACK_END_URI}block`;

/**
 * ユーザーのブロックリストを取得します
 * @param getBlockListRequest - ユーザーのブロックリストを取得するためのリクエストペイロード
 * @returns ユーザーのブロックリスト取得リクエストのレスポンス
 */
export const getBlockListController = async (getBlockListRequest: GetBlockListRequestDto): Promise<GetBlockListResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await GET(`${BLOCK_API_URI}/list?type=${getBlockListRequest.type}&page=${getBlockListRequest.pagination.page}&pageSize=${getBlockListRequest.pagination.pageSize}`, { credentials: "include" }) as GetVideoCommentByKvidResponseDto;
};

/**
 * ユーザーをブロックします
 * @param blockUserByUidRequest - ユーザーをブロックするためのリクエストペイロード
 * @returns ユーザーをブロックするリクエストのレスポンス
 */
export const blockUserController = async (blockUserByUidRequest: BlockUserByUidRequestDto): Promise<BlockUserByUidResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${BLOCK_API_URI}/user`, blockUserByUidRequest, { credentials: "include" }) as BlockUserByUidResponseDto;
};

/**
 * ユーザーのブロックを解除します
 * @param unblockUserByUidRequest - ユーザーのブロックを解除するためのリクエストペイロード
 * @returns ユーザーのブロックを解除するリクエストのレスポンス
 */
export const unblockUserController = async (unblockUserByUidRequest: UnblockUserByUidRequestDto): Promise<UnblockUserByUidResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${BLOCK_API_URI}/delete/user`, unblockUserByUidRequest, { credentials: "include" }) as UnblockUserByUidResponseDto;
};

/**
 * ユーザーを非表示にします
 * @param hideUserByUidRequest - ユーザーを非表示にするためのリクエストペイロード
 * @returns ユーザーを非表示にするリクエストのレスポンス
 */
export const hideUserController = async (hideUserByUidRequest: HideUserByUidRequestDto): Promise<HideUserByUidResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${BLOCK_API_URI}/hideuser`, hideUserByUidRequest, { credentials: "include" }) as HideUserByUidResponseDto;
};

/**
 * ユーザーの非表示を解除します
 * @param showUserByUidRequest - ユーザーを表示するためのリクエストペイロード
 * @returns ユーザーを表示するリクエストのレスポンス
 */
export const showUserController = async (showUserByUidRequest: ShowUserByUidRequestDto): Promise<ShowUserByUidResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${BLOCK_API_URI}/delete/hideuser`, showUserByUidRequest, { credentials: "include" }) as ShowUserByUidResponseDto;
};

/**
 * タグをブロックします
 * @param blockTagRequest - タグをブロックするためのリクエストペイロード
 * @returns タグをブロックするリクエストのレスポンス
 */
export const blockTagController = async (blockTagRequest: BlockTagRequestDto): Promise<BlockTagResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${BLOCK_API_URI}/tag`, blockTagRequest, { credentials: "include" }) as BlockTagResponseDto;
};

/**
 * タグのブロックを解除します
 * @param unblockTagRequest - タグのブロックを解除するためのリクエストペイロード
 * @returns タグのブロックを解除するリクエストのレスポンス
 */
export const unblockTagController = async (unblockTagRequest: UnblockTagRequestDto): Promise<UnblockTagResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${BLOCK_API_URI}/delete/tag`, unblockTagRequest, { credentials: "include" }) as UnblockTagResponseDto;
};

/**
 * キーワードをブロックします
 * @param blockKeywordRequest - キーワードをブロックするためのリクエストペイロード
 * @returns キーワードをブロックするリクエストのレスポンス
 */
export const blockKeywordController = async (blockKeywordRequest: BlockKeywordRequestDto): Promise<BlockKeywordResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${BLOCK_API_URI}/keyword`, blockKeywordRequest, { credentials: "include" }) as BlockKeywordResponseDto;
};

/**
 * キーワードのブロックを解除します
 * @param unblockKeywordRequest - キーワードのブロックを解除するためのリクエストペイロード
 * @returns キーワードのブロックを解除するリクエストのレスポンス
 */
export const unblockKeywordController = async (unblockKeywordRequest: UnblockKeywordRequestDto): Promise<UnblockKeywordResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${BLOCK_API_URI}/delete/keyword`, unblockKeywordRequest, { credentials: "include" }) as UnblockKeywordResponseDto;
};

/**
 * コンテンツをブロックするための正規表現を追加します
 * @param addRegexRequest - コンテンツをブロックするための正規表現を追加するリクエストペイロード
 * @returns コンテンツをブロックするための正規表現を追加するリクエストのレスポンス
 */
export const addRegexController = async (addRegexRequest: AddRegexRequestDto): Promise<AddRegexResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await POST(`${BLOCK_API_URI}/regex`, addRegexRequest, { credentials: "include" }) as AddRegexResponseDto;
};

/**
 * コンテンツをブロックするための正規表現を削除します
 * @param removeRegexRequest - コンテンツをブロックするための正規表現を削除するリクエストペイロード
 * @returns コンテンツをブロックするための正規表現を削除するリクエストのレスポンス
 */
export const removeRegexController = async (removeRegexRequest: RemoveRegexRequestDto): Promise<RemoveRegexResponseDto> => {
	// TODO: クロスオリジンドメインからのクッキーの保存/読み取りを許可するために { credentials: "include" } を使用します。本番環境へのデプロイ前には削除すべきかもしれません。
	return await DELETE(`${BLOCK_API_URI}/delete/regex`, removeRegexRequest, { credentials: "include" }) as RemoveRegexResponseDto;
};
