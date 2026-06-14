import type { Day } from '../../../src/lib/types/day';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://task.skarpa.dev';

export const E2E_TASK_PREFIX = 'e2e-state';

export function apiUrl(path: string): string {
	return new URL(path, baseURL).toString();
}

export async function fetchDay(date?: string): Promise<Day> {
	const url = date ? apiUrl(`/api/day?date=${date}`) : apiUrl('/api/day');
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`GET /api/day failed: ${response.status}`);
	}

	const payload = (await response.json()) as { day: Day };
	return payload.day;
}

export async function addTask(text: string, date: string): Promise<Day> {
	const response = await fetch(apiUrl('/api/task/add'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ date, text }),
	});

	if (!response.ok) {
		throw new Error(`POST /api/task/add failed: ${response.status}`);
	}

	const payload = (await response.json()) as { day: Day };
	return payload.day;
}

export async function removeTasks(date: string, taskIds: string[]): Promise<Day> {
	const response = await fetch(apiUrl('/api/task/remove'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ date, taskIds }),
	});

	if (!response.ok) {
		throw new Error(`POST /api/task/remove failed: ${response.status}`);
	}

	const payload = (await response.json()) as { day: Day };
	return payload.day;
}

export function isE2eTask(text: string): boolean {
	return text.includes(E2E_TASK_PREFIX);
}

export async function cleanupE2eTasks(date: string): Promise<Day> {
	const day = await fetchDay(date);
	const e2eIds = day.tasks.filter((task) => isE2eTask(task.text)).map((task) => task.id);

	if (e2eIds.length === 0) {
		return day;
	}

	return removeTasks(date, e2eIds);
}

export async function seedE2eTasks(date: string, count = 3): Promise<{ day: Day; labels: string[] }> {
	await cleanupE2eTasks(date);

	const stamp = Date.now();
	const labels = Array.from({ length: count }, (_, index) => {
		return `${E2E_TASK_PREFIX} ${stamp} task ${index + 1}`;
	});

	let day = await fetchDay(date);

	for (const text of labels) {
		day = await addTask(text, date);
	}

	return { day, labels };
}
