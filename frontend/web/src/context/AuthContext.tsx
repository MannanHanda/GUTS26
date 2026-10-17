'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { StudentProfile } from '@shared/types';
import {
  isSupabaseConfigured,
  supabase,
  type ActivityLogRecord,
  type SavedPlanRecord,
  type UserProfileRecord,
} from '@/lib/supabase';
import { readRawProfile, writeLocalProfileOnly } from '@/lib/stored-profile';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  university?: string;
  studentCategory?: 'scottish' | 'rest_of_uk' | 'international';
  ageBand?: 'under_22' | '22_or_over';
  courseName?: string;
}

export interface SavePlanInput {
  candidate_id: string;
  residence_name: string;
  room_type: string;
  transport_mode: string;
  monthly_total_gbp: number | null;
  upfront_total_gbp: number | null;
  commute_duration_min: number | null;
  overall_score: number | null;
  notes?: string | null;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfileRecord | null;
  savedPlans: SavedPlanRecord[];
  activityLogs: ActivityLogRecord[];
  signUp: (params: SignUpParams) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUserDetails: (
    updates: Partial<
      Pick<
        UserProfileRecord,
        | 'full_name'
        | 'university'
        | 'student_category'
        | 'age_band'
        | 'move_in_date'
        | 'course_name'
        | 'year_of_study'
        | 'phone'
        | 'student_profile'
      >
    >,
  ) => Promise<{ error: string | null }>;
  savePlan: (plan: SavePlanInput) => Promise<{ error: string | null }>;
  removeSavedPlan: (candidateId: string) => Promise<{ error: string | null }>;
  logActivity: (action: string, description: string, metadata?: Record<string, unknown>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState<boolean>(configured);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlanRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);

  const fetchUserData = useCallback(async (currentUser: User) => {
    if (!supabase) return;

    // 1. Load or initialize user profile
    const { data: existingProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    let resolvedProfile: UserProfileRecord | null = existingProfile as UserProfileRecord | null;

    // Parse any existing local onboarding profile
    let localStudentProfile: StudentProfile | null = null;
    try {
      const raw = readRawProfile();
      if (raw) localStudentProfile = JSON.parse(raw) as StudentProfile;
    } catch {
      localStudentProfile = null;
    }

    if (!resolvedProfile && !profileErr) {
      const meta = currentUser.user_metadata ?? {};
      const newProfilePayload = {
        id: currentUser.id,
        email: currentUser.email ?? null,
        full_name: (meta.full_name as string) || null,
        university: (meta.university as string) || localStudentProfile?.university || 'University of Glasgow',
        student_category:
          (meta.student_category as UserProfileRecord['student_category']) ||
          (localStudentProfile?.isInternational ? 'international' : null),
        age_band: (meta.age_band as UserProfileRecord['age_band']) || null,
        course_name: (meta.course_name as string) || null,
        student_profile: localStudentProfile,
      };
      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(newProfilePayload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      resolvedProfile = (inserted as UserProfileRecord | null) ?? null;
    } else if (resolvedProfile) {
      if (resolvedProfile.student_profile) {
        // Hydrate localStorage from cloud profile so Dashboard & Onboarding stay in sync
        writeLocalProfileOnly(resolvedProfile.student_profile);
      } else if (localStudentProfile) {
        // Upload existing local onboarding profile to cloud
        const { data: updated } = await supabase
          .from('profiles')
          .update({ student_profile: localStudentProfile, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id)
          .select('*')
          .maybeSingle();
        if (updated) resolvedProfile = updated as UserProfileRecord;
      }
    }

    setProfile(resolvedProfile);

    // 2. Load saved plans
    const { data: plansData } = await supabase
      .from('saved_plans')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (plansData) setSavedPlans(plansData as SavedPlanRecord[]);

    // 3. Load recent activity logs
    const { data: logsData } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(25);
    if (logsData) setActivityLogs(logsData as ActivityLogRecord[]);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const currentSession = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserData(currentSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchUserData(newSession.user);
      } else {
        setProfile(null);
        setSavedPlans([]);
        setActivityLogs([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const logActivity = useCallback(
    async (action: string, description: string, metadata: Record<string, unknown> = {}) => {
      if (!supabase || !user) return;
      const { data } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action,
          description,
          metadata,
        })
        .select('*')
        .maybeSingle();
      if (data) {
        setActivityLogs((prev) => [data as ActivityLogRecord, ...prev.slice(0, 24)]);
      }
    },
    [user],
  );

  const signUp = useCallback(
    async (params: SignUpParams): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
      if (!supabase) return { error: 'Supabase is not configured yet. Add your URL and Anon Key to .env.local.' };

      let localStudentProfile: StudentProfile | null = null;
      try {
        const raw = readRawProfile();
        if (raw) localStudentProfile = JSON.parse(raw) as StudentProfile;
      } catch {
        localStudentProfile = null;
      }

      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            university: params.university || 'University of Glasgow',
            student_category: params.studentCategory || null,
            age_band: params.ageBand || null,
            course_name: params.courseName || null,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user && data.session) {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: params.email,
            full_name: params.fullName,
            university: params.university || 'University of Glasgow',
            student_category: params.studentCategory || null,
            age_band: params.ageBand || null,
            course_name: params.courseName || null,
            student_profile: localStudentProfile,
          },
          { onConflict: 'id' },
        );
        await fetchUserData(data.user);
        return { error: null, needsEmailConfirmation: false };
      }

      return { error: null, needsEmailConfirmation: true };
    },
    [fetchUserData],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (!supabase) return { error: 'Supabase is not configured yet. Add your URL and Anon Key to .env.local.' };

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.user) {
        await supabase.from('user_activity_logs').insert({
          user_id: data.user.id,
          action: 'signed_in',
          description: 'Signed in to Uniwise account',
          metadata: { email: data.user.email },
        });
        await fetchUserData(data.user);
      }
      return { error: null };
    },
    [fetchUserData],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    if (user) {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'signed_out',
        description: 'Signed out of Uniwise account',
        metadata: {},
      });
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSavedPlans([]);
    setActivityLogs([]);
  }, [user]);

  const updateUserDetails = useCallback(
    async (
      updates: Partial<
        Pick<
          UserProfileRecord,
          | 'full_name'
          | 'university'
          | 'student_category'
          | 'age_band'
          | 'move_in_date'
          | 'course_name'
          | 'year_of_study'
          | 'phone'
          | 'student_profile'
        >
      >,
    ): Promise<{ error: string | null }> => {
      if (!supabase || !user) return { error: 'You must be signed in to update your profile.' };

      const payload = {
        id: user.id,
        email: user.email ?? null,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (error) return { error: error.message };
      if (data) {
        const updatedRecord = data as UserProfileRecord;
        setProfile(updatedRecord);
        if (updatedRecord.student_profile) {
          writeLocalProfileOnly(updatedRecord.student_profile);
        }
      }

      await logActivity('profile_updated', 'Updated student profile details', {
        fields: Object.keys(updates),
      });
      return { error: null };
    },
    [user, logActivity],
  );

  const savePlan = useCallback(
    async (plan: SavePlanInput): Promise<{ error: string | null }> => {
      if (!supabase || !user) return { error: 'Please sign in to bookmark accommodation plans.' };

      const { data, error } = await supabase
        .from('saved_plans')
        .upsert(
          {
            user_id: user.id,
            candidate_id: plan.candidate_id,
            residence_name: plan.residence_name,
            room_type: plan.room_type,
            transport_mode: plan.transport_mode,
            monthly_total_gbp: plan.monthly_total_gbp,
            upfront_total_gbp: plan.upfront_total_gbp,
            commute_duration_min: plan.commute_duration_min,
            overall_score: plan.overall_score,
            notes: plan.notes ?? null,
          },
          { onConflict: 'user_id,candidate_id' },
        )
        .select('*')
        .maybeSingle();

      if (error) return { error: error.message };
      if (data) {
        const saved = data as SavedPlanRecord;
        setSavedPlans((prev) => [saved, ...prev.filter((p) => p.candidate_id !== saved.candidate_id)]);
      }

      await logActivity(
        'plan_saved',
        `Saved ${plan.residence_name} (${plan.room_type}) to shortlist`,
        { candidate_id: plan.candidate_id, monthly_total_gbp: plan.monthly_total_gbp },
      );
      return { error: null };
    },
    [user, logActivity],
  );

  const removeSavedPlan = useCallback(
    async (candidateId: string): Promise<{ error: string | null }> => {
      if (!supabase || !user) return { error: 'Please sign in first.' };

      const target = savedPlans.find((p) => p.candidate_id === candidateId);
      const { error } = await supabase
        .from('saved_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('candidate_id', candidateId);

      if (error) return { error: error.message };
      setSavedPlans((prev) => prev.filter((p) => p.candidate_id !== candidateId));

      await logActivity(
        'plan_removed',
        `Removed ${target?.residence_name ?? candidateId} from shortlist`,
        { candidate_id: candidateId },
      );
      return { error: null };
    },
    [user, savedPlans, logActivity],
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchUserData(user);
  }, [user, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        user,
        session,
        profile,
        savedPlans,
        activityLogs,
        signUp,
        signIn,
        signOut,
        updateUserDetails,
        savePlan,
        removeSavedPlan,
        logActivity,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
