<script lang="tsx">
	// スクリプトを書いたって、実行されないんだから意味ないよ。

	export default defineComponent({
		render() {
			const styles = useCssModule();

			// 既知の特性の1つ、templateを使用するとスタイルがインポートされないため、tsxで記述するしかありません。
			return (
				<noscript>
					<div class={styles.mask}>
						<div class={styles.card}>
							<div class={styles.cardBack}>
								{forMap(2, i => <Icon name="settings" class={styles.settingsIcon} key={`settings-${i}`} />, 1)}
							</div>
							<div class={styles.cardBody}>
								<h1>警告、JavaScriptが無効になっています</h1>
								<LogoDisableJavascript class={styles.logo} />
								<p>
									おい！なぜJavaScriptを無効にするのですか？<br />
									私たちのサイトは多くのJavaScript技術を使用しており、<br />
									使用するにはJavaScriptを有効にする必要があります。<br />
									<a href="https://www.enable-javascript.com/" target="_blank">JavaScriptを有効にする方法は？</a>
								</p>
							</div>
						</div>
					</div>
				</noscript>
			);
			// Vueでnoscriptタグを含めると、コンソールに警告とエラーが1つずつ表示されますが、使用には影響しません。
			// この問題は解決できません：https://github.com/nuxt/framework/issues/9988
			// OK、今は解決済みです。
		},
	});
</script>

<style module lang="scss">
	@import "styles/animations";

	$animation-options: $ease-out-expo 600ms backwards;

	.mask {
		@include flex-center;
		@include fullscreen;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		background-color: c(white, 50%);
		backdrop-filter: blur(5px);
	}

	.card {
		@include square(100%);
		@include round-large;
		@include card-shadow;
		position: relative;
		width: 1024px;
		height: 600px;
		overflow: clip;
		background-color: c(white, 75%);
		animation: intro $animation-options;

		.card-body {
			position: relative;
			z-index: 2;
			display: grid;
			grid-template-rows: auto 1fr;
			grid-template-columns: auto 1fr;
			gap: 36px 60px;
			padding: 60px 70px;

			h1 {
				top: 70px;
				right: 50px;
				grid-column: 1 / 3;
				margin: 0;
				color: c(accent);
				font-size: 64px;
				text-align: right;
				animation: move-down $animation-options;
			}

			.logo {
				bottom: 60px;
				left: 70px;
				animation: move-up $animation-options;
			}

			p {
				top: 200px;
				left: 500px;
				margin: 0;
				font-size: 20px;
				line-height: 30px;
				animation: move-left $animation-options;
			}
		}

		.card-back {
			@include square(100%);
			position: absolute;
			z-index: 1;

			.settings-icon {
				position: absolute;
				color: c(accent-10);
				animation: rotation $ease-out-expo 16s infinite;

				&:first-of-type {
					top: -120px;
					left: -100px;
					font-size: 450px;
				}

				&:last-of-type {
					right: -100px;
					bottom: -200px;
					font-size: 612px;
				}
			}
		}
	}

	@keyframes move-down {
		from {
			translate: 0 -50px;
		}
	}

	@keyframes move-left {
		from {
			translate: 50px;
		}
	}

	@keyframes move-up {
		from {
			translate: 0 50px;
		}

		to {
			translate: 0;
		}
	}

	@keyframes rotation {
		$length: 16;

		@for $i from 0 to $length {
			$progress: calc($i / $length);

			#{$progress * 100%} {
				rotate: $progress * 1turn;
			}
		}
	}
</style>
