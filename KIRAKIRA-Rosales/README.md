![Cover](℩ɘvoↄ.svg)

# KIRAKIRA-Rosales
KIRAKIRA-Rosalesは、KoaフレームワークをベースにしたRESTfulなバックエンドAPIです。

APIリファレンスについては、[ルーティング](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/blob/develop/src/route/router.ts)を参照してください。
もっと詳しく知りたいですか？[Wikiを読む](https://deepwiki.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales)！

## 貢献
貢献してみませんか？[開発ドキュメント](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop/docs)を参照してください。

問題が発生しましたか？[こちら](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/issues)で解決策を探すか、Issueを作成してください。

## 開発
KIRAKIRA-Rosalesは、ローカルで実行可能な開発サーバーを提供します。
デフォルトでは、以下の手順で開発サーバーが起動し、ポート9999をリッスンします。

### インストール
このリポジトリをクローンするには、次のコマンドまたは他のGit互換ツールを使用します。
```
git clone https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales.git
```

クローンが完了したら、プロジェクトのルートディレクトリで次のコマンドを実行して、依存関係をインストールします。

```bash
npm install
```

### 環境変数の設定
> [!IMPORTANT]
> 以下のサンプルコードには、すべての環境変数が含まれているわけではありません。
> オペレーティングシステムによって、環境変数の設定方法は異なります。
> すべての環境変数とその説明については、[.env.powershell.temp](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/blob/develop/.env.powershell.temp)を参照してください。このファイルに記載されているほとんどの環境変数は必須です。

```Windows``` オペレーティングシステムを使用している場合
```powershell
# 以下はWindows PowerShellの例です
$env:SERVER_PORT="9999"
$env:SERVER_ENV="dev"
$env:SERVER_ROOT_URL="kirakira.moe"
...
```

```Linux``` オペレーティングシステムを使用している場合
```bash
# 以下はLinux Shellの例です
export SERVER_PORT="9999"
export SERVER_ENV="dev"
export SERVER_ROOT_URL="kirakira.moe"
...
```

環境変数の設定で問題が発生した場合は、[Issue](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/issues)または[Discussion](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/discussions)で回答を探すか、質問してください。


### バックエンドサービスの起動
> [!IMPORTANT]
> 開発モードでサービスを起動すると、コードはプロジェクトのルートディレクトリにある `.kirakira` ディレクトリにバンドルされます。
> 必要に応じて、package.jsonでバンドルパスを変更できます。[開発ドキュメント](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop/docs)を参照してください。

#### ローカルバックエンド開発サーバーの起動
プログラムのルートディレクトリで次のコマンドを実行して起動できます

```bash
npm run dev
```

または、キーボードで <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> を押し、`npm: dev` を選択します。

#### ローカルバックエンド開発ホットリロードサーバーの起動
プログラムのルートディレクトリで次のコマンドを実行して起動できます

```bash
npm run dev-hot
```

または、キーボードで <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> を押し、`npm: dev` を選択します。

上記のコマンドが正常に実行されると、ポート9999でリッスンするKIRAKIRA-Rosales開発サーバーが起動します。🎉
これをベースに、コードのレビュー、作成、貢献を通じてKIRAKIRAプロジェクトの開発に参加できます。

開発方法は？[開発ドキュメント](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop/docs)を参照してください。

問題が発生しましたか？[こちら](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/issues)で解決策を探すか、Issueを作成してください。

## ビルド / セルフホスティング
KIRAKIRA-Rosalesをビルドして、Node.jsがインストールされている任意のAMD64またはARM64インスタンスで実行できます。
また、DockerまたはDocker互換ツールを使用してコンテナイメージとしてパッケージ化することもできます。

### ビルド

#### 環境変数の設定
設定方法は、上記の開発モードと同じです。[環境変数の設定](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop?tab=readme-ov-file#%E5%BC%80%E5%8F%91)を参照してください。

#### アプリケーションのビルド
> [!IMPORTANT]
> この操作を実行すると、デフォルトですべての依存関係がインストールされていると見なされます。
> デフォルトでは、コードはプロジェクトのルートディレクトリにある `dist` ディレクトリにバンドルされます。
> 必要に応じて、tsconfig.jsonでバンドルパスを変更できます。その場合、以下の3番目の手順にあるサーバー起動コマンドのパスも変更する必要があります。

キーボードで <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> を押し、`npm: build` を選択します。

```bash
npm run build
```

### コンテナイメージとしてのパッケージ化（ベストプラクティス）
KIRAKIRA-Rosalesをデプロイするためのベストプラクティスは、K8sクラスタで実行することです。現在使用しているKIRAKIRA-Rosalesサービスもそのようにデプロイされています。
コンテナでのデプロイ方法については、[開発ドキュメント](https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Rosales/tree/develop/docs)を参照してください。

## License
BSD-3-Clause license
