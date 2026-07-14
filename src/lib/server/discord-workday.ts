import type { Day, Task } from '$lib/types/day';

const DISCORD_CONTENT_LIMIT = 2_000;
const TASKS_URL = 'https://task.skarpa.dev/';

function taskLine(task: Task, index: number): string {
	return `${index + 1}. ${task.text}`;
}

export function buildWorkdayMessage(day: Day): string {
	const openTasks = day.tasks
		.filter((task) => task.status === 'open')
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	const doneCount = day.tasks.filter((task) => task.status === 'done').length;

	const heading = `Good morning! Your workday is prepared for **${day.date}**.`;
	const footer = doneCount > 0
		? `\n\n${doneCount} already done. Open your day: ${TASKS_URL}`
		: `\n\nOpen your day: ${TASKS_URL}`;

	if (openTasks.length === 0) {
		return `${heading}\n\nNo open tasks are waiting for you today.${footer}`;
	}

	const intro = `${heading}\n\n**Today's open tasks (${openTasks.length})**\n`;
	const available = DISCORD_CONTENT_LIMIT - intro.length - footer.length;
	const lines: string[] = [];
	let used = 0;

	for (const [index, task] of openTasks.entries()) {
		const line = taskLine(task, index);
		const extra = (lines.length > 0 ? 1 : 0) + line.length;

		if (used + extra > available) {
			const remaining = openTasks.length - lines.length;
			lines.push(`…and ${remaining} more`);
			break;
		}

		lines.push(line);
		used += extra;
	}

	return `${intro}${lines.join('\n')}${footer}`;
}

export function pragueWorkdayTime(now = new Date()): {
	date: string;
	weekday: string;
	hour: string;
} {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Prague',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short',
		hour: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(now);
	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? '';

	return {
		date: `${value('year')}-${value('month')}-${value('day')}`,
		weekday: value('weekday'),
		hour: value('hour'),
	};
}

export function isPragueWorkdayMorning(now = new Date()): boolean {
	const { weekday, hour } = pragueWorkdayTime(now);
	return !['Sat', 'Sun'].includes(weekday) && hour === '09';
}
