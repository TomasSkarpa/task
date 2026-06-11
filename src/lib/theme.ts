/** localStorage key for explicit light/dark preference. Keep in sync with app.html inline script. */
export const THEME_STORAGE_KEY = 'skarpa-task-theme';

export type Theme = 'light' | 'dark';

export function getSystemTheme(): Theme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return null;
}

export function getResolvedTheme(): Theme {
	return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	applyTheme(theme);
}

export function toggleTheme(): void {
	const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
	setTheme(next);
}
