import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ClosedBy, Day, Task } from '$lib/types/day';

const DATA_ROOT = join(process.cwd(), 'data', 'days');
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

function dayPath(date: string): string {
	return join(DATA_ROOT, `${date}.json`);
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
	try {
		const raw = await readFile(dayPath(date), 'utf8');
		return JSON.parse(raw) as Day;
	} catch {
		return emptyDay(date);
	}
}

export async function saveDay(day: Day): Promise<void> {
	await mkdir(DATA_ROOT, { recursive: true });
	await writeFile(dayPath(day.date), `${JSON.stringify(day, null, '\t')}\n`, 'utf8');
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

export async function closeDay(
	date: string,
	closedBy: ClosedBy,
	now = new Date(),
): Promise<{ closed: Day; next: Day | null }> {
	const day = await loadDay(date);

	if (day.status === 'closed') {
		return { closed: day, next: null };
	}

	const openTasks = day.tasks.filter((t) => t.status === 'open');
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

export function countOpenTasks(day: Day): number {
	return day.tasks.filter((t) => t.status === 'open').length;
}
