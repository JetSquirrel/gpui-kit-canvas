<p align="center">
  <img src="app/icon.svg" width="72" alt="" />
</p>

<h1 align="center">GPUI Kit Canvas</h1>

<p align="center">
  <strong><a href="https://github.com/longbridge/gpui-kit">gpui-kit</a> のデスクトップウィンドウをブラウザで組み立てて、画面同士をつなぎ、クリックして確かめ、そのまま AI コーディング用のプロンプトにするツールです。</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB" />
  <img alt="gpui-kit" src="https://img.shields.io/badge/target-gpui--kit%20(Rust)-171717" />
  <img alt="No backend" src="https://img.shields.io/badge/backend-none%20(localStorage)-2E6A45" />
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">中文</a>
</p>

![エディタ: タイトルバー、サイドバー、ツールバー、パンくず、データテーブル、ステータスバーを持つ gpui-kit のウィンドウと、部品パネル](docs/editor.png)

Claude Code、Codex、Gemini CLI、Cursor など、プロンプトを受け取れる AI コーディングツールならどれでも使えます。プロンプトをコピーしてツールに貼り、アプリを作ってと頼むだけです。

[lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas) の fork で、対象を Material 3 Expressive のスマホ画面から gpui-kit のデスクトップウィンドウへ移しています。

## できること

- **ドラッグ＆ドロップ** – 66 部品を、手が伸びる順に並べています。ウィンドウの骨格（タイトルバー、サイドバー、ツールバー、ステータスバー、パンくず）、アクション（ボタン、アイコンボタン、ボタングループ、メニュー）、入力（入力欄、複数行入力、セレクト、コンボボックス、チェックボックス、ラジオグループ、スイッチ、スライダー、ラベル、フォーム、レーティング、カラーピッカー、日付ピッカー、カレンダー、設定ページ）、コンテナ（パネル、グループボックス、タブ、リサイズ分割、アコーディオン、折りたたみ、ページネーション、ステッパー、ドックエリア、スクロールバー）、オーバーレイ（ダイアログ、シート、ポップオーバー、通知、ツールチップ、ホバーカード、コマンドパレット）、データ（リスト、データテーブル、ツリー、チャート）、コンテンツ（テキスト、アイコン、画像、セパレーター、バッジ、タグ、アバター、Kbd、リンク、マーカー、コピーボタン、シマー、定義リスト）、フィードバック（アラート、プログレス、スピナー、スケルトン）、チャット（メッセージ、吹き出し、添付、メッセージスクローラー）。
- **どの部品も実在するコンポーネント** – それぞれが実際の `gpui_kit::component` のパスを名指しし、`npm run check:api` が gpui-kit のチェックアウトから全パスを読み直して、存在しないものがあれば失敗します。gpui-kit の 63 コンポーネントモジュールのうち 58 をカバーし、残る 5 つ（`measure`、`native_menu`、`plot`、`searchable_list`、`window_border`）は配置する部品ではなく基盤です。
- **本物の寸法** – 部品の高さ・余白・角丸・行の高さは gpui-kit のソース（`sizing.rs`、`title_bar.rs`、`sidebar/mod.rs`）から取っています。medium のボタンは 32px、テーブルの行も 32px です。
- **本物のテーマ** – gpui-kit のチェックアウトから解決した 33 パレット（組み込みの Default Light / Dark と同梱の 21 テーマ）。キャンバスの色はすべて gpui-kit のセマンティックトークンで、プロンプトには実際のキー（`primary.background`、`sidebar.accent.background` など）で書き出されます。
- **本物のアイコン** – `gpui-kit-assets` が同梱する Lucide アイコン 101 個だけを選べます。プロンプトには `IconName::` の形で書き出されるので、描けないアイコンを指定してしまうことがありません。
- **ウィンドウの骨格** – Design Guides が挙げる 5 つの骨格（単一ワークスペース、サイドバー、一覧と詳細、ドキュメント、ユーティリティ）から選び、プロンプトは部品より先に骨格を伝えます。
- **磁石のような連結** – ボタンを近づけると 1 つの `ButtonGroup` にくっつき、接する側の角が角ばります。
- **複数ウィンドウ** – 何枚でも追加でき、名前・サイズ（1024×640 〜 1680×1050）・背景トークンを個別に設定できます。ウィンドウをドラッグすると中身ごと動きます。
- **クリックで遷移** – 部品、タイトルバーのアイコン、サイドバー・タブ・メニュー・リスト・パンくずの項目に移動先のウィンドウ（または「戻る」）を設定できます。キャンバスに矢印が出て、プレビューでは実際にクリックして確かめられます。
- **ショートカット** – 部品にキーバインドを設定すると、プロンプトが `actions!` の定義、`bind_keys` の割り当て、tooltip の `Kbd` 表示まで要求します。
- **編集できるデータ** – データテーブルの列はラベルと「数値」フラグ（比較できる数値なので右寄せになります）を持ち、行はセル単位で編集できます。ダイアログは確定ボタンの文言を自分で持つので、プロンプトは `OK` ではなく `削除` を要求します。
- **レイヤーとグループ** – ウィンドウごとの重なり順をレイヤーパネルで確認できます。複数選択してグループ化すると、重なりを保ったまま一緒に動かせます。プロンプトには重なりや横並びが明示され、生成されるレイアウトが崩れにくくなります。
- **テーマ** – gpui-kit の `ThemeConfig` が実際に持つ軸だけを扱います。カラーは同梱 33 パレットか手で調整したトークン一式、ライト／ダーク、OS 追従スイッチ。角丸は `theme.radius` と `radius.lg` をまとめて（スクエア／標準／丸め）。書体はシステム UI か名前を指定した face。密度はコンパクト／標準／ゆったりで、これがコンポーネントの既定 `Size` です。ほかに `theme.shadow` と `theme.focus_ring`。
- **プロンプト出力** – デザイン全体（または 1 ウィンドウだけ）が日本語・英語・中国語の簡潔な指示書になります。骨格、テーマ、レイアウト、振る舞い、使っている部品ごとの正確な `gpui_kit::component`、そして「まず gpui-kit のスキルかドキュメントを読み、API を絶対に推測しない」で始まる締めの指針まで含みます。
- **整える** – ボタンひとつでタイトルバーを上端、サイドバーを先頭側、ステータスバーを下端に留め、ツールバーとパンくずをタイトルバーの下の帯に並べ、ダイアログを中央に、通知を末尾側の隅に置き、残りを 16px のパネル余白で流し直します。もう一度押すと元に戻ります。ボタンの後半からは本文の縦の配置（上から・中央・下寄せ・均等）を選べ、ウィンドウに保存されてプロンプトにも書き出されます。
- **整列** – 右パネルから選択部品を左・中央・右・上・中段・下に揃えたり、均等に配置したりできます。複数選択なら部品同士で、単体なら「整える」が埋める本文領域（コンテナの中にあるときはそのコンテナ）に揃います。
- **3 言語** – UI・ドキュメントの初期内容・プロンプトのすべてが日本語・英語・中国語に対応します。初回はブラウザの言語で組み立て、言語を切り替えると初期内容もついてきます。部品は作られたときの文字を覚えているので、既定値のままのものだけが新しい言語で読み直され、自分で書いた文字はそのまま残ります。
- **AI 補助（任意）** – 自分のキー（OpenAI、Claude、Gemini、DeepSeek、Kimi Code）を入れると、部品の動作やウィンドウの説明を UI の言語で書いてもらえます。キーはブラウザ内にだけ保存され、リクエストはプロバイダへ直接送られます（間にサーバーはありません）。
- **書き出し** – プロンプトのコピー（手で編集してからも可）、ウィンドウの PNG 保存。
- **補助線スナップ**、Undo/Redo、キーボードショートカット、部品パネルのお気に入り。作業内容はブラウザ（localStorage）に自動保存されます。

## 生成されるプロンプト

Tokyo Night テーマの 1 ウィンドウのスケッチから、実際に出力された抜粋です。

```markdown
Fleetを gpui-kit（Rust のデスクトップ UI フレームワーク）で実装してください。
ビルドマシンを見張るツール。
デスクトップアプリで、既定のウィンドウサイズは 1280×800 です。サイズは固定では
ないので、狭くなったときの振る舞いも決めてください。ダークモード固定です。

## ウィンドウの骨格
- サイドバーワークスペース: 変化しない左のナビゲーションと、切り替わる右の詳細
  ビューという骨格です。ナビゲーションは内容が変わっても動かしません。

## ウィンドウ構成
「メイン」ウィンドウ（1280×800）の中身は次の通りです。重なっている部品はその旨を
書いています。
- 上部にタイトル「アプリ」のタイトルバー（macOS 風に左へ信号機ボタン）、末尾に
  IconName::Ellipsis を置きます。
- 中央付近に先頭側に寄せて見出し「ナビゲーション」のサイドバー（幅 255px）。項目は
  「受信箱」 (IconName::Inbox)、「プロジェクト」 (IconName::Folder) …
- 上部の中央に列が 「名前」、「状態」、「更新日」、「件数」（数値・右寄せ）の
  データテーブル（3 行のサンプル: Roadmap / 進行中 / 3 日前 / 12 …）を置きます。
- 下部にステータスバー。左に IconName::CircleCheck と「準備完了」、右に「3 件」を
  置きます。

## 振る舞いとビューの切り替え
- 「Save」ボタンは、キーバインドは cmd-s（actions! で action を定義し、bind_keys で
  割り当て、ボタンの tooltip に Kbd で表示する）。

## 使うコンポーネント
- データテーブル: `table::{DataTable, TableState, TableDelegate}` — ヘッダー、行、
  集計、ローディング、インライン編集で同じ列の幾何を保ちます。比較できる数値は
  右寄せ、識別子と文章は左寄せです。
```

## gpui-kit への追従

パレットとアイコンは gpui-kit のチェックアウトから生成するので、推測が入り込みません。

```bash
npm run gen:themes -- ../gpui-kit   # lib/kit-themes.gen.ts（33 パレット）
npm run gen:icons  -- ../gpui-kit   # lib/kit-icons.gen.ts（101 アイコン）
npm run check:api  -- ../gpui-kit   # 全コンポーネントのパスを検証し、未対応を一覧
```

3 つとも既定は `../gpui-kit` で、`GPUI_KIT` でパスを上書きできます。パレットを守るのは
`check:api` です。`lib/tokens.ts` からコンポーネントのパスをすべて抜き出して Rust の
ソースに引き当てるので、存在しない API を部品がこっそり名乗ることはありません。
`script/gen-kit-themes.mjs` は、テーマが書いていないトークンを
`crates/component/src/theme/schema.rs` の `ColorsConfig::apply_config` と同じ
フォールバック順で解決します。`background` しか指定していないテーマでも、
サイドバー・リスト・テーブルが揃った状態になります。

## キーボード

| キー | 動作 |
| --- | --- |
| `V` / `H` | 選択 / 手のひら（`Space` を押している間もパン） |
| ホイール、`Ctrl` + ホイール | パン、ズーム |
| `+` `-` `0` | 拡大、縮小、全体表示 |
| `Ctrl+Z` / `Ctrl+Shift+Z` | 元に戻す / やり直す |
| `Ctrl+D` | 複製 |
| `Ctrl+C` / `Ctrl+V` | 選択部品をコピー / 貼り付け（別のウィンドウにも） |
| `Ctrl+G` / `Ctrl+Shift+G` | グループ化 / 解除 |
| 矢印（`Shift` で 10） | 微調整 |
| `Delete` | 選択した部品、または選択したウィンドウを削除 |
| `Esc` | 選択を解除 |
| `P` | プレビュー |

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # ./out に静的書き出し
```

静的な Next.js 書き出し（`output: "export"`）なのでサーバーはなく、`out/` がサイトの
すべてです。サブパスで配信するときは、ビルド時に
`NEXT_PUBLIC_BASE_PATH=/リポジトリ名` を指定してください。

## デプロイ

### Cloudflare Workers

`wrangler.jsonc` が `out/` を Workers の静的アセットとして配信します。アダプタも
Worker スクリプトもありません。

```bash
npm run build
npm run preview    # wrangler dev。./out をローカルで配信
npm run deploy     # wrangler deploy
```

ここでは `NEXT_PUBLIC_BASE_PATH` を設定しないでください（ドメイン直下で配信されます）。
`wrangler.jsonc` をコミットしておくことが大事です。これが無いと `wrangler deploy` が
「Next.js」を自動検出して OpenNext アダプタを入れ、静的書き出しには存在しない
`.next/standalone` を探して失敗します。

### GitHub Pages

`.github/workflows/deploy.yml` が `NEXT_PUBLIC_BASE_PATH=/<リポジトリ名>` でビルドし、
`main` への push ごとに `out/` を公開します。

## クレジット

- コンポーネント、寸法、テーマ、アイコン: [longbridge/gpui-kit](https://github.com/longbridge/gpui-kit)（Apache-2.0）
- アイコン: [Lucide](https://lucide.dev)（ISC）。`gpui-kit-assets` が同梱しているもの
- エディタ本体: [lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas)（MIT）からの fork

## ライセンス

MIT
