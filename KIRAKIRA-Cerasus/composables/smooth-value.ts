import { Point } from "classes/Point";

/**
 * 数値、配列、または点に基づいて、滑らかなリアクティブ参照変数を作成します。
 * @param current - 滑らかでない現在の値。
 * @param speed - 滑らかさの速度。
 * @returns 滑らかな値のリアクティブ参照変数。
 * @see https://codepen.io/nanonansen/pen/oRWmaY 視差の滑らかな移動を参考にしています。
 */
export function useSmoothValue<T extends number | number[] | Point>(current: MaybeRef<T>, speed: number) {
	if (speed <= 0 || speed > 1)
		throw new RangeError(`useSmoothValue speed パラメータの値の範囲が間違っています。パラメータ値は(0 ~ 1]の範囲内である必要がありますが、現在の値は ${speed} です。`);
	const smoothValue = ref(toValue(current)) as Ref<T>;
	const animationId = ref<number>();
	const FRACTION_DIGITS = 6; // 小数点以下6桁を保持します。
	onMounted(() => {
		const animation = () => {
			const _speed = isPrefersReducedMotion() ? 1 : speed;
			const value = toValue(current);
			const getNewValue = (cur: number, prev: number) => {
				if (Number.isNaN(cur) || Number.isNaN(prev)) return cur;
				return +(prev + (cur - prev) * _speed).toFixed(FRACTION_DIGITS);
			};
			if (typeof value === "number") {
				const prev = smoothValue as Ref<number>;
				prev.value = getNewValue(value, prev.value); // (value - prev.value) * _speed;
			} else if (value instanceof Point) {
				const prev = smoothValue as Ref<Point>;
				prev.value.x = getNewValue(value.x, prev.value.x); // (value.x - prev.value.x) * _speed;
				prev.value.y = getNewValue(value.y, prev.value.y); // (value.y - prev.value.y) * _speed;
			} else {
				const prev = smoothValue as Ref<number[]>;
				for (let i = 0; i < value.length; i++)
					prev.value[i] = getNewValue(value[i], prev.value[i]); // (value[i] - prev.value[i]) * _speed;
			}
			animationId.value = requestAnimationFrame(animation);
		};
		animation();
	});
	onUnmounted(() => {
		cancelAnimationFrame(animationId.value!);
	});
	return readonly(smoothValue);
}
