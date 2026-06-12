import { randomUUID } from 'node:crypto';
import { pickSparkPrompt } from '$lib/data/spark-prompts';
import { listStoredDayDates, readDay, writeDay } from '$lib/server/day-persistence';
import { buildDaySummary } from '$lib/server/day-summary';
import type { ClosedBy, Day, DaySummary, Task } from '$lib/types/day';

export class SparkAlreadyAddedError extends Error {
	constructor() {
		super('Spark already added today');
		this.name = 'SparkAlreadyAddedError';
	}
}

function isSparkTask(task: Task): boolean {
	return task.source === 'spark';
}

export function countsTowardSpillover(task: Task): boolean {
	return task.status === 'open' && !isSparkTask(task);
}

const TZ = 'Europe/Prague';

export function todayDateString(now = new Date()): string {
	return formatDateInTz(now, TZ);
}

export function nextDateString(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	const utc = new Date(Date.UTC(y, m - 1, d + 1));
	return utc.toISOString().slice(0, 10);
}

function formatDateInTz(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

function emptyDay(date: string): Day {
	return {
		date,
		status: 'open',
		closedAt: null,
		closedBy: null,
		tasks: [],
	};
}

export async function loadDay(date: string): Promise<Day> {
	const day = await readDay(date);
	return day ?? emptyDay(date);
}

export async function loadStoredDay(date: string): Promise<Day | null> {
	return readDay(date);
}

export async function loadDaySummaries(): Promise<DaySummary[]> {
	const dates = await listStoredDayDates();
	const summaries = await Promise.all(
		dates.map(async (date) => {
			const day = await readDay(date);

			if (!day) {
				return null;
			}

			return buildDaySummary(day);
		}),
	);

	return summaries.filter((summary): summary is DaySummary => summary !== null);
}

export async function saveDay(day: Day): Promise<void> {
	await writeDay(day);
}

export async function loadToday(): Promise<Day> {
	return loadDay(todayDateString());
}

function taskKey(task: Task): string {
	return task.jiraKey ?? task.id;
}

function mergeTask(existing: Task, incoming: Task): Task {
	return {
		...existing,
		...incoming,
		id: existing.id,
		jiraKey: existing.jiraKey ?? incoming.jiraKey,
	};
}

function isJiraSourcedTask(task: Task): boolean {
	return task.source === 'jira' || task.id.startsWith('jira-');
}

export async function upsertCarryoverTasks(targetDate: string, tasks: Task[]): Promise<Day> {
	const day = await loadDay(targetDate);
	const byKey = new Map(day.tasks.map((t) => [taskKey(t), t]));

	for (const task of tasks) {
		const key = taskKey(task);
		const existing = byKey.get(key);
		if (existing) {
			byKey.set(key, mergeTask(existing, { ...task, id: existing.id }));
		} else {
			byKey.set(key, task);
		}
	}

	day.tasks = [...byKey.values()].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	await saveDay(day);
	return day;
}

export async function upsertJiraTasks(
	date: string,
	tasks: Task[],
	replaceAll = false,
): Promise<Day> {
	const day = await loadDay(date);

	if (day.status === 'closed') {
		return day;
	}

	const incomingIds = new Set(tasks.map((task) => task.id));
	const preserved = day.tasks.filter((task) => {
		if (!isJiraSourcedTask(task)) {
			return true;
		}

		if (replaceAll) {
			return false;
		}

		return !incomingIds.has(task.id);
	});

	const byId = new Map(preserved.map((task) => [task.id, task]));
	let maxSort = preserved.reduce((max, task) => Math.max(max, task.sort ?? 0), -1);

	for (const task of tasks) {
		maxSort += 1;
		byId.set(task.id, {
			...task,
			status: 'open',
			source: 'jira',
			sort: byId.get(task.id)?.sort ?? maxSort,
		});
	}

	day.tasks = [...byId.values()].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	await saveDay(day);
	return day;
}

export async function closeDay(
	date: string,
	closedBy: ClosedBy,
	now = new Date(),
): Promise<{ closed: Day; next: Day | null }> {
	const day = await loadDay(date);

	if (day.status === 'closed') {
		return { closed: day, next: null };
	}

	const openTasks = day.tasks.filter(countsTowardSpillover);
	const tomorrow = nextDateString(date);

	day.status = 'closed';
	day.closedAt = now.toISOString();
	day.closedBy = closedBy;
	await saveDay(day);

	if (openTasks.length === 0) {
		return { closed: day, next: null };
	}

	const carryover: Task[] = openTasks.map((task, index) => ({
		id: task.jiraKey ? `jira-${task.jiraKey.toLowerCase()}` : `carry-${date}-${task.id}`,
		text: task.text,
		status: 'open' as const,
		source: 'carryover' as const,
		jiraKey: task.jiraKey,
		carriedFrom: date,
		sort: index,
	}));

	const next = await upsertCarryoverTasks(tomorrow, carryover);
	return { closed: day, next };
}

export async function addSparkTask(date: string): Promise<Day> {
	const day = await loadDay(date);

	if (day.status === 'closed') {
		return day;
	}

	if (day.tasks.some(isSparkTask)) {
		throw new SparkAlreadyAddedError();
	}

	const maxSort = day.tasks.reduce((max, task) => Math.max(max, task.sort ?? 0), -1);
	const task: Task = {
		id: `spark-${randomUUID()}`,
		text: pickSparkPrompt(),
		status: 'open',
		source: 'spark',
		jiraKey: null,
		carriedFrom: null,
		sort: maxSort + 1,
	};

	day.tasks = [...day.tasks, task];
	await saveDay(day);
	return day;
}

export async function addTask(date: string, text: string): Promise<Day> {
	const trimmed = text.trim();

	if (!trimmed) {
		throw new Error('Task text is required');
	}

	const day = await loadDay(date);

	if (day.status === 'closed') {
		return day;
	}

	const maxSort = day.tasks.reduce((max, task) => Math.max(max, task.sort ?? 0), -1);
	const task: Task = {
		id: `manual-${randomUUID()}`,
		text: trimmed,
		status: 'open',
		source: 'manual',
		jiraKey: null,
		carriedFrom: null,
		sort: maxSort + 1,
	};

	day.tasks = [...day.tasks, task];
	await saveDay(day);
	return day;
}

export async function toggleTask(date: string, taskId: string): Promise<Day> {
	const day = await loadDay(date);

	if (day.status === 'closed') {
		return day;
	}

	day.tasks = day.tasks.map((task) =>
		task.id === taskId
			? { ...task, status: task.status === 'done' ? 'open' : 'done' }
			: task,
	);

	await saveDay(day);
	return day;
}

export async function removeTasks(date: string, taskIds: string[]): Promise<Day> {
	const day = await loadDay(date);

	if (day.status === 'closed' || taskIds.length === 0) {
		return day;
	}

	const remove = new Set(taskIds);
	day.tasks = day.tasks.filter((task) => !remove.has(task.id));
	await saveDay(day);
	return day;
}

export function countOpenTasks(day: Day): number {
	return day.tasks.filter((t) => t.status === 'open').length;
}

export function countSpilloverTasks(day: Day): number {
	return day.tasks.filter(countsTowardSpillover).length;
}
