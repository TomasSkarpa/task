import { expect, test } from '@playwright/test';
import {
	cleanupE2eTasks,
	E2E_TASK_PREFIX,
	fetchDay,
	seedE2eTasks,
} from './helpers/day-api';
import { findE2eRows } from './helpers/state-snapshot';
import { StateTimeline } from './helpers/timeline';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://task.skarpa.dev';
const E2E_TASK_COUNT = 6;
const RAPID_ACTION_COUNT = 5;

let dayDate = '';
let e2eLabels: string[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
	const day = await fetchDay();
	dayDate = day.date;

	if (day.status === 'closed') {
		test.skip(true, `Day ${dayDate} is closed; open it before running state-bug tests.`);
	}
});

test.beforeEach(async () => {
	const seeded = await seedE2eTasks(dayDate, E2E_TASK_COUNT);
	e2eLabels = seeded.labels;
});

test.afterAll(async () => {
	if (dayDate) {
		await cleanupE2eTasks(dayDate);
	}
});

function firstE2eRow(page: import('@playwright/test').Page, index = 0) {
	return page
		.getByRole('list', { name: "Today's tasks" })
		.locator('li')
		.filter({ hasText: E2E_TASK_PREFIX })
		.nth(index);
}

async function settleMutations(page: import('@playwright/test').Page) {
	try {
		await page.waitForLoadState('networkidle', { timeout: 30_000 });
	} catch {
		// Slow Blob responses; UI polling still captures intermediate states.
	}
}

async function runScenario(
	page: import('@playwright/test').Page,
	scenario: string,
	action: (timeline: StateTimeline) => Promise<void>,
) {
	const timeline = new StateTimeline(E2E_TASK_PREFIX);
	timeline.attachNetwork(page);

	await page.goto('/');
	await page.getByRole('list', { name: "Today's tasks" }).waitFor();
	await timeline.snap(page, 'loaded');

	await action(timeline);

	await settleMutations(page);
	await timeline.poll(page, 'settle', 25, 200);

	const finalApi = await fetchDay(dayDate);
	const report = timeline.buildReport({
		scenario,
		baseURL,
		dayDate,
		finalApi,
		e2ePrefix: E2E_TASK_PREFIX,
	});

	const reportPath = await timeline.writeReport(report);

	console.log(`\n[state-bug] ${scenario}`);
	console.log(`  report: ${reportPath}`);
	console.log(`  ui/api count match: ${report.analysis.uiApiTaskCountMatch}`);
	console.log(`  ui/api done match: ${report.analysis.uiApiDoneStateMatch}`);
	console.log(`  reappear events: ${report.reappearEvents.length}`);
	console.log(`  checkbox/visual mismatches: ${report.analysis.checkboxVisualMismatchCount}`);
	console.log(`  network: toggle=${report.analysis.toggleResponses} remove=${report.analysis.removeResponses} add=${report.analysis.addResponses}`);

	if (report.reappearEvents.length > 0) {
		console.log('  reappear detail:', JSON.stringify(report.reappearEvents));
	}

	test.info().attach(`${scenario}-report`, {
		body: JSON.stringify(report, null, 2),
		contentType: 'application/json',
	});

	return report;
}

test(`rapid toggle: ${RAPID_ACTION_COUNT} e2e tasks stay done`, async ({ page }) => {
	const report = await runScenario(page, 'rapid-toggle-5', async (timeline) => {
		await expect(
			page.getByRole('list', { name: "Today's tasks" }).locator('li').filter({ hasText: E2E_TASK_PREFIX }),
		).toHaveCount(E2E_TASK_COUNT);

		for (let index = 0; index < RAPID_ACTION_COUNT; index += 1) {
			await firstE2eRow(page, index).getByRole('checkbox').click();
			await timeline.snap(page, `toggle-click-${index + 1}`);
		}
	});

	const e2eRows = findE2eRows(report.finalUi!, E2E_TASK_PREFIX);
	expect.soft(e2eRows.length).toBe(E2E_TASK_COUNT);

	for (let index = 0; index < RAPID_ACTION_COUNT; index += 1) {
		expect.soft(e2eRows[index].checked, `task ${index + 1} checked`).toBe(true);
		expect.soft(e2eRows[index].hasLineThrough, `task ${index + 1} strikethrough`).toBe(true);
	}

	expect.soft(e2eRows[RAPID_ACTION_COUNT].checked, 'untouched task stays open').toBe(false);
	expect.soft(report.analysis.toggleResponses).toBe(RAPID_ACTION_COUNT);
	expect.soft(report.analysis.uiApiDoneStateMatch).toBe(true);
	expect.soft(report.analysis.checkboxVisualMismatchCount).toBe(0);
});

test(`rapid remove: ${RAPID_ACTION_COUNT} e2e tasks do not reappear`, async ({ page }) => {
	const report = await runScenario(page, 'rapid-remove-5', async (timeline) => {
		await expect(
			page.getByRole('list', { name: "Today's tasks" }).locator('li').filter({ hasText: E2E_TASK_PREFIX }),
		).toHaveCount(E2E_TASK_COUNT);

		for (let index = 0; index < RAPID_ACTION_COUNT; index += 1) {
			await firstE2eRow(page, 0).getByRole('button', { name: 'Remove task' }).click();
			await timeline.snap(page, `remove-click-${index + 1}`);
		}
	});

	const e2eRows = findE2eRows(report.finalUi!, E2E_TASK_PREFIX);
	expect.soft(e2eRows.length).toBe(E2E_TASK_COUNT - RAPID_ACTION_COUNT);
	expect.soft(report.analysis.removeResponses).toBe(RAPID_ACTION_COUNT);
	expect.soft(report.analysis.reappearDetected).toBe(false);
	expect.soft(report.analysis.uiApiTaskCountMatch).toBe(true);
});

test('add task while toggling: new task persists', async ({ page }) => {
	const unique = `${E2E_TASK_PREFIX} add-during-toggle ${Date.now()}`;

	const report = await runScenario(page, 'add-during-toggle', async (timeline) => {
		await firstE2eRow(page, 0).getByRole('checkbox').click();
		await timeline.snap(page, 'toggle-click');

		await page.getByRole('textbox', { name: 'What needs doing?' }).fill(unique);
		await page.getByRole('button', { name: 'Add task' }).click();
		await timeline.snap(page, 'add-click');
	});

	expect.soft(report.finalUi?.rows.some((row) => row.label.includes(unique))).toBe(true);
	expect.soft(report.finalApi?.tasks.some((task) => task.text === unique)).toBe(true);
	expect.soft(report.analysis.addResponses).toBeGreaterThanOrEqual(1);
});

test('single toggle: checkbox and strikethrough stay aligned', async ({ page }) => {
	const report = await runScenario(page, 'single-toggle', async (timeline) => {
		await firstE2eRow(page, 0).getByRole('checkbox').click();
		await timeline.snap(page, 'toggle-click');
	});

	const row = findE2eRows(report.finalUi!, E2E_TASK_PREFIX)[0];
	expect.soft(row.checked).toBe(true);
	expect.soft(row.hasLineThrough).toBe(true);
	expect.soft(row.hasDoneSurface).toBe(true);
	expect.soft(report.analysis.checkboxVisualMismatchCount).toBe(0);
});

test('toggle then remove: removed task stays gone', async ({ page }) => {
	const report = await runScenario(page, 'toggle-then-remove', async (timeline) => {
		const row = firstE2eRow(page, 0);

		await row.getByRole('checkbox').click();
		await timeline.snap(page, 'toggle-click');

		await row.getByRole('button', { name: 'Remove task' }).click();
		await timeline.snap(page, 'remove-click');
	});

	const e2eRows = findE2eRows(report.finalUi!, E2E_TASK_PREFIX);
	expect.soft(e2eRows.length).toBe(E2E_TASK_COUNT - 1);
	expect.soft(report.analysis.reappearDetected).toBe(false);
	expect.soft(report.analysis.uiApiTaskCountMatch).toBe(true);
});
