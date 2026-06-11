import { upsertJiraTasks } from '$lib/server/day-store';
import type { Task } from '$lib/types/day';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type SyncJiraBody = {
	date?: string;
	tasks?: Task[];
	replaceAll?: boolean;
};

function isValidTask(task: Task): boolean {
	return (
		typeof task.id === 'string' &&
		task.id.length > 0 &&
		typeof task.text === 'string' &&
		task.text.trim().length > 0 &&
		(task.status === 'open' || task.status === 'done') &&
		task.source === 'jira'
	);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as SyncJiraBody;
	const { date, tasks, replaceAll = false } = body;

	if (!date || !Array.isArray(tasks) || tasks.length === 0) {
		error(400, 'Missing date or tasks');
	}

	if (!tasks.every(isValidTask)) {
		error(400, 'Invalid task payload');
	}

	const day = await upsertJiraTasks(date, tasks, replaceAll);
	return json({ day, created: tasks.length, replaceAll });
};
