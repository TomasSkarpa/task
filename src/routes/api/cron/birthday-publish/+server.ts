import { env } from '$env/dynamic/private';
import {
	excludedPersonIds,
	publishBirthdayEvents,
	type BirthdayEvent,
} from '$lib/server/birthday-queue';
import { pragueWorkdayTime } from '$lib/server/discord-workday';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function postToDiscord(event: BirthdayEvent): Promise<void> {
	const response = await fetch(`${env.DISCORD_BIRTHDAY_WEBHOOK_URL}?wait=true`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			content: `🎂 Today is **${event.name}’s birthday**! Don’t forget to wish them a wonderful day.`,
			allowed_mentions: { parse: [] },
		}),
	});
	if (!response.ok) throw new Error(`Discord returned ${response.status}`);
}

export const GET: RequestHandler = async ({ request }) => {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		error(401, 'Unauthorized');
	}

	const { date, hour } = pragueWorkdayTime();
	if (hour !== '09') return json({ sent: false, reason: 'Outside the Prague 09:00 hour' });
	if (env.BIRTHDAY_EXCLUSIONS_CONFIRMED !== 'true') {
		return json({ sent: false, reason: 'Birthday exclusions have not been confirmed' });
	}
	if (!env.DISCORD_BIRTHDAY_WEBHOOK_URL) error(500, 'Birthday webhook is not configured');

	const sent = await publishBirthdayEvents(
		date,
		excludedPersonIds(env.IMMICH_DECEASED_PERSON_IDS),
		postToDiscord,
	);
	return json({ sent: true, date, count: sent });
};
