<script lang="ts">
	import EmphasisText from '$lib/components/site/EmphasisText.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import type { Task } from '$lib/types/day';
	import { cn } from '$lib/utils';
	import { X } from '@lucide/svelte';

	let {
		task,
		disabled = false,
		onToggle,
		onRemove,
	}: {
		task: Task;
		disabled?: boolean;
		onToggle: (id: string) => void;
		onRemove: (id: string) => void | Promise<void>;
	} = $props();

	let removing = $state(false);

	const done = $derived(task.status === 'done');
	const inputId = $derived(`task-${task.id}`);

	function handleRemove() {
		if (removing || disabled) return;

		removing = true;
		Promise.resolve(onRemove(task.id)).finally(() => {
			removing = false;
		});
	}
</script>

<label
	for={inputId}
	class={cn(
		'task-row-surface min-w-0 flex-1',
		done && 'task-row-surface--done',
		disabled && 'task-row-surface--disabled',
	)}
>
	<input
		id={inputId}
		type="checkbox"
		class="mt-1 size-4 shrink-0 rounded border-border accent-primary"
		checked={done}
		{disabled}
		onchange={() => onToggle(task.id)}
	/>
	<span class="min-w-0 flex-1 space-y-1">
		<span
			class={cn('block text-base leading-relaxed', done && 'text-muted-foreground line-through')}
		>
			<EmphasisText text={task.text} />
		</span>
		{#if task.carriedFrom}
			<span class="font-mono text-xs text-muted-foreground">From {task.carriedFrom}</span>
		{:else if task.source === 'spark'}
			<span class="text-xs text-muted-foreground">{site.sparkMetaLabel}</span>
		{:else if task.jiraKey}
			<span class="font-mono text-xs text-muted-foreground">{task.jiraKey}</span>
		{/if}
	</span>
</label>
{#if !disabled}
	<Button
		variant="ghost"
		size="icon-sm"
		type="button"
		class={cn(
			'mt-2 shrink-0 text-muted-foreground opacity-70 transition-opacity hover:text-destructive hover:opacity-100 focus-visible:opacity-100 group-hover/task-row:opacity-100',
			removing && 'pointer-events-none opacity-40',
		)}
		aria-label={site.removeTaskLabel}
		disabled={removing}
		onclick={handleRemove}
	>
		<X class="size-4" aria-hidden="true" />
	</Button>
{/if}
