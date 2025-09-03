import mongoose, { InferSchemaType, PipelineStage, ClientSession, startSession } from 'mongoose'
import { createCloudflareImageUploadSignedUrl } from '../cloudflare/index.js'
import { isInvalidEmail, sendMail } from '../common/EmailTool.js'
import { comparePasswordSync, hashPasswordSync } from '../common/HashTool.js'
import { isEmptyObject } from '../common/ObjectTool.js'
import { validateNameField } from '../common/ValidTool.js'
import { generateRandomString, generateSecureRandomString, generateSecureVerificationNumberCode, generateSecureVerificationStringCode } from '../common/RandomTool.js'
import {
	AdminClearUserInfoRequestDto,
	AdminClearUserInfoResponseDto,
	AdminGetUserInfoRequestDto,
	AdminGetUserInfoResponseDto,
	ApproveUserInfoRequestDto,
	ApproveUserInfoResponseDto,
	CheckInvitationCodeRequestDto,
	CheckInvitationCodeResponseDto,
	CheckUsernameRequestDto,
	CheckUsernameResponseDto,
	CheckUserTokenResponseDto,
	CreateInvitationCodeResponseDto,
	DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto,
	GetBlockedUserResponseDto,
	GetMyInvitationCodeResponseDto,
	GetSelfUserInfoRequestDto,
	GetSelfUserInfoResponseDto,
	CheckUserHave2FAResponseDto,
	GetUserAvatarUploadSignedUrlResponseDto,
	GetUserInfoByUidRequestDto,
	GetUserInfoByUidResponseDto,
	GetUserSettingsResponseDto,
	RequestSendChangeEmailVerificationCodeRequestDto,
	RequestSendChangeEmailVerificationCodeResponseDto,
	RequestSendChangePasswordVerificationCodeRequestDto,
	RequestSendChangePasswordVerificationCodeResponseDto,
	RequestSendVerificationCodeRequestDto,
	RequestSendVerificationCodeResponseDto,
	UpdateOrCreateUserInfoRequestDto,
	UpdateOrCreateUserInfoResponseDto,
	UpdateOrCreateUserSettingsRequestDto,
	UpdateOrCreateUserSettingsResponseDto,
	UpdateUserEmailRequestDto,
	UpdateUserEmailResponseDto,
	UpdateUserPasswordRequestDto,
	UpdateUserPasswordResponseDto,
	UseInvitationCodeDto,
	UseInvitationCodeResultDto,
	UserLoginRequestDto,
	UserLoginResponseDto,
	UserRegistrationRequestDto,
	UserRegistrationResponseDto,
	GetSelfUserInfoByUuidResponseDto,
	GetSelfUserInfoByUuidRequestDto,
	CreateUserTotpAuthenticatorResponseDto,
	DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto,
	ConfirmUserTotpAuthenticatorRequestDto,
	ConfirmUserTotpAuthenticatorResponseDto,
	CheckUserHave2FARequestDto,
	CreateUserEmailAuthenticatorResponseDto,
	SendUserEmailAuthenticatorVerificationCodeRequestDto,
	SendUserEmailAuthenticatorVerificationCodeResponseDto,
	CheckEmailAuthenticatorVerificationCodeRequestDto,
	CheckEmailAuthenticatorVerificationCodeResponseDto,
	DeleteUserEmailAuthenticatorRequestDto,
	DeleteUserEmailAuthenticatorResponseDto,
	SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto,
	SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto,
	UserExistsCheckByUIDRequestDto,
	UserExistsCheckByUIDResponseDto,
	UserEmailExistsCheckRequestDto,
	UserEmailExistsCheckResponseDto,
	CheckUserExistsByUuidRequestDto,
	CheckUserExistsByUuidResponseDto,
	AdminEditUserInfoRequestDto,
	AdminEditUserInfoResponseDto,
	GetBlockedUserRequestDto,
	AdminGetUserByInvitationCodeResponseDto,
	ForgotPasswordRequestDto,
	RequestSendForgotPasswordVerificationCodeRequestDto,
	ForgotPasswordResponseDto,
	RequestSendForgotPasswordVerificationCodeResponseDto
} from '../controller/UserControllerDto.js'
import { findOneAndUpdateData4MongoDB, insertData2MongoDB, selectDataFromMongoDB, updateData4MongoDB, selectDataByAggregateFromMongoDB, deleteDataFromMongoDB } from '../dbPool/DbClusterPool.js'
import { DbPoolResultsType, QueryType, SelectType, UpdateType } from '../dbPool/DbClusterPoolTypes.js'
import { UserAuthSchema, UserTotpAuthenticatorSchema, UserChangeEmailVerificationCodeSchema, UserChangePasswordVerificationCodeSchema, UserInfoSchema, UserInvitationCodeSchema, UserSettingsSchema, UserVerificationCodeSchema, UserEmailAuthenticatorSchema, UserEmailAuthenticatorVerificationCodeSchema, UserForgotPasswordVerificationCodeSchema } from '../dbPool/schema/UserSchema.js'
import { getNextSequenceValueService } from './SequenceValueService.js'
import { authenticator } from 'otplib'
import { getI18nLanguagePack } from '../common/i18n.js'
import { abortAndEndSession, commitAndEndSession, createAndStartSession } from '../common/MongoDBSessionTool.js'
import { StorageClassAnalysisSchemaVersion } from '@aws-sdk/client-s3'
import { FollowingSchema } from '../dbPool/schema/FeedSchema.js'
import { checkBlockUserService, checkIsBlockedByOtherUserService } from './BlockService.js'

authenticator.options = { window: 1 } // TOTPに1ウィンドウの猶予を設定

/**
 * ユーザー登録
 * @param userRegistrationRequest ユーザー登録時に必要な情報（ユーザー名、パスワード）
 * @returns UserRegistrationResponseDto ユーザー登録の結果。成功した場合はトークンが含まれる
 */
export const userRegistrationService = async (userRegistrationRequest: UserRegistrationRequestDto): Promise<UserRegistrationResponseDto> => {
	try {
		if (checkUserRegistrationData(userRegistrationRequest)) {
			if (!(await checkInvitationCodeService({ invitationCode: userRegistrationRequest.invitationCode })).isAvailableInvitationCode) { // DELETEME ベータテスト中のみ使用
				console.error('ERROR', 'ユーザー登録に失敗しました：招待コードが無効です')
				return { success: false, message: 'ユーザー登録に失敗しました：招待コードが無効です' }
			}
			const { email, passwordHash, passwordHint, verificationCode, username, userNickname } = userRegistrationRequest
			const emailLowerCase = email.toLowerCase()
			const usernameStandardized = username.trim().normalize();

			if (email && emailLowerCase && verificationCode) {
				// トランザクション開始
				const session = await mongoose.startSession()
				session.startTransaction()

				const now = new Date().getTime()
				const { collectionName, schemaInstance } = UserAuthSchema
				type UserAuth = InferSchemaType<typeof schemaInstance>

				const userAuthWhere: QueryType<UserAuth> = {
					emailLowerCase,
				}
				const userAuthSelect: SelectType<UserAuth> = { emailLowerCase: 1 }
				try {
					const useAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName, { session })
					if (useAuthResult.result && useAuthResult.result.length >= 1) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'ユーザー登録に失敗しました：メールアドレスが重複しています：', { email, emailLowerCase })
						return { success: false, message: 'ユーザー登録に失敗しました：メールアドレスが重複しています' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'ユーザー登録に失敗しました：メールアドレスの重複チェック中に例外が発生しました：', error, { email, emailLowerCase })
					return { success: false, message: 'ユーザー登録に失敗しました：メールアドレスの重複チェック中に例外が発生しました' }
				}

				const { collectionName: userVerificationCodeCollectionName, schemaInstance: userVerificationCodeSchemaInstance } = UserVerificationCodeSchema
				type UserVerificationCode = InferSchemaType<typeof userVerificationCodeSchemaInstance>
				const verificationCodeWhere: QueryType<UserVerificationCode> = {
					emailLowerCase,
					verificationCode,
					overtimeAt: { $gte: now },
				}

				const verificationCodeSelect: SelectType<UserVerificationCode> = {
					emailLowerCase: 1, // ユーザーのメールアドレス
				}

				try {
					const verificationCodeResult = await selectDataFromMongoDB<UserVerificationCode>(verificationCodeWhere, verificationCodeSelect, userVerificationCodeSchemaInstance, userVerificationCodeCollectionName, { session })
					if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'ユーザー登録に失敗しました：検証に失敗しました')
						return { success: false, message: 'ユーザー登録に失敗しました：検証に失敗しました' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'ユーザー登録に失敗しました：検証リクエストに失敗しました')
					return { success: false, message: 'ユーザー登録に失敗しました：検証リクエストに失敗しました' }
				}

				const passwordHashHash = hashPasswordSync(passwordHash)
				const token = generateSecureRandomString(64)
				const uid = (await getNextSequenceValueService('user', 1, 1, session)).sequenceValue
				const uuid = generateRandomString(24)

				const userAuthData: UserAuth = {
					UUID: uuid,
					uid,
					email,
					emailLowerCase,
					passwordHashHash,
					token,
					passwordHint,
					roles: ['user'], // 新規ユーザーは常に'user'ロールを持つ
					authenticatorType: 'none', // 新規登録ユーザーはデフォルトで2FAを有効にしていない
					userCreateDateTime: now,
					editDateTime: now,
				}

				const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema
				type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>
				const userInfoData: UserInfo = {
					UUID: uuid,
					uid,
					username: usernameStandardized,
					userNickname,
					label: [] as UserInfo['label'], // TODO: Mongoose issue: #12420
					userLinkedAccounts: [] as UserInfo['userLinkedAccounts'], // TODO: Mongoose issue: #12420
					isUpdatedAfterReview: true,
					editDateTime: now,
					createDateTime: now,
				}

				const { collectionName: userSettingsCollectionName, schemaInstance: userSettingsSchemaInstance } = UserSettingsSchema
				type UserSettings = InferSchemaType<typeof userSettingsSchemaInstance>
				const userSettingsData: UserSettings = {
					UUID: uuid,
					uid,
					userPrivaryVisibilitiesSetting: [] as UserSettings['userPrivaryVisibilitiesSetting'], // TODO: Mongoose issue: #12420
					userLinkedAccountsVisibilitiesSetting: [] as UserSettings['userLinkedAccountsVisibilitiesSetting'], // TODO: Mongoose issue: #12420
					editDateTime: now,
					createDateTime: now,
				}

				try {
					const saveUserAuthResult = await insertData2MongoDB(userAuthData, schemaInstance, collectionName, { session })
					const saveUserInfoResult = await insertData2MongoDB(userInfoData, userInfoSchemaInstance, userInfoCollectionName, { session })
					const saveUserSettingsResult = await insertData2MongoDB(userSettingsData, userSettingsSchemaInstance, userSettingsCollectionName, { session })
					if (saveUserAuthResult.success && saveUserInfoResult.success && saveUserSettingsResult.success) {
						const invitationCode = userRegistrationRequest.invitationCode
						if (invitationCode) {
							const useInvitationCodeDto: UseInvitationCodeDto = {
								invitationCode,
								registrantUid: uid,
								registrantUUID: uuid,
							}
							try {
								const useInvitationCodeResult = await useInvitationCode(useInvitationCodeDto)
								if (!useInvitationCodeResult.success) {
									console.error('ERROR', 'ユーザーが招待コードを使用する際にエラーが発生しました：招待コード使用者の更新に失敗しました')
								}
							} catch (error) {
								console.error('ERROR', 'ユーザーが招待コードを使用する際にエラーが発生しました：招待コード使用者の更新中にエラーが発生しました：', error)
							}
						}
						await session.commitTransaction()
						session.endSession()
						return { success: true, uid, token, UUID: uuid, message: 'ユーザー登録に成功しました' }
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'ユーザー登録に失敗しました：MongoDBへのデータ挿入に失敗しました：')
						return { success: false, message: 'ユーザー登録に失敗しました：データの保存に失敗しました' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'ユーザー登録に失敗しました：MongoDBへのデータ挿入中に例外が発生しました：', error)
					return { success: false, message: 'ユーザー登録に失敗しました：ユーザー情報を保存できませんでした' }
				}
			} else {
				console.error('ERROR', 'ユーザー登録に失敗しました：email、emailLowerCase、またはverificationCodeが空の可能性があります')
				return { success: false, message: 'ユーザー登録に失敗しました：アカウント情報の生成に失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザー登録に失敗しました：userRegistrationDataの非空検証に失敗しました')
			return { success: false, message: 'ユーザー登録に失敗しました：非空検証に失敗しました' }
		}
	} catch (error) {
		console.error('userRegistrationService関数で例外が発生しました', error)
		return { success: false, message: 'ユーザー登録に失敗しました：プログラムが異常終了しました' }
	}
}

/**
 * ユーザーログイン
 * @param userLoginRequest ユーザーログイン時に必要な情報（ユーザー名、パスワード）
 * @return UserLoginResponseDto ユーザーログインの結果。ログインに成功した場合はトークンが含まれる
 */
export const userLoginService = async (userLoginRequest: UserLoginRequestDto): Promise<UserLoginResponseDto> => {
	try {
		// 1. リクエストパラメータが正当であるかを確認
		if (!checkUserLoginRequest(userLoginRequest)) {
			console.error('ERROR', 'ユーザーログイン時にプログラム例外が発生しました：ユーザー情報の検証に失敗しました')
			return { success: false, message: 'ユーザー情報の検証に失敗しました' }
		}

		const { email, passwordHash, clientOtp } = userLoginRequest
		const emailLowerCase = email.toLowerCase()
		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const userLoginWhere: QueryType<UserAuth> = { emailLowerCase }
		const userLoginSelect: SelectType<UserAuth> = {
			email: 1,
			UUID: 1,
			uid: 1,
			token: 1,
			passwordHint: 1,
			passwordHashHash: 1,
			authenticatorType: 1,
		}

		// 2. ユーザーのセキュリティ情報を取得
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userLoginWhere, userLoginSelect, schemaInstance, collectionName)
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `ユーザーログイン（ユーザー情報クエリ）時に例外が発生しました、ユーザーメール：【${email}】、ユーザー未登録または情報異常`)
			return { success: false, email, message: 'ユーザー未登録または情報異常' }
		}

		const userAuthData = userAuthResult.result[0]
		const { token, uid, UUID: uuid, authenticatorType } = userAuthData
		if (!token || uid === null || uid === undefined || !uuid) {
			console.error('ERROR', `ログインに失敗しました、ユーザーのセキュリティ情報を取得できませんでした`)
			return { success: false, message: 'ログインに失敗しました、ユーザーのセキュリティ情報を取得できませんでした' }
		}

		// 3. ユーザーのパスワードが正しいかを確認
		const isCorrectPassword = comparePasswordSync(passwordHash, userAuthData.passwordHashHash)
		if (!isCorrectPassword) {
			return { success: false, email, passwordHint: userAuthData.passwordHint, message: 'ユーザーのパスワードが間違っています' }
		}

		// 4. ユーザーが2FAを有効にしているか判断
		if (authenticatorType === 'totp') { // 4.1 TOTP
			const maxAttempts	 = 5 // 最大試行回数
			const lockTime = 60 * 60 * 1000 // クールダウン時間
			const now = new Date().getTime()

			if (!clientOtp) {
				console.error('ログインに失敗しました、TOTPが有効ですがユーザーが確認コードを提供していません', authenticatorType )
				return { success: false, message:"ログインに失敗しました、TOTPが有効ですがユーザーが確認コードを提供していません", authenticatorType }
			}

			const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
			type UserAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
			const userTotpAuthenticatorWhere: QueryType<UserAuthenticator> = {
				UUID: uuid,
				enabled: true,
			}

			if (clientOtp.length > 6) { // 6桁より大きい場合、TOTPリカバリーコードを使用してログインしたと見なす（ログイン成功後、TOTP 2FAは削除される）
				const userTotpAuthenticatorSelect: SelectType<UserAuthenticator> = {
					recoveryCodeHash: 1,
				}

				const selectResult = await selectDataFromMongoDB<UserAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)

				if (!selectResult.success || selectResult.result.length !== 1) {
					console.error('ERROR', 'ログインに失敗しました、検証データの取得に失敗しました - 1')
					return { success: false, message: 'ログインに失敗しました、検証データの取得に失敗しました - 1', authenticatorType }
				}

				const recoveryCodeHash = selectResult.result[0].recoveryCodeHash
				const isCorrectRecoveryCode = comparePasswordSync(clientOtp, recoveryCodeHash)

				if (!isCorrectRecoveryCode) {
					console.error('ERROR', 'ログインに失敗しました、リカバリーコードが間違っています')
					return { success: false, message: 'ログインに失敗しました、リカバリーコードが間違っています', authenticatorType }
				}

				const session = await mongoose.startSession()
				session.startTransaction()

				const deleteTotpAuthenticatorByRecoveryCodeData: DeleteTotpAuthenticatorByRecoveryCodeParametersDto = {
					email,
					recoveryCodeHash,
					session
				}
				const deleteResult = await deleteTotpAuthenticatorByRecoveryCode(deleteTotpAuthenticatorByRecoveryCodeData) // リカバリーコードでログインに成功した場合、TOTP 2FAを削除する

				if (!deleteResult.success) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'ログインに失敗しました、TOTP 2FAを削除できませんでした')
					return { success: false, message: 'ログインに失敗しました、TOTP 2FAを削除できませんでした', authenticatorType }
				}

				await session.commitTransaction()
				session.endSession()
				return { success: true, email, uid, token, UUID: uuid, message: 'リカバリーコードを使用してログインに成功しました、あなたのTOTP 2FAは削除されました', authenticatorType }
			} else { // 6桁以下の場合、TOTP確認コードまたはTOTPバックアップコードを使用してログインしたと見なす。まずTOTP確認コードとして試し、検証に失敗した場合はTOTPバックアップコードとして試す。両方失敗した場合はログイン失敗を応答する
				const userTotpAuthenticatorSelect: SelectType<UserAuthenticator> = {
					secret: 1,
					backupCodeHash: 1,
					lastAttemptTime: 1,
					attempts: 1,
				}

				const selectResult = await selectDataFromMongoDB<UserAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)

				if (!selectResult.success || selectResult.result.length !== 1) {
					console.error('ERROR', 'ログインに失敗しました、検証データの取得に失敗しました - 2')
					return { success: false, message: 'ログインに失敗しました、検証データの取得に失敗しました - 2', authenticatorType }
				}

				let attempts = selectResult.result[0].attempts

				const totpSecret = selectResult.result[0].secret
				const listOfBackupCodeHash = selectResult.result[0].backupCodeHash

				// ユーザーのログイン頻度を制限する
				if (selectResult.result[0].attempts >= maxAttempts) {
					const lastAttemptTime = new Date(selectResult.result[0].lastAttemptTime).getTime();
					if (now - lastAttemptTime < lockTime) {
						attempts += 1
						console.warn('WARN', 'WARNING', 'ユーザーログインに失敗しました、最大試行回数に達しました、しばらくしてからもう一度お試しください');
						return { success: false, message: 'ログインに失敗しました、最大試行回数に達しました、しばらくしてからもう一度お試しください', isCoolingDown: true, authenticatorType };
					} else {
						attempts = 0
					}

					//トランザクション開始
					const session = await mongoose.startSession()
					session.startTransaction()

					const userLoginByBackupCodeUpdate: UpdateType<UserAuthenticator> = {
						attempts: attempts,
						lastAttemptTime: now,
					}
					const updateAuthenticatorResult = await findOneAndUpdateData4MongoDB<UserAuthenticator>(userTotpAuthenticatorWhere, userLoginByBackupCodeUpdate, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

					if (!updateAuthenticatorResult.success) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'ログインに失敗しました、最終試行時間または試行回数の更新に失敗しました')
						return { success: false, message: 'ログインに失敗しました、最終試行時間または試行回数の更新に失敗しました', isCoolingDown: true, authenticatorType }
					}
				}

				if (!authenticator.check(clientOtp, totpSecret)) {
					attempts += 1
					let useCorrectBackupCode = false // ユーザーが正しいバックアップコードを使用したかどうか。
					const newBackupCodeHash = []
					listOfBackupCodeHash.forEach( backupCodeHash => {
						const isCorrectBackupCode = comparePasswordSync(clientOtp, backupCodeHash)
						if (isCorrectBackupCode) {
							useCorrectBackupCode = true
						} else {
							newBackupCodeHash.push(backupCodeHash)
						}
					})

					if (!useCorrectBackupCode) {
						console.error('ERROR', 'ログインに失敗しました、確認コードまたはバックアップコードが正しくありません');
						return { success: false, message: 'ログインに失敗しました、確認コードまたはバックアップコードが正しくありません', authenticatorType };
					}
					const session = await mongoose.startSession()
					session.startTransaction()

					const userLoginByBackupCodeUpdate: UpdateType<UserAuthenticator> = {
						backupCodeHash: newBackupCodeHash,
						editDateTime: now,
						attempts,
						lastAttemptTime: now,
					}

					// バックアップコードを使用してログインした後、使用済みのバックアップコード以外のバックアップコードをデータベースに書き戻す（これにより、バックアップコードの再利用が防止される）
					const updateAuthenticatorResult = await findOneAndUpdateData4MongoDB<UserAuthenticator>(userTotpAuthenticatorWhere, userLoginByBackupCodeUpdate, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

					if (!updateAuthenticatorResult.success) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'ログインに失敗しました、バックアップコードの更新に失敗しました')
						return { success: false, message: 'ログインに失敗しました、バックアップコードの更新に失敗しました', authenticatorType }
					}

					await commitAndEndSession(session)
					return { success: true, email, uid, token, UUID: uuid, message: 'バックアップコードを使用してログインに成功しました', authenticatorType }
				} else {
					return { success: true, email, uid, token, UUID: uuid, message: 'TOTP確認コードを使用してログインに成功しました', authenticatorType }
				}
			}
		} else if (authenticatorType === 'email') {
			const { verificationCode } = userLoginRequest
			if (!verificationCode) {
				console.error('ERROR', 'ログインに失敗しました、メール認証が有効ですがユーザーが確認コードを提供していません')
				return { success: false, message: 'ログインに失敗しました、メール認証が有効ですがユーザーが確認コードを提供していません', authenticatorType }
			}

			if (verificationCode.length !== 6) {
				console.error('ERROR', 'ログインに失敗しました、確認コードの長さが間違っています')
				return { success: false, message: 'ログインに失敗しました、確認コードの長さが間違っています', authenticatorType }
			}

			const checkVerificationCodeData = {
				email: emailLowerCase,
				verificationCode: verificationCode
			}

			if (!(await checkEmailAuthenticatorVerificationCodeService(checkVerificationCodeData)).success) {
				console.error('ERROR', 'ログインに失敗しました、確認コードが間違っています')
				return { success: false, message: 'ログインに失敗しました、確認コードが間違っています', authenticatorType }
			}

			return { success: true, email, uid, token, UUID: uuid, message: 'ユーザーログインに成功しました', authenticatorType }
		} else {
			return { success: true, email, uid, token, UUID: uuid, message: 'ユーザーログインに成功しました', authenticatorType: 'none' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーログイン時にプログラム例外が発生しました：', error)
		return { success: false, message: 'ユーザーログイン時にプログラム例外が発生しました' }
	}
}

/**
 * ユーザーのメールアドレスが存在するかどうかを確認する（メールアドレスが既に登録されているかどうかを確認する）
 * @param checkUserExistsCheckRequest ユーザーが存在するかどうかを確認するために必要な情報（ユーザーのメールアドレス）
 * @return UserExistsCheckResponseDto 確認結果。存在する場合またはクエリに失敗した場合はexists: true
 */
export const userEmailExistsCheckService = async (userEmailExistsCheckRequest: UserEmailExistsCheckRequestDto): Promise<UserEmailExistsCheckResponseDto> => {
	try {
		if (checkUserEmailExistsCheckRequest(userEmailExistsCheckRequest)) {
			const { collectionName, schemaInstance } = UserAuthSchema
			type UserAuth = InferSchemaType<typeof schemaInstance>
			const where: QueryType<UserAuth> = {
				emailLowerCase: userEmailExistsCheckRequest.email.toLowerCase(),
			}
			const select: SelectType<UserAuth> = {
				emailLowerCase: 1,
			}

			let result: DbPoolResultsType<UserAuth>
			try {
				result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
			} catch (error) {
				console.error('ERROR', 'ユーザーのメールアドレスが存在するかどうかを確認（ユーザーをクエリ）する際に例外が発生しました：', error)
				return { success: false, exists: false, message: 'ユーザーのメールアドレスが存在するかどうかを確認する際に例外が発生しました' }
			}

			if (result && result.success && result.result) {
				if (result.result?.length > 0) {
					return { success: true, exists: true, message: 'ユーザーのメールアドレスは既に存在します' }
				} else {
					return { success: true, exists: false, message: 'ユーザーのメールアドレスは存在しません' }
				}
			} else {
				return { success: false, exists: false, message: 'メールアドレスのクエリに失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーのメールアドレスが存在するかどうかを確認する際に失敗しました：パラメータが不正です')
			return { success: false, exists: false, message: 'ユーザーのメールアドレスが存在するかどうかを確認する際に失敗しました：パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーのメールアドレスが存在するかどうかを確認する際にエラーが発生しました：不明なエラー', error)
		return { success: false, exists: false, message: 'ユーザーのメールアドレスが存在するかどうかを確認する際にエラーが発生しました：不明なエラー' }
	}
}

/**
 * ユーザーのメールアドレスを変更する
 * @param updateUserEmailRequest ユーザーのメールアドレス変更リクエストのパラメータ
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns ユーザーのメールアドレス変更リクエストのレスポンス
 */
export const updateUserEmailService = async (updateUserEmailRequest: UpdateUserEmailRequestDto, cookieUid: number, cookieToken: string): Promise<UpdateUserEmailResponseDto> => {
	try {
		// TODO: 古いメールアドレスにメールを送信して確認する
		if (await checkUserToken(cookieUid, cookieToken)) {
			if (checkUpdateUserEmailRequest(updateUserEmailRequest)) {
				const { uid, oldEmail, newEmail, passwordHash, verificationCode } = updateUserEmailRequest
				const now = new Date().getTime()

				if (cookieUid !== uid) {
					console.error('ERROR', 'ユーザーのメールアドレスの更新に失敗しました。cookieのUIDがメールアドレス変更時のUIDと異なります', { cookieUid, uid, oldEmail })
					return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。正しいユーザーが指定されていません' }
				}

				const oldEmailLowerCase = oldEmail.toLowerCase()
				const newEmailLowerCase = newEmail.toLowerCase()

				// トランザクション開始
				const session = await mongoose.startSession()
				session.startTransaction()

				const { collectionName, schemaInstance } = UserAuthSchema
				type UserAuth = InferSchemaType<typeof schemaInstance>

				const userAuthWhere: QueryType<UserAuth> = { uid, emailLowerCase: oldEmailLowerCase, cookieToken } // uid、emailLowerCase、tokenを使用して、ユーザーが自分自身のメールアドレスを更新していることを確認する
				const userAuthSelect: SelectType<UserAuth> = { passwordHashHash: 1, emailLowerCase: 1 }
				try {
					const userAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName, { session })
					const userAuthData = userAuthResult.result
					if (userAuthData) {
						if (userAuthData.length !== 1) { // 1人のユーザーのメールアドレスのみを更新することを確認
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', 'ユーザーのメールアドレスの更新に失敗しました。0人または複数のユーザーに一致しました', { uid, oldEmail })
							return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。正しいユーザーが見つかりません' }
						}

						const isCorrectPassword = comparePasswordSync(passwordHash, userAuthData[0].passwordHashHash) // メールアドレス更新時に入力されたパスワードが正しいことを確認
						if (!isCorrectPassword) {
							console.error('ERROR', 'ユーザーのメールアドレスの更新に失敗しました。パスワードが正しくありません', { uid, oldEmail })
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。パスワードが正しくありません' }
						}
					}
				} catch (error) {
					console.error('ERROR', 'ユーザーのメールアドレスの更新に失敗しました。ユーザーのパスワード検証中にプログラム例外が発生しました', error, { uid, oldEmail })
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					return { success: false, message: 'ユーザー登録に失敗しました：ユーザーのパスワードの検証に失敗しました' }
				}

				try {
					const { collectionName: userChangeEmailVerificationCodeCollectionName, schemaInstance: userChangeEmailVerificationCodeSchemaInstance } = UserChangeEmailVerificationCodeSchema
					type UserChangeEmailVerificationCode = InferSchemaType<typeof userChangeEmailVerificationCodeSchemaInstance>
					const verificationCodeWhere: QueryType<UserChangeEmailVerificationCode> = {
						emailLowerCase: oldEmailLowerCase,
						verificationCode,
						overtimeAt: { $gte: now },
					}

					const verificationCodeSelect: SelectType<UserChangeEmailVerificationCode> = {
						emailLowerCase: 1, // ユーザーのメールアドレス
					}

					const verificationCodeResult = await selectDataFromMongoDB<UserChangeEmailVerificationCode>(verificationCodeWhere, verificationCodeSelect, userChangeEmailVerificationCodeSchemaInstance, userChangeEmailVerificationCodeCollectionName, { session })
					if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'メールアドレスの変更に失敗しました：検証に失敗しました')
						return { success: false, message: 'メールアドレスの変更に失敗しました：検証に失敗しました' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'メールアドレスの変更に失敗しました：検証リクエストに失敗しました')
					return { success: false, message: 'メールアドレスの変更に失敗しました：検証リクエストに失敗しました' }
				}

				const updateUserEmailWhere: QueryType<UserAuth> = {
					uid,
				}
				const updateUserEmailUpdate: QueryType<UserAuth> = {
					email: newEmail,
					emailLowerCase: newEmailLowerCase,
					editDateTime: new Date().getTime(),
				}
				try {
					const updateResult = await updateData4MongoDB(updateUserEmailWhere, updateUserEmailUpdate, schemaInstance, collectionName)
					if (updateResult && updateResult.success && updateResult.result) {
						if (updateResult.result.matchedCount > 0 && updateResult.result.modifiedCount > 0) {
							await session.commitTransaction()
							session.endSession()
							return { success: true, message: 'ユーザーのメールアドレスが正常に更新されました' }
						} else {
							console.error('ERROR', 'ユーザーのメールアドレス更新時に、更新件数が0件でした', { uid, oldEmail, newEmail })
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。ユーザーのメールアドレスを更新できません' }
						}
					} else {
						console.error('ERROR', 'ユーザーのメールアドレス更新時に、更新件数が0件でした', { uid, oldEmail, newEmail })
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。ユーザーのメールアドレスを更新できません' }
					}
				} catch (error) {
					console.error('ERROR', 'ユーザーのメールアドレス更新時にエラーが発生しました', { uid, oldEmail, newEmail }, error)
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。ユーザーIDの更新時にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', 'ユーザーのメールアドレス更新時に失敗しました。元のデータが取得できませんでした')
				return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。ユーザーの元の情報を取得できませんでした。データが空の可能性があります' }
			}
		} else {
			console.error('ERROR', 'ユーザーのメールアドレス更新時に失敗しました。不正なユーザーです')
			return { success: false, message: 'ユーザーのメールアドレスの更新に失敗しました。不正なユーザーです' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーのメールアドレス変更に失敗しました。不明なエラー：', error)
		return { success: false, message: 'ユーザーのメールアドレス変更に失敗しました。不明なエラー' }
	}
}

/**
 * UIDに基づいてユーザー情報を更新または作成する
 * @param updateUserInfoRequest ユーザー情報の更新または作成時のリクエストパラメータ
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns ユーザー情報の更新または作成リクエストの結果
 */
export const updateOrCreateUserInfoService = async (updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto, uuid: string, token: string): Promise<UpdateOrCreateUserInfoResponseDto> => {
	try {
		if (!checkUpdateOrCreateUserInfoRequest(updateOrCreateUserInfoRequest)) {
			console.error('ERROR', 'ユーザー情報の更新時に失敗しました、パラメータの検証に失敗しました', { updateOrCreateUserInfoRequest, uuid })
			return { success: false, message: 'ユーザーデータの更新時に失敗しました、パラメータの検証に失敗しました' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', 'ユーザー情報の更新時に失敗しました、トークンの検証に失敗しました、不正なユーザーです！', { updateOrCreateUserInfoRequest, uuid })
			return { success: false, message: 'ユーザーデータの更新時に失敗しました、不正なユーザーです！' }
		}

		const { collectionName, schemaInstance } = UserInfoSchema
		type UserInfo = InferSchemaType<typeof schemaInstance>
		const { username, userNickname } = updateOrCreateUserInfoRequest

		const usernameStandardized = username.trim().normalize();

		if (usernameStandardized) {
			const checkUserNameResult = await checkUsernameService({ username: usernameStandardized }, [uuid]) // exclude self when check duplicate username
			if (!checkUserNameResult.success || !checkUserNameResult.isAvailableUsername) {
				console.error('ERROR', 'ユーザー情報の更新に失敗しました、ユーザー名が重複しています', { updateOrCreateUserInfoRequest, uuid })
				return { success: false, message: 'ユーザー情報の更新に失敗しました、ユーザー名が重複しています' }
			}
		}

		if (userNickname && !validateNameField(userNickname)) {
			console.error('ERROR', 'ユーザー情報の更新に失敗しました、ユーザーのニックネームが不正です、ユーザーUUID:', uuid)
			return { success: false, message: 'ユーザー情報の更新に失敗しました、ユーザーのニックネームが不正です' }
		}

		const updateUserInfoWhere: QueryType<UserInfo> = {
			UUID: uuid,
		}
		const updateUserInfoUpdate: UpdateType<UserInfo> = {
			...updateOrCreateUserInfoRequest,
			username: usernameStandardized, // usernameは特殊処理されているため、前の展開を上書きする必要がある
			label: updateOrCreateUserInfoRequest.label as UserInfo['label'], // TODO: Mongoose issue: #12420
			userLinkedAccounts: updateOrCreateUserInfoRequest.userLinkedAccounts as UserInfo['userLinkedAccounts'], // TODO: Mongoose issue: #12420
			isUpdatedAfterReview: true,
			editOperatorUUID: uuid,
			editDateTime: new Date().getTime(),
		}
		const updateResult = await findOneAndUpdateData4MongoDB(updateUserInfoWhere, updateUserInfoUpdate, schemaInstance, collectionName)

		if (!updateResult || !updateResult.success || !updateResult.result) {
			console.error('ERROR', 'ユーザー情報の更新に失敗しました、ユーザーデータが返されませんでした', { updateOrCreateUserInfoRequest, uuid })
			return { success: false, message: 'ユーザー情報の更新に失敗しました、ユーザーデータが返されませんでした' }
		}

		return { success: true, message: 'ユーザー情報の更新に成功しました', result: updateResult.result }
	} catch (error) {
		console.error('ERROR', 'ユーザー情報の更新時に失敗しました、不明な例外', error)
		return { success: false, message: 'ユーザーデータの更新時に失敗しました、不明な例外' }
	}
}

/**
 * UIDに基づいてユーザーが存在するかどうかを取得する
 * @param UserExistsCheckByUIDRequestDto ユーザーが存在するかどうかを取得するリクエストパラメータ
 * @returns ユーザーが存在するかどうかを取得するリクエスト結果
 */
export const checkUserExistsByUIDService = async (userExistsCheckByUIDRequest: UserExistsCheckByUIDRequestDto): Promise<UserExistsCheckByUIDResponseDto> => {
	try {
		if (!!userExistsCheckByUIDRequest.uid) {
			const { uid } = userExistsCheckByUIDRequest
			const { collectionName, schemaInstance } = UserInfoSchema
			type UserInfo = InferSchemaType<typeof schemaInstance>
			const where: QueryType<UserInfo> = { uid }
			const select: SelectType<UserInfo> = { uid: 1 }
			const result = await selectDataFromMongoDB<UserInfo>(where, select, schemaInstance, collectionName)
			if (result.success) {
				if (result.result?.length === 1) {
					return { success: true, exists: true, message: 'ユーザーは存在します' }
				} else {
					return { success: true, exists: false, message: 'ユーザーは存在しません' }
				}
			} else {
				console.error('ERROR', 'ユーザーが存在するかどうかの取得に失敗しました、クエリに失敗しました')
				return { success: false, exists: false, message: 'ユーザーが存在するかどうかの取得に失敗しました、クエリに失敗しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーが存在するかどうかの取得に失敗しました、リクエストパラメータが不正です')
			return { success: false, exists: false, message: 'ユーザーが存在するかどうかの取得に失敗しました、リクエストパラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーが存在するかどうかの取得に失敗しました、不明な例外', error)
		return { success: false, exists: false, message: 'ユーザーが存在するかどうかの取得に失敗しました、不明な例外' }
	}
}

/**
 * 【非推奨】uidで現在ログインしているユーザーの情報を取得する
 * // DELETE ME: 使用禁止！このAPIはUUIDの普及に伴い段階的に置き換えられるべきです
 * @param getSelfUserInfoRequest 現在ログインしているユーザーの情報を取得するリクエストパラメータ
 * @returns 取得した現在ログインしているユーザーの情報
 */
export const getSelfUserInfoService = async (getSelfUserInfoRequest: GetSelfUserInfoRequestDto): Promise<GetSelfUserInfoResponseDto> => {
	try {
		const { uid, token } = getSelfUserInfoRequest
		if (!uid || !token) {
			console.error('ERROR', 'UIDによるユーザー情報の取得に失敗しました、uidまたはtokenが空です')
			return { success: false, message: 'UIDによるユーザー情報の取得に失敗しました、必須パラメータが空です' }
		}

		const UUID = await getUserUuid(uid) // DELETE ME: これはUID互換性のためのコードです。UUIDの普及に伴い、uidは段階的に廃止されます

		if (!await checkUserToken(uid, token)) {
			console.error('ERROR', 'UIDによるユーザー情報の取得時に失敗しました、ユーザーのトークン検証に失敗しました、不正なユーザーです！')
			return { success: false, message: 'UIDによるユーザー情報の取得時に失敗しました、不正なユーザーです！' }
		}

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const selfUserInfoPipeline: PipelineStage[] = [
			{
				$match: {
					UUID
				},
			},
			{
				$lookup: {
					from: 'user-infos',
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data'
				}
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true // ユーザー情報がないユーザーを保持
				},
			},
			{
				$lookup: {
					from: 'user-invitation-codes',
					localField: 'UUID',
					foreignField: 'assigneeUUID',
					as: 'invitation_codes_data'
				},
			},
			{
				$unwind: {
					path: '$invitation_codes_data',
					preserveNullAndEmptyArrays: true
				},
			},
			{
				$project: {
					email: 1, // ユーザーのメールアドレス
					userCreateDateTime: 1, // ユーザー作成日時
					roles: 1, // ユーザーのロール
					uid: 1, // ユーザーUID
					UUID: 1, // UUID
					authenticatorType: 1, // 2FAのタイプ
					userNickname: '$user_info_data.userNickname', // ユーザーのニックネーム
					username: '$user_info_data.username', // ユーザー名
					label: '$user_info_data.label', // ユーザーラベル
					avatar: '$user_info_data.avatar', // ユーザーのアバター
					userBannerImage: '$user_info_data.userBannerImage', // ユーザーのバナー画像
					signature: '$user_info_data.signature', // ユーザーの署名
					gender: '$user_info_data.gender', // ユーザーの性別
					invitationCode: '$invitation_codes_data.invitationCode', // ユーザーの招待コード
				}
			}
		]

		try {
			const userSelfInfoResult = await selectDataByAggregateFromMongoDB<UserAuth>(userAuthSchemaInstance, userAuthCollectionName, selfUserInfoPipeline)
			if (userSelfInfoResult && userSelfInfoResult.success) {
				const userInfo = userSelfInfoResult?.result
				if (userInfo?.length === 0) {
					return { success: true, message: 'ユーザーはユーザー情報を入力していません', result: undefined }
				} else if (userInfo?.length === 1 && userInfo?.[0]) {
					return { success: true, message: 'ユーザー情報の取得に成功しました', result: { ...userInfo[0], email: userInfo[0].email, userCreateDateTime: userInfo[0].userCreateDateTime, roles: userInfo[0].roles } }
				} else {
					console.error('ERROR', 'UIDによるユーザー情報の取得時に失敗しました、取得した結果の長さが1ではありません')
					return { success: false, message: 'UIDによるユーザー情報の取得時に失敗しました、結果が異常です' }
				}
			} else {
				console.error('ERROR', 'UUIDによるユーザー情報の取得時に失敗しました、取得した結果が空です')
				return { success: false, message: 'UIDによるユーザー情報の取得時に失敗しました、結果が空です' }
			}
		} catch (error) {
			console.error('ERROR', 'UIDによるユーザー情報の取得時にエラーが発生しました、データクエリ時にエラーが発生しました：', error)
			return { success: false, message: 'UIDによるユーザー情報の取得時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', 'UIDによるユーザー情報の取得時にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'UIDによるユーザー情報の取得時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * UUIDで現在ログインしているユーザーの情報を取得する
 * @param getSelfUserInfoRequest UUIDで現在ログインしているユーザーの情報を取得するリクエストパラメータ
 * @returns UUIDで現在ログインしているユーザーの情報を取得するリクエストレスポンス
 */
export const getSelfUserInfoByUuidService = async (getSelfUserInfoByUuidRequest: GetSelfUserInfoByUuidRequestDto): Promise<GetSelfUserInfoByUuidResponseDto> => {
	try {
		const { uuid, token } = getSelfUserInfoByUuidRequest
		if (!uuid || !token) {
			console.error('ERROR', 'UUIDによるユーザー情報の取得に失敗しました、uuidまたはtokenが空です')
			return { success: false, message: 'UUIDによるユーザー情報の取得に失敗しました、必須パラメータが空です' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', 'UUIDによるユーザー情報の取得時に失敗しました、ユーザーのトークン検証に失敗しました、不正なユーザーです！')
			return { success: false, message: 'UUIDによるユーザー情報の取得時に失敗しました、不正なユーザーです！' }
		}

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const selfUserInfoPipeline: PipelineStage[] = [
			{
				$match: {
					UUID: uuid
				},
			},
			{
				$lookup: {
					from: 'user-infos',
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data'
				}
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true // ユーザー情報がないユーザーを保持
				},
			},
			{
				$lookup: {
					from: 'user-invitation-codes',
					localField: 'UUID',
					foreignField: 'assigneeUUID',
					as: 'invitation_codes_data'
				},
			},
			{
				$unwind: {
					path: '$invitation_codes_data',
					preserveNullAndEmptyArrays: true
				},
			},
			{
				$project: {
					email: 1, // ユーザーのメールアドレス
					userCreateDateTime: 1, // ユーザー作成日時
					roles: 1, // ユーザーのロール
					uid: 1, // ユーザーUID
					UUID: 1, // UUID
					authenticatorType: 1, // 2FAのタイプ
					userNickname: '$user_info_data.userNickname', // ユーザーのニックネーム
					username: '$user_info_data.username', // ユーザー名
					label: '$user_info_data.label', // ユーザーラベル
					avatar: '$user_info_data.avatar', // ユーザーのアバター
					userBannerImage: '$user_info_data.userBannerImage', // ユーザーのバナー画像
					signature: '$user_info_data.signature', // ユーザーの署名
					gender: '$user_info_data.gender', // ユーザーの性別
					invitationCode: '$invitation_codes_data.invitationCode', // ユーザーの招待コード
				}
			}
		]

		try {
			const userSelfInfoResult = await selectDataByAggregateFromMongoDB<UserAuth>(userAuthSchemaInstance, userAuthCollectionName, selfUserInfoPipeline)
			if (userSelfInfoResult && userSelfInfoResult.success) {
				const userInfo = userSelfInfoResult?.result
				if (!userInfo || userInfo.length === 0) {
					return { success: true, message: 'ユーザーはユーザー情報を入力していません', result: undefined }
				} else if (userInfo?.length === 1 && userInfo?.[0]) {
					return { success: true, message: 'ユーザー情報の取得に成功しました', result: { ...userInfo[0], email: userInfo[0].email, userCreateDateTime: userInfo[0].userCreateDateTime, roles: userInfo[0].roles } }
				} else {
					console.error('ERROR', 'UUIDによるユーザー情報の取得時に失敗しました、取得した結果の長さが1ではありません')
					return { success: false, message: 'UUIDによるユーザー情報の取得時に失敗しました、結果が異常です' }
				}
			} else {
				console.error('ERROR', 'UUIDによるユーザー情報の取得時に失敗しました、取得した結果が空です')
				return { success: false, message: 'UUIDによるユーザー情報の取得時に失敗しました、結果が空です' }
			}
		} catch (error) {
			console.error('ERROR', 'UUIDによるユーザー情報の取得時にエラーが発生しました、データクエリ時にエラーが発生しました：', error)
			return { success: false, message: 'UUIDによるユーザー情報の取得時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', 'UUIDによるユーザー情報の取得時にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'UUIDによるユーザー情報の取得時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * uidで（他の）ユーザー情報を取得する
 * @param getUserInfoByUidRequest UIDでユーザー情報を取得するリクエストペイロード
 * @param selectorUuid リクエスト元のUUID
 * @param selectorToken リクエスト元のトークン
 * @returns ユーザー情報取得リクエストの結果
 */
export const getUserInfoByUidService = async (getUserInfoByUidRequest: GetUserInfoByUidRequestDto, selectorUuid?: string, selectorToken?: string): Promise<GetUserInfoByUidResponseDto> => {
	try {
		const { uid } = getUserInfoByUidRequest
		let isHidden = false
		let isBlockedByOther = false

		if (uid === null || uid === undefined) {
			console.error('ERROR', 'ユーザー情報の取得に失敗しました、渡されたuidまたはtokenが空です')
			return { success: false, message: 'ユーザー情報の取得に失敗しました、必須パラメータが空です', isBlockedByOther, isBlocked: false, isHidden }
		}

		const checkBlockUserResult = await checkBlockUserService({ uid }, selectorUuid, selectorToken)
		const checkIsBlockedByOtherUserResult = await checkIsBlockedByOtherUserService({ targetUid: uid }, selectorUuid, selectorToken)

		// 1. 対象ユーザーが現在のユーザーによって非表示にされているかどうかを確認
		if (checkBlockUserResult.isHidden) {
			isHidden = true
		}

		// 2. 現在のユーザーが対象ユーザーによってブロックされているかどうかを確認
		if (checkIsBlockedByOtherUserResult.isBlocked) {
			isBlockedByOther = true
		}

		// 3. 現在のユーザーと対象ユーザーが相互にブロックしているかどうかを確認
		if (checkBlockUserResult.isBlocked && checkIsBlockedByOtherUserResult.isBlocked) {
			return { success: true, message: 'ユーザー情報の取得に失敗しました、あなたとこのユーザーは相互にブロックしています', isBlockedByOther, isBlocked: true, isHidden }
		}

		// 4. 対象ユーザーが現在のユーザーによってブロックされているかどうかを確認
		if (checkBlockUserResult.isBlocked) {
			return { success: true, message: 'ユーザー情報の取得に失敗しました、あなたはこのユーザーをブロックしています', isBlockedByOther, isBlocked: true, isHidden }
		}

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>
		const userAuthWhere: QueryType<UserAuth> = { uid }
		const userAuthSelect: SelectType<UserAuth> = {
			UUID: 1, // UUID
			userCreateDateTime: 1, // ユーザー作成日時
			roles: 1, // ユーザーのロール
		}

		const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema
		type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>
		const getUserInfoWhere: QueryType<UserInfo> = { uid }
		const getUserInfoSelect: SelectType<UserInfo> = {
			label: 1, // ユーザーラベル
			username: 1, // ユーザー名
			userNickname: 1, // ユーザーのニックネーム
			avatar: 1, // ユーザーのアバター
			userBannerImage: 1, // ユーザーのバナー画像
			signature: 1, // ユーザーの署名
			gender: 1, // ユーザーの性別
		}

		try {
			const session = await createAndStartSession()
			const userAuthPromise = selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, userAuthSchemaInstance, userAuthCollectionName)
			const userInfoPromise = selectDataFromMongoDB(getUserInfoWhere, getUserInfoSelect, userInfoSchemaInstance, userInfoCollectionName)
			const [userAuthResult, userInfoResult] = await Promise.all([userAuthPromise, userInfoPromise])
			if (!userAuthResult || !userAuthResult.success || !userInfoResult || !userInfoResult.success) {
				await abortAndEndSession(session)
				console.error('ERROR', 'ユーザー情報の取得時に失敗しました、取得した結果が空です')
				return { success: false, message: 'ユーザー情報の取得時に失敗しました、結果が空です', isBlockedByOther, isBlocked: false, isHidden }
			}
			const userAuth = userAuthResult?.result
			const uuid = userAuth?.[0]?.UUID
			const userInfo = userInfoResult?.result
			if (userInfo?.length !== 1 || !userInfo[0] || userAuth?.length !== 1 || !uuid) {
				await abortAndEndSession(session)
				console.error('ERROR', 'ユーザー情報の取得時に失敗しました、取得した結果の長さが1ではありません')
				return { success: false, message: 'ユーザー情報の取得時に失敗しました、結果が異常です', isBlockedByOther, isBlocked: false, isHidden }
			}

			let isSelf = uuid === selectorUuid // クエリ対象のユーザーが自分自身であるかどうか。
			let isFollowing = false; // このユーザーをフォローしているかどうか、デフォルトではフォローしていない。
			if ( selectorUuid && selectorToken && !isSelf && await checkUserTokenByUUID(selectorUuid, selectorToken)) { // uuidとtokenが渡され、かつユーザーが自分自身でなく、検証に成功した場合、取得対象のユーザーがフォローされているかどうかを確認する。
				const { collectionName: followingSchemaCollectionName, schemaInstance: followingSchemaInstance } = FollowingSchema
				type Following = InferSchemaType<typeof followingSchemaInstance>

				const followingWhere: QueryType<Following> = {
					followerUuid: selectorUuid,
					followingUuid: uuid,
				}
				const followingSelect: SelectType<Following> = {
					followerUuid: 1,
					followingUuid: 1,
					followingType: 1,
				}

				const selectFollowingDataResult = await selectDataFromMongoDB<Following>(followingWhere, followingSelect, followingSchemaInstance, followingSchemaCollectionName, { session })
				const followingResult = selectFollowingDataResult?.result
				if (selectFollowingDataResult.success && followingResult.length === 1) {
					isFollowing = true
				}
			}

			await commitAndEndSession(session)
			return {
				success: true,
				message: 'ユーザー情報の取得に成功しました',
				result: {
					...userInfo[0],
					userCreateDateTime: userAuth[0].userCreateDateTime,
					roles: userAuth[0].roles,
					isFollowing,
					isSelf,
				},
				isBlockedByOther,
				isBlocked: false,
				isHidden,
			}
		} catch (error) {
			console.error('ERROR', 'ユーザー情報の取得時に失敗しました、データクエリ時にエラーが発生しました：', error)
			return { success: false, message: 'ユーザー情報の取得時に失敗しました', isBlockedByOther, isBlocked: false, isHidden }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザー情報の取得時に失敗しました、不明なエラー：', error)
		return { success: false, message: 'ユーザー情報の取得時に失敗しました、不明なエラー', isBlockedByOther: false, isBlocked: false, isHidden: false }
	}
}

/**
 * ユーザーのアバターを更新し、ユーザーがアバターをアップロードするための署名付きURLを取得する。アップロード時間は60秒に制限される
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns ユーザーがアバターをアップロードするための署名付きURLの結果
 */
export const getUserAvatarUploadSignedUrlService = async (uid: number, token: string): Promise<GetUserAvatarUploadSignedUrlResponseDto> => {
	// TODO 画像アップロードロジックは書き直す必要があります。現在、ユーザーが画像のアップロードに失敗しても、データベース内の古いアバターリンクが新しいアバターリンクに置き換えられてしまい、現在の画像は審査プロセスに追加されていません
	try {
		if (await checkUserToken(uid, token)) {
			const now = new Date().getTime()
			const fileName = `avatar-${uid}-${generateSecureRandomString(32)}-${now}`
			const signedUrl = await createCloudflareImageUploadSignedUrl(fileName, 660)
			if (signedUrl && fileName) {
				return { success: true, message: 'アバターのアップロードを開始する準備ができました', userAvatarUploadSignedUrl: signedUrl, userAvatarFilename: fileName }
			} else {
				// TODO 画像アップロードロジックは書き直す必要があります。現在、ユーザーが画像のアップロードに失敗しても、データベース内の古いアバターリンクが新しいアバターリンクに置き換えられてしまい、現在の画像は審査プロセスに追加されていません
				return { success: false, message: 'アップロードに失敗しました、画像アップロードURLを生成できません。もう一度アバターをアップロードしてください' }
			}
		} else {
			console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、不正なユーザーです', { uid })
			return { success: false, message: 'アップロードに失敗しました、アップロード権限を取得できません' }
		}
	} catch (error) {
		console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、エラーメッセージ', error, { uid })
	}
}

/**
 * ユーザーの個人設定データを取得する
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns ユーザーの個人設定データ
 */
export const getUserSettingsService = async (uid: number, token: string): Promise<GetUserSettingsResponseDto> => {
	try {
		if (await checkUserToken(uid, token)) {
			const { collectionName, schemaInstance } = UserSettingsSchema
			type UserSettings = InferSchemaType<typeof schemaInstance>
			const getUserSettingsWhere: QueryType<UserSettings> = {
				uid,
			}
			const getUserSettingsSelect: SelectType<UserSettings> = {
				uid: 1,
				enableCookie: 1,
				themeType: 1,
				themeColor: 1,
				themeColorCustom: 1,
				wallpaper: 1,
				coloredSideBar: 1,
				dataSaverMode: 1,
				noSearchRecommendations: 1,
				noRelatedVideos: 1,
				noRecentSearch: 1,
				noViewHistory: 1,
				openInNewWindow: 1,
				currentLocale: 1,
				timezone: 1,
				unitSystemType: 1,
				devMode: 1,
				showCssDoodle: 1,
				sharpAppearanceMode: 1,
				flatAppearanceMode: 1,
				userPrivaryVisibilitiesSetting: 1,
				userLinkedAccountsVisibilitiesSetting: 1,
				userWebsitePrivacySetting: 1,
				editDateTime: 1,
			}
			try {
				const userSettingsResult = await selectDataFromMongoDB(getUserSettingsWhere, getUserSettingsSelect, schemaInstance, collectionName)
				const userSettings = userSettingsResult?.result?.[0]
				if (userSettingsResult?.success && userSettings) {
					return { success: true, message: 'ユーザー設定の取得に成功しました！', userSettings }
				} else {
					console.error('ERROR', 'ユーザーの個人設定の取得に失敗しました、クエリは成功しましたが、データの取得に失敗したか、データが空です：', { uid })
					return { success: false, message: 'ユーザーの個人設定の取得に失敗しました、データクエリが成功しませんでした' }
				}
			} catch (error) {
				console.error('ERROR', 'ユーザーの個人設定の取得に失敗しました、データクエリ時にエラーが発生しました：', { uid })
				return { success: false, message: 'ユーザーの個人設定の取得に失敗しました、データクエリ時にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', 'ユーザーの個人設定の取得に失敗しました、ユーザー検証に失敗しました：', { uid })
			return { success: false, message: 'ユーザーの個人設定の取得に失敗しました、ユーザー検証に失敗しました' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーの個人設定の取得に失敗しました、不明な例外：', error)
		return { success: false, message: 'ユーザーの個人設定の取得に失敗しました、不明な例外' }
	}
}

/**
 * UIDに基づいてユーザー設定を更新または作成する
 * @param updateOrCreateUserSettingsRequest ユーザー設定の更新または作成時のリクエストパラメータ
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns ユーザー設定の更新または作成リクエストの結果
 */
export const updateOrCreateUserSettingsService = async (updateOrCreateUserSettingsRequest: UpdateOrCreateUserSettingsRequestDto, uid: number, token: string): Promise<UpdateOrCreateUserSettingsResponseDto> => {
	try {
		const now = new Date().getTime();
		if (await checkUserToken(uid, token)) {
			const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
			if (!UUID) {
				console.error('ERROR', 'ユーザー設定の更新または作成に失敗しました、UUIDが存在しません', { updateOrCreateUserSettingsRequest, uid })
				return { success: false, message: 'ユーザー設定の更新または作成に失敗しました、UUIDが存在しません' }
			}

			if (checkUpdateOrCreateUserSettingsRequest(updateOrCreateUserSettingsRequest)) {
				const { collectionName, schemaInstance } = UserSettingsSchema
				type UserSettings = InferSchemaType<typeof schemaInstance>
				const updateOrCreateUserSettingsWhere: QueryType<UserSettings> = {
					uid,
				}
				const updateOrCreateUserSettingsUpdate: UpdateType<UserSettings> = {
					...updateOrCreateUserSettingsRequest,
					userPrivaryVisibilitiesSetting: updateOrCreateUserSettingsRequest.userPrivaryVisibilitiesSetting as UserSettings['userPrivaryVisibilitiesSetting'], // TODO: Mongoose issue: #12420
					userLinkedAccountsVisibilitiesSetting: updateOrCreateUserSettingsRequest.userLinkedAccountsVisibilitiesSetting as UserSettings['userLinkedAccountsVisibilitiesSetting'], // TODO: Mongoose issue: #12420
					editDateTime: now
				}
				const updateResult = await findOneAndUpdateData4MongoDB(updateOrCreateUserSettingsWhere, updateOrCreateUserSettingsUpdate, schemaInstance, collectionName)
				const userSettings = updateResult?.result?.[0]
				if (updateResult?.success) {
					return { success: true, message: 'ユーザー設定の更新または作成に成功しました', userSettings: userSettings || updateOrCreateUserSettingsUpdate }
				} else {
					console.error('ERROR', 'ユーザー設定の更新または作成に失敗しました、ユーザー設定データが返されませんでした', { updateOrCreateUserSettingsRequest, uid })
					return { success: false, message: 'ユーザー設定の更新または作成に失敗しました、ユーザー設定データが返されませんでした' }
				}
			} else {
				console.error('ERROR', 'ユーザー設定の更新または作成に失敗しました、必要なデータが見つからないか、関連アカウントのプラットフォームタイプが不正です：', { updateOrCreateUserSettingsRequest, uid })
				return { success: false, message: 'ユーザー設定の更新または作成に失敗しました、必要なデータが空か、関連プラットフォーム情報にエラーがあります' }
			}
		} else {
			console.error('ERROR', 'ユーザー設定の更新または作成に失敗しました、トークンの検証に失敗しました、不正なユーザーです！', { updateOrCreateUserSettingsRequest, uid })
			return { success: false, message: 'ユーザー設定の更新または作成に失敗しました、不正なユーザーです！' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザー設定の更新または作成時に失敗しました、不明な例外', error)
		return { success: false, message: 'ユーザー設定の更新または作成時に失敗しました、不明な例外' }
	}
}

/**
 * ユーザー検証
 * @param uid ユーザーID。空の場合は検証に失敗します
 * @param token ユーザーIDに対応するトークン。空の場合は検証に失敗します
 * @returns 検証結果
 */
export const checkUserTokenService = async (uid: number, token: string): Promise<CheckUserTokenResponseDto> => {
	try {
		if (uid !== undefined && uid !== null && token) {
			const checkUserTokenResult = await checkUserToken(uid, token)
			if (checkUserTokenResult) {
				return { success: true, message: 'ユーザー検証に成功しました', userTokenOk: true }
			} else {
				console.error('ERROR', `ユーザー検証に失敗しました！不正なユーザーです！ユーザーUID：${uid}`)
				return { success: false, message: 'ユーザー検証に失敗しました！不正なユーザーです！', userTokenOk: false }
			}
		} else {
			console.error('ERROR', `ユーザー検証に失敗しました！ユーザーuidまたはtokenが存在しません、ユーザーUID：${uid}`)
			return { success: false, message: 'ユーザー検証に失敗しました！', userTokenOk: false }
		}
	} catch {
		console.error('ERROR', `ユーザー検証例外！ユーザーUID：${uid}`)
		return { success: false, message: 'ユーザー検証例外！', userTokenOk: false }
	}
}

/**
 * UUIDでユーザーを検証
 * @param UUID ユーザーUUID
 * @param token ユーザーIDに対応するトークン。空の場合は検証に失敗します
 * @returns 検証結果
 */
export const checkUserTokenByUuidService = async (UUID: string, token: string): Promise<CheckUserTokenResponseDto> => {
	try {
		if (UUID !== undefined && UUID !== null && token) {
			const checkUserTokenResult = await checkUserTokenByUUID(UUID, token)
			if (checkUserTokenResult) {
				return { success: true, message: 'ユーザー検証に成功しました', userTokenOk: true }
			} else {
				console.error('ERROR', `ユーザー検証に失敗しました！不正なユーザーです！ユーザーUUID：${UUID}`)
				return { success: false, message: 'ユーザー検証に失敗しました！不正なユーザーです！', userTokenOk: false }
			}
		} else {
			console.error('ERROR', `ユーザー検証に失敗しました！ユーザーUUIDまたはtokenが存在しません、ユーザーUUID：${UUID}`)
			return { success: false, message: 'ユーザー検証に失敗しました！', userTokenOk: false }
		}
	} catch {
		console.error('ERROR', `ユーザー検証例外！ユーザーUUID：${UUID}`)
		return { success: false, message: 'ユーザー検証例外！', userTokenOk: false }
	}
}

/**
 * 確認コードの送信をリクエストする
 * @param requestSendVerificationCodeRequest 確認コードの送信をリクエストするペイロード
 * @returns 確認コードの送信をリクエストするレスポンス
 */
export const requestSendVerificationCodeService = async (requestSendVerificationCodeRequest: RequestSendVerificationCodeRequestDto): Promise<RequestSendVerificationCodeResponseDto> => {
	try {
		if (checkRequestSendVerificationCodeRequest(requestSendVerificationCodeRequest)) {
			const { email, clientLanguage } = requestSendVerificationCodeRequest
			const emailLowerCase = email.toLowerCase()
			const nowTime = new Date().getTime()
			const todayStart = new Date()
			todayStart.setHours(0, 0, 0, 0)
			const { collectionName, schemaInstance } = UserVerificationCodeSchema
			type UserVerificationCode = InferSchemaType<typeof schemaInstance>
			const requestSendVerificationCodeWhere: QueryType<UserVerificationCode> = {
				emailLowerCase,
			}

			const requestSendVerificationCodeSelect: SelectType<UserVerificationCode> = {
				emailLowerCase: 1, // ユーザーのメールアドレス
				attemptsTimes: 1,
				lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
			}

			// トランザクション開始
			const session = await mongoose.startSession()
			session.startTransaction()

			try {
				const requestSendVerificationCodeResult = await selectDataFromMongoDB<UserVerificationCode>(requestSendVerificationCodeWhere, requestSendVerificationCodeSelect, schemaInstance, collectionName, { session })
				if (requestSendVerificationCodeResult.success) {
					const lastRequestDateTime = requestSendVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
					const attemptsTimes = requestSendVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
					if (requestSendVerificationCodeResult.result.length === 0 || lastRequestDateTime + 55000 < nowTime) { // フロントエンド60秒、バックエンド55秒
						const lastRequestDate = new Date(lastRequestDateTime)
						if (requestSendVerificationCodeResult.result.length === 0 || todayStart > lastRequestDate || attemptsTimes < 5) { // ! 1日5回まで
							const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
							let newAttemptsTimes = attemptsTimes + 1
							if (todayStart > lastRequestDate) {
								newAttemptsTimes = 0
							}

							const requestSendVerificationCodeUpdate: UserVerificationCode = {
								emailLowerCase,
								verificationCode,
								overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
								attemptsTimes: newAttemptsTimes,
								lastRequestDateTime: nowTime,
								editDateTime: nowTime,
							}
							const updateResult = await findOneAndUpdateData4MongoDB(requestSendVerificationCodeWhere, requestSendVerificationCodeUpdate, schemaInstance, collectionName, { session })
							if (updateResult.success) {
								try {
									const mail = getI18nLanguagePack(clientLanguage, "SendVerificationCode")
									const correctMailTitle = mail?.mailTitle
									const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

									const sendMailResult = await sendMail(email, correctMailTitle, { html: correctMailHTML })

									if (sendMailResult.success) {
										await session.commitTransaction()
										session.endSession()
										return { success: true, isTimeout: false, message: '登録確認コードが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }
									} else {
										if (session.inTransaction()) {
											await session.abortTransaction()
										}
										session.endSession()
										console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、メールの送信に失敗しました')
										return { success: false, isTimeout: true, message: '登録確認コードの送信リクエストに失敗しました、メールの送信に失敗しました' }
									}
								} catch (error) {
									if (session.inTransaction()) {
										await session.abortTransaction()
									}
									session.endSession()
									console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました', error)
									return { success: false, isTimeout: true, message: '登録確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました' }
								}
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました')
								return { success: false, isTimeout: false, message: '登録確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました' }
							}
						} else {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.warn('WARN', 'WARNING', '登録確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください')
							return { success: true, isTimeout: true, message: '登録確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください' }
						}
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.warn('WARN', 'WARNING', '登録確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください')
						return { success: true, isTimeout: true, message: '登録確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください' }
					}
				} else {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました')
					return { success: false, isTimeout: false, message: '登録確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました' }
				}
			} catch (error) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました', error)
				return { success: false, isTimeout: false, message: '登録確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、パラメータが不正です')
			return { success: false, isTimeout: false, message: '登録確認コードの送信リクエストに失敗しました、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '登録確認コードの送信リクエストに失敗しました、不明なエラー', error)
		return { success: false, isTimeout: false, message: '登録確認コードの送信リクエストに失敗しました、不明なエラー' }
	}
}

/**
 * 招待コードを生成する
 * @param uid 招待コードの生成を申請したユーザー
 * @param token 招待コードの生成を申請したユーザーのトークン
 * @returns 生成された招待コード
 */
export const createInvitationCodeService = async (uid: number, token: string): Promise<CreateInvitationCodeResponseDto> => {
	try {
		if (await checkUserToken(uid, token)) {
			const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
			if (!UUID) {
				console.error('ERROR', '招待コードの生成に失敗しました、UUIDが存在しません', { uid })
				return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、UUIDが存在しません' }
			}

			const nowTime = new Date().getTime()
			const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000 // 7日間をミリ秒に変換
			const { collectionName, schemaInstance } = UserInvitationCodeSchema
			type UserInvitationCode = InferSchemaType<typeof schemaInstance>
			const userInvitationCodeWhere: QueryType<UserInvitationCode> = {
				creatorUid: uid,
				generationDateTime: { $gt: nowTime - sevenDaysInMillis },
			}

			const userInvitationCodeSelect: SelectType<UserInvitationCode> = {
				creatorUid: 1,
			}

			try {
				const userInvitationCodeSelectResult = await selectDataFromMongoDB<UserInvitationCode>(userInvitationCodeWhere, userInvitationCodeSelect, schemaInstance, collectionName)

				// ユーザーの前回の作成日時が7日以内であるかを確認
				try {
					const getSelfUserInfoRequest: GetSelfUserInfoRequestDto = {
						uid,
						token,
					}
					const selfUserInfo = await getSelfUserInfoService(getSelfUserInfoRequest)
					if (!selfUserInfo.success || selfUserInfo.result.userCreateDateTime > nowTime - sevenDaysInMillis) {
						console.warn('WARN', 'WARNING', '招待コードの生成に失敗しました、招待コードの生成期限を超えていません、クールダウン中です（初回）', { uid })
						return { success: true, isCoolingDown: true, message: '招待コードの生成に失敗しました、招待コードの生成期限を超えていません、クールダウン中です（初回）' }
					}
				} catch (error) {
					console.warn('WARN', 'WARNING', '招待コードの生成時にエラーが発生しました、ユーザー情報のクエリでエラーが発生しました', { error, uid })
					return { success: false, isCoolingDown: false, message: '招待コードの生成時にエラーが発生しました、ユーザー情報のクエリでエラーが発生しました' }
				}

				if (userInvitationCodeSelectResult.success && userInvitationCodeSelectResult.result?.length === 0) { // 1日以内に招待コードが見つからなかった場合は、招待コードを生成できます。
					try {
						const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
						let finalInvitationCode = ''
						while (true) { // 重複しない招待コードが生成されるまでループを続ける
							const invitationCodePart1 = generateSecureVerificationStringCode(4, charset)
							const invitationCodePart2 = generateSecureVerificationStringCode(4, charset)
							const newInvitationCode = `KIRA-${invitationCodePart1}-${invitationCodePart2}`

							const userInvitationCodeDuplicationCheckWhere: QueryType<UserInvitationCode> = {
								invitationCode: newInvitationCode,
							}

							const userInvitationCodeDuplicationCheckSelect: SelectType<UserInvitationCode> = {
								creatorUid: 1,
							}

							const userInvitationCodeDuplicationCheckResult = await selectDataFromMongoDB<UserInvitationCode>(userInvitationCodeDuplicationCheckWhere, userInvitationCodeDuplicationCheckSelect, schemaInstance, collectionName)
							const noSame = userInvitationCodeDuplicationCheckResult.result?.length === 0
							if (noSame) {
								finalInvitationCode = newInvitationCode
								break
							}
						}

						if (finalInvitationCode) {
							const userInvitationCode: UserInvitationCode = {
								creatorUUID: UUID,
								creatorUid: uid,
								isPending: false,
								disabled: false,
								invitationCode: finalInvitationCode,
								generationDateTime: nowTime,
								editDateTime: nowTime,
								createDateTime: nowTime,
							}

							try {
								const insertResult = await insertData2MongoDB(userInvitationCode, schemaInstance, collectionName)
								if (insertResult.success) {
									return { success: true, isCoolingDown: false, message: '招待コードの生成に成功しました', invitationCodeResult: userInvitationCode }
								} else {
									console.error('ERROR', '招待コードの生成に失敗しました、招待コードの保存に失敗しました', { uid })
									return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、招待コードの保存に失敗しました' }
								}
							} catch (error) {
								console.error('ERROR', '招待コードの生成に失敗しました、招待コードの保存時にエラーが発生しました', error, { uid })
								return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、招待コードの保存時にエラーが発生しました' }
							}
						} else {
							console.error('ERROR', '招待コードの生成に失敗しました、重複しない新しい招待コードの生成に失敗しました', { uid })
							return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、重複しない新しい招待コードの生成に失敗しました' }
						}
					} catch (error) {
						console.error('ERROR', '招待コードの生成に失敗しました、重複しない新しい招待コードの生成時にエラーが発生しました', error, { uid })
						return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、重複しない新しい招待コードの生成時にエラーが発生しました' }
					}
				} else {
					console.warn('WARN', 'WARNING', '招待コードの生成に失敗しました、招待コードの生成期限を超えていません、クールダウン中です', { uid })
					return { success: true, isCoolingDown: true, message: '招待コードの生成に失敗しました、招待コードの生成期限を超えていません、クールダウン中です' }
				}
			} catch (error) {
				console.error('ERROR', '招待コードの生成に失敗しました、招待コードの生成期限を超えているかどうかのクエリ時にエラーが発生しました', error, { uid })
				return { success: false, isCoolingDown: true, message: '招待コードの生成に失敗しました、招待コードの生成期限を超えているかどうかのクエリでエラーが発生しました' }
			}
		} else {
			console.error('ERROR', '招待コードの生成に失敗しました、不正なユーザーです！', { uid })
			return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、不正なユーザーです！' }
		}
	} catch (error) {
		console.error('ERROR', '招待コードの生成に失敗しました、不明なエラー', error)
		return { success: false, isCoolingDown: false, message: '招待コードの生成に失敗しました、不明なエラー' }
	}
}

/**
 * 自分の招待コードリストを取得する
 * @param uid ユーザーUID
 * @param token ユーザートークン
 * @returns 自分の招待コードリストの取得リクエスト結果
 */
export const getMyInvitationCodeService = async (uid: number, token: string): Promise<GetMyInvitationCodeResponseDto> => {
	try {
		if (await checkUserToken(uid, token)) {
			const { collectionName, schemaInstance } = UserInvitationCodeSchema
			type UserInvitationCode = InferSchemaType<typeof schemaInstance>
			const myInvitationCodeWhere: QueryType<UserInvitationCode> = {
				creatorUid: uid,
			}

			const myInvitationCodeSelect: SelectType<UserInvitationCode> = {
				creatorUid: 1,
				invitationCode: 1,
				generationDateTime: 1,
				isPending: 1,
				assignee: 1,
				usedDateTime: 1,
			}

			try {
				const myInvitationCodeResult = await selectDataFromMongoDB<UserInvitationCode>(myInvitationCodeWhere, myInvitationCodeSelect, schemaInstance, collectionName)
				if (myInvitationCodeResult.success) {
					if (myInvitationCodeResult.result?.length >= 0) {
						return { success: true, message: '招待コードリストの取得に成功しました', invitationCodeResult: myInvitationCodeResult.result }
					} else {
						return { success: true, message: '自分の招待コードリストは空です', invitationCodeResult: [] }
					}
				} else {
					console.error('ERROR', '自分の招待コードの取得に失敗しました、リクエストに失敗しました', { uid })
					return { success: false, message: '自分の招待コードの取得に失敗しました、リクエストに失敗しました！', invitationCodeResult: [] }
				}
			} catch (error) {
				console.error('ERROR', '自分の招待コードの取得に失敗しました、リクエスト時にエラーが発生しました', { uid, error })
				return { success: false, message: '自分の招待コードの取得に失敗しました、リクエスト時にエラーが発生しました！', invitationCodeResult: [] }
			}
		} else {
			console.error('ERROR', '自分の招待コードの取得に失敗しました、不正なユーザーです！', { uid })
			return { success: false, message: '自分の招待コードの取得に失敗しました、不正なユーザーです！', invitationCodeResult: [] }
		}
	} catch (error) {
		console.error('ERROR', '自分の招待コードの取得に失敗しました、不明なエラー', error)
		return { success: false, message: '自分の招待コードの取得に失敗しました、不明なエラー', invitationCodeResult: [] }
	}
}

/**
 * 招待コードを使用して登録する
 * @param userInvitationCodeDto 招待コードを使用して登録するためのパラメータ
 * @returns 招待コードを使用して登録した結果
 */
const useInvitationCode = async (useInvitationCodeDto: UseInvitationCodeDto): Promise<UseInvitationCodeResultDto> => {
	try {
		if (checkUseInvitationCodeDto(useInvitationCodeDto)) {
			const nowTime = new Date().getTime()
			const { collectionName, schemaInstance } = UserInvitationCodeSchema
			type UserInvitationCode = InferSchemaType<typeof schemaInstance>

			const useInvitationCodeWhere: QueryType<UserInvitationCode> = {
				invitationCode: useInvitationCodeDto.invitationCode,
				assignee: undefined,
				disabled: false,
			}
			const useInvitationCodeUpdate: UpdateType<UserInvitationCode> = {
				assignee: useInvitationCodeDto.registrantUid,
				assigneeUUID: useInvitationCodeDto.registrantUUID,
				usedDateTime: nowTime,
				editDateTime: nowTime,
			}

			try {
				const updateResult = await findOneAndUpdateData4MongoDB(useInvitationCodeWhere, useInvitationCodeUpdate, schemaInstance, collectionName)
				if (updateResult.success) {
					return { success: true, message: '招待コードを使用して登録しました' }
				} else {
					console.error('ERROR', '招待コードを使用して登録する際に、招待コードの使用に失敗しました')
					return { success: false, message: '招待コードを使用して登録する際に、招待コードの使用に失敗しました' }
				}
			} catch (error) {
				console.error('ERROR', '招待コードを使用して登録する際に、招待コードの使用中にエラーが発生しました', error)
				return { success: false, message: '招待コードを使用して登録する際に、招待コードの使用中にエラーが発生しました' }
			}
		} else {
			console.error('ERROR', '招待コードを使用して登録する際に、パラメータが不正です')
			return { success: false, message: '招待コードを使用して登録する際に、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '招待コードを使用して登録する際に、不明なエラーが発生しました', error)
		return { success: false, message: '招待コードを使用して登録する際に、不明なエラーが発生しました' }
	}
}

/**
 * 招待コードが利用可能かどうかを確認する
 * @param checkInvitationCodeRequestDto 招待コードが利用可能かどうかを確認するリクエストペイロード
 * @returns 招待コードが利用可能かどうかを確認するリクエストレスポンス
 */
export const checkInvitationCodeService = async (checkInvitationCodeRequestDto: CheckInvitationCodeRequestDto): Promise<CheckInvitationCodeResponseDto> => {
	try {
		if (checkCheckInvitationCodeRequestDto(checkInvitationCodeRequestDto)) {
			const { collectionName, schemaInstance } = UserInvitationCodeSchema
			type UserInvitationCode = InferSchemaType<typeof schemaInstance>
			const checkInvitationCodeWhere: QueryType<UserInvitationCode> = {
				invitationCode: checkInvitationCodeRequestDto.invitationCode,
				assignee: undefined,
				disabled: false,
			}

			const checkInvitationCodeSelect: SelectType<UserInvitationCode> = {
				invitationCode: 1,
			}

			try {
				const checkInvitationCodeResult = await selectDataFromMongoDB<UserInvitationCode>(checkInvitationCodeWhere, checkInvitationCodeSelect, schemaInstance, collectionName)
				if (checkInvitationCodeResult.success) {
					if (checkInvitationCodeResult.result?.length === 1) {
						return { success: true, isAvailableInvitationCode: true, message: '招待コードの確認に成功しました' }
					} else {
						return { success: true, isAvailableInvitationCode: false, message: '招待コードの確認に失敗しました' }
					}
				} else {
					console.error('ERROR', '招待コードの利用可能性の確認に失敗しました、リクエストに失敗しました')
					return { success: false, isAvailableInvitationCode: false, message: '招待コードの利用可能性の確認に失敗しました、リクエストに失敗しました！' }
				}
			} catch (error) {
				console.error('ERROR', '招待コードの利用可能性の確認に失敗しました、リクエスト時にエラーが発生しました')
				return { success: false, isAvailableInvitationCode: false, message: '招待コードの利用可能性の確認に失敗しました、リクエスト時にエラーが発生しました！' }
			}
		} else {
			console.error('ERROR', '招待コードの利用可能性の確認に失敗しました、パラメータが不正です')
			return { success: false, isAvailableInvitationCode: false, message: '招待コードの利用可能性の確認に失敗しました、パラメータが不正です' }
		}
	} catch (error) {
		console.error('ERROR', '招待コードの利用可能性の確認に失敗しました、不明なエラー', error)
		return { success: false, isAvailableInvitationCode: false, message: '招待コードの利用可能性の確認に失敗しました、不明なエラー' }
	}
}

/**
 * 管理者が招待コードに基づいてユーザーを検索する
 * @param invitationCode 招待コード
 * @param AdminUUID 管理者のUUID
 * @param AdminToken 管理者のトークン
 */
export const adminGetUserByInvitationCodeService = async (invitationCode: string, AdminUUID: string, AdminToken: string): Promise<AdminGetUserByInvitationCodeResponseDto> => {
	try {
		if (!invitationCode || !AdminUUID || !AdminToken) {
			console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、パラメータが不正です', userInfoResult: {} }
		}
		if (!(await checkUserTokenByUuidService(AdminUUID, AdminToken)).success) {
			console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、管理者の検証に失敗しました')
			return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、管理者の検証に失敗しました', userInfoResult: {} }
		}

		const checkInvitationCode = await checkInvitationCodeService({ invitationCode })
		if (!checkInvitationCode.success || !!checkInvitationCode.isAvailableInvitationCode) {
			console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、招待コードが利用できません', { invitationCode })
			return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、招待コードが利用できません', userInfoResult: {} }
		}

		const { collectionName, schemaInstance } = UserInvitationCodeSchema
		type UserInvitationCode = InferSchemaType<typeof schemaInstance>
		const userInvitationCodeWhere: QueryType<UserInvitationCode> = {
			invitationCode,
		}
		const userInvitationCodeSelect: SelectType<UserInvitationCode> = {
			assignee: 1,
			assigneeUUID: 1,
		}

		const userInvitationCodeResult = await selectDataFromMongoDB<UserInvitationCode>(userInvitationCodeWhere, userInvitationCodeSelect, schemaInstance, collectionName)
		const userInvitationCodeData = userInvitationCodeResult.result?.[0]
		if (!userInvitationCodeResult.success) {
			console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、クエリに失敗しました')
			return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、クエリに失敗しました', userInfoResult: {} }
		}
		if (!userInvitationCodeData || !userInvitationCodeData.assignee || !userInvitationCodeData.assigneeUUID) {
			console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、ユーザー情報が見つかりません', { invitationCode })
			return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、ユーザー情報が見つかりません', userInfoResult: {} }
		}
		return { success: true, message: '管理者による招待コードでのユーザー検索に成功しました', userInfoResult: { uid: userInvitationCodeData?.assignee, uuid: userInvitationCodeData?.assigneeUUID} }

	} catch (error) {
		console.error('ERROR', '管理者による招待コードでのユーザー検索に失敗しました、不明なエラー', error)
		return { success: false, message: '管理者による招待コードでのユーザー検索に失敗しました、不明なエラー', userInfoResult: {} }
	}
}

/**
 * メールアドレス変更の確認コードを送信するリクエスト
 * @param requestSendChangeEmailVerificationCodeRequest メールアドレス変更の確認コードを送信するリクエストペイロード
 * @param uid ユーザーUID
 * @param token ユーザートークン
 * @returns メールアドレス変更の確認コードを送信するリクエストレスポンス
 */
export const requestSendChangeEmailVerificationCodeService = async (requestSendChangeEmailVerificationCodeRequest: RequestSendChangeEmailVerificationCodeRequestDto, uid: number, token: string): Promise<RequestSendChangeEmailVerificationCodeResponseDto> => {
	try {
		if (await checkUserToken(uid, token)) {
			if (checkRequestSendChangeEmailVerificationCodeRequest(requestSendChangeEmailVerificationCodeRequest)) {
				const { clientLanguage, newEmail } = requestSendChangeEmailVerificationCodeRequest
				try {
					if (newEmail) {
						const emailLowerCase = newEmail.toLowerCase()
						const nowTime = new Date().getTime()
						const todayStart = new Date()
						todayStart.setHours(0, 0, 0, 0)
						const { collectionName, schemaInstance } = UserChangeEmailVerificationCodeSchema
						type UserVerificationCode = InferSchemaType<typeof schemaInstance>
						const requestSendVerificationCodeWhere: QueryType<UserVerificationCode> = {
							emailLowerCase,
						}

						const requestSendVerificationCodeSelect: SelectType<UserVerificationCode> = {
							emailLowerCase: 1, // ユーザーのメールアドレス
							attemptsTimes: 1,
							lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
						}

						// トランザクション開始
						const session = await mongoose.startSession()
						session.startTransaction()

						try {
							const requestSendVerificationCodeResult = await selectDataFromMongoDB<UserVerificationCode>(requestSendVerificationCodeWhere, requestSendVerificationCodeSelect, schemaInstance, collectionName, { session })
							if (requestSendVerificationCodeResult.success) {
								const lastRequestDateTime = requestSendVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
								const attemptsTimes = requestSendVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
								if (requestSendVerificationCodeResult.result.length === 0 || lastRequestDateTime + 55000 < nowTime) { // フロントエンド60秒、バックエンド55秒
									const lastRequestDate = new Date(lastRequestDateTime)
									if (requestSendVerificationCodeResult.result.length === 0 || todayStart > lastRequestDate || attemptsTimes < 10) { // ! 1日10回まで
										const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
										let newAttemptsTimes = attemptsTimes + 1
										if (todayStart > lastRequestDate) {
											newAttemptsTimes = 0
										}

										const requestSendVerificationCodeUpdate: UserVerificationCode = {
											emailLowerCase,
											verificationCode,
											overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
											attemptsTimes: newAttemptsTimes,
											lastRequestDateTime: nowTime,
											editDateTime: nowTime,
										}
										const updateResult = await findOneAndUpdateData4MongoDB(requestSendVerificationCodeWhere, requestSendVerificationCodeUpdate, schemaInstance, collectionName, { session })
										if (updateResult.success) {
											try {
												const mail = getI18nLanguagePack(clientLanguage, "SendChangeEmailVerificationCode")
												const correctMailTitle = mail?.mailTitle
												const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

												const sendMailResult = await sendMail(newEmail, correctMailTitle, { html: correctMailHTML })

												if (sendMailResult.success) {
													await session.commitTransaction()
													session.endSession()
													return { success: true, isCoolingDown: false, message: 'メールアドレス変更の確認コードが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }
												} else {
													if (session.inTransaction()) {
														await session.abortTransaction()
													}
													session.endSession()
													console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メールの送信に失敗しました')
													return { success: false, isCoolingDown: true, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メールの送信に失敗しました' }
												}
											} catch (error) {
												if (session.inTransaction()) {
													await session.abortTransaction()
												}
												session.endSession()
												console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました', error)
												return { success: false, isCoolingDown: true, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました' }
											}
										} else {
											if (session.inTransaction()) {
												await session.abortTransaction()
											}
											session.endSession()
											console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました')
											return { success: false, isCoolingDown: false, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました' }
										}
									} else {
										if (session.inTransaction()) {
											await session.abortTransaction()
										}
										session.endSession()
										console.warn('WARN', 'WARNING', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください')
										return { success: true, isCoolingDown: true, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください' }
									}
								} else {
									if (session.inTransaction()) {
										await session.abortTransaction()
									}
									session.endSession()
									console.warn('WARN', 'WARNING', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください')
									return { success: true, isCoolingDown: true, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください' }
								}
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました')
								return { success: false, isCoolingDown: false, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました' }
							}
						} catch (error) {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました', error)
							return { success: false, isCoolingDown: false, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました' }
						}
					} else {
						console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得に失敗しました', { uid })
						return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得に失敗しました' }
					}
				} catch (error) {
					console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得中にエラーが発生しました', { error, uid })
					return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得中にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、パラメータが不正です！', { uid })
				return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、パラメータが不正です！' }
			}
		} else {
			console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、不正なユーザーです！', { uid })
			return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、不正なユーザーです！' }
		}
	} catch (error) {
		console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、不明なエラー', error)
		return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、不明なエラー' }
	}
}

/**
 * パスワード変更用のメール確認コードの送信をリクエストする
 * @param requestSendChangePasswordVerificationCodeRequest パスワード変更用のメール確認コードの送信をリクエストするペイロード
 * @param uid ユーザーUID
 * @param token ユーザートークン
 * @returns パスワード変更用のメール確認コードの送信をリクエストするレスポンス
 */
export const requestSendChangePasswordVerificationCodeService = async (requestSendChangePasswordVerificationCodeRequest: RequestSendChangePasswordVerificationCodeRequestDto, uid: number, token: string): Promise<RequestSendChangePasswordVerificationCodeResponseDto> => {
	try {
		if (await checkUserToken(uid, token)) {
			const UUID = await getUserUuid(uid) // DELETE ME これは一時的な解決策であり、CookieにはUUIDを保存する必要があります
			if (!UUID) {
				console.error('ERROR', 'パスワード変更用のメール確認コードの送信リクエストに失敗しました、UUIDが存在しません', { uid })
				return { success: false, isCoolingDown: false, message: 'パスワード変更用のメール確認コードの送信リクエストに失敗しました、UUIDが存在しません' }
			}

			if (checkRequestSendChangePasswordVerificationCodeRequest(requestSendChangePasswordVerificationCodeRequest)) {
				const { clientLanguage } = requestSendChangePasswordVerificationCodeRequest
				try {
					const getSelfUserInfoRequest = {
						uid,
						token,
					}
					const selfUserInfoResult = await getSelfUserInfoService(getSelfUserInfoRequest)
					const email = selfUserInfoResult.result.email
					if (selfUserInfoResult.success && email) {
						const emailLowerCase = email.toLowerCase()
						const nowTime = new Date().getTime()
						const todayStart = new Date()
						todayStart.setHours(0, 0, 0, 0)
						const { collectionName, schemaInstance } = UserChangePasswordVerificationCodeSchema
						type UserChangePasswordVerificationCode = InferSchemaType<typeof schemaInstance>
						const requestSendVerificationCodeWhere: QueryType<UserChangePasswordVerificationCode> = {
							emailLowerCase,
						}

						const requestSendVerificationCodeSelect: SelectType<UserChangePasswordVerificationCode> = {
							emailLowerCase: 1, // ユーザーのメールアドレス
							attemptsTimes: 1,
							lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
						}

						// トランザクション開始
						const session = await mongoose.startSession()
						session.startTransaction()

						try {
							const requestSendVerificationCodeResult = await selectDataFromMongoDB<UserChangePasswordVerificationCode>(requestSendVerificationCodeWhere, requestSendVerificationCodeSelect, schemaInstance, collectionName, { session })
							if (requestSendVerificationCodeResult.success) {
								const lastRequestDateTime = requestSendVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
								const attemptsTimes = requestSendVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
								if (requestSendVerificationCodeResult.result.length === 0 || lastRequestDateTime + 55000 < nowTime) { // フロントエンド60秒、バックエンド55秒
									const lastRequestDate = new Date(lastRequestDateTime)
									if (requestSendVerificationCodeResult.result.length === 0 || todayStart > lastRequestDate || attemptsTimes < 3) { // ! 1日3回まで
										const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
										let newAttemptsTimes = attemptsTimes + 1
										if (todayStart > lastRequestDate) {
											newAttemptsTimes = 0
										}

										const requestSendVerificationCodeUpdate: UserChangePasswordVerificationCode = {
											UUID,
											uid,
											emailLowerCase,
											verificationCode,
											overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
											attemptsTimes: newAttemptsTimes,
											lastRequestDateTime: nowTime,
											editDateTime: nowTime,
										}
										const updateResult = await findOneAndUpdateData4MongoDB(requestSendVerificationCodeWhere, requestSendVerificationCodeUpdate, schemaInstance, collectionName, { session })
										if (updateResult.success) {
											try {
												const mail = getI18nLanguagePack(clientLanguage, "SendChangePasswordVerificationCode")
												const correctMailTitle = mail?.mailTitle
												const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

												const sendMailResult = await sendMail(email, correctMailTitle, { html: correctMailHTML })

												if (sendMailResult.success) {
													await session.commitTransaction()
													session.endSession()
													return { success: true, isCoolingDown: false, message: 'パスワード変更の確認コードが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }
												} else {
													if (session.inTransaction()) {
														await session.abortTransaction()
													}
													session.endSession()
													console.error('ERROR', 'パスワード変更の確認コードの送信リクエストに失敗しました、メールの送信に失敗しました')
													return { success: false, isCoolingDown: true, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、メールの送信に失敗しました' }
												}
											} catch (error) {
												if (session.inTransaction()) {
													await session.abortTransaction()
												}
												session.endSession()
												console.error('ERROR', 'パスワード変更の確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました', error)
												return { success: false, isCoolingDown: true, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、メール送信時にエラーが発生しました' }
											}
										} else {
											if (session.inTransaction()) {
												await session.abortTransaction()
											}
											session.endSession()
											console.error('ERROR', 'パスワード変更の確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました')
											return { success: false, isCoolingDown: false, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、ユーザー確認コードの更新または新規作成に失敗しました' }
										}
									} else {
										if (session.inTransaction()) {
											await session.abortTransaction()
										}
										session.endSession()
										console.warn('WARN', 'WARNING', 'パスワード変更の確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください')
										return { success: true, isCoolingDown: true, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください' }
									}
								} else {
									if (session.inTransaction()) {
										await session.abortTransaction()
									}
									session.endSession()
									console.warn('WARN', 'WARNING', 'パスワード変更の確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください')
									return { success: true, isCoolingDown: true, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください' }
								}
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', 'パスワード変更の確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました')
								return { success: false, isCoolingDown: false, message: 'パスワード変更の確認コードの送信リクエストに失敗しました、確認コードの取得に失敗しました' }
							}
						} catch (error) {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', 'メールアドレス変更の確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました', error)
							return { success: false, isCoolingDown: false, message: 'メールアドレス変更の確認コードの送信リクエストに失敗しました、タイムアウト時間の確認中にエラーが発生しました' }
						}
					} else {
						console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得に失敗しました', { uid })
						return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得に失敗しました' }
					}
				} catch (error) {
					console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得中にエラーが発生しました', { error, uid })
					return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、ユーザーの古いメールアドレスの取得中にエラーが発生しました' }
				}
			} else {
				console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、パラメータが不正です！', { uid })
				return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、パラメータが不正です！' }
			}
		} else {
			console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、不正なユーザーです！', { uid })
			return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、不正なユーザーです！' }
		}
	} catch (error) {
		console.error('ERROR', 'メールアドレス更新の確認コードの送信に失敗しました、不明なエラー', error)
		return { success: false, isCoolingDown: false, message: 'メールアドレス更新の確認コードの送信に失敗しました、不明なエラー' }
	}
}

/**
 * 更新密码
 * @param updateUserPasswordRequest 更新密码的请求载荷
 * @param uid 用户 UID
 * @param token 用户 token
 * @returns 更新密码的请求响应
 */
export const changePasswordService = async (updateUserPasswordRequest: UpdateUserPasswordRequestDto, uid: number, token: string): Promise<UpdateUserPasswordResponseDto> => {
	try {
		if (checkUpdateUserPasswordRequest(updateUserPasswordRequest)) {
			if (await checkUserToken(uid, token)) {
				const { oldPasswordHash, newPasswordHash, verificationCode } = updateUserPasswordRequest
				const now = new Date().getTime()

				const { collectionName: userChangePasswordVerificationCodeCollectionName, schemaInstance: userChangePasswordVerificationCodeInstance } = UserChangePasswordVerificationCodeSchema
				type UserChangePasswordVerificationCode = InferSchemaType<typeof userChangePasswordVerificationCodeInstance>

				const userChangePasswordVerificationCodeWhere: QueryType<UserChangePasswordVerificationCode> = {
					uid,
					verificationCode,
					overtimeAt: { $gte: now },
				}
				const userChangePasswordVerificationCodeSelect: SelectType<UserChangePasswordVerificationCode> = {
					emailLowerCase: 1, // 用户邮箱
				}

				// 启动事务
				const session = await mongoose.startSession()
				session.startTransaction()

				try {
					const verificationCodeResult = await selectDataFromMongoDB<UserChangePasswordVerificationCode>(userChangePasswordVerificationCodeWhere, userChangePasswordVerificationCodeSelect, userChangePasswordVerificationCodeInstance, userChangePasswordVerificationCodeCollectionName, { session })
					if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', '修改密码时出错，验证失败')
						return { success: false, message: '修改密码时出错，验证失败' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', '修改密码时出错，请求验证失败')
					return { success: false, message: '修改密码时出错，请求验证失败' }
				}

				const { collectionName, schemaInstance } = UserAuthSchema
				type UserAuth = InferSchemaType<typeof schemaInstance>

				const changePasswordWhere: QueryType<UserAuth> = { uid }
				const changePasswordSelect: SelectType<UserAuth> = {
					email: 1,
					uid: 1,
					passwordHashHash: 1,
				}

				try {
					const userAuthResult = await selectDataFromMongoDB<UserAuth>(changePasswordWhere, changePasswordSelect, schemaInstance, collectionName, { session })
					if (userAuthResult?.result && userAuthResult.result?.length === 1) {
						const userAuthInfo = userAuthResult.result[0]
						const isCorrectPassword = comparePasswordSync(oldPasswordHash, userAuthInfo.passwordHashHash)
						if (isCorrectPassword) {
							const newPasswordHashHash = hashPasswordSync(newPasswordHash)
							if (newPasswordHashHash) {
								const changePasswordUpdate: UpdateType<UserAuth> = {
									passwordHashHash: newPasswordHashHash,
									editDateTime: now,
								}
								try {
									const updateResult = await findOneAndUpdateData4MongoDB(changePasswordWhere, changePasswordUpdate, schemaInstance, collectionName, { session })
									if (updateResult.success) {
										await session.commitTransaction()
										session.endSession()
										return { success: true, message: '密码已更新！' }
									} else {
										if (session.inTransaction()) {
											await session.abortTransaction()
										}
										session.endSession()
										console.error('ERROR', '修改密码失败，更新密码失败', { uid })
										return { success: false, message: '修改密码时出错，更新密码失败' }
									}
								} catch (error) {
									if (session.inTransaction()) {
										await session.abortTransaction()
									}
									session.endSession()
									console.error('ERROR', '修改密码时出错，更新密码时出错', { uid, error })
									return { success: false, message: '修改密码时出错，更新密码时出错' }
								}
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', '修改密码失败，未能散列新密码', { uid })
								return { success: false, message: '修改密码失败，未能散列新密码' }
							}
						} else {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', '修改密码失败，密码校验未通过', { uid })
							return { success: false, message: '修改密码失败，密码校验未通过' }
						}
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', '修改密码失败，密码校验结果为空或不为一！', { uid })
						return { success: false, message: '修改密码失败，密码校验结果不正确' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', '修改密码时出错，密码校验时出错！', { uid, error })
					return { success: false, message: '修改密码时出错，密码校验时出错！' }
				}
			} else {
				console.error('ERROR', '修改密码失败，非法用户！', { uid })
				return { success: false, message: '修改密码失败，非法用户！' }
			}
		} else {
			console.error('ERROR', '修改密码失败，参数不合法！', { uid })
			return { success: false, message: '修改密码失败，参数不合法！' }
		}
	} catch (error) {
		console.error('ERROR', '修改密码时出错，未知错误', error)
		return { success: false, message: '修改密码时出错，未知错误' }
	}
}

/**
 * 请求发送忘记密码的邮箱验证码
 * @param requestSendForgotPasswordVerificationCodeRequest 请求发送忘记密码的邮箱验证码的请求载荷
 * @returns 请求发送忘记密码的邮箱验证码的请求响应
 */
export const requestSendForgotPasswordVerificationCodeService = async (requestSendForgotPasswordVerificationCodeRequest: RequestSendForgotPasswordVerificationCodeRequestDto): Promise<RequestSendForgotPasswordVerificationCodeResponseDto> => {
	try {
		if (!checkRequestSendForgotPasswordVerificationCodeRequest(requestSendForgotPasswordVerificationCodeRequest)) {
			const message = '请求发送忘记密码的验证码失败，参数不合法！'
			console.error('ERROR', message)
			return { success: false, isCoolingDown: false, message }
		}
		const { clientLanguage, email } = requestSendForgotPasswordVerificationCodeRequest

		const emailLowerCase = email.toLowerCase()
		const nowTime = new Date().getTime()
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)

		const { collectionName, schemaInstance } = UserForgotPasswordVerificationCodeSchema
		type UserForgotPasswordVerificationCode = InferSchemaType<typeof schemaInstance>
		const requestSendForgotPasswordVerificationCodeWhere: QueryType<UserForgotPasswordVerificationCode> = {
			emailLowerCase,
		}

		const requestSendForgotPasswordVerificationCodeSelect: SelectType<UserForgotPasswordVerificationCode> = {
			emailLowerCase: 1, // 用户邮箱
			attemptsTimes: 1,
			lastRequestDateTime: 1, // 用户上一次请求验证码的时间，用于防止滥用
		}

		// 启动事务
		const session = await mongoose.startSession()
		session.startTransaction()

		try {
			const forgotPasswordVerificationCodeHistoryResult = await selectDataFromMongoDB<UserForgotPasswordVerificationCode>(requestSendForgotPasswordVerificationCodeWhere, requestSendForgotPasswordVerificationCodeSelect, schemaInstance, collectionName, { session })
			
			if (!forgotPasswordVerificationCodeHistoryResult.success) {
				await abortAndEndSession(session)
				const message = '请求发送忘记密码的验证码失败，获取验证码失败'
				console.error('ERROR', message)
				return { success: false, isCoolingDown: false, message }
			}

			const lastRequestDateTime = forgotPasswordVerificationCodeHistoryResult.result?.[0]?.lastRequestDateTime ?? 0
			const attemptsTimes = forgotPasswordVerificationCodeHistoryResult.result?.[0]?.attemptsTimes ?? 0
			if (forgotPasswordVerificationCodeHistoryResult.result.length > 0 && lastRequestDateTime + 55000 >= nowTime) { // 前端 60 秒，后端 55 秒
				await abortAndEndSession(session)
				const message = '请求发送忘记密码的验证码失败，未超过邮件超时时间，请稍后再试'
				console.warn('WARN', message)
				return { success: false, isCoolingDown: true, message }
			}

			const lastRequestDate = new Date(lastRequestDateTime)
			if (forgotPasswordVerificationCodeHistoryResult.result.length > 0 && todayStart < lastRequestDate && attemptsTimes > 3) { // ! 每天三次机会
				await abortAndEndSession(session)
				const message = '请求发送忘记密码的验证码失败，已达本日重试次数上限，请稍后再试'
				console.warn('WARN', 'WARNING', message)
				return { success: false, isCoolingDown: true, message }
			}

			const verificationCode = generateSecureVerificationNumberCode(6) // 生成六位随机数验证码
			let newAttemptsTimes = attemptsTimes + 1
			if (todayStart > lastRequestDate) {
				newAttemptsTimes = 0
			}

			const requestSendForgotPasswordVerificationCodeUpdate: UserForgotPasswordVerificationCode = {
				emailLowerCase,
				verificationCode,
				overtimeAt: nowTime + 1800000, // 当前时间加上 1800000 毫秒（30 分钟）作为新的过期时间
				attemptsTimes: newAttemptsTimes,
				lastRequestDateTime: nowTime,
				editDateTime: nowTime,
			}
			const updateResult = await findOneAndUpdateData4MongoDB(requestSendForgotPasswordVerificationCodeWhere, requestSendForgotPasswordVerificationCodeUpdate, schemaInstance, collectionName, { session })
			
			if (!updateResult.success) {
				await abortAndEndSession(session)
				const message = '请求发送忘记密码的验证码失败，更新或新增验证码失败'
				console.error('ERROR', message)
				return { success: false, isCoolingDown: false, message }
			}

			try {
				const mail = getI18nLanguagePack(clientLanguage, "SendResetPasswordVerificationCode")
				const correctMailTitle = mail?.mailTitle
				const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

				const sendMailResult = await sendMail(email, correctMailTitle, { html: correctMailHTML })

				if (!sendMailResult.success) {
					await abortAndEndSession(session)
					const message = '请求发送忘记密码的验证码失败，邮件发送失败'
					console.error('ERROR', message)
					return { success: false, isCoolingDown: true, message }
				}

				await commitAndEndSession(session)
				return { success: true, isCoolingDown: false, message: '忘记密码的验证码已发送至你注册时使用的邮箱，请注意查收，如未收到，请检查垃圾箱或联系 KIRAKIRA 客服。' }

			} catch (error) {
				await abortAndEndSession(session)
				const message = '请求发送忘记密码的验证码失败，邮件发送时出错'
				console.error('ERROR', message, error)
				return { success: false, isCoolingDown: true, message }
			}
		} catch (error) {
			await abortAndEndSession(session)
			const message = '请求发送忘记密码的验证码失败，检查超时时间时出错'
			console.error('ERROR', message, error)
			return { success: false, isCoolingDown: false, message }
		}
	} catch (error) {
		const message = '请求发送忘记密码的验证码失败，未知错误'
		console.error('ERROR', message, error)
		return { success: false, isCoolingDown: false, message }
	}
}

/**
 * 找回密码（更新密码）
 * @param forgotPasswordRequest 忘记密码（更新密码）的请求载荷
 * @returns 忘记密码（更新密码）的请求响应
 */
export const forgotPasswordService = async (forgotPasswordRequest: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> => {
	try {
		if (!checkForgotPasswordRequest(forgotPasswordRequest)) {
			const message = '找回密码失败，参数不合法！'
			console.error('ERROR', message)
			return { success: false, message }
		}

		const { email, newPasswordHash, verificationCode } = forgotPasswordRequest
		const emailLowerCase = email.toLowerCase()
		const now = new Date().getTime()

		const { collectionName: userForgotPasswordVerificationCodeCollectionName, schemaInstance: userForgotPasswordVerificationCodeInstance } = UserForgotPasswordVerificationCodeSchema
		type UserForgotPasswordVerificationCode = InferSchemaType<typeof userForgotPasswordVerificationCodeInstance>

		const userForgoPasswordVerificationCodeWhere: QueryType<UserForgotPasswordVerificationCode> = {
			emailLowerCase,
			verificationCode,
			overtimeAt: { $gte: now },
		}
		const userForgotPasswordVerificationCodeSelect: SelectType<UserForgotPasswordVerificationCode> = {
			emailLowerCase: 1, // 用户邮箱
		}

		// 启动事务
		const session = await mongoose.startSession()
		session.startTransaction()

		const verificationCodeResult = await selectDataFromMongoDB<UserForgotPasswordVerificationCode>(userForgoPasswordVerificationCodeWhere, userForgotPasswordVerificationCodeSelect, userForgotPasswordVerificationCodeInstance, userForgotPasswordVerificationCodeCollectionName, { session })
		if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
			await abortAndEndSession(session)
			const message = '找回密码时出错，验证失败'
			console.error('ERROR', message)
			return { success: false, message }
		}

		const newPasswordHashHash = hashPasswordSync(newPasswordHash)
		if (!newPasswordHashHash) {
			await abortAndEndSession(session)
			const message = '找回密码失败，未能散列新密码'
			console.error('ERROR', message, { email })
			return { success: false, message }
		}

		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const changePasswordWhere: QueryType<UserAuth> = {
			emailLowerCase,
		}
		const changePasswordUpdate: UpdateType<UserAuth> = {
			passwordHashHash: newPasswordHashHash,
			editDateTime: now,
		}

		try {
			const updateResult = await findOneAndUpdateData4MongoDB(changePasswordWhere, changePasswordUpdate, schemaInstance, collectionName, { session })
			
			if (!updateResult.success) {
				await abortAndEndSession(session)
				const message = '找回密码失败，更新密码失败'
				console.error('ERROR', message, { email })
				return { success: false, message }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, message: '找回密码成功，密码已更新！' }
		} catch (error) {
			await abortAndEndSession(session)
			const message = '找回密码时出错，更新密码时出错'
			console.error('ERROR', message, { email, error })
			return { success: false, message }
		}
	} catch (error) {
		const message = '找回密码时出错，未知错误'
		console.error('ERROR', message, error)
		return { success: false, message }
	}
}

/**
 * 检查用户名是否可用
 * @param checkUsernameRequest 检查用户名是否可用的请求载荷
 * @returns 检查用户名是否可用的请求响应，可用返回 true，否则返回 false
 */
export const checkUsernameService = async (checkUsernameRequest: CheckUsernameRequestDto, excluedUuid: 'none' | string[] = 'none'): Promise<CheckUsernameResponseDto> => {
	try {
		if (checkCheckUsernameRequest(checkUsernameRequest)) {
			const { username } = checkUsernameRequest
			const usernameStandardized = username.trim().normalize()

			if (!validateNameField(usernameStandardized)) {
				console.error('ERROR', '用户名不合法')
				return { success: false, message: '用户名不合法', isAvailableUsername: true }
			}

			const { collectionName, schemaInstance } = UserInfoSchema
			type UserInfo = InferSchemaType<typeof schemaInstance>
			const checkUsernameWhere: QueryType<UserInfo> = {
				username: { $regex: new RegExp(`\\b${usernameStandardized}\\b`, 'iu') },
			}
			if (excluedUuid && excluedUuid !== 'none') { // 如果 excluedUuid 存在且不是 'none'，则在检查用户名可用性时增加排除用户（修改自己用户名时排除自己，或者排除一些官方号等...）
				checkUsernameWhere.UUID = { $nin: excluedUuid }
			}
			const checkUsernameSelete: SelectType<UserInfo> = {
				uid: 1,
			}
			try {
				const checkUsername = await selectDataFromMongoDB(checkUsernameWhere, checkUsernameSelete, schemaInstance, collectionName)
				if (checkUsername.success) {
					if (checkUsername.result?.length === 0) {
						return { success: true, message: '用户名可用', isAvailableUsername: true }
					} else {
						return { success: true, message: '用户名重复', isAvailableUsername: false }
					}
				} else {
					console.error('ERROR', '检查用户名失败，请求用户数据失败')
					return { success: false, message: '检查用户名失败，请求用户数据失败', isAvailableUsername: false }
				}
			} catch (error) {
				console.error('ERROR', '检查用户名时出错，请求用户数据出错', error)
				return { success: false, message: '检查用户名时出错，请求用户数据出错', isAvailableUsername: false }
			}
		} else {
			console.error('ERROR', '检查用户名失败，参数不合法')
			return { success: false, message: '检查用户名失败，参数不合法', isAvailableUsername: false }
		}
	} catch (error) {
		console.error('ERROR', '检查用户名时出错，未知错误', error)
		return { success: false, message: '检查用户名时出错，未知错误', isAvailableUsername: false }
	}
}

/**
 * 根据 UUID 校验用户是否已经存在
 * @param checkUserExistsByUuidRequest 根据 UUID 校验用户是否已经存在的请求载荷
 * @returns 根据 UUID 校验用户是否已经存在的请求响应
 */
export const checkUserExistsByUuidService = async (checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto): Promise<CheckUserExistsByUuidResponseDto> => {
	try {
		if (!checkCheckUserExistsByUuidRequest(checkUserExistsByUuidRequest)) {
			console.error('ERROR', '查询用户是否存在时失败：参数不合法')
			return { success: false, exists: false, message: '查询用户是否存在时失败：参数不合法' }
		}

		const { uuid } = checkUserExistsByUuidRequest
		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>
		const where: QueryType<UserAuth> = {
			uuid,
		}
		const select: SelectType<UserAuth> = {
			UUID: 1,
		}

		let result: DbPoolResultsType<UserAuth>
		try {
			result = await selectDataFromMongoDB(where, select, schemaInstance, collectionName)
		} catch (error) {
			console.error('ERROR', '根据 UUID 校验用户是否已经存在时出错：查询出错', error)
			return { success: false, exists: false, message: '根据 UUID 校验用户是否已经存在时出错：查询出错' }
		}

		if (result && result.success && result.result) {
			if (result.result?.length > 0) {
				return { success: true, exists: true, message: '用户已存在' }
			} else {
				return { success: true, exists: false, message: '用户不存在' }
			}
		} else {
			return { success: false, exists: false, message: '查询失败' }
		}
	} catch (error) {
		console.error('ERROR', '查询用户是否存在时出错：未知错误', error)
		return { success: false, exists: false, message: '查询用户是否存在时出错：未知错误' }
	}
}

/**
 * 获取所有被封禁用户的信息
 * @param adminUid 管理员的 UID
 * @param adminToken 管理员的 Token
 * @param GetBlockedUserRequest 获取被封禁用户的请求载荷
 * @returns 获取所有被封禁用户的信息的请求响应
 */
export const getBlockedUserService = async (adminUUID: string, adminToken: string, GetBlockedUserRequest: GetBlockedUserRequestDto): Promise<GetBlockedUserResponseDto> => {
	try {
		if (await checkUserTokenByUUID(adminUUID, adminToken)) {
			const { sortBy, sortOrder } = GetBlockedUserRequest
			if (!checkSortVariables(sortBy, sortOrder)) {
				console.error('ERROR', '获取所有被封禁用户的信息失败，排序参数不合法')
				return { success: false, message: '获取所有被封禁用户的信息失败，排序参数不合法', totalCount: 0 }
			}

			let pageSize = undefined
			let skip = 0
			if (GetBlockedUserRequest.pagination && GetBlockedUserRequest.pagination.page > 0 && GetBlockedUserRequest.pagination.pageSize > 0) {
				skip = (GetBlockedUserRequest.pagination.page - 1) * GetBlockedUserRequest.pagination.pageSize
				pageSize = GetBlockedUserRequest.pagination.pageSize
			}

			const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema

			const blockedUserCountPipeline: PipelineStage[] = [
				{
					$match: {
						roles: 'blocked',
					},
				},
				{
					$lookup: {
						from: 'user-infos', // WARN: 别忘了加复数
						localField: 'UUID',
						foreignField: 'UUID',
						as: 'user_info_data',
					},
				},
				{
					$unwind: {
						path: '$user_info_data',
						preserveNullAndEmptyArrays: true, // 保留空数组和null值
					},
				},
			]

			const blockedUserPipeline: PipelineStage[] = [
				{
					$match: {
						roles: 'blocked',
					},
				},
				{
					$lookup: {
						from: 'user-infos', // WARN: 别忘了加复数
						localField: 'UUID',
						foreignField: 'UUID',
						as: 'user_info_data',
					},
				},
				{
					$unwind: {
						path: '$user_info_data',
						preserveNullAndEmptyArrays: true, // 保留空数组和null值
					},
				},
				{ $sort: { [`user_info_data.${sortBy}`]: sortOrder === 'descend' ? -1 : 1 } },
				{ $skip: skip }, // 跳过指定数量的文档
				{ $limit: pageSize }, // 限制返回的文档数量
			]

			const projectStep = {
				$project: {
					uid: 1,
					UUID: 1,
					userCreateDateTime: 1, // 用户创建日期
					roles: 1, // 用户的角色
					username: '$user_info_data.username', // 用户名
					userNickname: '$user_info_data.userNickname', // 用户昵称
					email: 1, // 用户邮箱
					totalCount: 1, // 总文档数
				},
			}
			blockedUserPipeline.push(projectStep)

			const countStep = {
				$count: 'totalCount', // 统计总文档数
			}
			blockedUserCountPipeline.push(countStep)

			try {
				const userCountResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, blockedUserCountPipeline)
				const userResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, blockedUserPipeline)
				if (!userResult.success) {
					console.error('ERROR', '获取所有被封禁用户的信息失败，查询数据失败')
					return { success: false, message: '获取所有被封禁用户的信息失败，查询数据失败', totalCount: 0 }
				}

				return { success: true, message: '获取所有被封禁用户的信息成功', result: userResult.result, totalCount: userCountResult.result?.[0]?.totalCount ?? 0 }
			} catch (error) {
				console.error('ERROR', '获取所有被封禁用户的信息失败，查询数据时出错：', error)
				return { success: false, message: '获取所有被封禁用户的信息失败，查询数据时出错', totalCount: 0 }
			}
		} else {
			console.error('ERROR', '获取所有被封禁用户的信息失败，用户校验失败')
			return { success: false, message: '获取所有被封禁用户的信息失败，用户校验失败', totalCount: 0 }
		}
	} catch (error) {
		console.error('ERROR', '获取所有被封禁用户的信息时出错，未知错误：', error)
		return { success: false, message: '获取所有被封禁用户的信息时出错，未知错误', totalCount: 0 }
	}
}

/**
 * 管理员获取用户信息
 * @param adminGetUserInfoServiceRequest 管理员获取用户信息的请求载荷
 * @param adminUUID 管理员的 UUID
 * @param adminToken 管理员的 Token
 * @returns 管理员获取用户信息的请求响应
 */
export const adminGetUserInfoService = async (adminGetUserInfoRequest: AdminGetUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminGetUserInfoResponseDto> => {
	try {
		if (!checkAdminGetUserInfoRequest(adminGetUserInfoRequest)) {
			console.error('ERROR', '管理员获取用户信息失败，请求参数不合法')
			return { success: false, message: '管理员获取用户信息失败，请求参数不合法', totalCount: 0 }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理员获取用户信息失败，用户校验未通过')
			return { success: false, message: '管理员获取用户信息失败，用户校验未通过', totalCount: 0 }
		}
		const { sortBy, sortOrder } = adminGetUserInfoRequest
		if (!checkSortVariables(sortBy, sortOrder)) {
			console.error('ERROR', '管理员获取用户信息失败，排序参数不合法')
			return { success: false, message: '管理员获取用户信息失败，排序参数不合法', totalCount: 0 }
		}

		let pageSize = undefined
		let skip = 0
		if (adminGetUserInfoRequest.pagination && adminGetUserInfoRequest.pagination.page > 0 && adminGetUserInfoRequest.pagination.pageSize > 0) {
			skip = (adminGetUserInfoRequest.pagination.page - 1) * adminGetUserInfoRequest.pagination.pageSize
			pageSize = adminGetUserInfoRequest.pagination.pageSize
		}

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		const adminGetUserInfoCountPipeline: PipelineStage[] = [
			{
				$lookup: {
					from: 'user-infos', // WARN: 别忘了加复数
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data',
				},
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true, // 保留空数组和null值
				},
			},
		]

		const adminGetUserInfoPipeline: PipelineStage[] = [
			{
				$lookup: {
					from: 'user-infos', // WARN: 别忘了加复数
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data',
				},
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true, // 保留空数组和null值
				},
			},
			{
				$lookup: {
					from: 'user-invitation-codes',
					localField: 'UUID',
					foreignField: 'assigneeUUID',
					as: 'invitation_codes_data'
				},
			},
			{
				$unwind: {
					path: '$invitation_codes_data',
					preserveNullAndEmptyArrays: true
				},
			},
			{ $sort: { [`user_info_data.${sortBy}`]: sortOrder === 'descend' ? -1 : 1}},
			{ $skip: skip }, // 跳过指定数量的文档
			{ $limit: pageSize }, // 限制返回的文档数量
		]

		if (adminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview) {
			const userInfoFilter = {
				$match: {
					'user_info_data.isUpdatedAfterReview': true,
				},
			}
			adminGetUserInfoCountPipeline.push(userInfoFilter)
			adminGetUserInfoPipeline.push(userInfoFilter)
		}

		if (adminGetUserInfoRequest.uid !== undefined && adminGetUserInfoRequest.uid !== null && adminGetUserInfoRequest.uid !== -1) {
			const userInfoFilter = {
				$match: {
					uid: adminGetUserInfoRequest.uid,
				},
			}
			adminGetUserInfoCountPipeline.push(userInfoFilter)
			adminGetUserInfoPipeline.push(userInfoFilter)
		}

		const projectStep = {
			$project: {
				uid: 1,
				UUID: 1,
				userCreateDateTime: 1, // 用户创建日期
				roles: 1, // 用户的角色
				email: 1, // 用户的邮箱
				username: '$user_info_data.username', // 用户名
				userNickname: '$user_info_data.userNickname', // 用户昵称
				avatar: '$user_info_data.avatar', // 用户头像
				userBannerImage: '$user_info_data.userBannerImage', // 用户的背景图
				signature: '$user_info_data.signature', // 用户的个性签名
				gender: '$user_info_data.gender', // 用户的性别
				userBirthday: '$user_info_data.userBirthday', // 用户出生日期
				invitationCode: '$invitation_codes_data.invitationCode', // 用户的邀请码
				isUpdatedAfterReview: '$user_info_data.isUpdatedAfterReview', // 是否经过审核
				editOperatorUUID: '$user_info_data.editOperatorUUID', // 编辑操作员的 UUID
				editDateTime: '$user_info_data.editDateTime', // 编辑时间
				totalCount: 1, // 总文档数
			},
		}
		adminGetUserInfoPipeline.push(projectStep)

		const countStep = {
			$count: 'totalCount', // 统计总文档数
		}
		adminGetUserInfoCountPipeline.push(countStep)

		try {
			const userCountResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, adminGetUserInfoCountPipeline)
			const userResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, adminGetUserInfoPipeline)
			if (!userResult.success) {
				console.error('ERROR', '管理员获取用户信息失败，查询数据失败')
				return { success: false, message: '管理员获取用户信息失败，查询数据失败', totalCount: 0 }
			}

			return { success: true, message: '管理员获取用户信息成功', result: userResult.result, totalCount: userCountResult.result?.[0]?.totalCount ?? 0 }
		} catch (error) {
			console.error('ERROR', '管理员获取用户信息时出错，查询数据时出错：', error)
			return { success: false, message: '管理员获取用户信息时出错，查询数据时出错', totalCount: 0 }
		}
	} catch (error) {
		console.error('ERROR', '管理员获取用户信息时出错，未知错误：', error)
		return { success: false, message: '管理员获取用户信息时出错，未知错误', totalCount: 0 }
	}
}

/**
 * 管理员通过用户信息审核
 * @param approveUserInfoRequest 管理员通过用户信息审核的请求载荷
 * @param adminUUID 管理员的 UUID
 * @param adminToken 管理员的 Token
 * @returns 管理员通过用户信息审核的请求响应
 */
export const approveUserInfoService = async (approveUserInfoRequest: ApproveUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<ApproveUserInfoResponseDto> => {
	try {
		if (!checkApproveUserInfoRequest(approveUserInfoRequest)) {
			console.error('ERROR', '管理员通过用户信息审核失败，参数不合法')
			return { success: false, message: '管理员通过用户信息审核失败，参数不合法' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理员通过用户信息审核失败，用户校验未通过')
			return { success: false, message: '管理员通过用户信息审核失败，用户校验未通过' }
		}

		const UUID = approveUserInfoRequest.UUID
		const { collectionName, schemaInstance } = UserInfoSchema
		type UserInfo = InferSchemaType<typeof schemaInstance>

		const approveUserInfoWhere: QueryType<UserInfo> = {
			UUID,
		}
		const approveUserInfoUpdate: UpdateType<UserInfo> = {
			isUpdatedAfterReview: false,
			editDateTime: new Date().getTime(),
		}
		try {
			const updateResult = await findOneAndUpdateData4MongoDB(approveUserInfoWhere, approveUserInfoUpdate, schemaInstance, collectionName)
			if (!updateResult.success) {
				console.error('ERROR', '管理员通过用户信息审核失败，向数据库更新数据失败')
				return { success: false, message: '管理员通过用户信息审核失败，向数据库更新数据失败' }
			}

			return { success: true, message: '管理员通过用户信息审核成功' }
		} catch (error) {
			console.error('ERROR', '管理员通过用户信息审核时出错，向数据库更新数据时出错：', error)
			return { success: false, message: '管理员通过用户信息审核时出错，向数据库更新数据时出错' }
		}
	} catch (error) {
		console.error('ERROR', '管理员通过用户信息审核时出错，未知错误：', error)
		return { success: false, message: '管理员通过用户信息审核时出错，未知错误' }
	}
}

/**
 * 管理员清空某个用户的信息
 * @param approveUserInfoRequest 管理员清空某个用户的信息的请求载荷
 * @param adminUUID 管理员的 UUID
 * @param adminToken 管理员的 Token
 * @returns 管理员清空某个用户的信息请求响应
 */
export const adminClearUserInfoService = async (adminClearUserInfoRequest: AdminClearUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminClearUserInfoResponseDto> => {
	try {
		if (!checkAdminClearUserInfoRequest(adminClearUserInfoRequest)) {
			console.error('ERROR', '管理员清空某个用户的信息失败，参数不合法')
			return { success: false, message: '管理员清空某个用户的信息失败，参数不合法' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理员清空某个用户的信息失败，用户校验未通过')
			return { success: false, message: '管理员清空某个用户的信息失败，用户校验未通过' }
		}

		const uid = adminClearUserInfoRequest.uid
		const UUID = await getUserUuid(uid)
		if (!UUID) {
			console.error('ERROR', '管理员清空某个用户的信息失败，UUID 不存在', { uid })
			return { success: false, message: '管理员清空某个用户的信息失败，UUID 不存在' }
		}
		let username: string
		while (true) {
			username = `${UUID}_${generateSecureRandomString(6)}`
			const checkResult = await checkUsernameService({ username })
			if (checkResult.success && checkResult.isAvailableUsername) {
				break
			}
		}

		const { collectionName, schemaInstance } = UserInfoSchema
		type UserInfo = InferSchemaType<typeof schemaInstance>

		const adminClearUserInfoWhere: QueryType<UserInfo> = {
			uid, // TODO: 也许可以删掉
			UUID,
		}
		const adminClearUserInfoUpdate: UpdateType<UserInfo> = {
			username,
			userNickname: '[cleaned]',
			avatar: '',
			userBannerImage: '',
			signature: '',
			gender: '',
			label: [] as UserInfo['label'], // TODO: Mongoose issue: #12420
			userBirthday: '',
			userProfileMarkdown: '',
			userLinkedAccounts: [] as UserInfo['userLinkedAccounts'], // TODO: Mongoose issue: #12420
			userWebsite: { websiteName: '', websiteUrl: '' },
			isUpdatedAfterReview: false, // 清除信息的直接设为 false
			editOperatorUUID: adminUUID,
			editDateTime: new Date().getTime(),
		}
		try {
			const updateResult = await findOneAndUpdateData4MongoDB(adminClearUserInfoWhere, adminClearUserInfoUpdate, schemaInstance, collectionName)
			if (!updateResult.success) {
				console.error('ERROR', '管理员清空某个用户的信息失败，向数据库更新数据失败')
				return { success: false, message: '管理员清空某个用户的信息失败，向数据库更新数据失败' }
			}

			return { success: true, message: '管理员清空某个用户的信息成功' }
		} catch (error) {
			console.error('ERROR', '管理员清空某个用户的信息时出错，向数据库更新数据时出错：', error)
			return { success: false, message: '管理员清空某个用户的信息时出错，向数据库更新数据时出错' }
		}
	} catch (error) {
		console.error('ERROR', '管理员清空某个用户的信息时出错，未知错误：', error)
		return { success: false, message: '管理员清空某个用户的信息时出错，未知错误' }
	}
}

/**
 * 管理员编辑用户信息
 * @param AdminEditUserInfoRequestDto 管理员编辑用户信息的请求载荷
 * @param adminUUID 管理员的 UUID
 * @param adminToken 管理员的 Token
 * @return 管理员编辑用户信息的请求响应
 */
export const adminEditUserInfoService = async (adminEditUserInfoRequest: AdminEditUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminEditUserInfoResponseDto> => {
	try {
		if (!checkAdminEditUserInfoRequest(adminEditUserInfoRequest)) {
			console.error('ERROR', '管理员编辑用户信息失败，参数不合法')
			return { success: false, message: '管理员编辑用户信息失败，参数不合法' }
		}

		const { uid } = adminEditUserInfoRequest
		const { username } = adminEditUserInfoRequest.userInfo
		const usernameStandardized = username.trim().normalize()
		const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema

		if (username) {
			const checkResult = await checkUsernameService({ username: usernameStandardized })

			if (!checkResult.success || !checkResult.isAvailableUsername) {
				console.error('ERROR', '管理员编辑用户信息失败，用户名不可用', { adminEditUserInfoRequest, uid })
				return { success: false, message: '管理员编辑用户信息失败，用户名不可用' }
			}
		}

		const UUID = await getUserUuid(uid)
		if (!UUID) {
			console.error('ERROR', '管理员编辑用户信息失败，UUID 不存在', { uid })
			return { success: false, message: '管理员编辑用户信息失败，UUID 不存在' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理员编辑用户信息失败，用户校验未通过')
			return { success: false, message: '管理员编辑用户信息失败，用户校验未通过' }
		}

		type UserInfo = InferSchemaType<typeof userInfoSchemaInstance>
		const adminEditUserInfoWhere: QueryType<UserInfo> = {
			UUID,
		}
		const adminEditUserInfoUpdate: UpdateType<UserInfo> = {
			...adminEditUserInfoRequest.userInfo,
			editOperatorUUID: adminUUID,
			editDateTime: new Date().getTime(),
		}

		const updateUserInfoResult = await findOneAndUpdateData4MongoDB(adminEditUserInfoWhere, adminEditUserInfoUpdate, userInfoSchemaInstance, userInfoCollectionName)
		if (!updateUserInfoResult.success) {
			console.error('ERROR', '管理员编辑用户信息失败，向数据库更新数据失败')
			return { success: false, message: '管理员编辑用户信息失败，向数据库更新数据失败' }
		}
		return { success: true, message: '管理员编辑用户信息成功' }

	} catch (error) {
		console.error('ERROR', '管理员编辑用户信息时出错，未知错误：', error)
		return { success: false, message: '管理员编辑用户信息时出错，未知错误' }
	}
}

/**
 * 根据 UID 获取 UUID
 * @param uid 用户 UID
 * @returns UUID
 */
export const getUserUuid = async (uid: number): Promise<string | void> => {
	try {
		if (uid === undefined || uid === null || uid <= 0) {
			console.error('ERROR', '通过 UID 获取 UUID 失败，UID 不合法')
			return
		}
		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaSchemaInstance>

		const getUuidWhere: QueryType<UserAuth> = {
			uid,
		}

		const getUuidSelect: SelectType<UserAuth> = {
			UUID: 1,
		}

		const getUuidResult = await selectDataFromMongoDB(getUuidWhere, getUuidSelect, userAuthSchemaSchemaInstance, userAuthCollectionName)
		if (getUuidResult.success && getUuidResult.result?.length === 1) {
			return getUuidResult.result[0].UUID
		} else {
			console.error('ERROR', '通过 UID 获取 UUID 失败，UUID 不存在或结果长度不为 1')
		}
	} catch (error) {
		console.error('ERROR', '通过 UID 获取 UUID 时出错：', error)
		return
	}
}

/**
 * 根据 UUID 获取 UID
 * @param uuid 用户 UUID
 * @returns UID
 */
export const getUserUid = async (uuid: string): Promise<number | undefined> => {
	try {
		if (!uuid) {
			console.error('ERROR', '通过 UUID 获取 UID 失败，UUID 不合法')
			return
		}
		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaSchemaInstance>

		const getUidWhere: QueryType<UserAuth> = {
			UUID: uuid,
		}

		const getUidSelect: SelectType<UserAuth> = {
			uid: 1,
		}

		const getUidResult = await selectDataFromMongoDB(getUidWhere, getUidSelect, userAuthSchemaSchemaInstance, userAuthCollectionName)
		if (getUidResult.success && getUidResult.result?.length === 1) {
			return getUidResult.result[0].uid
		} else {
			console.error('ERROR', '通过 UUID 获取 UID 失败，UID 不存在或结果长度不为 1')
		}
	} catch (error) {
		console.error('ERROR', '通过 UUID 获取 UID 时出错：', error)
		return undefined
	}
}

/**
 * 检查用户 Token，检查 Token 和用户 uid 是否吻合，判断用户是否已注册
 * // DELETE ME 这是一个临时的解决方案，以后 Cookie 中直接存储 UUID
 * @param uid 用户 ID
 * @param token 用户 Token
 * @returns boolean 如果验证通过则为 true，不通过为 false
 */
const checkUserToken = async (uid: number, token: string): Promise<boolean> => {
	try {
		if (uid !== null && !Number.isNaN(uid) && uid !== undefined && token) {
			const { collectionName, schemaInstance } = UserAuthSchema
			type UserAuth = InferSchemaType<typeof schemaInstance>
			const userTokenWhere: QueryType<UserAuth> = {
				uid,
				token,
			}
			const userTokenSelect: SelectType<UserAuth> = {
				uid: 1,
			}
			try {
				const userInfo = await selectDataFromMongoDB(userTokenWhere, userTokenSelect, schemaInstance, collectionName)
				if (userInfo && userInfo.success) {
					if (userInfo.result?.length === 1) {
						return true
					} else {
						console.error('ERROR', `查询用户 Token 时，用户信息长度不为 1，用户uid：【${uid}】`)
						return false
					}
				} else {
					console.error('ERROR', `查询用户 Token 时未查询到用户信息，用户uid：【${uid}】，错误描述：${userInfo.message}，错误信息：${userInfo.error}`)
					return false
				}
			} catch (error) {
				console.error('ERROR', `查询用户 Token 时出错，用户uid：【${uid}】，错误信息：`, error)
				return false
			}
		} else {
			console.error('ERROR', `查询用户 Token 时出错，必要的参数 uid 或 token为空：【${uid}】`)
			return false
		}
	} catch (error) {
		console.error('ERROR', '查询用户 Token 时出错，未知错误：', error)
		return false
	}
}

/**
 * 检查用户 Token，检查 Token 和用户 uuid 是否吻合，判断用户是否已注册
 * @param UUID 用户 UUID
 * @param token 用户 Token
 * @returns boolean 如果验证通过则为 true，不通过为 false
 */
const checkUserTokenByUUID = async (UUID: string, token: string): Promise<boolean> => {
	try {
		if (UUID !== null && !Number.isNaN(UUID) && UUID !== undefined && token) {
			const { collectionName, schemaInstance } = UserAuthSchema
			type UserAuth = InferSchemaType<typeof schemaInstance>
			const userTokenWhere: QueryType<UserAuth> = {
				UUID,
				token,
			}
			const userTokenSelect: SelectType<UserAuth> = {
				uid: 1,
			}
			try {
				const userInfo = await selectDataFromMongoDB(userTokenWhere, userTokenSelect, schemaInstance, collectionName)
				if (userInfo && userInfo.success) {
					if (userInfo.result?.length === 1) {
						return true
					} else {
						console.error('ERROR', `查询用户 Token 时，用户信息长度不为 1，用户 UUID: ${UUID}`)
						return false
					}
				} else {
					console.error('ERROR', `查询用户 Token 时未查询到用户信息，用户 UUID: ${UUID}，错误描述：${userInfo.message}，错误信息：${userInfo.error}`)
					return false
				}
			} catch (error) {
				console.error('ERROR', `查询用户 Token 时出错，用户 UUID: ${UUID}，错误信息：`, error)
				return false
			}
		} else {
			console.error('ERROR', `查询用户 Token 时出错，必要的参数 uid 或 token为空 UUID: ${UUID}`)
			return false
		}
	} catch (error) {
		console.error('ERROR', '查询用户 Token 时出错，未知错误：', error)
		return false
	}
}

/** 通过恢复码删除用户 2FA 的参数 */
type DeleteTotpAuthenticatorByRecoveryCodeParametersDto = {
	/** 用户邮箱 */
	email: string,
	/** 恢复码 */
	recoveryCodeHash: string,
	/** 事务 */
	session?: mongoose.ClientSession,
}

/** 通过恢复码删除用户 2FA 的结果 */
type DeleteTotpAuthenticatorByRecoveryCodeResultDto = {} & DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto

/**
 * 通过恢复码删除用户 2FA，只能在登录时使用
 * @param deleteTotpAuthenticatorByRecoveryCodeData 通过恢复码删除用户 2FA 的参数
 * @returns 通过恢复码删除用户 2FA 的结果
 */
const deleteTotpAuthenticatorByRecoveryCode = async (deleteTotpAuthenticatorByRecoveryCodeData: DeleteTotpAuthenticatorByRecoveryCodeParametersDto): Promise<DeleteTotpAuthenticatorByRecoveryCodeResultDto> => {
	try {
		if (!checkDeleteTotpAuthenticatorByRecoveryCodeData(deleteTotpAuthenticatorByRecoveryCodeData)) {
			console.error('ERROR', '通过恢复码删除用户 2FA 失败，参数不合法')
			return { success: false, message: '通过恢复码删除用户 2FA 失败，参数不合法' }
		}

		const { email, recoveryCodeHash, session } = deleteTotpAuthenticatorByRecoveryCodeData
		const emailLowerCase = email.toLowerCase()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>
		const userAuthWhere: QueryType<UserAuth> = { emailLowerCase: emailLowerCase }
		const userAuthSelect: SelectType<UserAuth> = { UUID: 1 }
		const userInfo = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })

		const uuid = userInfo?.result?.[0]?.UUID
		if (!uuid) {
			console.error('ERROR', '通过恢复码删除用户 2FA 失败，无法获取用户信息', { emailLowerCase })
			return { success: false, message: '通过恢复码删除用户 2FA 失败，无法获取用户信息' }
		}

		const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
		type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
		const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID: uuid, recoveryCodeHash }
		const deleteResult = await deleteDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!deleteResult.success) {
			console.error('ERROR', '通过恢复码删除用户 2FA 失败，删除失败', { emailLowerCase })
			return { success: false, message: '通过恢复码删除用户 2FA 失败，删除失败' }
		}

		const resetResult = await resetUser2FATypeByUUID(uuid, session)

		if (!resetResult) {
			console.error('ERROR', '通过恢复码删除用户 2FA 失败，重置用户 2FA 数据失败', { emailLowerCase })
			return { success: false, message: '通过恢复码删除用户 2FA 失败，重置用户 2FA 数据失败' }
		}

		return { success: true, message: '用户的身份验证器已删除' }
	} catch (error) {
		console.error('ERROR', '通过恢复码删除用户 2FA失败', error)
		return { success: false, message: '通过恢复码删除用户 2FA 失败，发生未知错误' }
	}
}

/**
 * 已登录用户通过密码和 TOTP 验证码删除身份验证器
 * @param deleteTotpAuthenticatorByTotpVerificationCodeRequest 登录用户通过密码和 TOTP 验证码删除身份验证器的请求载荷
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 * @returns 删除操作的结果
 */
export const deleteTotpAuthenticatorByTotpVerificationCodeService = async (deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto, uuid: string, token: string): Promise<DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto> => {
	try {
		if (!checkDeleteTotpAuthenticatorByTotpVerificationCodeRequest(deleteTotpAuthenticatorByTotpVerificationCodeRequest)) {
			console.error('ERROR', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，参数不合法')
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器验证器失败，参数不合法' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，用户校验未通过')
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器验证器失败，用户校验未通过' }
		}

		const session = await mongoose.startSession()
		session.startTransaction()

		const now = new Date().getTime()
		const { clientOtp, passwordHash } = deleteTotpAuthenticatorByTotpVerificationCodeRequest
		const maxAttempts	 = 5
		const lockTime = 60 * 60 * 1000

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const userLoginWhere: QueryType<UserAuth> = { UUID: uuid }
		const userLoginSelect: SelectType<UserAuth> = {
			passwordHashHash: 1,
		}

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userLoginWhere, userLoginSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		const passwordHashHash = userAuthResult.result?.[0]?.passwordHashHash
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `已登录用户通过密码和 TOTP 验证码删除身份验证器失败，无法查询到用户安全信息`)
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，无法查询到用户安全信息' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, passwordHashHash)
		if (!isCorrectPassword) {
			console.error('ERROR', `已登录用户通过密码和 TOTP 验证码删除身份验证器失败，无法查询到用户安全信息`)
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，用户密码不正确' }
		}

		const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
		type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
		const deleteTotpAuthenticatorByTotpVerificationCodeWhere: QueryType<UserTotpAuthenticator> = {
			UUID: uuid,
			enabled: true,
		}
		const deleteTotpAuthenticatorByTotpVerificationCodeSelect: SelectType<UserTotpAuthenticator> = {
			secret: 1,
			backupCodeHash: 1,
			lastAttemptTime: 1,
			attempts: 1,
		}

		const selectResult = await selectDataFromMongoDB<UserTotpAuthenticator>(deleteTotpAuthenticatorByTotpVerificationCodeWhere, deleteTotpAuthenticatorByTotpVerificationCodeSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })
		if (!selectResult.success || selectResult.result.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败：删除失败，未找到匹配的数据')
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败：删除失败，未找到匹配的数据' }
		}

		let attempts = selectResult.result[0].attempts
		const totpSecret = selectResult.result[0].secret

		// 限制用户尝试删除的频率
		if (selectResult.result[0].attempts >= maxAttempts) {
			const lastAttemptTime = new Date(selectResult.result[0].lastAttemptTime).getTime();
			if (now - lastAttemptTime < lockTime) {
				attempts += 1

				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.warn('WARN', 'WARNING', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，已达最大尝试次数，请稍后再试');
				return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，已达最大尝试次数，请稍后再试', isCoolingDown: true }
			} else {
				attempts = 0
			}

			const deleteTotpAuthenticatorByTotpVerificationCodeUpdate: UpdateType<UserTotpAuthenticator> = {
				attempts: attempts,
				lastAttemptTime: now,
				editDateTime: now,
			}
			const updateAuthenticatorResult = await findOneAndUpdateData4MongoDB<UserTotpAuthenticator>(deleteTotpAuthenticatorByTotpVerificationCodeWhere, deleteTotpAuthenticatorByTotpVerificationCodeUpdate, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

			if (!updateAuthenticatorResult.success) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，更新最后尝试时间或尝试次数失败');
				return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败，更新最后尝试时间或尝试次数失败', isCoolingDown: true }
			}
		}

		if (!authenticator.check(clientOtp, totpSecret)) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '已登录用户通过密码和邮 TOTP 证码删除身份验证器失败：删除失败，验证码错误')
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败：删除失败，验证码错误' }
		}

		// 调用删除函数
		const deleteResult = await deleteDataFromMongoDB(deleteTotpAuthenticatorByTotpVerificationCodeWhere, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })
		const resetResult = await resetUser2FATypeByUUID(uuid, session)

		if (!deleteResult.success || deleteResult.result.deletedCount !== 1 || !resetResult) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '已登录用户通过密码和 TOTP 验证码删除身份验证器失败：删除失败，未找到匹配的数据或重置用户 2FA 数据失败')
			return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败：删除失败，未找到匹配的数据或重置用户 2FA 数据失败' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, message: '删除 TOTP 身份验证器成功' }
	} catch (error) {
		console.error('已登录用户通过密码和 TOTP 验证码删除身份验证器失败时出错，未知错误', error)
		return { success: false, message: '已登录用户通过密码和 TOTP 验证码删除身份验证器失败时出错，未知错误' }
	}
}

/**
 * 根据 UUID 重置 user-auth 表中用户的 authenticatorType 字段为 none，在 deleteTotpAuthenticatorByRecoveryCode, deleteTotpAuthenticatorByTotpVerificationCodeService 和 deleteUserEmailAuthenticatorService 中用到
 * @param uuid 用户的 UUID
 * @param session Mongoose Session
 * @returns boolean 执行是否成功
 */
const resetUser2FATypeByUUID = async (uuid: string, session: ClientSession): Promise<boolean> => {
	try {
		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>
		const userAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const userAuthUpdate: UpdateType<UserAuth> = { authenticatorType: 'none' }

		const updateResult = await updateData4MongoDB<UserAuth>(userAuthWhere, userAuthUpdate, userAuthSchemaInstance, userAuthCollectionName, { session })

		return !!updateResult.success
	} catch (error) {
		console.error('ERROR', '根据 UUID 重置 user-auth 表中用户的 authenticatorType 字段时出错，未知错误：', error)
		return false
	}
}

/**
 * 用户创建 TOTP 身份验证器服务
 * 开启邮箱验证的是另一个函数，这个只是开启 totp
 * 这里只是创建，然后还有一个确认创建的步骤。
 *
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 * @returns 用户创建 TOTP 身份验证器的请求响应
 */
export const createUserTotpAuthenticatorService = async (uuid: string, token: string): Promise<CreateUserTotpAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('创建 TOTP 身份验证器失败，非法用户', { uuid })
			return { success: false, isExists: false, message: '创建 TOTP 身份验证器失败，非法用户' }
		}

		const session = await mongoose.startSession()
		session.startTransaction()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const createUserTotpAuthenticatorUserAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const createUserTotpAuthenticatorUserAuthSelect: SelectType<UserAuth> = {
			authenticatorType: 1,
			email: 1,
		}

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(createUserTotpAuthenticatorUserAuthWhere, createUserTotpAuthenticatorUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })

		if (!userAuthResult.success || !userAuthResult?.result || userAuthResult.result?.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，用户不存在', { uuid })
			return { success: false, isExists: false, message: '创建 TOTP 身份验证器失败，用户不存在' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，已经开启 Email 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: '创建 TOTP 身份验证器失败，已经开启 Email 2FA' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，已经开启 TOTP 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: '创建 TOTP 身份验证器失败，已经开启 TOTP 2FA' }
		}

		const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
		type UserAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
		const checkUserAuthenticatorWhere: QueryType<UserAuthenticator> = { UUID: uuid, enabled: true }
		const checkUserAuthenticatorSelect: SelectType<UserAuthenticator> = { enabled: 1, createDateTime: 1 }
		const checkUserAuthenticatorResult = await selectDataFromMongoDB(checkUserAuthenticatorWhere, checkUserAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!checkUserAuthenticatorResult.success || !checkUserAuthenticatorResult.result) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，验证器唯一检查失败', { uuid })
			return { success: false, isExists: false, message: '创建身份验证器失败，验证器唯一检查失败' }
		}

		if (checkUserAuthenticatorResult.result.length >= 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，数据库中已经存储了一个启用的 TOTP 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: '创建 TOTP 身份验证器失败，数据库中已经存储了一个启用的身份验证器' }
		}

		const now = new Date().getTime()
		const secret = authenticator.generateSecret()
		const email = userAuthResult.result[0].email
		const otpAuth = authenticator.keyuri(email, 'KIRAKIRA☆DOUGA', secret)
		const attempts = 0

		// 准备要插入的身份验证器数据
		const userAuthenticatorData: UserAuthenticator = {
			UUID: uuid,
			enabled: false,
			secret,
			otpAuth,
			backupCodeHash: [],
			attempts,
			lastAttemptTime: now,
			createDateTime: now,
			editDateTime: now,
		}

		// 插入数据到数据库
		const saveTotpAuthenticatorResult = await insertData2MongoDB<UserAuthenticator>(userAuthenticatorData, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!saveTotpAuthenticatorResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，保存数据失败', { uuid })
			return { success: false, isExists: false, message: '创建 TOTP 身份验证器失败，保存数据失败' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, isExists: false, message: '创建 TOTP 身份验证器成功', result: { otpAuth } }
	} catch (error) {
		console.error('创建 TOTP 身份验证器失败时出错，未知错误', error)
		return { success: false, isExists: false, message: '创建 TOTP 身份验证器时出错，未知错误' }
	}
}

/**
 * 用户确认绑定 TOTP 设备
 * @param confirmUserTotpAuthenticatorRequest 用户确认绑定 TOTP 设备的请求载荷
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 * @returns 用户确认绑定 TOTP 设备的请求响应
 */
export const confirmUserTotpAuthenticatorService = async (confirmUserTotpAuthenticatorRequest: ConfirmUserTotpAuthenticatorRequestDto, uuid: string, token: string): Promise<ConfirmUserTotpAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('确认绑定 TOTP 设备失败，非法用户')
			return { success: false, message: '确认绑定 TOTP 设备失败，非法用户' }
		}

		const { clientOtp, otpAuth } = confirmUserTotpAuthenticatorRequest

		const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
		type UserAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
		const confirmUserTotpAuthenticatorWhere: QueryType<UserAuthenticator> = {
			UUID: uuid,
			enabled: false,
			otpAuth,
		}
		const confirmUserTotpAuthenticatorSelect: SelectType<UserAuthenticator> = {
			secret: 1,
		}

		const session = await mongoose.startSession()
		session.startTransaction()

		const selectResult = await selectDataFromMongoDB<UserAuthenticator>(confirmUserTotpAuthenticatorWhere, confirmUserTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!selectResult.success || selectResult.result.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('确认绑定 TOTP 设备失败，获取验证数据失败')
			return { success: false, message: '确认绑定 TOTP 设备失败，获取验证数据失败' }
		}

		const totpSecret = selectResult.result[0].secret
		if (!authenticator.check(clientOtp, totpSecret)) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('确认绑定 TOTP 设备失败，验证失败')
			return { success: false, message: '确认绑定 TOTP 设备失败，验证失败' }
		}

		const now = new Date().getTime()
		const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
		const recoveryCode = generateSecureVerificationStringCode(24, charset)
		const recoveryCodeHash = hashPasswordSync(recoveryCode)
		const backupCode = Array.from({ length: 5 }, () => generateSecureVerificationStringCode(6, charset))
		const backupCodeHash = backupCode.map(hashPasswordSync)

		const confirmUserTotpAuthenticatorUpdate: UpdateType<UserAuthenticator> = {
			enabled: true,
			recoveryCodeHash,
			backupCodeHash,
			editDateTime: now,
		}

		const updateAuthenticatorResult = await findOneAndUpdateData4MongoDB<UserAuthenticator>(confirmUserTotpAuthenticatorWhere, confirmUserTotpAuthenticatorUpdate, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const userAuthWhere: QueryType<UserAuth> = {
			UUID: uuid,
		}
		const userAuthUpdate: UpdateType<UserAuth> = {
			authenticatorType: 'totp',
			editDateTime: now,
		}
		const updateUserAuthResult = await findOneAndUpdateData4MongoDB<UserAuthenticator>(userAuthWhere, userAuthUpdate, userAuthSchemaInstance, userAuthCollectionName, { session })

		if (!updateAuthenticatorResult.success || !updateAuthenticatorResult.result || !updateUserAuthResult.success || !updateUserAuthResult.result) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('确认绑定 TOTP 设备失败，更新失败')
			return { success: false, message: '确认绑定 TOTP 设备失败，更新失败' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, result: { backupCode, recoveryCode }, message: '已绑定 TOTP 设备' }
	} catch (error) {
		console.error('确认绑定 TOTP 设备时出错，未知错误', error)
		return { success: false, message: '确认绑定 TOTP 设备时出错，未知错误' }
	}
}

/**
 * 用户创建 Email 身份验证器服务
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 * @returns 用户创建 Email 身份验证器的请求响应
 */
export const createUserEmailAuthenticatorService = async (uuid: string, token: string): Promise<CreateUserEmailAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('创建 Email 身份验证器失败，非法用户', { uuid })
			return { success: false, isExists: false, message: '创建 Email 身份验证器失败，非法用户' }
		}

		const session = await mongoose.startSession()
		session.startTransaction()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const createUserEmailAuthenticatorUserAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const createUserEmailAuthenticatorUserAuthSelect: SelectType<UserAuth> = {
			authenticatorType: 1,
			emailLowerCase: 1,
			email: 1,
		}
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(createUserEmailAuthenticatorUserAuthWhere, createUserEmailAuthenticatorUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		if (!userAuthResult.success || !userAuthResult?.result || userAuthResult.result?.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，用户不存在', { uuid })
			return { success: false, isExists: false, message: '创建 TOTP 身份验证器失败，用户不存在' }
		}

		const email = userAuthResult.result[0].email
		const emailLowerCase = userAuthResult.result[0].emailLowerCase
		if (!emailLowerCase) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，未找到邮箱', { uuid })
			return { success: false, isExists: false, message: '创建 TOTP 身份验证器失败，未找到邮箱' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，已经开启 Email 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: '创建 TOTP 身份验证器失败，已经开启 Email 2FA' }
		}

		if (userAuthResult.result[0].authenticatorType === 'totp') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 TOTP 身份验证器失败，已经开启 TOTP 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: '创建 TOTP 身份验证器失败，已经开启 TOTP 2FA' }
		}

		const { collectionName: UserEmailAuthenticatorCollectionName, schemaInstance: userEmailAuthenticatorSchemaInstance } = UserEmailAuthenticatorSchema
		type UserAuthenticator = InferSchemaType<typeof userEmailAuthenticatorSchemaInstance>
		const checkUserAuthenticatorWhere: QueryType<UserAuthenticator> = { UUID: uuid, enabled: true }
		const checkUserAuthenticatorSelect: SelectType<UserAuthenticator> = {
			enabled: 1,
			createDateTime: 1
		}

		const checkUserAuthenticatorResult = await selectDataFromMongoDB(checkUserAuthenticatorWhere, checkUserAuthenticatorSelect, userEmailAuthenticatorSchemaInstance, UserEmailAuthenticatorCollectionName, { session })

		if (!checkUserAuthenticatorResult.success || !checkUserAuthenticatorResult.result) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 Email 身份验证器失败，验证器唯一检查失败', { uuid })
			return { success: false, isExists: false, message: '创建身份验证器失败，验证器唯一检查失败' }
		}

		if (checkUserAuthenticatorResult.result.length >= 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 Email 身份验证器失败，数据库中已经存储了一个启用的 Email 2FA', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: '创建 Email 身份验证器失败，数据库中已经存储了一个启用的' }
		}

		const now = new Date().getTime()

		// 准备要插入的身份验证器数据
		const userAuthenticatorData: UserAuthenticator = {
			UUID: uuid,
			enabled: true,
			emailLowerCase,
			createDateTime: now,
			editDateTime: now,
		}

		// 插入数据到数据库
		const saveEmailAuthenticatorResult = await insertData2MongoDB<UserAuthenticator>(userAuthenticatorData, userEmailAuthenticatorSchemaInstance, UserEmailAuthenticatorCollectionName, { session })

		if (!saveEmailAuthenticatorResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 Email 身份验证器失败，保存数据失败-1', { uuid })
			return { success: false, isExists: false, message: '创建 Email 身份验证器失败，保存数据失败-1' }
		}
		const userAuthWhere: QueryType<UserAuth> = {
			UUID: uuid,
		}
		const userAuthUpdate: UpdateType<UserAuth> = {
			authenticatorType: 'email',
			editDateTime: now,
		}
		const updateUserAuthResult = await findOneAndUpdateData4MongoDB<UserAuthenticator>(userAuthWhere, userAuthUpdate, userAuthSchemaInstance, userAuthCollectionName, { session })

		if (!updateUserAuthResult.success || !updateUserAuthResult.result) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('创建 Email 身份验证器失败，保存数据失败-2', { uuid })
			return { success: false, isExists: false, message: '创建 Email 身份验证器失败，保存数据失败-2' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, isExists: false, message: '创建 Email 身份验证器成功', result: { email, emailLowerCase } }
	} catch (error) {
		console.error('创建 Email 身份验证器失败时出错，未知错误', error)
		return { success: false, isExists: false, message: '创建 Email 身份验证器时出错，未知错误' }
	}
}

/**
 * 用户发送 Email 身份验证器验证邮件
 * @param sendUserEmailAuthenticatorRequestDto 用户发送 Email 身份验证器验证邮件的请求载荷
 * @returns 用户发送 Email 身份验证器验证邮件的请求响应
 */
export const sendUserEmailAuthenticatorService = async (sendUserEmailAuthenticatorVerificationCodeRequest: SendUserEmailAuthenticatorVerificationCodeRequestDto): Promise<SendUserEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkSendUserEmailAuthenticatorVerificationCodeRequest(sendUserEmailAuthenticatorVerificationCodeRequest)) {
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，参数不合法')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，参数不合法' }
		}

		const { clientLanguage, email, passwordHash } = sendUserEmailAuthenticatorVerificationCodeRequest
		const emailLowerCase = email.toLowerCase()

		const nowTime = new Date().getTime()
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)

		// 启动事务
		const session = await createAndStartSession()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema

		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const sendUserEmailAuthenticatorUserAuthWhere: QueryType<UserAuth> = { emailLowerCase: emailLowerCase }
		const sendUserEmailAuthenticatorUserAuthSelect: SelectType<UserAuth> = {
			passwordHashHash: 1,
			authenticatorType: 1,
			UUID: 1,
		}
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(sendUserEmailAuthenticatorUserAuthWhere, sendUserEmailAuthenticatorUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		const userAuthData = userAuthResult.result?.[0]
		const { UUID: uuid, passwordHashHash } = userAuthData

		if (!userAuthResult.success || userAuthResult.result?.length !== 1 || !email) {
			await abortAndEndSession(session)
			console.error('请求发送身份验证器的邮箱验证码失败，用户不存在')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，用户不存在' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, passwordHashHash)
		if (!isCorrectPassword) {
			await abortAndEndSession(session)
			console.error('请求发送身份验证器的邮箱验证码失败，密码错误')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，密码错误' }
		}

		if (userAuthData.authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('请求发送身份验证器的邮箱验证码失败，用户未开启 2FA 或者 2FA 方式不是 Email。')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，用户未开启 2FA 或者 2FA 方式不是 Email。' }
		}

		const { collectionName: userEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: userEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof userEmailAuthenticatorVerificationCodeSchemaInstance>
		const requestSendEmailAuthenticatorByEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // 用户邮箱
			attemptsTimes: 1, // 验证码请求次数
			lastRequestDateTime: 1, // 用户上一次请求验证码的时间，用于防止滥用
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSendEmailAuthenticatorByEmailVerificationCodeSelect, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!requestSendEmailAuthenticatorByEmailVerificationCodeResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，获取验证码失败')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，获取验证码失败' }
		}

		const lastRequestDateTime = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && lastRequestDateTime + 55000 > nowTime) { // 是否仍在冷却，前端 60 秒，后端 55 秒
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '请求发送身份验证器的邮箱验证码失败，未超过邮件超时时间，请稍后再试')
			return { success: true, isCoolingDown: true, message: '请求发送身份验证器的邮箱验证码失败，未超过邮件超时时间，请稍后再试' }
		}

		const attemptsTimes = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
		const lastRequestDate = new Date(lastRequestDateTime)
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && todayStart < lastRequestDate && attemptsTimes > 5) { // ! 每天五次机会
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '请求发送身份验证器的邮箱验证码失败，已达本日重复次数上限，请稍后再试')
			return { success: true, isCoolingDown: true, message: '请求发送身份验证器的邮箱验证码失败，已达本日重复次数上限，请稍后再试' }
		}

		const verificationCode = generateSecureVerificationNumberCode(6) // 生成六位随机数验证码
		let newAttemptsTimes = attemptsTimes + 1
		if (todayStart > lastRequestDate) {
			newAttemptsTimes = 0
		}

		const requestSeDeleteTotpAuthenticatorVerificationCodeUpdate: UpdateType<UserEmailAuthenticatorVerificationCode> = {
			verificationCode,
			overtimeAt: nowTime + 1800000, // 当前时间加上 1800000 毫秒（30 分钟）作为新的过期时间
			attemptsTimes: newAttemptsTimes,
			lastRequestDateTime: nowTime,
			editDateTime: nowTime,
		}

		const updateResult = await findOneAndUpdateData4MongoDB(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSeDeleteTotpAuthenticatorVerificationCodeUpdate, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!updateResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，更新或新增用户验证码失败')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，更新或新增用户验证码失败' }
		}

		try {
			const mail = getI18nLanguagePack(clientLanguage, "SendLoginVerificationCode")
			const correctMailTitle = mail?.mailTitle
			const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

			const sendMailResult = await sendMail(email, correctMailTitle, { html: correctMailHTML })

			if (!sendMailResult.success) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', '请求发送验证身份验证器的邮箱验证码失败，邮件发送失败')
				return { success: false, isCoolingDown: true, message: '请求发送验证身份验证器的邮箱验证码失败，邮件发送失败' }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, isCoolingDown: false, message: '验证身份验证器的邮箱验证码已发送至你注册时使用的邮箱，请注意查收，如未收到，请检查垃圾箱或联系 KIRAKIRA 客服。' }
		} catch (error) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送验证身份验证器的邮箱验证码时出错，邮件发送时出错', error)
			return { success: false, isCoolingDown: true, message: '请求发送验证身份验证器的邮箱验证码时出错，邮件发送时出错' }
		}
	} catch (error) {
		console.error('ERROR', '请求发送验证身份验证器的邮箱验证码时出错，未知错误', error)
		return { success: false, isCoolingDown: false, message: '请求发送验证身份验证器的邮箱验证码时出错，未知错误' }
	}
}

/**
 * 用户发送删除 Email 身份验证器验证邮件
 * @param sendDeleteUserEmailAuthenticatorVerificationCodeRequest 用户发送删除 Email 身份验证器验证邮件的请求载荷
 * @returns 用户发送 Email 身份验证器验证邮件的请求响应
 */
export const sendDeleteUserEmailAuthenticatorService = async (sendDeleteUserEmailAuthenticatorVerificationCodeRequest: SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto, uuid: string, token: string): Promise<SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkSendDeleteUserEmailAuthenticatorVerificationCodeRequest(sendDeleteUserEmailAuthenticatorVerificationCodeRequest)) {
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，参数不合法')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，参数不合法' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('请求发送身份验证器的邮箱验证码失败，用户校验未通过')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，用户校验未通过' }
		}

		const { clientLanguage } = sendDeleteUserEmailAuthenticatorVerificationCodeRequest

		const nowTime = new Date().getTime()
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)

		// 启动事务
		const session = await createAndStartSession()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema

		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const sendDeleteUserEmailAuthenticatorUserAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const sendDeleteUserEmailAuthenticatorUserAuthSelect: SelectType<UserAuth> = {
			authenticatorType: 1,
			email: 1,
		}
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(sendDeleteUserEmailAuthenticatorUserAuthWhere, sendDeleteUserEmailAuthenticatorUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		const userAuthData = userAuthResult.result?.[0]
		const { authenticatorType, email } = userAuthData

		if (!userAuthResult.success || userAuthResult.result?.length !== 1 || !email) {
			await abortAndEndSession(session)
			console.error('请求发送身份验证器的邮箱验证码失败，用户不存在')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，用户不存在' }
		}

		if (authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('请求发送身份验证器的邮箱验证码失败，用户未开启 2FA 或者 2FA 方式不是 Email。')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，用户未开启 2FA 或者 2FA 方式不是 Email。' }
		}

		const { collectionName: userEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: userEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof userEmailAuthenticatorVerificationCodeSchemaInstance>
		const requestSendEmailAuthenticatorByEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // 用户邮箱
			attemptsTimes: 1, // 验证码请求次数
			lastRequestDateTime: 1, // 用户上一次请求验证码的时间，用于防止滥用
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSendEmailAuthenticatorByEmailVerificationCodeSelect, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!requestSendEmailAuthenticatorByEmailVerificationCodeResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，获取验证码失败')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，获取验证码失败' }
		}

		const lastRequestDateTime = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && lastRequestDateTime + 55000 > nowTime) { // 是否仍在冷却，前端 60 秒，后端 55 秒
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '请求发送身份验证器的邮箱验证码失败，未超过邮件超时时间，请稍后再试')
			return { success: true, isCoolingDown: true, message: '请求发送身份验证器的邮箱验证码失败，未超过邮件超时时间，请稍后再试' }
		}

		const attemptsTimes = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
		const lastRequestDate = new Date(lastRequestDateTime)
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && todayStart < lastRequestDate && attemptsTimes > 5) { // ! 每天五次机会
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '请求发送身份验证器的邮箱验证码失败，已达本日重复次数上限，请稍后再试')
			return { success: true, isCoolingDown: true, message: '请求发送身份验证器的邮箱验证码失败，已达本日重复次数上限，请稍后再试' }
		}

		const verificationCode = generateSecureVerificationNumberCode(6) // 生成六位随机数验证码
		let newAttemptsTimes = attemptsTimes + 1
		if (todayStart > lastRequestDate) {
			newAttemptsTimes = 0
		}

		const requestSeDeleteTotpAuthenticatorVerificationCodeUpdate: UpdateType<UserEmailAuthenticatorVerificationCode> = {
			verificationCode,
			overtimeAt: nowTime + 1800000, // 当前时间加上 1800000 毫秒（30 分钟）作为新的过期时间
			attemptsTimes: newAttemptsTimes,
			lastRequestDateTime: nowTime,
			editDateTime: nowTime,
		}

		const updateResult = await findOneAndUpdateData4MongoDB(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSeDeleteTotpAuthenticatorVerificationCodeUpdate, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!updateResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送身份验证器的邮箱验证码失败，更新或新增用户验证码失败')
			return { success: false, isCoolingDown: false, message: '请求发送身份验证器的邮箱验证码失败，更新或新增用户验证码失败' }
		}

		try {
			const mail = getI18nLanguagePack(clientLanguage, "SendDisableUserEmail2FAVerificationCode")
			const correctMailTitle = mail?.mailTitle
			const correctMailHTML = mail?.mailHtml?.replaceAll('{{verificationCode}}', verificationCode)

			const sendMailResult = await sendMail(email, correctMailTitle, { html: correctMailHTML })

			if (!sendMailResult.success) {
				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.error('ERROR', '请求发送验证身份验证器的邮箱验证码失败，邮件发送失败')
				return { success: false, isCoolingDown: true, message: '请求发送验证身份验证器的邮箱验证码失败，邮件发送失败' }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, isCoolingDown: false, message: '验证身份验证器的邮箱验证码已发送至你注册时使用的邮箱，请注意查收，如未收到，请检查垃圾箱或联系 KIRAKIRA 客服。' }
		} catch (error) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '请求发送验证身份验证器的邮箱验证码时出错，邮件发送时出错', error)
			return { success: false, isCoolingDown: true, message: '请求发送验证身份验证器的邮箱验证码时出错，邮件发送时出错' }
		}
	} catch (error) {
		console.error('ERROR', '请求发送验证身份验证器的邮箱验证码时出错，未知错误', error)
		return { success: false, isCoolingDown: false, message: '请求发送验证身份验证器的邮箱验证码时出错，未知错误' }
	}
}

/**
 * 验证邮箱身份验证器的验证码是否正确
 * @param checkEmailAuthenticatorVerificationCodeRequest 用户通过邮箱验证码验证身份验证器的请求载荷
 * @returns 删除操作的结果
 */
const checkEmailAuthenticatorVerificationCodeService = async (checkEmailAuthenticatorVerificationCodeRequest: CheckEmailAuthenticatorVerificationCodeRequestDto): Promise<CheckEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkEmailAuthenticatorVerificationCodeRequest.email && !checkEmailAuthenticatorVerificationCodeRequest.verificationCode) {
			console.error('ERROR', '用户通过邮箱验证码验证身份验证器失败时失败，参数不合法')
			return { success: false, message: '用户通过邮箱验证码验证身份验证器失败时失败，参数不合法' }
		}

		const session = await mongoose.startSession()
		session.startTransaction()

		const now = new Date().getTime()
		const { email, verificationCode } = checkEmailAuthenticatorVerificationCodeRequest

		const emailLowerCase = email.toLowerCase()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const checkEmailAuthenticatorVerificationCodeUserAuthWhere: QueryType<UserAuth> = { emailLowerCase }
		const checkEmailAuthenticatorVerificationCodeUserAuthSelect: SelectType<UserAuth> = {
			UUID: 1,
		}
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(checkEmailAuthenticatorVerificationCodeUserAuthWhere, checkEmailAuthenticatorVerificationCodeUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		const uuid = userAuthResult.result?.[0].UUID

		if (!userAuthResult || !userAuthResult.success || !uuid) {
			console.error('ERROR', '用户通过邮箱验证码验证身份验证器失败时失败，用户不存在')
			return { success: false, message: '用户通过邮箱验证码验证身份验证器失败时失败，用户不存在' }
		}

		const { collectionName: UserEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: UserEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema

		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof UserEmailAuthenticatorVerificationCodeSchemaInstance>
		const checkDeleteTotpAuthenticatorEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
			verificationCode,
			overtimeAt: { $gte: now },
		}
		const checkDeleteTotpAuthenticatorEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // 用户邮箱
		}

		const checkUserEmailAuthenticatorVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(checkDeleteTotpAuthenticatorEmailVerificationCodeWhere, checkDeleteTotpAuthenticatorEmailVerificationCodeSelect, UserEmailAuthenticatorVerificationCodeSchemaInstance, UserEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!checkUserEmailAuthenticatorVerificationCodeResult.success || checkUserEmailAuthenticatorVerificationCodeResult.result?.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '已登录用户通过密码和邮箱验证码删除身份验证器失败：邮箱验证码验证失败')
			return { success: false, message: '已登录用户通过密码和邮箱验证码删除身份验证器失败：邮箱验证码验证失败' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, message: '验证身份验证器成功' }
	} catch (error) {
		console.error('用户通过邮箱验证码验证身份验证器失败时出错，未知错误', error)
		return { success: false, message: '用户通过邮箱验证码验证身份验证器失败时出错，未知错误' }
	}
}

/**
 * 用户删除 Email 2FA
 * @param deleteUserEmailAuthenticatorRequest
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 */
export const deleteUserEmailAuthenticatorService = async (deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto, uuid: string, token: string): Promise<DeleteUserEmailAuthenticatorResponseDto> => {
	try {
		if (!checkDeleteUserEmailAuthenticatorRequest(deleteUserEmailAuthenticatorRequest)) {
			console.error('用户删除 Email 2FA 时失败，参数非法')
			return { success: false, message: '用户删除 Email 2FA 时失败，参数非法' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('用户删除 Email 2FA 时失败，用户校验未通过')
			return { success: false, message: '用户删除 Email 2FA 时失败，用户校验未通过' }
		}

		const { passwordHash, verificationCode } = deleteUserEmailAuthenticatorRequest

		const session = await mongoose.startSession()
		session.startTransaction()

		const { collectionName: userAuthCollectionName, schemaInstance: userAuthSchemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof userAuthSchemaInstance>

		const deleteUserEmailAuthenticatorUserAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const deleteUserEmailAuthenticatorUserAuthSelect: SelectType<UserAuth> = {
			authenticatorType: 1,
			emailLowerCase: 1,
			email: 1,
			passwordHashHash: 1,
		}
		const userAuthResult = await selectDataFromMongoDB<UserAuth>(deleteUserEmailAuthenticatorUserAuthWhere, deleteUserEmailAuthenticatorUserAuthSelect, userAuthSchemaInstance, userAuthCollectionName, { session })
		const userAuthData = userAuthResult.result?.[0]

		if (!userAuthResult.success || userAuthResult.result?.length !== 1) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，用户不存在')
			return { success: false, message: '用户删除 Email 2FA 时失败，用户不存在' }
		}

		if (userAuthData.authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，用户未开启 2FA 或者 2FA 方式不是 Email。')
			return { success: false, message: '用户删除 Email 2FA 时失败，用户未开启 2FA 或者 2FA 方式不是 Email。' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, userAuthData.passwordHashHash)
		if (!isCorrectPassword) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，密码错误')
			return { success: false, message: '用户删除 Email 2FA 时失败，密码错误' }
		}

		const checkEmailAuthenticatorVerificationCodeRequest: CheckEmailAuthenticatorVerificationCodeRequestDto = {
			email: userAuthData.emailLowerCase,
			verificationCode,
		}
		const verificationCodeCheckResult = await checkEmailAuthenticatorVerificationCodeService(checkEmailAuthenticatorVerificationCodeRequest)

		if (!verificationCodeCheckResult || !verificationCodeCheckResult.success) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，验证失败或验证码错误')
			return { success: false, message: '用户删除 Email 2FA 时失败，验证失败或验证码错误' }
		}

		// 1. 清理已经发送的验证码
		const { collectionName: UserEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: UserEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof UserEmailAuthenticatorVerificationCodeSchemaInstance>
		const deleteUserEmailAuthenticatorVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = { UUID: uuid }
		const deleteUserEmailAuthenticatorVerificationCodeResult = await deleteDataFromMongoDB(deleteUserEmailAuthenticatorVerificationCodeWhere, UserEmailAuthenticatorVerificationCodeSchemaInstance, UserEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!deleteUserEmailAuthenticatorVerificationCodeResult || !deleteUserEmailAuthenticatorVerificationCodeResult.success) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，清理该用户的验证码失败', { UUID: uuid })
			return { success: false, message: '用户删除 Email 2FA 时失败，清理该用户的验证码失败' }
		}

		// 2. 删除 Email 2FA
		const { collectionName: UserEmailAuthenticatorCollectionName, schemaInstance: UserEmailAuthenticatorSchemaInstance } = UserEmailAuthenticatorSchema
		type UserEmailAuthenticator = InferSchemaType<typeof UserEmailAuthenticatorSchemaInstance>
		const deleteUserEmailAuthenticatorWhere: QueryType<UserEmailAuthenticator> = { UUID: uuid }
		const deleteUserEmailAuthenticatorResult = await deleteDataFromMongoDB(deleteUserEmailAuthenticatorWhere, UserEmailAuthenticatorSchemaInstance, UserEmailAuthenticatorCollectionName, { session })

		if (!deleteUserEmailAuthenticatorResult || !deleteUserEmailAuthenticatorResult.success) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，删除该用户的邮箱验证失败', { UUID: uuid })
			return { success: false, message: '用户删除 Email 2FA 时失败，删除该用户的邮箱验证失败' }
		}

		// 3. 重置用户的 2FA 类型
		const resetUser2FATypeByUUIDResult = await resetUser2FATypeByUUID(uuid, session)

		if (!resetUser2FATypeByUUIDResult) {
			await abortAndEndSession(session)
			console.error('用户删除 Email 2FA 时失败，用户关闭 2FA 失败', { UUID: uuid })
			return { success: false, message: '用户删除 Email 2FA 时失败，用户关闭 2FA 失败' }
		}

		await commitAndEndSession(session)
		return { success: true, message: '用户删除 Email 2FA 成功' }
	} catch (error) {
		console.error('用户删除 Email 2FA 时出错，未知错误', error)
		return { success: false, message: '用户删除 Email 2FA 时出错，未知错误' }
	}
}

/**
 * 通过 Email 检查用户是否已开启 2FA 身份验证器
 * @param checkUserHave2FARequestDto 通过 Email 检查用户是否已开启 2FA 身份验证器的请求载荷
 * @returns 通过 Email 检查用户是否已开启 2FA 身份验证器的请求响应
 */
export const checkUserHave2FAByEmailService = async (checkUserHave2FARequestDto: CheckUserHave2FARequestDto): Promise<CheckUserHave2FAResponseDto> => {
	try {
		const { email } = checkUserHave2FARequestDto
		if (!email) {
			console.error('ERROR', `通过 Email 检查用户是否已开启 2FA 身份验证器失败，邮箱为空`)
			return { success: false, have2FA: false, message: '通过 Email 检查用户是否已开启 2FA 身份验证器失败，邮箱为空' }
		}

		const emailLowerCase = email.toLowerCase()

		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const userAuthWhere: QueryType<UserAuth> = { emailLowerCase }
		const userAuthSelect: SelectType<UserAuth> = { authenticatorType: 1, UUID: 1 }

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName)
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `通过 Email 检查用户是否已开启 2FA 身份验证器失败，未找到用户数据`)
			return { success: false, have2FA: false, message: '通过 Email 检查用户是否已开启 2FA 身份验证器失败，未找到用户数据' }
		}

		const UUID = userAuthResult.result[0].UUID
		if (!UUID) {
			console.error('ERROR', `通过 Email 检查用户是否已开启 2FA 身份验证器失败，未找到 UUID`)
			return { success: false, have2FA: false, message: '通过 Email 检查用户是否已开启 2FA 身份验证器失败，未找到 UUID' }
		}

		const authenticatorType = userAuthResult.result[0].authenticatorType
		if (authenticatorType === 'totp') {
			const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
			type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>

			const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID, enabled: true }
			const userTotpAuthenticatorSelect: SelectType<UserTotpAuthenticator> = { createDateTime: 1 }

			const userTotpAuthenticatorResult = await selectDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)
			const totpCreationDateTime = userTotpAuthenticatorResult?.result?.[0].createDateTime

			return { success: true, have2FA: true, type: authenticatorType, totpCreationDateTime, message: '用户已开启 TOTP 2FA' }
		} else if (authenticatorType === 'email') {
			return { success: true, have2FA: true, type: authenticatorType, message: '用户已开启 Email 2FA' }
		} else {
			return { success: true, have2FA: false, message: '用户未开启 2FA' }
		}
	} catch (error) {
		console.error('通过 Email 检查用户是否已开启 2FA 身份验证器时出错，未知错误', error)
		return { success: false, have2FA: false, message: '通过 Email 检查用户是否已开启 2FA 身份验证器时出错，未知错误' }
	}
}

/**
 * 通过 UUID 检查用户是否已开启 2FA 身份验证器
 * @param uuid 用户的 UUID
 * @param token 用户的 token
 * @returns 通过 UUID 检查用户是否已开启 2FA 身份验证器的请求响应
 */
export const checkUserHave2FAByUUIDService = async (uuid: string, token: string): Promise<CheckUserHave2FAResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', `通过 UUID 检查用户是否已开启 2FA 身份验证器失败，非法用户`)
			return { success: false, have2FA: false, message: '通过 UUID 检查用户是否已开启 2FA 身份验证器失败，非法用户' }
		}

		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const userAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const userAuthSelect: SelectType<UserAuth> = { authenticatorType: 1 }

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName)
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `通过 UUID 检查用户是否已开启 2FA 身份验证器失败，未找到用户数据`)
			return { success: false, have2FA: false, message: '通过 UUID 检查用户是否已开启 2FA 身份验证器失败，未找到用户数据' }
		}

		const authenticatorType = userAuthResult.result[0].authenticatorType
		if (authenticatorType === 'totp') {
			const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
			type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>

			const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID: uuid, enabled: true }
			const userTotpAuthenticatorSelect: SelectType<UserTotpAuthenticator> = { createDateTime: 1 }

			const userTotpAuthenticatorResult = await selectDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)
			const totpCreationDateTime = userTotpAuthenticatorResult?.result?.[0].createDateTime

			return { success: true, have2FA: true, type: authenticatorType, totpCreationDateTime, message: '用户已开启 TOTP 2FA' }
		} else if (authenticatorType === 'email') {
			return { success: true, have2FA: true, type: authenticatorType, message: '用户已开启 Email 2FA' }
		} else {
			return { success: true, have2FA: false, message: '用户未开启 2FA' }
		}
	} catch (error) {
		console.error('通过 UUID 检查用户是否已开启 2FA 身份验证器时出错，未知错误', error)
		return { success: false, have2FA: false, message: '通过 UUID 检查用户是否已开启 2FA 身份验证器时出错，未知错误' }
	}
}

/**
 * 校验用户注册信息
 * @param userRegistrationRequest
 * @returns boolean 如果合法则返回 true
 */
const checkUserRegistrationData = (userRegistrationRequest: UserRegistrationRequestDto): boolean => {
	// TODO // WARN 这里可能需要更安全的校验机制
	return (
		true
		&& !!userRegistrationRequest.passwordHash && !!userRegistrationRequest.email && !isInvalidEmail(userRegistrationRequest.email)
		&& !!userRegistrationRequest.verificationCode
		&& !!userRegistrationRequest.username
	)
}

/**
 * 用户邮箱是否存在验证的请求参数的非空验证
 * @param userEmailExistsCheckRequest
 * @returns boolean 合法则返回 true
 */
const checkUserEmailExistsCheckRequest = (userEmailExistsCheckRequest: UserEmailExistsCheckRequestDto): boolean => {
	// TODO // WARN 这里可能需要更安全的校验机制
	return (!!userEmailExistsCheckRequest.email && !isInvalidEmail(userEmailExistsCheckRequest.email))
}

/**
 * 用户登录的请求参数的校验
 * @param userExistsCheckRequest
 * @returns boolean 合法则返回 true
 */
const checkUserLoginRequest = (userLoginRequest: UserLoginRequestDto): boolean => {
	// TODO // WARN 这里可能需要更安全的校验机制
	return (!!userLoginRequest.email && !isInvalidEmail(userLoginRequest.email) && !!userLoginRequest.passwordHash)
}

/**
 * 用户修改邮箱的请求参数的非空验证
 * @param updateUserEmailRequest
 * @returns boolean 合法则返回 true
 */
const checkUpdateUserEmailRequest = (updateUserEmailRequest: UpdateUserEmailRequestDto): boolean => {
	// TODO // WARN 这里可能需要更安全的校验机制
	return (
		updateUserEmailRequest.uid !== null && updateUserEmailRequest.uid !== undefined
		&& !!updateUserEmailRequest.oldEmail && !isInvalidEmail(updateUserEmailRequest.oldEmail)
		&& !!updateUserEmailRequest.newEmail && !isInvalidEmail(updateUserEmailRequest.newEmail)
		&& !!updateUserEmailRequest.passwordHash
		&& !!updateUserEmailRequest.verificationCode
	)
}

/**
 * 允许关联的平台列表
 * // TODO 或许这些数据放到环境变量里更好？
 */
const ALLOWED_PLATFORM_ID = [
	'platform.twitter', // Twitter → X
	'platform.qq',
	'platform.wechat', // 微信
	'platform.bilibili',
	'platform.niconico',
	'platform.youtube',
	'platform.otomad_wiki', // 音 MAD 维基
	'platform.weibo', // 新浪微博
	'platform.tieba', // 百度贴吧
	'platform.cloudmusic', // 网易云音乐
	'platform.discord',
	'platform.telegram',
	'platform.midishow',
	'platform.linkedin', // 领英（海外版）
	'platform.facebook',
	'platform.instagram',
	'platform.douyin', // 抖音
	'platform.tiktok', // TikTok（抖音海外版）
	'platform.pixiv',
	'platform.github',
]

/**
 * 允许设置的隐私设置项
 * // TODO 或许这些数据放到环境变量里更好？
 */
const ALLOWED_PRIVARY_ID = [
	'privary.birthday', // 生日
	'privary.age', // 年龄
	'privary.follow', // 关注
	'privary.fans', // 粉丝
	'privary.favorites', // 收藏
]

/**
 * 检查更新或创建用户信息的请求参数
 * @param updateOrCreateUserInfoRequest 更新或创建用户信息的请求参数
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkUpdateOrCreateUserInfoRequest = (updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto): boolean => {
	// TODO 也许我们应该在未来为其添加更多验证以避免可能的注入风险

	if (!updateOrCreateUserInfoRequest || isEmptyObject(updateOrCreateUserInfoRequest)) {
		return false
	}

	if (updateOrCreateUserInfoRequest?.userLinkedAccounts?.some(account => !ALLOWED_PLATFORM_ID.includes(account.platformId))) {
		return false
	}

	return true
}

/**
 * 检查更新或创建用户设置时的请求参数
 * @param updateOrCreateUserSettingsRequest 更新或创建用户设置时的请求参数
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkUpdateOrCreateUserSettingsRequest = (updateOrCreateUserSettingsRequest: UpdateOrCreateUserSettingsRequestDto): boolean => {
	// TODO 也许我们应该在未来为其添加更多验证以避免可能的注入风险

	if (!updateOrCreateUserSettingsRequest || isEmptyObject(updateOrCreateUserSettingsRequest)) {
		return false
	}

	if (updateOrCreateUserSettingsRequest?.userLinkedAccountsVisibilitiesSetting?.some(account => !ALLOWED_PLATFORM_ID.includes(account.platformId))) {
		return false
	}

	if (updateOrCreateUserSettingsRequest?.userPrivaryVisibilitiesSetting?.some(account => !ALLOWED_PRIVARY_ID.includes(account.privaryId))) {
		return false
	}

	return true
}

/**
 * 检查请求发送验证码的请求参数
 * @param requestSendVerificationCodeRequest 请求发送验证码的请求参数
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkRequestSendVerificationCodeRequest = (requestSendVerificationCodeRequest: RequestSendVerificationCodeRequestDto): boolean => {
	return (!isInvalidEmail(requestSendVerificationCodeRequest.email))
}

/**
 * 检查使用邀请码注册的参数
 * @param useInvitationCodeDto 使用邀请码注册的参数
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkUseInvitationCodeDto = (useInvitationCodeDto: UseInvitationCodeDto): boolean => {
	return (
		useInvitationCodeDto.registrantUid !== null && useInvitationCodeDto.registrantUid !== undefined
		&& !!useInvitationCodeDto.invitationCode
	)
}

/**
 * 检查检查一个邀请码是否可用的请求载荷
 * @param checkInvitationCodeRequestDto 检查一个邀请码是否可用的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkCheckInvitationCodeRequestDto = (checkInvitationCodeRequestDto: CheckInvitationCodeRequestDto): boolean => {
	const invitationCodeRegex = /^KIRA-[A-Z0-9]{4}-[A-Z0-9]{4}$/
	return (!!checkInvitationCodeRequestDto.invitationCode && invitationCodeRegex.test(checkInvitationCodeRequestDto.invitationCode))
}

/**
 * 验证请求发送修改邮箱的邮箱验证码的请求载荷
 * @param requestSendChangeEmailVerificationCodeRequest 请求发送修改邮箱的邮箱验证码的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkRequestSendChangeEmailVerificationCodeRequest = (requestSendChangeEmailVerificationCodeRequest: RequestSendChangeEmailVerificationCodeRequestDto): boolean => {
	requestSendChangeEmailVerificationCodeRequest // TODO
	return true
}

/**
 * 验证请求发送修改密码的邮箱验证码的请求载荷
 * @param requestSendChangePasswordVerificationCodeRequest 请求发送修改密码的邮箱验证码的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkRequestSendChangePasswordVerificationCodeRequest = (requestSendChangePasswordVerificationCodeRequest: RequestSendChangePasswordVerificationCodeRequestDto): boolean => {
	requestSendChangePasswordVerificationCodeRequest // TODO
	return true
}

/**
 * 验证修改密码的请求载荷
 * @param updateUserPasswordRequest 修改密码的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkUpdateUserPasswordRequest = (updateUserPasswordRequest: UpdateUserPasswordRequestDto): boolean => {
	return (
		true
		&& !!updateUserPasswordRequest.newPasswordHash
		&& !!updateUserPasswordRequest.oldPasswordHash
		&& !!updateUserPasswordRequest.verificationCode && updateUserPasswordRequest.verificationCode.length === 6
	)
}

/**
 * 验证请求发送忘记密码的邮箱验证码的请求载荷
 * @param requestSendForgotPasswordVerificationCodeRequest 请求发送忘记密码的邮箱验证码的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkRequestSendForgotPasswordVerificationCodeRequest = (requestSendForgotPasswordVerificationCodeRequest: RequestSendForgotPasswordVerificationCodeRequestDto): boolean => {
	return (
		true
		&& !!requestSendForgotPasswordVerificationCodeRequest.email
	)
}

/**
 * 验证忘记密码（更新密码）的请求载荷
 * @param forgotPasswordRequest 忘记密码（更新密码）的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkForgotPasswordRequest = (forgotPasswordRequest: ForgotPasswordRequestDto): boolean => {
	return (
		true
		&& !!forgotPasswordRequest.email
		&& !!forgotPasswordRequest.newPasswordHash
		&& !!forgotPasswordRequest.verificationCode && forgotPasswordRequest.verificationCode.length === 6
	)
}

/**
 * 检查检查用户名失败的请求载荷
 * @param checkUsernameRequest 检查用户名失败的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkCheckUsernameRequest = (checkUsernameRequest: CheckUsernameRequestDto): boolean => {
	return (!!checkUsernameRequest.username && checkUsernameRequest.username?.length <= 200 && checkUsernameRequest.username?.length > 0)
}

/**
 * 检查管理员获取用户信息的请求载荷
 * @param adminGetUserInfoRequest 管理员获取用户信息的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkAdminGetUserInfoRequest = (adminGetUserInfoRequest: AdminGetUserInfoRequestDto): boolean => {
	return (
		adminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview !== undefined && adminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview !== null
		&& !!adminGetUserInfoRequest.pagination && adminGetUserInfoRequest.pagination.page > 0 && adminGetUserInfoRequest.pagination.pageSize > 0
	)
}

/**
 * 检查管理员通过用户信息审核的请求载荷
 * @param approveUserInfoRequest 管理员通过用户信息审核的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkApproveUserInfoRequest = (approveUserInfoRequest: ApproveUserInfoRequestDto): boolean => {
	return (!!approveUserInfoRequest.UUID)
}

/**
 * 检查管理员清空某个用户的信息的请求载荷
 * @param adminClearUserInfoRequest 管理员清空某个用户的信息的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkAdminClearUserInfoRequest = (adminClearUserInfoRequest: AdminClearUserInfoRequestDto): boolean => {
	return (
		adminClearUserInfoRequest.uid !== undefined && adminClearUserInfoRequest.uid !== null && typeof adminClearUserInfoRequest.uid === 'number' && adminClearUserInfoRequest.uid > 0
	)
}

/**
 * 检查通过恢复码删除用户 2FA 的参数
 * @param deleteAuthenticatorByRecoveryCodeData 通过恢复码删除用户 2FA 的参数
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkDeleteTotpAuthenticatorByRecoveryCodeData = (deleteTotpAuthenticatorByRecoveryCodeData: DeleteTotpAuthenticatorByRecoveryCodeParametersDto): boolean => {
	return (!!deleteTotpAuthenticatorByRecoveryCodeData.email && !!deleteTotpAuthenticatorByRecoveryCodeData.recoveryCodeHash)
}

/**
 * 检查已登录用户通过密码和 TOTP 验证码删除身份验证器的请求载荷
 * @param deleteAuthenticatorByTotpVerificationCodeRequest 已登录用户通过密码和 TOTP 验证码删除身份验证器的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkDeleteTotpAuthenticatorByTotpVerificationCodeRequest = (deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto): boolean => {
	return (!!deleteTotpAuthenticatorByTotpVerificationCodeRequest.clientOtp && !!deleteTotpAuthenticatorByTotpVerificationCodeRequest.passwordHash)
}

/**
 * 检查用户发送 Email 身份验证器验证邮件的请求载荷
 * @param sendDeleteTotpAuthenticatorByEmailVerificationCodeRequest 用户发送 Email 身份验证器验证邮件的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkSendUserEmailAuthenticatorVerificationCodeRequest = (sendUserEmailAuthenticatorVerificationCodeRequest: SendUserEmailAuthenticatorVerificationCodeRequestDto): boolean => {
	return (!!sendUserEmailAuthenticatorVerificationCodeRequest.email && !!sendUserEmailAuthenticatorVerificationCodeRequest.passwordHash)
}

/**
 * 检查用户发送删除 Email 身份验证器验证邮件的请求载荷
 * @param sendDeleteTotpAuthenticatorByEmailVerificationCodeRequest 用户发送删除 Email 身份验证器验证邮件的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkSendDeleteUserEmailAuthenticatorVerificationCodeRequest = (sendDeleteUserEmailAuthenticatorVerificationCodeRequest: SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto): boolean => {
	// TODO: 该请求接口允许为空
	return true
}

/**
 * 检查用户删除 Email 2FA 的请求载荷
 * @param deleteUserEmailAuthenticatorRequest 用户删除 Email 2FA 的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkDeleteUserEmailAuthenticatorRequest = (deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto): boolean => {
	return (
		!!deleteUserEmailAuthenticatorRequest.passwordHash
		&& !!deleteUserEmailAuthenticatorRequest.verificationCode
	)
}

/**
 * 检查管理员编辑用户信息的请求载荷
 * @param adminEditUserInfoRequest 管理员编辑用户信息的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkAdminEditUserInfoRequest = (adminEditUserInfoRequest: AdminEditUserInfoRequestDto): boolean => {
	return (
		adminEditUserInfoRequest.uid !== null && adminEditUserInfoRequest.uid !== undefined
		&& !!adminEditUserInfoRequest.userInfo
	)
}

/**
 * 检查根据 UUID 校验用户是否已经存在的请求载荷
 * @param checkUserExistsByUuidRequest 根据 UUID 校验用户是否已经存在的请求载荷
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkCheckUserExistsByUuidRequest = (checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto): boolean => {
	return ( !!checkUserExistsByUuidRequest.uuid )
}

/**
 * 检查排序相关的变量
 * @param sortBy 排序字段
 * @param sortOrder 排序顺序
 * @returns 检查结果，合法返回 true，不合法返回 false
 */
const checkSortVariables = (sortBy: string, sortOrder: string): boolean => {
	const allowedSortFields = ['createDateTime', 'editDateTime', 'username', 'userNickname', 'uid'] // 允许的排序方式
	if (!allowedSortFields.includes(sortBy)) {
		return false
	}
	if (sortOrder !== 'ascend' && sortOrder !== 'descend') {
		return false
	}
	return true
}
