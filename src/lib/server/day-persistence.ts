import { get, list, put } from '@vercel/blob';
import type { Day } from '$lib/types/day';

const DAY_PATH_PATTERN = /^days\/(\d{4}-\d{2}-\d{2})\.json$/;

function blobPathname(date: string): string {
	return `days/${date}.json`;
}

function serializeDay(day: Day): string {
	return `${JSON.stringify(day, null, '\t')}\n`;
}

function blobNotConfiguredError(): Error {
	return new Error(
		'Blob storage is not configured. Link a Blob store on Vercel or run vercel env pull locally.',
	);
}

/** True when a Vercel Blob store is linked (token and/or store id from dashboard connect). */
export function usesBlobStorage(): boolean {
	return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function loadFromBlob(date: string): Promise<Day | null> {
	try {
		const result = await get(blobPathname(date), { access: 'private', useCache: false });

		if (!result || result.statusCode !== 200 || !result.stream) {
			return null;
		}

		const raw = await new Response(result.stream).text();
		return JSON.parse(raw) as Day;
	} catch {
		return null;
	}
}

async function saveToBlob(day: Day): Promise<void> {
	await put(blobPathname(day.date), serializeDay(day), {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
	});
}

export async function readDay(date: string): Promise<Day | null> {
	if (!usesBlobStorage()) {
		throw blobNotConfiguredError();
	}

	return loadFromBlob(date);
}

export async function writeDay(day: Day): Promise<void> {
	if (!usesBlobStorage()) {
		throw blobNotConfiguredError();
	}

	await saveToBlob(day);
}

export async function listStoredDayDates(): Promise<string[]> {
	if (!usesBlobStorage()) {
		throw blobNotConfiguredError();
	}

	const dates: string[] = [];
	let cursor: string | undefined;

	do {
		const result = await list({
			prefix: 'days/',
			limit: 1000,
			cursor,
		});

		for (const blob of result.blobs) {
			const match = blob.pathname.match(DAY_PATH_PATTERN);

			if (match) {
				dates.push(match[1]);
			}
		}

		cursor = result.hasMore ? result.cursor : undefined;
	} while (cursor);

	return dates.sort((a, b) => b.localeCompare(a));
}
