'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MonthNetWorth } from '@/app/actions/transactions';
import { MonthAnalytics } from '@/app/actions/budgets';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Car,
  Home,
  Heart,
  Compass,
  Shield,
  Target,
  Info
} from 'lucide-react';

interface FinancialForecastProps {
  analyticsData: MonthAnalytics[];
  netWorthData: MonthNetWorth[];
}

type GoalType = 'VEHICLE' | 'HOUSE' | 'WEDDING' | 'TRAVEL' | 'EMERGENCY' | 'CUSTOM';

const GOAL_OPTIONS = [
  { value: 'VEHICLE', label: 'Mua xe', icon: Car, color: '#fb923c' },
  { value: 'HOUSE', label: 'Mua nhà', icon: Home, color: '#3b82f6' },
  { value: 'WEDDING', label: 'Đám cưới', icon: Heart, color: '#f43f5e' },
  { value: 'TRAVEL', label: 'Du lịch', icon: Compass, color: '#10b981' },
  { value: 'EMERGENCY', label: 'Quỹ dự phòng', icon: Shield, color: '#8b5cf6' },
  { value: 'CUSTOM', label: 'Mục tiêu khác', icon: Target, color: '#d4af37' }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function FinancialForecast({ analyticsData = [], netWorthData = [] }: FinancialForecastProps) {
  // 1. Tính toán số dư hiện tại & tốc độ tích lũy trung bình hàng tháng của 6 tháng qua
  const currentNetWorth = netWorthData.length > 0 ? netWorthData[netWorthData.length - 1].netWorth : 0;
  
  // Tính trung bình thu chi 6 tháng
  const totalIncome = analyticsData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = analyticsData.reduce((sum, d) => sum + d.expense, 0);
  const averageMonthlySavings = analyticsData.length > 0 ? (totalIncome - totalExpense) / analyticsData.length : 0;

  // 2. State cho trình giả lập mục tiêu tích lũy
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [goalType, setGoalType] = useState<GoalType>('EMERGENCY');
  const [additionalSavings, setAdditionalSavings] = useState<number>(0); // Tiết kiệm bổ sung hàng tháng (Slider)
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Tổng số dư tích lũy hàng tháng trong tương lai = trung bình thực tế + bổ sung
  const futureMonthlySavingsRate = averageMonthlySavings + additionalSavings;

  // 3. Xử lý định dạng input và tránh lỗi nhảy con trỏ chuột (Cursor Jump Fix)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const val = input.value;
    const cursor = input.selectionStart || 0;

    // Đếm số lượng chữ số trước vị trí con trỏ hiện tại
    const digitsBeforeCursor = val.slice(0, cursor).replace(/\D/g, '').length;

    // Lấy chuỗi số thuần túy
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      setTargetAmount(0);
      setAmountInput('');
      return;
    }

    const num = Number(clean);
    const formatted = new Intl.NumberFormat('vi-VN').format(num);

    setTargetAmount(num);
    setAmountInput(formatted);

    // Điều chỉnh lại vị trí con trỏ chuột ở tick render tiếp theo
    setTimeout(() => {
      let newCursor = 0;
      let digitsSeen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (digitsSeen === digitsBeforeCursor) {
          newCursor = i;
          break;
        }
        if (/\d/.test(formatted[i])) {
          digitsSeen++;
        }
      }
      
      // Nếu đã duyệt hết và khớp hoặc nằm ngoài biên
      if (digitsSeen === digitsBeforeCursor && newCursor === 0) {
        newCursor = formatted.length;
      }
      if (newCursor === 0 && digitsSeen < digitsBeforeCursor) {
        newCursor = formatted.length;
      }

      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // 4. Xây dựng dataset cho Recharts không bị hở mạch tại điểm Junction
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (netWorthData.length === 0) return;

    const dataList: any[] = [];
    
    // A. Thêm các tháng quá khứ (T-5 đến T-1)
    for (let i = 0; i < netWorthData.length - 1; i++) {
      dataList.push({
        name: netWorthData[i].name,
        history: netWorthData[i].netWorth,
        forecast: null
      });
    }

    // B. Điểm hiện tại (Junction Point): Cả history và forecast BẮT BUỘC phải chung giá trị để kết nối liền mạch
    const lastLabel = netWorthData[netWorthData.length - 1].name;
    dataList.push({
      name: `${lastLabel} (Nay)`,
      history: currentNetWorth,
      forecast: currentNetWorth
    });

    // C. Tính toán các tháng tương lai (T+1 đến T+5)
    const match = lastLabel.match(/T(\d+)/);
    const lastMonthNum = match ? parseInt(match[1]) : 6;

    let runningWorth = currentNetWorth;
    for (let i = 1; i <= 5; i++) {
      const futureMonthNum = ((lastMonthNum + i - 1) % 12) + 1;
      runningWorth += futureMonthlySavingsRate;
      dataList.push({
        name: `T${futureMonthNum} (Dự báo)`,
        history: null,
        forecast: Math.max(0, runningWorth) // Ngăn tài sản ròng âm quá mức hiển thị
      });
    }

    setChartData(dataList);
  }, [netWorthData, currentNetWorth, futureMonthlySavingsRate]);

  // 5. Tính toán tiến trình đạt mục tiêu
  const isSavingsDeficit = futureMonthlySavingsRate <= 0;
  
  // Tính số tháng cần thiết
  const monthsNeeded = !isSavingsDeficit && targetAmount > 0 
    ? Math.ceil(targetAmount / futureMonthlySavingsRate) 
    : null;

  // Lấy ngày hoàn thành dự kiến
  const getExpectedCompletionDate = () => {
    if (monthsNeeded === null) return '';
    const d = new Date();
    d.setMonth(d.getMonth() + monthsNeeded);
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const expectedDateLabel = getExpectedCompletionDate();
  const SelectedIcon = GOAL_OPTIONS.find((g) => g.value === goalType)?.icon || Target;
  const goalColor = GOAL_OPTIONS.find((g) => g.value === goalType)?.color || '#d4af37';

  // Custom Tooltip cho biểu đồ dự báo
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const historyVal = payload.find((p: any) => p.name === 'history' || p.dataKey === 'history')?.value;
      const forecastVal = payload.find((p: any) => p.name === 'forecast' || p.dataKey === 'forecast')?.value;
      
      const displayVal = historyVal !== undefined && historyVal !== null ? historyVal : forecastVal;
      const isForecast = historyVal === undefined || historyVal === null || label.includes('Dự báo');

      return (
        <div className="glass-panel p-3 rounded-xl border border-brand-border text-xs space-y-1.5 shadow-xl bg-[#0c0d12]/95">
          <p className="font-bold text-white mb-0.5">{label}</p>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${isForecast ? 'bg-brand-gold' : 'bg-blue-500'}`} />
            <span className="text-brand-text-soft">Tài sản ròng:</span>
            <span className={`font-bold ${isForecast ? 'text-brand-gold' : 'text-blue-400'}`}>
              {formatCurrency(displayVal)}
            </span>
          </div>
          {isForecast && (
            <p className="text-[10px] text-brand-gold/75 font-semibold">Dự kiến dựa theo dòng tiền hiện tại</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Biển chỉ báo tốc độ tích lũy thực tế */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 bg-gradient-to-br from-brand-gold/5 to-transparent lg:col-span-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider">
              Tích lũy thực tế (Trung bình)
            </span>
            <p className={`text-2xl font-black mt-2 ${averageMonthlySavings >= 0 ? 'text-neon-emerald' : 'text-neon-rose'}`}>
              {averageMonthlySavings >= 0 ? '+' : ''}{formatCurrency(averageMonthlySavings)}
              <span className="text-xs font-semibold block text-brand-text-soft mt-1">mỗi tháng</span>
            </p>
          </div>
          <div className="text-[10px] text-brand-text-soft mt-4 flex items-start gap-1.5 bg-[#12141c]/50 p-2.5 rounded-xl border border-brand-border">
            <Info className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
            <span>
              Tính toán dựa trên thu và chi thực tế phát sinh trong 6 tháng qua của tài khoản.
            </span>
          </div>
        </div>

        {/* Biểu đồ dự báo tài sản ròng 12 tháng */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-brand-border/40 pb-4">
            <TrendingUp className="w-5 h-5 text-brand-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dự báo tài sản ròng 6 tháng tới</h2>
          </div>

          <div className="w-full h-[220px] text-[10px] font-bold mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Gradient Lịch sử (Blue) */}
                  <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                  {/* Gradient Dự báo (Gold) */}
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#858e9c', fontSize: 10 }} />
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

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />

                {/* Đường lịch sử (Solid Blue) */}
                <Area
                  type="monotone"
                  dataKey="history"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHistory)"
                  connectNulls={false}
                  dot={{ fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2, r: 3.5 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#60a5fa' }}
                />

                {/* Đường dự báo (Dashed Gold) */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#d4af37"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                  connectNulls={true}
                  dot={{ fill: '#ffffff', stroke: '#d4af37', strokeWidth: 2, r: 3.5 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#f6d365' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trình Giả lập Mục tiêu Tích lũy */}
      <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-brand-border/40 pb-4">
          <Target className="w-5 h-5 text-brand-gold animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trình giả lập mục tiêu tích lũy</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cấu hình mục tiêu */}
          <div className="space-y-4">
            {/* Hàng nhập số tiền */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider block">Số tiền mục tiêu (VND)</label>
              <div className="relative">
                <span className="text-brand-text-soft absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold">đ</span>
                <input
                  type="text"
                  ref={amountInputRef}
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="Nhập số tiền tích lũy..."
                  className="w-full bg-[#12141c]/60 border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm font-extrabold rounded-xl pl-8 pr-4 py-3 outline-none transition"
                />
              </div>
            </div>

            {/* Loại mục tiêu */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider block">Phân loại mục tiêu</label>
              <div className="grid grid-cols-3 gap-2">
                {GOAL_OPTIONS.map((g) => {
                  const Icon = g.icon;
                  const isSelected = goalType === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGoalType(g.value as GoalType)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer gap-1.5 ${
                        isSelected
                          ? 'bg-[#1b1e28] text-white border-brand-gold/45 shadow-md shadow-brand-gold/5'
                          : 'bg-brand-border/20 border-brand-border/10 text-brand-text-soft hover:text-white hover:bg-brand-border/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" style={{ color: isSelected ? g.color : undefined }} />
                      <span className="text-[10px] font-bold whitespace-nowrap">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Tích lũy bổ sung */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider">
                  Tích lũy bổ sung hàng tháng
                </label>
                <span className="text-xs font-bold text-brand-gold">
                  +{formatCurrency(additionalSavings)}/tháng
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50000000"
                step="500000"
                value={additionalSavings}
                onChange={(e) => setAdditionalSavings(Number(e.target.value))}
                className="w-full accent-brand-gold bg-[#12141c] rounded-lg h-2 cursor-pointer appearance-none"
              />
              <div className="flex justify-between text-[9px] text-brand-text-soft">
                <span>0đ</span>
                <span>25M</span>
                <span>50M</span>
              </div>
            </div>
          </div>

          {/* Kết quả tính toán & Tiến trình */}
          <div className="flex flex-col justify-between bg-[#12141c]/40 border border-brand-border/40 p-5 rounded-2xl relative overflow-hidden">
            {/* Biển báo Fail-safe khi dòng tiền âm */}
            {isSavingsDeficit ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-6">
                <div className="w-12 h-12 rounded-full bg-neon-rose/10 flex items-center justify-center border border-neon-rose/20 text-neon-rose animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-white">Chưa thể bắt đầu tích lũy</p>
                  <p className="text-xs text-neon-rose font-bold">
                    🔺 Dòng tiền hiện tại đang âm, vui lòng tăng mức tích lũy bổ sung
                  </p>
                </div>
                <p className="text-[10px] text-brand-text-soft max-w-xs leading-normal">
                  Hiện tại dòng tiền chi tiêu của bạn đang lớn hơn thu nhập. Vui lòng kéo thanh slider để tăng mức tiết kiệm bổ sung (ít nhất lớn hơn {(Math.abs(averageMonthlySavings) / 1000000).toFixed(1)}Mđ/tháng) hoặc cắt giảm các khoản chi tiêu để kích hoạt trình mô phỏng.
                </p>
              </div>
            ) : targetAmount <= 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-6">
                <div className="w-12 h-12 rounded-full bg-[#1b1e28] flex items-center justify-center border border-brand-border text-brand-text-soft">
                  <SelectedIcon className="w-6 h-6" style={{ color: goalColor }} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Chưa nhập mục tiêu</p>
                  <p className="text-xs text-brand-text-soft">
                    Hãy nhập số tiền và chọn loại mục tiêu để bắt đầu giả lập.
                  </p>
                </div>
              </div>
            ) : (
              // Trạng thái tích lũy hoạt động bình thường
              <div className="flex-1 flex flex-col justify-between space-y-6">
                {/* Goal details */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{ borderColor: `${goalColor}30`, backgroundColor: `${goalColor}10` }}
                  >
                    <SelectedIcon className="w-6 h-6" style={{ color: goalColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Mục tiêu: {GOAL_OPTIONS.find((g) => g.value === goalType)?.label}
                    </h3>
                    <p className="text-xs font-bold" style={{ color: goalColor }}>
                      {formatCurrency(targetAmount)}
                    </p>
                  </div>
                </div>

                {/* Simulation Summary info */}
                <div className="space-y-3.5 bg-[#12141c]/80 p-4 rounded-xl border border-brand-border">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-soft uppercase">Tốc độ dòng tiền tương lai</span>
                    <span className="text-xs font-extrabold text-neon-emerald">
                      {formatCurrency(futureMonthlySavingsRate)}/tháng
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-brand-border/40 pt-2.5">
                    <span className="text-[10px] font-bold text-brand-text-soft uppercase">Số tháng hoàn thành</span>
                    <span className="text-xs font-black text-white">{monthsNeeded} tháng</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-brand-border/40 pt-2.5">
                    <span className="text-[10px] font-bold text-brand-text-soft uppercase">Ngày hoàn thành dự kiến</span>
                    <span className="text-sm font-black text-brand-gold">{expectedDateLabel}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-brand-text-soft">
                    <span>Số dư hiện hữu: {formatCurrency(currentNetWorth)}</span>
                    <span className="text-brand-gold">
                      {currentNetWorth >= targetAmount ? '100%' : `${Math.round((currentNetWorth / targetAmount) * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-[#12141c] rounded-full h-3 border border-brand-border overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (currentNetWorth / targetAmount) * 100))}%`,
                        backgroundColor: goalColor,
                        boxShadow: `0 0 8px ${goalColor}80`
                      }}
                    />
                  </div>
                </div>

                {/* Successful Simulation Message */}
                <div className="flex gap-2 text-[10px] text-neon-emerald bg-neon-emerald/5 border border-neon-emerald/15 p-3 rounded-xl items-center mt-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Dựa vào dòng tiền, bạn sẽ hoàn tất mục tiêu này vào **{expectedDateLabel}**.
                    {additionalSavings > 0 && ' Slider tăng thêm đã rút ngắn lộ trình tích lũy của bạn!'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
