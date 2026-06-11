<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { site } from '$lib/data/site';
	import { invalidateAll } from '$app/navigation';

	let { date }: { date: string } = $props();

	let text = $state('');
	let adding = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();

		const value = text.trim();
		if (!value || adding) return;

		adding = true;
		try {
			const response = await fetch('/api/task/add', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date, text: value }),
			});

			if (!response.ok) return;

			text = '';
			await invalidateAll();
		} finally {
			adding = false;
		}
	}
</script>

<form class="add-task mb-6 flex gap-2" aria-label={site.addTaskLabel} onsubmit={submit}>
	<Input
		type="text"
		bind:value={text}
		placeholder={site.addTaskPlaceholder}
		disabled={adding}
		aria-label={site.addTaskPlaceholder}
		autocomplete="off"
	/>
	<Button type="submit" disabled={adding || !text.trim()}>
		{adding ? site.addTaskLoadingLabel : site.addTaskLabel}
	</Button>
</form>
