import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-white/10 rounded-xl" />
        <div className="h-4 w-96 bg-brand-text-soft/20 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton (Matches AnalyticsFilterBar height and structure) */}
      <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 h-[82px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white/10 rounded-md" />
          <div className="h-4 w-40 bg-white/10 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-white/10 rounded-xl" />
          <div className="h-8 w-20 bg-white/10 rounded-xl" />
          <div className="h-8 w-20 bg-white/10 rounded-xl" />
          <div className="h-8 w-20 bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Info Row Skeleton (Matches active range message and export buttons) */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-brand-border/40 pb-4 h-[40px]">
        <div className="h-4 w-48 bg-brand-text-soft/10 rounded-md" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-white/5 rounded-xl" />
          <div className="h-9 w-24 bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* 3 Summary Cards Skeletons (Income, Expense, Net Savings) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-5 border border-brand-border/40 h-[138px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="h-4 w-28 bg-white/10 rounded-lg" />
              <div className="w-8 h-8 bg-white/5 rounded-xl" />
            </div>
            <div className="h-8 w-36 bg-white/20 rounded-xl mt-4" />
            <div className="h-3 w-28 bg-white/5 rounded-md mt-2" />
          </div>
        ))}
      </div>

      {/* Charts Side-by-Side Skeletons (AnalyticsChart & CategoryBreakdownChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Skeleton */}
        <div className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl p-6 border border-brand-border/40 h-[420px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-white/10 rounded-lg" />
            <div className="h-8 w-32 bg-white/5 rounded-xl" />
          </div>
          <div className="flex-1 flex items-end gap-3 px-2 py-4">
            {[...Array(12)].map((_, idx) => {
              const heights = ['h-24', 'h-32', 'h-48', 'h-28', 'h-40', 'h-56', 'h-36', 'h-44', 'h-64', 'h-52', 'h-30', 'h-40'];
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full">
                  <div className={`w-full ${heights[idx]} bg-white/5 rounded-t-lg`} />
                  <div className="h-3 w-6 bg-white/5 rounded-md" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown Skeleton */}
        <div className="lg:col-span-5 xl:col-span-4 glass-panel rounded-2xl p-6 border border-brand-border/40 h-[420px] flex flex-col justify-between">
          <div className="h-5 w-48 bg-white/10 rounded-lg" />
          <div className="flex-1 flex items-center justify-center py-6">
            {/* Donut skeleton */}
            <div className="w-40 h-40 rounded-full border-12 border-white/5 flex items-center justify-center">
              <div className="w-16 h-4 bg-white/10 rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex justify-between items-center h-8 bg-white/5 rounded-xl px-3">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-white/10 rounded-full" />
                  <div className="h-3.5 w-16 bg-white/10 rounded-md" />
                </div>
                <div className="h-3.5 w-12 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Net Worth Chart Skeleton */}
      <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 h-[380px] flex flex-col justify-between">
        <div className="h-5 w-40 bg-white/10 rounded-lg" />
        <div className="flex-1 flex items-end gap-6 px-4 py-6">
          {[...Array(6)].map((_, idx) => {
            const heights = ['h-20', 'h-28', 'h-44', 'h-36', 'h-52', 'h-60'];
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
                <div className={`w-full ${heights[idx]} bg-white/5 rounded-t-lg`} />
                <div className="h-3 w-8 bg-white/5 rounded-md" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
