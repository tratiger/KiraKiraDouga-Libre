export interface CreateVideoUploadSessionResponseDto {  
    success: boolean;  
    message: string;  
    uploadId?: string;  
    objectKey?: string;  
    bucketName?: string;  
}  
  
export interface GetVideoCoverUploadSignedUrlResponseDto {  
    success: boolean;  
    message: string;  
    result?: {  
        signedUrl: string;  
        fileName: string;  
    };  
}