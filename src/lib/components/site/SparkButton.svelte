<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import { invalidateAll } from '$app/navigation';

	let {
		date,
		disabled = false,
	}: {
		date: string;
		disabled?: boolean;
	} = $props();

	let adding = $state(false);

	async function addSpark() {
		if (adding || disabled) return;

		adding = true;
		try {
			const response = await fetch('/api/task/add-spark', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date }),
			});

			if (!response.ok) return;

			await invalidateAll();
		} finally {
			adding = false;
		}
	}
</script>

<div class="spark mb-6">
	<Button
		variant="ghost"
		type="button"
		class="h-auto px-0 text-muted-foreground hover:text-foreground"
		disabled={disabled || adding}
		aria-label={site.sparkLabel}
		onclick={addSpark}
	>
		{adding ? site.sparkLoadingLabel : site.sparkLabel}
	</Button>
</div>
