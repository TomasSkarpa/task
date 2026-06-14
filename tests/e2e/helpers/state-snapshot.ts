import type { Page } from '@playwright/test';

export type TaskRowSnapshot = {
	index: number;
	label: string;
	checked: boolean;
	hasLineThrough: boolean;
	hasDoneSurface: boolean;
	removeVisible: boolean;
};

export type UiSnapshot = {
	atMs: number;
	event: string;
	taskCount: number;
	e2eTaskCount: number;
	rows: TaskRowSnapshot[];
	emptyStateVisible: boolean;
};

export async function captureUiState(
	page: Page,
	atMs: number,
	event: string,
	e2ePrefix: string,
): Promise<UiSnapshot> {
	return page.evaluate(
		({ atMs, event, e2ePrefix }) => {
			const surfaces = Array.from(document.querySelectorAll('.task-row-surface'));
			const rows = surfaces.map((surface, index) => {
				const checkbox = surface.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
				const text = surface.querySelector('.block.text-base');
				const listItem = surface.closest('li');
				const removeButton = listItem?.querySelector('button[aria-label="Remove task"]');

				const label = (checkbox?.getAttribute('aria-label') ?? text?.textContent ?? '').trim();

				return {
					index,
					label: label.slice(0, 120),
					checked: Boolean(checkbox?.checked),
					hasLineThrough: Boolean(text?.classList.contains('line-through')),
					hasDoneSurface: surface.classList.contains('task-row-surface--done'),
					removeVisible: Boolean(
						removeButton && !removeButton.hasAttribute('disabled') && removeButton.offsetParent !== null,
					),
				};
			});

			const emptyState = document.querySelector('.rounded-xl.border-dashed .text-sm.text-muted-foreground');
			const emptyStateVisible = Boolean(
				emptyState?.textContent?.includes('No tasks yet') && emptyState.checkVisibility?.() !== false,
			);

			return {
				atMs,
				event,
				taskCount: rows.length,
				e2eTaskCount: rows.filter((row) => row.label.includes(e2ePrefix)).length,
				rows,
				emptyStateVisible,
			};
		},
		{ atMs, event, e2ePrefix },
	);
}

export function findE2eRows(snapshot: UiSnapshot, prefix: string): TaskRowSnapshot[] {
	return snapshot.rows.filter((row) => row.label.includes(prefix));
}
