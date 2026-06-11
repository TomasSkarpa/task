import { addTask } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { date?: string; text?: string };
	const { date, text } = body;

	if (!date || typeof text !== 'string') {
		error(400, 'Missing date or text');
	}

	try {
		const day = await addTask(date, text);
		return json({ day });
	} catch (err) {
		if (err instanceof Error && err.message === 'Task text is required') {
			error(400, err.message);
		}
		throw err;
	}
};
