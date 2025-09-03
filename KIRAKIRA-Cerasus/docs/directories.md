# ディレクトリ構造

## .vscode
Visual Studio Code プロジェクト設定

## api
バックエンドAPI関連

## assets
アセットファイル

### aep
モーショングラフィックスのAdobe After Effectsデザインプロトタイプ
* 本番環境からは除外

### audios
音声ファイル

### fonts
フォントファイル

### icons
SVGアイコンファイル

### images
画像ファイル

### lotties
Lottieアニメーションファイル

### sprite › gen
SVGスプライト生成ファイル
* バージョン管理からは除外

### styles
グローバルスタイルファイル

#### elements
特定要素関連のスタイルファイル

#### theme
テーマ関連のスタイルファイル

### videos
動画ファイル

## classes
クラスモジュール
* 自動的にインポートされる

## components
UIコンポーネント
* 自動的にインポートされる

## composables
コンポーザブル関数、再利用可能なコンポジションロジック

`utils` ディレクトリと似ていますが、Vueの `use____` のような関数です。
* 自動的にインポートされる

## content
コンテンツファイル（Markdownなど）

## dist<br />.output
本番環境用に生成・ビルドされたアプリケーションディレクトリ

## docs
ドキュメント

## helpers
特定用途のためのロジックモジュール

自動的にはインポートされず、明示的なインポートが必要。

## layouts
レイアウトコンポーネント

## locales
言語辞書

## middleware
ミドルウェアモジュール

## modules
カスタムNuxtモジュール

## node_modules
NPMモジュール、外部依存ライブラリ
* バージョン管理からは除外

## pages
ページコンポーネント

## patches
カスタム依存関係パッチ

## plugins
カスタムプラグイン

### nuxt
Nuxt プラグイン

### postcss
PostCSS プラグイン

### vite
Vite プラグイン

### vue
Vue プラグイン

## public
パブリックルートディレクトリ

### static
静的リソース、実際のパスで直接参照可能

## scripts
Node.js カスタムスクリプト
* 本番環境からは除外

## server
サーバーモジュール

### api
サーバーAPIモジュール

### routes
サールーティングモジュール

`server › api` ディレクトリと似ていますが、`/api` プレフィックスが付きません。

### middleware
サーバーミドルウェアモジュール

## stores
状態管理ライブラリ、データ永続化ストレージモジュール

## types
TypeScript 型定義追加ファイル

## utils
ユーティリティモジュール

`composables` ディレクトリと似ていますが、こちらは汎用的なユーティリティモジュールとしてのみ使用します。
* 自動的にインポートされる
