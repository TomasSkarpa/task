import { site } from '$lib/data/site';

export function formatDayLabel(date: string, style: 'short' | 'long' = 'short'): string {
	return new Intl.DateTimeFormat('en-GB', {
		weekday: style === 'short' ? 'short' : 'long',
		day: 'numeric',
		month: style === 'short' ? 'short' : 'long',
		...(style === 'long' ? { year: 'numeric' as const } : {}),
		timeZone: site.timeZone,
	}).format(new Date(`${date}T12:00:00`));
}
