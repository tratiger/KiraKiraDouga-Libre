<template>
	<svg class="star" width="103" height="94" viewBox="0 0 103 94" xmlns="http://www.w3.org/2000/svg">
		<path d="M76.4229 18.4883L77.126 20.1807L78.9531 20.3262L116.39 23.3271L87.8672 47.7607L86.4756 48.9521L86.9004 50.7344L95.6143 87.2666L63.5635 67.6895L62 66.7344L60.4365 67.6895L28.3848 87.2666L37.0996 50.7344L37.5244 48.9521L36.1328 47.7607L7.60938 23.3271L45.0469 20.3262L46.874 20.1807L47.5771 18.4883L62 -16.1895L76.4229 18.4883Z" />
	</svg>
</template>

<style scoped lang="scss">
	.star {
		$offset: -12px;
		position: fixed;
		top: $offset;
		right: $offset;
		fill: c(black, 4%);
		stroke: c(text-color, 4%);
		stroke-width: 6px;

		&.v-enter-from,
		&.v-leave-to {
			scale: 1.5;
			rotate: -30deg;
			opacity: 0;
		}

		&.v-enter-active,
		&.v-leave-active {
			transition-duration: 500ms;
		}
	}
</style>
