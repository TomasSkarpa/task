import { loadDaySummaries, todayDateString } from '$lib/server/day-store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const days = await loadDaySummaries();
	return { days, today: todayDateString() };
};
