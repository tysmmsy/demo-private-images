<!-- Supabase Storage pattern: private image with RLS / signed URL -->
<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function completeSurvey() {
		document.cookie = 'survey_completed_sb=true; path=/; max-age=3600';
		window.location.reload();
	}

	function resetSurvey() {
		document.cookie = 'survey_completed_sb=; path=/; max-age=0';
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Pattern B: Supabase Storage</title>
</svelte:head>

<main>
	<a href="/">&larr; トップに戻る</a>
	<h1>Pattern B: Supabase Storage + RLS</h1>
	<p>Supabase Storageにプライベートバケットで画像を保存し、サーバーサイドで条件判定。<br>
	条件を満たす場合のみ署名付きURLを生成して画像を表示します。</p>

	{#if !data.supabaseConfigured}
		<section class="warning">
			<h2>セットアップが必要です</h2>
			<p>Supabaseの環境変数が設定されていません。以下を設定してください:</p>
			<ul>
				<li><code>SUPABASE_URL</code></li>
				<li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
			</ul>
			<p>また、Supabase Storageにプライベートバケット<code>private-images</code>を作成してください。</p>
		</section>
	{/if}

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
			<p class="note">このURLは有効期限付きの署名付きURL(60秒)です。Supabase StorageへのRLSによる直接アクセスはブロックされます。</p>
		{:else if !data.authorized}
			<div class="placeholder">
				<p>アンケート未回答のため、画像は非表示です。</p>
			</div>
		{/if}
	</section>

	<section class="explanation">
		<h2>仕組み</h2>
		<ol>
			<li>画像はSupabase Storageのプライベートバケット(<code>private-images</code>)に保存される</li>
			<li>サーバーのload関数(<code>+page.server.ts</code>)がアンケート回答済みCookieを確認する</li>
			<li>認可されている場合、<code>createSignedUrl()</code>で署名付きURL(有効期限60秒)を生成する</li>
			<li>バケットのRLSポリシーにより、認可されたアクセスのみ許可される</li>
			<li>StorageのURLに直接アクセスすると400/403が返される</li>
		</ol>

		<h3>Supabase Storageのセットアップ</h3>
		<ol>
			<li>Supabaseダッシュボード &rarr; Storage &rarr; New Bucket</li>
			<li>バケット名: <code>private-images</code>、Public: OFF</li>
			<li>バケットに画像をアップロード</li>
			<li>RLSポリシーの例(任意、クライアントサイドアクセス用):</li>
		</ol>
		<pre><code>{`-- Allow read access only if user has completed survey
CREATE POLICY "Allow authenticated read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'private-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND survey_completed = true
    )
  );`}</code></pre>
	</section>

	<section class="comparison">
		<h2>Pattern A vs Pattern B 比較</h2>
		<table>
			<thead>
				<tr>
					<th>観点</th>
					<th>Vercel Blob</th>
					<th>Supabase Storage</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>セットアップ</td>
					<td>簡単(Blobトークンのみ)</td>
					<td>やや複雑(Supabaseプロジェクト + バケット)</td>
				</tr>
				<tr>
					<td>アクセス制御</td>
					<td>サーバーサイドのみ</td>
					<td>サーバーサイド + クライアントサイドRLS</td>
				</tr>
				<tr>
					<td>署名付きURL</td>
					<td>自動生成、有効期限設定可</td>
					<td>有効期限設定可(秒単位)</td>
				</tr>
				<tr>
					<td>ユーザー認証</td>
					<td>不要(Cookie/セッションベース)</td>
					<td>任意(RLS用にSupabase Auth)</td>
				</tr>
				<tr>
					<td>ユースケース</td>
					<td>シンプルな配布(壁紙、アセット)</td>
					<td>ユーザー単位のアクセス制御</td>
				</tr>
				<tr>
					<td>コスト</td>
					<td>Vercel Blob料金</td>
					<td>Supabase Storage料金(無料枠あり)</td>
				</tr>
			</tbody>
		</table>
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
	.warning {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 8px;
		padding: 1rem;
	}
	code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
	pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
	pre code { background: none; padding: 0; }
	table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
	th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
	th { background: #f4f4f4; }
	a { color: #0070f3; text-decoration: none; }
	a:hover { text-decoration: underline; }
</style>
