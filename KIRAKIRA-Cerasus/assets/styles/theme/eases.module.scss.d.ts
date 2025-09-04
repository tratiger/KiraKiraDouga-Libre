export type Styles = {
	/**
	 * ### リニア
	 * 同じ速度で開始から終了まで続くトランジション効果 `t`。
	 */
	linear: string;
	/**
	 * ### アプローチリニア
	 * リニア効果とほぼ同じ `1t`。
	 */
	linearApproach: string;
	/**
	 * ### ステップスタート
	 * トランジション中に補間値が即座に最終状態にジャンプし、終了までその状態を維持します `ceil(t)`。
	 */
	stepStart: string;
	/**
	 * ### ステップエンド
	 * トランジション中に補間値が初期状態を維持し、終了時に直接最終状態にジャンプします `floor(t)`。
	 */
	stepEnd: string;
	/**
	 * ### ステップスタート
	 * トランジション中に補間値が即座に最終状態にジャンプし、終了までその状態を維持します `ceil(t)`。\
	 * `stepStart` と同じです。
	 */
	cutOut: string;
	/**
	 * ### ステップエンド
	 * トランジション中に補間値が初期状態を維持し、終了時に直接最終状態にジャンプします `floor(t)`。\
	 * `stepEnd` と同じです。
	 */
	cutIn: string;
	/**
	 * ### イーズイン
	 * ゆっくりと始まるトランジション効果。
	 */
	easeIn: string;
	/**
	 * ### イーズインクアッド
	 * 2次関数のイージング `t²`。
	 */
	easeInQuad: string;
	/**
	 * ### イーズインキュービック
	 * 3次関数のイージング `t³`。
	 */
	easeInCubic: string;
	/**
	 * ### イーズインクォート
	 * 4次関数のイージング `t⁴`。
	 */
	easeInQuart: string;
	/**
	 * ### イーズインクイント
	 * 5次関数のイージング `t⁵`。
	 */
	easeInQuint: string;
	/**
	 * ### イーズインサイン
	 * 正弦曲線のイージング `sin(t)`。
	 */
	easeInSine: string;
	/**
	 * ### イーズインエクスポ
	 * 指数曲線のイージング `2ᵗ`。
	 */
	easeInExpo: string;
	/**
	 * ### イーズインサーク
	 * 円曲線のイージング `√(1-t²)`。
	 */
	easeInCirc: string;
	/**
	 * ### イーズインバック
	 * 範囲を超える3次関数のイージング `(s+1)t³-st²`。
	 */
	easeInBack: string;
	/**
	 * ### イーズインバックスムース
	 * 範囲を超えた後、滑らかに終了するイージング `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeInBackSmooth: string;
	/**
	 * ### イーズインマックス
	 * アンカーポイントを最大限に引き寄せるイージング `(½+cos((acos(1-2t)-2π)/3))³`。
	 */
	easeInMax: string;
	/**
	 * ### イーズインジャンプ
	 * 初期の「Bad Gun」でよく使われたイージングで、「無限大に近い」速度から徐々に減速する変化があります `(∛(t-1)+1)³`。
	 */
	easeInJump: string;
	/**
	 * ### イーズインスムース
	 * デザイナーAiraによって丁寧に調整された滑らかなイージングパラメータ。
	 */
	easeInSmooth: string;
	/**
	 * ### マテリアルデザイン強調イーズイン
	 * Google Material Design 3の強調イージングで、Material Design 3の表現スタイルを捉えています。
	 */
	easeInMaterialEmphasized: string;
	/**
	 * ### マテリアルデザイン標準イーズイン
	 * Google Material Design 3の標準イージングで、シンプル、小型、または実用性中心のトランジションに使用されます。
	 */
	easeInMaterialStandard: string;
	/**
	 * ### イーズインバウンス
	 * 地面にぶつかって跳ね返るようなイージング。
	 */
	easeInBounce: string;
	/**
	 * ### イーズインエラスティック
	 * 減衰調和振動のようなイージング `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeInElastic: string;
	/**
	 * ### イーズインオーバーシュートソフト
	 */
	easeInOvershootSoft: string;
	/**
	 * ### イーズインオーバーシュートファーム
	 */
	easeInOvershootFirm: string;
	/**
	 * ### イーズインオーバーシュートスムース
	 */
	easeInOvershootSmooth: string;
	/**
	 * ### イーズインオーバーシュートダイナミック
	 */
	easeInOvershootDynamic: string;
	/**
	 * ### イーズインオーバーシュートドラマチック
	 */
	easeInOvershootDramatic: string;
	/**
	 * ### イーズアウト
	 * ゆっくりと始まるトランジション効果。
	 */
	easeOut: string;
	/**
	 * ### イーズアウトクアッド
	 * 2次関数のイージング `t²`。
	 */
	easeOutQuad: string;
	/**
	 * ### イーズアウトキュービック
	 * 3次関数のイージング `t³`。
	 */
	easeOutCubic: string;
	/**
	 * ### イーズアウトクォート
	 * 4次関数のイージング `t⁴`。
	 */
	easeOutQuart: string;
	/**
	 * ### イーズアウトクイント
	 * 5次関数のイージング `t⁵`。
	 */
	easeOutQuint: string;
	/**
	 * ### イーズアウトサイン
	 * 正弦曲線のイージング `sin(t)`。
	 */
	easeOutSine: string;
	/**
	 * ### イーズアウトエクスポ
	 * 指数曲線のイージング `2ᵗ`。
	 */
	easeOutExpo: string;
	/**
	 * ### イーズアウトサーク
	 * 円曲線のイージング `√(1-t²)`。
	 */
	easeOutCirc: string;
	/**
	 * ### イーズアウトバック
	 * 範囲を超える3次関数のイージング `(s+1)t³-st²`。
	 */
	easeOutBack: string;
	/**
	 * ### イーズアウトバックスムース
	 * 範囲を超えた後、滑らかに終了するイージング `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeOutBackSmooth: string;
	/**
	 * ### イーズアウトマックス
	 * アンカーポイントを最大限に引き寄せるイージング `3∛t²-2t`。
	 */
	easeOutMax: string;
	/**
	 * ### イーズアウトジャンプ
	 * 初期の「Bad Gun」でよく使われたイージングで、「無限大に近い」速度から徐々に減速する変化があります `(∛t-1)³+1`。
	 */
	easeOutJump: string;
	/**
	 * ### イーズアウトスムース
	 * デザイナーAiraによって丁寧に調整された滑らかなイージングパラメータ。
	 */
	easeOutSmooth: string;
	/**
	 * ### Fluentデザイン強調イーズアウト
	 * Microsoft Windows 11 Fluent 2で強調に使用されるイージングで、タスクバーアイコンのジャンプなどに使われます。
	 */
	easeOutFluentStrong: string;
	/**
	 * ### マテリアルデザイン強調イーズアウト
	 * Google Material Design 3の強調イージングで、Material Design 3の表現スタイルを捉えています。
	 */
	easeOutMaterialEmphasized: string;
	/**
	 * ### マテリアルデザイン標準イーズアウト
	 * Google Material Design 3の標準イージングで、シンプル、小型、または実用性中心のトランジションに使用されます。
	 */
	easeOutMaterialStandard: string;
	/**
	 * ### イーズアウトスプリング
	 * ばねのようなイージング。
	 */
	easeOutSpring: string;
	/**
	 * ### イーズアウトバウンス
	 * 地面にぶつかって跳ね返るようなイージング。
	 */
	easeOutBounce: string;
	/**
	 * ### イーズアウトエラスティック
	 * 減衰調和振動のようなイージング `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeOutElastic: string;
	/**
	 * ### バウンス化したスプリングイーズアウト
	 * ばねのようなイージングですが、バウンス化されています。
	 */
	easeOutSpringBouncized: string;
	/**
	 * ### エラスティック化したバウンスイーズアウト
	 * 地面にぶつかって跳ね返るようなイージングですが、エラスティック化されています。
	 */
	easeOutBounceElasticized: string;
	/**
	 * ### バウンス化したエラスティックイーズアウト
	 * 減衰調和振動のようなイージング `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1` ですが、バウンス化されています。
	 */
	easeOutElasticBouncized: string;
	/**
	 * ### イーズアウトスプリングヘビー
	 */
	easeOutSpringHeavy: string;
	/**
	 * ### イーズアウトスプリングバウンシー
	 */
	easeOutSpringBouncy: string;
	/**
	 * ### イーズアウトスプリングドロップ
	 */
	easeOutSpringDrop: string;
	/**
	 * ### イーズアウトスプリンググライド
	 */
	easeOutSpringGlide: string;
	/**
	 * ### イーズアウトスプリングスナップ
	 */
	easeOutSpringSnap: string;
	/**
	 * ### イーズアウトスプリングレイジー
	 */
	easeOutSpringLazy: string;
	/**
	 * ### イーズアウトスプリングエラスティック
	 */
	easeOutSpringElastic: string;
	/**
	 * ### イーズアウトバウンスファーム
	 */
	easeOutBounceFirm: string;
	/**
	 * ### イーズアウトバウンスソフト
	 */
	easeOutBounceSoft: string;
	/**
	 * ### イーズアウトバウンスシャープ
	 */
	easeOutBounceSharp: string;
	/**
	 * ### イーズアウトバウンスサブトル
	 */
	easeOutBounceSubtle: string;
	/**
	 * ### イーズアウトバウンスプレイフル
	 */
	easeOutBouncePlayful: string;
	/**
	 * ### イーズアウトバウンススプリンギー
	 */
	easeOutBounceSpringy: string;
	/**
	 * ### イーズアウトオーバーシュートソフト
	 */
	easeOutOvershootSoft: string;
	/**
	 * ### イーズアウトオーバーシュートファーム
	 */
	easeOutOvershootFirm: string;
	/**
	 * ### イーズアウトオーバーシュートスムース
	 */
	easeOutOvershootSmooth: string;
	/**
	 * ### イーズアウトオーバーシュートダイナミック
	 */
	easeOutOvershootDynamic: string;
	/**
	 * ### イーズアウトオーバーシュートドラマチック
	 */
	easeOutOvershootDramatic: string;
	/**
	 * ### イージング
	 * ゆっくりと始まるトランジション効果。
	 */
	ease: string;
	/**
	 * ### イーズインアウト
	 * ゆっくりと始まるトランジション効果。
	 */
	easeInOut: string;
	/**
	 * ### イーズインアウトクアッド
	 * 2次関数のイージング `t²`。
	 */
	easeInOutQuad: string;
	/**
	 * ### イーズインアウトキュービック
	 * 3次関数のイージング `t³`。
	 */
	easeInOutCubic: string;
	/**
	 * ### イーズインアウトクォート
	 * 4次関数のイージング `t⁴`。
	 */
	easeInOutQuart: string;
	/**
	 * ### イーズインアウトクイント
	 * 5次関数のイージング `t⁵`。
	 */
	easeInOutQuint: string;
	/**
	 * ### イーズインアウトサイン
	 * 正弦曲線のイージング `sin(t)`。
	 */
	easeInOutSine: string;
	/**
	 * ### イーズインアウトエクスポ
	 * 指数曲線のイージング `2ᵗ`。
	 */
	easeInOutExpo: string;
	/**
	 * ### イーズインアウトサーク
	 * 円曲線のイージング `√(1-t²)`。
	 */
	easeInOutCirc: string;
	/**
	 * ### イーズインアウトバック
	 * 範囲を超える3次関数のイージング `(s+1)t³-st²`。
	 */
	easeInOutBack: string;
	/**
	 * ### イーズインアウトバックスムース
	 * 範囲を超えた後、滑らかに終了するイージング `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeInOutBackSmooth: string;
	/**
	 * ### イーズインアウトマックス
	 * アンカーポイントを最大限に引き寄せるイージング `3∛t²-2t`。
	 */
	easeInOutMax: string;
	/**
	 * ### イーズインアウトジャンプ
	 * 初期の「Bad Gun」でよく使われたイージングで、「無限大に近い」速度から徐々に減速する変化があります `(∛t-1)³+1`。
	 */
	easeInOutJump: string;
	/**
	 * ### イーズインアウトスムース
	 * デザイナーAiraによって丁寧に調整された滑らかなイージングパラメータ。
	 */
	easeInOutSmooth: string;
	/**
	 * ### イーズインアウトアンティシペート
	 * イージングの前に予備的なバウンスがあり、その後はありません。
	 */
	easeInOutAnticipate: string;
	/**
	 * ### Fluentデザインポイントツーポイントイーズインアウト
	 * Microsoft Windows 11 Fluent 2でポイントツーポイントに使用されるイージングで、ウィンドウの最大化や復元などに使われます。
	 */
	easeInOutFluent: string;
	/**
	 * ### マテリアルデザイン強調イーズインアウト
	 * Google Material Design 3の強調イージングで、Material Design 3の表現スタイルを捉えています。
	 */
	easeInOutMaterialEmphasized: string;
	/**
	 * ### マテリアルデザイン標準イーズインアウト
	 * Google Material Design 3の標準イージングで、シンプル、小型、または実用性中心のトランジションに使用されます。
	 */
	easeInOutMaterialStandard: string;
	/**
	 * ### イーズインアウトバウンス
	 * 地面にぶつかって跳ね返るようなイージング。
	 */
	easeInOutBounce: string;
	/**
	 * ### イーズインアウトエラスティック
	 * 減衰調和振動のようなイージング `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeInOutElastic: string;
	/**
	 * ### イーズインアウトオーバーシュートソフト
	 */
	easeInOutOvershootSoft: string;
	/**
	 * ### イーズインアウトオーバーシュートファーム
	 */
	easeInOutOvershootFirm: string;
	/**
	 * ### イーズインアウトオーバーシュートスムース
	 */
	easeInOutOvershootSmooth: string;
	/**
	 * ### イーズインアウトオーバーシュートダイナミック
	 */
	easeInOutOvershootDynamic: string;
	/**
	 * ### イーズインアウトオーバーシュートドラマチック
	 */
	easeInOutOvershootDramatic: string;
	/**
	 * ### イージング
	 * ゆっくりと始まり、速くなり、そしてゆっくりと終わるトランジション効果。\
	 * これは `ease` の逆の動きです。
	 */
	easeInOutOdd: string;
	/**
	 * ### Fluentデザインポイントツーポイントイーズアウトイン
	 * Microsoft Windows 11 Fluent 2でポイントツーポイントに使用されるイージングで、ウィンドウの最大化や復元などに使われます。
	 */
	easeInOutOddFluent: string;
	/**
	 * ### マテリアルデザイン強調イーズアウトイン
	 * Google Material Design 3の強調イージングで、Material Design 3の表現スタイルを捉えています。
	 */
	easeInOutOddMaterialEmphasized: string;
	/**
	 * ### マテリアルデザイン標準イーズアウトイン
	 * Google Material Design 3の標準イージングで、シンプル、小型、または実用性中心のトランジションに使用されます。
	 */
	easeInOutOddMaterialStandard: string;
	/**
	 * ### イーズアウトインクアッド
	 * 2次関数のイージング `t²`。
	 */
	easeOutInQuad: string;
	/**
	 * ### イーズアウトインキュービック
	 * 3次関数のイージング `t³`。
	 */
	easeOutInCubic: string;
	/**
	 * ### イーズアウトインクォート
	 * 4次関数のイージング `t⁴`。
	 */
	easeOutInQuart: string;
	/**
	 * ### イーズアウトインクイント
	 * 5次関数のイージング `t⁵`。
	 */
	easeOutInQuint: string;
	/**
	 * ### イーズアウトインサイン
	 * 正弦曲線のイージング `sin(t)`。
	 */
	easeOutInSine: string;
	/**
	 * ### イーズアウトインエクスポ
	 * 指数曲線のイージング `2ᵗ`。
	 */
	easeOutInExpo: string;
	/**
	 * ### イーズアウトインサーク
	 * 円曲線のイージング `√(1-t²)`。
	 */
	easeOutInCirc: string;
	/**
	 * ### イーズアウトインマックス
	 * アンカーポイントを最大限に引き寄せるイージング `3∛t²-2t`。
	 */
	easeOutInMax: string;
	/**
	 * ### イーズアウトインジャンプ
	 * 初期の「Bad Gun」でよく使われたイージングで、「無限大に近い」速度から徐々に減速する変化があります `(∛t-1)³+1`。
	 */
	easeOutInJump: string;
	/**
	 * ### イーズウィグルサブトル
	 */
	easeWiggleSubtle: string;
	/**
	 * ### イーズウィグルエネルギティック
	 */
	easeWiggleEnergetic: string;
	/**
	 * ### イーズウィグルプレイフル
	 */
	easeWigglePlayful: string;
	/**
	 * ### イーズウィグルシャープ
	 */
	easeWiggleSharp: string;
	/**
	 * ### イーズウィグルスムース
	 */
	easeWiggleSmooth: string;
	/**
	 * ### イーズウィグルインテンス
	 */
	easeWiggleIntense: string;
	/**
	 * ### イーズウィグルダイナミック
	 */
	easeWiggleDynamic: string;
};

export type ClassNames = keyof Styles;

declare const styles: Readonly<Styles>;

export default styles;
