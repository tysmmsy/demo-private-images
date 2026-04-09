<!-- Vercel Blob pattern: private image with server-side access control -->
<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let uploading = $state(false);
	let uploadMessage = $state('');

	async function completeSurvey() {
		// Set cookie via API to simulate survey completion
		document.cookie = 'survey_completed=true; path=/; max-age=3600';
		// Reload to trigger server-side check
		window.location.reload();
	}

	async function resetSurvey() {
		document.cookie = 'survey_completed=; path=/; max-age=0';
		window.location.reload();
	}

	async function uploadImage(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		uploading = true;
		uploadMessage = '';

		const formData = new FormData();
		formData.append('file', input.files[0]);

		try {
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});
			const result = await response.json();
			if (response.ok) {
				uploadMessage = `アップロード完了: ${result.pathname}`;
				window.location.reload();
			} else {
				uploadMessage = `エラー: ${result.error}`;
			}
		} catch (e) {
			uploadMessage = `アップロード失敗: ${e}`;
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Pattern A: Vercel Blob</title>
</svelte:head>

<main>
	<a href="/">&larr; トップに戻る</a>
	<h1>Pattern A: Vercel Blob + サーバーサイド制御</h1>
	<p>Vercel Blobにプライベートモードで画像を保存し、サーバーサイドで条件判定。<br>
	条件を満たす場合のみ署名付きURLを生成して画像を表示します。</p>

	<section class="status">
		<h2>アンケートステータス</h2>
		{#if data.authorized}
			<p class="badge authorized">回答済み</p>
			<button onclick={resetSurvey}>リセット</button>
		{:else}
			<p class="badge not-authorized">未回答</p>
			<button onclick={completeSurvey}>アンケート回答済みにする</button>
		{/if}
	</section>

	<section class="image-area">
		<h2>限定壁紙</h2>
		<p>{data.message}</p>
		{#if data.imageUrl}
			<div class="image-container">
				<img src={data.imageUrl} alt="限定壁紙" />
			</div>
			<p class="note">このURLは有効期限付きの署名付きURLです。BlobのURLに直接アクセスすることはできません。</p>
		{:else if !data.authorized}
			<div class="placeholder">
				<p>アンケート未回答のため、画像は非表示です。</p>
			</div>
		{/if}
	</section>

	<section class="upload">
		<h2>画像をアップロード</h2>
		<p>Vercel Blob(プライベートモード)に画像をアップロード:</p>
		<input type="file" accept="image/*" onchange={uploadImage} disabled={uploading} />
		{#if uploading}
			<p>アップロード中...</p>
		{/if}
		{#if uploadMessage}
			<p>{uploadMessage}</p>
		{/if}
	</section>

	<section class="explanation">
		<h2>仕組み</h2>
		<ol>
			<li>画像は<code>access: 'private'</code>でVercel Blobにアップロードされる</li>
			<li>サーバーのload関数(<code>+page.server.ts</code>)がアンケート回答済みCookieを確認する</li>
			<li>認可されている場合、<code>getDownloadUrl()</code>で署名付きダウンロードURLを生成する</li>
			<li>署名付きURLには有効期限があり、推測することはできない</li>
			<li>BlobのURLに直接アクセスすると403 Forbiddenが返される</li>
		</ol>
	</section>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
	section { margin: 2rem 0; }
	.badge {
		display: inline-block;
		padding: 0.3rem 0.8rem;
		border-radius: 4px;
		font-weight: bold;
	}
	.authorized { background: #d4edda; color: #155724; }
	.not-authorized { background: #f8d7da; color: #721c24; }
	button {
		margin-left: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid #333;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
	}
	button:hover { background: #f0f0f0; }
	.image-container {
		border: 2px solid #0070f3;
		border-radius: 8px;
		overflow: hidden;
		max-width: 600px;
	}
	.image-container img { width: 100%; display: block; }
	.placeholder {
		border: 2px dashed #ccc;
		border-radius: 8px;
		padding: 3rem;
		text-align: center;
		color: #999;
	}
	.note { font-size: 0.85rem; color: #666; font-style: italic; }
	code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
	.upload { background: #f9f9f9; padding: 1rem; border-radius: 8px; }
	a { color: #0070f3; text-decoration: none; }
	a:hover { text-decoration: underline; }
</style>
