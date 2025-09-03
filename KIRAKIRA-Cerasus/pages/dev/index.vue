<script setup lang="ts">
	useHead({ title: t.development_test_page });

	type Page = { name: string; link: string };

	/**
	 * ページリストを取得します。
	 * @param pages - ページ配列。
	 * @returns ページオブジェクト。
	 */
	function getPages(...pages: [string, string][]): Page[];
	/**
	 * ページリストを取得します。
	 * @param httpCodes - HTTPコード配列。
	 * @returns ページオブジェクト。
	 */
	function getPages(...httpCodes: number[]): Page[];
	/**
	 * ページリストを取得します。
	 * @param pages - ページ配列。
	 * @returns ページオブジェクト。
	 */
	function getPages(...pages: ([string, string] | number)[]): Page[] {
		return pages.map(page => (typeof page === "number" ? { name: String(page), link: String(page) } :
			{ name: page[0], link: page[1] }) as Page);
	}

	const pages = getPages(
		["コンポーネントテストページ", "/dev/components"],
		["リッチテキストテストページ", "/dev/test-rich-text-editor"],
		["動的アイコンテストページ", "/dev/test-lottie"],
		["フォントテストページ", "/dev/test-font"],
		["スクロールテストページ", "/dev/test-scroll"],
		["スライダーテストページ", "/dev/test-slider"],
		["カラーテストページ", "/dev/test-color"],
		["ポインタータイプ検出", "/dev/pointer-type"],
		["サンプル動画", "/video/kvtest"],
		["kv1", "/video/kv1"],
		["kv3000", "/video/kv3000"], // FIXME: ルーティングで存在しないページにアクセスしても、対応する404や301などのエラーページにリダイレクトされず、新しいウィンドウで開くと正常に動作します。
		["サンプル音声", "/audio"],
		["サンプルアルバム", "/photo"],
		["検索", "/search"],
		["投稿", "/upload"],
		["投稿編集", "/upload/edit"],
		["マイページ", "/user"],
		["uid2", "/user/2"],
		["uid3000", "/user/3000"], // FIXME: ルーティングで存在しないページにアクセスしても、対応する404や301などのエラーページにリダイレクトされず、新しいウィンドウで開くと正常に動作します。
		["初回ログイン歓迎ページ", "/welcome"],
		["コンテンツ", "/hello"],
		["次のページ", "/next"],
	);

	const httpCodes = getPages(
		233,
		301,
		403,
		404,
		500,
		502,
		503,
		601,
	);
</script>

<template>
	<div class="container">
		<Subheader icon="science" :badge="233">テスト</Subheader>
		<div class="pages">
			<LocaleLink v-for="page in pages" :key="page.name" class="link lite" :to="page.link">{{ page.name }}</LocaleLink>
		</div>
		<Subheader icon="error" :badge="233">エラーページ</Subheader>
		<div class="pages">
			<a v-for="page in httpCodes" :key="page.name" class="link lite" :href="'/error/' + page.link">{{ page.name }}</a>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.container {
		padding-top: 0 !important;

		> * {
			margin: 26px 0;
		}
	}

	%tabulation {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.pages {
		@extend %tabulation;

		.link {
			@include round-small;
			padding: 7px 16px;
			background-color: c(accent-10);

			&:hover {
				opacity: 0.75;
			}

			&:focus {
				@include button-shadow-focus;
			}

			.dark & {
				color: c(icon-color);
			}
		}
	}
</style>
