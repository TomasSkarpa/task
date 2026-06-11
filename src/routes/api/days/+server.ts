import { loadDaySummaries } from '$lib/server/day-store';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const days = await loadDaySummaries();
	return json({ days });
};
