<script lang="ts">
	import './layout.css';
	import ThemeToggle from '$lib/components/site/ThemeToggle.svelte';
	import { site } from '$lib/data/site';

	let { children } = $props();
</script>

<svelte:head>
	<title>{site.pageTitle} · {site.name}</title>
	<meta name="description" content="Daily tasks. One day at a time." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="flex min-h-screen flex-col" style="font-family: 'IBM Plex Sans', system-ui, sans-serif">
	<header class="border-b border-border/80 bg-background/95">
		<div class="site-container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
			<span class="text-sm font-medium text-muted-foreground">{site.name}</span>
			<ThemeToggle />
		</div>
	</header>
	<main class="flex-1">
		{@render children()}
	</main>
</div>
