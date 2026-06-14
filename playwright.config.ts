import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://task.skarpa.dev';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	workers: 1,
	timeout: 120_000,
	expect: {
		timeout: 10_000,
	},
	reporter: [
		['list'],
		['json', { outputFile: 'tests/e2e/reports/playwright-report.json' }],
	],
	outputDir: 'tests/e2e/results',
	use: {
		baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'off',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
