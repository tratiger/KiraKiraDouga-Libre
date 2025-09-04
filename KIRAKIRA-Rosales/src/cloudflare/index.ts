import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCloudflareRFC3339ExpiryDateTime } from '../common/GetCloudflareRFC3339ExpiryDateTime.js'

/**
 * Cloudflare R2 ストレージにデータをアップロードするための署名付きURLを生成します
 * @param bucketName ターゲットバケット名
 * @param fileName ファイル名。注意：アップロードするファイルの名前ではなく、Cloudflare R2にアップロードされた後のファイル名です
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルトは3600秒
 * @returns Cloudflare R2 署名付きURL
 */
export const createCloudflareR2PutSignedUrl = async (bucketName: string, fileName: string, expiresIn: number = 3600): Promise<string | undefined> => {
	const r2EndPoint = process.env.CF_R2_END_POINT
	const accessKeyId = process.env.CF_ACCESS_KEY_ID
	const secretAccessKey = process.env.CF_SECRET_ACCESS_KEY

	if (expiresIn <= 0) {
		console.error('ERROR', 'R2署名付きURLを作成できません。有効期限は0秒以上である必要があります', { bucketName, fileName, expiresIn })
		return undefined
	}

	if (expiresIn > 604800) {
		console.error('ERROR', 'R2署名付きURLを作成できません。有効期限は604800秒（7日間）を超えることはできません', { bucketName, fileName, expiresIn })
		return undefined
	}

	if (!r2EndPoint && !accessKeyId && !secretAccessKey) {
		console.error('ERROR', 'S3(R2)ストレージバケットインスタンスを作成できません。必要なパラメータ r2EndPoint, accessKeyId, secretAccessKey が空の可能性があります。', { bucketName, fileName, expiresIn })
		return undefined
	}

	try {
		const R2 = new S3Client({
			endpoint: r2EndPoint,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			region: 'auto',
		})

		if (!R2) {
			console.error('ERROR', '作成されたR2クライアントが空です', { bucketName, fileName, expiresIn })
			return undefined
		}

		try {
			const url = await getSignedUrl(
				R2,
				new PutObjectCommand({
					Bucket: bucketName,
					Key: fileName,
				}),
				{ expiresIn },
			)

			if (!url) {
				console.error('ERROR', '作成された署名付きURLが空です', { bucketName, fileName, expiresIn })
				R2.destroy()
				return undefined
			}

			R2.destroy()
			return url
		} catch (error) {
			console.error('ERROR', '署名付きURLの作成に失敗しました。エラー情報：', error, { bucketName, fileName, expiresIn })
			R2.destroy()
			return undefined
		}
	} catch (error) {
		console.error('ERROR', 'S3(R2)ストレージバケットへの接続または署名付きURLの作成に失敗しました。エラー情報：', error, { bucketName, fileName, expiresIn })
		return undefined
	}
}

/**
 * Cloudflare Imagesに画像をアップロードするための署名付きURLを生成します
 * @param fileName 画像名。注意：アップロードするファイルの名前ではなく、R2にアップロードされた後の名前です。ファイル拡張子は不要で、URLフレンドリーなファイル名を推奨します
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルト660秒（11分）、最小600秒（10分）、最大21600秒（360分、6時間）
 * @param metaData 画像メタデータ
 * @returns Cloudflare Imagesへの画像アップロードに使用できる署名付きURL
 */
export const createCloudflareImageUploadSignedUrl = async (fileName?: string, expiresIn: number = 660, metaData?: Record<string, string>): Promise<string | undefined> => {
	try {
		const imagesEndpointUrl = process.env.CF_IMAGES_ENDPOINT_URL
		const imagesToken = process.env.CF_IMAGES_TOKEN

		if (expiresIn < 600) {
			console.error('ERROR', 'Cloudflare Imagesの署名付きURLを作成できません。有効期限は120秒（2分）以上である必要があります', { fileName, expiresIn, metaData })
			return undefined
		}

		if (expiresIn > 21600) {
			console.error('ERROR', 'Cloudflare Imagesの署名付きURLを作成できません。有効期限は21600秒（360分、6時間）を超えることはできません', { fileName, expiresIn, metaData })
			return undefined
		}

		if (!imagesEndpointUrl && !imagesToken) {
			console.error('ERROR', 'Cloudflare Imagesの署名付きURLを作成できません：imagesEndpointUrlまたはimagesTokenが空の可能性があります。環境変数（CF_IMAGES_ENDPOINT_URL, CF_IMAGES_TOKEN）を確認してください', { fileName, expiresIn, metaData })
			return undefined
		}

		const formData = new FormData();
		formData.append('expiry', getCloudflareRFC3339ExpiryDateTime(expiresIn)); // 生成される日付形式：2024-03-17T13:47:28Z
		if (fileName) formData.append('id', fileName);
		if (metaData) formData.append('metaData', JSON.stringify(metaData));

		try {
			const imageUploadSignedUrlResponse = await fetch(imagesEndpointUrl, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${imagesToken}`,
				},
			})
			if (!imageUploadSignedUrlResponse.ok) {
				console.error('ERROR', `Cloudflare Imagesの署名付きURLを作成できませんでした。HTTPエラー！ステータス: ${imageUploadSignedUrlResponse.status}`)
				return undefined
			}

			const imageUploadSignedUrlResult = await imageUploadSignedUrlResponse.json()
			
			const imageUploadSignedUrl = imageUploadSignedUrlResult?.result?.uploadURL
			if (imageUploadSignedUrlResult.success && imageUploadSignedUrl) {
				return imageUploadSignedUrl
			} else {
				console.error('ERROR', 'Cloudflare Imagesの署名付きURLを作成できません：URLの作成に失敗しました！', { fileName, expiresIn, metaData })
				return undefined
			}
		} catch (error) {
			console.error('ERROR', 'Cloudflare Imagesの署名付きURLを作成できません：ネットワークリクエストに失敗しました！', { error, errorDetail: error?.response?.data?.errors }, { fileName, expiresIn, metaData })
			return undefined
		}
	} catch (error) {
		console.error('ERROR', 'Cloudflare Imagesアップロード署名付きURLの作成に失敗しました：', error)
	}
}
