import { useMemo, useSyncExternalStore } from 'react';
import type { StudentProfile } from '@shared/types';

export const PROFILE_STORAGE_KEY = 'student_finance_profile';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not read saved profile:', e);
    return null;
  }
}

function parse(raw: string | null): StudentProfile | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch (e) {
    console.warn('Could not parse saved profile:', e);
    return null;
  }
}

/**
 * The profile saved in this browser, or null if none is saved.
 * Always null on the server and during hydration, so the first render matches the server output.
 */
export function useSavedProfile(): StudentProfile | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parse(raw), [raw]);
}
