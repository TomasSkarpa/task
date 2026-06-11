<script lang="ts">
	let { text }: { text: string } = $props();

	const segments = $derived(
		text
			.split(/(\*\*[^*]+\*\*)/g)
			.filter(Boolean)
			.map((part) =>
				part.startsWith('**') && part.endsWith('**')
					? { type: 'strong' as const, value: part.slice(2, -2) }
					: { type: 'text' as const, value: part }
			)
	);
</script>

{#each segments as segment, index (index)}
	{#if segment.type === 'strong'}
		<strong class="font-semibold text-foreground">{segment.value}</strong>
	{:else}
		{segment.value}
	{/if}
{/each}
