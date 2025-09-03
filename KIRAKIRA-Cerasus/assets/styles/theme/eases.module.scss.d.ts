export type Styles = {
	/**
	 * ### 线性
	 * 以相同速度开始至结束的过渡效果 `t`。
	 */
	linear: string;
	/**
	 * ### 助跑线性
	 * 与线性效果几乎相同 `1t`。
	 */
	linearApproach: string;
	/**
	 * ### 切出
	 * 过渡期间插值立即跳转到其最终状态，并一直保持到结束 `ceil(t)`。
	 */
	stepStart: string;
	/**
	 * ### 切入
	 * 过渡期间插值一直保持其初始状态，直到结束，此时它直接跳转到其最终状态 `floor(t)`。
	 */
	stepEnd: string;
	/**
	 * ### 切出
	 * 过渡期间插值立即跳转到其最终状态，并一直保持到结束 `ceil(t)`。\
	 * 与 `stepStart` 相同。
	 */
	cutOut: string;
	/**
	 * ### 切入
	 * 过渡期间插值一直保持其初始状态，直到结束，此时它直接跳转到其最终状态 `floor(t)`。\
	 * 与 `stepEnd` 相同。
	 */
	cutIn: string;
	/**
	 * ### 缓入
	 * 以慢速开始的过渡效果。
	 */
	easeIn: string;
	/**
	 * ### 二次缓入
	 * 二次方的缓动 `t²`。
	 */
	easeInQuad: string;
	/**
	 * ### 三次缓入
	 * 三次方的缓动 `t³`。
	 */
	easeInCubic: string;
	/**
	 * ### 四次缓入
	 * 四次方的缓动 `t⁴`。
	 */
	easeInQuart: string;
	/**
	 * ### 五次缓入
	 * 五次方的缓动 `t⁵`。
	 */
	easeInQuint: string;
	/**
	 * ### 正弦缓入
	 * 正弦曲线的缓动 `sin(t)`。
	 */
	easeInSine: string;
	/**
	 * ### 指数缓入
	 * 指数曲线的缓动 `2ᵗ`。
	 */
	easeInExpo: string;
	/**
	 * ### 圆形缓入
	 * 圆形曲线的缓动 `√(1-t²)`。
	 */
	easeInCirc: string;
	/**
	 * ### 急促回弹缓入
	 * 超过范围的三次方缓动 `(s+1)t³-st²`。
	 */
	easeInBack: string;
	/**
	 * ### 平稳回弹缓入
	 * 超过范围后平稳结束的缓动 `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeInBackSmooth: string;
	/**
	 * ### 最大缓入
	 * 将锚点拉到头的缓动 `(½+cos((acos(1-2t)-2π)/3))³`。
	 */
	easeInMax: string;
	/**
	 * ### 跃变缓入
	 * 坏枪早期常用的缓动，有一个“接近无穷大”的速度到速度逐步减下来的变化过程 `(∛(t-1)+1)³`。
	 */
	easeInJump: string;
	/**
	 * ### 平滑缓入
	 * 由设计师艾拉精心调整的平滑缓动参数。
	 */
	easeInSmooth: string;
	/**
	 * ### 质感设计强调缓入
	 * 谷歌 Material Design 3 强调缓动，它捕捉了 Material Design 3 的表现风格。
	 */
	easeInMaterialEmphasized: string;
	/**
	 * ### 质感设计标准缓入
	 * 谷歌 Material Design 3 标准缓动，用于简单、小型或以实用性为中心的过渡。
	 */
	easeInMaterialStandard: string;
	/**
	 * ### 反弹缓入
	 * 如撞击地面时反弹般的缓动。
	 */
	easeInBounce: string;
	/**
	 * ### 弹跳缓入
	 * 如阻尼谐波运动般的缓动 `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeInElastic: string;
	/**
	 * ### 柔软过度缓入
	 */
	easeInOvershootSoft: string;
	/**
	 * ### 坚固过度缓入
	 */
	easeInOvershootFirm: string;
	/**
	 * ### 平滑过度缓入
	 */
	easeInOvershootSmooth: string;
	/**
	 * ### 动态过度缓入
	 */
	easeInOvershootDynamic: string;
	/**
	 * ### 夺目过度缓入
	 */
	easeInOvershootDramatic: string;
	/**
	 * ### 缓出
	 * 以慢速开始的过渡效果。
	 */
	easeOut: string;
	/**
	 * ### 二次缓出
	 * 二次方的缓动 `t²`。
	 */
	easeOutQuad: string;
	/**
	 * ### 三次缓出
	 * 三次方的缓动 `t³`。
	 */
	easeOutCubic: string;
	/**
	 * ### 四次缓出
	 * 四次方的缓动 `t⁴`。
	 */
	easeOutQuart: string;
	/**
	 * ### 五次缓出
	 * 五次方的缓动 `t⁵`。
	 */
	easeOutQuint: string;
	/**
	 * ### 正弦缓出
	 * 正弦曲线的缓动 `sin(t)`。
	 */
	easeOutSine: string;
	/**
	 * ### 指数缓出
	 * 指数曲线的缓动 `2ᵗ`。
	 */
	easeOutExpo: string;
	/**
	 * ### 圆形缓出
	 * 圆形曲线的缓动 `√(1-t²)`。
	 */
	easeOutCirc: string;
	/**
	 * ### 急促回弹缓出
	 * 超过范围的三次方缓动 `(s+1)t³-st²`。
	 */
	easeOutBack: string;
	/**
	 * ### 平稳回弹缓出
	 * 超过范围后平稳结束的缓动 `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeOutBackSmooth: string;
	/**
	 * ### 最大缓出
	 * 将锚点拉到头的缓动 `3∛t²-2t`。
	 */
	easeOutMax: string;
	/**
	 * ### 跃变缓出
	 * 坏枪早期常用的缓动，有一个“接近无穷大”的速度到速度逐步减下来的变化过程 `(∛t-1)³+1`。
	 */
	easeOutJump: string;
	/**
	 * ### 平滑缓出
	 * 由设计师艾拉精心调整的平滑缓动参数。
	 */
	easeOutSmooth: string;
	/**
	 * ### 流利设计强调缓出
	 * 微软 Windows 11 Fluent 2 中用于强调的缓动，如任务栏图标跳动等。
	 */
	easeOutFluentStrong: string;
	/**
	 * ### 质感设计强调缓出
	 * 谷歌 Material Design 3 强调缓动，它捕捉了 Material Design 3 的表现风格。
	 */
	easeOutMaterialEmphasized: string;
	/**
	 * ### 质感设计标准缓出
	 * 谷歌 Material Design 3 标准缓动，用于简单、小型或以实用性为中心的过渡。
	 */
	easeOutMaterialStandard: string;
	/**
	 * ### 弹簧缓出
	 * 如弹簧般的缓动。
	 */
	easeOutSpring: string;
	/**
	 * ### 反弹缓出
	 * 如撞击地面时反弹般的缓动。
	 */
	easeOutBounce: string;
	/**
	 * ### 弹跳缓出
	 * 如阻尼谐波运动般的缓动 `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeOutElastic: string;
	/**
	 * ### 反弹化的弹簧缓出
	 * 如弹簧般的缓动，但是反弹化。
	 */
	easeOutSpringBouncized: string;
	/**
	 * ### 弹跳化的反弹缓出
	 * 如撞击地面时反弹般的缓动，但是弹跳化。
	 */
	easeOutBounceElasticized: string;
	/**
	 * ### 反弹化的弹跳缓出
	 * 如阻尼谐波运动般的缓动 `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`，但是反弹化。
	 */
	easeOutElasticBouncized: string;
	/**
	 * ### 沉重弹簧缓出
	 */
	easeOutSpringHeavy: string;
	/**
	 * ### 弹力弹簧缓出
	 */
	easeOutSpringBouncy: string;
	/**
	 * ### 下落弹簧缓出
	 */
	easeOutSpringDrop: string;
	/**
	 * ### 滑行弹簧缓出
	 */
	easeOutSpringGlide: string;
	/**
	 * ### 匆促弹簧缓出
	 */
	easeOutSpringSnap: string;
	/**
	 * ### 懒散弹簧缓出
	 */
	easeOutSpringLazy: string;
	/**
	 * ### 弹性弹簧缓出
	 */
	easeOutSpringElastic: string;
	/**
	 * ### 坚固反弹缓出
	 */
	easeOutBounceFirm: string;
	/**
	 * ### 柔软反弹缓出
	 */
	easeOutBounceSoft: string;
	/**
	 * ### 锐利反弹缓出
	 */
	easeOutBounceSharp: string;
	/**
	 * ### 微妙反弹缓出
	 */
	easeOutBounceSubtle: string;
	/**
	 * ### 调皮反弹缓出
	 */
	easeOutBouncePlayful: string;
	/**
	 * ### 𱹀弹反弹缓出
	 */
	easeOutBounceSpringy: string;
	/**
	 * ### 柔软过度缓出
	 */
	easeOutOvershootSoft: string;
	/**
	 * ### 坚固过度缓出
	 */
	easeOutOvershootFirm: string;
	/**
	 * ### 平滑过度缓出
	 */
	easeOutOvershootSmooth: string;
	/**
	 * ### 动态过度缓出
	 */
	easeOutOvershootDynamic: string;
	/**
	 * ### 夺目过度缓出
	 */
	easeOutOvershootDramatic: string;
	/**
	 * ### 缓入
	 * 以慢速开始的过渡效果。
	 */
	ease: string;
	/**
	 * ### 缓入缓出
	 * 以慢速开始的过渡效果。
	 */
	easeInOut: string;
	/**
	 * ### 二次缓入缓出
	 * 二次方的缓动 `t²`。
	 */
	easeInOutQuad: string;
	/**
	 * ### 三次缓入缓出
	 * 三次方的缓动 `t³`。
	 */
	easeInOutCubic: string;
	/**
	 * ### 四次缓入缓出
	 * 四次方的缓动 `t⁴`。
	 */
	easeInOutQuart: string;
	/**
	 * ### 五次缓入缓出
	 * 五次方的缓动 `t⁵`。
	 */
	easeInOutQuint: string;
	/**
	 * ### 正弦缓入缓出
	 * 正弦曲线的缓动 `sin(t)`。
	 */
	easeInOutSine: string;
	/**
	 * ### 指数缓入缓出
	 * 指数曲线的缓动 `2ᵗ`。
	 */
	easeInOutExpo: string;
	/**
	 * ### 圆形缓入缓出
	 * 圆形曲线的缓动 `√(1-t²)`。
	 */
	easeInOutCirc: string;
	/**
	 * ### 急促回弹缓入缓出
	 * 超过范围的三次方缓动 `(s+1)t³-st²`。
	 */
	easeInOutBack: string;
	/**
	 * ### 平稳回弹缓入缓出
	 * 超过范围后平稳结束的缓动 `(s+1)(t-1)³+s(t-1)²+1`。
	 */
	easeInOutBackSmooth: string;
	/**
	 * ### 最大缓入缓出
	 * 将锚点拉到头的缓动 `3∛t²-2t`。
	 */
	easeInOutMax: string;
	/**
	 * ### 跃变缓入缓出
	 * 坏枪早期常用的缓动，有一个“接近无穷大”的速度到速度逐步减下来的变化过程 `(∛t-1)³+1`。
	 */
	easeInOutJump: string;
	/**
	 * ### 平滑缓入缓出
	 * 由设计师艾拉精心调整的平滑缓动参数。
	 */
	easeInOutSmooth: string;
	/**
	 * ### 预先缓入缓出
	 * 在缓动之前有一个预先的回弹，之后则没有。
	 */
	easeInOutAnticipate: string;
	/**
	 * ### 流利设计点对点缓入缓出
	 * 微软 Windows 11 Fluent 2 中用于点对点的缓动，如窗口最大化、还原等。
	 */
	easeInOutFluent: string;
	/**
	 * ### 质感设计强调缓入缓出
	 * 谷歌 Material Design 3 强调缓动，它捕捉了 Material Design 3 的表现风格。
	 */
	easeInOutMaterialEmphasized: string;
	/**
	 * ### 质感设计标准缓入缓出
	 * 谷歌 Material Design 3 标准缓动，用于简单、小型或以实用性为中心的过渡。
	 */
	easeInOutMaterialStandard: string;
	/**
	 * ### 反弹缓入缓出
	 * 如撞击地面时反弹般的缓动。
	 */
	easeInOutBounce: string;
	/**
	 * ### 弹跳缓入缓出
	 * 如阻尼谐波运动般的缓动 `2⁻¹⁰ᵗsin[120°(10t-0.75)]+1`。
	 */
	easeInOutElastic: string;
	/**
	 * ### 柔软过度缓入缓出
	 */
	easeInOutOvershootSoft: string;
	/**
	 * ### 坚固过度缓入缓出
	 */
	easeInOutOvershootFirm: string;
	/**
	 * ### 平滑过度缓入缓出
	 */
	easeInOutOvershootSmooth: string;
	/**
	 * ### 动态过度缓入缓出
	 */
	easeInOutOvershootDynamic: string;
	/**
	 * ### 夺目过度缓入缓出
	 */
	easeInOutOvershootDramatic: string;
	/**
	 * ### 缓动
	 * 以慢速开始，然后变快，然后慢速结束的过渡效果。\
	 * 此为 `ease` 的逆向运动。
	 */
	easeInOutOdd: string;
	/**
	 * ### 流利设计点对点缓出缓入
	 * 微软 Windows 11 Fluent 2 中用于点对点的缓动，如窗口最大化、还原等。
	 */
	easeInOutOddFluent: string;
	/**
	 * ### 质感设计强调缓出缓入
	 * 谷歌 Material Design 3 强调缓动，它捕捉了 Material Design 3 的表现风格。
	 */
	easeInOutOddMaterialEmphasized: string;
	/**
	 * ### 质感设计标准缓出缓入
	 * 谷歌 Material Design 3 标准缓动，用于简单、小型或以实用性为中心的过渡。
	 */
	easeInOutOddMaterialStandard: string;
	/**
	 * ### 二次缓出缓入
	 * 二次方的缓动 `t²`。
	 */
	easeOutInQuad: string;
	/**
	 * ### 三次缓出缓入
	 * 三次方的缓动 `t³`。
	 */
	easeOutInCubic: string;
	/**
	 * ### 四次缓出缓入
	 * 四次方的缓动 `t⁴`。
	 */
	easeOutInQuart: string;
	/**
	 * ### 五次缓出缓入
	 * 五次方的缓动 `t⁵`。
	 */
	easeOutInQuint: string;
	/**
	 * ### 正弦缓出缓入
	 * 正弦曲线的缓动 `sin(t)`。
	 */
	easeOutInSine: string;
	/**
	 * ### 指数缓出缓入
	 * 指数曲线的缓动 `2ᵗ`。
	 */
	easeOutInExpo: string;
	/**
	 * ### 圆形缓出缓入
	 * 圆形曲线的缓动 `√(1-t²)`。
	 */
	easeOutInCirc: string;
	/**
	 * ### 最大缓出缓入
	 * 将锚点拉到头的缓动 `3∛t²-2t`。
	 */
	easeOutInMax: string;
	/**
	 * ### 跃变缓出缓入
	 * 坏枪早期常用的缓动，有一个“接近无穷大”的速度到速度逐步减下来的变化过程 `(∛t-1)³+1`。
	 */
	easeOutInJump: string;
	/**
	 * ### 微妙摆动
	 */
	easeWiggleSubtle: string;
	/**
	 * ### 活力摆动
	 */
	easeWiggleEnergetic: string;
	/**
	 * ### 调皮摆动
	 */
	easeWigglePlayful: string;
	/**
	 * ### 锐利摆动
	 */
	easeWiggleSharp: string;
	/**
	 * ### 平滑摆动
	 */
	easeWiggleSmooth: string;
	/**
	 * ### 强烈摆动
	 */
	easeWiggleIntense: string;
	/**
	 * ### 动态摆动
	 */
	easeWiggleDynamic: string;
};

export type ClassNames = keyof Styles;

declare const styles: Readonly<Styles>;

export default styles;
