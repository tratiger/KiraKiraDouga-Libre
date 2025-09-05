import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * MinIOストレージにデータをアップロードするための署名付きURLを生成します
 * @param fileName ファイル名。注意：アップロードするファイルの名前ではなく、MinIOにアップロードされた後のファイル名です
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルトは3600秒
 * @returns MinIO 署名付きURL
 */
export const createMinioUploadPresignedUrl = async (fileName: string, expiresIn: number = 3600): Promise<string | undefined> => {
	const minioEndPoint = process.env.MINIO_ENDPOINT
	const accessKeyId = process.env.MINIO_ACCESS_KEY_ID
	const secretAccessKey = process.env.MINIO_SECRET_ACCESS_KEY
    const bucketName = 'kirakira-strange'

	if (expiresIn <= 0) {
		console.error('ERROR', 'MinIO署名付きURLを作成できません。有効期限は0秒以上である必要があります', { bucketName, fileName, expiresIn })
		return undefined
	}

	if (expiresIn > 604800) {
		console.error('ERROR', 'MinIO署名付きURLを作成できません。有効期限は604800秒（7日間）を超えることはできません', { bucketName, fileName, expiresIn })
		return undefined
	}

	if (!minioEndPoint || !accessKeyId || !secretAccessKey) {
		console.error('ERROR', 'S3(MinIO)ストレージバケットインスタンスを作成できません。必要なパラメータ minioEndPoint, accessKeyId, secretAccessKey が空の可能性があります。', { bucketName, fileName, expiresIn })
		return undefined
	}

	try {
		const Minio = new S3Client({
			endpoint: minioEndPoint,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			region: 'us-east-1', // MinIOでは通常 'us-east-1' を使用します
			forcePathStyle: true, // MinIOにはパス形式のURLが必要です
		})

		if (!Minio) {
			console.error('ERROR', '作成されたMinIOクライアントが空です', { bucketName, fileName, expiresIn })
			return undefined
		}

		try {
			const url = await getSignedUrl(
				Minio,
				new PutObjectCommand({
					Bucket: bucketName,
					Key: fileName,
				}),
				{ expiresIn },
			)

			if (!url) {
				console.error('ERROR', '作成された署名付きURLが空です', { bucketName, fileName, expiresIn })
				Minio.destroy()
				return undefined
			}

			Minio.destroy()
			return url
		} catch (error) {
			console.error('ERROR', '署名付きURLの作成に失敗しました。エラー情報：', error, { bucketName, fileName, expiresIn })
			Minio.destroy()
			return undefined
		}
	} catch (error) {
		console.error('ERROR', 'S3(MinIO)ストレージバケットへの接続または署名付きURLの作成に失敗しました。エラー情報：', error, { bucketName, fileName, expiresIn })
		return undefined
	}
}
