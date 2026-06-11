import { toggleTask } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { date?: string; taskId?: string };
	const { date, taskId } = body;

	if (!date || !taskId) {
		error(400, 'Missing date or taskId');
	}

	const day = await toggleTask(date, taskId);
	return json({ day });
};
