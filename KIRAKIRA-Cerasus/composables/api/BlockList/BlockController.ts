import { DELETE, GET, POST } from "../Common";
import type { AddRegexRequestDto, AddRegexResponseDto, BlockKeywordRequestDto, BlockKeywordResponseDto, BlockTagRequestDto, BlockTagResponseDto, BlockUserByUidRequestDto, BlockUserByUidResponseDto, GetBlockListRequestDto, GetBlockListResponseDto, HideUserByUidRequestDto, HideUserByUidResponseDto, RemoveRegexRequestDto, RemoveRegexResponseDto, ShowUserByUidRequestDto, ShowUserByUidResponseDto, UnblockKeywordRequestDto, UnblockKeywordResponseDto, UnblockTagRequestDto, UnblockTagResponseDto, UnblockUserByUidRequestDto, UnblockUserByUidResponseDto } from "./BlockControllerDto";

const BACK_END_URI = environment.backendUri;
const BLOCK_API_URI = `${BACK_END_URI}block`;

/**
 * 获取用户的黑名单
 * @param getBlockListRequest - 获取用户的黑名单的请求载荷
 * @returns 获取用户的黑名单的请求响应
 */
export const getBlockListController = async (getBlockListRequest: GetBlockListRequestDto): Promise<GetBlockListResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await GET(`${BLOCK_API_URI}/list?type=${getBlockListRequest.type}&page=${getBlockListRequest.pagination.page}&pageSize=${getBlockListRequest.pagination.pageSize}`, { credentials: "include" }) as GetVideoCommentByKvidResponseDto;
};

/**
 * 屏蔽用户
 * @param blockUserByUidRequest - 屏蔽用户的请求载荷
 * @returns 屏蔽用户的请求响应
 */
export const blockUserController = async (blockUserByUidRequest: BlockUserByUidRequestDto): Promise<BlockUserByUidResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${BLOCK_API_URI}/user`, blockUserByUidRequest, { credentials: "include" }) as BlockUserByUidResponseDto;
};

/**
 * 取消屏蔽用户
 * @param unblockUserByUidRequest - 取消屏蔽用户的请求载荷
 * @returns 取消屏蔽用户的请求响应
 */
export const unblockUserController = async (unblockUserByUidRequest: UnblockUserByUidRequestDto): Promise<UnblockUserByUidResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${BLOCK_API_URI}/delete/user`, unblockUserByUidRequest, { credentials: "include" }) as UnblockUserByUidResponseDto;
};

/**
 * 隐藏用户
 * @param hideUserByUidRequest - 隐藏用户的请求载荷
 * @returns 隐藏用户的请求响应
 */
export const hideUserController = async (hideUserByUidRequest: HideUserByUidRequestDto): Promise<HideUserByUidResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${BLOCK_API_URI}/hideuser`, hideUserByUidRequest, { credentials: "include" }) as HideUserByUidResponseDto;
};

/**
 * 取消隐藏用户
 * @param showUserByUidRequest - 显示用户的请求载荷
 * @returns 显示用户的请求响应
 */
export const showUserController = async (showUserByUidRequest: ShowUserByUidRequestDto): Promise<ShowUserByUidResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${BLOCK_API_URI}/delete/hideuser`, showUserByUidRequest, { credentials: "include" }) as ShowUserByUidResponseDto;
};

/**
 * 屏蔽 TAG
 * @param blockTagRequest - 屏蔽 TAG 的请求载荷
 * @returns 屏蔽 TAG 的请求响应
 */
export const blockTagController = async (blockTagRequest: BlockTagRequestDto): Promise<BlockTagResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${BLOCK_API_URI}/tag`, blockTagRequest, { credentials: "include" }) as BlockTagResponseDto;
};

/**
 * 取消屏蔽 TAG
 * @param unblockTagRequest - 取消屏蔽 TAG 的请求载荷
 * @returns 取消屏蔽 TAG 的请求响应
 */
export const unblockTagController = async (unblockTagRequest: UnblockTagRequestDto): Promise<UnblockTagResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${BLOCK_API_URI}/delete/tag`, unblockTagRequest, { credentials: "include" }) as UnblockTagResponseDto;
};

/**
 * 屏蔽关键词
 * @param blockKeywordRequest - 屏蔽关键词的请求载荷
 * @returns 屏蔽关键词的请求响应
 */
export const blockKeywordController = async (blockKeywordRequest: BlockKeywordRequestDto): Promise<BlockKeywordResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${BLOCK_API_URI}/keyword`, blockKeywordRequest, { credentials: "include" }) as BlockKeywordResponseDto;
};

/**
 * 取消屏蔽关键词
 * @param unblockKeywordRequest - 取消屏蔽关键词的请求载荷
 * @returns 取消屏蔽关键词的请求响应
 */
export const unblockKeywordController = async (unblockKeywordRequest: UnblockKeywordRequestDto): Promise<UnblockKeywordResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${BLOCK_API_URI}/delete/keyword`, unblockKeywordRequest, { credentials: "include" }) as UnblockKeywordResponseDto;
};

/**
 * 添加用于屏蔽内容的正则表达式
 * @param addRegexRequest - 添加用于屏蔽内容的正则表达式的请求载荷
 * @returns 添加用于屏蔽内容的正则表达式的请求响应
 */
export const addRegexController = async (addRegexRequest: AddRegexRequestDto): Promise<AddRegexResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${BLOCK_API_URI}/regex`, addRegexRequest, { credentials: "include" }) as AddRegexResponseDto;
};

/**
 * 移除用于屏蔽内容的正则表达式
 * @param removeRegexRequest - 移除用于屏蔽内容的正则表达式的请求载荷
 * @returns 移除用于屏蔽内容的正则表达式的请求响应
 */
export const removeRegexController = async (removeRegexRequest: RemoveRegexRequestDto): Promise<RemoveRegexResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await DELETE(`${BLOCK_API_URI}/delete/regex`, removeRegexRequest, { credentials: "include" }) as RemoveRegexResponseDto;
};
