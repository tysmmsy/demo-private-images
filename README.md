# 画像プライベートアクセスデモアプリケーション

Vercel BlobとSupabase Storageを使った画像プライベートアクセス制御のデモアプリケーションです。
アンケート回答状況に応じて、限定画像(壁紙)の表示/非表示を切り替える仕組みを検証できます。

## 概要

2つのパターンを比較検証できます。

- Pattern A: Vercel Blob + サーバーサイド制御
- Pattern B: Supabase Storage + RLS(Row Level Security)

## 技術スタック

- SvelteKit
- TypeScript
- Vercel Blob (Pattern A)
- Supabase Storage (Pattern B)

## ファイル構成と変更箇所

```
src/
  routes/
    +page.svelte                         # トップページ（ナビゲーション）
    demo/
      blob/
        +page.server.ts                  # Pattern A: Cookie判定 + Blob URL返却（新規追加）
        +page.svelte                     # Pattern A: アンケートUI + 画像表示（新規追加）
      supabase-storage/
        +page.server.ts                  # Pattern B: Cookie判定 + 署名付きURL生成（新規追加）
        +page.svelte                     # Pattern B: アンケートUI + 画像表示（新規追加）
    api/
      upload/
        +server.ts                       # 画像アップロードAPI（新規追加）
package.json                             # @vercel/blob, @supabase/supabase-js 追加（変更）
```

## 実装の解説

### Pattern A: Vercel Blob + サーバーサイド制御

アップロードAPI (src/routes/api/upload/+server.ts):

```typescript
import { put } from '@vercel/blob';
import { env as privateEnv } from '$env/dynamic/private';

const blob = await put(`private-demo/${file.name}`, file, {
  access: 'public',
  addRandomSuffix: true,  // URLを推測不能にする
  token: privateEnv.BLOB_READ_WRITE_TOKEN
});
```

サーバーサイドでのアクセス制御 (src/routes/demo/blob/+page.server.ts):

```typescript
import { list } from '@vercel/blob';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies }) => {
  // Cookieでアンケート回答状況を判定
  const surveyCompleted = cookies.get('survey_completed') === 'true';

  if (!surveyCompleted) {
    return { authorized: false, imageUrl: null };
  }

  // 回答済みの場合のみBlob URLを返す
  const { blobs } = await list({
    prefix: 'private-demo/',
    token: env.BLOB_READ_WRITE_TOKEN
  });
  return { authorized: true, imageUrl: blobs[0]?.url ?? null };
};
```

SvelteKitでの注意点: `@vercel/blob`は通常`process.env.BLOB_READ_WRITE_TOKEN`を自動参照しますが、SvelteKit + Vercel Adapterの組み合わせではこの自動参照が動作しません。`$env/dynamic/private`経由でトークンを取得し、`token`オプションに明示的に渡す必要があります。

### Pattern B: Supabase Storage + 署名付きURL

サーバーサイドでのアクセス制御 (src/routes/demo/supabase-storage/+page.server.ts):

```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 回答済みの場合のみ署名付きURLを生成（有効期限60秒）
const { data } = await supabase.storage
  .from('private-images')
  .createSignedUrl(files[0].name, 60);
```

## セットアップ

### 前提条件

- Node.js (LTS版)
- pnpm
- Vercel CLI
- Vercelアカウント(Blob Store作成済み)
- (Pattern Bのみ) Supabaseプロジェクト

### インストール

```bash
pnpm install
```

### ローカル開発

```bash
vercel env pull .env.local
pnpm dev
```

### Vercelへのデプロイ

```bash
vercel deploy --prod
```

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| BLOB_READ_WRITE_TOKEN | Pattern Aで必須 | Vercel Blobの読み書きトークン。Vercel Dashboard > Storage > Blob > プロジェクトに接続で自動設定 |
| SUPABASE_URL | Pattern Bで必須 | SupabaseプロジェクトのURL |
| SUPABASE_SERVICE_ROLE_KEY | Pattern Bで必須 | Supabaseのサービスロールキー |

Pattern Aのみ検証する場合はBLOB_READ_WRITE_TOKENだけで動作します。

### Blob Storeの作成手順

1. Vercel Dashboard > Storageに移動します
2. 「Create」> 「Blob」を選択します
3. ストア名を入力し作成します
4. 作成したストアをプロジェクトに接続します(BLOB_READ_WRITE_TOKENが自動設定されます)

## 検証手順

### Pattern A: Vercel Blob + サーバーサイド制御

1. 本番URLにアクセスし、トップページからPattern Aのページへ遷移します
2. 「画像をアップロード」セクションからデモ用の画像をアップロードします
3. アンケートステータスが「未回答」(赤いバッジ)になっていることを確認し、画像が非表示であることを確認します
4. 「アンケート回答済みにする」ボタンをクリックし、ステータスが「回答済み」(緑のバッジ)に変わり、画像が表示されることを確認します
5. 「リセット」ボタンをクリックし、ステータスが「未回答」に戻り、画像が再び非表示になることを確認します
6. (任意) ブラウザのDevToolsを開き、画像のURLをコピーして別タブで開きます。URLにランダムサフィックスが含まれており、推測不能であることを確認します

### Pattern B: Supabase Storage + RLS

1. 事前にSupabaseダッシュボードでprivateバケット `private-images` を作成し、画像をアップロードしておきます
2. トップページからPattern Bのページへ遷移します
3. アンケートステータスが「未回答」であることを確認し、画像が非表示であることを確認します
4. 「アンケート回答済みにする」ボタンをクリックし、画像が表示されることを確認します
5. 「リセット」ボタンをクリックし、画像が再び非表示になることを確認します
6. (任意) 画像の署名付きURLをコピーし、有効期限(60秒)経過後にアクセスできないことを確認します

## セキュリティに関する注意事項

- このデモではアンケート回答状況をCookieで管理していますが、これはデモ用の簡易実装です。本番環境ではサーバーサイドセッションやデータベースによる認証状態の管理を行ってください
- 署名付きURLには有効期限を設定していますが、有効期限内であればURLを知っていれば誰でもアクセスできる点に注意してください
- Pattern Bを本番利用する場合は、Supabase AuthとRLSポリシーを組み合わせてユーザー単位のアクセス制御を実装することを推奨します
- SUPABASE_SERVICE_ROLE_KEYはRLSをバイパスするキーです。サーバーサイドでのみ使用し、クライアントに露出させないでください
