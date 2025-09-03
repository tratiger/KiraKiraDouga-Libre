# KIRAKIRA☆DOUGA フロントエンドプロジェクト規約

## 概要
1. **JavaScript フレームワーク：**<wbr>Vue
1. **Vue API スタイル：**<wbr>Composition API [(?)](https://ja.vuejs.org/guide/introduction.html#single-file-components)
1. **型システムの使用：**<wbr>TypeScript
1. **Vue サーバーサイドレンダリングツール：**<wbr>Nuxt
1. **Vue ルーティング：**<wbr>Vue Router
1. **バンドルツール：**<wbr>Vite
1. **コード難読化ツール：**<wbr>terser、esbuild
1. **コード規約ツール：**<wbr>ESLint、Stylelint
1. **CSS プリプロセッサ：**<wbr>SCSS\
注：SCSSが分からなくても、純粋なCSSを書いてSCSS形式として宣言することができます。つまり、必要に応じてSCSSの機能を使用できます。
1. **ECMAScript 標準：**<wbr>ESNext、つまり最新の標準を使用します。分からなければ古い標準を使用しても構いません。
1. **モジュール化規約：**<wbr>ES Module。つまり、requireやその他ではなくimportを使用してモジュールをインポートします。
1. **パッケージマネージャ：**<wbr>NPM（**NEVER USE Yarn!**）
1. **ライセンス：**<wbr>BSD 3-Clause
1. **Babelは不要！**
## Vueファイルテンプレート
すべての内容は1レベルインデントします。
```html
<script lang="ts">
	// このscriptタグは必要な場合のみ
</script>

<script setup lang="ts">
	//
</script>

<template>
	<!-- -->
</template>

<style scoped lang="scss">
	/* */
</style>

```

## プロジェクトのディレクトリ構造
```
kirakira-douga               # プロジェクト名
	node_modules             # NPM モジュール、.gitignoreに入れるのを忘れずに
	dist                     # バンドルディレクトリ
	static                   # 静的ディレクトリ
		favicon.ico          # ファビコン
		index.html           # シングルページのHTML
		robots.txt           # 検索エンジンインデックス
		apple-touch-icon.png # Appleアイコン（本当に必要？）
		CNAME                # GitHub ドメイン解決
		sitemap.xml          # サイトマップ
	.nuxt                    # Nuxt 作業ディレクトリ
	assets                   # アセットディレクトリ：画像、音声、GIFなど
		img                  # 画像ディレクトリ
		icon                 # アイコンディレクトリ
		svg                  # SVG ディレクトリ
		fonts                # フォントディレクトリ
	components               # UIコンポーネント：スライダー、入力ボックスなど
	composables              # 再利用可能なコンポジションロジック
	content                  # コンテンツディレクトリ
	layouts                  # レイアウトディレクトリ
	middleware               # ミドルウェアディレクトリ
	modules                  # カスタムモジュールディレクトリ？
	pages                    # ルーティングページコンポーネント：ホームページ、再生ページなど
	plugins                  # プラグインディレクトリ
	utils                    # ユーティリティディレクトリ、雑多なts関数メソッドなど
	styles                   # グローバルスタイルディレクトリ
		global.scss          # 共通スタイル
		reset.scss           # リセットスタイル
	server                   # サーバーディレクトリ
	store                    # vuex ストアディレクトリ
	App.vue                  # ルートコンポーネント
	main.ts                  # プロジェクトのエントリポイント
	test                     # テストディレクトリ（任意）
	types                    # TypeScript 型定義追加ディレクトリ
		vue-shims.d.ts       # TypeScriptがVueファイルを認識できるようにする
	package.json             # プロジェクト情報、依存モジュール
	package-lock.json
	tsconfig.json            # TypeScript 設定ファイル
	.eslintrc.json           # ESLint 設定ファイル
	.eslintignore            # ESLint 無視ファイル
	.gitignore               # Git 無視ファイル
	.browserslistrc          # ブラウザ互換性設定ファイル
	LICENSE                  # ライセンス、我々はGPLライセンスを使用
	README.MD                # プロジェクト説明、GitHubで表示
	nuxt.config.js           # Nuxt、Vue、Webpack 設定ファイル
```

## プラグイン
1. autoprefixer：CSSプレフィックスを自動追加
1. 追記待ち……
## 命名規則
### ファイル名
1. **プロジェクト名：**<wbr />すべて小文字、ハイフン区切り。例：*kirakira-douga*。
1. **ディレクトリ名：**<wbr />すべて小文字、ハイフン区切り。完全な単語で複数形にできる場合は複数形にし、略語の場合は複数形にしない。例：*docs、assets、components*。
1. **画像ファイル名：**<wbr />すべて小文字、アンダースコア区切り。例：*menu_aboutus.gif、menutitle_news.gif、pic_people.jpg、pic_TV.jpg*。
1. **HTML ファイル名：**<wbr />すべて小文字、アンダースコア区切り。例：*error_report.html、success_report.html*。
1. **SCSS ファイル名：**<wbr />すべて小文字、ハイフン区切り。例：*normalize.scss、base.scss*。
1. **デフォルトエクスポートがないTypeScriptモジュールファイル名：**<wbr />すべて小文字、ハイフン区切り。例：*index.ts、transition-variables.ts、export-plugin.ts*。
1. **デフォルトエクスポートがあるTypeScriptモジュールファイル名：**<wbr />デフォルトエクスポートされるモジュールの変数名とその形式で命名。
1. **TypeScript クラス / enum / 抽象クラス / インターフェースモジュール名：**<wbr />パスカルケース。デフォルトエクスポートされるクラスモジュール名で命名。
1. **Vue コンポーネント名：**<wbr />パスカルケース。コンポーネント名で命名。例：*MyComponent.vue、CustomCard.vue*。
### 変数名
#### TypeScript
1. **クラス (class) 名：**<wbr />パスカルケース。例：*Video、Json、Midi*。
1. **メソッド (method) / 関数 (function) / アロー関数 (lambda) 名：**<wbr />キャメルケース。動詞または動詞+名詞の形式を使用。例：*play()、getValue()、setName()*。
1. **変数名：**<wbr />キャメルケース。例：*title、age、password*。
1. **ブール型変数名：**<wbr />キャメルケース。is + 名詞 / 形容詞 / 副詞または動詞の過去分詞の形式を使用。例：*isMale、isShown、isWatched、isVip、isPoorVip*。
1. **配列変数名：**<wbr />キャメルケース。名詞の複数形を使用。例：*videos、songs、controls*。
1. **抽象クラス (abstract) 名：**<wbr />パスカルケース。Baseで始まる。例：*BaseButton、BaseFile*。
1. **インターフェース (interface) 名：**<wbr />パスカルケース。Iで始まる。例：*IConfig、IController*。注意：クラス実装として使用されるインターフェースのみ。型名と交換可能なインターフェースについては、型名と同じ命名規則に従う。
1. **型 (type) 名：**<wbr />パスカルケース。例：*Prop、State、ControlType*。
1. **enum 名：**<wbr />パスカルケース。Typeで終わる。例：*UserType、ImageType*。
1. **定数名：**<wbr />すべて大文字、アンダースコア区切り。例：*MAX_COUNT、GUEST_USER_NAME*。
1. **プライベートクラスメンバー、メソッド名：**<wbr />#で始まる。例：*#privateValue、#getSomethingPrivately()*。
1. **カスタム名前空間：**<wbr />パスカルケース。NSで終わる。例：*MyVueNS、ConfigNS*。
#### SCSS
1. **class 名：**<wbr />すべて小文字、ハイフン区切り。（検討の余地あり。オブジェクト内で引用符が別途必要になるため。）
1. **id と ref 名：**<wbr />キャメルケース。例：*videoSidebar*。
1. **key 名：**<wbr />すべて小文字、ハイフン区切り。例：*list-item-1、menu-item-2*。
1. **CSS カスタムプロパティ名：**<wbr />すべて小文字、ハイフン区切り。「--」で始まる。例：*--accent-color、--title-font-size*。
1. **SCSS カスタム変数名：**<wbr />すべて小文字、ハイフン区切り。「$」で始まる。例：*$accent-color、$title-font-size*。
#### Vue
1. **name：**<wbr />パスカルケース。例：*TodoList、LoginWindow*。
1. **prop：**<wbr />命名にはキャメルケースを使用し、テンプレート内ではすべて小文字のハイフン区切りを使用。
1. **router：**<wbr />すべて小文字、ハイフン区切り。例：*/user-info*。
1. **カスタムイベントメソッド/子から親へのコールバック関数：**<wbr />キャメルケース。~~on + 対応するイベント名を使用。例：*onClick、onHover、onKeydown、onMenuItemClick*。~~<wbr />onを付けないでください。onOn*になってしまいます。

**注意：**<wbr />略語は1つの単語として扱う。例：*XmlHttpRequest、getElementById、getJson*。
## コーディング規約（Lint）
### HTML
1. すべての空要素タグは自己終了させる。
	```html
	<!-- bad -->
	<input type="text">

	<!-- good -->
	<input type="text" />
	```
1. `<html lang="zh-cmn-Hans-CN">`\
互換性を確保するため、完全に記述すべき。zhは中国語、cmnは北京語、Hansは簡体字、CNは中国大陸を意味する。

1. カスタムVueコンポーネントはパスカルケースで命名し、HTML組み込みタグと区別する。HTML組み込みタグはすべて小文字にすべき。
1. 属性の引用符は省略してはならない。
1. タグの属性がxxx(追記待ち)文字以内の場合は1行で書き、それ以上の場合は複数行に分けて1行に1属性を書く。
	```html
	<!-- one line -->
	<MyComponent width="320" height="180" />

	<!-- multi lines -->
	<MyComponent
		width="320" <!-- 最初の属性をタグ名の後に置かない -->
		height="180"
		title="Some Title"
		background-color="green"
		:style="myStyle"
	/> <!-- 閉じ括弧は単独の行に置く -->
	```
1. template内で、自己終了タグとして書ける場合は、閉じタグを分けて書かない。
	```html
	<!-- bad -->
	<MyComponent></MyComponent>
	<!-- good -->
	<MyComponent />
	```
1. コメントの矢印の内側にそれぞれ1つのスペースを追加する。
	```html
	<!--bad-->
	<!-- good -->
	```

### SCSS
1. 可能であれば、CSSプロパティではなくSCSS変数を使用する。要素に関連する場合や、TSで動的に調整する場合にのみCSSプロパティを使用する。
	```scss
	// SCSS変数はスコープ内でのみ有効で、要素に依存する必要はない。
	.my-component {
		$size: 100px;
		width: $size;
		height: $size;

		$color: red;
		color: red;
		&:hover {
			color: white;
			background-color: $color;
		}
	}

	// この場合、SCSS変数は有効にならず、対応する要素のCSSプロパティに依存する必要がある。
	@keyframes my-animation {
		from {
			transform: rotate(var(--angle));
		}
		to {
			transform: rotate(0);
		}
	}
	```

1. `@keyframes` アニメーションが開始と終了の2つのキーフレームしかない場合は、それぞれfromとtoと命名し、それ以外の場合は0%と100%と命名する。
	```scss
	@keyframe two-keyframes {
		from { /* */ }
		to { /* */ }
	}

	@keyframe three-keyframes {
		0%, 100% { /* */ }
		50% { /* */ }
	}
	```

1. `@import` を使って外部CSSファイルをインポートしない。ただし、SCSSファイルはインポートできる。前者は追加の非同期ネットワーク取得コストが発生するが、後者はコンパイル時に自動的にバンドルされる。
1. 数値0については、単位を付けない。反例：0px、0rem。例外：0s、0ms。
1. 空のルールセットを使用しない。VSCodeで警告が表示される。どうしても使用する必要がある場合は、以下のgood形式に変更する。
	```scss
	// bad
	div {
		/* すべてコメントアウトされたルール宣言 */
	}

	// good
	/* div {
		すべてコメントアウトされたルール宣言
	} */
	```

1. ブロックコメント記号の内側にそれぞれ1つのスペースを追加し、行コメントの前（コードの後）または後（行頭）に1つのスペースを追加する。
1. 色の値は16進数形式で書く。可能であれば、3桁または4桁の色値で書く。
	```scss
	* {
		// bad
		color: rgb(254, 254, 254);
		color: hsl(0, 0%, 100%);
		color: hwb(0 100% 0%);
		color: rgba(254, 254, 254, 0.96);
		color: rgb(254, 254, 254 / 96%);
		// good
		color: #fefefe;
		color: #fefefef5;

		// bad
		color: #4488cc;
		color: #4488ccff;
		// good
		color: #48c;
		color: #48cf;
	}
	```

1. 各ブラウザのプライベートプロパティ（`-webkit、-moz、-ms、-o`）を追加する必要はない。これらはプラグインが処理する。
### Vue
1. data（データ）。参照渡し（`typeof obj === "object"`、`null`を除く）のデータにはreactive()を、値渡し（プリミティブ型）のデータにはref()を使用する。
	```typescript
	// オブジェクト、reactive()を使用
	const user = reactive({
		name: "Aira",
		age: new Date().getFullYear() - 2003,
	});

	// プリミティブ型、ref()を使用
	const year = ref<number | string>("2023");

	// 初期値を指定しない
	const value = ref<number>();
	// この時、valueの型は number | undefined。
	```

1. methods（メソッド）。直接関数を定義する。
	```typescript
	function increment() {
		state.count++;
	}
	```

1. computed（算出プロパティ）。
	```typescript
	// 読み取り専用プロパティ
	const now = computed(() => Date.now());

	// 書き込み可能プロパティ
	const realQiaobiluoAge = ref(58);
	const qiaobiluoAge = computed({
		get(): number {
			return realQiaobiluoAge - 29;
		},
		set(value: number): void {
			realQiaobiluoAge.value = value + 29;
		},
	});
	```

1. mounted、unmounted、updatedなどの組み込み関数。vue名前空間から**プラグインによって自動的に**取得される。
	```typescript
	import { onMounted } from "vue";

	onMounted(() => {
		// DOMの直接操作、またはVueをサポートしていないサードパーティモジュールの呼び出し。例：videojs。
	});
	```

1. components（コンポーネント）、composables（再利用可能なコンポジションロジック）。importせずに直接使用する。

1. props（プロパティ、HTMLタグのattrに似ている）。Vue独自の型注釈ではなく、TypeScriptの型注釈を使用する。
	```typescript
	interface Props {
		foo: string;
		bar?: number;
	}

	// デフォルト値なし
	const props = defineProps<Props>();

	// デフォルト値あり
	const props = withDefaults(defineProps<Props>(), {
		foo: "hello",
	});
	```

1. ref（参照）。~~nullで初期化すべき。~~<wbr />undefinedであればよい。
	```html
	<script setup lang="ts">
		import MyComponent from "./MyComponent.vue";

		const myDiv = ref<HTMLDivElement>();
		// 変数名とref名が一致。
		const myComponent = ref<InstanceType<typeof MyModal>>();
		// カスタムコンポーネントの参照の書き方。
	</script>
	<template>
		<div ref="myDiv"></div>
		<MyComponent ref="myComponent" />
	</template>
	```

1. nextTick（次のティック）の正しい書き方。
	```typescript
	import { nextTick } from "vue";

	async function myFunction() { // まず関数をasyncとしてマーク。
		// 更新前
		await nextTick();
		// 更新後
	}
	```

1. テンプレートに複雑な構文（単純なラムダ式を除く）を書かず、算出プロパティに変換する。
1. ファイルの末尾に空行を1行追加する！
### TypeScript
1. **インデント形式：TAB（タブ）**。
	```typescript
	// 三項演算子のネストの書き方
	const result =
		arg === 0 ? a :
		arg === 1 ? b :
		arg === 2 ? c : d;

	// switch caseの書き方
	switch (score) {
		case 100:
		case 90:
			break; // caseは1レベルインデント、中の内容はさらに1レベルインデント。
		case 80: { // caseのトップレベルで変数を定義する必要がある場合は、内容を中括弧で囲む。
			const foo = "bar";
			break; // できるだけswitchのフォールスルーは避ける。必要な場合はeslintのマークがある。
		}
		default: // defaultを省略しない。
			break;
	}

	// インデントにTABを使用する利点は、編集者が好きなインデント幅で表示できること。
	// 変数、プロパティ、フィールド、コメントなどを決して揃えない。

	// bad
	let width  =   160,                    // width  value
		height =    90,                    // height value
		size   = 14400;                    // size   value
	// good
	let width = 160, // width value
		height = 90, // height value
		size = 14400; // size value

	// 以下の形式が見にくいと感じる場合
	const a = 0,
		b = 0,
		c = 0;
	// 以下のように修正してください
	const
		a = 0,
		b = 0,
		c = 0;
	```

1. 行末形式：LF（Linux）。\
~~理由は正規表現で行末をマッチさせる際に\r\nと書くのが面倒だから。~~
1. **引用符：ダブルクォートを優先。**<wbr />HTML attrのダブルクォート内や、文字列にダブルクォートのみが含まれる場合にのみシングルクォートに変更。文字列に変数を含める必要がある場合にのみテンプレートリテラル（バッククォート）を使用。複数行の文字列を含める必要がある場合は、テンプレートリテラルを使用しない。文字列の前のインデントが結果に含まれてしまい見栄えが悪くなること、コード圧縮ツールに問題を引き起こす可能性があるため。
	```typescript
	// bad
	foo = 'bar';
	foo = `bar`;
	foo = `hello

	world`;

	// good
	foo = "bar";
	foo = '<input type="text" value="bar" />';
	foo = `<input type="text" value=${bar}>`;
	foo = "hello\n\nworld";
	```

1. 常に行末にセミコロンを付ける。~~理由はJS、Python以外の言語も書く可能性があり、混乱しやすいため。~~<wbr />ただし、function、class、enum、interface、namespaceを定義する際にはセミコロンを付けないが、無名関数、アロー関数、クラス式を書く際にはセミコロンを付ける。~~要するに、コンパイラがセミコロンが足りない、または多すぎると指摘した箇所を修正すればよい。~~
	```typescript
	// セミコロンを付ける
	const foo = "bar";
	const foo = () => "bar";
	const foo = () => { return "bar"; }; // 内外両方にセミコロンを付ける。
	const foo = function () { return "bar"; };
	const Foo = class { };
	const foo = {
		bar: "bar",
		baz: false,
	};
	$("#foo").click(function () {
		$(this).text("bar");
	});

	// セミコロンを付けない（末尾を見てください、メンバー変数ではありません）
	function foo() {
		return "bar";
	}
	class Foo {
		bar: number;
	}
	enum FooType {
		BAR,
	}
	interface IFoo {
		bar: number;
	}
	```

1. 1行で書く場合、中括弧の内側にスペースを追加する。他の括弧は不要。
	```typescript
	const foo = { };
	function foo() { }
	const foo = { bar: "bar" };
	function foo() { return "bar"; }
	const foo = ["bar"];
	```

1. 1行の場合は末尾にコンマを付けず、複数行の場合は常に末尾にコンマを付ける。
	```typescript
	foo = [1, 2, 3];
	foo = { bar: 1, baz: 2 };
	foo = bar(1, 2, 3);
	enum FooType { BAR, BAZ }

	foo = [
		1,
		2,
		3,
	];
	foo = {
		bar: 1,
		baz: 2,
	};
	foo = bar(
		1,
		2,
		3,
	);
	enum FooType {
		BAR, BAZ,
	}
	```

1. ファイルの末尾に空行を1行追加する！
1. switchに重複するcaseを含めない。
1. 三重等号「===」のみを使用し、二重等号「==」は使用しない。
1. 数字を小数点で始めたり終えたりしない。
	```typescript
	// bad
	[.25, 25.]
	// good
	[0.25, 25]
	```

1. 0で始まる8進数表記を使用しない。代わりに0oで始める。
	```typescript
	// bad
	017
	// good
	0o17

	// その他
	0b11 // 2進数
	0xab // 16進数
	```

1. parseIntを使用する際は、常に基数を指定する。
	```typescript
	let value = "017";
	// bad
	parseInt(value); // 8進数に誤って変換される。
	// good
	parseInt(value, 10); // 10進数であることを指定。顧客が製品をどう使うかは予測できない。
	```

1. インデントにタブとスペースを混在させない。
1. ブロックコメントの内側にそれぞれ1つのスペースを追加し、行頭・行末でない場合は前後に1つのスペースを追加する。行コメントの後ろに1つのスペースを追加し、行頭でない場合は前に1つのスペースを追加する。
	```typescript
	/* ブロックコメント */
	コード /* ブロックコメント */ コード

	// 行コメント
	コード // 行コメント

	/**
	* JSDocコメント、たくさん書くこと！
	*/

	// 以下のコメントはすべて合法だが、絶対に使用しないこと。
	<!-- ブロックコメントに見えるが、
	--> 実際は行コメント。
	#! これはファイルの先頭でのみ使用可能。
	```

1. varを使用せず、letとconstを代わりに使用する。\
letとconstのどちらを使うか？**常にconstを使用**し、変数の再代入が必要な場合（constを使用してエラーが出た場合）にのみletを使用する。
1. any型を使用しない。AnyScriptを書かない。就像不要做「音MIDI」。\
常にTypeScriptで型を正しく推論させる。適切なアサーションは可。
1. 空のブロックスコープ（中括弧）を作成しない。
1. 条件判断に定数値を使用しない。ただしループは除く。
1. 以下の挙動は紛らわしいので、できるだけ避けるが、不可能ではない。
	```typescript
	do {
		if (true)
			break;
	} while (false);

	for (const element of array) {
		switch (element) {
			case someValue:
				continue;
			default:
				break;
		}
	}

	loop: for (let i = 0; i < array.length; i++)
		for (let j = 0; j < array[i].length; j++)
			if (array[i][j])
				continue loop;
	```

1. if、for、whileなどが1つの文しか含まない場合は中括弧を付けず、複数の文を含む場合は常に中括弧を付ける。
1. できるだけすべてをモジュール化し、分割できるものは分割する。

## .eslintrc.js の例
## .editorconfig の例
## tsconfig.json の例
## .gitignore の例
上記の4つのセクションは、左側のプロジェクトで直接見つけてください。

## 参考
* [史上最も完全な Vue フロントエンドコードスタイルガイド](https://juejin.cn/post/6987349513836953607)
* [vue プロジェクト開発規範](https://www.cnblogs.com/zxr1002/p/16846234.html)
