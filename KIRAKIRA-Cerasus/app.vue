<script setup lang="ts">
	import crowdinLogoSvg from "assets/svg/crowdin.svg";
	import { useDynamicLayout } from "helpers/page-transition";
	import manifest from "public/manifest.json";

	const homepage = "https://kirakira.moe/";
	const { locale } = useI18n();
	const inContextLocalization = isInContextLocalization();

	const langTag = computed(() => ({
		zhs: "zh-Hans-CN",
		zht: "zh-Hant-TW",
	} as RecordValue<string>)[locale.value] ?? (inContextLocalization.value && globalThis.jipt ? globalThis.jipt.target_language : locale.value));

	useHead({
		htmlAttrs: {
			lang: langTag,
		},
		titleTemplate: titleChunk => {
			return titleChunk ? `${titleChunk} - KIRAKIRA☆DOUGA` : "KIRAKIRA☆DOUGA";
		},
		meta: [
			{ "http-equiv": "Content-Type", content: "text/html;charset=UTF-8" },
			{ "http-equiv": "X-UA-Compatible", content: "IE=Edge,chrome=1" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" },
			{ name: "renderer", content: "webkit" },
			{ name: "description", content: manifest.description },
			{ name: "keywords", content: "ビデオ,弾幕,字幕,音声,歌詞,アルバム,写真集,写真,動画サイト,弾幕動画,二次元,アニメ,アニメーション,音楽,アニメ音楽,音MAD,AMV,MAD,ANIME,ACG,NOVA" },
			// 以下は、さまざまなAppleのプライベートプロパティです。
			{ name: "apple-mobile-web-app-title", content: "KIRAKIRA" }, // ホーム画面に追加した後のタイトル (iOS)
			{ name: "apple-mobile-web-app-capable", content: "yes" }, // WebAppフルスクリーンモードを有効にする (iOS)
			{ name: "apple-touch-fullscreen", content: "yes" }, // WebAppフルスクリーンモードを有効にする (iOS)
			{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }, // ステータスバーの背景色を設定する (iOS)
			{ name: "format-detection", content: "telephone=no" }, // 電話番号の識別を無効にする (iOS)
			{ name: "format-detection", content: "email=no" }, // メールアドレスの識別を無効にする (Android)
			// 以下は、さまざまなBaiduのプライベートプロパティです。
			{ "http-equiv": "Cache-Control", content: "no-siteapp" }, // Baiduのトランスコーディングを禁止します。Baiduモバイルでウェブページを開くと、Baiduがあなたのウェブページをトランスコードして広告を貼り付ける可能性があり、非常に不快です。
			{ name: "referrer", content: "no-referrer" }, // ホットリンク対策
			// 以下は、Open Graph Protocolのプロパティです。
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: manifest.name },
			{ property: "og:title", content: manifest.name }, // ここにページのタイトルを配置する必要があります。
			{ property: "og:description", content: manifest.description },
			{ property: "og:image", content: `${homepage}static/images/thumbnail.png` },
			{ property: "og:url", content: homepage },
			// 以下は、Twitterのプライベートコンテンツプロパティです。
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:site", content: manifest.name },
			{ name: "twitter:title", content: manifest.name }, // ここにページのタイトルを配置する必要があります。
			{ name: "twitter:description", content: manifest.description },
			{ name: "twitter:image", content: `${homepage}static/images/thumbnail.png` },
			{ name: "twitter:url", content: homepage },
		],
		link: [
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/static/images/icons/apple-touch-icon.png" },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "alternate", href: homepage, hreflang: "x-default" },
			{ rel: "alternate", href: homepage, hreflang: "zh-Hans" },
			{ rel: "alternate", href: homepage, hreflang: "zh-CN" },
			{ rel: "alternate", href: homepage, hreflang: "zh-SG" },
			{ rel: "alternate", href: homepage, hreflang: "zh-MY" },
			{ rel: "alternate", href: `${homepage}zht`, hreflang: "zh-Hant" },
			{ rel: "alternate", href: `${homepage}zht`, hreflang: "zh-TW" },
			{ rel: "alternate", href: `${homepage}zht`, hreflang: "zh-HK" },
			{ rel: "alternate", href: `${homepage}zht`, hreflang: "zh-MO" },
			{ rel: "alternate", href: `${homepage}en`, hreflang: "en" },
			{ rel: "alternate", href: `${homepage}ja`, hreflang: "ja" },
			{ rel: "alternate", href: `${homepage}ko`, hreflang: "ko" },
			{ rel: "alternate", href: `${homepage}vi`, hreflang: "vi" },
			{ rel: "alternate", href: `${homepage}id`, hreflang: "id" },
			{ rel: "alternate", href: `${homepage}fr`, hreflang: "fr" },
			{ rel: "alternate", href: `${homepage}yue`, hreflang: "zh-yue" },
			{ rel: "alternate", href: `${homepage}yue`, hreflang: "yue" },
			{ rel: "preconnect", href: "https://rsms.me/" },
			{ rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
		],
		script: inContextLocalization.value ? [
			{
				innerHTML: `(${() => {
					globalThis._jipt = Object.entries({
						project: "kirakira",
						escape() {
							globalThis.location.pathname = "/settings/language";
						},
					});
				}})()`,
			},
			{ src: "https://cdn.crowdin.com/jipt/jipt.js", tagPriority: "low" },
		] : undefined,
	});

	watch(inContextLocalization, enableJipt => {
		if (enableJipt && !globalThis.jipt) {
			const jiptLoaderLogo = document.createElement("img");
			jiptLoaderLogo.className = "jipt-loader-logo";
			jiptLoaderLogo.src = crowdinLogoSvg;
			document.body.append(jiptLoaderLogo);
			document.getElementById("root")!.hidden = true;
			setTimeout(() => location.reload(), 250);
		} else if (globalThis.jipt)
			globalThis.jipt[enableJipt ? "start" : "stop"]();
	});

	const layout = useDynamicLayout();

	const backgroundImages = useBackgroundImages();
	watch(() => backgroundImages.currentDominantColor, color => {
		document.documentElement.style.setProperty("--accent-wallpaper", color || null);
	});

	// Service Worker
	if (environment.client)
		window.addEventListener("load", () => {
			if (!("serviceWorker" in navigator))
				throw new Error("serviceWorker is not supported in current browser!");
			navigator.serviceWorker.register("/sw.js");
		});

	// 開発環境テスト用のグローバル変数
	loadDevGlobal();
	// イースターエッグ
	loadEgg();
	if (environment.client)
		console.log(
			"\n%cKIRAKIRA☆DOUGA%c\nA cute site for cute people! # KAWAII FOREVER #\n",
			"font-size: 24px; font-weight: bold; color: #f06e8e;",
			"color: #f06e8e;",
		);
</script>

<template>
	<NuxtLayout :name="layout">
		<NuxtPage />
	</NuxtLayout>

	<Toasts />
	<Tooltips />

	<PageLoadingIndicator />
	<div id="large-viewport-size"></div>
</template>
