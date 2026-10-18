'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  UserCheck,
  Building2,
  FileText,
  MapPin
} from 'lucide-react';
import { BankAccount, StudentProfile } from '@shared/types';
import { apiClient } from '@shared/api-client';
import { DEFAULT_STUDENT_PROFILE } from '@shared/mock-data/glasgow-dataset';
import { formatGBP } from '@/lib/utils';
import { DictionaryTooltip } from '@/components/DictionaryTooltip';

export default function BankingPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
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

    apiClient.getBankingOptions().then((res) => {
      setBanks(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Scope & Data Transparency Bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span><strong>Scope:</strong> Branches mapped near <strong>University of Glasgow (UofG)</strong> (Byres Rd &amp; West End).</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Data Source: Verified &amp; Curated directly from official UK Bank 2026/27 student account terms.
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                Student Banking &amp; Overdrafts
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                • {profile.isInternational ? 'International Student Focus' : 'UK Domestic Student Focus'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Student Bank Account Comparison
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Compare 0% interest <DictionaryTooltip termKey="overdraft">overdraft buffers</DictionaryTooltip>, 
              travel incentives like free 4-year Railcards (<DictionaryTooltip termKey="annual_value">annual perk value</DictionaryTooltip>), 
              and foreign transaction fees before arriving on campus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* EXPLANATORY HERO: WHAT IS A STUDENT SPECIALIST */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-md border border-teal-800/40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-3 border border-teal-400/30">
              <UserCheck className="w-4 h-4 text-teal-400" />
              Inside Tip: Ask for a "Student Specialist"
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              What is a <DictionaryTooltip termKey="student_specialist"><span className="text-teal-300 underline decoration-teal-400">Student Specialist</span></DictionaryTooltip> at UK Banks?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              When visiting a high-street bank (such as <strong className="text-white">Santander, Bank of Scotland, or NatWest on Byres Road</strong>), 
              do not just queue at the cashier counter. Always ask to speak with a <strong className="text-teal-300">Student Specialist</strong>. 
              These are branch advisors specially accredited in higher education finances:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  1. Document Verification
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  They accept your <strong>UofG Certificate of Student Status</strong> instead of requiring 3 months of UK utility bills.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  2. 0% Overdraft Setup
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  They configure your <DictionaryTooltip termKey="overdraft">0% interest overdraft</DictionaryTooltip> step-by-step to avoid accidental credit score penalties.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  3. International Wires
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For international students, they provide official IBAN and BIC wire codes to ensure family tuition wires arrive with £0 receiving deductions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Cards Grid with ENLARGED Typography */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Top Student Accounts for Glasgow (2026/27)
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Sorted by overall student utility
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {banks.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between card-hover-lift animate-fade-in"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                      {b.bankName}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      +{formatGBP(b.estimatedYearlyValue)}/yr perk
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {b.accountName}
                  </h3>

                  {/* High Visibility Stats Block */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-xs">
                        <DictionaryTooltip termKey="overdraft">0% Overdraft (Yr 1):</DictionaryTooltip>
                      </span>
                      <strong className="text-base font-black text-slate-900">{formatGBP(b.overdraftLimitYear1)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-xs">Intl Transfer Fee:</span>
                      <strong className="text-sm font-bold text-slate-900">
                        {b.internationalTransferFee === 0 ? '£0 (Free)' : `£${b.internationalTransferFee}`}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-xs">Monthly Account Fee:</span>
                      <strong className="text-sm font-bold text-emerald-700">£0 Free</strong>
                    </div>
                  </div>

                  {/* Perks List with Enforced Legibility */}
                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Account Perks &amp; Extras
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                      {b.perks.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <span className="font-medium">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-600 mb-3 leading-relaxed">
                    <strong className="text-slate-900 font-bold block mb-0.5">Recommended for:</strong> 
                    {b.bestFor}
                  </div>

                  {b.applyUrl && (
                    <a
                      href={b.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>Check Criteria on Bank Site</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banking Advice Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 text-sm text-slate-700">
          <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-base">
              The 0% Overdraft Golden Rule:
            </h4>
            <p className="leading-relaxed">
              An interest-free student <DictionaryTooltip termKey="overdraft">overdraft</DictionaryTooltip> is a safety cushion, not free income. 
              Always opt for accounts with guaranteed limits in Year 1 rather than &quot;up to&quot; limits that depend on credit scores. 
              If you travel between Scottish cities or head south on trains frequently, Santander&apos;s free 4-Year 16-25 Railcard provides a guaranteed 1/3 discount on every off-peak train ticket.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
