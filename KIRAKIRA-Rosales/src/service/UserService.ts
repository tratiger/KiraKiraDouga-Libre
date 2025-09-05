import mongoose, { InferSchemaType, PipelineStage, ClientSession, startSession } from 'mongoose'
import { isInvalidEmail, sendMail } from '../common/EmailTool.js'
import { createMinioPutSignedUrl } from '../minio/index.js'
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
					return { success: false, message: 'メールアドレスの変更に失敗しました：検証リクエストに失败しました' }
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
		if (!(await checkUserToken(uid, token))) {
			console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、不正なユーザーです', { uid })
			return { success: false, message: 'アップロードに失敗しました、アップロード権限を取得できません' }
		}

		const bucketName = process.env.MINIO_IMAGE_BUCKET
		if (!bucketName) {
			console.error('ERROR', 'MINIO_IMAGE_BUCKETが設定されていません。')
			return { success: false, message: 'サーバー設定エラー' }
		}

		const now = new Date().getTime()
		const objectKey = `avatar-${uid}-${generateSecureRandomString(32)}-${now}`
		const signedUrl = await createMinioPutSignedUrl(bucketName, objectKey, 600) // 10分間有効

		if (signedUrl && objectKey) {
			return { success: true, message: 'アバターのアップロードを開始する準備ができました', userAvatarUploadSignedUrl: signedUrl, userAvatarFilename: objectKey }
		} else {
			// TODO 画像アップロードロジックは書き直す必要があります。現在、ユーザーが画像のアップロードに失敗しても、データベース内の古いアバターリンクが新しいアバターリンクに置き換えられてしまい、現在の画像は審査プロセスに追加されていません
			return { success: false, message: 'アップロードに失敗しました、画像アップロードURLを生成できません。もう一度アバターをアップロードしてください' }
		}
	} catch (error) {
		console.error('ERROR', 'アップロード用の署名付きURLの取得に失敗しました、エラーメッセージ', error, { uid })
		return { success: false, message: 'アップロード用の署名付きURLの取得に失敗しました、不明なエラー' }
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
 * パスワードを変更する
 * @param updateUserPasswordRequest パスワード変更リクエストのペイロード
 * @param uid ユーザーUID
 * @param token ユーザートークン
 * @returns パスワード変更リクエストのレスポンス
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
					emailLowerCase: 1, // ユーザーのメールアドレス
				}

				// トランザクション開始
				const session = await mongoose.startSession()
				session.startTransaction()

				try {
					const verificationCodeResult = await selectDataFromMongoDB<UserChangePasswordVerificationCode>(userChangePasswordVerificationCodeWhere, userChangePasswordVerificationCodeSelect, userChangePasswordVerificationCodeInstance, userChangePasswordVerificationCodeCollectionName, { session })
					if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'パスワード変更時にエラーが発生しました、検証に失敗しました')
						return { success: false, message: 'パスワード変更時にエラーが発生しました、検証に失敗しました' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'パスワード変更時にエラーが発生しました、検証リクエストに失敗しました')
					return { success: false, message: 'パスワード変更時にエラーが発生しました、検証リクエストに失敗しました' }
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
										return { success: true, message: 'パスワードが更新されました！' }
									} else {
										if (session.inTransaction()) {
											await session.abortTransaction()
										}
										session.endSession()
										console.error('ERROR', 'パスワードの変更に失敗しました、パスワードの更新に失敗しました', { uid })
										return { success: false, message: 'パスワードの変更時にエラーが発生しました、パスワードの更新に失敗しました' }
									}
								} catch (error) {
									if (session.inTransaction()) {
										await session.abortTransaction()
									}
									session.endSession()
									console.error('ERROR', 'パスワード変更時にエラーが発生しました、パスワード更新時にエラーが発生しました', { uid, error })
									return { success: false, message: 'パスワード変更時にエラーが発生しました、パスワード更新時にエラーが発生しました' }
								}
							} else {
								if (session.inTransaction()) {
									await session.abortTransaction()
								}
								session.endSession()
								console.error('ERROR', 'パスワードの変更に失敗しました、新しいパスワードのハッシュ化に失敗しました', { uid })
								return { success: false, message: 'パスワードの変更に失敗しました、新しいパスワードのハッシュ化に失敗しました' }
							}
						} else {
							if (session.inTransaction()) {
								await session.abortTransaction()
							}
							session.endSession()
							console.error('ERROR', 'パスワードの変更に失敗しました、パスワードの検証に失敗しました', { uid })
							return { success: false, message: 'パスワードの変更に失敗しました、パスワードの検証に失敗しました' }
						}
					} else {
						if (session.inTransaction()) {
							await session.abortTransaction()
						}
						session.endSession()
						console.error('ERROR', 'パスワードの変更に失敗しました、パスワードの検証結果が空または1ではありません！', { uid })
						return { success: false, message: 'パスワードの変更に失敗しました、パスワードの検証結果が正しくありません' }
					}
				} catch (error) {
					if (session.inTransaction()) {
						await session.abortTransaction()
					}
					session.endSession()
					console.error('ERROR', 'パスワード変更時にエラーが発生しました、パスワード検証時にエラーが発生しました！', { uid, error })
					return { success: false, message: 'パスワード変更時にエラーが発生しました、パスワード検証時にエラーが発生しました！' }
				}
			} else {
				console.error('ERROR', 'パスワードの変更に失敗しました、不正なユーザーです！', { uid })
				return { success: false, message: 'パスワードの変更に失敗しました、不正なユーザーです！' }
			}
		} else {
			console.error('ERROR', 'パスワードの変更に失敗しました、パラメータが不正です！', { uid })
			return { success: false, message: 'パスワードの変更に失敗しました、パラメータが不正です！' }
		}
	} catch (error) {
		console.error('ERROR', 'パスワード変更時にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'パスワード変更時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * パスワードを忘れた場合の確認コードを送信するリクエスト
 * @param requestSendForgotPasswordVerificationCodeRequest パスワードを忘れた場合の確認コードを送信するリクエストのペイロード
 * @returns パスワードを忘れた場合の確認コードを送信するリクエストのレスポンス
 */
export const requestSendForgotPasswordVerificationCodeService = async (requestSendForgotPasswordVerificationCodeRequest: RequestSendForgotPasswordVerificationCodeRequestDto): Promise<RequestSendForgotPasswordVerificationCodeResponseDto> => {
	try {
		if (!checkRequestSendForgotPasswordVerificationCodeRequest(requestSendForgotPasswordVerificationCodeRequest)) {
			const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、パラメータが不正です！'
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
			emailLowerCase: 1, // ユーザーのメールアドレス
			attemptsTimes: 1,
			lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
		}

		// トランザクション開始
		const session = await mongoose.startSession()
		session.startTransaction()

		try {
			const forgotPasswordVerificationCodeHistoryResult = await selectDataFromMongoDB<UserForgotPasswordVerificationCode>(requestSendForgotPasswordVerificationCodeWhere, requestSendForgotPasswordVerificationCodeSelect, schemaInstance, collectionName, { session })
			
			if (!forgotPasswordVerificationCodeHistoryResult.success) {
				await abortAndEndSession(session)
				const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、確認コードの取得に失敗しました'
				console.error('ERROR', message)
				return { success: false, isCoolingDown: false, message }
			}

			const lastRequestDateTime = forgotPasswordVerificationCodeHistoryResult.result?.[0]?.lastRequestDateTime ?? 0
			const attemptsTimes = forgotPasswordVerificationCodeHistoryResult.result?.[0]?.attemptsTimes ?? 0
			if (forgotPasswordVerificationCodeHistoryResult.result.length > 0 && lastRequestDateTime + 55000 >= nowTime) { // フロントエンド60秒、バックエンド55秒
				await abortAndEndSession(session)
				const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください'
				console.warn('WARN', message)
				return { success: false, isCoolingDown: true, message }
			}

			const lastRequestDate = new Date(lastRequestDateTime)
			if (forgotPasswordVerificationCodeHistoryResult.result.length > 0 && todayStart < lastRequestDate && attemptsTimes > 3) { // ! 1日3回まで
				await abortAndEndSession(session)
				const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、本日の再試行回数の上限に達しました、しばらくしてからもう一度お試しください'
				console.warn('WARN', 'WARNING', message)
				return { success: false, isCoolingDown: true, message }
			}

			const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
			let newAttemptsTimes = attemptsTimes + 1
			if (todayStart > lastRequestDate) {
				newAttemptsTimes = 0
			}

			const requestSendForgotPasswordVerificationCodeUpdate: UserForgotPasswordVerificationCode = {
				emailLowerCase,
				verificationCode,
				overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
				attemptsTimes: newAttemptsTimes,
				lastRequestDateTime: nowTime,
				editDateTime: nowTime,
			}
			const updateResult = await findOneAndUpdateData4MongoDB(requestSendForgotPasswordVerificationCodeWhere, requestSendForgotPasswordVerificationCodeUpdate, schemaInstance, collectionName, { session })
			
			if (!updateResult.success) {
				await abortAndEndSession(session)
				const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、確認コードの更新または新規作成に失敗しました'
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
					const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、メールの送信に失敗しました'
					console.error('ERROR', message)
					return { success: false, isCoolingDown: true, message }
				}

				await commitAndEndSession(session)
				return { success: true, isCoolingDown: false, message: 'パスワードを忘れた場合の確認コードが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }

			} catch (error) {
				await abortAndEndSession(session)
				const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、メール送信時にエラーが発生しました'
				console.error('ERROR', message, error)
				return { success: false, isCoolingDown: true, message }
			}
		} catch (error) {
			await abortAndEndSession(session)
			const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、タイムアウト時間の確認中にエラーが発生しました'
			console.error('ERROR', message, error)
			return { success: false, isCoolingDown: false, message }
		}
	} catch (error) {
		const message = 'パスワードを忘れた場合の確認コードの送信に失敗しました、不明なエラー'
		console.error('ERROR', message, error)
		return { success: false, isCoolingDown: false, message }
	}
}

/**
 * パスワードを忘れた場合（パスワードを更新する）
 * @param forgotPasswordRequest パスワードを忘れた場合（パスワードを更新する）のリクエストペイロード
 * @returns パスワードを忘れた場合（パスワードを更新する）のリクエストレスポンス
 */
export const forgotPasswordService = async (forgotPasswordRequest: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> => {
	try {
		if (!checkForgotPasswordRequest(forgotPasswordRequest)) {
			const message = 'パスワードの再設定に失敗しました、パラメータが不正です！'
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
			emailLowerCase: 1, // ユーザーのメールアドレス
		}

		// トランザクション開始
		const session = await mongoose.startSession()
		session.startTransaction()

		const verificationCodeResult = await selectDataFromMongoDB<UserForgotPasswordVerificationCode>(userForgoPasswordVerificationCodeWhere, userForgotPasswordVerificationCodeSelect, userForgotPasswordVerificationCodeInstance, userForgotPasswordVerificationCodeCollectionName, { session })
		if (!verificationCodeResult.success || verificationCodeResult.result?.length !== 1) {
			await abortAndEndSession(session)
			const message = 'パスワードの再設定時にエラーが発生しました、検証に失敗しました'
			console.error('ERROR', message)
			return { success: false, message }
		}

		const newPasswordHashHash = hashPasswordSync(newPasswordHash)
		if (!newPasswordHashHash) {
			await abortAndEndSession(session)
			const message = 'パスワードの再設定に失敗しました、新しいパスワードのハッシュ化に失敗しました'
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
				const message = 'パスワードの再設定に失敗しました、パスワードの更新に失敗しました'
				console.error('ERROR', message, { email })
				return { success: false, message }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, message: 'パスワードの再設定に成功しました、パスワードが更新されました！' }
		} catch (error) {
			await abortAndEndSession(session)
			const message = 'パスワードの再設定時にエラーが発生しました、パスワード更新時にエラーが発生しました'
			console.error('ERROR', message, { email, error })
			return { success: false, message }
		}
	} catch (error) {
		const message = 'パスワードの再設定時にエラーが発生しました、不明なエラー'
		console.error('ERROR', message, error)
		return { success: false, message }
	}
}

/**
 * ユーザー名が利用可能かどうかを確認する
 * @param checkUsernameRequest ユーザー名が利用可能かどうかを確認するリクエストペイロード
 * @returns ユーザー名が利用可能かどうかを確認するリクエストレスポンス、利用可能な場合はtrue、それ以外はfalse
 */
export const checkUsernameService = async (checkUsernameRequest: CheckUsernameRequestDto, excluedUuid: 'none' | string[] = 'none'): Promise<CheckUsernameResponseDto> => {
	try {
		if (checkCheckUsernameRequest(checkUsernameRequest)) {
			const { username } = checkUsernameRequest
			const usernameStandardized = username.trim().normalize()

			if (!validateNameField(usernameStandardized)) {
				console.error('ERROR', 'ユーザー名が不正です')
				return { success: false, message: 'ユーザー名が不正です', isAvailableUsername: true }
			}

			const { collectionName, schemaInstance } = UserInfoSchema
			type UserInfo = InferSchemaType<typeof schemaInstance>
			const checkUsernameWhere: QueryType<UserInfo> = {
				username: { $regex: new RegExp(`\\b${usernameStandardized}\\b`, 'iu') },
			}
			if (excluedUuid && excluedUuid !== 'none') { // excluedUuidが存在し、'none'でない場合、ユーザー名の可用性をチェックする際にユーザーを除外する（自分のユーザー名を変更する際に自分自身を除外する、または公式アカウントなどを除外する...）
				checkUsernameWhere.UUID = { $nin: excluedUuid }
			}
			const checkUsernameSelete: SelectType<UserInfo> = {
				uid: 1,
			}
			try {
				const checkUsername = await selectDataFromMongoDB(checkUsernameWhere, checkUsernameSelete, schemaInstance, collectionName)
				if (checkUsername.success) {
					if (checkUsername.result?.length === 0) {
						return { success: true, message: 'ユーザー名は利用可能です', isAvailableUsername: true }
					} else {
						return { success: true, message: 'ユーザー名が重複しています', isAvailableUsername: false }
					}
				} else {
					console.error('ERROR', 'ユーザー名の確認に失敗しました、ユーザーデータの要求に失敗しました')
					return { success: false, message: 'ユーザー名の確認に失敗しました、ユーザーデータの要求に失敗しました', isAvailableUsername: false }
				}
			} catch (error) {
				console.error('ERROR', 'ユーザー名の確認時にエラーが発生しました、ユーザーデータの要求時にエラーが発生しました', error)
				return { success: false, message: 'ユーザー名の確認時にエラーが発生しました、ユーザーデータの要求時にエラーが発生しました', isAvailableUsername: false }
			}
		} else {
			console.error('ERROR', 'ユーザー名の確認に失敗しました、パラメータが不正です')
			return { success: false, message: 'ユーザー名の確認に失敗しました、パラメータが不正です', isAvailableUsername: false }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザー名の確認時にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'ユーザー名の確認時にエラーが発生しました、不明なエラー', isAvailableUsername: false }
	}
}

/**
 * UUIDに基づいてユーザーが既に存在するかどうかを確認する
 * @param checkUserExistsByUuidRequest UUIDに基づいてユーザーが既に存在するかどうかを確認するリクエストペイロード
 * @returns UUIDに基づいてユーザーが既に存在するかどうかを確認するリクエストレスポンス
 */
export const checkUserExistsByUuidService = async (checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto): Promise<CheckUserExistsByUuidResponseDto> => {
	try {
		if (!checkCheckUserExistsByUuidRequest(checkUserExistsByUuidRequest)) {
			console.error('ERROR', 'ユーザーが存在するかどうかのクエリに失敗しました：パラメータが不正です')
			return { success: false, exists: false, message: 'ユーザーが存在するかどうかのクエリに失敗しました：パラメータが不正です' }
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
			console.error('ERROR', 'UUIDに基づいてユーザーが既に存在するかどうかを確認する際にエラーが発生しました：クエリに失敗しました', error)
			return { success: false, exists: false, message: 'UUIDに基づいてユーザーが既に存在するかどうかを確認する際にエラーが発生しました：クエリに失敗しました' }
		}

		if (result && result.success && result.result) {
			if (result.result?.length > 0) {
				return { success: true, exists: true, message: 'ユーザーは既に存在します' }
			} else {
				return { success: true, exists: false, message: 'ユーザーは存在しません' }
			}
		} else {
			return { success: false, exists: false, message: 'クエリに失敗しました' }
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーが存在するかどうかのクエリに失敗しました：不明なエラー', error)
		return { success: false, exists: false, message: 'ユーザーが存在するかどうかのクエリに失敗しました：不明なエラー' }
	}
}

/**
 * すべてのブロックされたユーザーの情報を取得する
 * @param adminUid 管理者のUID
 * @param adminToken 管理者のトークン
 * @param GetBlockedUserRequest ブロックされたユーザーを取得するリクエストペイロード
 * @returns すべてのブロックされたユーザーの情報を取得するリクエストレスポンス
 */
export const getBlockedUserService = async (adminUUID: string, adminToken: string, GetBlockedUserRequest: GetBlockedUserRequestDto): Promise<GetBlockedUserResponseDto> => {
	try {
		if (await checkUserTokenByUUID(adminUUID, adminToken)) {
			const { sortBy, sortOrder } = GetBlockedUserRequest
			if (!checkSortVariables(sortBy, sortOrder)) {
				console.error('ERROR', 'すべてのブロックされたユーザーの情報の取得に失敗しました、ソートパラメータが不正です')
				return { success: false, message: 'すべてのブロックされたユーザーの情報の取得に失敗しました、ソートパラメータが不正です', totalCount: 0 }
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
						from: 'user-infos', // WARN: 複数形を忘れないでください
						localField: 'UUID',
						foreignField: 'UUID',
						as: 'user_info_data',
					},
				},
				{
					$unwind: {
						path: '$user_info_data',
						preserveNullAndEmptyArrays: true, // 空の配列とnull値を保持する
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
						from: 'user-infos', // WARN: 複数形を忘れないでください
						localField: 'UUID',
						foreignField: 'UUID',
						as: 'user_info_data',
					},
				},
				{
					$unwind: {
						path: '$user_info_data',
						preserveNullAndEmptyArrays: true, // 空の配列とnull値を保持する
					},
				},
				{ $sort: { [`user_info_data.${sortBy}`]: sortOrder === 'descend' ? -1 : 1 } },
				{ $skip: skip }, // 指定された数のドキュメントをスキップする
				{ $limit: pageSize }, // 返されるドキュメントの数を制限する
			]

			const projectStep = {
				$project: {
					uid: 1,
					UUID: 1,
					userCreateDateTime: 1, // ユーザー作成日
					roles: 1, // ユーザーのロール
					username: '$user_info_data.username', // ユーザー名
					userNickname: '$user_info_data.userNickname', // ユーザーのニックネーム
					email: 1, // ユーザーのメールアドレス
					totalCount: 1, // 総ドキュメント数
				},
			}
			blockedUserPipeline.push(projectStep)

			const countStep = {
				$count: 'totalCount', // 総ドキュメント数をカウントする
			}
			blockedUserCountPipeline.push(countStep)

			try {
				const userCountResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, blockedUserCountPipeline)
				const userResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, blockedUserPipeline)
				if (!userResult.success) {
					console.error('ERROR', 'すべてのブロックされたユーザーの情報の取得に失敗しました、データのクエリに失敗しました')
					return { success: false, message: 'すべてのブロックされたユーザーの情報の取得に失敗しました、データのクエリに失敗しました', totalCount: 0 }
				}

				return { success: true, message: 'すべてのブロックされたユーザーの情報の取得に成功しました', result: userResult.result, totalCount: userCountResult.result?.[0]?.totalCount ?? 0 }
			} catch (error) {
				console.error('ERROR', 'すべてのブロックされたユーザーの情報の取得に失敗しました、データのクエリ時にエラーが発生しました：', error)
				return { success: false, message: 'すべてのブロックされたユーザーの情報の取得に失敗しました、データのクエリ時にエラーが発生しました', totalCount: 0 }
			}
		} else {
			console.error('ERROR', 'すべてのブロックされたユーザーの情報の取得に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: 'すべてのブロックされたユーザーの情報の取得に失敗しました、ユーザーの検証に失敗しました', totalCount: 0 }
		}
	} catch (error) {
		console.error('ERROR', 'すべてのブロックされたユーザーの情報を取得する際にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: 'すべてのブロックされたユーザーの情報を取得する際にエラーが発生しました、不明なエラー', totalCount: 0 }
	}
}

/**
 * 管理者がユーザー情報を取得する
 * @param adminGetUserInfoServiceRequest 管理者がユーザー情報を取得するリクエストペイロード
 * @param adminUUID 管理者のUUID
 * @param adminToken 管理者のトークン
 * @returns 管理者がユーザー情報を取得するリクエストレスポンス
 */
export const adminGetUserInfoService = async (adminGetUserInfoRequest: AdminGetUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminGetUserInfoResponseDto> => {
	try {
		if (!checkAdminGetUserInfoRequest(adminGetUserInfoRequest)) {
			console.error('ERROR', '管理者のユーザー情報取得に失敗しました、リクエストパラメータが不正です')
			return { success: false, message: '管理者のユーザー情報取得に失敗しました、リクエストパラメータが不正です', totalCount: 0 }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理者のユーザー情報取得に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: '管理者のユーザー情報取得に失敗しました、ユーザーの検証に失敗しました', totalCount: 0 }
		}
		const { sortBy, sortOrder } = adminGetUserInfoRequest
		if (!checkSortVariables(sortBy, sortOrder)) {
			console.error('ERROR', '管理者のユーザー情報取得に失敗しました、ソートパラメータが不正です')
			return { success: false, message: '管理者のユーザー情報取得に失敗しました、ソートパラメータが不正です', totalCount: 0 }
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
					from: 'user-infos', // WARN: 複数形を忘れないでください
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data',
				},
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true, // 空の配列とnull値を保持する
				},
			},
		]

		const adminGetUserInfoPipeline: PipelineStage[] = [
			{
				$lookup: {
					from: 'user-infos', // WARN: 複数形を忘れないでください
					localField: 'UUID',
					foreignField: 'UUID',
					as: 'user_info_data',
				},
			},
			{
				$unwind: {
					path: '$user_info_data',
					preserveNullAndEmptyArrays: true, // 空の配列とnull値を保持する
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
			{ $skip: skip }, // 指定された数のドキュメントをスキップする
			{ $limit: pageSize }, // 返されるドキュメントの数を制限する
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
				userCreateDateTime: 1, // ユーザー作成日
				roles: 1, // ユーザーのロール
				email: 1, // ユーザーのメールアドレス
				username: '$user_info_data.username', // ユーザー名
				userNickname: '$user_info_data.userNickname', // ユーザーのニックネーム
				avatar: '$user_info_data.avatar', // ユーザーのアバター
				userBannerImage: '$user_info_data.userBannerImage', // ユーザーのバナー画像
				signature: '$user_info_data.signature', // ユーザーの署名
				gender: '$user_info_data.gender', // ユーザーの性別
				userBirthday: '$user_info_data.userBirthday', // ユーザーの誕生日
				invitationCode: '$invitation_codes_data.invitationCode', // ユーザーの招待コード
				isUpdatedAfterReview: '$user_info_data.isUpdatedAfterReview', // 審査済みかどうか
				editOperatorUUID: '$user_info_data.editOperatorUUID', // 編集オペレーターのUUID
				editDateTime: '$user_info_data.editDateTime', // 編集時間
				totalCount: 1, // 総ドキュメント数
			},
		}
		adminGetUserInfoPipeline.push(projectStep)

		const countStep = {
			$count: 'totalCount', // 総ドキュメント数をカウントする
		}
		adminGetUserInfoCountPipeline.push(countStep)

		try {
			const userCountResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, adminGetUserInfoCountPipeline)
			const userResult = await selectDataByAggregateFromMongoDB(userAuthSchemaInstance, userAuthCollectionName, adminGetUserInfoPipeline)
			if (!userResult.success) {
				console.error('ERROR', '管理者のユーザー情報取得に失敗しました、データのクエリに失敗しました')
				return { success: false, message: '管理者のユーザー情報取得に失敗しました、データのクエリに失敗しました', totalCount: 0 }
			}

			return { success: true, message: '管理者のユーザー情報取得に成功しました', result: userResult.result, totalCount: userCountResult.result?.[0]?.totalCount ?? 0 }
		} catch (error) {
			console.error('ERROR', '管理者がユーザー情報を取得する際にエラーが発生しました、データのクエリ時にエラーが発生しました：', error)
			return { success: false, message: '管理者がユーザー情報を取得する際にエラーが発生しました、データのクエリ時にエラーが発生しました', totalCount: 0 }
		}
	} catch (error) {
		console.error('ERROR', '管理者がユーザー情報を取得する際にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '管理者がユーザー情報を取得する際にエラーが発生しました、不明なエラー', totalCount: 0 }
	}
}

/**
 * 管理者がユーザー情報の審査を通過させる
 * @param approveUserInfoRequest 管理者がユーザー情報の審査を通過させるリクエストペイロード
 * @param adminUUID 管理者のUUID
 * @param adminToken 管理者のトークン
 * @returns 管理者がユーザー情報の審査を通過させるリクエストレスポンス
 */
export const approveUserInfoService = async (approveUserInfoRequest: ApproveUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<ApproveUserInfoResponseDto> => {
	try {
		if (!checkApproveUserInfoRequest(approveUserInfoRequest)) {
			console.error('ERROR', '管理者のユーザー情報審査通過に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者のユーザー情報審査通過に失敗しました、パラメータが不正です' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理者のユーザー情報審査通過に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: '管理者のユーザー情報審査通過に失敗しました、ユーザーの検証に失敗しました' }
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
				console.error('ERROR', '管理者のユーザー情報審査通過に失敗しました、データベースへのデータ更新に失敗しました')
				return { success: false, message: '管理者のユーザー情報審査通過に失敗しました、データベースへのデータ更新に失敗しました' }
			}

			return { success: true, message: '管理者のユーザー情報審査通過に成功しました' }
		} catch (error) {
			console.error('ERROR', '管理者がユーザー情報の審査を通過させる際にエラーが発生しました、データベースへのデータ更新時にエラーが発生しました：', error)
			return { success: false, message: '管理者がユーザー情報の審査を通過させる際にエラーが発生しました、データベースへのデータ更新時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', '管理者がユーザー情報の審査を通過させる際にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '管理者がユーザー情報の審査を通過させる際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * 管理者が特定のユーザー情報をクリアする
 * @param approveUserInfoRequest 管理者が特定のユーザー情報をクリアするリクエストペイロード
 * @param adminUUID 管理者のUUID
 * @param adminToken 管理者のトークン
 * @returns 管理者が特定のユーザー情報をクリアするリクエストレスポンス
 */
export const adminClearUserInfoService = async (adminClearUserInfoRequest: AdminClearUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminClearUserInfoResponseDto> => {
	try {
		if (!checkAdminClearUserInfoRequest(adminClearUserInfoRequest)) {
			console.error('ERROR', '管理者のユーザー情報クリアに失敗しました、パラメータが不正です')
			return { success: false, message: '管理者のユーザー情報クリアに失敗しました、パラメータが不正です' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理者のユーザー情報クリアに失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: '管理者のユーザー情報クリアに失敗しました、ユーザーの検証に失敗しました' }
		}

		const uid = adminClearUserInfoRequest.uid
		const UUID = await getUserUuid(uid)
		if (!UUID) {
			console.error('ERROR', '管理者のユーザー情報クリアに失敗しました、UUIDが存在しません', { uid })
			return { success: false, message: '管理者のユーザー情報クリアに失敗しました、UUIDが存在しません' }
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
			uid, // TODO: 削除できるかもしれません
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
			isUpdatedAfterReview: false, // 情報をクリアした場合は直接falseに設定
			editOperatorUUID: adminUUID,
			editDateTime: new Date().getTime(),
		}
		try {
			const updateResult = await findOneAndUpdateData4MongoDB(adminClearUserInfoWhere, adminClearUserInfoUpdate, schemaInstance, collectionName)
			if (!updateResult.success) {
				console.error('ERROR', '管理者のユーザー情報クリアに失敗しました、データベースへのデータ更新に失敗しました')
				return { success: false, message: '管理者のユーザー情報クリアに失敗しました、データベースへのデータ更新に失敗しました' }
			}

			return { success: true, message: '管理者のユーザー情報クリアに成功しました' }
		} catch (error) {
			console.error('ERROR', '管理者が特定のユーザー情報をクリアする際にエラーが発生しました、データベースへのデータ更新時にエラーが発生しました：', error)
			return { success: false, message: '管理者が特定のユーザー情報をクリアする際にエラーが発生しました、データベースへのデータ更新時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', '管理者が特定のユーザー情報をクリアする際にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '管理者が特定のユーザー情報をクリアする際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * 管理者がユーザー情報を編集する
 * @param AdminEditUserInfoRequestDto 管理者がユーザー情報を編集するリクエストペイロード
 * @param adminUUID 管理者のUUID
 * @param adminToken 管理者のトークン
 * @return 管理者がユーザー情報を編集するリクエストレスポンス
 */
export const adminEditUserInfoService = async (adminEditUserInfoRequest: AdminEditUserInfoRequestDto, adminUUID: string, adminToken: string): Promise<AdminEditUserInfoResponseDto> => {
	try {
		if (!checkAdminEditUserInfoRequest(adminEditUserInfoRequest)) {
			console.error('ERROR', '管理者のユーザー情報編集に失敗しました、パラメータが不正です')
			return { success: false, message: '管理者のユーザー情報編集に失敗しました、パラメータが不正です' }
		}

		const { uid } = adminEditUserInfoRequest
		const { username } = adminEditUserInfoRequest.userInfo
		const usernameStandardized = username.trim().normalize()
		const { collectionName: userInfoCollectionName, schemaInstance: userInfoSchemaInstance } = UserInfoSchema

		if (username) {
			const checkResult = await checkUsernameService({ username: usernameStandardized })

			if (!checkResult.success || !checkResult.isAvailableUsername) {
				console.error('ERROR', '管理者のユーザー情報編集に失敗しました、ユーザー名が利用できません', { adminEditUserInfoRequest, uid })
				return { success: false, message: '管理者のユーザー情報編集に失敗しました、ユーザー名が利用できません' }
			}
		}

		const UUID = await getUserUuid(uid)
		if (!UUID) {
			console.error('ERROR', '管理者のユーザー情報編集に失敗しました、UUIDが存在しません', { uid })
			return { success: false, message: '管理者のユーザー情報編集に失敗しました、UUIDが存在しません' }
		}

		if (!await checkUserTokenByUUID(adminUUID, adminToken)) {
			console.error('ERROR', '管理者のユーザー情報編集に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: '管理者のユーザー情報編集に失敗しました、ユーザーの検証に失敗しました' }
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
			console.error('ERROR', '管理者のユーザー情報編集に失敗しました、データベースへのデータ更新に失敗しました')
			return { success: false, message: '管理者のユーザー情報編集に失敗しました、データベースへのデータ更新に失敗しました' }
		}
		return { success: true, message: '管理者のユーザー情報編集に成功しました' }

	} catch (error) {
		console.error('ERROR', '管理者がユーザー情報を編集する際にエラーが発生しました、不明なエラー：', error)
		return { success: false, message: '管理者がユーザー情報を編集する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * UIDに基づいてUUIDを取得する
 * @param uid ユーザーUID
 * @returns UUID
 */
export const getUserUuid = async (uid: number): Promise<string | void> => {
	try {
		if (uid === undefined || uid === null || uid <= 0) {
			console.error('ERROR', 'UIDによるUUIDの取得に失敗しました、UIDが不正です')
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
			console.error('ERROR', 'UIDによるUUIDの取得に失敗しました、UUIDが存在しないか、結果の長さが1ではありません')
		}
	} catch (error) {
		console.error('ERROR', 'UIDによるUUIDの取得時にエラーが発生しました：', error)
		return
	}
}

/**
 * UUIDに基づいてUIDを取得する
 * @param uuid ユーザーUUID
 * @returns UID
 */
export const getUserUid = async (uuid: string): Promise<number | undefined> => {
	try {
		if (!uuid) {
			console.error('ERROR', 'UUIDによるUIDの取得に失敗しました、UUIDが不正です')
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
			console.error('ERROR', 'UUIDによるUIDの取得に失敗しました、UIDが存在しないか、結果の長さが1ではありません')
		}
	} catch (error) {
		console.error('ERROR', 'UUIDによるUIDの取得時にエラーが発生しました：', error)
		return undefined
	}
}

/**
 * ユーザーのトークンを確認し、トークンとユーザーのuidが一致するかどうかを判断し、ユーザーが登録済みかどうかを判断する
 * // DELETE ME これは一時的な解決策であり、将来的にはCookieに直接UUIDを保存します
 * @param uid ユーザーID
 * @param token ユーザートークン
 * @returns boolean 検証が成功した場合はtrue、失敗した場合はfalse
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
						console.error('ERROR', `ユーザーのトークンをクエリする際に、ユーザー情報の長さが1ではありません、ユーザーuid：【${uid}】`)
						return false
					}
				} else {
					console.error('ERROR', `ユーザーのトークンをクエリする際にユーザー情報が見つかりませんでした、ユーザーuid：【${uid}】、エラーの説明：${userInfo.message}、エラー情報：${userInfo.error}`)
					return false
				}
			} catch (error) {
				console.error('ERROR', `ユーザーのトークンをクエリする際にエラーが発生しました、ユーザーuid：【${uid}】、エラー情報：`, error)
				return false
			}
		} else {
			console.error('ERROR', `ユーザーのトークンをクエリする際にエラーが発生しました、必須パラメータのuidまたはtokenが空です：【${uid}】`)
			return false
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーのトークンをクエリする際にエラーが発生しました、不明なエラー：', error)
		return false
	}
}

/**
 * ユーザーのトークンを確認し、トークンとユーザーのuuidが一致するかどうかを判断し、ユーザーが登録済みかどうかを判断する
 * @param UUID ユーザーUUID
 * @param token ユーザートークン
 * @returns boolean 検証が成功した場合はtrue、失敗した場合はfalse
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
						console.error('ERROR', `ユーザーのトークンをクエリする際に、ユーザー情報の長さが1ではありません、ユーザーUUID: ${UUID}`)
						return false
					}
				} else {
					console.error('ERROR', `ユーザーのトークンをクエリする際にユーザー情報が見つかりませんでした、ユーザーUUID: ${UUID}、エラーの説明：${userInfo.message}、エラー情報：${userInfo.error}`)
					return false
				}
			} catch (error) {
				console.error('ERROR', `ユーザーのトークンをクエリする際にエラーが発生しました、ユーザーUUID: ${UUID}、エラー情報：`, error)
				return false
			}
		} else {
			console.error('ERROR', `ユーザーのトークンをクエリする際にエラーが発生しました、必須パラメータのuidまたはtokenが空です UUID: ${UUID}`)
			return false
		}
	} catch (error) {
		console.error('ERROR', 'ユーザーのトークンをクエリする際にエラーが発生しました、不明なエラー：', error)
		return false
	}
}

/** リカバリーコードでユーザーの2FAを削除する際のパラメータ */
type DeleteTotpAuthenticatorByRecoveryCodeParametersDto = {
	/** ユーザーのメールアドレス */
	email: string,
	/** リカバリーコード */
	recoveryCodeHash: string,
	/** トランザクション */
	session?: mongoose.ClientSession,
}

/** リカバリーコードでユーザーの2FAを削除した結果 */
type DeleteTotpAuthenticatorByRecoveryCodeResultDto = {} & DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto

/**
 * リカバリーコードでユーザーの2FAを削除する、ログイン時にのみ使用可能
 * @param deleteTotpAuthenticatorByRecoveryCodeData リカバリーコードでユーザーの2FAを削除する際のパラメータ
 * @returns リカバリーコードでユーザーの2FAを削除した結果
 */
const deleteTotpAuthenticatorByRecoveryCode = async (deleteTotpAuthenticatorByRecoveryCodeData: DeleteTotpAuthenticatorByRecoveryCodeParametersDto): Promise<DeleteTotpAuthenticatorByRecoveryCodeResultDto> => {
	try {
		if (!checkDeleteTotpAuthenticatorByRecoveryCodeData(deleteTotpAuthenticatorByRecoveryCodeData)) {
			console.error('ERROR', 'リカバリーコードによるユーザー2FAの削除に失敗しました、パラメータが不正です')
			return { success: false, message: 'リカバリーコードによるユーザー2FAの削除に失敗しました、パラメータが不正です' }
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
			console.error('ERROR', 'リカバリーコードによるユーザー2FAの削除に失敗しました、ユーザー情報を取得できません', { emailLowerCase })
			return { success: false, message: 'リカバリーコードによるユーザー2FAの削除に失敗しました、ユーザー情報を取得できません' }
		}

		const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
		type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>
		const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID: uuid, recoveryCodeHash }
		const deleteResult = await deleteDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!deleteResult.success) {
			console.error('ERROR', 'リカバリーコードによるユーザー2FAの削除に失敗しました、削除に失敗しました', { emailLowerCase })
			return { success: false, message: 'リカバリーコードによるユーザー2FAの削除に失敗しました、削除に失敗しました' }
		}

		const resetResult = await resetUser2FATypeByUUID(uuid, session)

		if (!resetResult) {
			console.error('ERROR', 'リカバリーコードによるユーザー2FAの削除に失敗しました、ユーザー2FAデータのリセットに失敗しました', { emailLowerCase })
			return { success: false, message: 'リカバリーコードによるユーザー2FAの削除に失敗しました、ユーザー2FAデータのリセットに失敗しました' }
		}

		return { success: true, message: 'ユーザーの認証システムが削除されました' }
	} catch (error) {
		console.error('ERROR', 'リカバリーコードによるユーザー2FAの削除に失敗しました', error)
		return { success: false, message: 'リカバリーコードによるユーザー2FAの削除に失敗しました、不明なエラーが発生しました' }
	}
}

/**
 * ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する
 * @param deleteTotpAuthenticatorByTotpVerificationCodeRequest ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns 削除操作の結果
 */
export const deleteTotpAuthenticatorByTotpVerificationCodeService = async (deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto, uuid: string, token: string): Promise<DeleteTotpAuthenticatorByTotpVerificationCodeResponseDto> => {
	try {
		if (!checkDeleteTotpAuthenticatorByTotpVerificationCodeRequest(deleteTotpAuthenticatorByTotpVerificationCodeRequest)) {
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、パラメータが不正です')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、パラメータが不正です' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーの検証に失敗しました' }
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
			console.error('ERROR', `ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーのセキュリティ情報が取得できません`)
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーのセキュリティ情報が取得できません' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, passwordHashHash)
		if (!isCorrectPassword) {
			console.error('ERROR', `ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーのセキュリティ情報が取得できません`)
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、ユーザーのパスワードが正しくありません' }
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
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、一致するデータが見つかりません')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、一致するデータが見つかりません' }
		}

		let attempts = selectResult.result[0].attempts
		const totpSecret = selectResult.result[0].secret

		// ユーザーの削除試行頻度を制限する
		if (selectResult.result[0].attempts >= maxAttempts) {
			const lastAttemptTime = new Date(selectResult.result[0].lastAttemptTime).getTime();
			if (now - lastAttemptTime < lockTime) {
				attempts += 1

				if (session.inTransaction()) {
					await session.abortTransaction()
				}
				session.endSession()
				console.warn('WARN', 'WARNING', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、最大試行回数に達しました、しばらくしてからもう一度お試しください');
				return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、最大試行回数に達しました、しばらくしてからもう一度お試しください', isCoolingDown: true }
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
				console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、最終試行時間または試行回数の更新に失敗しました');
				return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました、最終試行時間または試行回数の更新に失敗しました', isCoolingDown: true }
			}
		}

		if (!authenticator.check(clientOtp, totpSecret)) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、確認コードが間違っています')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、確認コードが間違っています' }
		}

		// 削除関数を呼び出す
		const deleteResult = await deleteDataFromMongoDB(deleteTotpAuthenticatorByTotpVerificationCodeWhere, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })
		const resetResult = await resetUser2FATypeByUUID(uuid, session)

		if (!deleteResult.success || deleteResult.result.deletedCount !== 1 || !resetResult) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、一致するデータが見つからないか、ユーザー2FAデータのリセットに失敗しました')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際に失敗しました：削除に失敗しました、一致するデータが見つからないか、ユーザー2FAデータのリセットに失敗しました' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, message: 'TOTP認証システムの削除に成功しました' }
	} catch (error) {
		console.error('ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * UUIDに基づいてuser-authテーブルのユーザーのauthenticatorTypeフィールドをnoneにリセットする、deleteTotpAuthenticatorByRecoveryCode、deleteTotpAuthenticatorByTotpVerificationCodeService、およびdeleteUserEmailAuthenticatorServiceで使用される
 * @param uuid ユーザーのUUID
 * @param session Mongooseセッション
 * @returns boolean 実行が成功した場合はtrue
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
		console.error('ERROR', 'UUIDに基づいてuser-authテーブルのユーザーのauthenticatorTypeフィールドをリセットする際にエラーが発生しました、不明なエラー：', error)
		return false
	}
}

/**
 * ユーザーがTOTP認証システムを作成するサービス
 * メール認証の有効化は別の関数で行い、これはtotpを有効化するだけです。
 * ここでは作成のみを行い、その後、作成を確認するステップがあります。
 *
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーがTOTP認証システムを作成するリクエストレスポンス
 */
export const createUserTotpAuthenticatorService = async (uuid: string, token: string): Promise<CreateUserTotpAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('TOTP認証システムの作成に失敗しました、不正なユーザーです', { uuid })
			return { success: false, isExists: false, message: 'TOTP認証システムの作成に失敗しました、不正なユーザーです' }
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
			console.error('TOTP認証システムの作成に失敗しました、ユーザーが存在しません', { uuid })
			return { success: false, isExists: false, message: 'TOTP認証システムの作成に失敗しました、ユーザーが存在しません' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、既にメール2FAが有効です', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: 'TOTP認証システムの作成に失敗しました、既にメール2FAが有効です' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、既にTOTP 2FAが有効です', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: 'TOTP認証システムの作成に失敗しました、既にTOTP 2FAが有効です' }
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
			console.error('TOTP認証システムの作成に失敗しました、認証システムの一意性チェックに失敗しました', { uuid })
			return { success: false, isExists: false, message: '認証システムの作成に失敗しました、認証システムの一意性チェックに失敗しました' }
		}

		if (checkUserAuthenticatorResult.result.length >= 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、データベースに既に有効なTOTP 2FAが保存されています', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: 'TOTP認証システムの作成に失敗しました、データベースに既に有効な認証システムが保存されています' }
		}

		const now = new Date().getTime()
		const secret = authenticator.generateSecret()
		const email = userAuthResult.result[0].email
		const otpAuth = authenticator.keyuri(email, 'KIRAKIRA☆DOUGA', secret)
		const attempts = 0

		// 挿入する認証システムデータを準備する
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

		// データをデータベースに挿入する
		const saveTotpAuthenticatorResult = await insertData2MongoDB<UserAuthenticator>(userAuthenticatorData, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName, { session })

		if (!saveTotpAuthenticatorResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、データの保存に失敗しました', { uuid })
			return { success: false, isExists: false, message: 'TOTP認証システムの作成に失敗しました、データの保存に失敗しました' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, isExists: false, message: 'TOTP認証システムの作成に成功しました', result: { otpAuth } }
	} catch (error) {
		console.error('TOTP認証システムの作成に失敗しました、不明なエラー', error)
		return { success: false, isExists: false, message: 'TOTP認証システムの作成時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザーがTOTPデバイスのバインドを確認する
 * @param confirmUserTotpAuthenticatorRequest ユーザーがTOTPデバイスのバインドを確認するリクエストペイロード
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーがTOTPデバイスのバインドを確認するリクエストレスポンス
 */
export const confirmUserTotpAuthenticatorService = async (confirmUserTotpAuthenticatorRequest: ConfirmUserTotpAuthenticatorRequestDto, uuid: string, token: string): Promise<ConfirmUserTotpAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('TOTPデバイスのバインド確認に失敗しました、不正なユーザーです')
			return { success: false, message: 'TOTPデバイスのバインド確認に失敗しました、不正なユーザーです' }
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
			console.error('TOTPデバイスのバインド確認に失敗しました、検証データの取得に失敗しました')
			return { success: false, message: 'TOTPデバイスのバインド確認に失敗しました、検証データの取得に失敗しました' }
		}

		const totpSecret = selectResult.result[0].secret
		if (!authenticator.check(clientOtp, totpSecret)) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTPデバイスのバインド確認に失敗しました、検証に失敗しました')
			return { success: false, message: 'TOTPデバイスのバインド確認に失敗しました、検証に失敗しました' }
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
			console.error('TOTPデバイスのバインド確認に失敗しました、更新に失敗しました')
			return { success: false, message: 'TOTPデバイスのバインド確認に失敗しました、更新に失敗しました' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, result: { backupCode, recoveryCode }, message: 'TOTPデバイスがバインドされました' }
	} catch (error) {
		console.error('TOTPデバイスのバインド確認時にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'TOTPデバイスのバインド確認時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザーがメール認証システムを作成するサービス
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns ユーザーがメール認証システムを作成するリクエストレスポンス
 */
export const createUserEmailAuthenticatorService = async (uuid: string, token: string): Promise<CreateUserEmailAuthenticatorResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('メール認証システムの作成に失敗しました、不正なユーザーです', { uuid })
			return { success: false, isExists: false, message: 'メール認証システムの作成に失敗しました、不正なユーザーです' }
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
			console.error('TOTP認証システムの作成に失敗しました、ユーザーが存在しません', { uuid })
			return { success: false, isExists: false, message: 'TOTP認証システムの作成に失敗しました、ユーザーが存在しません' }
		}

		const email = userAuthResult.result[0].email
		const emailLowerCase = userAuthResult.result[0].emailLowerCase
		if (!emailLowerCase) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、メールアドレスが見つかりません', { uuid })
			return { success: false, isExists: false, message: 'TOTP認証システムの作成に失敗しました、メールアドレスが見つかりません' }
		}

		if (userAuthResult.result[0].authenticatorType === 'email') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、既にメール2FAが有効です', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: 'TOTP認証システムの作成に失敗しました、既にメール2FAが有効です' }
		}

		if (userAuthResult.result[0].authenticatorType === 'totp') {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('TOTP認証システムの作成に失敗しました、既にTOTP 2FAが有効です', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'totp', message: 'TOTP認証システムの作成に失敗しました、既にTOTP 2FAが有効です' }
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
			console.error('メール認証システムの作成に失敗しました、認証システムの一意性チェックに失敗しました', { uuid })
			return { success: false, isExists: false, message: '認証システムの作成に失敗しました、認証システムの一意性チェックに失敗しました' }
		}

		if (checkUserAuthenticatorResult.result.length >= 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('メール認証システムの作成に失敗しました、データベースに既に有効なメール2FAが保存されています', { uuid })
			return { success: false, isExists: true, existsAuthenticatorType: 'email', message: 'メール認証システムの作成に失敗しました、データベースに既に有効なものが保存されています' }
		}

		const now = new Date().getTime()

		// 挿入する認証システムデータを準備する
		const userAuthenticatorData: UserAuthenticator = {
			UUID: uuid,
			enabled: true,
			emailLowerCase,
			createDateTime: now,
			editDateTime: now,
		}

		// データをデータベースに挿入する
		const saveEmailAuthenticatorResult = await insertData2MongoDB<UserAuthenticator>(userAuthenticatorData, userEmailAuthenticatorSchemaInstance, UserEmailAuthenticatorCollectionName, { session })

		if (!saveEmailAuthenticatorResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('メール認証システムの作成に失敗しました、データの保存に失敗しました-1', { uuid })
			return { success: false, isExists: false, message: 'メール認証システムの作成に失敗しました、データの保存に失敗しました-1' }
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
			console.error('メール認証システムの作成に失敗しました、データの保存に失敗しました-2', { uuid })
			return { success: false, isExists: false, message: 'メール認証システムの作成に失敗しました、データの保存に失敗しました-2' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, isExists: false, message: 'メール認証システムの作成に成功しました', result: { email, emailLowerCase } }
	} catch (error) {
		console.error('メール認証システムの作成時にエラーが発生しました、不明なエラー', error)
		return { success: false, isExists: false, message: 'メール認証システムの作成時にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザーがメール認証システムの確認メールを送信する
 * @param sendUserEmailAuthenticatorRequestDto ユーザーがメール認証システムの確認メールを送信するリクエストペイロード
 * @returns ユーザーがメール認証システムの確認メールを送信するリクエストレスポンス
 */
export const sendUserEmailAuthenticatorService = async (sendUserEmailAuthenticatorVerificationCodeRequest: SendUserEmailAuthenticatorVerificationCodeRequestDto): Promise<SendUserEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkSendUserEmailAuthenticatorVerificationCodeRequest(sendUserEmailAuthenticatorVerificationCodeRequest)) {
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、パラメータが不正です')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、パラメータが不正です' }
		}

		const { clientLanguage, email, passwordHash } = sendUserEmailAuthenticatorVerificationCodeRequest
		const emailLowerCase = email.toLowerCase()

		const nowTime = new Date().getTime()
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)

		// トランザクション開始
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
			console.error('認証システムの確認メールの送信に失敗しました、ユーザーが存在しません')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザーが存在しません' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, passwordHashHash)
		if (!isCorrectPassword) {
			await abortAndEndSession(session)
			console.error('認証システムの確認メールの送信に失敗しました、パスワードが間違っています')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、パスワードが間違っています' }
		}

		if (userAuthData.authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('認証システムの確認メールの送信に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。' }
		}

		const { collectionName: userEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: userEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof userEmailAuthenticatorVerificationCodeSchemaInstance>
		const requestSendEmailAuthenticatorByEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // ユーザーのメールアドレス
			attemptsTimes: 1, // 確認コードのリクエスト回数
			lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSendEmailAuthenticatorByEmailVerificationCodeSelect, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!requestSendEmailAuthenticatorByEmailVerificationCodeResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、確認コードの取得に失敗しました')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、確認コードの取得に失敗しました' }
		}

		const lastRequestDateTime = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && lastRequestDateTime + 55000 > nowTime) { // 冷却中かどうか、フロントエンド60秒、バックエンド55秒
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '認証システムの確認メールの送信に失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください')
			return { success: true, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください' }
		}

		const attemptsTimes = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
		const lastRequestDate = new Date(lastRequestDateTime)
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && todayStart < lastRequestDate && attemptsTimes > 5) { // ! 1日5回まで
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '認証システムの確認メールの送信に失敗しました、本日の繰り返し上限回数に達しました、しばらくしてからもう一度お試しください')
			return { success: true, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、本日の繰り返し上限回数に達しました、しばらくしてからもう一度お試しください' }
		}

		const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
		let newAttemptsTimes = attemptsTimes + 1
		if (todayStart > lastRequestDate) {
			newAttemptsTimes = 0
		}

		const requestSeDeleteTotpAuthenticatorVerificationCodeUpdate: UpdateType<UserEmailAuthenticatorVerificationCode> = {
			verificationCode,
			overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
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
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、ユーザー確認コードの更新または新規作成に失敗しました')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザー確認コードの更新または新規作成に失敗しました' }
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
				console.error('ERROR', '認証システムの確認メールの送信に失敗しました、メールの送信に失敗しました')
				return { success: false, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、メールの送信に失敗しました' }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, isCoolingDown: false, message: '認証システムの確認メールが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }
		} catch (error) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '認証システムの確認メールを送信する際にエラーが発生しました、メール送信時にエラーが発生しました', error)
			return { success: false, isCoolingDown: true, message: '認証システムの確認メールを送信する際にエラーが発生しました、メール送信時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', '認証システムの確認メールを送信する際にエラーが発生しました、不明なエラー', error)
		return { success: false, isCoolingDown: false, message: '認証システムの確認メールを送信する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザーがメール認証システムの削除確認メールを送信する
 * @param sendDeleteUserEmailAuthenticatorVerificationCodeRequest ユーザーがメール認証システムの削除確認メールを送信するリクエストペイロード
 * @returns ユーザーがメール認証システムの確認メールを送信するリクエストレスポンス
 */
export const sendDeleteUserEmailAuthenticatorService = async (sendDeleteUserEmailAuthenticatorVerificationCodeRequest: SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto, uuid: string, token: string): Promise<SendDeleteUserEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkSendDeleteUserEmailAuthenticatorVerificationCodeRequest(sendDeleteUserEmailAuthenticatorVerificationCodeRequest)) {
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、パラメータが不正です')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、パラメータが不正です' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('認証システムの確認メールの送信に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザーの検証に失敗しました' }
		}

		const { clientLanguage } = sendDeleteUserEmailAuthenticatorVerificationCodeRequest

		const nowTime = new Date().getTime()
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)

		// トランザクション開始
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
			console.error('認証システムの確認メールの送信に失敗しました、ユーザーが存在しません')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザーが存在しません' }
		}

		if (authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('認証システムの確認メールの送信に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。' }
		}

		const { collectionName: userEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: userEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof userEmailAuthenticatorVerificationCodeSchemaInstance>
		const requestSendEmailAuthenticatorByEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // ユーザーのメールアドレス
			attemptsTimes: 1, // 確認コードのリクエスト回数
			lastRequestDateTime: 1, // ユーザーが前回確認コードをリクエストした時刻。乱用防止のため
		}

		const requestSendEmailAuthenticatorByEmailVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(requestSendEmailAuthenticatorByEmailVerificationCodeWhere, requestSendEmailAuthenticatorByEmailVerificationCodeSelect, userEmailAuthenticatorVerificationCodeSchemaInstance, userEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!requestSendEmailAuthenticatorByEmailVerificationCodeResult.success) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、確認コードの取得に失敗しました')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、確認コードの取得に失敗しました' }
		}

		const lastRequestDateTime = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.lastRequestDateTime ?? 0
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && lastRequestDateTime + 55000 > nowTime) { // 冷却中かどうか、フロントエンド60秒、バックエンド55秒
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '認証システムの確認メールの送信に失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください')
			return { success: true, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、メールのタイムアウト時間を超えていません、しばらくしてからもう一度お試しください' }
		}

		const attemptsTimes = requestSendEmailAuthenticatorByEmailVerificationCodeResult.result?.[0]?.attemptsTimes ?? 0
		const lastRequestDate = new Date(lastRequestDateTime)
		if (requestSendEmailAuthenticatorByEmailVerificationCodeResult.result.length >= 1 && todayStart < lastRequestDate && attemptsTimes > 5) { // ! 1日5回まで
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.warn('WARN', 'WARNING', '認証システムの確認メールの送信に失敗しました、本日の繰り返し上限回数に達しました、しばらくしてからもう一度お試しください')
			return { success: true, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、本日の繰り返し上限回数に達しました、しばらくしてからもう一度お試しください' }
		}

		const verificationCode = generateSecureVerificationNumberCode(6) // 6桁のランダムな数字の確認コードを生成
		let newAttemptsTimes = attemptsTimes + 1
		if (todayStart > lastRequestDate) {
			newAttemptsTimes = 0
		}

		const requestSeDeleteTotpAuthenticatorVerificationCodeUpdate: UpdateType<UserEmailAuthenticatorVerificationCode> = {
			verificationCode,
			overtimeAt: nowTime + 1800000, // 現在時刻に1800000ミリ秒（30分）を足して新しい有効期限とする
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
			console.error('ERROR', '認証システムの確認メールの送信に失敗しました、ユーザー確認コードの更新または新規作成に失敗しました')
			return { success: false, isCoolingDown: false, message: '認証システムの確認メールの送信に失敗しました、ユーザー確認コードの更新または新規作成に失敗しました' }
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
				console.error('ERROR', '認証システムの確認メールの送信に失敗しました、メールの送信に失敗しました')
				return { success: false, isCoolingDown: true, message: '認証システムの確認メールの送信に失敗しました、メールの送信に失敗しました' }
			}

			await session.commitTransaction()
			session.endSession()
			return { success: true, isCoolingDown: false, message: '認証システムの確認メールが登録時に使用したメールアドレスに送信されました。ご確認ください。届かない場合は、迷惑メールフォルダを確認するか、KIRAKIRAカスタマーサービスまでお問い合わせください。' }
		} catch (error) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', '認証システムの確認メールを送信する際にエラーが発生しました、メール送信時にエラーが発生しました', error)
			return { success: false, isCoolingDown: true, message: '認証システムの確認メールを送信する際にエラーが発生しました、メール送信時にエラーが発生しました' }
		}
	} catch (error) {
		console.error('ERROR', '認証システムの確認メールを送信する際にエラーが発生しました、不明なエラー', error)
		return { success: false, isCoolingDown: false, message: '認証システムの確認メールを送信する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * メール認証システムの確認コードが正しいかどうかを確認する
 * @param checkEmailAuthenticatorVerificationCodeRequest ユーザーがメール確認コードで認証システムを確認するリクエストペイロード
 * @returns 削除操作の結果
 */
const checkEmailAuthenticatorVerificationCodeService = async (checkEmailAuthenticatorVerificationCodeRequest: CheckEmailAuthenticatorVerificationCodeRequestDto): Promise<CheckEmailAuthenticatorVerificationCodeResponseDto> => {
	try {
		if (!checkEmailAuthenticatorVerificationCodeRequest.email && !checkEmailAuthenticatorVerificationCodeRequest.verificationCode) {
			console.error('ERROR', 'ユーザーがメール確認コードで認証システムを確認する際に失敗しました、パラメータが不正です')
			return { success: false, message: 'ユーザーがメール確認コードで認証システムを確認する際に失敗しました、パラメータが不正です' }
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
			console.error('ERROR', 'ユーザーがメール確認コードで認証システムを確認する際に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーがメール確認コードで認証システムを確認する際に失敗しました、ユーザーが存在しません' }
		}

		const { collectionName: UserEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: UserEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema

		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof UserEmailAuthenticatorVerificationCodeSchemaInstance>
		const checkDeleteTotpAuthenticatorEmailVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = {
			UUID: uuid,
			verificationCode,
			overtimeAt: { $gte: now },
		}
		const checkDeleteTotpAuthenticatorEmailVerificationCodeSelect: SelectType<UserEmailAuthenticatorVerificationCode> = {
			emailLowerCase: 1, // ユーザーのメールアドレス
		}

		const checkUserEmailAuthenticatorVerificationCodeResult = await selectDataFromMongoDB<UserEmailAuthenticatorVerificationCode>(checkDeleteTotpAuthenticatorEmailVerificationCodeWhere, checkDeleteTotpAuthenticatorEmailVerificationCodeSelect, UserEmailAuthenticatorVerificationCodeSchemaInstance, UserEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!checkUserEmailAuthenticatorVerificationCodeResult.success || checkUserEmailAuthenticatorVerificationCodeResult.result?.length !== 1) {
			if (session.inTransaction()) {
				await session.abortTransaction()
			}
			session.endSession()
			console.error('ERROR', 'ログイン済みのユーザーがパスワードとメール確認コードで認証システムを削除する際に失敗しました：メール確認コードの検証に失敗しました')
			return { success: false, message: 'ログイン済みのユーザーがパスワードとメール確認コードで認証システムを削除する際に失敗しました：メール確認コードの検証に失敗しました' }
		}

		await session.commitTransaction()
		session.endSession()
		return { success: true, message: '認証システムの確認に成功しました' }
	} catch (error) {
		console.error('ユーザーがメール確認コードで認証システムを確認する際にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'ユーザーがメール確認コードで認証システムを確認する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザーがメール2FAを削除する
 * @param deleteUserEmailAuthenticatorRequest
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 */
export const deleteUserEmailAuthenticatorService = async (deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto, uuid: string, token: string): Promise<DeleteUserEmailAuthenticatorResponseDto> => {
	try {
		if (!checkDeleteUserEmailAuthenticatorRequest(deleteUserEmailAuthenticatorRequest)) {
			console.error('ユーザーがメール2FAを削除する際に失敗しました、パラメータが不正です')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、パラメータが不正です' }
		}

		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ユーザーがメール2FAを削除する際に失敗しました、ユーザーの検証に失敗しました')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、ユーザーの検証に失敗しました' }
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
			console.error('ユーザーがメール2FAを削除する際に失敗しました、ユーザーが存在しません')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、ユーザーが存在しません' }
		}

		if (userAuthData.authenticatorType !== 'email') {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、ユーザーが2FAを有効にしていないか、2FAの方法がメールではありません。' }
		}

		const isCorrectPassword = comparePasswordSync(passwordHash, userAuthData.passwordHashHash)
		if (!isCorrectPassword) {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、パスワードが間違っています')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、パスワードが間違っています' }
		}

		const checkEmailAuthenticatorVerificationCodeRequest: CheckEmailAuthenticatorVerificationCodeRequestDto = {
			email: userAuthData.emailLowerCase,
			verificationCode,
		}
		const verificationCodeCheckResult = await checkEmailAuthenticatorVerificationCodeService(checkEmailAuthenticatorVerificationCodeRequest)

		if (!verificationCodeCheckResult || !verificationCodeCheckResult.success) {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、検証に失敗したか、確認コードが間違っています')
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、検証に失敗したか、確認コードが間違っています' }
		}

		// 1. 送信済みの確認コードをクリアする
		const { collectionName: UserEmailAuthenticatorVerificationCodeCollectionName, schemaInstance: UserEmailAuthenticatorVerificationCodeSchemaInstance } = UserEmailAuthenticatorVerificationCodeSchema
		type UserEmailAuthenticatorVerificationCode = InferSchemaType<typeof UserEmailAuthenticatorVerificationCodeSchemaInstance>
		const deleteUserEmailAuthenticatorVerificationCodeWhere: QueryType<UserEmailAuthenticatorVerificationCode> = { UUID: uuid }
		const deleteUserEmailAuthenticatorVerificationCodeResult = await deleteDataFromMongoDB(deleteUserEmailAuthenticatorVerificationCodeWhere, UserEmailAuthenticatorVerificationCodeSchemaInstance, UserEmailAuthenticatorVerificationCodeCollectionName, { session })

		if (!deleteUserEmailAuthenticatorVerificationCodeResult || !deleteUserEmailAuthenticatorVerificationCodeResult.success) {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、そのユーザーの確認コードのクリアに失敗しました', { UUID: uuid })
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、そのユーザーの確認コードのクリアに失敗しました' }
		}

		// 2. メール2FAを削除する
		const { collectionName: UserEmailAuthenticatorCollectionName, schemaInstance: UserEmailAuthenticatorSchemaInstance } = UserEmailAuthenticatorSchema
		type UserEmailAuthenticator = InferSchemaType<typeof UserEmailAuthenticatorSchemaInstance>
		const deleteUserEmailAuthenticatorWhere: QueryType<UserEmailAuthenticator> = { UUID: uuid }
		const deleteUserEmailAuthenticatorResult = await deleteDataFromMongoDB(deleteUserEmailAuthenticatorWhere, UserEmailAuthenticatorSchemaInstance, UserEmailAuthenticatorCollectionName, { session })

		if (!deleteUserEmailAuthenticatorResult || !deleteUserEmailAuthenticatorResult.success) {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、そのユーザーのメール認証の削除に失敗しました', { UUID: uuid })
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、そのユーザーのメール認証の削除に失敗しました' }
		}

		// 3. ユーザーの2FAタイプをリセットする
		const resetUser2FATypeByUUIDResult = await resetUser2FATypeByUUID(uuid, session)

		if (!resetUser2FATypeByUUIDResult) {
			await abortAndEndSession(session)
			console.error('ユーザーがメール2FAを削除する際に失敗しました、ユーザーの2FAを無効にできませんでした', { UUID: uuid })
			return { success: false, message: 'ユーザーがメール2FAを削除する際に失敗しました、ユーザーの2FAを無効にできませんでした' }
		}

		await commitAndEndSession(session)
		return { success: true, message: 'ユーザーのメール2FAの削除に成功しました' }
	} catch (error) {
		console.error('ユーザーがメール2FAを削除する際にエラーが発生しました、不明なエラー', error)
		return { success: false, message: 'ユーザーがメール2FAを削除する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * メールでユーザーが2FA認証システムを有効にしているかどうかを確認する
 * @param checkUserHave2FARequestDto メールでユーザーが2FA認証システムを有効にしているかどうかを確認するリクエストペイロード
 * @returns メールでユーザーが2FA認証システムを有効にしているかどうかを確認するリクエストレスポンス
 */
export const checkUserHave2FAByEmailService = async (checkUserHave2FARequestDto: CheckUserHave2FARequestDto): Promise<CheckUserHave2FAResponseDto> => {
	try {
		const { email } = checkUserHave2FARequestDto
		if (!email) {
			console.error('ERROR', `メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、メールアドレスが空です`)
			return { success: false, have2FA: false, message: 'メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、メールアドレスが空です' }
		}

		const emailLowerCase = email.toLowerCase()

		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const userAuthWhere: QueryType<UserAuth> = { emailLowerCase }
		const userAuthSelect: SelectType<UserAuth> = { authenticatorType: 1, UUID: 1 }

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName)
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、ユーザーデータが見つかりません`)
			return { success: false, have2FA: false, message: 'メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、ユーザーデータが見つかりません' }
		}

		const UUID = userAuthResult.result[0].UUID
		if (!UUID) {
			console.error('ERROR', `メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、UUIDが見つかりません`)
			return { success: false, have2FA: false, message: 'メールでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、UUIDが見つかりません' }
		}

		const authenticatorType = userAuthResult.result[0].authenticatorType
		if (authenticatorType === 'totp') {
			const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
			type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>

			const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID, enabled: true }
			const userTotpAuthenticatorSelect: SelectType<UserTotpAuthenticator> = { createDateTime: 1 }

			const userTotpAuthenticatorResult = await selectDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)
			const totpCreationDateTime = userTotpAuthenticatorResult?.result?.[0].createDateTime

			return { success: true, have2FA: true, type: authenticatorType, totpCreationDateTime, message: 'ユーザーはTOTP 2FAを有効にしています' }
		} else if (authenticatorType === 'email') {
			return { success: true, have2FA: true, type: authenticatorType, message: 'ユーザーはメール2FAを有効にしています' }
		} else {
			return { success: true, have2FA: false, message: 'ユーザーは2FAを有効にしていません' }
		}
	} catch (error) {
		console.error('メールでユーザーが2FA認証システムを有効にしているかどうかを確認する際にエラーが発生しました、不明なエラー', error)
		return { success: false, have2FA: false, message: 'メールでユーザーが2FA認証システムを有効にしているかどうかを確認する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * UUIDでユーザーが2FA認証システムを有効にしているかどうかを確認する
 * @param uuid ユーザーのUUID
 * @param token ユーザーのトークン
 * @returns UUIDでユーザーが2FA認証システムを有効にしているかどうかを確認するリクエストレスポンス
 */
export const checkUserHave2FAByUUIDService = async (uuid: string, token: string): Promise<CheckUserHave2FAResponseDto> => {
	try {
		if (!await checkUserTokenByUUID(uuid, token)) {
			console.error('ERROR', `UUIDでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、不正なユーザーです`)
			return { success: false, have2FA: false, message: 'UUIDでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、不正なユーザーです' }
		}

		const { collectionName, schemaInstance } = UserAuthSchema
		type UserAuth = InferSchemaType<typeof schemaInstance>

		const userAuthWhere: QueryType<UserAuth> = { UUID: uuid }
		const userAuthSelect: SelectType<UserAuth> = { authenticatorType: 1 }

		const userAuthResult = await selectDataFromMongoDB<UserAuth>(userAuthWhere, userAuthSelect, schemaInstance, collectionName)
		if (!userAuthResult?.result || userAuthResult.result?.length !== 1) {
			console.error('ERROR', `UUIDでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、ユーザーデータが見つかりません`)
			return { success: false, have2FA: false, message: 'UUIDでユーザーが2FA認証システムを有効にしているかどうかの確認に失敗しました、ユーザーデータが見つかりません' }
		}

		const authenticatorType = userAuthResult.result[0].authenticatorType
		if (authenticatorType === 'totp') {
			const { collectionName: userTotpAuthenticatorCollectionName, schemaInstance: userTotpAuthenticatorSchemaInstance } = UserTotpAuthenticatorSchema
			type UserTotpAuthenticator = InferSchemaType<typeof userTotpAuthenticatorSchemaInstance>

			const userTotpAuthenticatorWhere: QueryType<UserTotpAuthenticator> = { UUID: uuid, enabled: true }
			const userTotpAuthenticatorSelect: SelectType<UserTotpAuthenticator> = { createDateTime: 1 }

			const userTotpAuthenticatorResult = await selectDataFromMongoDB<UserTotpAuthenticator>(userTotpAuthenticatorWhere, userTotpAuthenticatorSelect, userTotpAuthenticatorSchemaInstance, userTotpAuthenticatorCollectionName)
			const totpCreationDateTime = userTotpAuthenticatorResult?.result?.[0].createDateTime

			return { success: true, have2FA: true, type: authenticatorType, totpCreationDateTime, message: 'ユーザーはTOTP 2FAを有効にしています' }
		} else if (authenticatorType === 'email') {
			return { success: true, have2FA: true, type: authenticatorType, message: 'ユーザーはメール2FAを有効にしています' }
		} else {
			return { success: true, have2FA: false, message: 'ユーザーは2FAを有効にしていません' }
		}
	} catch (error) {
		console.error('UUIDでユーザーが2FA認証システムを有効にしているかどうかを確認する際にエラーが発生しました、不明なエラー', error)
		return { success: false, have2FA: false, message: 'UUIDでユーザーが2FA認証システムを有効にしているかどうかを確認する際にエラーが発生しました、不明なエラー' }
	}
}

/**
 * ユーザー登録情報を検証する
 * @param userRegistrationRequest
 * @returns boolean 合法な場合はtrueを返す
 */
const checkUserRegistrationData = (userRegistrationRequest: UserRegistrationRequestDto): boolean => {
	// TODO // WARN ここではより安全な検証メカニズムが必要になる可能性があります
	return (
		true
		&& !!userRegistrationRequest.passwordHash && !!userRegistrationRequest.email && !isInvalidEmail(userRegistrationRequest.email)
		&& !!userRegistrationRequest.verificationCode
		&& !!userRegistrationRequest.username
	)
}

/**
 * ユーザーのメールアドレスが存在するかどうかの検証リクエストパラメータの非空検証
 * @param userEmailExistsCheckRequest
 * @returns boolean 合法な場合はtrueを返す
 */
const checkUserEmailExistsCheckRequest = (userEmailExistsCheckRequest: UserEmailExistsCheckRequestDto): boolean => {
	// TODO // WARN ここではより安全な検証メカニズムが必要になる可能性があります
	return (!!userEmailExistsCheckRequest.email && !isInvalidEmail(userEmailExistsCheckRequest.email))
}

/**
 * ユーザーログインのリクエストパラメータの検証
 * @param userExistsCheckRequest
 * @returns boolean 合法な場合はtrueを返す
 */
const checkUserLoginRequest = (userLoginRequest: UserLoginRequestDto): boolean => {
	// TODO // WARN ここではより安全な検証メカニズムが必要になる可能性があります
	return (!!userLoginRequest.email && !isInvalidEmail(userLoginRequest.email) && !!userLoginRequest.passwordHash)
}

/**
 * ユーザーのメールアドレス変更のリクエストパラメータの非空検証
 * @param updateUserEmailRequest
 * @returns boolean 合法な場合はtrueを返す
 */
const checkUpdateUserEmailRequest = (updateUserEmailRequest: UpdateUserEmailRequestDto): boolean => {
	// TODO // WARN ここではより安全な検証メカニズムが必要になる可能性があります
	return (
		updateUserEmailRequest.uid !== null && updateUserEmailRequest.uid !== undefined
		&& !!updateUserEmailRequest.oldEmail && !isInvalidEmail(updateUserEmailRequest.oldEmail)
		&& !!updateUserEmailRequest.newEmail && !isInvalidEmail(updateUserEmailRequest.newEmail)
		&& !!updateUserEmailRequest.passwordHash
		&& !!updateUserEmailRequest.verificationCode
	)
}

/**
 * 関連付けを許可するプラットフォームのリスト
 * // TODO これらのデータを環境変数に置く方が良いかもしれませんか？
 */
const ALLOWED_PLATFORM_ID = [
	'platform.twitter', // Twitter → X
	'platform.qq',
	'platform.wechat', // WeChat
	'platform.bilibili',
	'platform.niconico',
	'platform.youtube',
	'platform.otomad_wiki', // Otomad Wiki
	'platform.weibo', // Sina Weibo
	'platform.tieba', // Baidu Tieba
	'platform.cloudmusic', // NetEase Cloud Music
	'platform.discord',
	'platform.telegram',
	'platform.midishow',
	'platform.linkedin', // LinkedIn (International)
	'platform.facebook',
	'platform.instagram',
	'platform.douyin', // Douyin
	'platform.tiktok', // TikTok (Douyin International)
	'platform.pixiv',
	'platform.github',
]

/**
 * 設定を許可するプライバシー設定項目
 * // TODO これらのデータを環境変数に置く方が良いかもしれませんか？
 */
const ALLOWED_PRIVARY_ID = [
	'privary.birthday', // 誕生日
	'privary.age', // 年齢
	'privary.follow', // フォロー
	'privary.fans', // ファン
	'privary.favorites', // お気に入り
]

/**
 * ユーザー情報の更新または作成リクエストのパラメータを確認する
 * @param updateOrCreateUserInfoRequest ユーザー情報の更新または作成リクエストのパラメータ
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkUpdateOrCreateUserInfoRequest = (updateOrCreateUserInfoRequest: UpdateOrCreateUserInfoRequestDto): boolean => {
	// TODO 将来的には、より多くの検証を追加して、潜在的なインジェクションリスクを回避する必要があるかもしれません

	if (!updateOrCreateUserInfoRequest || isEmptyObject(updateOrCreateUserInfoRequest)) {
		return false
	}

	if (updateOrCreateUserInfoRequest?.userLinkedAccounts?.some(account => !ALLOWED_PLATFORM_ID.includes(account.platformId))) {
		return false
	}

	return true
}

/**
 * ユーザー設定の更新または作成時のリクエストパラメータを確認する
 * @param updateOrCreateUserSettingsRequest ユーザー設定の更新または作成時のリクエストパラメータ
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkUpdateOrCreateUserSettingsRequest = (updateOrCreateUserSettingsRequest: UpdateOrCreateUserSettingsRequestDto): boolean => {
	// TODO 将来的には、より多くの検証を追加して、潜在的なインジェクションリスクを回避する必要があるかもしれません

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
 * 確認コード送信リクエストのパラメータを確認する
 * @param requestSendVerificationCodeRequest 確認コード送信リクエストのパラメータ
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkRequestSendVerificationCodeRequest = (requestSendVerificationCodeRequest: RequestSendVerificationCodeRequestDto): boolean => {
	return (!isInvalidEmail(requestSendVerificationCodeRequest.email))
}

/**
 * 招待コードを使用した登録のパラメータを確認する
 * @param useInvitationCodeDto 招待コードを使用した登録のパラメータ
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkUseInvitationCodeDto = (useInvitationCodeDto: UseInvitationCodeDto): boolean => {
	return (
		useInvitationCodeDto.registrantUid !== null && useInvitationCodeDto.registrantUid !== undefined
		&& !!useInvitationCodeDto.invitationCode
	)
}

/**
 * 招待コードが利用可能かどうかを確認するリクエストペイロードを確認する
 * @param checkInvitationCodeRequestDto 招待コードが利用可能かどうかを確認するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkCheckInvitationCodeRequestDto = (checkInvitationCodeRequestDto: CheckInvitationCodeRequestDto): boolean => {
	const invitationCodeRegex = /^KIRA-[A-Z0-9]{4}-[A-Z0-9]{4}$/
	return (!!checkInvitationCodeRequestDto.invitationCode && invitationCodeRegex.test(checkInvitationCodeRequestDto.invitationCode))
}

/**
 * メールアドレス変更の確認コード送信リクエストのペイロードを検証する
 * @param requestSendChangeEmailVerificationCodeRequest メールアドレス変更の確認コード送信リクエストのペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkRequestSendChangeEmailVerificationCodeRequest = (requestSendChangeEmailVerificationCodeRequest: RequestSendChangeEmailVerificationCodeRequestDto): boolean => {
	requestSendChangeEmailVerificationCodeRequest // TODO
	return true
}

/**
 * パスワード変更の確認コード送信リクエストのペイロードを検証する
 * @param requestSendChangePasswordVerificationCodeRequest パスワード変更の確認コード送信リクエストのペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkRequestSendChangePasswordVerificationCodeRequest = (requestSendChangePasswordVerificationCodeRequest: RequestSendChangePasswordVerificationCodeRequestDto): boolean => {
	requestSendChangePasswordVerificationCodeRequest // TODO
	return true
}

/**
 * パスワード変更リクエストのペイロードを検証する
 * @param updateUserPasswordRequest パスワード変更リクエストのペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
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
 * パスワードを忘れた場合の確認コード送信リクエストのペイロードを検証する
 * @param requestSendForgotPasswordVerificationCodeRequest パスワードを忘れた場合の確認コード送信リクエストのペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkRequestSendForgotPasswordVerificationCodeRequest = (requestSendForgotPasswordVerificationCodeRequest: RequestSendForgotPasswordVerificationCodeRequestDto): boolean => {
	return (
		true
		&& !!requestSendForgotPasswordVerificationCodeRequest.email
	)
}

/**
 * パスワードを忘れた場合（パスワードを更新する）のリクエストペイロードを検証する
 * @param forgotPasswordRequest パスワードを忘れた場合（パスワードを更新する）のリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
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
 * ユーザー名確認失敗のリクエストペイロードを確認する
 * @param checkUsernameRequest ユーザー名確認失敗のリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkCheckUsernameRequest = (checkUsernameRequest: CheckUsernameRequestDto): boolean => {
	return (!!checkUsernameRequest.username && checkUsernameRequest.username?.length <= 200 && checkUsernameRequest.username?.length > 0)
}

/**
 * 管理者がユーザー情報を取得するリクエストペイロードを確認する
 * @param adminGetUserInfoRequest 管理者がユーザー情報を取得するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkAdminGetUserInfoRequest = (adminGetUserInfoRequest: AdminGetUserInfoRequestDto): boolean => {
	return (
		adminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview !== undefined && adminGetUserInfoRequest.isOnlyShowUserInfoUpdatedAfterReview !== null
		&& !!adminGetUserInfoRequest.pagination && adminGetUserInfoRequest.pagination.page > 0 && adminGetUserInfoRequest.pagination.pageSize > 0
	)
}

/**
 * 管理者がユーザー情報の審査を通過させるリクエストペイロードを確認する
 * @param approveUserInfoRequest 管理者がユーザー情報の審査を通過させるリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkApproveUserInfoRequest = (approveUserInfoRequest: ApproveUserInfoRequestDto): boolean => {
	return (!!approveUserInfoRequest.UUID)
}

/**
 * 管理者が特定のユーザー情報をクリアするリクエストペイロードを確認する
 * @param adminClearUserInfoRequest 管理者が特定のユーザー情報をクリアするリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkAdminClearUserInfoRequest = (adminClearUserInfoRequest: AdminClearUserInfoRequestDto): boolean => {
	return (
		adminClearUserInfoRequest.uid !== undefined && adminClearUserInfoRequest.uid !== null && typeof adminClearUserInfoRequest.uid === 'number' && adminClearUserInfoRequest.uid > 0
	)
}

/**
 * リカバリーコードでユーザーの2FAを削除する際のパラメータを確認する
 * @param deleteAuthenticatorByRecoveryCodeData リカバリーコードでユーザーの2FAを削除する際のパラメータ
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkDeleteTotpAuthenticatorByRecoveryCodeData = (deleteTotpAuthenticatorByRecoveryCodeData: DeleteTotpAuthenticatorByRecoveryCodeParametersDto): boolean => {
	return (!!deleteTotpAuthenticatorByRecoveryCodeData.email && !!deleteTotpAuthenticatorByRecoveryCodeData.recoveryCodeHash)
}

/**
 * ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除するリクエストペイロードを確認する
 * @param deleteAuthenticatorByTotpVerificationCodeRequest ログイン済みのユーザーがパスワードとTOTP確認コードで認証システムを削除するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkDeleteTotpAuthenticatorByTotpVerificationCodeRequest = (deleteTotpAuthenticatorByTotpVerificationCodeRequest: DeleteTotpAuthenticatorByTotpVerificationCodeRequestDto): boolean => {
	return (!!deleteTotpAuthenticatorByTotpVerificationCodeRequest.clientOtp && !!deleteTotpAuthenticatorByTotpVerificationCodeRequest.passwordHash)
}

/**
 * ユーザーがメール認証システムの確認メールを送信するリクエストペイロードを確認する
 * @param sendDeleteTotpAuthenticatorByEmailVerificationCodeRequest ユーザーがメール認証システムの確認メールを送信するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkSendUserEmailAuthenticatorVerificationCodeRequest = (sendUserEmailAuthenticatorVerificationCodeRequest: SendUserEmailAuthenticatorVerificationCodeRequestDto): boolean => {
	return (!!sendUserEmailAuthenticatorVerificationCodeRequest.email && !!sendUserEmailAuthenticatorVerificationCodeRequest.passwordHash)
}

/**
 * ユーザーがメール認証システムの削除確認メールを送信するリクエストペイロードを確認する
 * @param sendDeleteTotpAuthenticatorByEmailVerificationCodeRequest ユーザーがメール認証システムの削除確認メールを送信するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkSendDeleteUserEmailAuthenticatorVerificationCodeRequest = (sendDeleteUserEmailAuthenticatorVerificationCodeRequest: SendDeleteUserEmailAuthenticatorVerificationCodeRequestDto): boolean => {
	// TODO: このリクエストインターフェースは空を許可します
	return true
}

/**
 * ユーザーがメール2FAを削除するリクエストペイロードを確認する
 * @param deleteUserEmailAuthenticatorRequest ユーザーがメール2FAを削除するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkDeleteUserEmailAuthenticatorRequest = (deleteUserEmailAuthenticatorRequest: DeleteUserEmailAuthenticatorRequestDto): boolean => {
	return (
		!!deleteUserEmailAuthenticatorRequest.passwordHash
		&& !!deleteUserEmailAuthenticatorRequest.verificationCode
	)
}

/**
 * 管理者がユーザー情報を編集するリクエストペイロードを確認する
 * @param adminEditUserInfoRequest 管理者がユーザー情報を編集するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkAdminEditUserInfoRequest = (adminEditUserInfoRequest: AdminEditUserInfoRequestDto): boolean => {
	return (
		adminEditUserInfoRequest.uid !== null && adminEditUserInfoRequest.uid !== undefined
		&& !!adminEditUserInfoRequest.userInfo
	)
}

/**
 * UUIDに基づいてユーザーが既に存在するかどうかを確認するリクエストペイロードを確認する
 * @param checkUserExistsByUuidRequest UUIDに基づいてユーザーが既に存在するかどうかを確認するリクエストペイロード
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkCheckUserExistsByUuidRequest = (checkUserExistsByUuidRequest: CheckUserExistsByUuidRequestDto): boolean => {
	return ( !!checkUserExistsByUuidRequest.uuid )
}

/**
 * ソート関連の変数を確認する
 * @param sortBy ソートフィールド
 * @param sortOrder ソート順
 * @returns 検証結果、合法な場合はtrue、不正な場合はfalse
 */
const checkSortVariables = (sortBy: string, sortOrder: string): boolean => {
	const allowedSortFields = ['createDateTime', 'editDateTime', 'username', 'userNickname', 'uid'] // 許可されたソート方法
	if (!allowedSortFields.includes(sortBy)) {
		return false
	}
	if (sortOrder !== 'ascend' && sortOrder !== 'descend') {
		return false
	}
	return true
}
