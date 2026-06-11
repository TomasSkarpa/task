<script lang="ts">
	import DayShell from '$lib/components/site/DayShell.svelte';
	import { formatDayLabel } from '$lib/format-day';
	import { site } from '$lib/data/site';
	import type { DaySummary } from '$lib/types/day';

	let { data } = $props();

	function summaryStats(day: DaySummary): string {
		if (day.taskCount === 0) {
			return day.status === 'closed' ? 'Closed · No tasks' : 'No tasks';
		}

		const parts = [`${day.taskCount} task${day.taskCount === 1 ? '' : 's'}`];

		if (day.doneCount > 0) {
			parts.push(`${day.doneCount} done`);
		}

		if (day.openCount > 0) {
			parts.push(`${day.openCount} open`);
		}

		const stats = parts.join(' · ');
		return day.status === 'closed' ? `Closed · ${stats}` : stats;
	}
</script>

<svelte:head>
	<title>{site.historyTitle} · {site.name}</title>
</svelte:head>

<DayShell>
	<header class="day-header mb-8 space-y-2">
		<p class="text-sm font-medium uppercase tracking-widest text-muted-foreground">
			{site.historyTitle}
		</p>
		<h1 class="text-3xl font-semibold tracking-tight">{site.historyHeading}</h1>
		<p class="text-sm text-muted-foreground">{site.historyDescription}</p>
	</header>

	{#if data.days.length === 0}
		<section class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
			<p class="text-sm text-muted-foreground">{site.historyEmptyLabel}</p>
		</section>
	{:else}
		<ul class="flex flex-col gap-3" aria-label="Past days">
			{#each data.days as day (day.date)}
				<li>
					<a
						href="/history/{day.date}"
						class="history-day-link block rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
					>
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<h2 class="text-base font-semibold text-foreground">
								{formatDayLabel(day.date, 'long')}
							</h2>
							<div class="flex items-center gap-2">
								{#if day.date === data.today}
									<span
										class="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
									>
										{site.pageTitle}
									</span>
								{/if}
								<span class="font-mono text-xs text-muted-foreground">{day.date}</span>
							</div>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{summaryStats(day)}</p>
						{#if day.preview}
							<p class="mt-2 truncate text-sm text-foreground/90">{day.preview}</p>
						{:else}
							<p class="mt-2 text-sm text-muted-foreground">{site.emptyLabel}</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</DayShell>
