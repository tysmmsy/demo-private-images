// Server-side load function for Vercel Blob private image demo
// Checks survey completion cookie and returns blob URL only if authorized
import { list } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const surveyCompleted = cookies.get('survey_completed') === 'true';

	if (!surveyCompleted) {
		return {
			authorized: false,
			imageUrl: null,
			message: 'Please complete the survey first to view the wallpaper.'
		};
	}

	try {
		// List blobs to find the demo image
		const { blobs } = await list({ prefix: 'private-demo/', token: env.BLOB_READ_WRITE_TOKEN });

		if (blobs.length === 0) {
			return {
				authorized: true,
				imageUrl: null,
				message: 'No images uploaded yet. Please upload an image first using the upload form below.'
			};
		}

		// Return the blob URL only to authorized users
		// The URL contains a random suffix (addRandomSuffix: true) so it cannot be guessed
		const blob = blobs[0];

		return {
			authorized: true,
			imageUrl: blob.url,
			blobName: blob.pathname,
			message: 'Survey completed! Here is your exclusive wallpaper.'
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('Blob access error:', message);
		return {
			authorized: true,
			imageUrl: null,
			message: `Error accessing image storage: ${message}`
		};
	}
};
