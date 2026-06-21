# 副業タイプ診断

10問の回答から、ブログ・SNS・スキル販売・コンテンツ販売のうち、現在の進め方に近い副業タイプを表示する静的サイトです。Cloudflare Pagesでの公開、成果報酬広告、AdSense申請、問い合わせフォームに対応しています。

選択肢を押すと自動的に次の質問へ進みます。前の質問へ戻ることができ、最終質問だけは回答後に「結果を見る」を押して結果を表示します。

## ローカル確認

```powershell
node server.js
```

`http://127.0.0.1:4173` を開きます。Cloudflare Pages Functionsはこの簡易サーバーでは動作しないため、問い合わせ送信の確認にはWranglerを使用してください。

## 公開前に必ず設定する項目

### `config.js`

- `siteUrl`: 独自ドメインのURL
- `adsensePublisherId`: `ca-pub-` から始まるAdSense ID
- `adsenseResultSlotId`: 承認後に作成する結果末尾用広告枠ID
- `turnstileSiteKey`: Cloudflare Turnstileのサイトキー
- `cloudflareAnalyticsToken`: Cloudflare Web Analyticsのトークン
- `operatorName`: 公開する屋号またはハンドル名

### ドメイン依存ファイル

`robots.txt` と `sitemap.xml` の `YOUR-DOMAIN.example` を独自ドメインへ置き換えます。

### AdSense

AdSenseから示された行を `ads.txt` に設定します。申請時は `adsensePublisherId` のみ設定し、広告枠IDが未設定なら結果画面に空の広告枠は出ません。

### 成果報酬広告

`data.js` の各結果にある `affiliateOffers` を編集します。

- `id`: 計測用の一意なID
- `name`: サービス名
- `description`: 短い特徴
- `cta`: ボタン文言
- `url`: ASPから発行されたHTTPS広告URL
- `network`: `a8` または `moshimo` など
- `enabled`: 提携・掲載可能になったら `true`

`enabled: true` かつHTTPS URLが設定された広告だけが最大3件表示されます。

## Cloudflare Pages設定

Git連携ではビルドコマンドを空欄、出力ディレクトリを `/` とします。環境変数・シークレットには次を設定します。

- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`（任意。Resendで認証済みの送信元）

問い合わせメールはResend APIを利用します。`CONTACT_FROM_EMAIL` が未設定の場合はResendのテスト用送信元を使います。

クリックイベントをCloudflare Analytics Engineへ保存する場合は、`wrangler.toml` のコメントを外して `SITE_EVENTS` を有効化します。未設定でも診断は正常に動作します。

## テスト

```powershell
node --check data.js
node --check diagnosis.js
node --check ui.js
node --check script.js
node --check site-bootstrap.js
node --check contact.js
node --check server.js
node --test
```

## 公開後の確認

- 独自ドメインとHTTPSが有効
- canonical、`robots.txt`、`sitemap.xml` が本番ドメインを参照
- `ads.txt` がブラウザから取得可能
- 4タイプの診断結果が正常
- 承認済みASP広告だけが表示
- AdSense広告は結果末尾だけに表示
- 問い合わせが指定メールへ届く
- フッターから運営者情報、問い合わせ、プライバシーポリシー、免責事項へ移動可能
