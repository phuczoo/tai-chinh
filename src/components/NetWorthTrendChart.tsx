'use client';

import React from 'react';
import { MonthNetWorth } from '@/app/actions/transactions';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Landmark } from 'lucide-react';

interface NetWorthTrendChartProps {
  data: MonthNetWorth[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-brand-border text-xs space-y-1 shadow-xl bg-[#0c0d12]/95">
        <p className="font-bold text-white mb-1">Tháng {label.replace('T', '')}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block bg-blue-500" />
          <span className="text-brand-text-soft">Tài sản ròng:</span>
          <span className="font-bold text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function NetWorthTrendChart({ data = [] }: NetWorthTrendChartProps) {
  const currentNetWorth = data.length > 0 ? data[data.length - 1].netWorth : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-brand-gold" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Biến động tài sản ròng (Net Worth)</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold text-brand-text-soft uppercase tracking-wider block">Tài sản hiện tại</span>
          <span className="text-sm font-extrabold text-blue-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentNetWorth)}
          </span>
        </div>
      </div>

      {/* Chart Wrapper Container with min-h-[300px] */}
      <div className="w-full min-h-[300px] text-[10px] font-bold">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
          >
            {/* Grid */}
            <CartesianGrid 
              stroke="rgba(255, 255, 255, 0.04)" 
              strokeDasharray="3 3" 
              vertical={false} 
            />

            {/* Axes */}
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#858e9c', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#858e9c', fontSize: 10 }}
              tickFormatter={(v) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return v;
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />

            {/* Line with blue glow */}
            <Line 
              type="monotone" 
              dataKey="netWorth" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
