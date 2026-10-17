import { useMemo, useSyncExternalStore } from 'react';
import type { StudentProfile } from '@shared/types';
import { supabase } from '@/lib/supabase';

export const PROFILE_STORAGE_KEY = 'student_finance_profile';
export const PROFILE_CHANGE_EVENT = 'uniwise-profile-change';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(PROFILE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(PROFILE_CHANGE_EVENT, onChange);
  };
}

export function readRawProfile(): string | null {
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

export function writeLocalProfileOnly(profile: StudentProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
  } catch (e) {
    console.warn('Could not save profile to localStorage:', e);
  }
}

/**
 * Saves the student profile to localStorage and, if signed in to Supabase,
 * asynchronously persists `student_profile` to `public.profiles`.
 */
export function saveStudentProfile(profile: StudentProfile): void {
  writeLocalProfileOnly(profile);

  if (!supabase) return;
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    if (!user || !supabase) return;
    const studentCategory =
      profile.studentStatus === 'home_scotland'
        ? 'scottish'
        : profile.studentStatus === 'home_uk_other'
          ? 'rest_of_uk'
          : profile.studentStatus === 'international' || profile.isInternational
            ? 'international'
            : undefined;
    supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          university: profile.university || 'University of Glasgow',
          ...(studentCategory ? { student_category: studentCategory } : {}),
          student_profile: profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .then(({ error }) => {
        if (error) console.warn('Could not sync profile to Supabase:', error.message);
      });
  });
}

/**
 * The profile saved in this browser, or null if none is saved.
 * Always null on the server and during hydration, so the first render matches the server output.
 */
export function useSavedProfile(): StudentProfile | null {
  const raw = useSyncExternalStore(subscribe, readRawProfile, () => null);
  return useMemo(() => parse(raw), [raw]);
}

