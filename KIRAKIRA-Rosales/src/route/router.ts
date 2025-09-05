import Router from '@koa/router'
import { createOrUpdateUserBrowsingHistoryController, getUserBrowsingHistoryWithFilterController } from '../controller/BrowsingHistoryController.js'
import { emitDanmakuController, getDanmakuListByKvidController } from '../controller/DanmakuController.js'
import { createFavoritesController, getFavoritesController } from '../controller/FavoritesController.js'
import { helloWorld } from '../controller/HelloWorld.js'
import {
	adminClearUserInfoController,
	adminGetUserInfoController,
	approveUserInfoController,
	checkInvitationCodeController,
	checkUsernameController,
	checkUserTokenController,
	createInvitationCodeController,
	getBlockedUserController,
	getMyInvitationCodeController,
	getSelfUserInfoController,
	getUserAvatarUploadSignedUrlController,
	getUserInfoByUidController,
	getUserSettingsController,
	requestSendChangeEmailVerificationCodeController,
	requestSendChangePasswordVerificationCodeController,
	requestSendVerificationCodeController,
	updateOrCreateUserInfoController,
	updateOrCreateUserSettingsController,
	updateUserEmailController,
	updateUserPasswordController,
	userEmailExistsCheckController,
	userLoginController,
	userLogoutController,
	userRegistrationController,
	createUserTotpAuthenticatorController,
	checkUserHave2FAByEmailController,
	deleteTotpAuthenticatorByTotpVerificationCodeController,
	confirmUserTotpAuthenticatorController,
	checkUserHave2FAByUUIDController,
	createUserEmailAuthenticatorController,
	sendUserEmailAuthenticatorController,
	deleteUserEmailAuthenticatorController,
	sendDeleteUserEmailAuthenticatorController,
	userExistsCheckByUIDController,
	adminEditUserInfoController,
	adminGetUserByInvitationCodeController,
	forgotPasswordController,
	requestSendForgotPasswordVerificationCodeController,
} from '../controller/UserController.js'
import { adminDeleteVideoCommentController, cancelVideoCommentDownvoteController, cancelVideoCommentUpvoteController, deleteSelfVideoCommentController, emitVideoCommentController, emitVideoCommentDownvoteController, emitVideoCommentUpvoteController, getVideoCommentListByKvidController } from '../controller/VideoCommentController.js'
import {
	abortVideoUploadController,
	approvePendingReviewVideoController,
	checkVideoExistController,
	completeVideoUploadController,
	deleteVideoByKvidController,
	getMultipartSignedUrlController,
	getPendingReviewVideoController,
	getThumbVideoController,
	getVideoByKvidController,
	getVideoByUidController,
	getVideoCoverUploadSignedUrlController,
	initiateVideoUploadController,
	searchVideoByKeywordController,
	searchVideoByVideoTagIdController,
	updateVideoController,
} from '../controller/VideoController.js'
import { createVideoTagController, getVideoTagByTagIdController, searchVideoTagController } from '../controller/VideoTagController.js'
import { adminGetUserRolesByUidController, adminUpdateUserRoleController, createRbacApiPathController, createRbacRoleController, deleteRbacApiPathController, deleteRbacRoleController, getRbacApiPathController, getRbacRoleController, updateApiPathPermissionsForRoleController } from '../controller/RbacController.js'
import { getStgEnvBackEndSecretController } from '../controller/ConsoleSecretController.js'
import { addNewUid2FeedGroupController, administratorApproveFeedGroupInfoChangeController, administratorDeleteFeedGroupController, createFeedGroupController, createOrEditFeedGroupInfoController, deleteFeedGroupController, followingUploaderController, getFeedContentController, getFeedGroupCoverUploadSignedUrlController, getFeedGroupListController, removeUidFromFeedGroupController, unfollowingUploaderController } from '../controller/FeedController.js'
import { addRegexController, blockKeywordController, blockTagController, blockUserByUidController, getBlockListController, hideUserByUidController, removeRegexController, showUserByUidController, unblockKeywordController, unblockTagController, unblockUserByUidController } from '../controller/BlockController.js'

const router = new Router()

// router-begin

router.get('/', helloWorld) // テスト // DELETE ME
router.get('/02/koa/hello', helloWorld) // テスト // DELETE ME






router.post('/user/registering', userRegistrationController) // ユーザー登録
// https://localhost:9999/user/registering
// {
// 	"email": "aaa@aaa.aaa",
// 	"passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// 	"passwordHint": "YYYYYYYYYYYYYYY",
// 	"verificationCode": "ZZZZZZ",
// 	"invitationCode": "KIRA-XXXX-XXXX"
// }

router.post('/user/login', userLoginController) // ユーザーログイン
// https://localhost:9999/user/login
// {
// 	"email": "aaa@aaa.aaa",
// 	"passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
// 	"clientOtp": "XXXXXX" // オプション
//  "verificationCode": "XXXXXX" // オプション
// }

router.post('/user/createTotpAuthenticator', createUserTotpAuthenticatorController) // ユーザーがTOTP認証を作成
// https://localhost:9999/user/createTotpAuthenticator
// cookie: uuid, token

router.post('/user/confirmUserTotpAuthenticator', confirmUserTotpAuthenticatorController) // ユーザーがTOTPデバイスのバインドを確認
// https://localhost:9999/user/confirmUserTotpAuthenticator
// {
// 	"clientOtp": "XXXXXX",
// 	"otpAuth": "YYYYYYYYYYYYYYYYYYYYYYYYYY"
// }

router.delete('/user/deleteTotpAuthenticatorByTotpVerificationCodeController', deleteTotpAuthenticatorByTotpVerificationCodeController) // ログイン済みユーザーがパスワードとTOTP認証コードで認証を削除
// cookie: uuid, token
// {
// 	 "clientOtp": "XXXXXX",
// 	 "passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
// }

router.post('/user/createEmailAuthenticator', createUserEmailAuthenticatorController) // ユーザーがEmail認証を作成
// https://localhost:9999/user/createEmailAuthenticator
// cookie: uuid, token

router.post('/user/sendUserEmailAuthenticator', sendUserEmailAuthenticatorController) // ユーザーがEmail認証コードを送信
// https://localhost:9999/user/sendUserEmailAuthenticator
// {
// 	 "email": "aaa@aaa.aaa",
// 	 "passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "clientLanguage": "zh-Hans-CN",
// }

router.post('/user/sendDeleteUserEmailAuthenticator', sendDeleteUserEmailAuthenticatorController) // ユーザーがEmail認証削除の認証コードを送信
// https://localhost:9999/user/sendDeleteUserEmailAuthenticator
// cookie: uuid, token
// {
//   "clientLanguage": "zh-Hans-CN",
// }

router.delete('/user/deleteUserEmailAuthenticator', deleteUserEmailAuthenticatorController) // ユーザーがEmail 2FAを削除
// https://localhost:9999/user/deleteUserEmailAuthenticator
// cookie: uuid, token
// {
// 	 "passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
// 	 "verificationCode": "YYYYYY"
// }

router.get('/user/checkUserHave2FAByEmail', checkUserHave2FAByEmailController) // Emailでユーザーが2FAを有効にしているか確認
// https://localhost:9999/user/checkUserHave2FAByEmail?email=xxxxxxx

router.get('/user/checkUserHave2FAByUUID', checkUserHave2FAByUUIDController) // UUIDでユーザーが2FAを有効にしているか確認
// https://localhost:9999/user/checkUserHave2FAByUUID
// cookie: uuid, token

router.get('/user/existsCheck', userEmailExistsCheckController) // ユーザー登録時にメールアドレスが存在するか確認
// https://localhost:9999/user/existsCheck?email=xxxxxxx

router.post('/user/update/email', updateUserEmailController) // ユーザーのメールアドレスを更新
// https://localhost:9999/user/update/email
// cookie: uid, token
// {
// 	"uid": "XXXXXXXXX",
// 	"oldEmail": "aaa@aaa.aaa",
// 	"newEmail": "bbb@bbb.bbb",
// 	"passwordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// 	"verificationCode": "XXXXXX"
// }

router.post('/user/update/info', updateOrCreateUserInfoController) // ユーザー情報の更新または作成
// https://localhost:9999/user/update/info
// cookie: uuid, token
// {
// 	"username": "XXXXXXXXX",
// 	"avatar": "https://xxx.xxx.xxx/xxx.png",
// 	"userBannerImage": "https://yyy.yyy.yyy/yyy.png",
// 	"signature": "aaaaaaaaaaaaaaa",
// 	"gender": "AH-64",
// 	"label": [
// 			{
// 					"id": "0",
// 					"labelName": "bbbbbb"
// 			}
// 	],
// 	"userBirthday": "",
// 	"userProfileMarkdown": "### 作文の時間！",
// 	"userLinkAccounts": [
// 			{
// 					"accountType": "X",
// 					"accountUniqueId": "xxx"
// 			},
// 			{
// 					"accountType": "bili",
// 					"accountUniqueId": "xxxx"
// 			}
// 	],
// 	"userWebsite": {
// 			"websiteName": "XXXXXXXX",
// 			"websiteUrl": "https://xxxx.xxx/xxxxx"
// 	}
// }


router.post('/user/self', getSelfUserInfoController) // 現在ログインしているユーザーの情報を取得（cookieまたはリクエストボディ経由）
// https://localhost:9999/user/self
// cookie: uid, token
// or
// {
// 	"uid": "XXXXXXXXX",
// 	"token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// }

router.get('/user/info', getUserInfoByUidController) // uidに基づいてユーザー情報を取得
// https://localhost:9999/user/info?uid=10
// optional: cookie: uuid, token

router.get('/user/exists', userExistsCheckByUIDController) // ユーザーが存在するか確認
// https://localhost:9999/user/exists?uid=10

router.get('/user/check', checkUserTokenController) // uidとtokenでユーザーを検証
// https://localhost:9999/user/check
// cookie: uid, token

router.get('/user/logout', userLogoutController) // ブラウザのcookieをクリア（ユーザーログアウト）
// https://localhost:9999/user/logout

router.get('/user/avatar/preUpload', getUserAvatarUploadSignedUrlController) // アバターアップロード用の署名付きURLを取得（60秒間有効）
// https://localhost:9999/user/avatar/preUpload
// cookie: uid, token

router.post('/user/settings', getUserSettingsController) // サーバーまたはクライアントでユーザー設定情報を取得し、ページを正しくレンダリング
// https://localhost:9999/user/settings
// cookie: uid, token
// or
// {
// 	"uid": "XXXXXXXXX",
// 	"token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// }

router.post('/user/settings/update', updateOrCreateUserSettingsController) // ユーザー設定の更新または作成
// https://localhost:9999/user/settings/update
// cookie: uid, token
// {
// 	"coloredSideBar": "true"
// }

router.post('/user/requestSendVerificationCode', requestSendVerificationCodeController) // 登録時のメール認証コード送信をリクエスト
// https://localhost:9999/user/requestSendVerificationCode
// {
// 	"email": "aaa@bbb.com",
// 	"clientLanguage": "zh-Hans-CN"
// }

router.post('/user/createInvitationCode', createInvitationCodeController) // 招待コードを生成
// https://localhost:9999/user/createInvitationCode
// cookie: uid, token

router.get('/user/myInvitationCode', getMyInvitationCodeController) // 特定ユーザーの全招待コードを取得
// https://localhost:9999/user/myInvitationCode
// cookie: uid, token

router.post('/user/checkInvitationCode', checkInvitationCodeController) // 招待コードが利用可能か確認
// https://localhost:9999/user/checkInvitationCode
// {
// 	"invitationCode": "KIRA-XXXX-XXXX"
// }

router.get('/user/getUserByInvitationCode', adminGetUserByInvitationCodeController) // 管理者が招待コードでユーザーを検索 // WARN: 管理者のみ
// https://localhost:9999/user/getUserByInvitationCode?invitationCode=KIRA-XXXX-XXXX
// cookie: uuid, token

router.post('/user/requestSendChangeEmailVerificationCode', requestSendChangeEmailVerificationCodeController) // メールアドレス変更用の認証コード送信をリクエスト
// https://localhost:9999/user/requestSendChangeEmailVerificationCode
// cookie: uid, token
// {
// 	"clientLanguage": "zh-Hans-CN"
// }

router.post('/user/requestSendChangePasswordVerificationCode', requestSendChangePasswordVerificationCodeController) // パスワード変更用の認証コード送信をリクエスト
// https://localhost:9999/user/requestSendChangePasswordVerificationCode
// cookie: uid, token
// {
// 	"clientLanguage": "zh-Hans-CN"
// }

router.post('/user/update/password', updateUserPasswordController) // ユーザーパスワードを更新
// https://localhost:9999/user/update/password
// cookie: uid, token
// {
// 	"oldPasswordHash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// 	"newPasswordHash": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
// 	"verificationCode": "XXXXXX"
// }

router.post('/user/requestSendForgotPasswordVerificationCode', requestSendForgotPasswordVerificationCodeController) // パスワード忘れの認証コード送信をリクエスト
// https://localhost:9999/user/requestSendForgotPasswordVerificationCode
// {
// 	"clientLanguage": "zh-Hans-CN",
// 	"email": "your-email@website.com"
// }

router.post('/user/forgot/password', forgotPasswordController) // パスワードの回復（更新）
// https://localhost:9999/user/forgot/password
// {
// 	"email": "your-email@website.com",
// 	"newPasswordHash": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
// 	"verificationCode": "XXXXXX"
// }

router.get('/user/checkUsername', checkUsernameController) // ユーザー名が利用可能か確認
// https://localhost:9999/user/checkUsername?username=xxxxxxxx

router.get('/user/blocked/info', getBlockedUserController) // 全ブロックユーザーの情報を取得 // WARN: 管理者のみ
// https://localhost:9999/user/blocked/info
// cookie: uid, token

router.get('/user/adminGetUserInfo', adminGetUserInfoController) // 管理者がユーザー情報を取得 // WARN: 管理者のみ
// https://localhost:9999/user/adminGetUserInfo?isOnlyShowUserInfoUpdatedAfterReview=true&page=1&pageSize=20
// cookie: UUID, token

router.post('/user/adminEditUserInfo', adminEditUserInfoController) // 管理者がユーザー情報を強制更新 // WARN: 管理者のみ
// https://localhost:9999/user/adminEditUserInfo
// cookie: UUID, token
// {
// 	"UUID": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
// 	"userInfo" :{
// 		"username": "XXXXXXXXX",
// 		"signature": "aaaaaaaaaaaaaaa",
// 		...
// 	}
// }

router.post('/user/approveUserInfo', approveUserInfoController) // 管理者がユーザー情報のレビューを承認 // WARN: 管理者のみ
// https://localhost:9999/user/approveUserInfo
// cookie: UUID, token
// {
// 	"UUID": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
// }

router.post('/user/adminClearUserInfo', adminClearUserInfoController) // 管理者が特定ユーザーの情報をクリア // WARN: 管理者のみ
// https://localhost:9999/user/adminClearUserInfo
// cookie: UUID, token
// {
// 	"uid": XXXX
// }






router.post('/block/user', blockUserByUidController) // ユーザーがユーザーをブロック
// https://localhost:9999/block/user
// cookie: UUID, token
// {
// 	"blockUid": XXXX
// }

router.post('/block/hideuser', hideUserByUidController) // ユーザーがユーザーを非表示
// https://localhost:9999/block/hideuser
// cookie: UUID, token
// {
//	"hideUid": XXXX
// }

router.post('/block/tag', blockTagController) // ユーザーがタグをブロック
// https://localhost:9999/block/tag
// cookie: UUID, token
// {
//	"tagId": XXXX
// }

router.post('/block/keyword', blockKeywordController) // ユーザーがキーワードをブロック
// https://localhost:9999/block/keyword
// cookie: UUID, token
// {
// 	"blockKeyword": "XXXXXX"
// }

router.post('/block/regex', addRegexController) // ユーザーが正規表現を追加
// https://localhost:9999/block/regex
// cookie: UUID, token
// {
//	"blockRegex": "XXXXXX"
// }

router.delete('/block/delete/user', unblockUserByUidController) // ユーザーがユーザーのブロックを解除
// https://localhost:9999/block/delete/user
// cookie: UUID, token
// {
//	"blockUid": XXXX
// }

router.delete('/block/delete/hideuser', showUserByUidController) // ユーザーがユーザーの非表示を解除
// https://localhost:9999/block/delete/hideuser
// {
//	"hideUid": XXXX
// }

router.delete('/block/delete/tag', unblockTagController) // ユーザーがタグのブロックを解除
// https://localhost:9999/block/delete/tag
// cookie: UUID, token
// {
//	"blockTag": XXXX
// }

router.delete('/block/delete/keyword', unblockKeywordController) // ユーザーがキーワードのブロックを解除
// https://localhost:9999/block/delete/keyword
// cookie: UUID, token
// {
//	"blockKeyword": "XXXXXX"
// }

router.delete('/block/delete/regex', removeRegexController) // ユーザーが正規表現のブロックを解除
// https://localhost:9999/block/delete/regex
// cookie: UUID, token
// {
//	"blockRegex": "XXXXXX"
// }

router.get('/block/list', getBlockListController) // ユーザーのブラックリストを取得
// https://localhost:9999/block/list?type=block&page=0&pageSize=10
// cookie: UUID, token










router.post('/video/upload', updateVideoController) // 動画をアップロード
// https://localhost:9999/video/upload
// {
// 	"videoPart": [
// 		{
// 			"id": "0",
// 			"videoPartTitle": "2953-day1",
// 			"link": "https://xxx.xxx.xxx/xxx.mp4"
// 		}
// 	],
// 	"title": "[ナイトミュージアム] 2953 シチズンコン VRCバーチャル鑑賞会（1日目）",
// 	"image": "https://xxx.xxx.xxx/xxx.png",
// 	"uploader": "cfdxkk@kirakira.moe",
// 	"uploaderId": "123",
// 	"duration": "19573",
// 	"description": "グループの友達と夜更かしして深夜2時から朝8時まで見ました。今年のシチズンコンは本当に素晴らしかったです。"
// }

router.get('/video/home', getThumbVideoController) // ホームページの動画を取得
// https://localhost:9999/video/home

router.get('/video/exists', checkVideoExistController) // 動画ID (KVID) で動画が存在するか確認
// https://localhost:9999/video/exists?videoId=1

router.get('/video', getVideoByKvidController) // 動画ID (KVID) で動画データを取得
// https://localhost:9999/video?videoId=1
// cookie: uid, token (optional, if have it will try to record the video browsing history)

router.get('/video/user', getVideoByUidController) // UIDでユーザーがアップロードした動画を取得
// https://localhost:9999/video/user?uid=2

router.get('/video/search', searchVideoByKeywordController) // キーワードで動画を検索
// https://localhost:9999/video/search?keyword=fate

router.post('/video/search/tag', searchVideoByVideoTagIdController) // TAG IDで動画を検索
// https://localhost:9999/video/search/tag
// {
// 	"tagId": [1, 2]
// }

router.post('/video/upload/initiate', initiateVideoUploadController) // マルチパートアップロードを開始
// https://localhost:9999/video/upload/initiate
// cookie: uid, token

router.post('/video/upload/part-url', getMultipartSignedUrlController) // パートアップロード用の署名付きURLを取得
// https://localhost:9999/video/upload/part-url
// cookie: uid, token

router.post('/video/upload/complete', completeVideoUploadController) // マルチパートアップロードを完了
// https://localhost:9999/video/upload/complete
// cookie: uid, token

router.post('/video/upload/abort', abortVideoUploadController) // マルチパートアップロードを中断
// https://localhost:9999/video/upload/abort
// cookie: uid, token

router.get('/video/cover/preUpload', getVideoCoverUploadSignedUrlController) // 動画カバー画像アップロード用の署名付きURLを取得
// https://localhost:9999/video/cover/preUpload
// cookie: uid, token

router.delete('/video/delete', deleteVideoByKvidController) // 動画IDで動画を削除 // WARN: 管理者のみ
// https://localhost:9999/video/delete
// cookie: uid, token
// {
// 	"videoId": XXX
// }

router.get('/video/pending', getPendingReviewVideoController) // レビュー待ち動画リストを取得 // WARN: 管理者のみ
// https://localhost:9999/video/pending
// cookie: uid, token

router.post('/video/pending/approved', approvePendingReviewVideoController) // レビュー待ち動画を承認 // WARN: 管理者のみ
// https://localhost:9999/video/pending/approved
// cookie: uid, token









router.post('/video/danmaku/emit', emitDanmakuController) // 弾幕送信インターフェース
// https://localhost:9999/video/danmaku/emit
// cookie: uid, token, uuid
// {
// 	"videoId": 10,
// 	"time": 5,
// 	"text": "これはテスト弾幕です",
// 	"color": "#66CCFF",
// 	"fontSIze": "medium",
// 	"mode": "rtl",
// 	"enableRainbow": false
// }

router.get('/video/danmaku', getDanmakuListByKvidController) // 動画IDで弾幕リストを取得
// https://localhost:9999/video/danmaku?videoId=10






router.post('/video/comment/emit', emitVideoCommentController) // 動画コメント送信インターフェース
// https://localhost:9999/video/comment/emit
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"text": "これはテストコメントです"
// }

router.get('/video/comment', getVideoCommentListByKvidController) // KVIDで動画コメントリストを取得し、現在のユーザーが高評価/低評価しているか確認。していれば対応する値がtrueになる
// https://localhost:9999/video/comment?videoId=13
// オプション：cookie: uid, token

router.post('/video/comment/upvote', emitVideoCommentUpvoteController) // ユーザーが動画コメントに高評価
// https://localhost:9999/video/comment/upvote
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"id": "65859fbfae7bd341a408fe42"
// }

router.post('/video/comment/downvote', emitVideoCommentDownvoteController) // ユーザーが動画コメントに低評価
// https://localhost:9999/video/comment/downvote
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"id": "65859fbfae7bd341a408fe42"
// }

router.delete('/video/comment/upvote/cancel', cancelVideoCommentUpvoteController) // ユーザーが動画コメントの高評価を取り消し
// https://localhost:9999/video/comment/upvote/cancel
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"id": "65859fbfae7bd341a408fe42"
// }

router.delete('/video/comment/downvote/cancel', cancelVideoCommentDownvoteController) // ユーザーが動画コメントの低評価を取り消し
// https://localhost:9999/video/comment/downvote/cancel
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"id": "65859fbfae7bd341a408fe42"
// }

router.delete('/video/comment/deleteSelfComment', deleteSelfVideoCommentController) // 自身が投稿した動画コメントを削除
// https://localhost:9999/video/comment/deleteSelfComment
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"commentRoute": "13.10"
// }

router.delete('/video/comment/adminDeleteComment', adminDeleteVideoCommentController) // 管理者が動画コメントを削除 // WARN: 管理者のみ
// https://localhost:9999/video/comment/adminDeleteComment
// cookie: uid, token
// {
// 	"videoId": 13,
// 	"commentRoute": "13.10"
// }





router.post('/video/tag/create', createVideoTagController) // ユーザーが動画TAGを作成
// https://localhost:9999/video/tag/create
// cookie: uid, token
// {
// 	"tagNameList": [
// 		{
// 			"lang": "en",
// 			"tagName": [
// 				{
// 					"name": "StarCitizen",
// 					"isDefault": true,
// 					"isOriginalTagName": false
// 				}, {
// 					"name": "SC",
// 					"isDefault": false,
// 					"isOriginalTagName": false
// 				}
// 			]
// 		}, {
// 			"lang": "zhs",
// 			"tagName": [
// 				{
// 					"name": "スターシチズン",
// 					"isDefault": false,
// 					"isOriginalTagName": false
// 				}
// 			]
// 		}
// 	]
// }

router.get('/video/tag/search', searchVideoTagController) // キーワードで動画TAGを検索
// https://localhost:9999/video/tag/search?tagName=hello

router.post('/video/tag/get', getVideoTagByTagIdController) // TAG IDでデータベース内の動画TAGを検索 // WARN: このインターフェースはPOSTメソッドです
// https://localhost:9999/video/tag/get
// {
// 	"tagId": [1, 2]
// }








router.post('/history/merge', createOrUpdateUserBrowsingHistoryController) // ユーザーの閲覧履歴を更新または作成 // DELETE: このインターフェースを公開する必要はない
// https://localhost:9999/history/merge
// cookie: uid, token
// {
// 	"uid": 2,
// 	"category": "video",
// 	"id": "32"
// }

router.get('/history/filter', getUserBrowsingHistoryWithFilterController) // 全てまたはフィルタリングされたユーザーの閲覧履歴を、最終閲覧日時順（降順）で取得
// https://localhost:9999/history/filter?videoTitle=foo
// cookie: uid, token
// > または、URLクエリなしで現在のユーザーの全閲覧履歴を取得できます -> https://localhost:9999/history/filter









router.post('/favorites/create', createFavoritesController) // お気に入りを作成
// https://localhost:9999/favorites/create
// cookie: uid, token
// {
// 	"favoritesTitle": "おすすめ動画",
// 	"favoritesBio": "ここはおもしろ動画でいっぱいです",
// 	"favoritesCover": "f907a7bd-3247-4415-1f5e-a67a5d3ea100",
// 	"favoritesVisibility": 1
// }

router.get('/favorites', getFavoritesController) // 現在ログインしているユーザーのお気に入りリストを取得
// https://localhost:9999/favorites
// cookie: uid, token











router.post('/feed/following', followingUploaderController) // ユーザーをフォロー
// https://localhost:9999/feed/following
// cookie: uuid, token
// {
// 	"followingUid": 999
// }

router.post('/feed/unfollowing', unfollowingUploaderController) // ユーザーのフォローを解除
// https://localhost:9999/feed/unfollowing
// cookie: uuid, token
// {
// 	"unfollowingUid": 999
// }

router.post('/feed/createFeedGroup', createFeedGroupController) // フィードグループを作成
// https://localhost:9999/feed/createFeedGroup
// cookie: uuid, token
// {
// 	"feedGroupName": "test",
// 	"withUidList": [1, 2],
// 	"withCustomCoverUrl": "xxxxxxxxxxxxxxxxxxxxxxxxxx"
// }

router.post('/feed/addNewUid2FeedGroup', addNewUid2FeedGroupController) // フィードグループに新しいUIDを追加
// https://localhost:9999/feed/addNewUid2FeedGroup
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx",
// 	"uidList": [1, 2]
// }

router.post('/feed/removeUidFromFeedGroup', removeUidFromFeedGroupController) // フィードグループからUIDを削除
// https://localhost:9999/feed/removeUidFromFeedGroup
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx",
// 	"uidList": [1, 2]
// }

router.delete('/feed/deleteFeedGroup', deleteFeedGroupController) // フィードグループを削除
// https://localhost:9999/feed/deleteFeedGroup
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx"
// }

router.get('/feed/getFeedGroupCoverUploadSignedUrl', getFeedGroupCoverUploadSignedUrlController) // ユーザーのアバターアップロード用の署名付きURLを取得（60秒間有効）
// https://localhost:9999/feed/getFeedGroupCoverUploadSignedUrl
// cookie: uuid, token

router.post('/feed/createOrEditFeedGroupInfo', createOrEditFeedGroupInfoController) // フィードグループ情報の作成または更新
// https://localhost:9999/feed/createOrEditFeedGroupInfo
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx",
// 	"feedGroupName": "xxxxx",
// 	"feedGroupCustomCoverUrl": "xxxxxxxxxxxxxxxxxxxxxxxxxxx",
// }

router.post('/feed/administratorApproveFeedGroupInfoChange', administratorApproveFeedGroupInfoChangeController) // 管理者がフィードグループ情報の更新レビューを承認
// https://localhost:9999/feed/administratorApproveFeedGroupInfoChange
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx"
// }

router.delete('/feed/administratorDeleteFeedGroup', administratorDeleteFeedGroupController) // 管理者がフィードグループを削除
// https://localhost:9999/feed/administratorDeleteFeedGroup
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx"
// }

router.get('/feed/getFeedGroupList', getFeedGroupListController) // フィードグループを取得
// https://localhost:9999/feed/getFeedGroupList
// cookie: uuid, token


router.get('/feed/getFeedContent', getFeedContentController) // フィードグループを取得
// https://localhost:9999/feed/getFeedContent?page=1&pageSize=30
// cookie: uuid, token
// {
// 	"feedGroupUuid": "xxxxxxxxxxxxxxxxxxxxx"
// }












router.post('/rbac/createRbacApiPath', createRbacApiPathController) // RBAC APIパスを作成
// https://localhost:9999/rbac/createRbacApiPath
// cookie: uuid, token
// {
// 	"apiPath": "/luo/tian/yi",
// 	"apiPathType": "tian-yi",
// 	"apiPathColor": "#66CCFFFF",
// 	"apiPathDescription": "ここに概要"
// }

router.delete('/rbac/deleteRbacApiPath', deleteRbacApiPathController) // RBAC APIパスを削除
// https://localhost:9999/rbac/deleteRbacApiPath
// cookie: uuid, token
// {
// 	"apiPath": "/luo/tian/yi"
// }

router.get('/rbac/getRbacApiPath', getRbacApiPathController) // RBAC APIパスを取得
// https://localhost:9999/rbac/getRbacApiPath
// cookie: uuid, token
//
// Query:
// apiPath
// apiPathType
// apiPathColor
// apiPathDescription
// page
// pageSize

router.post('/rbac/createRbacRole', createRbacRoleController) // RBACロールを作成
// https://localhost:9999/rbac/createRbacRole
// cookie: uuid, token
// {
// 	"roleName": "administrator",
// 	"apiPathType": "administrator",
// 	"apiPathColor": "#66CCFFFF",
// 	"apiPathDescription": "これは管理者ロールで、ロールの割り当てや他のROOTロール専用の権限を除く、ほとんどのコンテンツの管理権限を持ちます。"
// }

router.delete('/rbac/deleteRbacRole', deleteRbacRoleController) // RBACロールを削除
// https://localhost:9999/rbac/deleteRbacRole
// cookie: uuid, token
// {
// 	"roleName": "administrator"
// }

router.get('/rbac/getRbacRole', getRbacRoleController) // RBACロールを取得
// https://localhost:9999/rbac/getRbacRole
// cookie: uuid, token
//
// Query:
// roleName
// roleType
// roleColor
// roleDescription
// page
// pageSize

router.post('/rbac/updateApiPathPermissionsForRole', updateApiPathPermissionsForRoleController) // ロールのAPIパス権限を更新
// https://localhost:9999/rbac/updateApiPathPermissionsForRole
// cookie: uuid, token
// {
// 	"roleName": "administrator",
// 	"apiPathPermissions": [
// 		"/luo/tian/yi"
// 	]
// }

router.post('/rbac/adminUpdateUserRole', adminUpdateUserRoleController) // 管理者がユーザーロールを更新 // WARN: 管理者のみ
// https://localhost:9999/rbac/adminUpdateUserRole
// cookie: uuid, token
// uuidかuidのどちらか一方で可
// {
// 	"uuid": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
// 	"uid": 123,
// 	"newRoles": [
// 		"administrator",
// 		"user"
// 	]
// }

router.get('/rbac/adminGetUserRolesByUid', adminGetUserRolesByUidController) // UIDでユーザーのロールを取得
// https://localhost:9999/rbac/adminGetUserRolesByUid
// cookie: uuid, token
//
// Query:
// uid


















router.get('/secret/getStgEnvBackEndSecret', getStgEnvBackEndSecretController) // ステージング環境のバックエンド環境変数シークレットを取得
// https://localhost:9999/secret/getStgEnvBackEndSecret
// cookie: uuid, token






















// router.post('/02/koa/user/settings/userSettings/save', saveUserSettingsByUUID)
// // http://localhost:9999/02/koa/user/settings/userSettings/save
// //
// // {
// // 	"uuid": "u00001",
// // 	"systemStyle": "s1",
// // 	"systemColor": "#66CCFF",
// // 	"backgroundAnimation": "true",
// // 	"settingPageLastEnter": "PornHub"
// // }

// router.put('/02/koa/user/settings/userSettings/update', updateUserSettingsByUUID)
// // http://localhost:9999/02/koa/user/settings/userSettings/update
// //
// // {
// // 	"uuid": "u00001",
// // 	"systemStyle": "s1",
// // 	"systemColor": "#66CCFF",
// // 	"backgroundAnimation": "true",
// // 	"settingPageLastEnter": "PornHub"
// // }

// router.get('/02/koa/user/settings/userSettings/get', getUserSettingsByUUID)
// // http://localhost:9999/02/koa/user/settings/userSettings/get?uuid=u00001




// router-end

export default router
