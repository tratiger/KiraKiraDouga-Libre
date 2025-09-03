# コードスニペット
このプロジェクトには、素早く呼び出すための一般的なコードスニペットがいくつか追加されています。

現在、Visual Studio Codeのみをサポートしています。他のエディタ/IDEについては、手動で追加してください。

## 使用方法
* 例えば、`*.vue` ファイル内で `init` と入力し、キーボードの <kbd>TAB</kbd> キーを押すだけで、コードスニペットを素早く挿入できます。
* 一部のコードスニペットは複数のプレフィックスコマンドをサポートしており、いずれかを入力すれば使用できます。

## 例

### Vue

#### `init`<br />`vue`

Vueコンポーネントのテンプレートを素早く初期化します。

```html
<docs>
	
</docs>

<script setup lang="ts">
	
</script>

<template>
	
</template>

<style scoped lang="scss">
	
</style>
```

注意：
```html
<i18n lang="json5">
	
</i18n>
```
`<i18n>` コードブロックは、文字列の再利用が不便なため使用を中止し、代わりにlocalesディレクトリ内の個別ファイルに言語を格納するように変更しました。

### TypeScript

#### `props`

Vueコンポーネントのプロパティを素早く定義します。

```typescript
const props = withDefaults(defineProps<{
	
}>(), {
	
});
```

#### `emits`

Vueコンポーネントのイベントを素早く定義します。

```typescript
const emits = defineEmits<{
	update: [arg: ];
}>();
```

#### `model`

Vueコンポーネントの双方向バインディングモデルを素早く定義します。

```typescript
const model = defineModel<boolean>();
const value = withOneWayProp(model, () => props.value);
```

### 共通

#### `#region`

折りたたみ領域の開始を素早く定義します。

```typescript
// #region [セクションタイトルを入力]
```

#### `#endregion`

折りたたみ領域の終了を素早く定義します。

```typescript
// #endregion
```
