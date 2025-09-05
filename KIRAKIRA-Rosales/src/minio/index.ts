  
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';  
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';  
  
/**  
 * MinIO S3互換APIで画像アップロード用署名付きURLを作成します  
 * @param fileName ファイル名  
 * @param expiresIn 有効期限（秒）  
 * @returns 署名付きURL  
 */  
export async function createMinIOImageUploadSignedUrl(fileName: string, expiresIn: number = 600): Promise<string | null> {  
    try {  
        // MinIO S3クライアントの設定  
        const s3Client = new S3Client({  
            region: 'us-east-1',  
            endpoint: process.env.MINIO_ENDPOINT,  
            credentials: {  
                accessKeyId: process.env.MINIO_ACCESS_KEY!,  
                secretAccessKey: process.env.MINIO_SECRET_KEY!,  
            },  
            forcePathStyle: true,  
        });  
  
        // 署名付きURL生成  
        const command = new PutObjectCommand({  
            Bucket: process.env.MINIO_BUCKET || 'kirakira-images',  
            Key: fileName,  
            ContentType: 'image/*',  
        });  
  
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });  
        return signedUrl;  
    } catch (error) {  
        console.error('ERROR', 'MinIO署名付きURL生成エラー', error);  
        return null;  
    }  
}