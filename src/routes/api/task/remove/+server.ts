import { loadDay, removeTasks } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type RemoveTaskBody = {
	date?: string;
	taskId?: string;
	taskIds?: string[];
};

function resolveTaskIds(body: RemoveTaskBody): string[] {
	if (Array.isArray(body.taskIds) && body.taskIds.length > 0) {
		return body.taskIds.filter((id) => typeof id === 'string' && id.length > 0);
	}

	if (typeof body.taskId === 'string' && body.taskId.length > 0) {
		return [body.taskId];
	}

	return [];
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as RemoveTaskBody;
	const { date } = body;
	const taskIds = resolveTaskIds(body);

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || taskIds.length === 0) {
		error(400, 'Missing date or taskId(s)');
	}

	const dayBefore = await loadDay(date);
	const removed = dayBefore.tasks.filter((task) => taskIds.includes(task.id)).length;
	const day = await removeTasks(date, taskIds);

	return json({ day, removed });
};
