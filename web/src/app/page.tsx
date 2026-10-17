'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  Bus, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  ShieldCheck, 
  Scale, 
  EyeOff,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Coins,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { formatGBP } from '@/lib/utils';

export default function LandingPage() {
  const [activeScenario, setActiveScenario] = useState<'distant_cheap' | 'close_inclusive'>('distant_cheap');

  return (
    <div suppressHydrationWarning className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Soft Neutral Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              GUTS Hackathon 2026 • Student Financial Clarity
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Make student life <span className="text-teal-700">cost less.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Compare where you live, how you bank and how you travel — and understand the real cost of each choice before signing a lease.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/onboarding"
                id="btn-start-comparing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition"
              >
                Start comparing (2 mins)
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
              <Link
                href="/dashboard"
                id="btn-view-demo-dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-sm transition"
              >
                View sample dashboard
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-8 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Unbiased & Zero sponsored rankings
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                True weekly & monthly living cost
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No confusing financial jargon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Decisions in Plain English */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why Headline Rent Lies to Students
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Most students budget for rent alone. But living costs come from three decisions that interact with each other:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Housing & Bills */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">1. Rent &amp; Utility Bills</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  A private room at £120/week seems cheap. But when gas, electricity, heating and Wi-Fi are excluded, winter bills add <strong className="text-slate-900">+£30/week</strong>.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Hidden: Uncapped winter utility spikes
              </div>
            </div>

            {/* Card 2: Commute & Passes */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <Bus className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">2. Travel &amp; Commuting</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Living further out saves rent, but Subway or First Bus passes cost <strong className="text-slate-900">£16.50–£18/week</strong>, plus 5+ hours lost each week traveling.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Hidden: £70+/month transit fares
              </div>
            </div>

            {/* Card 3: Banking Perks */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">3. Banking &amp; Overdrafts</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Picking the right student account provides an interest-free overdraft buffer and perks like a <strong className="text-slate-900">Free 4-Year Railcard</strong> saving 1/3 on travel.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Benefit: ~£199 value in train savings
              </div>
            </div>

            {/* Card 4: NHS Scotland Healthcare */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-4">
                  <HeartPulse className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">4. NHS Scotland Rights</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  In Scotland, prescriptions are <strong className="text-slate-900">100% free (£0)</strong> and dental checkups are free under 26. International students must factor the <strong className="text-slate-900">£776/yr IHS visa fee</strong>.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Advantage: Saves £140+/yr vs England
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AHA! Simulator */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Interactive Live Example
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              Compare Two Common Student Scenarios
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Toggle between a cheap outer flat and an all-inclusive campus hall in Glasgow.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Toggle Switch */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveScenario('distant_cheap')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                  activeScenario === 'distant_cheap'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Option A: Outer Flat (£118/wk)</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Bills Excluded
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScenario('close_inclusive')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                  activeScenario === 'close_inclusive'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Option B: Campus Hall (£185/wk)</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  All Bills Included
                </span>
              </button>
            </div>

            {/* Breakdown */}
            <div className="p-6 sm:p-8">
              {activeScenario === 'distant_cheap' ? (
                <div key="distant_cheap" className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Govanhill / Southside Tenement Flat</div>
                      <div className="text-xs text-slate-600">35 min subway commute • 12-month private lease</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">True Weekly Cost</span>
                      <span className="text-2xl font-black text-slate-900">£164.50 / week</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Advertised Rent</div>
                      <div className="text-lg font-black text-slate-900">£118.00</div>
                      <div className="text-[10px] text-slate-400">Appears cheap</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Gas & Electricity</div>
                      <div className="text-lg font-black text-amber-700">+£30.00</div>
                      <div className="text-[10px] text-amber-700">Not in rent</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Subway Pass</div>
                      <div className="text-lg font-black text-amber-700">+£16.50</div>
                      <div className="text-[10px] text-amber-700">Required travel</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Commute Time</div>
                      <div className="text-lg font-black text-slate-900">5.8 hrs/wk</div>
                      <div className="text-[10px] text-slate-500">~23 hrs / month</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900">The Student Reality:</strong> The headline rent was £67/week lower, but after utility bills and subway passes, your real saving is only £20/week — at the cost of 23 hours spent traveling every single month, plus paying rent during summer months.
                  </div>
                </div>
              ) : (
                <div key="close_inclusive" className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Kelvinhaugh Gate University Halls</div>
                      <div className="text-xs text-slate-600">14 min walk to Main Campus • 39-week academic lease</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">True Weekly Cost</span>
                      <span className="text-2xl font-black text-slate-900">£185.00 / week</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Advertised Rent</div>
                      <div className="text-lg font-black text-slate-900">£185.00</div>
                      <div className="text-[10px] text-slate-400">All-in package</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Gas & Electricity</div>
                      <div className="text-lg font-black text-emerald-700">£0.00</div>
                      <div className="text-[10px] text-emerald-700">Included in rent</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Commute Cost</div>
                      <div className="text-lg font-black text-emerald-700">£0.00</div>
                      <div className="text-[10px] text-emerald-700">Walk or cycle</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Commute Time</div>
                      <div className="text-lg font-black text-emerald-700">0 hrs/wk</div>
                      <div className="text-[10px] text-emerald-700">Healthy walk</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900">The Student Reality:</strong> Total billing certainty with zero winter heating shock, a 39-week contract that doesn&apos;t charge for empty summer weeks, and an extra 23 hours every month to study, relax, or work a part-time job.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in 3 Clean Steps */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How Antigravity Student Finance Works
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Three simple steps to make an informed, stress-free decision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Set Your Preferences</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your university (e.g. Glasgow, Strathclyde) and weekly budget. Tell us your travel frequency and banking needs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">We Calculate True Living Cost</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We combine rent, estimated utilities, deposits, and transit passes to compute your real weekly and monthly outlay.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Choose With Confidence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See trade-offs clearly. Understand what you sacrifice to save money, and make the choice that fits your life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Rules & Factsheet */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Essential Student Financial Rules in Scotland / UK
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-teal-700" />
                Council Tax Exemption
              </div>
              <p>Full-time students in the UK do not pay Council Tax. Register your student matriculation certificate with the local council to avoid billing errors.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-teal-700" />
                Deposit Protection (TDS)
              </div>
              <p>In Scotland, your landlord is legally required to lodge your tenancy deposit in a registered third-party tenancy deposit scheme within 30 days.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                0% Student Overdraft
              </div>
              <p>A student overdraft from major UK banks is interest-free during your studies. Keep it as an emergency reserve for unexpected textbook or move-in costs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer banner */}
      <section className="py-14 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Ready to find your true cost of student living?
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8 text-xs sm:text-sm">
            Set your budget in 2 minutes and explore tailored recommendations with complete financial transparency.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition shadow-sm text-sm"
          >
            Start your profile setup
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
