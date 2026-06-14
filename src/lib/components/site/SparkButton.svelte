<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';

	let {
		disabled = false,
		onAdd,
	}: {
		disabled?: boolean;
		onAdd: () => Promise<boolean>;
	} = $props();

	let adding = $state(false);

	async function addSpark() {
		if (adding || disabled) return;

		adding = true;
		try {
			await onAdd();
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
