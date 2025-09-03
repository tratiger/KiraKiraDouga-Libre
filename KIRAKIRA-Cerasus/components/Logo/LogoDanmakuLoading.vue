<template>
	<svg class="icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M13 17H7C6.45 17 6 16.55 6 16C6 15.45 6.45 15 7 15H13C13.55 15 14 15.45 14 16C14 16.55 13.55 17 13 17Z" />
		<path d="M20 13H10C9.45 13 9 12.55 9 12C9 11.45 9.45 11 10 11H20C20.55 11 21 11.45 21 12C21 12.55 20.55 13 20 13Z" />
		<path d="M4 9C3.45 9 3 8.55 3 8C3 7.45 3.45 7 4 7H16C16.55 7 17 7.45 17 8C17 8.55 16.55 9 16 9H4Z" />
	</svg>
</template>

<style scoped lang="scss">
	svg {
		@include square(1em);
		overflow: visible;
		fill: currentColor;

		path {
			animation: translate 1333ms $ease-in-out-back-smooth infinite both;
		}

		@for $i from 1 through 3 {
			path:nth-child(#{$i}) {
				animation-delay: $i * -0.1s;
			}
		}
	}

	@keyframes translate {
		0% {
			transform: translateX(100%);
			opacity: 0;
		}

		50% {
			transform: translateY(0);
			opacity: 1;
		}

		100% {
			transform: translateX(-100%);
			opacity: 0;
		}
	}
</style>
