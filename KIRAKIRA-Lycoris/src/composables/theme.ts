import { darkTheme, lightTheme, useOsTheme as useOsThemeName, type GlobalThemeOverrides } from "naive-ui";

/**
 * システムのテーマ設定を取得します。
 * @returns システムのテーマ設定。
 */
export function useOsTheme() {
	const osThemeName = useOsThemeName();
	const themeName = computed(() => osThemeName.value || "dark");

	const osTheme = computed(() => {
		return themeName.value === "light" ? lightTheme : darkTheme;
	});
	const themeOverrides = computed<GlobalThemeOverrides>(() => {
		const NORMAL = "#F06E8E", HOVER = "#F390A9", PRESSED = "#D64D70";

		return {
			common: themeName.value === "light" ? {
				primaryColor: NORMAL,
				primaryColorHover: HOVER,
				primaryColorPressed: PRESSED,
			} : {
				primaryColor: NORMAL,
				primaryColorHover: PRESSED,
				primaryColorPressed: HOVER,
			},
		};
	});

	return {
		theme: osTheme,
		themeOverrides,
	};
}
