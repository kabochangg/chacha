# アセット一覧

## 方針

この一覧は、v1公開版に向けたグラフィック制作対象を `ASSET_KEYS` 単位で整理したものです。

優先度は次の基準で付けます。

- P0: 遊びやすさと判別に必須。先に制作する。
- P1: 第一印象、導線、報酬感を上げる。P0後に制作する。
- P2: 強化差分、追加演出、公開品質の底上げ。余力または次段階で制作する。

基本ファイル配置は `public/assets/game/{category}/{name}.png` とします。キー名の `.` はフォルダ区切りまたはファイル名の `_` に変換して管理します。

## 命名ルール

| アセットキー | 標準ファイル例 |
| --- | --- |
| `item.stone` | `public/assets/game/item/stone.png` |
| `debris.broken_chest` | `public/assets/game/debris/broken_chest.png` |
| `enemy.cave_watcher` | `public/assets/game/enemy/cave_watcher.png` |
| `player.cleaner` | `public/assets/game/player/cleaner.png` |
| `dungeon.exit` | `public/assets/game/dungeon/exit.png` |
| `ui.broom` | `public/assets/game/ui/broom.png` |

状態差分を作る場合は、末尾に状態名を付けます。

- `player/cleaner_idle.png`
- `player/cleaner_walk.png`
- `player/cleaner_clean.png`
- `enemy/slime_hazard_alert.png`
- `dungeon/exit_open.png`

## 画面/UI

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P1 | `ui.coin` | `ui/coin.png` | 所持金、報酬表示 | 24-32px | 通常、報酬強調 |
| P1 | `ui.bag` | `ui/bag.png` | バッグ容量、持ち物タブ | 24-40px | 通常、容量強化 |
| P1 | `ui.broom` | `ui/broom.png` | ホーム、ショップ、清掃力 | 24-40px | 通常、強化 |
| P1 | `ui.map` | `ui/map.png` | マップタブ | 24-40px | 通常、選択中 |
| P1 | `ui.request` | `ui/request.png` | 依頼タブ、依頼項目 | 24-40px | 通常、進行中 |
| P1 | `ui.shop` | `ui/shop.png` | ショップタブ | 24-40px | 通常、購入可能 |
| P1 | `ui.codex` | `ui/codex.png` | 図鑑メモ、収集画面 | 24-40px | 通常、更新あり |
| P1 | `ui.stamina` | `ui/stamina.png` | スタミナ強化、HUD補助 | 24-32px | 通常、低下 |
| P1 | `ui.attack` | `ui/attack.png` | 追い払い、作業道具 | 24-32px | 通常、強化 |
| P1 | `screen.title_background` | `screen/title_background.png` | タイトル背景 | 390x844基準 | 通常 |
| P1 | `screen.base_panel` | `screen/base_panel.png` | 拠点パネル素材 | 320x420基準 | 通常 |
| P1 | `screen.parchment_panel` | `screen/parchment_panel.png` | 図鑑/依頼/メモ | 320x420基準 | 通常 |
| P2 | `pwa.icon_192` | `pwa/icon_192.png` | PWA 192pxアイコン | 192x192px | 通常 |
| P2 | `pwa.icon_512` | `pwa/icon_512.png` | PWA 512pxアイコン | 512x512px | 通常 |

`screen.*` と `pwa.*` は現時点の `ASSET_KEYS` には未追加です。制作対象として先に定義し、実装時に追加します。

## プレイヤー

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `player.cleaner` | `player/cleaner.png` | 操作キャラクター本体 | 28x34px前後 | idle、walk、clean、pickup、damage、return |
| P0 | `player.broom` | `player/broom.png` | 掃除アクション、装備表示 | 20-34px | normal、crafted、upgrade |
| P0 | `player.bag` | `player/bag.png` | 背中のバッグ、容量強化 | 18-28px | small、medium、large |

制作メモ:

- 作業帽、布マスク、作業着、革エプロン、ほうき、バッグで清掃員だと分かるようにする。
- 勇者、騎士、魔法使いに見えないこと。
- 向きと掃除中の状態がシルエットで分かること。

## ダンジョン

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `dungeon.exit` | `dungeon/exit.png` | 帰還出口 | 40x50px以上 | closed、open、near |
| P1 | `dungeon.floor_stone` | `dungeon/floor_stone.png` | 床タイル | 32x32px | 通常、汚れ、ひび |
| P1 | `dungeon.wall_stone` | `dungeon/wall_stone.png` | 壁タイル | 32x32px | 通常、縁、苔 |
| P1 | `dungeon.shadow` | `dungeon/shadow.png` | 接地影 | 16-48px | 小、中、大 |
| P1 | `dungeon.minimap_tile` | `dungeon/minimap_tile.png` | ミニマップ風パネル | 8-12px | 床、壁、現在地、出口 |

`dungeon.shadow` と `dungeon.minimap_tile` は現時点の `ASSET_KEYS` には未追加です。実装時に追加する候補です。

## 残骸

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `debris.small_stone` | `debris/small_stone.png` | 小さな瓦礫、石材ドロップ | 28-34px | full、half、cleaned |
| P0 | `debris.slime_trail` | `debris/slime_trail.png` | 粘液跡、粘液素材ドロップ | 30-38px | full、half、cleaned |
| P0 | `debris.broken_crate` | `debris/broken_crate.png` | 壊れた木箱、木片ドロップ | 32-40px | full、half、cleaned |
| P0 | `debris.burnt_ash` | `debris/burnt_ash.png` | 焦げた灰、灰ドロップ | 30-40px | full、half、cleaned |
| P0 | `debris.broken_chest` | `debris/broken_chest.png` | 壊れた宝箱、金属片ドロップ | 36-44px | full、half、cleaned |

制作メモ:

- 清掃対象なので、床タイルと同化しない不規則な形にする。
- 掃除進捗で薄くなる前提の差分があると望ましい。
- 消える時に素材が出るため、ドロップ素材と見た目の関係を残す。

## 素材

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `item.stone` | `item/stone.png` | 石材 | 16-24px | 通常、回収中 |
| P0 | `item.wood` | `item/wood.png` | 木片 | 16-24px | 通常、回収中 |
| P0 | `item.slime` | `item/slime.png` | 粘液素材 | 16-24px | 通常、回収中 |
| P0 | `item.ash` | `item/ash.png` | 灰 | 16-24px | 通常、回収中 |
| P0 | `item.metal` | `item/metal.png` | 金属片 | 16-24px | 通常、回収中、レア強調 |
| P1 | `item.treasure` | `item/treasure.png` | 宝/高価品表現、図鑑 | 20-28px | 通常、未収集 |

制作メモ:

- `stone`: 角ばった小石、灰色、硬い輪郭。
- `wood`: 細長い板、茶色、木目線。
- `slime`: 丸い滴、緑、半透明、泡。
- `ash`: 小さな粉、黒灰色、明るい縁。
- `metal`: ギザギザの破片、青灰色、白いハイライト。

## 危険物

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `enemy.slime_hazard` | `enemy/slime_hazard.png` | 粘液だまり系危険物 | 32-42px | idle、patrol、alert、cleaned |
| P0 | `enemy.ash_wisp` | `enemy/ash_wisp.png` | 灰まじりの気配 | 32-42px | idle、patrol、alert、cleaned |
| P0 | `enemy.cave_watcher` | `enemy/cave_watcher.png` | 見張り/警戒表現 | 32-42px | idle、alert、chase |
| P0 | `effect.alert_mark` | `effect/alert_mark.png` | 発見 `!` | 16-28px | pop、active |

`effect.alert_mark` は現時点の `ASSET_KEYS` には未追加です。今はPhaser描画で表現し、画像化する場合に追加します。視線範囲は内部判定のみで、視線扇形の枠や範囲エフェクトは画像化しません。

制作メモ:

- 追い払い対象であり、討伐対象に見せない。
- 発見時は `!`、向き、移動速度、揺れで明確にする。
- 深い階で強く見える差分は、サイズ、縁取り、内部視線距離、揺れで表現する。視線範囲そのものは表示しない。

## エフェクト

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P0 | `effect.clean_ring` | `effect/clean_ring.png` | 長押し掃除進捗 | 48-64px | progress、complete |
| P0 | `effect.dust` | `effect/dust.png` | 粉じん粒 | 4-10px | small、medium |
| P1 | `effect.item_pickup` | `effect/item_pickup.png` | 素材回収粒 | 4-10px | 素材色別 |
| P1 | `effect.exit_glow` | `effect/exit_glow.png` | 出口開放光 | 64-96px | closed、open、near |
| P1 | `effect.reward_spark` | `effect/reward_spark.png` | 報酬粒、売上演出 | 4-12px | gold、material |
| P1 | `effect.sweep_arc` | `effect/sweep_arc.png` | 追い払い弧 | 40-72px | normal、hit |

`effect.*` は現時点の `ASSET_KEYS` には未追加です。今はPhaser描画やParticlesで表現し、必要になった段階で追加します。

## 画面単位アセット

| 優先度 | アセットキー | ファイル例 | 用途 | 推奨サイズ | 状態差分 |
| --- | --- | --- | --- | --- | --- |
| P1 | `screen.title_background` | `screen/title_background.png` | タイトル画面背景 | 390x844基準 | 通常 |
| P1 | `screen.logo` | `screen/logo.png` | ゲームロゴ | 横280px前後 | 通常 |
| P1 | `screen.base_panel` | `screen/base_panel.png` | 拠点中央パネル | 320x420基準 | 通常 |
| P1 | `screen.result_panel` | `screen/result_panel.png` | リザルトパネル | 320x420基準 | 通常、好成績 |
| P2 | `screen.codex_frame` | `screen/codex_frame.png` | 図鑑フレーム | 320x420基準 | 通常、未収集 |

`screen.*` は現時点の `ASSET_KEYS` には未追加です。画面全体の雰囲気づくりを画像化する場合の追加候補です。

## 制作順

1. P0の判別必須アセットを作る。
   - `player.cleaner`
   - 素材5種
   - 残骸5種
   - 危険物2-3種
   - `dungeon.exit`
   - 清掃リング、発見 `!`
2. P1の画面印象アセットを作る。
   - タイトル背景
   - 拠点パネル
   - 下部タブ/ショップ/依頼/図鑑アイコン
   - リザルト報酬演出
3. P2の差分と公開品質アセットを作る。
   - 装備強化差分
   - 宝箱差分
   - 追加エフェクト
   - PWA用アイコン強化

## 受け入れ基準

- 各アセットの用途、推奨サイズ、状態差分、優先度、ファイル名が一覧から判断できる。
- 実装担当が、画像をどの `ASSET_KEYS` に紐づけるか判断できる。
- スマホ縦画面で、プレイヤー、残骸、素材、危険物、出口の役割が色だけでなく形でも判別できる。
- 画像が未用意の間も、プレースホルダー描画で画面が壊れない。
- 添付イメージは方向性として扱い、画像そのものを直貼りしない。
