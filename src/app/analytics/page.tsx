import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsChart from '@/components/AnalyticsChart';
import { getAnalyticsData, getWeeklyAnalyticsData } from '@/app/actions/budgets';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Suspense } from 'react';
import { TrendingUp, TrendingDown, Landmark, Sparkles, AlertTriangle } from 'lucide-react';

import { checkAuth } from '@/lib/auth-check';

export const metadata = {
  title: 'Thống kê tài chính | Antigravity Finance',
  description: 'Thống kê thu nhập và chi tiêu của bạn trong 6 tháng gần nhất.',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await checkAuth(); // Kiểm tra bảo mật
  
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Thống kê tài chính</h1>
          <p className="text-brand-text-soft text-sm mt-1">
            Theo dõi xu hướng thu nhập và chi tiêu ròng của bạn theo thời gian.
          </p>
        </div>
        
        <Suspense fallback={<LoadingSpinner message="Đang phân tích dữ liệu 6 tháng qua..." />}>
          <AnalyticsContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

async function AnalyticsContent() {
  const [analyticsData, weeklyAnalyticsData] = await Promise.all([
    getAnalyticsData(),
    getWeeklyAnalyticsData()
  ]);

  // Tính tổng thu, tổng chi và tiết kiệm ròng của 6 tháng qua
  const totalIncome = analyticsData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = analyticsData.reduce((sum, d) => sum + d.expense, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Income */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 relative overflow-hidden bg-gradient-to-br from-neon-emerald/5 to-transparent">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider">
              Tổng Thu nhập (6T)
            </span>
            <div className="p-2 rounded-xl bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-4">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] text-brand-text-soft mt-1">Tổng tích lũy 6 tháng qua</p>
        </div>

        {/* Card 2: Total Expense */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 relative overflow-hidden bg-gradient-to-br from-brand-gold/5 to-transparent">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider">
              Tổng Chi tiêu (6T)
            </span>
            <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-4">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] text-brand-text-soft mt-1">Tổng tiêu dùng 6 tháng qua</p>
        </div>

        {/* Card 3: Net Savings */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider">
              Tiết kiệm ròng (Tỷ lệ)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-4">
            {formatCurrency(netSavings)}
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full ml-2 border border-blue-500/20">
              {savingsRate}%
            </span>
          </p>
          <p className="text-[10px] text-brand-text-soft mt-1">Số dư thặng dư khả dụng</p>
        </div>
      </div>

      {/* Larger Chart */}
      <div className="w-full">
        <AnalyticsChart data={analyticsData} weeklyData={weeklyAnalyticsData} />
      </div>

      {/* Motivational Tip */}
      {netSavings > 0 ? (
        <div className="p-4 rounded-2xl border border-neon-emerald/20 bg-neon-emerald/5 flex gap-3 text-neon-emerald text-xs items-center">
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            Tuyệt vời! Bạn đang duy trì tỷ lệ tiết kiệm ròng **{savingsRate}%**. Hãy tiếp tục tối ưu hóa các khoản chi tiêu không cố định để gia tăng tích lũy tài sản!
          </span>
        </div>
      ) : totalIncome > 0 ? (
        <div className="p-4 rounded-2xl border border-neon-rose/20 bg-neon-rose/5 flex gap-3 text-neon-rose text-xs items-center">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Cảnh báo: Dòng tiền ròng của bạn đang bị âm. Hãy xem lại phần hạn mức chi tiêu để cắt giảm các chi phí không cần thiết.
          </span>
        </div>
      ) : null}
    </div>
  );
}
