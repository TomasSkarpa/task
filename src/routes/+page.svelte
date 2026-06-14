<script lang="ts">
	import AddTaskForm from '$lib/components/site/AddTaskForm.svelte';
	import SparkButton from '$lib/components/site/SparkButton.svelte';
	import CloseDayDialog from '$lib/components/site/CloseDayDialog.svelte';
	import DayShell from '$lib/components/site/DayShell.svelte';
	import TaskRow from '$lib/components/site/TaskRow.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { site } from '$lib/data/site';
	import type { Day, Task, TaskStatus } from '$lib/types/day';
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
	let syncedServerDay = '';
	let mutationQueue = Promise.resolve();

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	$effect.pre(() => {
		const fingerprint = JSON.stringify(data.day);
		if (fingerprint !== syncedServerDay) {
			syncedServerDay = fingerprint;
			dayView = data.day;
		}
	});

	const activeDay = $derived(dayView ?? data.day);

	function currentDay(): Day | undefined {
		return dayView ?? data.day;
	}

	function enqueueDayMutation<T>(fn: () => Promise<T>): Promise<T> {
		const next = mutationQueue.then(fn, fn);
		mutationQueue = next.then(
			() => undefined,
			() => undefined,
		);
		return next;
	}

	function applyTaskStatus(day: Day, taskId: string, status: TaskStatus): Day {
		return {
			...day,
			tasks: day.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
		};
	}

	function applyServerTask(day: Day, serverDay: Day, taskId: string): Day {
		const serverTask = serverDay.tasks.find((task) => task.id === taskId);
		if (!serverTask) {
			return day;
		}

		return applyTaskStatus(day, taskId, serverTask.status);
	}

	function sortTasks(tasks: Task[]): Task[] {
		return [...tasks].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	}

	const listMotionMs = $derived(reduceMotion ? 0 : 220);
	const emptyFadeMs = $derived(reduceMotion ? 0 : 200);
	const emptyFadeDelay = $derived(reduceMotion ? 0 : 140);

	const isClosed = $derived(activeDay?.status === 'closed');
	const openTaskCount = $derived(
		activeDay?.tasks.filter((t) => t.status === 'open' && t.source !== 'spark').length ?? 0,
	);
	const hasSparkToday = $derived(activeDay?.sparkUsed ?? false);
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
		const day = currentDay();
		if (!day) return;

		const task = day.tasks.find((entry) => entry.id === taskId);
		if (!task) return;

		const previousStatus = task.status;
		const optimisticStatus: TaskStatus = previousStatus === 'done' ? 'open' : 'done';
		dayView = applyTaskStatus(day, taskId, optimisticStatus);

		void enqueueDayMutation(async () => {
			const response = await fetch('/api/task/toggle', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date: day.date, taskId }),
			});

			if (!response.ok) {
				const current = currentDay();
				if (current) {
					dayView = applyTaskStatus(current, taskId, previousStatus);
				}
				return;
			}

			const payload = (await response.json()) as { day: Day };
			const current = currentDay();
			if (current) {
				dayView = applyServerTask(current, payload.day, taskId);
			}
		});
	}

	async function removeTask(taskId: string) {
		const day = currentDay();
		if (!day) return;

		const removed = day.tasks.find((task) => task.id === taskId);
		if (!removed) return;

		dayView = {
			...day,
			tasks: day.tasks.filter((task) => task.id !== taskId),
		};

		void enqueueDayMutation(async () => {
			const response = await fetch('/api/task/remove', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date: day.date, taskId }),
			});

			if (!response.ok) {
				const current = currentDay();
				if (current && !current.tasks.some((task) => task.id === taskId)) {
					dayView = { ...current, tasks: sortTasks([...current.tasks, removed]) };
				}
				return;
			}

			const payload = (await response.json()) as { day: Day };
			dayView = payload.day;
		});
	}

	async function addTask(text: string): Promise<boolean> {
		return enqueueDayMutation(async () => {
			const day = currentDay();
			if (!day) return false;

			const response = await fetch('/api/task/add', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ date: day.date, text }),
			});

			if (!response.ok) return false;

			const payload = (await response.json()) as { day: Day };
			dayView = payload.day;
			syncedServerDay = JSON.stringify(payload.day);
			return true;
		});
	}

	async function closeDay() {
		const day = currentDay();
		if (!day) return;

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

<svelte:head>
	<title>{site.pageTitle} · {site.name}</title>
</svelte:head>

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
		<AddTaskForm onAdd={addTask} />
		<SparkButton date={activeDay.date} disabled={hasSparkToday} />

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
