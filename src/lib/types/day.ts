export type DayStatus = 'open' | 'closed';
export type TaskStatus = 'open' | 'done';
export type TaskSource = 'manual' | 'jira' | 'carryover' | 'spark';
export type ClosedBy = 'manual' | 'auto';

export type Task = {
	id: string;
	text: string;
	status: TaskStatus;
	source: TaskSource;
	jiraKey: string | null;
	carriedFrom: string | null;
	sort?: number;
};

export type Day = {
	date: string;
	status: DayStatus;
	closedAt: string | null;
	closedBy: ClosedBy | null;
	tasks: Task[];
};

export type DaySummary = {
	date: string;
	status: DayStatus;
	closedAt: string | null;
	closedBy: ClosedBy | null;
	taskCount: number;
	doneCount: number;
	openCount: number;
	preview: string | null;
};
