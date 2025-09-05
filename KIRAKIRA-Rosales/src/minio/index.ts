import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let minioClient: S3Client | null = null;

/**
 * MinIO S3 クライアントのシングルトンインスタンスを取得します。
 * @returns {S3Client} MinIO S3 クライアントのインスタンス。
 * @throws {Error} MinIO の設定に必要な環境変数が不足している場合にエラーをスローします。
 */
export function getMinioClient(): S3Client {
	if (minioClient) {
		return minioClient;
	}

	const endpoint = process.env.MINIO_ENDPOINT;
	const port = process.env.MINIO_PORT;
	const accessKey = process.env.MINIO_ACCESS_KEY;
	const secretKey = process.env.MINIO_SECRET_KEY;
	const useSsl = process.env.MINIO_USE_SSL === 'true';

	if (!endpoint || !port || !accessKey || !secretKey) {
		throw new Error('MinIO client cannot be initialized. Missing environment variables.');
	}

	const portNumber = parseInt(port, 10);
	if (isNaN(portNumber)) {
		throw new Error('Invalid MINIO_PORT environment variable. Must be a number.');
	}

	minioClient = new S3Client({
		endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${portNumber}`,
		credentials: {
			accessKeyId: accessKey,
			secretAccessKey: secretKey,
		},
		region: 'auto', // MinIOでは 'us-east-1' など任意の値で良いが 'auto' はS3 v3では非推奨の場合がある
		forcePathStyle: true, // MinIOを使用する場合に重要
	});

	return minioClient;
}


/**
 * MinIOストレージにデータをアップロードするための署名付きURLを生成します
 * @param bucketName ターゲットバケット名
 * @param fileName ファイル名
 * @param expiresIn 署名付きURLの有効期限（秒）。デフォルトは3600秒
 * @returns MinIO 署名付きURL
 */
export const createMinioPutSignedUrl = async (bucketName: string, fileName: string, expiresIn: number = 3600): Promise<string | undefined> => {
	if (expiresIn <= 0) {
		console.error('ERROR', 'MinIO署名付きURLを作成できません。有効期限は0秒以上である必要があります', { bucketName, fileName, expiresIn });
		return undefined;
	}

	if (expiresIn > 604800) {
		console.error('ERROR', 'MinIO署名付きURLを作成できません。有効期限は604800秒（7日間）を超えることはできません', { bucketName, fileName, expiresIn });
		return undefined;
	}

	try {
		const client = getMinioClient();

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileName,
		});

		const url = await getSignedUrl(client, command, { expiresIn });

		if (!url) {
			console.error('ERROR', '作成された署名付きURLが空です', { bucketName, fileName, expiresIn });
			return undefined;
		}

		return url;
	} catch (error) {
		console.error('ERROR', 'S3(MinIO)ストレージバケットへの接続または署名付きURLの作成に失敗しました。エラー情報：', error, { bucketName, fileName, expiresIn });
		return undefined;
	}
}

export const startMultipartUpload = async (bucketName: string, fileName: string) => {
	try {
		const client = getMinioClient();
		const command = new CreateMultipartUploadCommand({
			Bucket: bucketName,
			Key: fileName,
		});
		const response = await client.send(command);
		return response.UploadId;
	} catch (error) {
		console.error('ERROR', 'Multipart-uploadの開始に失敗しました。', error);
		return undefined;
	}
};

export const getMultipartUploadPartSignedUrl = async (bucketName: string, fileName: string, partNumber: number, uploadId: string, expiresIn: number = 3600) => {
	try {
		const client = getMinioClient();
		const command = new UploadPartCommand({
			Bucket: bucketName,
			Key: fileName,
			PartNumber: partNumber,
			UploadId: uploadId,
		});
		const url = await getSignedUrl(client, command, { expiresIn });
		return url;
	} catch (error) {
		console.error('ERROR', 'Multipart-uploadのパート署名付きURLの作成に失敗しました。', error);
		return undefined;
	}
};

export const completeMultipartUpload = async (bucketName: string, fileName: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) => {
	try {
		const client = getMinioClient();
		const command = new CompleteMultipartUploadCommand({
			Bucket: bucketName,
			Key: fileName,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts,
			},
		});
		const response = await client.send(command);
		return response;
	} catch (error) {
		console.error('ERROR', 'Multipart-uploadの完了に失敗しました。', error);
		return undefined;
	}
};

export const abortMultipartUpload = async (bucketName: string, fileName: string, uploadId: string) => {
	try {
		const client = getMinioClient();
		const command = new AbortMultipartUploadCommand({
			Bucket: bucketName,
			Key: fileName,
			UploadId: uploadId,
		});
		const response = await client.send(command);
		return response;
	} catch (error) {
		console.error('ERROR', 'Multipart-uploadの中止に失敗しました。', error);
		return undefined;
	}
};
