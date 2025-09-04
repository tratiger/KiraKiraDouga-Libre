/**
 * :active 疑似クラスのイベントを監視します。
 * @param el - HTML DOM 要素。
 * @param onPress - ポインターが押されたときのコールバックイベント。
 * @param onLift - ポインターが離されたときのコールバックイベント。
 */
export function usePressed(el: MaybeRef<HTMLElement | ComponentPublicInstance | undefined>, onPress?: Function, onLift?: Function) {
	const isPointerDown = ref(false);
	const isPointerEnter = ref(false);
	
	useEventListener(el, "pointerdown", onPointerDown);
	useEventListener(el, "pointerenter", onPointerEnter);
	
	/**
	 * ポインターが押されたときのイベント。
	 * @param e - ポインターイベント。
	 */
	function onPointerDown(e: PointerEvent) {
		const div = e.currentTarget as HTMLDivElement;
		onPress?.();
		isPointerDown.value = true;
		isPointerEnter.value = true;
		window.addEventListener("pointerup", onPointerUp);
		div.addEventListener("pointerleave", onPointerLeave);
	}

	/**
	 * ポインターが要素に入ったときのイベント。
	 * @param e - ポインターイベント。
	 */
	function onPointerEnter(e: PointerEvent) {
		if (isPointerDown.value)
			onPointerDown(e);
	}

	/**
	 * ポインターが離されたときのイベント。
	 * @param e - ポインターイベント。
	 */
	function onPointerUp(e: PointerEvent) {
		isPointerDown.value = false;
		onPointerLeave(e);
		window.removeEventListener("pointerup", onPointerUp);
	}

	/**
	 * ポインターが要素から離れたときのイベント。
	 * @param _e - ポインターイベント。
	 */
	function onPointerLeave(_e: PointerEvent) {
		if (isPointerEnter.value)
			onLift?.();
		isPointerEnter.value = false;
		getElFromComponentInstance(el)?.removeEventListener("pointerleave", onPointerLeave);
	}
}
