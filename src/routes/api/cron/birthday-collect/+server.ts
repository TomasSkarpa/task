import { env } from '$env/dynamic/private';
import {
	collectBirthdayEvents,
	excludedPersonIds,
	type ImmichPerson,
} from '$lib/server/birthday-queue';
import { pragueWorkdayTime } from '$lib/server/discord-workday';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		error(401, 'Unauthorized');
	}

	const { date, hour } = pragueWorkdayTime();
	if (hour !== '08') return json({ collected: false, reason: 'Outside the Prague 08:00 hour' });
	if (!env.IMMICH_API_KEY) error(500, 'Immich API key is not configured');

	const response = await fetch('https://photos.hannie.space/api/people', {
		headers: { 'x-api-key': env.IMMICH_API_KEY },
	});
	if (!response.ok) error(502, 'Unable to read Immich people');

	const payload = await response.json() as { people: ImmichPerson[] };
	const added = await collectBirthdayEvents(
		payload.people,
		date,
		excludedPersonIds(env.IMMICH_DECEASED_PERSON_IDS),
	);

	return json({ collected: true, date, added });
};
