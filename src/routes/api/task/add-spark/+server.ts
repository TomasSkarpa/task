import { addSparkTask, SparkAlreadyAddedError } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { date?: string };
	const { date } = body;

	if (!date) {
		error(400, 'Missing date');
	}

	try {
		const day = await addSparkTask(date);
		return json({ day });
	} catch (err) {
		if (err instanceof SparkAlreadyAddedError) {
			error(409, err.message);
		}
		throw err;
	}
};
