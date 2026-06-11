<script lang="ts">
	import AddTaskForm from '$lib/components/site/AddTaskForm.svelte';
	import CloseDayDialog from '$lib/components/site/CloseDayDialog.svelte';
	import DayShell from '$lib/components/site/DayShell.svelte';
	import TaskRow from '$lib/components/site/TaskRow.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let confirmOpen = $state(false);
	let closing = $state(false);

	const day = $derived(data.day);
	const isClosed = $derived(day.status === 'closed');
	const openTaskCount = $derived(day.tasks.filter((t) => t.status === 'open').length);
	const sortedTasks = $derived([...day.tasks].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)));

	const dateLabel = $derived(
		new Intl.DateTimeFormat('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: site.timeZone,
		}).format(new Date(`${day.date}T12:00:00`)),
	);

	async function toggleTask(taskId: string) {
		const response = await fetch('/api/task/toggle', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ date: day.date, taskId }),
		});

		if (!response.ok) return;
		await invalidateAll();
	}

	async function closeDay() {
		closing = true;
		try {
			const response = await fetch('/api/day/close', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date: day.date }),
			});

			if (!response.ok) return;
			await invalidateAll();
		} finally {
			closing = false;
		}
	}
</script>

<DayShell>
	<header class="day-header mb-8 space-y-2">
		<p class="text-sm font-medium uppercase tracking-widest text-muted-foreground">
			{site.pageTitle}
		</p>
		<h1 class="text-3xl font-semibold tracking-tight">{dateLabel}</h1>
		{#if isClosed}
			<p class="font-mono text-sm text-muted-foreground">{day.date}</p>
		{/if}
	</header>

	{#if isClosed}
		<section class="day-closed rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
			<p class="text-lg font-medium text-foreground">{site.closedLabel}</p>
			<p class="mt-2 text-sm text-muted-foreground">Open tasks moved to the next day.</p>
		</section>
	{:else}
		<AddTaskForm date={day.date} />

		{#if sortedTasks.length === 0}
			<section class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
				<p class="text-sm text-muted-foreground">{site.emptyLabel}</p>
			</section>
		{:else}
			<ul class="task-list space-y-2" aria-label="Today's tasks">
				{#each sortedTasks as task (task.id)}
					<TaskRow {task} onToggle={toggleTask} />
				{/each}
			</ul>
		{/if}

		<div class="mt-8 flex justify-end">
			<Button variant="outline" onclick={() => (confirmOpen = true)}>{site.closeDayLabel}</Button>
		</div>
	{/if}
</DayShell>

<CloseDayDialog
	bind:open={confirmOpen}
	{openTaskCount}
	loading={closing}
	onConfirm={closeDay}
/>
