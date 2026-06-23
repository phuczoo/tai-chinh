'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Filter } from 'lucide-react';
import { useAnalyticsTransition } from './AnalyticsTransitionContext';

export default function AnalyticsFilterBar() {
  const searchParams = useSearchParams();
  const { isPending, updateFilter } = useAnalyticsTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  // Đọc bộ lọc hiện tại trên URL
  const range = searchParams.get('range') || 'THIS_MONTH';
  const customStart = searchParams.get('customStart') || '';
  const customEnd = searchParams.get('customEnd') || '';

  // Đồng bộ lại nút loading khi transition kết thúc
  useEffect(() => {
    if (!isPending) {
      setPendingValue(null);
    }
  }, [isPending]);

  const handleFilterClick = (value: string) => {
    setPendingValue(value);
    updateFilter(value);
  };

  const presets = [
    { value: '1W', label: '7 ngày qua' },
    { value: '30D', label: '30 ngày qua' },
    { value: 'THIS_MONTH', label: 'Tháng này' },
    { value: 'LAST_MONTH', label: 'Tháng trước' },
    { value: 'CUSTOM', label: 'Tùy chỉnh' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title with global indicator */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bộ lọc thời gian phân bổ</h3>
          {isPending && (
            <span className="w-4 h-4 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin ml-1.5" />
          )}
        </div>

        {/* Preset Selectors */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const isCurrentActive = range === p.value;
            const isCurrentPending = pendingValue === p.value;
            return (
              <button
                key={p.value}
                onClick={() => handleFilterClick(p.value)}
                disabled={isPending}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isCurrentActive
                    ? 'bg-brand-gold border-brand-gold text-brand-charcoal font-extrabold'
                    : 'bg-brand-border/30 border-brand-border/20 text-brand-text-soft hover:text-white hover:bg-brand-border/40'
                } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isCurrentPending && (
                  <span className={`w-3.5 h-3.5 border-2 rounded-full animate-spin shrink-0 ${
                    isCurrentActive 
                      ? 'border-brand-charcoal/20 border-t-brand-charcoal' 
                      : 'border-white/20 border-t-white'
                  }`} />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Picker Inputs */}
      {range === 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-brand-border/40 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider block">Từ ngày</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-brand-text-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={customStart}
                disabled={isPending}
                onChange={(e) => {
                  setPendingValue('CUSTOM');
                  updateFilter('CUSTOM', e.target.value, customEnd);
                }}
                className={`w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition ${
                  isPending ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider block">Đến ngày</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-brand-text-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={customEnd}
                disabled={isPending}
                onChange={(e) => {
                  setPendingValue('CUSTOM');
                  updateFilter('CUSTOM', customStart, e.target.value);
                }}
                className={`w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition ${
                  isPending ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
