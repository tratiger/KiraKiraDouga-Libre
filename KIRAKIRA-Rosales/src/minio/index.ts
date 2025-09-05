import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3クライアントの初期化
const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
const useSsl = process.env.MINIO_USE_SSL === 'true';

const s3Client = new S3Client({
	endpoint: `${useSsl ? 'https' : 'http'}://${minioEndpoint}:${minioPort}`,
	region: 'us-east-1', // MinIOではリージョンは任意ですが、SDKでは必須です
	credentials: {
		accessKeyId: process.env.MINIO_ACCESS_KEY || '',
		secretAccessKey: process.env.MINIO_SECRET_KEY || '',
	},
	forcePathStyle: true, // MinIOにはパススタイルアクセスが必要です
});

/**
 * MinIOへのオブジェクトアップロード用の署名付きURLを生成します。
 * @param bucketName ターゲットバケット名
 * @param objectKey MinIOに保存されるオブジェクトのキー（ファイル名）
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルトは600秒（10分）。
 * @returns 署名付きURL
 */
export const createMinioPutSignedUrl = async (bucketName: string, objectKey: string, expiresIn: number = 600): Promise<string | undefined> => {
	try {
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: objectKey,
		});
		const url = await getSignedUrl(s3Client, command, { expiresIn });
		return url;
	} catch (error) {
		console.error('ERROR', 'MinIOの署名付きURL(PutObject)の作成に失敗しました。', { error, bucketName, objectKey });
		return undefined;
	}
};

/**
 * MinIOでマルチパートアップロードを開始します。
 * @param bucketName ターゲットバケット名
 * @param objectKey MinIOに保存されるオブジェクトのキー（ファイル名）
 * @returns UploadId
 */
export const createMinioMultipartUpload = async (bucketName: string, objectKey: string): Promise<string | undefined> => {
	try {
		const command = new CreateMultipartUploadCommand({
			Bucket: bucketName,
			Key: objectKey,
		});
		const response = await s3Client.send(command);
		return response.UploadId;
	} catch (error) {
		console.error('ERROR', 'MinIOのマルチパートアップロードの開始に失敗しました。', { error, bucketName, objectKey });
		return undefined;
	}
};

/**
 * MinIOのマルチパートアップロードの各パート用の署名付きURLを生成します。
 * @param bucketName ターゲットバケット名
 * @param objectKey オブジェクトのキー
 * @param uploadId マルチパートアップロードのID
 * @param partNumber パート番号
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルトは600秒（10分）。
 * @returns 署名付きURL
 */
export const getMinioMultipartSignedUrl = async (bucketName: string, objectKey: string, uploadId: string, partNumber: number, expiresIn: number = 600): Promise<string | undefined> => {
	try {
		const command = new UploadPartCommand({
			Bucket: bucketName,
			Key: objectKey,
			UploadId: uploadId,
			PartNumber: partNumber,
		});
		const url = await getSignedUrl(s3Client, command, { expiresIn });
		return url;
	} catch (error) {
		console.error('ERROR', 'MinIOのマルチパート署名付きURLの作成に失敗しました。', { error, bucketName, objectKey, uploadId, partNumber });
		return undefined;
	}
};

/**
 * MinIOのマルチパートアップロードを完了します。
 * @param bucketName ターゲットバケット名
 * @param objectKey オブジェクトのキー
 * @param uploadId マルチパートアップロードのID
 * @param parts アップロードされたパートの情報（PartNumberとETag）
 * @returns 成功した場合はtrue、失敗した場合はfalse
 */
export const completeMinioMultipartUpload = async (bucketName: string, objectKey: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<boolean> => {
	try {
		const command = new CompleteMultipartUploadCommand({
			Bucket: bucketName,
			Key: objectKey,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts,
			},
		});
		await s3Client.send(command);
		return true;
	} catch (error) {
		console.error('ERROR', 'MinIOのマルチパートアップロードの完了に失敗しました。', { error, bucketName, objectKey, uploadId });
		return false;
	}
};

/**
 * MinIOのマルチパートアップロードを中断します。
 * @param bucketName ターゲットバケット名
 * @param objectKey オブジェクトのキー
 * @param uploadId マルチパートアップロードのID
 * @returns 成功した場合はtrue、失敗した場合はfalse
 */
export const abortMinioMultipartUpload = async (bucketName: string, objectKey: string, uploadId: string): Promise<boolean> => {
	try {
		const command = new AbortMultipartUploadCommand({
			Bucket: bucketName,
			Key: objectKey,
			UploadId: uploadId,
		});
		await s3Client.send(command);
		return true;
	} catch (error) {
		console.error('ERROR', 'MinIOのマルチパートアップロードの中断に失敗しました。', { error, bucketName, objectKey, uploadId });
		return false;
	}
};
