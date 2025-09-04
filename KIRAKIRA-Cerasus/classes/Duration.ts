/**
 * 時間オブジェクト。
 *
 * 時間間隔、長さをより便利に入力するために使用します。
 *
 * 組み込みの `Date` オブジェクトは時刻であり、タイムゾーンなどの無関係な情報を処理する必要があります。
 */
export class Duration {
	/** 秒の値。 */
	private seconds: number;
	/** 時間の間の区切り文字。 */
	private static colon = ":" as const;
	/** マイナス記号。 */
	private static minus = "−" as const;
	/** 時間データがない場合に表示されるプレースホルダーのダッシュ。 */
	private static dash = "‒" as const;
	/** 時間データがない場合に表示されるプレースホルダー文字列。 */
	static placeholder = "‒‒:‒‒" as const;

	/**
	 * 秒から期間オブジェクトを構築します。
	 * @param seconds - 秒数。空の場合はプレースホルダーを表します。
	 */
	constructor(seconds?: number);
	/**
	 * 分、秒から期間オブジェクトを構築します。
	 * @param minutes - 分数。
	 * @param seconds - 秒数。
	 */
	constructor(minutes: number, seconds: number);
	/**
	 * 時、分、秒から期間オブジェクトを構築します。
	 * @param hours - 時間数。
	 * @param minutes - 分数。
	 * @param seconds - 秒数。
	 */
	constructor(hours: number, minutes: number, seconds: number);
	constructor(v1?: number, v2?: number, v3?: number) {
		if (v1 === undefined) {
			this.seconds = NaN;
			return;
		}
		this.seconds = v1;
		if (v2 !== undefined)
			this.seconds = this.seconds * 60 + v2;
		if (v3 !== undefined)
			this.seconds = this.seconds * 60 + v3;
	}

	/** 秒の絶対値を取得します。 */
	private get abs() { return Math.abs(this.seconds); }
	/** 秒を取得します (0〜59)。 */
	get s() { return this.abs % 60 | 0; }
	/** 分を取得します (0〜59)。 */
	get m() { return this.abs / 60 % 60 | 0; }
	/** 時間を取得します。 */
	get h() { return this.abs / 60 / 60 % 60 | 0; }
	/** 負の数ですか？ */
	get negative() { return this.seconds < 0; }
	/** 時間データはありますか？ */
	get valid() { return Number.isFinite(this.seconds); }

	/**
	 * オブジェクトの文字列表現を返します。
	 * @deprecated 公式の組み込み実装を使用してください。
	 * @returns オブジェクトの文字列表現。
	 */
	private toString_legacy() {
		if (!this.valid)
			return Duration.placeholder; // 時間データがない場合は、プレースホルダー文字列を表示します。
		let result = `${padTo2Digit(this.m)}${Duration.colon}${padTo2Digit(this.s)}`;
		if (this.h) result = `${padTo2Digit(this.h)}${Duration.colon}${result}`;
		if (this.negative) result = Duration.minus + result;
		return result;
	}

	/**
	 * オブジェクトの文字列表現を返します。
	 * @note Chromium 129以降が必要です。そうでない場合は、古いプライベート実装が自動的に使用されます。
	 * @returns オブジェクトの文字列表現。
	 */
	toString() {
		if (!("DurationFormat" in Intl)) return this.toString_legacy();
		const locale = getCurrentLocaleLangCode(undefined, true);
		const options: Intl.DurationFormatOptions = { style: "digital", hours: "2-digit", hoursDisplay: "auto" };
		if (!this.valid)
			return new Intl.DurationFormat(locale, { ...options, numberingSystem: "latn" }).format({ seconds: 0 }).replaceAll("0", Duration.dash);
		return new Intl.DurationFormat(locale, options).format({
			hours: this.h, minutes: this.m, seconds: this.s,
		});
	}

	/**
	 * ローカライズされた期間文字列で使用されるコロン文字を取得します。
	 *
	 * @remarks 言語によって期間の区切り文字が異なります。たとえば、インドネシア語ではコロンの代わりにドットが使用されます。
	 *
	 * @note Chromium 129以降が必要です。そうでない場合は、コロン文字自体が固定で返されます。
	 */
	static get localedColon() {
		if (!("DurationFormat" in Intl)) return Duration.colon;
		const locale = getCurrentLocaleLangCode(undefined, true);
		return new Intl.DurationFormat(locale, { style: "digital", hoursDisplay: "auto" }).format({ seconds: 0 }).replaceAll("0", "");
	}

	/**
	 * オブジェクトをプリミティブ値に変換します。
	 * @returns オブジェクトのthis値に変換されます。
	 */
	valueOf() { return this.seconds; }
}
