'use client';

import React from 'react';
import { CategoryBreakdown } from '@/app/actions/transactions';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { ICON_MAP } from './CategoryManager';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, MoreHorizontal } from 'lucide-react';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

export default function CategoryBreakdownChart({ data = [] }: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Map dữ liệu để đồng bộ màu sắc và nhãn hiển thị theo CATEGORY_COLORS và CATEGORY_LABELS
  const mappedData = data.map(item => {
    const name = item.categoryName;
    const color = CATEGORY_COLORS[name] || item.color || '#9ca3af';
    const label = CATEGORY_LABELS[name] || name;
    return {
      ...item,
      color,
      categoryName: label,
      percentage: total > 0 ? (item.amount / total) * 100 : 0
    };
  });

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-brand-border/40 pb-4">
        <PieIcon className="w-5 h-5 text-brand-gold" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cơ cấu chi tiêu</h2>
      </div>

      {total === 0 ? (
        <div className="py-20 text-center border border-dashed border-brand-border rounded-xl flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm text-brand-text-soft">Chưa phát sinh chi tiêu trong tháng này.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart Wrapper Container with min-h-[300px] */}
          <div className="relative min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mappedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="categoryName"
                >
                  {mappedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                  contentStyle={{ 
                    backgroundColor: '#0c0d12', 
                    borderColor: 'rgba(255, 255, 255, 0.06)', 
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontFamily: 'inherit'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total Expense Label in the center of the Donut */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] font-bold text-brand-text-soft uppercase tracking-wider">Tổng Chi</span>
              <span className="text-xs font-black text-white mt-0.5">
                -{new Intl.NumberFormat('vi-VN').format(total)}đ
              </span>
            </div>
          </div>

          {/* Categories List (Money Lover style) */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {mappedData.map((item, idx) => {
              const Icon = ICON_MAP[item.icon] || MoreHorizontal;
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-card/30 transition duration-150">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center border bg-[#12141c]"
                      style={{ 
                        color: item.color,
                        borderColor: `${item.color}30`,
                        backgroundColor: `${item.color}08`
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">{item.categoryName}</p>
                      <p className="text-[9px] text-brand-text-soft font-semibold mt-1">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-white">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
