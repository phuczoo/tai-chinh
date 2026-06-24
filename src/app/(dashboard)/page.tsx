import DashboardOverview from '@/components/DashboardOverview';
import { getAccounts } from '@/app/actions/accounts';
import { getRecentTransactions } from '@/app/actions/transactions';
import { getMonthlyBudgets, getAnalyticsData, getWeeklyAnalyticsData, getDailyBudgetStatus } from '@/app/actions/budgets';
import { getCategories } from '@/app/actions/categories';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';

import { checkAuth } from '@/lib/auth-check';

export const metadata = {
  title: 'Dashboard | Antigravity Finance',
  description: 'Tổng quan tài sản và nguồn tiền cá nhân của bạn.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await checkAuth(); // Kiểm tra bảo mật
  
  return (
    <Suspense fallback={<LoadingSpinner message="Đang đồng bộ tổng quan tài chính..." />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  try {
    // 1. Tính toán tháng hiện tại theo định dạng YYYY-MM
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 2. Chạy đồng thời các truy vấn song song để tối ưu hóa hiệu năng
    const [accounts, recentTransactions, monthlyBudgets, analyticsData, weeklyAnalyticsData, categories, dailyBudgetStatus] = await Promise.all([
      getAccounts(),
      getRecentTransactions(8),
      getMonthlyBudgets(currentMonthYear),
      getAnalyticsData(),
      getWeeklyAnalyticsData(),
      getCategories(),
      getDailyBudgetStatus()
    ]);

    return (
      <DashboardOverview 
        initialAccounts={accounts} 
        initialTransactions={recentTransactions} 
        initialBudgets={monthlyBudgets}
        currentMonthYear={currentMonthYear}
        analyticsData={analyticsData}
        weeklyAnalyticsData={weeklyAnalyticsData}
        categories={categories}
        dailyBudgetStatus={dailyBudgetStatus}
      />
    );
  } catch (error) {
    console.error('Lỗi tải dữ liệu trang chủ:', error);
    
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="w-full max-w-md glass-panel border-neon-rose/30 p-6 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-neon-rose/10 flex items-center justify-center mx-auto text-neon-rose border border-neon-rose/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Lỗi tải dữ liệu</h1>
          <p className="text-brand-text-soft text-sm">
            {error instanceof Error ? error.message : 'Không thể kết nối đến cơ sở dữ liệu Supabase. Vui lòng kiểm tra lại cấu hình Vercel.'}
          </p>
          <div className="pt-2">
            <a
              href="/auth"
              className="inline-block bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-semibold text-sm rounded-xl px-5 py-2.5 transition"
            >
              Quay lại Đăng nhập
            </a>
          </div>
        </div>
      </div>
    );
  }
}
