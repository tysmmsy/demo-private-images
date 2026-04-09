// API endpoint for uploading images to Vercel Blob
import { put } from '@vercel/blob';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	try {
		const token = privateEnv.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

		const blob = await put(`private-demo/${file.name}`, file, {
			access: 'public',
			addRandomSuffix: true,
			token: token
		});

		return json({
			url: blob.url,
			pathname: blob.pathname
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('Upload error:', message, error);
		return json(
			{ error: `Upload failed: ${message}` },
			{ status: 500 }
		);
	}
};
