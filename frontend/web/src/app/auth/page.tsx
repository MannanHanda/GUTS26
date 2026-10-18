'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const nextPath = searchParams.get('next') || '/profile';

  const { configured, user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCategory, setStudentCategory] = useState<'scottish' | 'rest_of_uk' | 'international'>('scottish');
  const [ageBand, setAgeBand] = useState<'under_22' | '22_or_over'>('under_22');
  const [courseName, setCourseName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push(nextPath);
    }
  }, [loading, user, router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else {
          router.push(nextPath);
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          university: 'University of Glasgow',
          studentCategory,
          ageBand,
          courseName: courseName.trim() || undefined,
        });
        if (error) {
          setErrorMsg(error);
        } else if (needsEmailConfirmation) {
          setSuccessMsg(
            'Account created! Please check your email inbox to confirm your address before signing in (or disable "Confirm email" in Supabase Auth -> Providers -> Email for instant login).',
          );
          setMode('login');
        } else {
          router.push(nextPath);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {!configured && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-xs text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-amber-950">
                  Connect your Supabase Cloud project to enable live login &amp; registration
                </h2>
                <p className="text-amber-800">
                  Add your Supabase Project URL and Anon Key to{' '}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-semibold">
                    frontend/web/.env.local
                  </code>{' '}
                  and restart <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">npm run dev</code>:
                </p>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
{`NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY`}
                </pre>
                <p className="text-[11px] text-amber-800">
                  Then paste and run{' '}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                    supabase/migrations/20261017000000_user_profiles_and_auth.sql
                  </code>{' '}
                  in your Supabase SQL Editor to create the <code className="font-mono">profiles</code>,{' '}
                  <code className="font-mono">saved_plans</code>, and{' '}
                  <code className="font-mono">user_activity_logs</code> tables with Row-Level Security.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-5">
          {/* Left column: Value prop */}
          <div className="flex flex-col justify-between bg-slate-900 p-6 text-white sm:p-8 lg:col-span-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-bold text-teal-300">
                <Sparkles className="h-3.5 w-3.5" />
                Glasgow Student Twin Account
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Save your Glasgow move-in setup
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Create an account to store your personal student details, sync your budget and commute preferences
                  across devices, bookmark your top residences, and track your setup history.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span>
                    <strong className="text-white">Cloud Profile Sync:</strong> Your budget slider, commute routine and
                    banking priorities automatically follow you.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span>
                    <strong className="text-white">Shortlist Residences:</strong> Bookmark ranked accommodation +
                    commute combinations to compare later.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span>
                    <strong className="text-white">Activity &amp; Audit Log:</strong> View a transparent log of your
                    account actions and saved plans.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                Protected by Supabase Row-Level Security
              </div>
              <p className="mt-1">
                Only you can view or edit your saved profile, preferences and shortlisted rooms.
              </p>
            </div>
          </div>

          {/* Right column: Auth Form */}
          <div className="p-6 sm:p-8 lg:col-span-3">
            {/* Mode Switcher */}
            <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="full-name" className="mb-1 block text-xs font-bold text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="full-name"
                      type="text"
                      required
                      placeholder="e.g. Alex MacLeod"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="student@gla.ac.uk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    <div>
                      <label htmlFor="student-category" className="mb-1 block text-xs font-bold text-slate-700">
                        Student Category
                      </label>
                      <select
                        id="student-category"
                        value={studentCategory}
                        onChange={(e) =>
                          setStudentCategory(e.target.value as 'scottish' | 'rest_of_uk' | 'international')
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        <option value="scottish">Scottish Student</option>
                        <option value="rest_of_uk">Rest of UK</option>
                        <option value="international">International Student</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="age-band" className="mb-1 block text-xs font-bold text-slate-700">
                        Age Band (for Concessions)
                      </label>
                      <select
                        id="age-band"
                        value={ageBand}
                        onChange={(e) => setAgeBand(e.target.value as 'under_22' | '22_or_over')}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        <option value="under_22">Under 22 (Young Scot Bus)</option>
                        <option value="22_or_over">22 or over</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="course-name" className="mb-1 block text-xs font-bold text-slate-700">
                      Degree / Course (Optional)
                    </label>
                    <div className="relative">
                      <GraduationCap className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        id="course-name"
                        type="text"
                        placeholder="e.g. BSc Computing Science"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4 text-teal-400" />
                {submitting
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'login'
                    ? 'Sign In to Uniwise'
                    : 'Create Student Account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              Want to explore without an account first?{' '}
              <Link href="/dashboard" className="font-bold text-slate-900 hover:underline">
                Go to the Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-xs text-slate-500">Loading authentication...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
