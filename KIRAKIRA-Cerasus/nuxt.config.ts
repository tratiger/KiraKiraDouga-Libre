// https://v3.nuxtjs.org/api/configuration/nuxt.config

import pomsky from "@pomsky-lang/unplugin";
import defineAlias from "./helpers/alias";
import styleResources from "./helpers/style-resources";
import docsLoader from "./plugins/vite/docs";
import vitePluginScssVariables from "./plugins/vite/scss-variables";
import scssVariablesLoader from "./plugins/vite/scss-variables-loader";
import devtoolsJson from "vite-plugin-devtools-json";
/* import vueNestedSFC from "vite-plugin-vue-nested-sfc"; */
type OriginalNuxtConfig = Parameters<typeof defineNuxtConfig>[0];
type BroadNuxtConfig = OriginalNuxtConfig & Record<Exclude<string, keyof OriginalNuxtConfig>, object | string>; // まだエラーを報告しますか？
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // HTTPSをサポートします。
const dev = process.env.NODE_ENV === "development";

export default defineNuxtConfig({
	// HACK: 以下はNuxt 3のディレクトリ構造を復元するための設定です。将来的にはNuxt 4のディレクトリ構造に変更してください。
	// This reverts the new srcDir default from `app` back to your root directory
	srcDir: ".",
	// This specifies the directory prefix for `router.options.ts` and `spa-loading-template.html`
	dir: {
		app: "app",
	},

	devtools: {
		enabled: true,
	},

	plugins: [
		"plugins/vue/ripple.ts",
		"plugins/vue/css-var-i.ts",
		"plugins/vue/tooltip.ts",
		"plugins/vue/gesture.ts",
	],

	modules: [
		"@nuxtjs/i18n",
		"@nuxt/image",
		"@nuxt/icon",
		"@vueuse/nuxt",
		"@chettapong/nuxt-lodash",
		["@pinia/nuxt", {
			autoImports: ["defineStore", "storeToRefs"],
		}],
		"pinia-plugin-persistedstate/nuxt",
		"modules/theme/module.ts",
		"modules/noscript/module.ts",
		"modules/unsupported-browsers/module.ts",
		dev && "modules/components-globalized/module.ts",
		"@nuxtjs/robots",
		"@nuxtjs/sitemap",
	],

	alias: defineAlias(__dirname,
		"assets/styles",
		"components",
		"composables",
		"layouts",
		"pages",
		"plugins",
		"public",
		"public/static",
		"assets/lotties",
		"modules",
		"middleware",
		"server",
		"helpers",
		"classes",
		"locales",
		"stores",
		"api",
		"types",
		"utils",
		"workers",
		"assets/pomsky",
		"composables/api",
	),

	css: [
		"styles/global.scss",
		"styles/global-colors.scss",
		"styles/elements/_index.scss",
		"vue-virtual-scroller/dist/vue-virtual-scroller.css",
		"vue-cropper/dist/index.css",
	],

	vite: {
		plugins: [
			docsLoader(),
			vitePluginScssVariables(),
			scssVariablesLoader(),
			devtoolsJson(),
			pomsky.vite({
				fileExtensions: [".vue"],
			}),
		],
		optimizeDeps: {
			// 「optimized dependencies changed. reloading」を防ぐ
			include: [
				"lottie-web",
				"vue-cropper",
				"js-confetti",
				"@number-flow/vue",
				"vue-audio-visual",
				"vue-virtual-scroller",
				"danmaku/dist/esm/danmaku.dom.js",
				"qrcode.vue",
				"shaka-player",
				"@tiptap/vue-3",
				"@tiptap/starter-kit",
				"@tiptap/extension-underline",
				"safe-regex",
				"path-browserify-es",
				"variable-name-conversion",
				"temporal-polyfill",
				"@vueuse/gesture",
				"mitt",
				"tus-js-client",
				"node-vibrant/worker",
			],
			needsInterop: [
				"mediainfo.js",
			],
			esbuildOptions: {
				target: "esnext",
			},
		},
		vue: {
			script: {
				defineModel: true,
				propsDestructure: true,
			},
		},
		build: {
			target: "esnext",
		},
		worker: {
			format: "es",
		},
		css: {
			preprocessorOptions: styleResources({
				scss: {
					use: [
						"sass:color",
						"sass:list",
						"sass:map",
						"sass:math",
						"sass:meta",
						"sass:selector",
						"sass:string",
					],
					useAsGlobal: [
						"styles/theme",
					],
				},
			}),
			modules: {
				localsConvention: "camelCaseOnly",
			},
		},
		assetsInclude: [
			"**/*.vtt",
		],
	},

	nitro: {
		esbuild: {
			options: {
				target: "esnext",
			},
		},
	},

	build: {
		vendor: [
			"vue-cropper",
		],
		plugins: [
			{ src: "~/plugins/vue-cropper", ssr: false },
		],
	},

	vue: {
		compilerOptions: {
			isCustomElement(tag) {
				return (
					tag.includes("-") ||
					[
						"marquee",
						// dev && "SvgIcon", // 開発/本番環境以外の対応するコンポーネントを意図的にネイティブ要素として扱います。
						// !dev && "NuxtIcon",
					].includes(tag)
				);
			},
		},
	},

	i18n: {
		locales: [
			{ code: "zhs", language: "zh-CN", name: "简体中文" },
			{ code: "zht", language: "zh-TW", name: "繁體中文" },
			{ code: "en", language: "en-US", name: "English" },
			{ code: "ja", name: "日本語" },
			{ code: "ko", name: "한국어" },
			{ code: "vi", name: "Tiếng Việt" },
			{ code: "id", name: "Bahasa Indonesia" },
			{ code: "fr", name: "Français" },
			{ code: "yue", name: "廣東話" },
			{ code: "ii", name: "ꆈꌠꉙ" }, // In Context Language
		],
		defaultLocale: "zhs",
		vueI18n: "./i18n.config.ts",
		detectBrowserLanguage: {
			cookieKey: "language",
			alwaysRedirect: true,
		},
		bundle: {
			// 予期せぬエラー、一時的な解決策。参考：https://github.com/intlify/bundle-tools/issues/423#issuecomment-2525540710
			optimizeTranslationDirective: false,
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
	},

	image: {
		format: ["avif", "webp"], // <NuxtImg>にのみ適用され、<NuxtImg>には無効です。
		provider: 'minio',
		providers: {
			minio: {
				name: "minio",
				provider: "./providers/nuxt-image/minio.ts",
			},
		},
	},

	piniaPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
		},
		storage: "localStorage",
	},

	icon: {
		mode: "svg",
		componentName: "NuxtIcon",
		customCollections: [
			{
				prefix: "kirakira",
				dir: "assets/icons",
				normalizeIconName: false,
			},
			{
				prefix: "mono-logo",
				dir: "assets/icons/mono-logo",
				normalizeIconName: false,
			},
			{
				prefix: "colored-logo",
				dir: "assets/icons/colored-logo",
				normalizeIconName: false,
			},
		],
	},

	imports: {
		dirs: [
			"components",
			"utils",
			"classes",
			"stores",
		],
	},

	postcss: {
		plugins: {
			"./plugins/postcss/component-root": true,
			"./plugins/postcss/any-hover": true,
			"./plugins/postcss/lang-latin": true,
			"postcss-combine-media-query": false,
			"postcss-viewport-unit-fallback": true,
		},
	},

	components: [
		{
			path: "components",
			pathPrefix: false,
		},
	],

	lodash: {
		exclude: ["now"],
	},

	site: {
		url: "https://kirakira.moe",
	},

	app: {
		pageTransition: {
			name: "page-jump-in",
			mode: "out-in",
		},
		rootId: "root",
		teleportId: "popovers",
	},

	runtimeConfig: {
		public: {
			gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
			gitCommit: process.env.VERCEL_GIT_COMMIT_SHA,
		},
	},

	robots: {
		credits: false,
		disallow: [
			"/dev",
			"/settings",
			"/welcome",
			"/search",
		],
	},

	compatibilityDate: "2024-08-25",
} as BroadNuxtConfig);
