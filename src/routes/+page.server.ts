import { loadToday } from '$lib/server/day-store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const day = await loadToday();
	return { day };
};
