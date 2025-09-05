import type { ProviderGetImage } from './types'

export const getImage: ProviderGetImage = (src) => {
	const minioPublicUrl = environment.minioPublicUrl;

	if (!minioPublicUrl) {
		console.error("ERROR: VITE_MINIO_ENDPOINT, VITE_MINIO_PORT, or VITE_MINIO_BUCKET environment variables are not set.");
		// Return a placeholder or a broken image link
		return { url: "/static/images/placeholder.png" };
	}

	const url = `${minioPublicUrl}/${src}`;

	return {
		url,
	};
};
