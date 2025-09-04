/**
 * GitHub issues ページにリダイレクトします。
 *
 * 単純な機能なので、新しいモジュールを別途作成する必要はなく、noscript モジュール上で実行されます。
 */

import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(e => {
	setHeader(e, "Content-Type", "text/html");
	if (!process.dev)
		setHeader(e, "Cache-Control", "max-age=600, must-revalidate");

	return `<meta http-equiv="refresh" content="0;url=https://github.com/KIRAKIRA-DOUGA/KIRAKIRA-Cerasus/issues">`;
});
