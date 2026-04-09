<!-- Top page: navigation to each demo pattern -->
<svelte:head>
	<title>画像プライベートアクセス デモ</title>
</svelte:head>

<main>
	<h1>画像プライベートアクセス デモ</h1>
	<p>Vercel Blob / Supabase Storageを使った画像プライベートアクセス制御のデモアプリケーション</p>

	<nav>
		<h2>デモパターン</h2>
		<ul>
			<li>
				<a href="/demo/blob">Pattern A: Vercel Blob + サーバーサイド制御</a>
				<p>Vercel Blobにプライベートモードで画像を保存し、サーバーサイドで条件判定して署名付きURLを返すパターン</p>
			</li>
			<li>
				<a href="/demo/supabase-storage">Pattern B: Supabase Storage + RLS</a>
				<p>Supabase Storageにプライベートバケットで画像を保存し、RLSポリシーでアクセス制御するパターン</p>
			</li>
		</ul>
	</nav>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	h1 {
		border-bottom: 2px solid #333;
		padding-bottom: 0.5rem;
	}
	nav ul {
		list-style: none;
		padding: 0;
	}
	nav li {
		margin: 1.5rem 0;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	nav li:hover {
		border-color: #666;
	}
	nav a {
		font-size: 1.2rem;
		font-weight: bold;
		color: #0070f3;
		text-decoration: none;
	}
	nav a:hover {
		text-decoration: underline;
	}
	nav p {
		margin: 0.5rem 0 0;
		color: #666;
		font-size: 0.9rem;
	}
</style>
