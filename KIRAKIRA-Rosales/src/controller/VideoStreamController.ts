import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';  
  
/**  
 * MinIOから動画ファイルをストリーミング配信する  
 */  
app.get('/video/stream/:objectKey', async (req: Request, res: Response) => {  
    try {  
        const { objectKey } = req.params;  
        const range = req.headers.range;  
  
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
  
        const command = new GetObjectCommand({  
            Bucket: process.env.MINIO_BUCKET || 'kirakira-videos',  
            Key: objectKey,  
            Range: range,  
        });  
  
        const response = await s3Client.send(command);  
          
        if (response.Body) {  
            res.setHeader('Content-Type', response.ContentType || 'video/mp4');  
            res.setHeader('Accept-Ranges', 'bytes');  
              
            if (range && response.ContentRange) {  
                res.setHeader('Content-Range', response.ContentRange);  
                res.status(206);  
            }  
              
            // ストリームとしてレスポンス  
            const stream = response.Body as NodeJS.ReadableStream;  
            stream.pipe(res);  
        } else {  
            res.status(404).json({ success: false, message: '動画ファイルが見つかりません' });  
        }  
    } catch (error) {  
        console.error('ERROR', '動画ストリーミングエラー', error);  
        res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });  
      
    }  
});  
  
/**  
 * MinIOから画像ファイルを配信する  
 */  
app.get('/image/:objectKey', async (req: Request, res: Response) => {  
    try {  
        const { objectKey } = req.params;  
  
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
  
        const command = new GetObjectCommand({  
            Bucket: process.env.MINIO_BUCKET || 'kirakira-videos',  
            Key: objectKey,  
        });  
  
        const response = await s3Client.send(command);  
          
        if (response.Body) {  
            res.setHeader('Content-Type', response.ContentType || 'image/jpeg');  
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年間キャッシュ  
              
            // ストリームとしてレスポンス  
            const stream = response.Body as NodeJS.ReadableStream;  
            stream.pipe(res);  
        } else {  
            res.status(404).json({ success: false, message: '画像ファイルが見つかりません' });  
        }  
    } catch (error) {  
        console.error('ERROR', '画像配信エラー', error);  
        res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });  
    }  
});