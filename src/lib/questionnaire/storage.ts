import { draft, type Draft } from './schema';

/** The questionnaire lives only in this browser until an account is created (phase 9 moves it to the account). */
export const STORAGE_KEY = 'lekste:questionnaire:v1';

export function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = draft.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveDraft(d: Draft): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // private mode or storage full: the questionnaire still works for this visit
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing stored
  }
}
