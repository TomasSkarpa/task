<script lang="ts">
	import EmphasisText from '$lib/components/site/EmphasisText.svelte';
	import type { Task } from '$lib/types/day';
	import { cn } from '$lib/utils';

	let {
		task,
		disabled = false,
		onToggle,
	}: {
		task: Task;
		disabled?: boolean;
		onToggle: (id: string) => void;
	} = $props();

	const done = $derived(task.status === 'done');
	const inputId = $derived(`task-${task.id}`);
</script>

<li class="task-row">
	<label
		for={inputId}
		class={cn(
			'task-row-surface',
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
			{:else if task.jiraKey}
				<span class="font-mono text-xs text-muted-foreground">{task.jiraKey}</span>
			{/if}
		</span>
	</label>
</li>
