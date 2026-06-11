<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="site-container mx-auto min-w-0 px-4 py-10 sm:px-6 sm:py-14">
	{@render children()}
</div>
