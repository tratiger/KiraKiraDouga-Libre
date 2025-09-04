<script setup lang="ts">
	// このファイルをルートディレクトリに置くことで、エラーページ（404、500など）のスタイルをカスタマイズできます。

	import { httpResponseStatusCodes } from "helpers/http-status";
	import type { NuxtError } from "nuxt/dist/app/composables/error";

	const props = withDefaults(defineProps<{
		error: NuxtError;
	}>(), {
		error: {
			// @ts-ignore
			statusCode: 233,
			message: "楽しい",
		},
	});

	/**
	 * そのエラーコードであるかどうかを判断します。
	 * @param statusCode - エラーコード。
	 * @returns そのエラーコードであるかどうか。
	 */
	function isStatusCode(...statusCodes: number[]) {
		for (const statusCode of statusCodes)
			// eslint-disable-next-line eqeqeq
			if (props.error.statusCode == statusCode)
				// そうです、二重等号を使用する必要があります。
				return true;
		return false;
	}

	onMounted(() => console.log(props.error));

	useHead({
		title: httpResponseStatusCodes[props.error.statusCode],
		titleTemplate: "%s - KIRAKIRA☆DOUGA",
		bodyAttrs: { class: "no-scroll" },
	});
</script>

<template>
	<NuxtLayout v-if="isStatusCode(404, 233)" name="error404" :statusCode="error.statusCode" :message="error.message" />
	<NuxtLayout v-else-if="isStatusCode(403)" name="error403" :statusCode="error.statusCode" :message="error.message" />
	<NuxtLayout v-else-if="isStatusCode(502)" name="error502" :statusCode="error.statusCode" :message="error.message" />
	<!-- TODO: 301エラーページの設計では、動画が削除された理由を渡すための新しいパラメータが必要になる場合があります。 -->
	<NuxtLayout v-else-if="isStatusCode(301)" name="error301" :statusCode="error.statusCode" :message="error.message" />
	<NuxtLayout v-else name="error500" :statusCode="error.statusCode" :message="error.message" :stack="error.stack ?? ''" />
</template>
