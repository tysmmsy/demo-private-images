// Server-side load function for Supabase Storage private image demo
// Uses Supabase service role to check user status and generate signed URL
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

// Create Supabase client lazily to avoid errors when env vars are not set
function getSupabaseClient() {
	const supabaseUrl = env.SUPABASE_URL;
	const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
	}

	return createClient(supabaseUrl, supabaseServiceKey);
}

export const load: PageServerLoad = async ({ cookies }) => {
	const surveyCompleted = cookies.get('survey_completed_sb') === 'true';

	if (!surveyCompleted) {
		return {
			authorized: false,
			imageUrl: null,
			message: 'Please complete the survey first to view the wallpaper.',
			supabaseConfigured: !!env.SUPABASE_URL
		};
	}

	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		return {
			authorized: true,
			imageUrl: null,
			message:
				'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
			supabaseConfigured: false
		};
	}

	try {
		const supabase = getSupabaseClient();

		// List files in the private-images bucket
		const { data: files, error: listError } = await supabase.storage
			.from('private-images')
			.list('', { limit: 1 });

		if (listError) {
			return {
				authorized: true,
				imageUrl: null,
				message: `Storage error: ${listError.message}. Make sure the "private-images" bucket exists.`,
				supabaseConfigured: true
			};
		}

		if (!files || files.length === 0) {
			return {
				authorized: true,
				imageUrl: null,
				message:
					'No images found in the private-images bucket. Upload an image to Supabase Storage first.',
				supabaseConfigured: true
			};
		}

		// Generate a signed URL (valid for 60 seconds)
		const { data: signedUrlData, error: signError } = await supabase.storage
			.from('private-images')
			.createSignedUrl(files[0].name, 60);

		if (signError) {
			return {
				authorized: true,
				imageUrl: null,
				message: `Signed URL error: ${signError.message}`,
				supabaseConfigured: true
			};
		}

		return {
			authorized: true,
			imageUrl: signedUrlData.signedUrl,
			fileName: files[0].name,
			message: 'Survey completed! Here is your exclusive wallpaper.',
			supabaseConfigured: true
		};
	} catch (error) {
		console.error('Supabase error:', error);
		return {
			authorized: true,
			imageUrl: null,
			message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			supabaseConfigured: true
		};
	}
};
