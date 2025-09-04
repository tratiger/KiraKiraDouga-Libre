/**
 * ポイントクラス。
 */
export class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	/**
	 * 2点間の距離を求めます。
	 * @param point - もう一方の点。
	 * @returns 距離。
	 */
	distance(point: Point): number {
		return Math.hypot(point.x - this.x, point.y - this.y);
	}

	/**
	 * 2点間のX軸距離を求めます。
	 * @param point - もう一方の点。
	 * @returns X軸距離。
	 */
	distanceX(point: Point): number {
		return point.x - this.x;
	}

	/**
	 * 2点間のY軸距離を求めます。
	 * @param point - もう一方の点。
	 * @returns Y軸距離。
	 */
	distanceY(point: Point): number {
		return point.y - this.y;
	}

	/**
	 * オブジェクトの文字列表現を返します。
	 * @returns オブジェクトの文字列表現。
	 */
	toString() {
		return `(${this.x}, ${this.y})`;
	}
}
