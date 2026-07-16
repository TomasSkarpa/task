import { env } from '$env/dynamic/private';
import {
	buildWorkdayMessage,
	isPragueWeekday,
	markWorkdayReminderSent,
	pragueWorkdayTime,
	wasWorkdayReminderSent,
} from '$lib/server/discord-workday';
import { loadDay } from '$lib/server/day-store';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		error(401, 'Unauthorized');
	}

	if (!isPragueWeekday()) {
		return json({ sent: false, reason: 'Weekend in Prague' });
	}

	if (!env.DISCORD_WORKDAY_WEBHOOK_URL) {
		error(500, 'Discord workday webhook is not configured');
	}

	const { date } = pragueWorkdayTime();
	if (await wasWorkdayReminderSent(date)) {
		return json({ sent: false, reason: 'Already sent', date });
	}

	const day = await loadDay(date);
	const response = await fetch(`${env.DISCORD_WORKDAY_WEBHOOK_URL}?wait=true`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			content: buildWorkdayMessage(day),
			allowed_mentions: { parse: [] },
		}),
	});

	if (!response.ok) {
		console.error('Discord workday reminder failed', response.status, await response.text());
		error(502, 'Discord rejected the workday reminder');
	}

	await markWorkdayReminderSent(date);

	return json({ sent: true, date, openTasks: day.tasks.filter((task) => task.status === 'open').length });
};
