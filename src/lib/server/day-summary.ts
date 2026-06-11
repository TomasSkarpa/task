import type { Day, DaySummary } from '$lib/types/day';

const PREVIEW_MAX = 72;

export function plainTaskText(text: string): string {
	return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

export function truncatePreview(text: string, max = PREVIEW_MAX): string {
	const plain = plainTaskText(text);

	if (plain.length <= max) {
		return plain;
	}

	return `${plain.slice(0, max - 1).trimEnd()}…`;
}

export function buildDaySummary(day: Day): DaySummary {
	const sorted = [...day.tasks].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	const doneCount = day.tasks.filter((task) => task.status === 'done').length;
	const first = sorted[0];

	return {
		date: day.date,
		status: day.status,
		closedAt: day.closedAt,
		closedBy: day.closedBy,
		taskCount: day.tasks.length,
		doneCount,
		openCount: day.tasks.length - doneCount,
		preview: first ? truncatePreview(first.text) : null,
	};
}
