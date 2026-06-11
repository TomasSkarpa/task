<script lang="ts">
	import ThemeToggle from '$lib/components/site/ThemeToggle.svelte';
	import { site } from '$lib/data/site';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	const navLinkClass =
		'text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring rounded-sm';

	function isActive(href: string): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}

		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<header class="border-b border-border/80 bg-background/95">
	<div class="site-container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
		<nav class="flex min-w-0 items-center gap-4" aria-label="Main">
			<a
				href="/"
				class={cn(navLinkClass, isActive('/') && 'text-foreground')}
				aria-current={isActive('/') ? 'page' : undefined}
			>
				{site.pageTitle}
			</a>
			<a
				href="/history"
				class={cn(navLinkClass, isActive('/history') && 'text-foreground')}
				aria-current={isActive('/history') ? 'page' : undefined}
			>
				{site.historyTitle}
			</a>
		</nav>
		<ThemeToggle />
	</div>
</header>
