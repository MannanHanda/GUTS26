'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
} from 'lucide-react';
import { BankAccount } from '@shared/types';
import { apiClient } from '@shared/api-client';
import { DEFAULT_STUDENT_PROFILE } from '@shared/mock-data/glasgow-dataset';
import { formatGBP } from '@/lib/utils';
import { useSavedProfile } from '@/lib/stored-profile';

export default function BankingPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const profile = useSavedProfile() ?? DEFAULT_STUDENT_PROFILE;

  useEffect(() => {

    apiClient.getBankingOptions().then((res) => {
      setBanks(res.data);
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
                Banking Module
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • {profile.isInternational ? 'International Student Focus' : 'UK Domestic Student Focus'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Bank Account Comparison
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare 0% interest overdraft buffers, travel incentives (like free 4-year Railcards), and foreign transaction costs.
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

        {/* Banking Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {banks.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between card-hover-lift animate-fade-in"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {b.bankName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    +{formatGBP(b.estimatedYearlyValue)}/yr value
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {b.accountName}
                </h3>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Year 1 0% Overdraft:</span>
                    <strong className="text-slate-900">{formatGBP(b.overdraftLimitYear1)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Intl Transfer Fee:</span>
                    <strong className="text-slate-900">
                      {b.internationalTransferFee === 0 ? '£0 (Free)' : `£${b.internationalTransferFee}`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Fee:</span>
                    <strong className="text-emerald-700">£0</strong>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Perks & Incentives
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {b.perks.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 mb-2.5">
                  <strong className="text-slate-800">Best for:</strong> {b.bestFor}
                </div>

                {b.applyUrl && (
                  <a
                    href={b.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                  >
                    View criteria <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Banking Advice Banner */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              The 0% Overdraft Principle:
            </h4>
            <p>
              An interest-free student overdraft is an emergency buffer, not disposable income. 
              Always opt for accounts with guaranteed limits in Year 1. If you travel between cities or back home frequently, Santander&apos;s free 4-Year 16-25 Railcard can save hundreds of pounds in train fares across the UK.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
