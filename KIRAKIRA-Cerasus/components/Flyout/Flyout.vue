<script lang="ts">
	/**
	 * 位置と矩形を取得します。
	 * @param target - ターゲット要素。
	 * @returns 位置と矩形。
	 */
	export function getLocation(target: FlyoutModelNS.Target): [location: TwoD | null, targetRect: DOMRect | undefined] {
		if (target instanceof Array) return [target, undefined];
		if (target instanceof Event)
			if (target.target instanceof Element) target = target.currentTarget!;
			else return [[target.clientX, target.clientY], undefined];
		if (target instanceof Element || target instanceof DOMRect) {
			const targetRect = target instanceof Element ? target.getBoundingClientRect() : target;
			return [[targetRect.left, targetRect.bottom], targetRect];
		}
		return [null, undefined];
	}
</script>

<script setup lang="ts">
	import { getPosition } from "plugins/vue/tooltip";
	import type { FlyoutModelNS } from "types/arguments";

	const props = withDefaults(defineProps<{
		/** **内側**にパディングを追加しませんか？ */
		noPadding?: boolean;
		/** `Esc`キーを押したときにフローティングウィンドウを**閉じない**ようにしますか？ */
		doNotCloseOnEsc?: boolean;
		/** `overflow: clip;`を**しない**ようにしますか？ */
		noClipping?: boolean;
		/** 要素の外側をクリックしたときに、次のクラス名を持つ要素が含まれている場合、自動クローズはトリガーされません。 */
		ignoreOutsideElementClasses?: string[];
	}>(), {
		ignoreOutsideElementClasses: () => [],
	});

	const emits = defineEmits<{
		show: [];
		hide: [];
		beforeShow: [placement: Placement];
	}>();

	const model = defineModel<FlyoutModel>();
	const shown = ref(false);
	const flyout = refComp();
	const location = ref<TwoD>([0, 0]);
	const locationStyle = computed(() => {
		const l = location.value;
		return l[0] !== 0 || l[1] !== 0 ? { left: l[0] + "px", top: l[1] + "px" } : undefined;
	});
	const flyoutRect = ref<DOMRect>();
	const placementForAnimation = ref<Placement>("bottom");
	const scopeId = useParentScopeId() ?? "";
	const isWidthAnimation = computed(() => ["left", "right", "x"].includes(placementForAnimation.value));
	const isReverseSlide = computed(() => ["left", "top"].includes(placementForAnimation.value));
	/** ユーザーが連続してクリックしたときにフローティングウィンドウがすばやく点滅するのを防ぐために、フローティングウィンドウを閉じた後、少なくとも何ミリ秒以内に再度開いてはならないかを定義します。 */
	const QUICK_CLICK_DURATION = 200;
	const suppressShowing = ref(false);
	const clipping = ref(!props.noClipping); // noClippingを要求しながらフローティングウィンドウのアニメーションをオン/オフにすると表示エラーが発生する問題を修正します。
	const moving = ref(false);

	useEventListener("window", "keydown", e => {
		if (!props.doNotCloseOnEsc && e.code === "Escape")
			hide();
	});

	/**
	 * フローティングウィンドウを非表示にします。
	 */
	async function hide() {
		shown.value = false;
		model.value = undefined;
		suppressShowing.value = true;
		await delay(QUICK_CLICK_DURATION);
		emits("hide");
		suppressShowing.value = false;
	}

	/**
	 * フローティングウィンドウを表示します。
	 * @param target - フローティングウィンドウの位置を指定します。
	 * @param placement - フローティングウィンドウの表示方向。
	 * @param offset - ターゲット要素からの距離オフセット。
	 */
	async function show(target: FlyoutModelNS.Target, placement?: Placement, offset?: number) {
		if (suppressShowing.value) return;
		target = toValue(target);
		const [_location, targetRect] = getLocation(target);
		if (!_location) return;
		else location.value = _location;
		shown.value = true;
		let retryCount = 10;
		while (!flyoutRect.value && retryCount--)
			await nextTick();
		if (targetRect) {
			shown.value = false;
			const result = getPosition(targetRect, placement, offset, flyoutRect);
			location.value = result.position;
			placementForAnimation.value = result.placement;
			emits("beforeShow", result.placement);
			await nextTick();
			shown.value = true;
			await nextTick();
		}
		location.value = moveIntoPage(location, flyoutRect);
		emits("show");
	}

	/**
	 * フローティングウィンドウをページ内に移動します。
	 * @param target - フローティングウィンドウの位置を指定します。
	 * @param placement - フローティングウィンドウの表示方向。
	 * @param offset - ターゲット要素からの距離オフセット。
	 * @param getNewPosition - 変更後の新しい位置とオフセットを取得します。
	 */
	async function _moveIntoPage(target: FlyoutModelNS.Target, placement?: Placement, offset?: number, getNewPosition?: (placement: Placement, offset: number) => void) {
		target = toValue(target);
		const [_location, targetRect] = getLocation(target);
		if (!_location || !flyout.value) return;
		moving.value = true;
		const flyoutRect = flyout.value.getBoundingClientRect();
		if (targetRect) {
			const result = getPosition(targetRect, placement, offset, flyoutRect);
			getNewPosition?.(result.placement, result.offset);
			location.value = result.position;
			placementForAnimation.value = result.placement;
			await nextTick();
		}
		location.value = moveIntoPage(location, flyoutRect);
		await delay(600);
		moving.value = false;
	}

	watch(model, e => {
		if (suppressShowing.value) {
			model.value = undefined;
			return;
		}
		if (e === undefined) return hide();
		if (e instanceof Array) {
			const [target, placement, offset] = e;
			e = { target, placement, offset };
		}
		show(e.target, e.placement, e.offset);
	}, { immediate: true, deep: true });

	defineExpose({
		hide, show, moveIntoPage: _moveIntoPage, placementForAnimation,
	});

	/**
	 * 要素がDOMに挿入された後の次のフレームで呼び出されます。
	 * これを使用して、進入アニメーションを開始します。
	 * @param el - HTML DOM要素。
	 * @param done - コールバック関数doneを呼び出すと、遷移が終了したことを示します。
	 */
	async function onFlyoutEnter(el: Element, done: () => void) {
		clipping.value = true;
		await animateSize(el, null, {
			[isWidthAnimation.value ? "startWidth" : "startHeight"]: 0,
			startReverseSlideIn: isReverseSlide.value,
			duration: 500,
			getRect: flyoutRect,
			startChildTranslate: isReverseSlide.value ? undefined : placementForAnimation.value === "bottom" ? "0 -100%" : "-100% 0",
		});
		done();
		clipping.value = !props.noClipping;
	}

	/**
	 * 離脱遷移が開始されるときに呼び出されます。
	 * これを使用して、離脱アニメーションを開始します。
	 * @param el - HTML DOM要素。
	 * @param done - コールバック関数doneを呼び出すと、遷移が終了したことを示します。
	 */
	async function onFlyoutLeave(el: Element, done: () => void) {
		clipping.value = true;
		await animateSize(el, null, {
			[isWidthAnimation.value ? "endWidth" : "endHeight"]: 0,
			endReverseSlideIn: isReverseSlide.value,
			duration: 300,
			endChildTranslate: isReverseSlide.value ? undefined : placementForAnimation.value === "bottom" ? "0 -100%" : "-100% 0",
		});
		flyoutRect.value = undefined;
		done();
	}

	useEventListener("window", "pointerdown", e => {
		if (!flyout.value || !shown.value) return;
		let clickOutside = !isInPath(e, flyout);
		if (clickOutside) clickOutside = props.ignoreOutsideElementClasses.every(klass => !isInPath(e, klass));
		if (clickOutside) hide();
	});
</script>

<template>
	<Teleport to="#popovers">
		<Transition :css="false" @enter="onFlyoutEnter" @leave="onFlyoutLeave">
			<Comp
				v-if="shown"
				ref="flyout"
				v-bind="$attrs"
				:[scopeId]="''"
				:class="{ padding: !noPadding, clipping, moving }"
				:style="locationStyle"
			>
				<slot></slot>
			</Comp>
		</Transition>
	</Teleport>
</template>

<style scoped lang="scss">
	$padding: 12px 16px;

	:comp {
		@include dropdown-flyouts;
		@include round-large;
		@include set-max-size;
		@include acrylic-background;
		transition: $fallback-transitions, left 0s, top 0s;

		&.clipping {
			overflow: clip;
		}

		&.padding {
			padding: $padding;
		}

		&.moving {
			transition: $fallback-transitions, left $ease-out-smooth 600ms, top $ease-out-smooth 600ms;
		}

		> :deep(*) {
			max-width: calc(100dvw - list.nth($padding, 2) * 2);
		}
	}
</style>
