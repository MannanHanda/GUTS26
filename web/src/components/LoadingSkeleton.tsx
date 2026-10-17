import React from 'react';

export function SkeletonMetric() {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse">
      <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
      <div className="h-8 w-28 bg-slate-200 rounded mb-2" />
      <div className="h-2.5 w-36 bg-slate-100 rounded mt-3" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200 rounded" />
      <div className="h-3 w-1/2 bg-slate-100 rounded" />
      <div className="p-3 rounded-xl bg-slate-50 space-y-2">
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="h-3 w-4/5 bg-slate-200 rounded" />
      </div>
      <div className="h-9 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>
      <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

interface CalculatingBadgeProps {
  label?: string;
}

export function CalculatingBadge({ label = 'Optimizing living costs across Glasgow...' }: CalculatingBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-sm animate-fade-in">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
      </span>
      <span>{label}</span>
    </div>
  );
}
