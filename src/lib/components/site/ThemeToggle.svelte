<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import { toggleTheme } from '$lib/theme';
</script>

<Button variant="ghost" size="icon-sm" onclick={toggleTheme} class="shrink-0">
	<Sun class="size-4 dark:hidden" aria-hidden="true" />
	<Moon class="hidden size-4 dark:block" aria-hidden="true" />
	<span class="sr-only dark:hidden">{site.themeSwitchToDark}</span>
	<span class="sr-only hidden dark:inline">{site.themeSwitchToLight}</span>
</Button>
