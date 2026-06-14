<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { site } from '$lib/data/site';

	let {
		onAdd,
	}: {
		onAdd: (text: string) => Promise<boolean>;
	} = $props();

	let text = $state('');
	let adding = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();

		const value = text.trim();
		if (!value || adding) return;

		adding = true;
		try {
			const added = await onAdd(value);
			if (added) {
				text = '';
			}
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
