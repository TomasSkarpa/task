import { head, put } from '@vercel/blob';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Day } from '$lib/types/day';

const DATA_ROOT = join(process.cwd(), 'data', 'days');

function blobPathname(date: string): string {
	return `days/${date}.json`;
}

function localPath(date: string): string {
	return join(DATA_ROOT, `${date}.json`);
}

function serializeDay(day: Day): string {
	return `${JSON.stringify(day, null, '\t')}\n`;
}

/** True when a Vercel Blob store is linked (token and/or store id from dashboard connect). */
export function usesBlobStorage(): boolean {
	return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function loadFromBlob(date: string): Promise<Day | null> {
	try {
		const info = await head(blobPathname(date));
		const response = await fetch(info.url);

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as Day;
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

async function loadFromLocal(date: string): Promise<Day | null> {
	try {
		const raw = await readFile(localPath(date), 'utf8');
		return JSON.parse(raw) as Day;
	} catch {
		return null;
	}
}

async function saveToLocal(day: Day): Promise<void> {
	await mkdir(DATA_ROOT, { recursive: true });
	await writeFile(localPath(day.date), serializeDay(day), 'utf8');
}

export async function readDay(date: string): Promise<Day | null> {
	if (usesBlobStorage()) {
		const blobDay = await loadFromBlob(date);

		if (blobDay) {
			return blobDay;
		}
	}

	return loadFromLocal(date);
}

export async function writeDay(day: Day): Promise<void> {
	if (usesBlobStorage()) {
		await saveToBlob(day);
		return;
	}

	await saveToLocal(day);
}
