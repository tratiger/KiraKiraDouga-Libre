import JSConfetti from "js-confetti";

let confetti: JSConfetti | undefined;

const confettiColors = [
	"#f06e8e", "#45b3e1", "#4bb530", "#f9a400", "#bb35ea", "#dd1818", "#ffca2c",
];

/**
 * 紙吹雪を表示します。
 */
export function showConfetti() {
	if (environment.server) return;
	if (!confetti) confetti = new JSConfetti();
	confetti.addConfetti({
		confettiColors,
	});
}
