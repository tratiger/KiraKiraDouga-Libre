<docs>
	# 日付/時刻/タイムコードピッカーの基本ピッカー
</docs>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		/** 基本的な日時ピッカーフィールド。 */
		fields: (BaseDateTimePickerField | BaseDateTimePickerFieldPlain)[];
		/** デフォルトの区切り文字。デフォルトは中点です。 */
		defaultSep?: string;
	}>(), {
		defaultSep: "·",
	});

	const { menuItemCount, itemHeight } = useScssVariables().numbers;
	const model = defineModel<Record<string, Readable>>({ required: true });
	const showMenu = ref<DOMRect>();
	const menu = ref<HTMLElement>();
	const hide = () => showMenu.value = undefined;
	const previousValue = ref<Record<string, Readable>>();
	const menuValuesKeys = ["noumenon", "shadow"] as const;
	const menuValues = reactive<Record<ValueOf<typeof menuValuesKeys>, Record<string, HTMLDivElement | undefined | null>>>(arrayMapObjectConst(menuValuesKeys, () => ({})));
	const buttonEl = ref<InstanceType<typeof Comp>>();
	const buttonElSizeObserver = ref<ResizeObserver>();
	const dash = "‒" as const;
	const widthChangingTransitionTimeoutId = ref<Timeout>();

	const backupValue = () => previousValue.value = model.value;
	const restoreValue = () => previousValue.value && (model.value = previousValue.value);

	useEventListener("window", "pointerdown", e => {
		if (!menu.value || !showMenu.value) return;
		const clickOutside = !isInPath(e, menu);
		if (clickOutside) {
			restoreValue(); // この行を削除すると、画面の外側をクリックすると設定が復元されるのではなく保存されます。
			hide();
		}
	});

	const visibleValues = computed(() => arrayMapObject(props.fields.filter(field => !("text" in field)) as BaseDateTimePickerField[], ({ name, values, loopable }) => {
		if (typeof values === "function") values = values();
		const currentValue = model.value[name];
		let currentIndex = values.indexOf(currentValue);
		if (currentIndex === -1) currentIndex = 0;
		const result: Readable[] = [];
		for (let i = currentIndex - (menuItemCount - 1); i <= currentIndex + (menuItemCount - 1); i++) {
			const index = loopable ? floorMod(i, values.length) : i;
			const value = values[index];
			result.push(value);
		}
		return [name, result];
	}));

	function setField(name: string, value: Readable) {
		model.value = { ...model.value, [name]: value };
	}

	function onWheel(e: WheelEvent, fieldName: string) {
		const offset = e.deltaY > 0 ? 1 : -1;
		const nextValue = visibleValues.value[fieldName][menuItemCount - 1 + offset];
		if (nextValue !== undefined) {
			setField(fieldName, nextValue);
			spining(fieldName, offset);
		}
	}

	const getOffsetFromIndex = (index: number) => index - menuItemCount + 1;

	async function spining(fieldName: string, offset: number) {
		await nextTick();
		const fields = menuValuesKeys.map(key => menuValues[key][fieldName]).filter(Boolean) as HTMLDivElement[];
		if (fields.length === 0 || !offset || isPrefersReducedMotion()) return;
		removeExistAnimations(...fields);
		await Promise.all(fields.map(field => field.animate({
			translate: [`0 ${offset * itemHeight}px`, ""],
		}, {
			duration: 250,
			easing: eases.easeOutMax,
		}).finished.catch(useNoop)));
	}

	onMounted(() => {
		const WIDTH_CHANGING = "width-changing";
		buttonElSizeObserver.value = new ResizeObserver(([{ target }]) => {
			menu.value?.classList.add(WIDTH_CHANGING);
			showMenu.value &&= target.getBoundingClientRect();
			clearTimeout(widthChangingTransitionTimeoutId.value);
			widthChangingTransitionTimeoutId.value = setTimeout(() => menu.value?.classList.remove(WIDTH_CHANGING), 250);
		});
		if (buttonEl.value) buttonElSizeObserver.value.observe(buttonEl.value.$el);
	});

	onUnmounted(() => {
		buttonElSizeObserver.value?.disconnect();
	});
</script>

<template>
	<Comp
		ref="buttonEl"
		role="application"
		v-ripple
		:aria-expanded="showMenu"
		tabindex="0"
		@click="e => { backupValue(); showMenu = e.currentTarget.getBoundingClientRect(); }"
	>
		<template v-for="({ name, sep, minWidth, placeholderLength, ...field }, index) in fields" :key="name">
			<p v-if="'values' in field" class="value" :style="{ minWidth: toValue(minWidth) }">
				{{ model[name] == null ? dash.repeat(placeholderLength ?? 2) : field.getDisplayValue?.(model[name]) ?? model[name] }}
			</p>
			<p v-else-if="String(toValue(field.text))" class="value" :style="{ minWidth: toValue(minWidth) }">{{ toValue(field.text) }}</p>
			<p v-if="(sep || defaultSep) && index < fields.length - 1" class="sep">{{ sep || defaultSep }}</p>
		</template>
		<ClientOnlyTeleport to="#popovers">
			<Transition :duration="{ enter: 250, leave: 125 }">
				<div
					v-if="showMenu"
					ref="menu"
					class="menu"
					:style="{
						'--left': showMenu.left + 'px',
						'--top': showMenu.top + 'px',
						'--width': showMenu.width + 'px',
					}"
				>
					<div class="base"></div>
					<div class="content">
						<div class="highlight"></div>
						<div v-for="key in menuValuesKeys" :key="key" class="items" :class="key">
							<template v-for="({ name, sep, minWidth, ...field }, index) in fields" :key="name">
								<div v-if="'values' in field" :ref="el => menuValues[key][name] = el as HTMLDivElement" class="values" :style="{ minWidth: toValue(minWidth) }" @wheel="e => onWheel(e, name)">
									<!-- 配列のインデックスをキーとして使用することは推奨されませんが、要素が少なすぎる場合（例：12時間制）、1ラウンドに複数の同じキーが含まれ、異常が発生する可能性があります。 -->
									<template v-for="(value, i) in visibleValues[name]" :key="getOffsetFromIndex(i)">
										<p v-if="value !== undefined" v-ripple class="item" @click="setField(name, value); spining(name, getOffsetFromIndex(i))">
											{{ field.getDisplayValue?.(value) ?? value }}
										</p>
										<p v-else class="item nothing"></p>
									</template>
								</div>
								<p v-else-if="String(toValue(field.text))" class="plain" :style="{ minWidth: toValue(minWidth) }">{{ toValue(field.text) }}</p>
								<p v-if="(sep || defaultSep) && index < fields.length - 1" class="sep">{{ sep || defaultSep }}</p>
							</template>
						</div>
						<div class="buttons">
							<button v-ripple @click="hide(); restoreValue();"><Icon name="close" /></button>
							<button v-ripple @click="hide()"><Icon name="check" /></button>
						</div>
					</div>
				</div>
			</Transition>
		</ClientOnlyTeleport>
	</Comp>
</template>

<style scoped lang="scss">
	$item-height: 36px;
	$menu-item-count: 9;
	$menu-bottom-buttons-height: 42px;
	$menu-padding-inline: 4px;
	$item-padding-inline: 16px;
	$item-gap: calc(9px / 2);

	:comp {
		@include chip-shadow;
		@include round-large;
		display: flex;
		justify-content: space-evenly;
		align-items: stretch;
		width: fit-content;
		height: $item-height;
		padding-inline: $item-padding-inline;
		background-color: c(main-bg);

		&:active {
			background-color: c(main-bg);
			box-shadow: none !important;
		}

		&:focus {
			@include button-shadow-unchecked-focus;
		}

		&:any-hover {
			@include button-shadow-unchecked-hover;
			background-color: c(gray-5);
		}

		&:any-hover:focus {
			@include button-shadow-unchecked-hover-focus;
		}

		p {
			@extend %item-value;
			padding-inline: $item-gap;
		}
	}

	* {
		font-weight: 500;
		font-feature-settings: "case" on; // コロンやマイナス記号などを数字や大文字と同じ高さにします（比較記号は不要）。
		font-variant-numeric: tabular-nums;
	}

	.sep {
		align-content: center;
		align-self: center;
		opacity: 0.5;
	}

	%item-value {
		align-content: center;
		color: c(icon-color);
		text-align: center;
	}

	.menu {
		$width: calc(var(--width) + $menu-padding-inline * 2);
		$height: $item-height * $menu-item-count + $menu-bottom-buttons-height;
		$half-items-height: $item-height * math.floor(calc($menu-item-count / 2));
		--top-value: clamp(0px, calc(var(--top) - #{$half-items-height}), calc(100dvh - #{$height}));
		--left-value: clamp(0px, calc(var(--left) - #{$menu-padding-inline}), calc(100dvw - #{$width}));
		top: var(--top-value);
		left: var(--left-value);
		width: $width;
		height: $height;

		// ComboBoxのような相対配置ではなく絶対配置を使用するのは、ビデオのタイムジャンプというユースケースを考えたからです。相対配置を使用すると、ビデオが全画面表示の場合、メニューの半分が必然的に画面外に表示されます。
		> * {
			position: fixed;
			top: var(--top-value);
			left: var(--left-value);
			width: $width;
			height: $height;
		}

		.base {
			@include dropdown-flyouts;
			@include round-large;
			background-color: c(main-bg);
		}

		.content {
			@include round-large;
			overflow: hidden;
			clip-path: inset(0);
		}

		.items {
			display: flex;
			justify-content: space-evenly;
			align-items: stretch;
			width: 100%;
			height: $item-height * $menu-item-count;
			padding-inline: $item-padding-inline + $menu-padding-inline;
			overflow-y: clip;
			mask: linear-gradient(
				to bottom,
				transparent 0%,
				black calc(100% / $menu-item-count),
				black calc(100% - 100% / $menu-item-count),
				transparent 100%,
			);

			.item {
				@include round-small;
				@extend %item-value;
				position: relative;
				height: $item-height;
				margin-inline: -$item-gap;
				padding-inline: $item-gap * 2;
				white-space: nowrap;
				cursor: pointer;

				&:any-hover {
					background-color: c(hover-overlay);
				}

				&.nothing {
					pointer-events: none;
				}
			}

			.values {
				height: $item-height * ($menu-item-count * 2 - 1);
				margin-top: -$half-items-height;
				padding-inline: 0;
			}

			&.shadow {
				position: absolute;
				top: 0;
				z-index: 2;
				pointer-events: none;
				interactivity: inert;
				clip-path: inset($half-items-height 0);

				.sep,
				.plain,
				.item {
					color: c(main-bg);
				}
			}

			&:not(.shadow) {
				.sep,
				.plain {
					visibility: hidden;
				}
			}

			.plain {
				@extend %item-value;
				align-self: center;
				white-space: nowrap;
			}

			> * {
				padding-inline: $item-gap;
			}
		}

		.buttons {
			@include card-shadow;
			z-index: 1;
			display: flex;
			align-items: stretch;
			height: $menu-bottom-buttons-height;
			background-color: c(main-bg);

			button {
				@include grid-center;
				width: 100%;
				color: c(icon-color);
				font-size: 24px;

				&:any-hover {
					background-color: c(hover-overlay);
				}
			}
		}

		.highlight {
			@include button-shadow;
			@include round-small;
			position: absolute;
			top: $half-items-height;
			left: $menu-padding-inline;
			z-index: 1;
			width: var(--width);
			height: $item-height;
			background-color: c(accent);
			pointer-events: none;
		}

		&.v-enter-from,
		&.v-leave-to {
			.base {
				top: var(--top);
				height: $item-height;
			}

			.highlight {
				opacity: 0;
			}

			.item,
			.sep {
				color: c(icon-color) !important;
			}

			* {
				pointer-events: none;
			}

			.content {
				translate: 0 calc((var(--top) - #{$half-items-height}) - var(--top-value));
				clip-path: inset($half-items-height 0 ($half-items-height + $menu-bottom-buttons-height));
			}

			.items.shadow .plain {
				color: c(icon-color);
			}
		}

		&.width-changing .values {
			overflow-x: hidden;
		}
	}
</style>
