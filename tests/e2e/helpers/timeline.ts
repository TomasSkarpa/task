import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page, Response } from '@playwright/test';
import type { Day } from '../../../src/lib/types/day';
import { captureUiState, type UiSnapshot } from './state-snapshot';

export type NetworkEvent = {
	atMs: number;
	phase: 'request' | 'response';
	method: string;
	url: string;
	status?: number;
	durationMs?: number;
	bodySummary?: string;
};

export type ReappearEvent = {
	atMs: number;
	fromCount: number;
	toCount: number;
	event: string;
};

export type StateBugReport = {
	scenario: string;
	baseURL: string;
	dayDate: string;
	startedAt: string;
	finishedAt: string;
	durationMs: number;
	network: NetworkEvent[];
	uiTimeline: UiSnapshot[];
	reappearEvents: ReappearEvent[];
	checkboxMismatchEvents: Array<{
		atMs: number;
		event: string;
		label: string;
		checked: boolean;
		hasLineThrough: boolean;
	}>;
	finalUi: UiSnapshot | null;
	finalApi: Day | null;
	analysis: {
		uiApiTaskCountMatch: boolean | null;
		uiApiDoneStateMatch: boolean | null;
		reappearDetected: boolean;
		checkboxVisualMismatchCount: number;
		toggleResponses: number;
		removeResponses: number;
		addResponses: number;
	};
};

export class StateTimeline {
	private readonly startedAt = Date.now();
	private readonly uiTimeline: UiSnapshot[] = [];
	private readonly network: NetworkEvent[] = [];
	private readonly requestStarted = new Map<string, number>();
	private reappearEvents: ReappearEvent[] = [];
	private lastE2eTaskCount: number | null = null;
	private readonly e2ePrefix: string;

	constructor(e2ePrefix: string) {
		this.e2ePrefix = e2ePrefix;
	}

	attachNetwork(page: Page): void {
		page.on('request', (request) => {
			const url = request.url();
			if (!url.includes('/api/task/') && !url.includes('/api/day')) {
				return;
			}

			const atMs = Date.now() - this.startedAt;
			const key = `${request.method()} ${url}`;
			this.requestStarted.set(key, atMs);

			this.network.push({
				atMs,
				phase: 'request',
				method: request.method(),
				url,
			});
		});

		page.on('response', async (response: Response) => {
			const url = response.url();
			if (!url.includes('/api/task/') && !url.includes('/api/day')) {
				return;
			}

			const atMs = Date.now() - this.startedAt;
			const key = `${response.request().method()} ${url}`;
			const started = this.requestStarted.get(key);
			const durationMs = started === undefined ? undefined : atMs - started;

			let bodySummary: string | undefined;
			try {
				const json = (await response.json()) as {
					day?: Day;
					closed?: Day;
					removed?: number;
				};

				const day = json.day ?? json.closed;
				if (day) {
					const done = day.tasks.filter((task) => task.status === 'done').length;
					bodySummary = `tasks=${day.tasks.length} done=${done} sparkUsed=${day.sparkUsed}`;
				} else if (typeof json.removed === 'number') {
					bodySummary = `removed=${json.removed}`;
				}
			} catch {
				bodySummary = undefined;
			}

			this.network.push({
				atMs,
				phase: 'response',
				method: response.request().method(),
				url,
				status: response.status(),
				durationMs,
				bodySummary,
			});
		});
	}

	async snap(page: Page, event: string): Promise<UiSnapshot> {
		const snapshot = await captureUiState(
			page,
			Date.now() - this.startedAt,
			event,
			this.e2ePrefix,
		);
		this.uiTimeline.push(snapshot);
		this.trackReappear(snapshot);
		return snapshot;
	}

	async poll(page: Page, eventPrefix: string, times: number, intervalMs: number): Promise<void> {
		for (let index = 0; index < times; index += 1) {
			await page.waitForTimeout(intervalMs);
			await this.snap(page, `${eventPrefix}-${index}`);
		}
	}

	private trackReappear(snapshot: UiSnapshot): void {
		if (this.lastE2eTaskCount === null) {
			this.lastE2eTaskCount = snapshot.e2eTaskCount;
			return;
		}

		const previous = this.lastE2eTaskCount;
		const current = snapshot.e2eTaskCount;

		if (current > previous) {
			this.reappearEvents.push({
				atMs: snapshot.atMs,
				fromCount: previous,
				toCount: current,
				event: snapshot.event,
			});
		}

		this.lastE2eTaskCount = current;
	}

	buildReport(input: {
		scenario: string;
		baseURL: string;
		dayDate: string;
		finalApi: Day | null;
		e2ePrefix: string;
	}): StateBugReport {
		const finishedAt = Date.now();
		const finalUi = this.uiTimeline.at(-1) ?? null;

		const e2eUiRows = finalUi
			? finalUi.rows.filter((row) => row.label.includes(input.e2ePrefix))
			: [];
		const e2eApiTasks = input.finalApi
			? input.finalApi.tasks.filter((task) => task.text.includes(input.e2ePrefix))
			: [];

		const uiApiTaskCountMatch =
			finalUi && input.finalApi ? e2eUiRows.length === e2eApiTasks.length : null;

		let uiApiDoneStateMatch: boolean | null = null;
		if (finalUi && input.finalApi && e2eUiRows.length === e2eApiTasks.length) {
			uiApiDoneStateMatch = e2eUiRows.every((row) => {
				const apiTask = e2eApiTasks.find((task) => row.label.includes(task.text.slice(0, 40)));
				if (!apiTask) {
					return false;
				}

				const apiDone = apiTask.status === 'done';
				return row.checked === apiDone && row.hasLineThrough === apiDone;
			});
		}

		const checkboxMismatchEvents = this.uiTimeline.flatMap((snapshot) =>
			snapshot.rows.flatMap((row) => {
				if (row.checked === row.hasLineThrough) {
					return [];
				}

				return [
					{
						atMs: snapshot.atMs,
						event: snapshot.event,
						label: row.label,
						checked: row.checked,
						hasLineThrough: row.hasLineThrough,
					},
				];
			}),
		);

		const toggleResponses = this.network.filter(
			(entry) => entry.phase === 'response' && entry.url.includes('/api/task/toggle'),
		).length;
		const removeResponses = this.network.filter(
			(entry) => entry.phase === 'response' && entry.url.includes('/api/task/remove'),
		).length;
		const addResponses = this.network.filter(
			(entry) => entry.phase === 'response' && entry.url.includes('/api/task/add'),
		).length;

		return {
			scenario: input.scenario,
			baseURL: input.baseURL,
			dayDate: input.dayDate,
			startedAt: new Date(this.startedAt).toISOString(),
			finishedAt: new Date(finishedAt).toISOString(),
			durationMs: finishedAt - this.startedAt,
			network: this.network,
			uiTimeline: this.uiTimeline,
			reappearEvents: this.reappearEvents,
			checkboxMismatchEvents,
			finalUi,
			finalApi: input.finalApi,
			analysis: {
				uiApiTaskCountMatch,
				uiApiDoneStateMatch,
				reappearDetected: this.reappearEvents.length > 0,
				checkboxVisualMismatchCount: checkboxMismatchEvents.length,
				toggleResponses,
				removeResponses,
				addResponses,
			},
		};
	}

	async writeReport(report: StateBugReport): Promise<string> {
		const dir = path.resolve('tests/e2e/reports');
		await mkdir(dir, { recursive: true });

		const file = path.join(
			dir,
			`state-bug-${report.scenario}-${Date.now()}.json`,
		);

		await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
		return file;
	}
}
