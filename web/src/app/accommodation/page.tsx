'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ArrowUpDown,
  Search,
  Check,
  Flame,
  Info,
  ShieldCheck
} from 'lucide-react';
import { AccommodationListing, StudentProfile } from '@shared/types';
import { apiClient } from '@shared/api-client';
import { DEFAULT_STUDENT_PROFILE } from '@shared/mock-data/glasgow-dataset';
import { formatGBP } from '@/lib/utils';

export default function AccommodationPage() {
  const [accommodations, setAccommodations] = useState<AccommodationListing[]>([]);
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [billsIncludedOnly, setBillsIncludedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'true_cost' | 'base_rent' | 'commute' | 'deposit'>('true_cost');
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

    apiClient.getAccommodations().then((res) => {
      setAccommodations(res.data);
      setLoading(false);
    });
  }, []);

  const processedListings = accommodations.map((acc) => {
    const transitCostWeekly = acc.walkingTimeMins <= 15 ? 0 : 16.5;
    const estimatedBillsWeekly = acc.billsIncluded ? 0 : acc.estimatedBillsWeekly;
    const trueWeeklyCost = acc.weeklyRent + estimatedBillsWeekly + transitCostWeekly;
    const upfrontTotal = acc.deposit + acc.adminOrHoldingFee + acc.weeklyRent * 4;

    return {
      ...acc,
      transitCostWeekly,
      estimatedBillsWeekly,
      trueWeeklyCost,
      upfrontTotal,
    };
  });

  const filteredListings = processedListings.filter((item) => {
    if (billsIncludedOnly && !item.billsIncluded) return false;
    if (selectedArea !== 'all' && !item.area.toLowerCase().includes(selectedArea.toLowerCase())) return false;
    if (selectedRoomType !== 'all') {
      if (selectedRoomType === 'ensuite' && !item.roomType.toLowerCase().includes('en-suite')) return false;
      if (selectedRoomType === 'halls' && item.type !== 'university_halls' && item.type !== 'private_hall') return false;
      if (selectedRoomType === 'flat' && item.type !== 'shared_flat') return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query)
      );
    }
    return true;
  });

  filteredListings.sort((a, b) => {
    if (sortBy === 'true_cost') return a.trueWeeklyCost - b.trueWeeklyCost;
    if (sortBy === 'base_rent') return a.weeklyRent - b.weeklyRent;
    if (sortBy === 'commute') return a.transitTimeMins - b.transitTimeMins;
    if (sortBy === 'deposit') return a.deposit - b.deposit;
    return 0;
  });

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                Housing Module
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • Target: {profile.university}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Accommodation Comparison
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare headline rent against actual bills, security deposits, and commuting implications.
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

        {/* Clean Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          {/* Top row: search + sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by hall name, flat or neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="true_cost">Lowest True Weekly Cost (Rent+Bills+Travel)</option>
                <option value="base_rent">Lowest Base Advertised Rent</option>
                <option value="commute">Shortest Travel Time</option>
                <option value="deposit">Lowest Security Deposit</option>
              </select>
            </div>
          </div>

          {/* Filter Pills row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Area:
            </span>
            {[
              { id: 'all', label: 'All Areas' },
              { id: 'west end', label: 'West End' },
              { id: 'finnieston', label: 'Finnieston' },
              { id: 'southside', label: 'Southside' },
              { id: 'dennistoun', label: 'Dennistoun' },
            ].map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  selectedArea === area.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {area.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setBillsIncludedOnly(!billsIncludedOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                billsIncludedOnly
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Bills Included Only
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between card-hover-lift animate-fade-in"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {acc.type === 'university_halls' && 'University Residence'}
                    {acc.type === 'private_hall' && 'Private PBSA Hall'}
                    {acc.type === 'shared_flat' && 'Private Shared Flat'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {acc.walkingTimeMins <= 15 ? (
                      <span className="text-emerald-700 font-bold">{acc.walkingTimeMins}m walk</span>
                    ) : (
                      <span>{acc.transitTimeMins}m transit</span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {acc.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{acc.address}</span>
                </div>

                {/* True Cost Breakdown Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-700">True All-in Cost:</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatGBP(acc.trueWeeklyCost)}
                      <span className="text-xs font-normal text-slate-500"> / wk</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Advertised Rent:</span>
                      <strong className="text-slate-800">{formatGBP(acc.weeklyRent)}/wk</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Utility Bills (Heating & Wi-Fi):</span>
                      {acc.billsIncluded ? (
                        <span className="text-emerald-700 font-semibold">Included (£0)</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">+{formatGBP(acc.estimatedBillsWeekly)}/wk</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Transit Pass Needed:</span>
                      {acc.transitCostWeekly === 0 ? (
                        <span className="text-emerald-700 font-semibold">£0 (Walk to campus)</span>
                      ) : (
                        <span className="text-slate-800 font-semibold">+{formatGBP(acc.transitCostWeekly)}/wk</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deposit & Lease specs */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Deposit</span>
                    <span className="font-extrabold text-slate-800">{formatGBP(acc.deposit)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Contract</span>
                    <span className="font-extrabold text-slate-800">{acc.contractLengthWeeks} weeks</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {acc.features.slice(0, 3).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Source Footer */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 truncate mr-2">
                  <span className="text-[9px] text-slate-400 block uppercase">Source</span>
                  <span className="truncate font-medium">{acc.source}</span>
                </div>

                {acc.sourceUrl && (
                  <a
                    href={acc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-slate-900 shrink-0"
                  >
                    View listing <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Council tax & energy helper */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
          <strong className="text-slate-900 font-bold block">
            Student Tip on Contracts:
          </strong>
          <p>
            Private landlords in Glasgow often require 52-week leases. If you travel home for the 13 summer weeks, you are still legally bound to pay ~£1,500+ in rent. University residences usually offer 39-week academic leases which end when classes finish.
          </p>
        </div>
      </div>
    </div>
  );
}
