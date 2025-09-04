export const formatDateTime = (timestamp: number) => {
	if (!timestamp) return null;

  // 秒単位/ミリ秒単位のタイムスタンプを自動的に処理する
	const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;

	return {
		formatted: Intl.DateTimeFormat("ja-JP", {
			timeZone: "Asia/Tokyo",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}).format(ts),
	};
};
