# アニメーションアイコン

このプロジェクトでは Lottie をアニメーションアイコンとして使用しており、デザイナーは様々な状態間のトランジションアニメーションを作成する必要があります。

## 状態

### 通常のアニメーションアイコンで必要な状態

- Normal
- Pressed
- Selected
- PressedSelected

### あまり使用しない状態

- Hover
- HoverSelected

### 取り消し線の状態

- Off

### その他のカスタム特殊状態（参考用）

- Play
- Pause
- Replay
- Stop
- …

## AEプロジェクトの初期化

コンポジションサイズ：2400×2400

フレームレート：60 fps

FigmaからSVGをエクスポートする際は、フラット化されていないベクターグラフィックスを使用することをお勧めします。フラット化されている場合は、必要に応じて再描画を検討してください。そうしないと、AEで直接パスのアンカーポイントを編集する必要があります。

[SVG2AE](https://www.gfxcamp.com/aescripts-svg2ae/) を使用してAEにインポートします。デフォルトは24×24です。その後、AE付属のScale Compositionスクリプトを使用して100倍（2400×2400まで）に拡大してから制作します。（拡大しないとモザイク状になります。）

マーカーを使用して範囲を設定し、状態を制御します。以下は一般的な状態マーカーです。~~タイムラインを最短にするために、できるだけ順序を維持してください~~順序は問いません。

- PressedToNormal
- NormalToPressed
- PressedToSelected
- SelectedToPressedSelected
- PressedSelectedToSelected
- SelectedToNormal
- PressedSelectedToNormal

*上記のように、逆の状態も指定する必要があります。なぜなら、元の状態を単純に逆再生すると、モーションカーブが逆になってしまうからです。*<wbr />ただし、将来的に割り込み可能なアニメーションが実装された場合は、この規定は廃止される可能性があります。

### フォールバック状態マーカー

以下の状態マーカーがない場合、自動的に指定された状態にフォールバックします。

- NormalToSelected\
  NormalToPressed、PressedToNormal を順に再生
- PressedSelectedToNormal\
  PressedSelectedToSelected、SelectedToNormal を順に再生
- SelectedToNormal\
  SelectedToPressedSelected、PressedSelectedToNormal を順に再生

以下の状態はほとんど発生しません。要素のインスペクターで強制的に要素の状態を設定した場合にのみ、これらの状態が発生する可能性があります。

- PressedToPressedSelected\
  アニメーションなしで PressedSelected のフレームに強制的に切り替え
- PressedSelectedToPressed\
  アニメーションなしで Pressed のフレームに強制的に切り替え

## 時間の仕様

### 15フレーム（250ミリ秒）

- PressedToNormal
- NormalToPressed
- SelectedToPressedSelected
- PressedSelectedToSelected

### 5フレーム（色の変化のみ）

- SelectedToNormal

### 30フレーム〜60フレーム、任意に延長可能

- PressedToSelected
- PressedSelectedToNormal

## AE内のマーカー

### 方法

タイムラインを**指定した状態**の第1フレームに移動し、コンポジションのタイムラインの空白部分をクリックして（マーカーがレイヤーではなくコンポジションに追加されるようにするため）、キーボードの <kbd>Numpad \*</kbd> を押してマーカーを追加します。テンキーがない場合は、*マーカー*メニューから追加するか、*ショートカットをカスタマイズ*してください。

追加したマーカーをダブルクリックし、デュレーションを指定した状態の長さに変更します（終了時間ではありません）。そして、下のコメント欄に状態の[命名規則](#命名)に従って名前を記入します。

### 命名

JSON形式を使用します。\
改行、インデント、スペースなどは任意ですが、改行を推奨します。

```json
{
    "name": "NormalToPressed"
}
```

## エクスポート

### コンポジション時間をトリミング

コンポジションの有効な状態時間内で、最初の状態のインポイントに移動して <kbd>B</kbd> を押し（必要に応じて）、最後の状態のアウトポイントに移動して <kbd>N</kbd> を押し、コンポジションの時間をトリミングします。余分な時間を削除し、最終的なファイルサイズを節約します。

### エクスポート拡張機能（いずれかを選択）

- Bodymovin
- LottieFiles

### ファイル形式

Lottieは、埋め込み画像、音声、フォントなどの多くの新機能をサポートする新しい `*.lottie` ファイル形式をリリースしましたが、現時点ではこれらの新機能は必要ないため、従来の `*.json` 形式を使用します。将来的に必要になった際に切り替えても問題ありません。
