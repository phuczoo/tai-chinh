'use client';

import React, { useState } from 'react';
import { MonthAnalytics } from '@/app/actions/budgets';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart3, Calendar, ChevronDown } from 'lucide-react';

interface AnalyticsChartProps {
  data: MonthAnalytics[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-brand-border text-xs space-y-1 shadow-xl bg-[#161924]/95">
        <p className="font-bold text-white mb-1.5">{`Tháng ${label.replace('T', '')}`}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block" 
              style={{ backgroundColor: p.fill?.includes('colorIncome') ? '#10b981' : '#e5c158' }}
            />
            <span className="text-brand-text-soft">{p.name}:</span>
            <span className="font-bold text-white">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [filter, setFilter] = useState<string>('6M');

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-white">Phân tích thu chi</h2>
        </div>

        {/* Filter and Date Display */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-brand-text-soft bg-brand-border/20 px-3 py-1.5 rounded-xl border border-brand-border/40">
            <Calendar className="w-3.5 h-3.5" />
            <span>6 Tháng gần nhất</span>
          </div>
          
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-[#12141c] border border-brand-border text-xs text-white rounded-xl pl-3 pr-8 py-1.5 outline-none transition cursor-pointer"
            >
              <option value="6M">Biến động tháng</option>
              <option value="1W" disabled>Thống kê tuần</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-brand-text-soft absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-[300px] text-xs font-medium">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.65}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e5c158" stopOpacity={0.65}/>
                <stop offset="95%" stopColor="#e5c158" stopOpacity={0.02}/>
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid 
              stroke="#2e3347" 
              strokeDasharray="3 3" 
              vertical={false} 
              opacity={0.4}
            />

            {/* Axes */}
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8a94a6', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8a94a6', fontSize: 10 }}
              tickFormatter={(v) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return v;
              }}
            />

            {/* Tooltip & Legend */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-brand-text-soft text-xs">{value}</span>}
            />

            {/* Bars */}
            <Bar 
              dataKey="income" 
              name="Thu nhập" 
              fill="url(#colorIncome)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="expense" 
              name="Chi tiêu" 
              fill="url(#colorExpense)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
