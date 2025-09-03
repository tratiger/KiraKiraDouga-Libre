/**
 * 重定向到 GitHub issues 页面。
 *
 * 由于就一个简单的功能，没必要再单独开一个新的模块，故挂靠在 noscript 模块上运行。
 */

import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(e => {
	setHeader(e, "Content-Type", "text/html");
	if (!process.dev)
		setHeader(e, "Cache-Control", "max-age=600, must-revalidate");

	return `<meta http-equiv="refresh" content="0;url=https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Cerasus/issues">`;
});
