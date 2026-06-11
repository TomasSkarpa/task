<script lang="ts">
	import DayShell from '$lib/components/site/DayShell.svelte';
	import TaskRow from '$lib/components/site/TaskRow.svelte';
	import { formatDayLabel } from '$lib/format-day';
	import { site } from '$lib/data/site';
	import type { Task } from '$lib/types/day';

	let { data } = $props();

	const sortedTasks = $derived(
		[...data.day.tasks].sort((a: Task, b: Task) => (a.sort ?? 0) - (b.sort ?? 0)),
	);

	const doneCount = $derived(data.day.tasks.filter((task: Task) => task.status === 'done').length);
	const openCount = $derived(data.day.tasks.length - doneCount);

	function noop() {}
</script>

<svelte:head>
	<title>{formatDayLabel(data.day.date, 'long')} · {site.name}</title>
</svelte:head>

<DayShell>
	<header class="day-header mb-8 space-y-3">
		<p class="text-sm">
			<a
				href="/history"
				class="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
			>
				{site.historyBackLabel}
			</a>
		</p>
		<div class="space-y-2">
			<p class="text-sm font-medium uppercase tracking-widest text-muted-foreground">
				{site.historyDetailTitle}
			</p>
			<h1 class="text-3xl font-semibold tracking-tight">
				{formatDayLabel(data.day.date, 'long')}
			</h1>
			<p class="font-mono text-sm text-muted-foreground">{data.day.date}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			<span
				class="rounded-full border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
			>
				{data.day.status === 'closed' ? site.closedLabel : site.openDayLabel}
			</span>
			{#if data.day.tasks.length > 0}
				<span>{data.day.tasks.length} task{data.day.tasks.length === 1 ? '' : 's'}</span>
				<span aria-hidden="true">·</span>
				<span>{doneCount} done</span>
				{#if openCount > 0}
					<span aria-hidden="true">·</span>
					<span>{openCount} open</span>
				{/if}
			{/if}
		</div>
	</header>

	{#if sortedTasks.length === 0}
		<section class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
			<p class="text-sm text-muted-foreground">{site.emptyLabel}</p>
		</section>
	{:else}
		<ul class="task-list flex flex-col gap-2" aria-label="Tasks for this day">
			{#each sortedTasks as task (task.id)}
				<li class="task-row group/task-row flex items-start gap-2 overflow-hidden">
					<TaskRow {task} disabled onToggle={noop} onRemove={noop} />
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.day.date === data.today}
		<p class="mt-8 text-sm text-muted-foreground">
			<a
				href="/"
				class="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
			>
				{site.historyOpenTodayLabel}
			</a>
		</p>
	{/if}
</DayShell>
