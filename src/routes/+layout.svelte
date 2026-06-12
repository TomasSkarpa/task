<script lang="ts">
	import './layout.css';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import { site } from '$lib/data/site';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
	<meta name="description" content="Daily tasks. One day at a time." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="flex min-h-screen flex-col" style="font-family: 'IBM Plex Sans', system-ui, sans-serif">
	<SiteHeader />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
