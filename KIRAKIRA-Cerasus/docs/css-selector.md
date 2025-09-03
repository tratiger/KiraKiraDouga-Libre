# CSS セレクタと XPath

<table>
<thead>
<th>説明</th>
<th>CSS Selector</th>
<th>XPath</th>
<th>対応するHTML</th>
</thead>
<tbody>
<tr>
<td colspan="4">コンビネータ</td>
<tr>
<td>グループ化された要素</td>
<td>

```css
div, a
```
</td>
<td>

```xml
//div | //a
```
</td>
<td>

```html
<div>

<a>
```
</td>
</tr>
<tr>
<td>子要素</td>
<td>

```css
div > a
```
</td>
<td>

```xml
//div/a
```
</td>
<td>

```html
<div>
  <a>
```
</td>
</tr>
<tr>
<td>子孫要素</td>
<td>

```css
div a
div >> a
```
</td>
<td>

```xml
//div//a
```
</td>
<td>

```html
<div>
  ⋱
    <a>
```
</td>
</tr>
<tr>
<td>後続の兄弟要素</td>
<td>

```css
div + a
```
</td>
<td>

```xml
//div/following-sibling::a[1]
```
</td>
<td>

```html
<div>
<a>
```
</td>
</tr>
<tr>
<td>後続の全兄弟要素</td>
<td>

```css
div ~ a
```
</td>
<td>

```xml
//div/following-sibling::
```
</td>
<td>

```html
<div>
⋮
<a>
```
</td>
</tr>
<tr>
<td>親要素</td>
<td>

```css
div:has(> a)
```
</td>
<td>

```xml
//div/..
```
</td>
<td>

```html
<div>
  <a>
```
</td>
</tr>
<tr>
<td>祖先要素</td>
<td>

```css
div:has(a)
```
</td>
<td>

```xml
//div//..
```
</td>
<td>

```html
<div>
  ⋱
    <a>
```
</td>
</tr>
<tr>
<td>先行する兄弟要素</td>
<td>

```css
div:has(+ a)
```
</td>
<td>

```xml
//div/preceding-sibling::a[1]
```
</td>
<td>

```html
<div>
<a>
```
</td>
</tr>
<tr>
<td>先行する全兄弟要素</td>
<td>

```css
div:has(~ a)
```
</td>
<td>

```xml
//div/preceding-sibling::
```
</td>
<td>

```html
<div>
⋮
<a>
```
</td>
</tr>
</tbody>
</table>
