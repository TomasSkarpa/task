import { get, put } from '@vercel/blob';

const QUEUE_PATH = 'queues/birthday-events.json';

export type BirthdayEvent = {
	id: string;
	personId: string;
	name: string;
	birthday: string;
	dueDate: string;
	status: 'pending' | 'sent';
	createdAt: string;
	sentAt: string | null;
	attempts: number;
};

type BirthdayQueue = { events: BirthdayEvent[] };

export type ImmichPerson = {
	id: string;
	name: string;
	birthDate: string | null;
	isHidden: boolean;
};

async function readQueue(): Promise<BirthdayQueue> {
	try {
		const result = await get(QUEUE_PATH, { access: 'private', useCache: false });
		if (!result || result.statusCode !== 200 || !result.stream) return { events: [] };
		return JSON.parse(await new Response(result.stream).text()) as BirthdayQueue;
	} catch {
		return { events: [] };
	}
}

async function writeQueue(queue: BirthdayQueue): Promise<void> {
	await put(QUEUE_PATH, `${JSON.stringify(queue, null, '\t')}\n`, {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
	});
}

export function excludedPersonIds(raw: string | undefined): Set<string> {
	return new Set((raw ?? '').split(',').map((id) => id.trim()).filter(Boolean));
}

export function birthdayMatchesDate(birthday: string, date: string): boolean {
	return birthday.slice(5) === date.slice(5);
}

export async function collectBirthdayEvents(
	people: ImmichPerson[],
	dueDate: string,
	excluded: Set<string>,
): Promise<number> {
	const queue = await readQueue();
	const existingIds = new Set(queue.events.map((event) => event.id));
	let added = 0;

	for (const person of people) {
		if (
			!person.name.trim() ||
			!person.birthDate ||
			person.isHidden ||
			excluded.has(person.id) ||
			!birthdayMatchesDate(person.birthDate, dueDate)
		) continue;

		const id = `birthday:${person.id}:${dueDate.slice(0, 4)}`;
		if (existingIds.has(id)) continue;

		queue.events.push({
			id,
			personId: person.id,
			name: person.name.trim(),
			birthday: person.birthDate,
			dueDate,
			status: 'pending',
			createdAt: new Date().toISOString(),
			sentAt: null,
			attempts: 0,
		});
		existingIds.add(id);
		added += 1;
	}

	if (added > 0) await writeQueue(queue);
	return added;
}

export async function publishBirthdayEvents(
	dueDate: string,
	excluded: Set<string>,
	publish: (event: BirthdayEvent) => Promise<void>,
): Promise<number> {
	const queue = await readQueue();
	let sent = 0;
	let changed = false;

	for (const event of queue.events) {
		if (event.status !== 'pending' || event.dueDate !== dueDate || excluded.has(event.personId)) continue;

		event.attempts += 1;
		changed = true;
		try {
			await publish(event);
			event.status = 'sent';
			event.sentAt = new Date().toISOString();
			sent += 1;
		} catch (error) {
			console.error('Birthday event publish failed', event.id, error);
		}
	}

	if (changed) await writeQueue(queue);
	return sent;
}
