# KIRAKIRA-Rosales 開発ドキュメント

## I. はじめに

KIRAKIRA-Rosales（以下、「Rosales」または「バックエンド」）は、KoaフレームワークをベースにしたRESTfulなバックエンドAPIです。

このドキュメントの主な内容は次のとおりです：
1. 既存のコードを二次開発する方法。
2. データベース、検索エンジン、クラスタ展開など、バックエンド関連のインフラ知識。

このドキュメントを執筆するにあたり、読者が[JavaScript](https://developer.mozilla.org/docs/Web/JavaScript)と[TypeScript](https://www.typescriptlang.org/)の基本的な構文をマスターし、[HTTP](https://developer.mozilla.org/docs/Web/HTTP/Overview)の動作原理を理解し、[データベース](https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9)と[NoSQL](https://ja.wikipedia.org/wiki/NoSQL)の概念について理解しているなど、一定のプログラミング知識を持っていることを前提としています。

### 技術スタック
始める前に、KIRAKIRA-Rosalesとその関連インフラの技術アーキテクチャを理解することが非常に重要です。

KIRAKIRA-RosalesはTypeScriptで書かれています。TypeScriptの型チェックはコードの品質を大幅に向上させることができるためです。
具体的には、バックエンドはKoa.jsフレームワークを使用しています。Koa.jsはNode.jsのフレームワークであり、より優れた非同期処理とHTTPサポートを提供します。
バックエンドの生産環境はAWSのEKSクラスタにデプロイされています。
バックエンドはMongoDBデータベースクラスタとElasticsearch検索エンジンクラスタに依存しており、これらも同様にAWS EKSにデプロイされています。

ストレージについては、MongoDBとElasticsearchが生成するデータはAWS EKSにマウントされたAWS EBS (Elastic Block Store)ブロックストレージに保存され、画像や動画ファイルはCloudflareのR2、Images、Streamによって保存されます。

[![](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://tc39.es)
[![](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![](https://img.shields.io/badge/-Node.js-417e38?style=flat-square&logo=Node.js&logoColor=white)](https://nodejs.org)
[![](https://img.shields.io/badge/-Koa-EEEEEE?style=flat-square&logo=Koa&logoColor=black)](https://koajs.com)
[![](https://img.shields.io/badge/-MongoDB-EEEEEE?style=flat-square&logo=MongoDB&logoColor=00ed64)](https://www.mongodb.com)
[![](https://img.shields.io/badge/-Elasticsearch-07a0d7?style=flat-square&logo=Elasticsearch&logoColor=333333)](https://www.elastic.co/elasticsearch)
[![](https://img.shields.io/badge/-Kubernetes-0075e4?style=flat-square&logo=Kubernetes&logoColor=white)](https://kubernetes.io/)

## II. インストールと起動
### 1. リポジトリのクローン
[Git](https://git-scm.com/)がインストールされており、このリポジトリへのアクセス権があることを確認してください。

以下のコマンドを使用してこのリポジトリをクローンします
``` shell
# <some-dir>をお使いのコンピュータのディレクトリに置き換えてください。
cd <some-dir>

# クローン
git clone https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales.git
```
または、グラフィカルインターフェースを持つGitHub Desktopやその他のGit互換ツールを使用してこのステップを完了することもできます。

### 2. 環境変数の設定
> [!IMPORTANT]
> 以下のサンプルコードにはすべての環境変数が含まれているわけではなく、実際に使用する際には各環境変数に値を設定する必要があります。
> すべての環境変数とその役割については、[.env.powershell.temp](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/blob/develop/.env.powershell.temp)を参照してください。
``` powershell
# OSによって環境変数の設定方法は異なります。以下はWindows PowerShellの例です。
$env:SERVER_PORT="9999"
$env:SERVER_ENV="dev"
$env:SERVER_ROOT_URL="kirakira.moe"
...
```
環境変数の設定で問題が発生した場合は、[Issue](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/issues)または[Discussion](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/discussions)で回答を探すか、質問してください。

### 3. バックエンド開発サーバーの起動
> [!IMPORTANT]
> 開発モードでサービスを起動すると、コードはプロジェクトのルートディレクトリにある`.kirakira`ディレクトリにパッケージ化されます。
```sh
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# または、ホットリロードモードで開発サーバーを起動することもできます
npm run dev-hot
```
開発サーバーのデフォルトのパッケージ化場所を変更する必要がある場合は、package.jsonファイルの`scripts.start`の値を変更する必要があります。
`scripts.start`の値は起動コマンドです。そのコマンド内のすべての`.kirakira`をカスタムディレクトリに置き換える必要があります。
例えば、`tsc --noEmitOnError --sourceMap --outDir .foo && node ./.foo/app.js`は、開発サーバーのパッケージ化ディレクトリを`.foo`に変更します。

### 4. 確認
上記のコマンドを正常に実行すると、ポート9999（または環境変数でカスタマイズしたポート）でリッスンするKIRAKIRA-Rosales開発サーバーが起動します。🎉
ブラウザで https://localhost:9999 を入力して実行状態をテストします。正常に起動していれば、「Hello World」などの文字が表示されるはずです。

これを基に、コードを記述、貢献し、KIRAKIRAプロジェクトの開発に参加できます。

## III. 開発
この章では、KIRAKIRA-Rosalesを二次開発して機能を改善する方法を順を追って説明します。
### ディレクトリ構造の理解
以下はプロジェクトのディレクトリ構造の概要です
```
◌
├ .github - GitHub関連の設定
│  └ workflows - Githubワークフローを格納
├ .vscode - VSCode関連の設定
├ docs - ドキュメントを格納（このドキュメントもこのディレクトリにあります）
├ old - 削除したくない古いコードを格納
├ src - ソースコードを格納
│  ├ common - 共通関数を格納
│  ├ controller - controller層。受け取ったリクエストペイロードデータを処理し、リクエストレスポンスデータを拡充するために使用
│  ├ dbPool - MongoDB関連の共通コードを格納
│  ├ elasticsearchPool - Elasticsearch関連の共通コードを格納
│  ├ middleware - サーバーミドルウェア関連のコードを格納
│  ├ route - ルーティングコードを格納
│  ├ service - service層。ビジネスロジックの処理に使用
│  ├ ssl - SSL関連の設定
│  ├ store - 「状態管理」または「実行時グローバル変数」関連のコードを格納
│  ├ type - 共通の型定義コードを格納
│  └ app.ts - プログラムのエントリファイル
├ .dockerignore - docker buildコマンド実行時に無視するファイルを設定
├ .editorconfig - コーディングスタイルを定義
├ .env.powershell.temp - 環境変数のテンプレートおよび説明ドキュメント
├ .eslintignore - Eslintが無視する内容を定義
├ .eslintrc.cjs - ESLintの設定を定義
├ .gitattributes - Git関連の設定を定義
├ .gitignore - Gitが無視するファイルを定義
├ Dockerfile - Dockerコンテナイメージのビルドプロセスを記述
├ LICENSE - ライセンス
├ README.md - 自己紹介ファイル
├ package-lock.json - npm installでインストールされる依存パッケージのバージョンを固定
├ package.json - メタデータ、スクリプト、依存パッケージリストを定義
├ tsconfig.json - TypeScriptの設定ファイル
└ ℩ɘvoↄ.svg - カバー画像
```
### Hello Worldから始める
最初のプログラムは常にHello Worldから始まりますが、KIRAKIRA-Rosalesも例外ではありません。

`/src/controller`ディレクトリには、`HelloWorld.ts`という特別なファイルがあります。
このファイルには以下のコードが含まれています：
``` TypeScript
import { koaCtx, koaNext } from '../type/koaTypes.js'

export const helloWorld = async (ctx: koaCtx, next: koaNext): Promise<void> => {
	const something = ctx.query.something
	ctx.body = something === 'Beautiful' ? `Hello Beautiful World` : 'Hello World'
	await next()
}
```
このコードを一行ずつ分析してみましょう：
まず、一行目
``` TypeScript
import { koaCtx, koaNext } from '../type/koaTypes.js'
```
これはkoaTypes.js（koaTypes.ts）ファイルからkoaCtxとkoaNextの2つの型をインポートしています。
```TypeScript
export type koaCtx = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, unknown> & {elasticsearchClient?: Client}
export type koaNext = Koa.Next
```
これら2つの型はKoaが提供する型を拡張したもので、koaCtxはネットワークリクエストのコンテキスト、koaNextは呼び出し可能な非同期関数です。
koaCtx型はオブジェクトです。このオブジェクトには、リクエストヘッダー、リクエストボディ、レスポンスヘッダー、レスポンスボディ、およびミドルウェアによって追加されたその他のパラメータが含まれている必要があります。
koaNext型は非同期関数です。この関数は次のミドルウェアを実行するために使用され、最後のミドルウェアであればリクエストを完了し、レスポンスをクライアントに返します。
koa-routerを使用してルーティングを作成すると、渡されたController関数に上記の2つの変数が自動的に追加されます。

現時点では、これら2つの型を完全に理解する必要はありません。次に進みましょう。
``` TypeScript
export const helloWorld = async (ctx: koaCtx, next: koaNext): Promise<void> => {...}
```
この行では、`helloWorld`という名前の非同期アロー関数をエクスポートしています。この関数は`ctx: koaCtx`と`next: koaNext`の2つのパラメータを受け取り、空のPromiseを返します。
ctxはcontextの略で、コンテキストを表します。

次の2行のコード：
``` TypeScript
const something = ctx.query.something
ctx.body = something === 'Beautiful' ? `Hello Beautiful World` : 'Hello World'
```
この部分は、ネットワークリクエストのコンテキストからヘッダーやボディ（本文）にアクセスするために使用されます。

まず、`ctx`コンテキストオブジェクトから`something`という名前の「クエリ」パラメータを照合し、`something`定数に代入します。
次に三項演算子があり、この演算部分を「ビジネスロジックコード」と理解できます。`something`の値が文字列 "Beautiful" の場合、`ctx`リクエストコンテキストオブジェクトのレスポンスボディに "Hello Beautiful World" を代入し、そうでなければ "Hello World" を代入します。

バックエンド開発モードでは、通常、リクエストペイロードの整理やリクエストレスポンスの整理に関するコードロジックはController層に配置し、複雑なビジネスロジックはService層に配置します。

次に、最後の行のコードを見てみましょう：
``` TypeScript
await next()
```
この行のコードは、次のミドルウェアの実行が完了するのを待つ役割を果たします。次のミドルウェアがなければ、リクエストを完了し、レスポンスをクライアントに返します。

以上が、KIRAKIRA-RosalesがKoaを介してネットワークリクエストに応答する最も簡単なプロセスです。
ブラウザを開き、アドレスバーに`https://localhost:9999?something=Beautiful`と入力してEnterキーを押すと、ページに`Hello Beautiful World`という文字が表示されます。🎉


### ルーティング
フロントエンドのルーティングと同様に、バックエンドにも「ルーティング」の概念が存在します。
フロントエンドはルーティングによって正しいコンポーネントを照合してレンダリングし、バックエンドはルーティングによってネットワークリクエストを正しいController層に送信（マッピング）して実行します。
`src\route\router.ts`ファイルで、URLからController関数へのマッピングを一元的に記述・管理します。

GETリクエストを受け取る典型的なインターフェースルートは次のようになります：
``` typescript
//      リクエストのURL
//          ↓
router.get(URL, controller)
//                   ↑
//      このURLに対応するController関数
```
POSTリクエストを受け取るインターフェースの場合、`router.get`を`router.post`に変更する必要があります。
``` typescript
//      リクエストのURL
//          ↓
router.post(URL, controller)
//                   ↑
//      このURLに対応するController関数
```
同様に、PUTリクエストやDELETEリクエストなど、他のタイプのリクエストも記述できます。
``` typescript
router.put(URL, controller)
router.delete(URL, controller)
...
```
> [!IMPORTANT]
> 渡されるcontrollerはController関数自体である必要があり、関数の呼び出し（結果）ではありません。
> リクエストがトリガーされると、koa-routerは自動的に(ctx: koaCtx, next: koaNext)をController関数に渡します。
``` typescript
router.get(URL, controller) // 正しい使い方

router.get(URL, controller()) // ❌ 間違った使い方
```

### リクエストパラメータ（ペイロード）と戻り値
リクエストを送信する際、時にはデータ（「リクエストパラメータ」または「リクエストペイロード」と呼ばれる）をバックエンドに渡す必要があります。バックエンドのプログラムが実行を終えたら、実行結果をリクエスタに返す必要があります。
例えば、ユーザーがログインする際には、ユーザーが入力したメールアドレスとパスワードをバックエンドに送信して検証を行い、検証が通ればユーザートークンをクライアントに返します。

データを渡す際には、「明示的」に渡すことも、「暗黙的」に渡すこともできます。

#### 「明示的」なリクエストパラメータ（ペイロード）の受け渡し
HTTPリクエストのURLでデータを渡すことができます。
URLでデータを渡す場合、このプロジェクトでは[Path（パス）](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL#path_to_resource)ではなく[Parameters（パラメータ）](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL#parameters)を使用する傾向があります。なぜなら、Pathは動的なルーティングマッチングが必要だからです。
``` shell
# curlコマンドを使用して、Parameters付きのURLにGETリクエストを送信する
curl https://localhost:9999?something=Beautiful
```

> [!IMPORTANT]
> URLは長すぎてはいけません。渡せるデータの長さには限りがあり、通常は特定のデータをリクエストする際に簡単なクエリパラメータを渡すために使用されます。

バックエンドのController関数では、ctxオブジェクトからsomethingに対応する値を取得できます。
``` typescript
const something = ctx.query.something
```
> [!IMPORTANT]
> somethingの型はstring | string[]です。なぜなら、URL Parametersは同名の複数のパラメータを一つの配列にまとめるからです。
> 続行する前に、配列であるかどうかを判断する（推奨）か、要件に応じてアサーションを行い、さらなるデータ検証を実行する必要があります。


URLのParameters以外にも、HTTPリクエストのリクエストボディでデータを渡すことができます。
> [!IMPORTANT]
> 一部のHTTPプロトコルの実装では、GETリクエストなどの特定のリクエストメソッドがリクエストボディを含むことをサポートしていません。詳細については、[MDNのHTTPリファレンスドキュメント](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)を参照してください。
> リクエストボディには比較的多くのデータを運ぶことができますが、無制限ではなく、上限は異なるHTTP実装によって異なります。

``` shell
# curlコマンドを使用して、リクエストボディ付きのPOSTリクエストをURLに送信する
curl -d "param1=value1&param2=value2" -X POST https://localhost:9999/xxxxx
```
バックエンドのController関数では、ctxオブジェクトからリクエストボディのデータを取得できます。
``` typescript
const data = ctx.request.body as { param1: string; param2: string }
```
> [!IMPORTANT]
> 続行する前に、リクエスト送信時に渡されたデータ型と一致する型にアサーションを行い、さらなるデータ検証を実行する必要があります。

#### 「暗黙的」なデータの受け渡し

[HTTP Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)を使用して「暗黙的」にデータを渡すことができます。リクエストを送信するたびに、Cookieもバックエンドに送信されます。
KIRAKIRAプロジェクトでは、ユーザートークン、ユーザー設定、ユーザースタイルなどのデータを保存するためにCookieを多用しています。Cookieを設定および送信する際には、その制限とテクニックを習得する必要があります。このドキュメントでは詳しく説明しませんので、[MDN HTTP Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)のドキュメントを各自参照してください。ただし、いくつか注意点があります：
* CookieはHTTPSのみに制限できます。
* HttpOnlyのCookieは、リクエストのset-cookieを介してのみ設定/削除でき、JavaScriptからはアクセスできません。
* 現在、多くのブラウザはファーストパーティ（同一サイト）Cookieのみをサポートしています。つまり、`SameSite=Strict`です。
* fetch関数で{ credentials: "include" }オプションを使用すると、クロスオリジンリクエストを送信する際にCookieを含めることができます。

バックエンドのController関数では、ctxオブジェクトからCookieのデータを取得できます。
``` typescript
ctx.cookies.get(cookieKey) // cookieKeyという名前のCookieに対応する値を取得します。
```
> [!IMPORTANT]
> 続行する前に、さらなるデータ検証を忘れないでください。

#### サーバーからクライアントへの結果の返却
バックエンドのロジックが実行完了した後、結果をクライアントに返す必要があります。

結果をctxオブジェクトのbodyプロパティに代入し、次のミドルウェアを実行します。最後のミドルウェアであれば、bodyの値をクライアントに返します。
``` typescript
ctx.body = results
await next() // これが最後のミドルウェアであると仮定します
```

### MongoDBデータベースとElasticsearch検索エンジンへのアクセス
ユーザーが生成したデータは通常MongoDBに保存されますが、検索が必要なデータはElasticsearch検索エンジンに保存されます。
データベースと検索エンジンのCRUD（作成、読み取り、更新、削除）操作は、バックエンドコードの主要な機能です。

#### MongoDB
バックエンドはMongooseを使用してMongoDBデータベースに接続します。

プログラムの初期化時に、`src\dbPool\DbClusterPool.ts`ファイル内の`connectMongoDBCluster`関数が直ちに実行されます。この関数はまず環境変数から接続文字列やデータベースのアカウント、パスワードなどのデータを読み取り、次にデータベース接続プールを作成します。作成された接続プールはMongooseの内部で管理され、MongooseはデータベースのCRUD操作を実行するための`mongoose`インスタンスを公開します。ユーザーは接続プールの具体的な実装や負荷分散の問題を気にする必要はありません。

> [!IMPORTANT]
> レプリカセットの場合、書き込み操作は常にプライマリシャードに送信され、その後プライマリシャードからレプリカシャードに同期されます。
> 読み取り操作の優先度はユーザーが設定しますが、このプログラムのデフォルトのデータベース読み取り優先度はレプリカから優先的に読み取ることです。ただし、トランザクションを使用する場合など、特定の状況ではこの設定が上書きされ、プライマリから優先的に読み取られます。

Mongooseが公開する`mongoose`インスタンスを使用して、ユーザーは直接CRUD操作を実行できます。このプロジェクトでは、`src\dbPool\DbClusterPool.ts`ファイル内で、型制約付きの便利な関数もカプセル化してこれらの操作を実行します。

以下は簡単な例です。
``` typescript
import mongoose, { InferSchemaType } from 'mongoose'

/**
 * ユーザーデータ
 */
class UserSchemaFactory {
	schema = {
		uid: { type: Number, unique: true, required: true }, // ユーザーのUID
		username: { type: String }, // ユーザー名
		editDateTime: { type: Number, required: true }, // システム専用フィールド - 最終編集日時
	}
	collectionName = 'user' // MongoDBのコレクション名
	schemaInstance = new Schema(this.schema) // MongooseのSchemaインスタンス
}

const UserSchema =  new UserSchemaFactory() // インスタンス化
const { collectionName, schemaInstance } = UserSchema // コレクション名とコレクションのSchemaインスタンスをデストラクチャリング

type User = InferSchemaType<typeof schemaInstance> // InferSchemaTypeを使用してユーザーデータのTypeScript型を推論

const user: User = { // ユーザーデータの構築
	uid: 1,
	username: 'foo',
	editDateTime: new Date().getTime(),
}

try {
	await insertData2MongoDB<User>(user, schemaInstance, collectionName) // データの挿入
} catch(error) {
	console.error('ERROR', "データの挿入に失敗しました：", error)
}


const userWhere: QueryType<User> = { uid: 1 } // UIDが1のユーザーデータをクエリ
const userSelect: SelectType<User> = { username: 1 } // usernameフィールドのみをクエリ
try {
	const userResult = await selectDataFromMongoDB<User>(userWhere, userSelect, schemaInstance, collectionName) // データのクエリ
	console.oog('RESULT', useResult)
} catch (error) {
	console.error('ERROR', "データのクエリに失敗しました：", error)
}
```
> [!IMPORTANT]
> UserSchemaFactoryとUserSchemaは通常、別のファイルに保存され、UserSchemaをエクスポートして他のファイルで使用します。


#### Elasticsearch
Elasticsearchは検索エンジンであり、ElasticsearchクラスタにデプロイするにはHTTPリクエストを介して操作する必要があります。
公式はNode.jsプログラムがElasticsearchを簡単に操作できるようにSDKを提供しています。
手動でHTTPリクエストを構築する必要はありません。

同様に、プログラムの初期化時に`src\elasticsearchPool\elasticsearchClusterPool.ts`ファイル内の`connectElasticSearchCluster`関数が実行されます。この関数は環境変数を読み取り、Elasticsearchクラスタとの接続を作成します。接続が作成されると、接続クライアントインスタンスがKoaのリクエストコンテキストctxに追加されます。Controllerでは、`ctx.elasticsearchClient`を介してクライアント接続を取得し、CRUD操作を実行できます。このプロジェクトでは、`src\elasticsearchPool\elasticsearchClusterPool.ts`ファイル内で、型制約付きの便利な関数もカプセル化してこれらの操作を実行します。

以下は簡単な例です。
``` typescript
import { EsSchema2TsType } from '../elasticsearchPool/ElasticsearchClusterPoolTypes.js'


const esClient = ctx.elasticsearchClient // 接続が正しく作成されていると仮定

/**
 * 動画データ
 */
const VideoDocument = {
	schema: {
		title: { type: String, required: true as const }, // 動画のタイトル
		kvid: { type: Number, required: true as const }, // KVID 動画ID
	},
	indexName: 'search-kirakira-video-elasticsearch', // Elasticsearchのインデックス名
}

const { indexName: esIndexName, schema: videoEsSchema } = VideoDocument // デストラクチャリング

const videoEsData: EsSchema2TsType<typeof videoEsSchema> = { // 動画データの構築
	title: "foo bar baz",
	kvid: 1,
}
try {
	const refreshFlag = true // インデックスをすぐにリフレッシュするかどうか（リフレッシュ後、このデータは検索可能になります。リフレッシュが頻繁すぎるとパフォーマンスに影響する可能性があります）
	await insertData2ElasticsearchCluster(esClient, esIndexName, videoEsSchema, videoEsData, refreshFlag) // データの挿入
} catch (error) {
	console.error("ERROR", "データのインデックス作成に失敗しました：", error)
}

const esQuery = { // 検索条件の構築
	query_string: {
		query: 'foo',
	},
}

try {
	const esSearchResult = await searchDataFromElasticsearchCluster(esClient, esIndexName, videoEsSchema, esQuery) // データの検索を開始
	console.log('RESULT', esSearchResult)
} catch (error) {
	console.error("ERROR", "データの検索に失敗しました：", error)
}
```

## IV. APIドキュメント
ルーティングファイル `src\route\router.ts` を参照してください。

## V. ビルドとデプロイ
このプロジェクトをローカルでテスト実行するか、単にビルドしてサーバーインスタンスにデプロイすることができます。
また、コンテナイメージとしてパッケージ化し、Dockerやその他のDocker互換プログラムで実行することもできます。

#### ビルドして実行
1.環境変数の設定

設定方法は[上記の説明](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop?tab=readme-ov-file#%E5%BC%80%E5%8F%91)と同じです。

2.ビルドとプレビュー
> [!IMPORTANT]
> デフォルトでは、コードはプロジェクトのルートディレクトリにある `dist` ディレクトリにパッケージ化されます。
> 必要に応じて、tsconfig.jsonでパッケージ化パスを変更できます。その場合、以下の3番目の手順にあるサーバー起動コマンドのパスも変更する必要があります。
```sh
# 1. 依存関係のインストール
npm install

# 2. ビルド
npm run build

# 3. 実行
node ./dist/app.js
```

#### コンテナイメージとしてのパッケージ化（ベストプラクティス）
KIRAKIRA-Rosalesをデプロイするためのベストプラクティスは、K8sクラスタで実行することです。現在使用しているKIRAKIRA-Rosalesサービスもそのようにデプロイされています。

まず、Dockerがインストールされ実行されていることを確認し、以下のコマンドを実行するとDockerのバージョン番号が表示されるはずです。
``` shell
docker --version
```
Dockerを使用してマルチプラットフォームのコンテナイメージをパッケージ化します（以下の例はAMDアーキテクチャのWindowsプラットフォーム用です。MacOSやLinuxプラットフォームでは異なる場合があります）。

``` shell
# 新しいbuilderインスタンスを作成して有効化する（以前に作成したことがある場合は、このステップをスキップ）
docker buildx create --name mybuilder --use

# builderインスタンスを起動して確認する
docker buildx inspect --bootstrap

# マルチプラットフォームイメージをビルドしてDocker Hubにプッシュする
# docekrがインストールされ、dockerがリモートコンテナイメージリポジトリにログイン/接続していることを確認してください。ここでは cfdxkk01/kirakira を使用します
# <tag> を正しいバージョン番号（例：3.21.1）に置き換えてください
#                                                                              ここに「.」があることに注意してください。コピーする際に忘れないように
#                                                                                             ↓
docker buildx build --platform linux/amd64,linux/arm64 -t <username>/<repo-name>:<tag> --push .
```
その後、このコンテナイメージをK8sや他のコンテナ/クラスタ環境にデプロイできます。

> [!IMPORTANT]
> 生産環境やコンテナイメージ環境でも環境変数の設定を忘れないでください！

## VI. オープンソースとセキュリティ
* このプロジェクトはBSD-3-Clause licenseオープンソースライセンスに準拠しています。
* 一般的な問題についてはIssueを作成してください。プライバシーに関する問題やセキュリティ問題の報告については、[Discordチャンネル](https.discord.gg/maveEWn6VP)までお願いします。
