[![@nuxtjs/color-mode](https://color-mode.nuxtjs.org/cover.jpg)](https://color-mode.nuxtjs.org)

# @KIRAKIRA-DOUGA/theme

> 元のプロジェクト名：**@nuxtjs/color-mode**
>
> Nuxtを使用して、自動検出される🌑ダークモードと🌕ライトモードを簡単に実装します。

KIRAKIRAのテーマカラーモードモジュールは、公式のNuxt Color Modeモジュールを基に改造したものです。

ダーク/ライトモードとシステム自動設定に加えて、テーマカラーの変更設定が追加されています。

オリジナル版公式サイト：[@nuxtjs/color-mode](https://color-mode.nuxtjs.org/)

[![nuxt-color-mode](https://user-images.githubusercontent.com/904724/79349768-f09cf080-7f36-11ea-93bb-20fae8c94811.gif)](https://color-mode.nuxtjs.app/)

---

### 注意：
20240209 @cfdxkk がこの部分を書き直しました

現在、新しい、同期可能で、永続的で、（可能な限り）ちらつきのないユーザーテーマ設定項目を追加したい場合は、状態管理の混乱を避けるため、以下の手順に従って正しい場所にコードを記述する必要があります。

1. `modules\theme\cookieBinding.ts` の `HACK 1 在此处添加` とマークされたコメントの前に空行を作成し、グローバル変数を追加します。変数名と値は `HACK 3 在此处添加` の位置に追加するローカル変数と一致させる必要があります。
2. `modules\theme\cookieBinding.ts` の `HACK 2 在此处添加` とマークされたコメントの前に空行を作成し、グローバル変数を追加します。変数名と値は `HACK 4 在此处添加` の位置に追加するローカル変数と一致させる必要があります。
3. `modules\theme\cookieBinding.ts` の `HACK 3 在此处添加` とマークされたコメントの前に空行を作成し、ローカル変数を追加します。変数名と値は `HACK 1 在此处添加` の位置に追加したグローバル変数と一致させる必要があります。
4. `modules\theme\cookieBinding.ts` の `HACK 4 在此处添加` とマークされたコメントの前に空行を作成し、ローカル変数を追加します。変数名と値は `HACK 2 在此处添加` の位置に追加したグローバル変数と一致させる必要があります。
5. `modules\theme\composables.ts` の `HACK 5 在此处添加` とマークされたコメントの前に空行を作成し、nuxtのリアクティブなcookieオブジェクトを取得するコードを記述します。
6. `modules\theme\composables.ts` の `HACK 6 在此处添加` とマークされたコメントの前に空行を作成し、バックエンドからのリクエスト結果をnuxtのリアクティブなcookieオブジェクトに代入するコードを記述します。
7. `modules\theme\composables.ts` の `HACK 7 在此处添加` とマークされたコメントの前に空行を作成し、バックエンドからのリクエスト結果を代入するコードを記述します。デフォルト値を設定することを忘れないでください。
8. `modules\theme\composables.ts` の `HACK 8 在此处添加` とマークされたコメントの前に空行を作成し、バックエンドからのリクエスト結果をcookieに保存するコードを記述します。
9. `modules\theme\cookieBinding.ts` の `HACK 9 在此处添加` とマークされたコメントの前に空行を作成し、正しい変数名を定義します。
10. `modules\theme\cookieBinding.ts` の `HACK 10 在此处添加` とマークされたコメントの前に空行を作成し、localStorageからユーザー設定を取得して変数に代入するコードを記述します。デフォルト値を忘れないでください。
11. `modules\theme\cookieBinding.ts` の `HACK 11 在此处添加` とマークされたコメントの前に空行を作成し、変数をcookieに追加するコードを記述します。nullチェックを忘れないでください。
12. `modules\theme\cookieBinding.ts` の `HACK 12 在此处添加` とマークされたコメントの前に空行を作成し、cookieからユーザー設定を取得して変数に代入するコードを記述します。デフォルト値を忘れないでください。
13. `modules\theme\cookieBinding.ts` の `HACK 13 在此处添加` とマークされたコメントの前に空行を作成し、変数をlocalStorageに追加するコードを記述します。nullチェックを忘れないでください。
14. `modules\theme\cookieBinding.ts` の `HACK 14 在此处添加` とマークされたコメントの前に空行を作成し、変数の値に基づいて正しいスタイルを正しい場所にバインドするコードを記述します。
15. `modules\theme\composables.ts` の `HACK 15 请参照此部分 ↓ ↓ ↓` と `HACK 15 请参照此部分 ↑ ↑ ↑` の間のコードを参照し、`HACK 15 在此处添加` のコメントの前に空行を作成して、ユーザー設定の変更をバックエンドに送信するリクエストメソッドを記述します。
16. `pages\settings\appearance.vue` の `HACK 16 请参照此部分 ↓ ↓ ↓` と `HACK 16 请参照此部分 ↑ ↑ ↑` の間のコードを参照し、nuxt cookieオブジェクトを作成し、追加したい設定項目に対応するvueテンプレートのスイッチや他のセレクタにバインド（v-model）します。
