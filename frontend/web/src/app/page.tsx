'use client';

import Link from 'next/link';
import { LiveTradeoff } from '@/components/landing/LiveTradeoff';
import { 
  Building2, 
  CreditCard, 
  Bus, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  FileCheck2,
  Coins,
  HeartPulse
} from 'lucide-react';

export default function LandingPage() {

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
                  Advertised rent is not always the full cost. Check whether heating, electricity and Wi-Fi are included: every University of Glasgow residence includes them, many private lets do not.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Hidden: bills left out of the advertised rent
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
                  Living further out can save rent but adds travel. A Glasgow Subway 28-day ticket costs <strong className="text-slate-900">£55 bought online</strong> (SPT, 2026), on top of the time spent travelling.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Hidden: travel cost and travel time
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Perks vary by account (comparison coming soon)
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
                  Healthcare entitlements depend on where you are from and your visa status. A verified guide is coming soon.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Coming soon: verified healthcare guidance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live trade-off: two real recommendations from the decision engine */}
      <LiveTradeoff />

      {/* How It Works in 3 Clean Steps */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How Uniwise Works
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
                Choose your university and weekly budget. Tell us your travel frequency and banking needs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">We Calculate True Living Cost</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We combine official rents, included bills, commute fares and move-in costs to compute your real monthly and upfront costs.
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
