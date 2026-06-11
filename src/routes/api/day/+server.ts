import { loadDay, todayDateString } from '$lib/server/day-store';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const date = url.searchParams.get('date') ?? todayDateString();

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		error(400, 'Invalid date');
	}

	const day = await loadDay(date);
	return json({ day });
};
