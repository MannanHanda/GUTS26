'use client';

// Bridges the onboarding wizard's saved profile (legacy shape, in localStorage)
// to the backend's StudentProfile. Every conversion here is a stated assumption
// shown to the user, never a hidden one.

import { useMemo, useSyncExternalStore } from 'react';
import type { StudentProfile as LegacyProfile } from '@shared/types';
import type { Priorities, RecommendationRequest, StudentProfile, TransportMode } from './types';

export const PROFILE_STORAGE_KEY = 'student_finance_profile';

/** Universities the backend has campus data for. Others are planned (see project task D). */
export const SUPPORTED_CAMPUSES: Record<string, string> = {
  'University of Glasgow': 'gilmorehill',
};

export type PriorityPreset = 'lowest_cost' | 'balanced' | 'shortest_commute';

export const PRIORITY_PRESETS: Record<PriorityPreset, { label: string; priorities: Priorities }> = {
  lowest_cost: { label: 'Lowest cost', priorities: { monthly_cost: 8, commute_time: 2, upfront_cost: 2, evidence_confidence: 1 } },
  balanced: { label: 'Balanced', priorities: { monthly_cost: 5, commute_time: 5, upfront_cost: 1, evidence_confidence: 1 } },
  shortest_commute: {
    label: 'Shortest commute',
    priorities: { monthly_cost: 2, commute_time: 8, upfront_cost: 1, evidence_confidence: 1 },
  },
};

const MODELLED_MODES: TransportMode[] = ['walk', 'cycle', 'subway'];
const DEFAULT_WEEKLY_HOUSING_BUDGET = 175;

export const weeklyToMonthly = (weekly: number) => Math.round((weekly * 52) / 12);

export function gbp(amount: number): string {
  return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

// ---------------------------------------------------------------- stored profile
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode)
  }
}

/** The saved onboarding profile, or null if none is saved. Safe during server rendering. */
export function useStoredProfile(): LegacyProfile | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LegacyProfile;
    } catch {
      return null;
    }
  }, [raw]);
}

export function saveProfile(profile: LegacyProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable: the change still applies for this visit
  }
}

// ---------------------------------------------------------------- conversion
export interface ProfileChoices {
  monthlyBudgetGbp: number;
  preset: PriorityPreset;
}

/** Initial slider and preset values derived from the saved profile. */
export function initialChoices(p: LegacyProfile | null): ProfileChoices {
  const weekly = p?.maxAccommodationBudget || DEFAULT_WEEKLY_HOUSING_BUDGET;
  return { monthlyBudgetGbp: weeklyToMonthly(weekly), preset: p?.tradeoffPreference ?? 'balanced' };
}

export type ConversionResult =
  | { ok: true; request: RecommendationRequest; assumptions: string[] }
  | { ok: false; university: string };

export function toRecommendationRequest(p: LegacyProfile | null, choices: ProfileChoices): ConversionResult {
  const university = p?.university ?? 'University of Glasgow';
  const campusId = SUPPORTED_CAMPUSES[university];
  if (!campusId) return { ok: false, university };

  const assumptions: string[] = [];
  const preferred = (p?.transportPreferences ?? []).filter((m): m is TransportMode =>
    MODELLED_MODES.includes(m as TransportMode),
  );
  const modes = preferred.length ? preferred : MODELLED_MODES;
  if (!preferred.length) assumptions.push('No modelled transport mode selected, so walking, cycling and Subway are all compared.');
  if (p?.transportPreferences?.some((m) => m === 'bus' || m === 'train')) {
    assumptions.push('Bus and train journeys are not modelled yet, so they are not compared.');
  }

  const journeys = p?.weeklyJourneys ?? 10;
  const campusDays = Math.min(7, Math.max(1, Math.ceil(journeys / 2)));
  assumptions.push(`${journeys} campus journeys a week treated as ${campusDays} return trips.`);

  const category =
    p?.studentStatus === 'home_scotland'
      ? 'scottish'
      : p?.studentStatus === 'home_uk_other'
        ? 'rest_of_uk'
        : p?.studentStatus === 'international' || p?.isInternational
          ? 'international'
          : undefined;

  const profile: StudentProfile = {
    campus_id: campusId,
    campus_days_per_week: campusDays,
    allowed_modes: modes,
    student_category: category,
    age_band: p?.studentAge === undefined ? undefined : p.studentAge < 22 ? 'under_22' : '22_or_over',
    constraints: {
      max_monthly_budget_gbp: choices.monthlyBudgetGbp,
      budget_is_hard: true,
      commute_is_hard: false,
      require_ensuite: false,
      require_accessible: false,
      require_studio: false,
      exclude_shared_rooms: false,
    },
    priorities: PRIORITY_PRESETS[choices.preset].priorities,
  };
  return { ok: true, request: { profile, limit: 10 }, assumptions };
}
