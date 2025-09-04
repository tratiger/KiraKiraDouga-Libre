import { GET, POST } from "../Common";
import type { EmitDanmakuRequestDto, EmitDanmakuResponseDto, GetDanmakuByKvidRequestDto, GetDanmakuByKvidResponseDto } from "./DanmakuControllerDto";

const BACK_END_URI = environment.backendUri;
const DANMAKU_API_URI = `${BACK_END_URI}video/danmaku`;

/**
 * ユーザーが弾幕を送信します
 * @param emitDanmakuRequest - ユーザーが送信した弾幕データ
 * @returns ユーザーが弾幕を送信した結果
 */
export const emitDanmaku = async (emitDanmakuRequest: EmitDanmakuRequestDto): Promise<EmitDanmakuResponseDto> => {
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	return await POST(`${DANMAKU_API_URI}/emit`, emitDanmakuRequest, { credentials: "include" }) as EmitDanmakuResponseDto;
};

/**
 * kvidに基づいて動画の弾幕リストを取得します
 * @param getDanmakuByKvidRequest - 弾幕リストを要求するクエリパラメータ
 * @returns 動画の弾幕リスト
 */
export const getDanmakuByKvid = async (getDanmakuByKvidRequest: GetDanmakuByKvidRequestDto): Promise<GetDanmakuByKvidResponseDto> => {
	return await GET(`${DANMAKU_API_URI}?videoId=${getDanmakuByKvidRequest.videoId}`) as GetDanmakuByKvidResponseDto;
};
