# DJLuciko

Discord認証付きのAmazon IVSストリーム配信視聴サイト

## 概要

特定のDiscordサーバーのメンバー、または特定のロールを持つユーザーのみがライブ配信を視聴できる限定配信プラットフォームです。

## 機能

- Discord OAuth2認証
- サーバーメンバーシップによるアクセス制御
- 特定ロールによるアクセス制御
- Amazon IVSによるライブストリーミング再生
- アクセスログ記録

## 必要環境

- Node.js
- npm
- forever（本番環境でのプロセス管理用）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、各値を設定します。

```bash
cp .env.example .env
```

| 環境変数 | 説明 |
|---------|------|
| `SESSION_SECRET` | セッション暗号化キー（下記コマンドで生成） |
| `DISCORD_CLIENT_ID` | Discord Developer PortalのClient ID |
| `DISCORD_CLIENT_SECRET` | Discord Developer PortalのClient Secret |
| `DISCORD_CALLBACK_URL` | OAuth2コールバックURL |
| `SITE_DOMAIN` | サイトのドメイン名 |
| `ALLOWED_GUILD_IDS` | 許可するDiscordサーバーID（カンマ区切り） |
| `ALLOWED_ROLES_IN_GUILDS` | 許可するロール（`guildId:roleId`形式、カンマ区切り） |
| `IVS_STREAM_URL` | Amazon IVSの再生URL（.m3u8） |

**SESSION_SECRETの生成:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Discord Applicationの設定

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリケーションを作成
2. OAuth2 → General でRedirectsに`DISCORD_CALLBACK_URL`を追加
3. Bot設定でSCOPESに`identify`, `guilds`, `guilds.members.read`を設定

## Amazon IVS配信設定

### Step 1: AWSコンソールでの設定

1. [Amazon IVSコンソール](https://console.aws.amazon.com/ivs/)にアクセス
2. リージョンを`ap-northeast-1`（東京）に設定
3. 「チャンネルを作成」または既存チャンネルを選択
4. 以下の情報をメモ:

| 項目 | 用途 |
|-----|------|
| **Ingest server** | OBSの「サーバー」に設定 |
| **Stream key** | OBSの「ストリームキー」に設定（機密情報） |
| **Playback URL** | `.env`の`IVS_STREAM_URL`に設定 |

### Step 2: 環境変数の更新

`.env`ファイルの`IVS_STREAM_URL`をAWSコンソールのPlayback URLに更新:

```
IVS_STREAM_URL=https://xxxxx.ap-northeast-1.playback.live-video.net/api/video/v1/ap-northeast-1.xxxxxxxxx.channel.xxxxxxxx.m3u8
```

### Step 3: OBSの設定

1. OBSを起動し「設定」→「配信」を開く
2. 以下を設定:

| 項目 | 設定値 |
|-----|-------|
| サービス | `カスタム...` |
| サーバー | AWSコンソールの **Ingest server** |
| ストリームキー | AWSコンソールの **Stream key** |

3. 「設定」→「出力」で配信品質を設定:

| 項目 | 推奨値 |
|-----|-------|
| 出力モード | 詳細 |
| エンコーダ | x264 または ハードウェア |
| ビットレート | 2500〜6000 Kbps |
| キーフレーム間隔 | 2秒 |

> Amazon IVSの最大ビットレートは8500 Kbpsです

### Step 4: 配信開始

1. OBSで「配信開始」をクリック
2. AWSコンソールでチャンネル状態が「Live」になることを確認
3. 視聴サイトで映像が表示されることを確認

## 起動・停止

### 開発環境

```bash
npm start
```

サーバーは http://localhost:3000 で起動します。

### 本番環境

foreverを使用したプロセス管理:

```bash
# 起動（または再起動）
./dj_start.sh

# 停止
./dj_stop.sh
```

> 本番環境では`dj_start.sh`内の`DJ_PATH`を適切なパスに変更してください

## ログ

アクセスログは`user.log`に出力されます。

```
日時,IPアドレス,Discordユーザー名,メンバー判定結果
```

## ディレクトリ構成

```
.
├── app.js              # メインアプリケーション
├── package.json        # 依存関係
├── .env                # 環境変数（要作成）
├── .env.example        # 環境変数テンプレート
├── dj_start.sh         # 起動スクリプト
├── dj_stop.sh          # 停止スクリプト
├── views/
│   └── index.ejs       # メインページテンプレート
├── public/
│   └── styles.css      # スタイルシート
└── user.log            # アクセスログ（自動生成）
```

## ライセンス

Private
