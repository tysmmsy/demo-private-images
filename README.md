# Private Image Access Demo

## 概要

Vercel BlobとSupabase Storageを使った画像プライベートアクセス制御のデモアプリケーション。
アンケート回答状況に応じて、限定画像(壁紙)の表示/非表示を切り替える仕組みを検証する。

2つのパターンを比較検証できる。

- Pattern A: Vercel Blob + サーバーサイド制御
- Pattern B: Supabase Storage + RLS(Row Level Security)

## 技術スタック

- SvelteKit
- TypeScript
- Vercel Blob(Pattern A)
- Supabase Storage(Pattern B)

## セットアップ

### 前提条件

- Node.js 20+
- pnpm
- Vercel CLI (`npm i -g vercel`)
- Vercelアカウント(Blob Store作成済み)
- (Pattern Bのみ) Supabaseプロジェクト

### インストール

```bash
pnpm install
```

### 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の環境変数を設定する。

| 環境変数 | 必須 | 説明 |
|---|---|---|
| BLOB_READ_WRITE_TOKEN | 必須 | Vercel Blobの読み書きトークン(Vercel Dashboard > Storage > Blob > Tokensで発行) |
| SUPABASE_URL | 任意 | SupabaseプロジェクトのURL |
| SUPABASE_SERVICE_ROLE_KEY | 任意 | Supabaseのサービスロールキー |

Pattern Aのみ検証する場合は`BLOB_READ_WRITE_TOKEN`だけで動作する。
Pattern Bも検証する場合は`SUPABASE_URL`と`SUPABASE_SERVICE_ROLE_KEY`が追加で必要になる。

Pattern Bを利用する場合は、Supabase Storageに`private-images`バケット(Public: OFF)を作成し、画像をアップロードしておく。

### ローカル開発

```bash
# Vercelの環境変数をローカルに取得
vercel env pull .env.local

# 開発サーバー起動
pnpm run dev
```

### Vercelへのデプロイ

```bash
vercel deploy --prod
```

環境変数はVercelダッシュボードのEnvironment Variablesから設定する。

## 検証手順

### Pattern A: Vercel Blob + サーバーサイド制御

1. 本番URL(またはローカル開発サーバー)にアクセスし、トップページからPattern Aのページへ遷移する
2. 「画像をアップロード」セクションからデモ用の画像をアップロードする
3. アンケートステータスが「未回答」(赤いバッジ)になっていることを確認し、画像が非表示であることを確認する
4. 「アンケート回答済みにする」ボタンをクリックし、ステータスが「回答済み」(緑のバッジ)に変わり、画像が表示されることを確認する
5. 「リセット」ボタンをクリックし、ステータスが「未回答」に戻り、画像が再び非表示になることを確認する
6. (任意) ブラウザのDevToolsを開き、表示された画像のURLをコピーして別タブで開く。署名付きURLに有効期限が設定されており、期限切れ後はアクセスできないことを確認する

### Pattern B: Supabase Storage + RLS

1. 事前にSupabaseダッシュボードでprivateバケット`private-images`を作成し、画像をアップロードしておく
2. トップページからPattern Bのページへ遷移する
3. アンケートステータスが「未回答」(赤いバッジ)になっていることを確認し、画像が非表示であることを確認する
4. 「アンケート回答済みにする」ボタンをクリックし、ステータスが「回答済み」(緑のバッジ)に変わり、画像が表示されることを確認する
5. 「リセット」ボタンをクリックし、ステータスが「未回答」に戻り、画像が再び非表示になることを確認する
6. (任意) 画像の署名付きURLをコピーし、有効期限(60秒)経過後にアクセスできないことを確認する

## アーキテクチャ

```
src/routes/
  +page.svelte                      # トップページ(ナビゲーション)
  demo/
    blob/
      +page.server.ts               # サーバー: Cookie判定 + Blob署名付きURL生成
      +page.svelte                   # UI: アンケートボタン + 画像表示
    supabase-storage/
      +page.server.ts               # サーバー: Cookie判定 + Supabase署名付きURL生成
      +page.svelte                   # UI: アンケートボタン + 画像表示
  api/
    upload/
      +server.ts                    # API: Vercel Blobへの画像アップロード(private)
```

## セキュリティに関する注意事項

- このデモではアンケート回答状況をCookieで管理しているが、これはデモ用の簡易実装である。本番環境ではサーバーサイドセッションやデータベースによる認証状態の管理を行うこと
- 署名付きURLには有効期限を設定しているが、有効期限内であればURLを知っていれば誰でもアクセスできる点に注意する
- Pattern Bを本番利用する場合は、Supabase AuthとRLSポリシーを組み合わせてユーザー単位のアクセス制御を実装することを推奨する
