import { get, put } from '@vercel/blob';
import type { Day } from '$lib/types/day';

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
