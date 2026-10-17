'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bus, 
  Clock, 
  MapPin, 
  Ticket, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { StudentProfile, TransportOption } from '@shared/types';
import { apiClient } from '@shared/api-client';
import { DEFAULT_STUDENT_PROFILE } from '@shared/mock-data/glasgow-dataset';
import { formatGBP, formatCommute } from '@/lib/utils';

export default function TransportPage() {
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('student_finance_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read saved profile:', e);
    }

    apiClient.getTransportOptions().then((res) => {
      setTransports(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                Transport Module
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • Routine: {profile.weeklyJourneys} trips/week ({Math.round(profile.weeklyJourneys / 2)} days)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Glasgow Student Transit Pass Comparison
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Find the break-even point between pay-as-you-go contactless and student season passes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Transport Passes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {transports.map((t) => {
            const payAsYouGoWeekly = profile.weeklyJourneys * t.singleFareCost;
            const isPassCheaper = t.costWeekly > 0 && t.costWeekly < payAsYouGoWeekly;
            const savingsOrExtra = Math.abs(t.costWeekly - payAsYouGoWeekly);

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between card-hover-lift animate-fade-in"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
                      {t.mode.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.averageTripMinutes} mins avg</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {t.passName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">{t.provider}</div>

                  {/* Cost Box */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-700">Student Pass:</span>
                      <span className="text-lg font-black text-slate-900">
                        {t.costWeekly === 0 ? 'FREE' : `${formatGBP(t.costWeekly)} / wk`}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1 text-slate-600 text-xs">
                      <div className="flex justify-between">
                        <span>4-Week Cost:</span>
                        <strong className="text-slate-800">{formatGBP(t.costMonthly)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Single Ticket Fare:</span>
                        <strong className="text-slate-800">{formatGBP(t.singleFareCost, { showDecimal: true })}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Your PAYG Weekly Cost:</span>
                        <strong className="text-slate-800">{formatGBP(payAsYouGoWeekly, { showDecimal: true })}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Break-even badge */}
                  {t.costWeekly > 0 && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
                      {isPassCheaper ? (
                        <span className="font-semibold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          Pass saves you <strong>{formatGBP(savingsOrExtra)}/week</strong> over single tickets!
                        </span>
                      ) : (
                        <span className="text-slate-600 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Pay-as-you-go is cheaper unless you take &gt; {Math.ceil(t.costWeekly / t.singleFareCost)} trips/wk.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Coverage */}
                  <div className="mt-3 text-xs text-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Network Coverage
                    </span>
                    <p className="line-clamp-2 text-[11px]">{t.coverageArea}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span>{t.weeklyHoursCommute} hrs</span> commute / wk
                  </div>

                  {t.bookingUrl && (
                    <a
                      href={t.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-900"
                    >
                      Ticket info <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
