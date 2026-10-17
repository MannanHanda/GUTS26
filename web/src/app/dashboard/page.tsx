'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  Bus, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  RefreshCw,
  Copy,
  Check,
  Wallet,
  ShieldCheck,
  ChevronDown,
  HeartPulse
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { DecisionCombination, StudentProfile, AccommodationListing, TransportOption, BankAccount } from '@shared/types';
import { DEFAULT_STUDENT_PROFILE, MOCK_ACCOMMODATIONS, MOCK_TRANSPORTS, MOCK_BANK_ACCOUNTS } from '@shared/mock-data/glasgow-dataset';
import { apiClient } from '@shared/api-client';
import { formatGBP, formatCommute } from '@/lib/utils';
import { SkeletonDashboard, CalculatingBadge } from '@/components/LoadingSkeleton';
import { Toast } from '@/components/Toast';

export default function DashboardPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [combinations, setCombinations] = useState<DecisionCombination[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [metaSource, setMetaSource] = useState<string>('contract_fallback_mock');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Custom Mix & Match state
  const [customAccId, setCustomAccId] = useState<string>('');
  const [customTransportId, setCustomTransportId] = useState<string>('');
  const [customBankId, setCustomBankId] = useState<string>('');
  const [showCustomBuilder, setShowCustomBuilder] = useState<boolean>(false);

  useEffect(() => {
    let activeProfile = DEFAULT_STUDENT_PROFILE;
    try {
      const saved = localStorage.getItem('student_finance_profile');
      if (saved) {
        activeProfile = JSON.parse(saved);
        setProfile(activeProfile);
      }
    } catch (e) {
      console.warn('Could not read profile from storage:', e);
    }

    apiClient.getRecommendations(activeProfile).then((res) => {
      if (res.data && res.data.length > 0) {
        setCombinations(res.data);
        setSelectedComboId(res.data[0].id);
        setCustomAccId(res.data[0].accommodation.id);
        setCustomTransportId(res.data[0].transport.id);
        setCustomBankId(res.data[0].banking.id);
        if (res.meta?.source) setMetaSource(res.meta.source);
      }
      setLoading(false);
    });
  }, []);

  // Update budget slider on the fly
  const handleBudgetChange = (newBudget: number) => {
    setIsRecalculating(true);
    const updated = { ...profile, totalBudget: newBudget };
    setProfile(updated);
    try {
      localStorage.setItem('student_finance_profile', JSON.stringify(updated));
    } catch (e) {}

    apiClient.getRecommendations(updated).then((res) => {
      if (res.data && res.data.length > 0) {
        setCombinations(res.data);
      }
      setTimeout(() => setIsRecalculating(false), 250);
    });
  };

  const activeCombo = combinations.find((c) => c.id === selectedComboId) || combinations[0];

  const handleCopySummary = () => {
    if (!activeCombo) return;
    const text = `🎓 The Hidden Cost of Being a Student - Living Cost Plan:
• University: ${profile.university}
• True Weekly Living Cost: ${formatGBP(activeCombo.costSummary.weeklyNetLivingCost)}/week
• Base Rent: ${formatGBP(activeCombo.costSummary.weeklyAccommodationRent)}/wk (${activeCombo.accommodation.name})
• Bills: ${activeCombo.accommodation.billsIncluded ? 'Included (£0)' : `+${formatGBP(activeCombo.costSummary.weeklyEstimatedBills)}/wk`}
• Commute Fare: ${formatGBP(activeCombo.costSummary.weeklyCommuteCost)}/wk (${activeCombo.transport.passName})
• Commute Time: ${activeCombo.costSummary.weeklyCommutingHours} hrs/week
• Upfront Day-1 Cash Needed: ${formatGBP(activeCombo.costSummary.totalUpfrontCost)} (Deposit + 1st month rent)
• Budget Margin: ${activeCombo.costSummary.isUnderBudget ? `+${formatGBP(activeCombo.costSummary.budgetDifferenceWeekly)}/wk under budget` : `Over budget by ${formatGBP(Math.abs(activeCombo.costSummary.budgetDifferenceWeekly))}/wk`}
Generated via GUTS Hackathon 2026`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setToastMessage('Copied full living cost plan to clipboard!');
    setToastOpen(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading || !activeCombo) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <CalculatingBadge label="Analyzing 14 Glasgow living combinations..." />
        </div>
        <SkeletonDashboard />
      </div>
    );
  }

  const { costSummary, accommodation, transport, banking, tradeoffs } = activeCombo;

  const chartData = [
    {
      category: 'Rent',
      amount: costSummary.weeklyAccommodationRent,
      color: '#0f172a', // deep slate
    },
    {
      category: 'Bills',
      amount: costSummary.weeklyEstimatedBills,
      color: '#d97706', // amber
    },
    {
      category: 'Travel',
      amount: costSummary.weeklyCommuteCost,
      color: '#0284c7', // sky
    },
    {
      category: 'Surplus',
      amount: Math.max(0, costSummary.budgetDifferenceWeekly),
      color: '#059669', // emerald
    },
  ];

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                {profile.university}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • {profile.weeklyJourneys} campus trips/wk
              </span>
              <span className="text-[11px] text-slate-400">
                • {metaSource === 'live_backend' ? 'Teammate Backend Active' : 'Contract Mock Engine'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              True Living Cost Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated weekly and monthly living costs considering rent, bills, commuting, and move-in cash.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Copied Plan!' : 'Share Plan'}
            </button>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-300" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Live Interactive Budget Bar (Soft Neutral) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interactive Weekly Budget Slider
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Drag to test different student budgets)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isRecalculating && <CalculatingBadge label="Updating living costs..." />}
              <div className="text-sm font-extrabold text-slate-900">
                £{profile.totalBudget} <span className="text-xs font-normal text-slate-500">/ week</span>
              </div>
            </div>
          </div>

          <input
            type="range"
            min={120}
            max={400}
            step={5}
            value={profile.totalBudget}
            onChange={(e) => handleBudgetChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />

          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
            <span>£120/wk (Strict Budget)</span>
            <span>£220/wk (Average UK Student)</span>
            <span>£400/wk (High Budget)</span>
          </div>
        </div>

        {/* Key Metrics Summary Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. True Weekly Cost */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                True Weekly Cost
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatGBP(costSummary.weeklyNetLivingCost)}
                <span className="text-xs font-medium text-slate-400 ml-0.5">/wk</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
              Rent {formatGBP(costSummary.weeklyAccommodationRent)} + Bills {formatGBP(costSummary.weeklyEstimatedBills)} + Travel {formatGBP(costSummary.weeklyCommuteCost)}
            </div>
          </div>

          {/* 2. Monthly Outlay */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Estimated Monthly
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatGBP(costSummary.monthlyNetLivingCost)}
                <span className="text-xs font-medium text-slate-400 ml-0.5">/mo</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
              Semester: {formatGBP(costSummary.semesterTotalCost)} (39 wks)
            </div>
          </div>

          {/* 3. Upfront Move-in Cash Required */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Day-1 Move-in Cash
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatGBP(costSummary.totalUpfrontCost)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
              Deposit ({formatGBP(accommodation.deposit)}) + 1st month rent
            </div>
          </div>

          {/* 4. Budget Margin */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Budget Margin
              </span>
              <div className={`text-2xl sm:text-3xl font-black ${costSummary.isUnderBudget ? 'text-emerald-700' : 'text-rose-600'}`}>
                {costSummary.isUnderBudget ? '+' : ''}
                {formatGBP(costSummary.budgetDifferenceWeekly)}
                <span className="text-xs font-medium ml-0.5">/wk</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              {costSummary.isUnderBudget ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Under your weekly target
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Over target by {formatGBP(Math.abs(costSummary.budgetDifferenceWeekly))}
                </span>
              )}
            </div>
          </div>

          {/* 5. Commute Time */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Commute Time
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatCommute(costSummary.weeklyCommutingHours)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>~{costSummary.annualCommuteHours} hrs / academic year</span>
            </div>
          </div>
        </div>

        {/* AI Recommended Combination Spotlight */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-teal-300 border border-slate-700 mb-2">
                <Sparkles className="w-3 h-3" />
                {activeCombo.isAiRecommended ? 'Top Recommended Combination' : `Decision Combination #${activeCombo.rank}`}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {accommodation.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {accommodation.area} • Linked with {transport.passName} & {banking.bankName}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Fit Score</span>
              <div className="text-2xl sm:text-3xl font-black text-white">{activeCombo.score} / 100</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* Why was this chosen? */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Why this option was selected:
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {activeCombo.recommendationReason}
              </p>
            </div>

            {/* The 3 Decision Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pillar 1: Housing */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      1. Housing
                    </span>
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{accommodation.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{accommodation.roomType} • {accommodation.area}</div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rent:</span>
                      <strong className="text-slate-800">{formatGBP(accommodation.weeklyRent)}/wk</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bills:</span>
                      <strong className={accommodation.billsIncluded ? 'text-emerald-700' : 'text-amber-700'}>
                        {accommodation.billsIncluded ? 'Included (£0)' : `+${formatGBP(accommodation.estimatedBillsWeekly)}/wk`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deposit:</span>
                      <strong className="text-slate-800">{formatGBP(accommodation.deposit)}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80">
                  <Link href="/accommodation" className="text-xs font-bold text-slate-900 hover:underline inline-flex items-center gap-1">
                    Compare housing <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Transport */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      2. Travel Route
                    </span>
                    <Bus className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{transport.passName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{transport.provider}</div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Commute Fare:</span>
                      <strong className="text-slate-800">{formatGBP(costSummary.weeklyCommuteCost)}/wk</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trip Time:</span>
                      <strong className="text-slate-800">{transport.averageTripMinutes} mins</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weekly Hours:</span>
                      <strong className="text-slate-800">{formatCommute(costSummary.weeklyCommutingHours)}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80">
                  <Link href="/transport" className="text-xs font-bold text-slate-900 hover:underline inline-flex items-center gap-1">
                    Compare transit passes <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Banking */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      3. Student Bank
                    </span>
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{banking.accountName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{banking.bankName}</div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">0% Overdraft:</span>
                      <strong className="text-emerald-700">{formatGBP(banking.overdraftLimitYear1)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Main Perk:</span>
                      <strong className="text-slate-800 truncate max-w-[130px]">{banking.headlineFeature}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Value:</span>
                      <strong className="text-emerald-700">+{formatGBP(banking.estimatedYearlyValue)}/yr</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80">
                  <Link href="/banking" className="text-xs font-bold text-slate-900 hover:underline inline-flex items-center gap-1">
                    Compare bank accounts <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Trade-offs & Disadvantages in Plain English */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Honest Trade-offs (What You Give Up)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tradeoffs.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                      <span>{t.title}</span>
                      {t.hiddenCostFlag && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
                          {t.hiddenCostFlag}
                        </span>
                      )}
                    </div>
                    <div className="text-emerald-800 flex items-start gap-1 mb-1">
                      <span className="font-bold">PRO:</span>
                      <span>{t.advantage}</span>
                    </div>
                    <div className="text-rose-800 flex items-start gap-1">
                      <span className="font-bold">CON:</span>
                      <span>{t.disadvantage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart & Alternative Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart View */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Weekly Budget Breakdown (£/week)
                </h3>
                <p className="text-xs text-slate-500">
                  Visual distribution of your weekly expenses for this choice.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                Budget: £{profile.totalBudget}/wk
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                  <XAxis type="number" unit="£" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any) => [`${formatGBP(Number(val))}/wk`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Rent</span>
                <span className="font-bold text-slate-900">{formatGBP(costSummary.weeklyAccommodationRent)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bills</span>
                <span className="font-bold text-slate-900">{formatGBP(costSummary.weeklyEstimatedBills)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Travel</span>
                <span className="font-bold text-slate-900">{formatGBP(costSummary.weeklyCommuteCost)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Leftover Cash</span>
                <span className="font-bold text-emerald-700">{formatGBP(Math.max(0, costSummary.budgetDifferenceWeekly))}</span>
              </div>
            </div>
          </div>

          {/* Quick Alternatives List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                Other Packages
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Click any option to inspect its true living cost instantly:
              </p>

              <div className="space-y-2">
                {combinations.map((c) => {
                  const isSelected = c.id === selectedComboId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedComboId(c.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {c.accommodation.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.accommodation.area} • {c.transport.mode}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-slate-900">
                          {formatGBP(c.costSummary.weeklyNetLivingCost)}/wk
                        </div>
                        <div className={`text-[10px] font-semibold ${c.costSummary.isUnderBudget ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {c.costSummary.isUnderBudget ? `Save ${formatGBP(c.costSummary.budgetDifferenceWeekly)}` : 'Over budget'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link
                href="/accommodation"
                className="text-xs font-bold text-slate-800 hover:text-slate-900 inline-flex items-center gap-1"
              >
                Inspect full property comparisons <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Day-1 Move-in Checklist */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-sm">
              Day-1 Move-in Cash Checklist (Avoid Moving Day Shock)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Most students remember rent, but forget they need lump-sum cash in their bank account before picking up the keys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">1. Security Deposit</span>
              <span className="text-base font-extrabold text-slate-900">{formatGBP(accommodation.deposit)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Refundable at lease end</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">2. 1st Month Rent Advance</span>
              <span className="text-base font-extrabold text-slate-900">{formatGBP(accommodation.weeklyRent * 4)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Standard 4 weeks rent</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">3. First Transit Pass</span>
              <span className="text-base font-extrabold text-slate-900">{formatGBP(costSummary.weeklyCommuteCost * 4)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Subway / Bus card</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-900">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Cash Needed</span>
              <span className="text-base font-extrabold text-white">{formatGBP(costSummary.totalUpfrontCost)}</span>
              <span className="text-[10px] text-teal-300 block mt-0.5">Ready in bank account</span>
            </div>
          </div>
        </div>

        {/* Healthcare & NHS Scotland Integration Banner */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  NHS Scotland Healthcare &amp; Student Entitlements
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {costSummary.annualHealthcareSavings > 0 ? `+£${costSummary.annualHealthcareSavings}/yr Saved vs England` : 'NHS Covered'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                {profile.isInternational ? (
                  <>
                    International students pay the <span className="font-semibold text-slate-700">£776/year IHS surcharge</span> upfront on their visa. Once in Glasgow, you have 100% free access to GP consultations, hospitals, and free prescriptions.
                  </>
                ) : (
                  <>
                    In Scotland, all student prescriptions are <span className="font-semibold text-slate-700">100% free (£0)</span> and NHS dental checkups are free for anyone under 26.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/healthcare"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <span>Explore NHS Healthcare</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Global Action Toast Feedback */}
        <Toast
          isOpen={toastOpen}
          message={toastMessage}
          onClose={() => setToastOpen(false)}
        />
      </div>
    </div>
  );
}
