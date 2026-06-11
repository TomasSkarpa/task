<script lang="ts">
	import AddTaskForm from '$lib/components/site/AddTaskForm.svelte';
	import CloseDayDialog from '$lib/components/site/CloseDayDialog.svelte';
	import DayShell from '$lib/components/site/DayShell.svelte';
	import TaskRow from '$lib/components/site/TaskRow.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import type { Day } from '$lib/types/day';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';

	let { data } = $props();

	let confirmOpen = $state(false);
	let closing = $state(false);
	let dayView = $state<Day | undefined>();
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	$effect.pre(() => {
		dayView = data.day;
	});

	const activeDay = $derived(dayView ?? data.day);

	const listMotionMs = $derived(reduceMotion ? 0 : 220);
	const emptyFadeMs = $derived(reduceMotion ? 0 : 200);
	const emptyFadeDelay = $derived(reduceMotion ? 0 : 140);

	const isClosed = $derived(activeDay?.status === 'closed');
	const openTaskCount = $derived(activeDay?.tasks.filter((t) => t.status === 'open').length ?? 0);
	const sortedTasks = $derived(
		[...(activeDay?.tasks ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
	);

	const dateLabel = $derived.by(() => {
		const date = activeDay?.date;
		if (!date) return '';
		return new Intl.DateTimeFormat('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: site.timeZone,
		}).format(new Date(`${date}T12:00:00`));
	});

	async function toggleTask(taskId: string) {
		if (!dayView) return;

		const response = await fetch('/api/task/toggle', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ date: dayView.date, taskId }),
		});

		if (!response.ok) return;
		await invalidateAll();
	}

	async function removeTask(taskId: string) {
		if (!dayView) return;

		const snapshot = dayView;
		dayView = {
			...dayView,
			tasks: dayView.tasks.filter((task) => task.id !== taskId),
		};

		const response = await fetch('/api/task/remove', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ date: dayView.date, taskId }),
		});

		if (!response.ok) {
			dayView = snapshot;
			return;
		}

		const payload = (await response.json()) as { day: Day };
		dayView = payload.day;
	}

	async function closeDay() {
		if (!dayView) return;

		closing = true;
		try {
			const response = await fetch('/api/day/close', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date: dayView.date }),
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
		{#if activeDay && isClosed}
			<p class="font-mono text-sm text-muted-foreground">{activeDay.date}</p>
		{/if}
	</header>

	{#if activeDay && isClosed}
		<section class="day-closed rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
			<p class="text-lg font-medium text-foreground">{site.closedLabel}</p>
			<p class="mt-2 text-sm text-muted-foreground">Open tasks moved to the next day.</p>
		</section>
	{:else if activeDay}
		<AddTaskForm date={activeDay.date} />

		{#if sortedTasks.length === 0}
			<section
				class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center"
				in:fade={{ duration: emptyFadeMs, delay: emptyFadeDelay }}
			>
				<p class="text-sm text-muted-foreground">{site.emptyLabel}</p>
			</section>
		{:else}
			<ul class="task-list flex flex-col gap-2" aria-label="Today's tasks">
				{#each sortedTasks as task (task.id)}
					<li
						class="task-row group/task-row flex items-start gap-2 overflow-hidden"
						in:fade={{ duration: listMotionMs * 0.7 }}
						out:slide={{ duration: listMotionMs, easing: cubicOut }}
						animate:flip={{ duration: listMotionMs, easing: cubicOut }}
					>
						<TaskRow {task} onToggle={toggleTask} onRemove={removeTask} />
					</li>
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
