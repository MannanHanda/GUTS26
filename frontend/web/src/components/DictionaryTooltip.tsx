'use client';

import React, { useState } from 'react';
import { HelpCircle, Info, BookOpen } from 'lucide-react';

export interface DictionaryEntry {
  term: string;
  simpleDefinition: string;
  whyItMatters: string;
  glasgowContext?: string;
}

export const DICTIONARY_ENTRIES: Record<string, DictionaryEntry> = {
  overdraft: {
    term: '0% Interest Overdraft',
    simpleDefinition: 'A bank buffer that lets you spend below £0 in your current account without paying interest charges.',
    whyItMatters: 'Unlike credit cards or payday loans, approved student overdrafts charge 0% interest while you study, giving you an essential safety net for rent delays.',
    glasgowContext: 'Major banks near UofG (Byres Rd) like Santander, NatWest, and Bank of Scotland offer between £1,500 and £2,000 0% overdraft limits in Year 1.',
  },
  annual_value: {
    term: 'Annual Incentive Value',
    simpleDefinition: 'The estimated cash value of perks, freebies, and discounts given when opening an account.',
    whyItMatters: 'A headline perk like a free 4-Year 16-25 Railcard is worth £100+ cash and saves 1/3 on every train trip in Scotland and the UK.',
    glasgowContext: 'Taking the train between Glasgow Queen Street and Edinburgh or traveling home can save £150+ every term with a Railcard.',
  },
  student_specialist: {
    term: 'Student Bank Specialist',
    simpleDefinition: 'A dedicated bank advisor trained specifically in UK and international student financial onboarding.',
    whyItMatters: 'They understand student visa biometric permits (BRP), University Certificate of Student Status letters, and help students activate overdrafts without triggering credit score rejections.',
    glasgowContext: 'Branch locations on Byres Road and Sauchiehall Street have designated Student Specialists during September and January enrollment windows.',
  },
  ihs_surcharge: {
    term: 'Immigration Health Surcharge (IHS)',
    simpleDefinition: 'A mandatory upfront fee paid to the UK Home Office as part of your Student Visa application.',
    whyItMatters: 'It currently costs £776 for each year of your visa (£3,104 for a 4-year undergraduate course) and must be paid in full before your visa interview.',
    glasgowContext: 'Once paid, you receive free access to NHS Scotland GP doctors, hospital A&E, and free prescription medicines just like a Scottish resident.',
  },
  optical_voucher: {
    term: 'NHS Optical Voucher',
    simpleDefinition: 'An NHS certificate that pays towards or fully covers the cost of prescription glasses or contact lenses.',
    whyItMatters: 'Eye exams are free in Scotland for all students, but frames and lenses are not free unless you have an Optical Voucher.',
    glasgowContext: 'Students under 19 in full-time education receive vouchers automatically. Students aged 19+ can apply via an HC1 form (NHS Low Income Scheme).',
  },
  council_tax: {
    term: 'Council Tax Exemption',
    simpleDefinition: 'Full-time university students in Scotland and the UK are 100% legally exempt from paying local council tax.',
    whyItMatters: 'Council tax in Glasgow costs £1,200 to £2,400 per year for non-students. You must obtain an Exemption Letter from your UofG student portal.',
    glasgowContext: 'If living in private flats in West End or Partick with non-students, the property loses the 100% discount, leading to disputes.',
  },
  guarantor: {
    term: 'UK Rent Guarantor',
    simpleDefinition: 'A UK resident who legally agrees to pay your rent if you default.',
    whyItMatters: 'Many private Glasgow landlords require international students without a UK guarantor to pay 3 to 6 months of rent upfront.',
    glasgowContext: 'University of Glasgow university-owned accommodation never requires a UK guarantor.',
  },
  bills_included: {
    term: 'Bills Included (All-inclusive)',
    simpleDefinition: 'A rental contract where electricity, gas heating, water, and Wi-Fi are bundled into the advertised weekly price.',
    whyItMatters: 'Private lets often look £40/week cheaper on Rightmove, but unmetered winter gas bills can cost £35-£50/week extra per person in Scotland.',
    glasgowContext: 'All UofG student residences (Murano, Queen Margaret, Cairncross) include all heating, power, and high-speed Wi-Fi.',
  },
  money_left_over: {
    term: 'Money Left Over (Budget Margin)',
    simpleDefinition: 'The remaining amount of cash left each week or month after paying rent, utilities, and daily transit fares.',
    whyItMatters: 'This is your real disposable cash for groceries, textbooks, social life, and emergency buffer.',
    glasgowContext: 'A healthy Glasgow student budget targets at least £40–£60/week of money left over for groceries and leisure.',
  },
};

interface DictionaryTooltipProps {
  termKey: keyof typeof DICTIONARY_ENTRIES;
  children: React.ReactNode;
  className?: string;
}

export function DictionaryTooltip({ termKey, children, className = '' }: DictionaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entry = DICTIONARY_ENTRIES[termKey];

  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`inline-flex items-center gap-1 border-b border-dotted border-teal-600/60 font-medium text-inherit hover:text-teal-800 transition cursor-help ${className}`}
        aria-label={`Definition: ${entry.term}`}
      >
        <span>{children}</span>
        <HelpCircle className="w-3 h-3 text-teal-600 inline shrink-0 opacity-75 hover:opacity-100" />
      </button>

      {isOpen && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 text-left z-50 animate-fade-in pointer-events-none"
        >
          <span className="block text-xs font-bold text-teal-300 flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            {entry.term}
          </span>
          <span className="block text-xs text-slate-200 leading-relaxed mb-1.5 font-normal">
            {entry.simpleDefinition}
          </span>
          <span className="block text-[11px] text-slate-400 leading-snug bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
            <strong className="text-teal-400">Why it matters:</strong> {entry.whyItMatters}
          </span>
          {entry.glasgowContext && (
            <span className="block text-[10px] text-amber-300/90 mt-1.5 font-medium">
              📍 Glasgow Note: {entry.glasgowContext}
            </span>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
