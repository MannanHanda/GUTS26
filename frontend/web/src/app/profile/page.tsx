'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CloudUpload,
  Edit3,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  Save,
  Sliders,
  Trash2,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSavedProfile } from '@/lib/stored-profile';
import { DEFAULT_STUDENT_PROFILE } from '@/lib/student-profile';
import { gbp, weeklyToMonthly } from '@shared/api/profile';

const CATEGORY_LABELS: Record<string, string> = {
  scottish: 'Scottish Student',
  rest_of_uk: 'Rest of UK Student',
  international: 'International Student',
};

const AGE_LABELS: Record<string, string> = {
  under_22: 'Under 22 (Young Scot eligible)',
  '22_or_over': '22 or over',
};

const MODE_LABELS: Record<string, string> = {
  walk: 'Walking',
  cycle: 'Cycling',
  subway: 'Glasgow Subway',
  bus: 'First Bus',
  train: 'ScotRail Train',
};

export default function ProfilePage() {
  const router = useRouter();
  const {
    configured,
    loading,
    user,
    profile,
    savedPlans,
    activityLogs,
    updateUserDetails,
    removeSavedPlan,
    signOut,
  } = useAuth();
  const localStudentProfile = useSavedProfile() ?? profile?.student_profile ?? DEFAULT_STUDENT_PROFILE;

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('University of Glasgow');
  const [studentCategory, setStudentCategory] = useState<'scottish' | 'rest_of_uk' | 'international'>('scottish');
  const [ageBand, setAgeBand] = useState<'under_22' | '22_or_over'>('under_22');
  const [moveInDate, setMoveInDate] = useState('');
  const [courseName, setCourseName] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<string>('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggleEdit = () => {
    if (!editing) {
      const meta = user?.user_metadata ?? {};
      setFullName(profile?.full_name ?? (meta.full_name as string) ?? '');
      setUniversity(profile?.university || 'University of Glasgow');
      setStudentCategory(
        profile?.student_category ??
          ((meta.student_category as string) as 'scottish' | 'rest_of_uk' | 'international') ??
          'scottish',
      );
      setAgeBand(
        profile?.age_band ??
          ((meta.age_band as string) as 'under_22' | '22_or_over') ??
          'under_22',
      );
      setMoveInDate(profile?.move_in_date ?? '');
      setCourseName(profile?.course_name ?? (meta.course_name as string) ?? '');
      setYearOfStudy(profile?.year_of_study ? String(profile.year_of_study) : '');
      setPhone(profile?.phone ?? '');
    }
    setEditing((v) => !v);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    // Keep the embedded student_profile category in sync with personal details
    const updatedStudentProfile = {
      ...localStudentProfile,
      university,
      isInternational: studentCategory === 'international',
      studentStatus:
        studentCategory === 'scottish'
          ? ('home_scotland' as const)
          : studentCategory === 'rest_of_uk'
            ? ('home_uk_other' as const)
            : ('international' as const),
      studentAge: ageBand === 'under_22' ? 20 : 23,
    };

    const { error } = await updateUserDetails({
      full_name: fullName.trim() || null,
      university,
      student_category: studentCategory,
      age_band: ageBand,
      move_in_date: moveInDate || null,
      course_name: courseName.trim() || null,
      year_of_study: yearOfStudy ? Number(yearOfStudy) : null,
      phone: phone.trim() || null,
      student_profile: updatedStudentProfile,
    });

    setSaving(false);
    if (error) {
      setFeedback({ type: 'error', message: error });
    } else {
      setFeedback({ type: 'success', message: 'Your profile details and Student Twin preferences have been saved to Supabase.' });
      setEditing(false);
    }
  };

  const handleSyncBudgetToCloud = async () => {
    setSaving(true);
    setFeedback(null);
    const { error } = await updateUserDetails({
      student_profile: localStudentProfile,
    });
    setSaving(false);
    if (error) {
      setFeedback({ type: 'error', message: error });
    } else {
      setFeedback({ type: 'success', message: 'Synced your current budget & commute preferences to Supabase.' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center text-xs font-medium text-slate-500">
        Loading your student profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-teal-400">
            <UserIcon className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Sign in to view your Student Profile</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {configured
              ? 'Log in or create a free Uniwise account to store your personal details, sync your living budget across devices, and bookmark accommodation plans.'
              : 'Supabase Cloud credentials are not configured yet in frontend/web/.env.local. Visit the sign-in page for setup instructions.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign In / Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Sliders className="h-3.5 w-3.5" />
              Edit Local Budget
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Student';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Profile Banner */}
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-extrabold text-teal-400 shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{displayName}</h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {CATEGORY_LABELS[profile?.student_category ?? 'scottish'] ?? 'Student'}
                </span>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  {profile?.university || 'University of Glasgow'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
              {editing ? 'Cancel Editing' : 'Edit Details'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Columns: Personal Details + Student Twin Preferences + Saved Plans */}
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Details Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Personal &amp; Enrolment Details</h2>
                  <p className="text-xs text-slate-500">
                    Stored in Supabase (<code className="font-mono text-[11px]">public.profiles</code>) and used to
                    tailor your Glasgow recommendations.
                  </p>
                </div>
              </div>

              {editing ? (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-name" className="mb-1 block text-xs font-bold text-slate-700">
                        Full Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-uni" className="mb-1 block text-xs font-bold text-slate-700">
                        Destination University
                      </label>
                      <select
                        id="edit-uni"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                      >
                        <option value="University of Glasgow">University of Glasgow (Gilmorehill)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-category" className="mb-1 block text-xs font-bold text-slate-700">
                        Student Category
                      </label>
                      <select
                        id="edit-category"
                        value={studentCategory}
                        onChange={(e) =>
                          setStudentCategory(e.target.value as 'scottish' | 'rest_of_uk' | 'international')
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                      >
                        <option value="scottish">Scottish Student</option>
                        <option value="rest_of_uk">Rest of UK</option>
                        <option value="international">International Student</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-age" className="mb-1 block text-xs font-bold text-slate-700">
                        Age Band
                      </label>
                      <select
                        id="edit-age"
                        value={ageBand}
                        onChange={(e) => setAgeBand(e.target.value as 'under_22' | '22_or_over')}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                      >
                        <option value="under_22">Under 22 (Young Scot Free Bus)</option>
                        <option value="22_or_over">22 or over</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-course" className="mb-1 block text-xs font-bold text-slate-700">
                        Course / Degree
                      </label>
                      <input
                        id="edit-course"
                        type="text"
                        placeholder="e.g. BSc Computing Science"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-year" className="mb-1 block text-xs font-bold text-slate-700">
                        Year of Study
                      </label>
                      <input
                        id="edit-year"
                        type="number"
                        min={1}
                        max={8}
                        placeholder="e.g. 1"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-move-in" className="mb-1 block text-xs font-bold text-slate-700">
                        Intended Move-In Date
                      </label>
                      <input
                        id="edit-move-in"
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-phone" className="mb-1 block text-xs font-bold text-slate-700">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="edit-phone"
                        type="tel"
                        placeholder="+44 7700 900000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5 text-teal-400" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                  <DetailItem label="Full Name" value={profile?.full_name || displayName} />
                  <DetailItem label="Email Address" value={user.email ?? '—'} />
                  <DetailItem label="University & Campus" value={profile?.university || 'University of Glasgow'} />
                  <DetailItem
                    label="Student Category"
                    value={CATEGORY_LABELS[profile?.student_category ?? 'scottish'] ?? 'Not specified'}
                  />
                  <DetailItem
                    label="Age Band"
                    value={AGE_LABELS[profile?.age_band ?? 'under_22'] ?? 'Not specified'}
                  />
                  <DetailItem
                    label="Course & Year"
                    value={
                      profile?.course_name
                        ? `${profile.course_name}${profile.year_of_study ? ` (Year ${profile.year_of_study})` : ''}`
                        : 'Not specified'
                    }
                  />
                  <DetailItem
                    label="Intended Move-In Date"
                    value={
                      profile?.move_in_date
                        ? new Date(profile.move_in_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'September 2026 (Default)'
                    }
                    icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}
                  />
                  <DetailItem
                    label="Phone"
                    value={profile?.phone || 'Not provided'}
                    icon={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                  />
                </dl>
              )}
            </section>

            {/* Glasgow Student Twin (Budget & Commute Preferences) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Wallet className="h-4 w-4 text-teal-600" />
                    Glasgow Student Twin — Budget &amp; Commute Preferences
                  </h2>
                  <p className="text-xs text-slate-500">
                    Synced between your browser and Supabase to power the deterministic decision engine.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncBudgetToCloud}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <CloudUpload className="h-3.5 w-3.5 text-teal-600" />
                    Sync Now
                  </button>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Edit Wizard
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Max Housing Budget</span>
                  <span className="mt-1 block text-base font-extrabold text-slate-900">
                    {gbp(weeklyToMonthly(localStudentProfile.maxAccommodationBudget))}/mo
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({gbp(localStudentProfile.maxAccommodationBudget)}/wk rent cap)
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Total Living Budget</span>
                  <span className="mt-1 block text-base font-extrabold text-slate-900">
                    {gbp(localStudentProfile.totalBudget)}/{localStudentProfile.budgetPeriod === 'monthly' ? 'mo' : 'wk'}
                  </span>
                  <span className="text-[10px] text-slate-500">All-in target</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Campus Commute</span>
                  <span className="mt-1 block text-base font-extrabold text-slate-900">
                    {localStudentProfile.weeklyJourneys} trips/wk
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {Math.ceil(localStudentProfile.weeklyJourneys / 2)} days on campus
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Priority Mode</span>
                  <span className="mt-1 block text-sm font-extrabold capitalize text-slate-900">
                    {localStudentProfile.tradeoffPreference.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">Decision weight preset</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold uppercase text-slate-500">Preferred Transport:</span>
                {localStudentProfile.transportPreferences.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                  >
                    {MODE_LABELS[mode] ?? mode}
                  </span>
                ))}
              </div>
            </section>

            {/* Saved / Shortlisted Plans */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Bookmark className="h-4 w-4 text-teal-600" />
                    Saved Accommodation &amp; Commute Plans ({savedPlans.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bookmark options from the Dashboard to compare your top Glasgow setups.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:underline"
                >
                  Explore Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {savedPlans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  You haven&apos;t bookmarked any accommodation setups yet. Visit the{' '}
                  <Link href="/dashboard" className="font-bold text-slate-900 underline">
                    Living Cost Dashboard
                  </Link>{' '}
                  and click <strong>Save to Profile</strong> on any recommended option.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-700" />
                          <span className="text-sm font-bold text-slate-900">{plan.residence_name}</span>
                          {plan.overall_score !== null && (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                              {Math.round(Number(plan.overall_score))}/100 fit
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {plan.room_type} • {MODE_LABELS[plan.transport_mode] ?? plan.transport_mode} commute
                          {plan.commute_duration_min !== null ? ` (~${Math.round(Number(plan.commute_duration_min))} min)` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            Monthly:{' '}
                            <strong className="text-slate-900">
                              {plan.monthly_total_gbp !== null ? gbp(Number(plan.monthly_total_gbp)) : 'Incomplete'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Upfront:{' '}
                            <strong className="text-slate-900">
                              {plan.upfront_total_gbp !== null ? gbp(Number(plan.upfront_total_gbp)) : 'Incomplete'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeSavedPlan(plan.candidate_id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          aria-label={`Remove ${plan.residence_name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Activity & Audit Log */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Account Activity Log
                </h2>
                <p className="text-xs text-slate-500">
                  Recent authentication, profile updates and saved plan events logged in Supabase.
                </p>
              </div>

              {activityLogs.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                <ol className="relative border-l border-slate-200 pl-4 space-y-4">
                  {activityLogs.map((log) => (
                    <li key={log.id} className="text-xs">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
                      <div className="font-semibold text-slate-900">{log.description}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(log.created_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
                          {log.action}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
        {icon}
        <span>{value}</span>
      </dd>
    </div>
  );
}
