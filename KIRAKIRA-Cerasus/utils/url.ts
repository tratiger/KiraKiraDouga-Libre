/**
 * Generates a public URL for a video stored in MinIO.
 * @param key - The object key of the video in MinIO.
 * @returns The public URL to the video.
 */
export function getMinioVideoUrl(key: string): string {
	const minioPublicUrl = environment.minioPublicUrl;
	if (key && minioPublicUrl) {
		return `${minioPublicUrl}/${key}`;
	} else {
		useToast(t.toast.video_manifest_file_generate_failed, "error");
		console.error("ERROR", "Failed to generate video URL. Missing key or MinIO public URL.");
		return "";
	}
}
