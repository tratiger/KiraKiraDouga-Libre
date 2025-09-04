import { GET, POST } from "../Common";
import type { CreateVideoTagResponseDto, GetVideoTagByTagIdRequestDto, GetVideoTagByTagIdResponseDto, SearchVideoTagRequestDto, SearchVideoTagResponseDto } from "./VideoTagControllerDto";

const BACK_END_URI = environment.backendUri;
const VIDEO_TAG_API_URI = `${BACK_END_URI}video/tag`;

/**
 * 動画タグを作成
 * @param createVideoTagRequest - 動画タグデータ
 * @returns 動画タグ作成リクエストのレスポンス
 */
export async function createVideoTag(createVideoTagRequest: CreateVideoTagRequestDto): Promise<CreateVideoTagResponseDto> {
	return await POST(`${VIDEO_TAG_API_URI}/create`, createVideoTagRequest, { credentials: "include" }) as CreateVideoTagResponseDto;
}

/**
 * 動画タグを検索
 * @param searchVideoTagRequest - 動画検索リクエストのペイロード
 * @returns 動画検索リクエストのレスポンス
 */
export async function searchVideoTag(searchVideoTagRequest: SearchVideoTagRequestDto): Promise<SearchVideoTagResponseDto> {
	return await GET(`${VIDEO_TAG_API_URI}/search?tagName=${searchVideoTagRequest.tagNameSearchKey}`) as SearchVideoTagResponseDto;
}

/**
 * TAG IDリストに基づいてTAGを検索
 * @param getVideoTagByTagIdRequest - TAG IDリストに基づいてTAGを検索するためのリクエストパラメータ
 * @returns TAG IDリストに基づいてTAGを検索したリクエストのレスポンス結果
 */
export const getTagsByTagIds = async (getVideoTagByTagIdRequest: GetVideoTagByTagIdRequestDto): Promise<GetVideoTagByTagIdResponseDto> => {
	if (getVideoTagByTagIdRequest && getVideoTagByTagIdRequest.tagId) {
		const { data: result } = await useFetch<GetVideoTagByTagIdResponseDto>(`${VIDEO_TAG_API_URI}/get`, {
			method: "POST",
			body: { tagId: getVideoTagByTagIdRequest.tagId },
		});
		if (result.value)
			return result.value;
		else
			return { success: false, message: "TAG IDによるTAGの取得に失敗しました" };
	} else
		return { success: false, message: "TAG取得時にTAG IDが指定されていません" };
};
