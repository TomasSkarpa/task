import { loadStoredDay, todayDateString } from '$lib/server/day-store';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { date } = params;

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		error(404, 'Day not found');
	}

	const day = await loadStoredDay(date);

	if (!day) {
		error(404, 'Day not found');
	}

	return { day, today: todayDateString() };
};
