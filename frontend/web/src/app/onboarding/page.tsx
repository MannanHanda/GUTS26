'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CreditCard, 
  Bus, 
  Sliders, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  GraduationCap, 
  MapPin, 
  Info,
  Wallet,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '@shared/types';
import { UNIVERSITIES, DEFAULT_STUDENT_PROFILE } from '@shared/mock-data/glasgow-dataset';
import { formatGBP } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('student_finance_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read saved profile:', e);
    }
  }, []);

  const saveToStorage = (updated: StudentProfile) => {
    try {
      localStorage.setItem('student_finance_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save profile to localStorage:', e);
    }
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!profile.university) newErrors.university = 'Please select your university or campus';
    } else if (step === 2) {
      if (!profile.totalBudget || profile.totalBudget <= 50) {
        newErrors.totalBudget = 'Please enter a realistic living budget (minimum £50/week)';
      }
      if (profile.maxAccommodationBudget > profile.totalBudget) {
        newErrors.maxAccommodationBudget = 'Rent cap cannot exceed your total living budget';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    saveToStorage(profile);

    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleTransport = (mode: 'subway' | 'bus' | 'train' | 'walk' | 'cycle') => {
    const current = profile.transportPreferences;
    const next = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode];

    if (next.length > 0) {
      const updated = { ...profile, transportPreferences: next };
      setProfile(updated);
      saveToStorage(updated);
    }
  };

  const toggleBanking = (
    priority:
      | 'interest_free_overdraft'
      | 'cashback_groceries'
      | 'low_international_fees'
      | 'railcard_incentive'
      | 'high_interest_savings'
  ) => {
    const current = profile.bankingPriorities;
    const next = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];

    const updated = { ...profile, bankingPriorities: next };
    setProfile(updated);
    saveToStorage(updated);
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Clean Neutral Step Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>STEP {step} OF {totalSteps}</span>
            <span className="text-slate-800 font-bold">
              {step === 1 && '1. Choose University'}
              {step === 2 && '2. Living Budget'}
              {step === 3 && '3. Commute Routine'}
              {step === 4 && '4. Banking & Summary'}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* STEP 1: Study Location */}
          {step === 1 && (
            <div key="step-1" className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Where will you be studying?
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select your campus so we can accurately measure walking corridors and subway zones.
                </p>
              </div>

              {/* University Selector */}
              <div className="space-y-2.5">
                {UNIVERSITIES.map((uni) => {
                  const isSelected = profile.university === uni.name;
                  return (
                    <button
                      key={uni.id}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...profile,
                          university: uni.name,
                          city: uni.city,
                          campusPostcode: uni.mainCampusPostcode,
                        };
                        setProfile(updated);
                        saveToStorage(updated);
                      }}
                      className={`w-full p-4 rounded-xl text-left border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{uni.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {uni.city} • Postcode: {uni.mainCampusPostcode}
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />}
                    </button>
                  );
                })}
                {errors.university && (
                  <p className="text-xs text-rose-600 font-medium">{errors.university}</p>
                )}
              </div>

              {/* Home vs International Student Toggle */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Student Category & Healthcare Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, isInternational: false, studentStatus: 'home_scotland' as const };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      !profile.isInternational && profile.studentStatus !== 'home_uk_other'
                        ? 'bg-slate-50 border-slate-900 text-slate-900 font-semibold ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Scottish Student</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">SAAS funding • Free NHS Prescriptions & Dental (&lt;26)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, isInternational: false, studentStatus: 'home_uk_other' as const };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      !profile.isInternational && profile.studentStatus === 'home_uk_other'
                        ? 'bg-slate-50 border-slate-900 text-slate-900 font-semibold ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Rest of UK</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">SFE / SFW • Free prescriptions when in Scotland</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, isInternational: true, studentStatus: 'international' as const };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      profile.isInternational
                        ? 'bg-slate-50 border-slate-900 text-slate-900 font-semibold ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">International</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Student Visa • £776/yr IHS Surcharge &amp; £0 FX wire focus</div>
                  </button>
                </div>

                {profile.isInternational && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                    <span className="text-base shrink-0">✈️</span>
                    <div className="leading-relaxed">
                      <strong className="font-bold text-amber-900 block mb-0.5">Mandatory Visa Requirement Expense:</strong>
                      You must pay the <strong>£776/year Immigration Health Surcharge (IHS) + £490 Visa Fee</strong> (£3,594 upfront for a 4-year degree) to the UK Home Office before arriving.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Living Budget */}
          {step === 2 && (
            <div key="step-2" className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  What is your living budget?
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  This covers rent, bills, commuting and daily living. Don&apos;t worry, you can easily change this anytime.
                </p>
              </div>

              {/* Quick Preset Buttons with Strict, Average, High Markers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quick Budget Tier Markers
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Glasgow student benchmark
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 160, tier: 'Strict', label: '£160/wk' },
                    { val: 220, tier: 'Average', label: '£220/wk' },
                    { val: 260, tier: 'Comfort', label: '£260/wk' },
                    { val: 320, tier: 'High', label: '£320/wk' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, totalBudget: item.val, budgetPeriod: 'weekly' as const };
                        setProfile(updated);
                        saveToStorage(updated);
                      }}
                      className={`py-2 px-2 rounded-xl text-center border transition flex flex-col items-center justify-center ${
                        profile.totalBudget === item.val && profile.budgetPeriod === 'weekly'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{item.tier}</span>
                      <span className="text-xs font-black">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Exact Budget Amount
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, budgetPeriod: 'weekly' })}
                      className={`px-2.5 py-0.5 rounded ${profile.budgetPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, budgetPeriod: 'monthly' })}
                      className={`px-2.5 py-0.5 rounded ${profile.budgetPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-500 text-base">
                    £
                  </span>
                  <input
                    type="number"
                    min={60}
                    max={2000}
                    step={5}
                    value={profile.totalBudget}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = { ...profile, totalBudget: val };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className="w-full pl-8 pr-16 py-3 bg-white border border-slate-300 rounded-xl font-bold text-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 font-medium">
                    {profile.budgetPeriod === 'weekly' ? 'per week' : 'per month'}
                  </span>
                </div>
                {errors.totalBudget && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.totalBudget}</p>
                )}
              </div>

              {/* Rent Cap Slider */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Maximum Rent Cap
                  </label>
                  <span className="text-sm font-bold text-slate-900">
                    £{profile.maxAccommodationBudget} / week
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Highest base rent you wish to consider before utilities and travel.
                </p>

                <input
                  type="range"
                  min={100}
                  max={350}
                  step={5}
                  value={profile.maxAccommodationBudget}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = { ...profile, maxAccommodationBudget: val };
                    setProfile(updated);
                    saveToStorage(updated);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />

                {/* Range Markers */}
                <div className="mt-1.5 flex justify-between items-center text-[10px] font-bold text-slate-500 px-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, maxAccommodationBudget: 135 };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`hover:text-slate-900 transition ${profile.maxAccommodationBudget <= 145 ? 'text-teal-700 font-extrabold underline' : ''}`}
                  >
                    Strict (£135/wk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, maxAccommodationBudget: 180 };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`hover:text-slate-900 transition ${profile.maxAccommodationBudget > 145 && profile.maxAccommodationBudget <= 220 ? 'text-teal-700 font-extrabold underline' : ''}`}
                  >
                    Average (£180/wk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, maxAccommodationBudget: 275 };
                      setProfile(updated);
                      saveToStorage(updated);
                    }}
                    className={`hover:text-slate-900 transition ${profile.maxAccommodationBudget > 220 ? 'text-teal-700 font-extrabold underline' : ''}`}
                  >
                    High (£275/wk)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Commute Routine */}
          {step === 3 && (
            <div key="step-3" className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  How often and how do you travel?
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  We check whether buying a monthly pass or paying single contactless fares is cheaper for you.
                </p>
              </div>

              {/* Number of weekly journeys */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Weekly Campus Journeys
                  </label>
                  <span className="text-xs font-bold text-slate-900">
                    {profile.weeklyJourneys} trips / week ({Math.round(profile.weeklyJourneys / 2)} days return)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[6, 8, 10, 14].map((trips) => (
                    <button
                      key={trips}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, weeklyJourneys: trips };
                        setProfile(updated);
                        saveToStorage(updated);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        profile.weeklyJourneys === trips
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {trips} trips ({trips / 2}d)
                    </button>
                  ))}
                </div>
              </div>

              {/* Modes */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Modes of Transport (Choose all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'subway', label: 'Glasgow Subway', desc: '15 inner circle stations' },
                    { id: 'bus', label: 'First Bus', desc: 'Citywide bus routes' },
                    { id: 'train', label: 'ScotRail Train', desc: 'Suburban train lines' },
                    { id: 'walk', label: 'Walking', desc: 'Free & active' },
                    { id: 'cycle', label: 'Nextbike Cycling', desc: 'Free first 30 mins' },
                  ].map((item) => {
                    const isSelected = profile.transportPreferences.includes(item.id as any);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTransport(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trade-off Priority */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  What is your priority?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lowest_cost', label: 'Save Money', desc: 'Willing to commute' },
                    { id: 'balanced', label: 'Balanced', desc: 'Fair compromise' },
                    { id: 'shortest_commute', label: 'Near Campus', desc: 'Short walk to library' },
                  ].map((tradeoff) => {
                    const isSelected = profile.tradeoffPreference === tradeoff.id;
                    return (
                      <button
                        key={tradeoff.id}
                        type="button"
                        onClick={() => {
                          const updated = { ...profile, tradeoffPreference: tradeoff.id as any };
                          setProfile(updated);
                          saveToStorage(updated);
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{tradeoff.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tradeoff.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Banking & Summary */}
          {step === 4 && (
            <div key="step-4" className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Student Banking & Final Review
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select key student account features, then review your plan before calculating your true living cost.
                </p>
              </div>

              {/* Priorities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'interest_free_overdraft', title: '0% Interest Overdraft', desc: 'Up to £2,000 emergency buffer' },
                  { id: 'railcard_incentive', title: 'Free 4-Year Railcard', desc: 'Saves 33% on UK train travel' },
                  { id: 'low_international_fees', title: '£0 International Wire Fees', desc: 'Best for funds sent from abroad' },
                  { id: 'cashback_groceries', title: 'Dining Discounts & Perks', desc: 'Tastecard membership & cashback' },
                ].map((item) => {
                  const isSelected = profile.bankingPriorities.includes(item.id as any);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleBanking(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Review summary box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Profile Review
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">University:</span>
                    <strong>{profile.university}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Weekly Budget:</span>
                    <strong>£{profile.budgetPeriod === 'monthly' ? Math.round(profile.totalBudget / 4.333) : profile.totalBudget} / wk</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rent Cap:</span>
                    <strong>£{profile.maxAccommodationBudget} / wk</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Travel:</span>
                    <strong>{profile.weeklyJourneys} trips / wk</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              id="btn-onboarding-continue"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
            >
              {step === totalSteps ? 'Calculate True Living Cost' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
