/**
 * 用于确保核心数据被正确请求的“守卫进程”。
 *
 * // WARN: 该函数会导致不必要的性能开销，请勿滥用，仅用于提高核心功能可用性。
 * // WARN: 该函数导致的副作用可能会导致严重错误，请一定要在充分理解功能后使用。
 *
 * 原理：
 * 调用该函数后，在等待 option.delay 毫秒后，每隔 option.intervalTime 毫秒，执行 dataValidator 函数检查参数 verb 的值是否合法。
 * 如果它的值不合法，则执行 requestDataFn 重新获取数据，并将计数器加一。
 * 重复该步骤，直到：
 *   1. 计数器数量大于等于 option.attempts，即达到尝试次数上限。
 *   2. 被检查的变量 verb（通常是 Vue 响应式变量）值不为 undefined.
 *
 * @param verb - 被检查的变量。
 * @param dataValidator - 用于检查变量是否不合法的函数，如果不合法返回 true，合法返回 false。
 * @param requestDataFn - 副作用，该副作用中应该请求数据并修改上面的 value 值。如果包含网络请求或其他副作用，应该保证幂等或只包含 GET 请求。
 * @param option - { delay: 延迟多久后才开始监视（默认 3 秒），intervalTime: 间隔时间（默认 5 秒）， attempts: 尝试次数（默认 1 次） }
 *
 * @returns 一个对象，包含取消该 observeEmptyVarbAndRequestData 监听的函数。
 */
export function observeEmptyVarbAndRequestData<T>(
	verb: T,
	dataValidator: (verb: T) => boolean,
	requestDataFn: () => unknown | Promise<unknown>,
	option: { delay: number; intervalTime: number; attempts: number } = { delay: 3000, intervalTime: 5000, attempts: 1 },
) {
	let count = 0;

	let startTimer: NodeJS.Timeout | null = null;
	let intervalTimer: NodeJS.Timeout | null = null;

	startTimer = setTimeout(() => {
		intervalTimer = setInterval(async () => {
			if (dataValidator(verb)) {
				try {
					await requestDataFn();
				} catch (error) {
					console.error("ERROR", "[observeEmptyVarbAndRequestData] requestDataFn", error);
				}
				count++;
			}
			if (count >= option.attempts || !dataValidator(verb))
				if (intervalTimer) {
					clearInterval(intervalTimer);
					intervalTimer = null;
				}
		}, option.intervalTime);
	}, option.delay);

	return {
		cancel: () => {
			if (startTimer) {
				clearTimeout(startTimer);
				startTimer = null;
			}
			if (intervalTimer) {
				clearInterval(intervalTimer);
				intervalTimer = null;
			}
		},
	};
}
