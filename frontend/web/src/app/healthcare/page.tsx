'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  HeartPulse, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Stethoscope, 
  Pill, 
  Smile, 
  Eye, 
  Clock, 
  Info, 
  ArrowRight,
  Filter,
  Search,
  HelpCircle,
  Activity
} from 'lucide-react';
import { apiClient } from '@/shared/api-client';
import { HealthcareBenefit, HealthcareClinic, StudentHealthcareStatus } from '@/shared/types';
import { MOCK_HEALTHCARE_BENEFITS, MOCK_HEALTHCARE_CLINICS } from '@/shared/mock-data/glasgow-dataset';

import { DictionaryTooltip } from '@/components/DictionaryTooltip';

export default function HealthcarePage() {
  // Data state
  const [benefits, setBenefits] = useState<HealthcareBenefit[]>(MOCK_HEALTHCARE_BENEFITS);
  const [clinics, setClinics] = useState<HealthcareClinic[]>(MOCK_HEALTHCARE_CLINICS);
  const [selectedClinicType, setSelectedClinicType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Calculator State
  const [studentStatus, setStudentStatus] = useState<StudentHealthcareStatus>('home_scotland');
  const [age, setAge] = useState<number>(20);
  const [hasPrescriptions, setHasPrescriptions] = useState<boolean>(true);
  const [courseYears, setCourseYears] = useState<number>(4);

  // Load from API client on mount
  useEffect(() => {
    async function loadData() {
      const benRes = await apiClient.getHealthcareBenefits();
      if (benRes.success) setBenefits(benRes.data);

      const clinicRes = await apiClient.getHealthcareClinics();
      if (clinicRes.success) setClinics(clinicRes.data);
    }
    loadData();
  }, []);

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const matchesType =
        selectedClinicType === 'all' ? true : c.type === selectedClinicType;
      const matchesSearch =
        searchQuery === ''
          ? true
          : c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [clinics, selectedClinicType, searchQuery]);

  // Calculations for Healthcare
  const isInternational = studentStatus === 'international';

  const ihsAnnual = isInternational ? 776 : 0;
  const ihsTotalCourse = isInternational ? 776 * courseYears : 0;
  const ihsWeeklyEquivalent = isInternational ? Number((776 / 52).toFixed(2)) : 0;

  // Annual savings in Scotland compared to studying in England
  const dentalSaving = age < 26 ? 140 : 0; // ~2 NHS Band 1 checkups + basic treatment
  const prescriptionSaving = hasPrescriptions ? 118.8 : 29.7; // 12 items @ £9.90 or 3 items
  const eyeExamSaving = 35; // 1 standard Scottish eye exam @ £0 vs £35
  const totalAnnualSavings = Math.round(dentalSaving + prescriptionSaving + eyeExamSaving);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Scope & Data Transparency Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span><strong>Scope:</strong> Configured for <strong>University of Glasgow (UofG)</strong> students &amp; Fraser Building Barclay Practice.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Policy Source: Official NHS Scotland 2026/27 Regulations &amp; Home Office Visa Standards (Curated).
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200/80 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                  <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                  NHS Scotland Student Health &amp; Rights Guide
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  UofG Focus
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                The Truth About Healthcare Costs in Glasgow
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Scotland provides massive hidden cost advantages over England — including <span className="font-semibold text-slate-900">100% free prescriptions</span> and <span className="font-semibold text-slate-900">free NHS dental treatment for under-26s</span>. 
                International students must budget for the mandatory <DictionaryTooltip termKey="ihs_surcharge"><span className="font-semibold text-slate-900">£776/year IHS visa surcharge</span></DictionaryTooltip>.
              </p>

              {/* Direct Register as New Patient Action */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.barclaymedicalpractice.co.uk/university-of-glasgow"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-register-new-patient-hero"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Register as New Patient (Barclay Practice)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.nhsinform.scot/care-support-and-rights/nhs-services/doctors/registering-with-a-gp-practice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                >
                  <span>NHS Inform GP Finder</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[240px]">
              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Prescriptions in Scotland</div>
                <div className="text-2xl font-bold text-teal-400 mt-1">£0.00 <span className="text-xs text-slate-300 font-normal">/ item</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Saves £9.90 per prescription vs England</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200/80">
                <div className="text-xs text-emerald-800 font-medium uppercase tracking-wider">NHS Dental (Under 26)</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">100% Free</div>
                <div className="text-[11px] text-emerald-700 mt-1">Free checkups, X-rays &amp; cleanings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">

        {/* SECTION 1: Interactive Personal Healthcare Cost & Savings Calculator */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Personalized Estimator
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Your Student Healthcare Budget & Savings Calculator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust your profile to calculate your upfront visa healthcare surcharge and your annual savings living in Glasgow.
              </p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Scottish Gov Exemption & UK Home Office 2026/2027 Rules
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Input Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Student Origin / Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Student Residency & Visa Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentStatus('home_scotland')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center ${
                      studentStatus === 'home_scotland'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Scotland Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatus('home_uk_other')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center ${
                      studentStatus === 'home_uk_other'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Rest of UK
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatus('international')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center ${
                      studentStatus === 'international'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    International
                  </button>
                </div>
              </div>

              {/* Age (Under 26 threshold) */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Student Age</span>
                  <span className="font-bold text-slate-900">{age} years old ({age < 26 ? 'Under 26 Free Dental' : 'Standard NHS Dental'})</span>
                </div>
                <div className="flex gap-2">
                  {[19, 21, 24, 27].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAge(a)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${
                        age === a ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {a === 27 ? '26+ yrs' : `${a} yrs`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regular Prescriptions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Do you take regular medication or monthly prescriptions?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasPrescriptions(true)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      hasPrescriptions
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Yes (Asthma, daily meds, etc.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPrescriptions(false)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      !hasPrescriptions
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    No / Occasional only
                  </button>
                </div>
              </div>

              {/* Course Length (for IHS calculation) */}
              {isInternational && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Visa Course Duration (Years)
                    </span>
                    <span className="font-bold">{courseYears} {courseYears === 1 ? 'Year' : 'Years'}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setCourseYears(yr)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${
                          courseYears === yr ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-amber-900 border-amber-200'
                        }`}
                      >
                        {yr === 1 ? '1 Yr (MSc)' : yr === 4 ? '4 Yrs (Hons)' : `${yr} Yrs`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800">
                    The UK Government charges £776 for every year of your student visa upfront before grant of visa.
                  </p>
                </div>
              )}
            </div>

            {/* Output Calculation Cards (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Out-of-pocket monthly */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Estimated Monthly Out-of-Pocket</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    £{isInternational ? (2.5 + ihsWeeklyEquivalent * 4.333).toFixed(0) : '10'} 
                    <span className="text-xs font-normal text-slate-500"> / month</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isInternational 
                      ? `Includes basic over-the-counter essentials + £${(ihsWeeklyEquivalent * 4.333).toFixed(0)}/mo IHS amortisation.` 
                      : 'Zero GP or prescription bills. Only covers OTC cold/flu remedies and first aid.'}
                  </p>
                </div>

                {/* Scotland Living Advantage Savings */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
                    <span>Scotland Annual Savings</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-200/80 text-emerald-900 font-bold">vs England</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    +£{totalAnnualSavings}
                    <span className="text-xs font-normal text-emerald-800"> / year saved</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {age < 26 ? 'Free NHS dental' : 'Standard'} + {hasPrescriptions ? '12 free prescriptions' : 'free optical exams'}.
                  </p>
                </div>
              </div>

              {/* International Upfront Surcharge Notice */}
              {isInternational ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300/80 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Upfront Visa Requirement: £{ihsTotalCourse} Cash
                    </div>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      You must pay the £{ihsAnnual}/year Immigration Health Surcharge in full when booking your visa biometrics (£{ihsTotalCourse} for a {courseYears}-year course). 
                      Once in Glasgow, you have the exact same free access to NHS doctors, hospitals and prescriptions as local students.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      100% Free at the Point of Care
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      As a UK student residing in Glasgow, you will never receive an emergency bill, consultation charge, or prescription copay. Just make sure to register with a campus GP during Freshers Week.
                    </p>
                  </div>
                </div>
              )}

              {/* Entitlements Checklist */}
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  Your Glasgow Student Healthcare Entitlements
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free NHS Prescriptions (£0)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{age < 26 ? 'Free Dental Care (Under 26)' : 'NHS Dental Checkups'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free NHS Eye Examination</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Campus Counselling (CAPS)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: NHS Scotland Healthcare Benefits & Hidden Costs Cards */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Key Healthcare Policies & Hidden Fee Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Everything you need to know about rights, exemptions, and hidden traps before arriving in Glasgow.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              6 Policies Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit) => {
              const isIHS = benefit.category === 'visa_surcharge';
              return (
                <div
                  key={benefit.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between card-hover-lift animate-fade-in ${
                    isIHS
                      ? 'bg-amber-50/60 border-amber-200/90'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          isIHS
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {benefit.badge}
                      </span>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block leading-tight">Cost in Scotland</span>
                        <span className={`text-base font-extrabold ${isIHS ? 'text-amber-900' : 'text-emerald-700'}`}>
                          {benefit.costInScotland === 0 ? '£0 Free' : `£${benefit.costInScotland}/yr`}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {benefit.title}
                    </h3>
                    <p className="text-xs font-semibold text-teal-800 mt-1">
                      {benefit.headline}
                    </p>

                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {benefit.description}
                    </p>

                    {benefit.estimatedAnnualSaving > 0 && (
                      <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200/70 text-[11px] text-emerald-900 font-semibold flex items-center justify-between">
                        <span>Saves vs England:</span>
                        <span className="font-bold text-emerald-700">+£{benefit.estimatedAnnualSaving}/year</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Action Required
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {benefit.actionRequired}
                    </p>

                    {benefit.links && benefit.links.length > 0 && (
                      <div className="mt-2.5">
                        {benefit.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                          >
                            <span>{link.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: Glasgow Campus Clinics & Medical Practice Directory */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" />
                Clinic Directory
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Where to Get Seen: Glasgow Student Medical Centers
              </h2>
              <p className="text-xs text-slate-500">
                Registering with a campus practice takes less than 10 minutes and gives you quick access to local doctors.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clinics, services, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900"
              />
            </div>
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {[
              { id: 'all', label: 'All Facilities' },
              { id: 'campus_gp', label: 'Campus GP Surgeries' },
              { id: 'minor_injuries', label: 'Minor Injuries (Skip A&E)' },
              { id: 'pharmacy', label: 'NHS Pharmacy First' },
              { id: 'emergency', label: '24/7 Hospital A&E' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedClinicType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedClinicType === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClinics.map((clinic) => (
              <div
                key={clinic.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between hover:bg-white card-hover-lift animate-fade-in"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase tracking-wide">
                      {clinic.type.replace('_', ' ')}
                    </span>
                    {clinic.isStudentSpecialist && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Student Specialist
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {clinic.name}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{clinic.address}, {clinic.postcode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{clinic.walkingDistanceMins} mins walk from campus • {clinic.openingHours}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{clinic.phone}</span>
                    </div>
                  </div>

                  {/* Services Tags */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-700 mb-1.5">Key Services</div>
                    <div className="flex flex-wrap gap-1.5">
                      {clinic.services.map((svc) => (
                        <span
                          key={svc}
                          className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {clinic.registrationUrl && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <a
                      href={clinic.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <span>Register as New Patient</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Fast-Track Emergency Guide: A&E vs Minor Injuries vs 111 */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-teal-400 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5" />
              Glasgow Student Medical Fast-Track Guide
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sick or Injured? How to Avoid 8-Hour Hospital Waits
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Many students instinctively go to the Queen Elizabeth University Hospital (QEUH) emergency room for minor accidents, facing exhausting 6 to 8 hour waits. Follow this Glasgow triage workflow:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs mb-2">
                1
              </div>
              <h3 className="text-sm font-bold text-white">NHS Pharmacy First</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                For sore throats, earaches, cold sores, urinary infections, or skin rashes. Walk into any chemist (e.g. Boots on Byres Rd) for free medicine on the spot with 0 wait.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs mb-2">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Campus GP (Barclay)</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                For persistent illness, mental health appointments, repeat prescriptions, or specialist NHS referrals. Call at 8:00 AM for same-day triage appointments.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs mb-2">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Minor Injuries (Stobhill)</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                For cuts requiring stitches, sprains, sports fractures, and minor burns. Much faster turnaround than A&E. Call <span className="font-semibold text-white">NHS 111</span> first to book an arrival slot.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 font-bold flex items-center justify-center text-xs mb-2">
                4
              </div>
              <h3 className="text-sm font-bold text-white">Emergency 999 / A&E</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Only for severe, life-threatening conditions (unconsciousness, chest pain, heavy bleeding, severe breathing difficulty). Queen Elizabeth Hospital (QEUH) or Glasgow Royal Infirmary.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: Step-by-Step Registration Checklist for New Students */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            4-Step Checklist: Getting Set Up With NHS Scotland
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Complete these four actions during Freshers Week so you are never caught unprepared when sick.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step 1</div>
                <div className="text-sm font-bold text-slate-900">Register with Campus GP</div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Register online with your Glasgow student address and student ID.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                <a
                  href="https://www.barclaymedicalpractice.co.uk/university-of-glasgow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                >
                  <span>Register as New Patient (Barclay)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="text-[10px] text-slate-500">
                  UofG Fraser Building, Level 2
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step 2</div>
              <div className="text-sm font-bold text-slate-900">Get Your CHI Number</div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You will be assigned a 10-digit Scottish Community Health Index (CHI) number. Save this in your notes app for hospital and pharmacy visits.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step 3</div>
              <div className="text-sm font-bold text-slate-900">Register with an NHS Dentist</div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                If you are under 26, register with an NHS dental clinic early (e.g. Byres Rd) to lock in your 100% free checkups and cleanings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Step 4 • Optical &amp; Help</div>
                <div className="text-sm font-bold text-slate-900">Eye Exams vs Glasses &amp; HC2</div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  NHS eye exams are <strong>100% free</strong> for all students, but <strong>glasses frames and lenses are NOT free</strong>.
                </p>
                <div className="mt-2 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                  <div>• <strong>Under 19:</strong> Get an NHS Optical Voucher automatically if in full-time education.</div>
                  <div>• <strong>19 and older (+19):</strong> Can apply for NHS Optical Vouchers through low income by submitting an <strong>HC1 form</strong> for an <strong>HC2 certificate</strong>.</div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <a
                  href="https://www.nhsbsa.nhs.uk/nhs-low-income-scheme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                >
                  <span>Apply for HC1 Low Income Certificate</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Ready to see how healthcare balances with your rent and transit passes?
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                <span>View Full Living Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
