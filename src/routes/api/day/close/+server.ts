import { closeDay } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { date?: string };
	const date = body.date;

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		error(400, 'Invalid date');
	}

	const result = await closeDay(date, 'manual');
	return json(result);
};
