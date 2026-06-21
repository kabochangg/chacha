# 副業タイプ診断

3分で、今の自分に合う副業の方向性を確認できる静的サイトです。外部AI APIや課金が発生する仕組みは使っていません。

## 起動方法

```powershell
node server.js
```

ブラウザで `http://127.0.0.1:4173` を開きます。

別ポートで起動する場合:

```powershell
$env:PORT=3000
node server.js
```

## 非エンジニア向け：文章を変更する方法

質問、選択肢、診断結果、参考リンクは、すべて `data.js` にあります。

### 質問や選択肢を変更する

`const questions = [` から始まる範囲を編集します。

- `title`：質問文
- `label`：画面に表示する選択肢
- `type`：どの診断タイプに1点を加えるか

`type` は次の4つから選び、文字を変更しないでください。

- `TYPES.BLOG`
- `TYPES.SNS`
- `TYPES.SKILL`
- `TYPES.CONTENT`

質問は同じ形式のまとまりを追加・削除すれば、トップ画面の質問数と進捗表示も自動で変わります。

### 診断結果を変更する

`const results = {` から始まる範囲を編集します。

- `title`：結果名
- `badge`：結果名の横に出る短い英語
- `summary`：結果の説明
- `reasons`：向いている理由
- `cautions`：注意点
- `steps`：最初の行動
- `links`：参考リンク

### 変更しない項目

次の文字を変更すると診断できなくなるため、意図的に種類を増やす場合以外は触らないでください。

- `TYPES` 内の `"blog"`、`"sns"`、`"skill"`、`"content"`
- `tieBreakOrder`
- `data.js` の先頭と末尾にある仕組み部分

入力ミスがある場合は、画面に設定エラーが表示されます。

## ファイル構成

```text
.
├── index.html         # ページの骨組み
├── styles.css         # デザイン、スマートフォン対応
├── data.js            # 質問・選択肢・診断結果（文章更新は主にここ）
├── diagnosis.js       # 採点と診断中の状態管理
├── ui.js              # 画面表示、ボタン、X共有
├── script.js          # 診断を起動する短い処理
├── server.js          # ローカル確認用サーバー
├── diagnosis.test.js  # 診断ロジックの自動テスト
└── server.test.js     # サーバーの自動テスト
```

## エンジニア向け：確認とテスト

構文と自動テストを確認します。

```powershell
node --check data.js
node --check diagnosis.js
node --check ui.js
node --check script.js
node --check server.js
node --test
```

ブラウザでは次も確認してください。

- 未回答では「次へ」が押せない
- 戻ったときに選択内容が残る
- 最終質問で結果が表示される
- 「もう一度診断する」で最初に戻る
- Tabキーと矢印キーだけでも回答できる
- PC幅とスマートフォン幅で表示が崩れない

同点時は `data.js` の `tieBreakOrder` に書かれた順で判定します。
