'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Filter } from 'lucide-react';

export default function AnalyticsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc bộ lọc hiện tại trên URL
  const range = searchParams.get('range') || 'THIS_MONTH';
  const customStart = searchParams.get('customStart') || '';
  const customEnd = searchParams.get('customEnd') || '';

  const updateFilter = (newRange: string, start?: string, end?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', newRange);
    
    if (newRange === 'CUSTOM') {
      if (start !== undefined) params.set('customStart', start);
      if (end !== undefined) params.set('customEnd', end);
    } else {
      params.delete('customStart');
      params.delete('customEnd');
    }

    // scroll: false giúp ngăn chặn tự động cuộn lên đầu trang, chống giật màn hình
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
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
        {/* Title */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bộ lọc thời gian phân bổ</h3>
        </div>

        {/* Preset Selectors */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => updateFilter(p.value)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                range === p.value
                  ? 'bg-brand-gold border-brand-gold text-brand-charcoal'
                  : 'bg-brand-border/30 border-brand-border/20 text-brand-text-soft hover:text-white hover:bg-brand-border/40'
              }`}
            >
              {p.label}
            </button>
          ))}
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
                onChange={(e) => updateFilter('CUSTOM', e.target.value, customEnd)}
                className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition"
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
                onChange={(e) => updateFilter('CUSTOM', customStart, e.target.value)}
                className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
