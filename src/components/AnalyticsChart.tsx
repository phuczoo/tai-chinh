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
  weeklyData?: MonthAnalytics[];
}

const CustomTooltip = ({ active, payload, label, filter }: any) => {
  if (active && payload && payload.length) {
    // Nếu là tuần thì label có dạng "T5 (18/06)" -> hiển thị nguyên bản
    // Nếu là tháng thì hiển thị "Tháng X"
    const title = filter === '1W' ? label : `Tháng ${label.replace('T', '')}`;
    
    return (
      <div className="glass-panel p-3 rounded-xl border border-brand-border text-xs space-y-1 shadow-xl bg-[#0c0d12]/95">
        <p className="font-bold text-white mb-1.5">{title}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ backgroundColor: p.fill?.includes('colorIncome') ? '#10b981' : '#d4af37' }}
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

export default function AnalyticsChart({ data, weeklyData = [] }: AnalyticsChartProps) {
  const [filter, setFilter] = useState<string>('1W');

  // Quyết định dùng dataset nào dựa trên bộ lọc
  const chartData = filter === '1W' && weeklyData.length > 0 ? weeklyData : data;

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-gold" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Phân tích thu chi</h2>
        </div>

        {/* Filter and Date Display */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-soft bg-brand-border/30 px-3 py-1.5 rounded-xl border border-brand-border/20">
            <Calendar className="w-3.5 h-3.5" />
            <span>{filter === '1W' ? '7 Ngày gần nhất' : '6 Tháng gần nhất'}</span>
          </div>
          
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-[#0c0d12]/60 border border-brand-border text-[10px] font-bold text-white rounded-xl pl-3 pr-8 py-1.5 outline-none transition cursor-pointer"
            >
              <option value="6M">Biến động tháng</option>
              <option value="1W">Biến động tuần</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-brand-text-soft absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-[280px] text-[10px] font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.01}/>
              </linearGradient>
            </defs>

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

            {/* Tooltip & Legend */}
            <Tooltip content={<CustomTooltip filter={filter} />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={6}
              formatter={(value) => <span className="text-brand-text-soft text-[10px] font-semibold">{value}</span>}
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
