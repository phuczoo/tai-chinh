import DashboardLayout from '@/components/DashboardLayout';
import BudgetTracker from '@/components/BudgetTracker';
import { getMonthlyBudgets } from '@/app/actions/budgets';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Suspense } from 'react';

import { checkAuth } from '@/lib/auth-check';

export const metadata = {
  title: 'Hạn mức ngân sách | Antigravity Finance',
  description: 'Quản lý hạn mức chi tiêu hàng tháng theo từng danh mục.',
};

export const dynamic = 'force-dynamic';

export default async function BudgetsPage() {
  await checkAuth(); // Kiểm tra bảo mật
  
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Quản lý ngân sách</h1>
          <p className="text-brand-text-soft text-sm mt-1">
            Đặt hạn mức chi tiêu cho từng danh mục để kiểm soát tài chính tốt hơn.
          </p>
        </div>
        
        <Suspense fallback={<LoadingSpinner message="Đang tải dữ liệu ngân sách..." />}>
          <BudgetsContent currentMonthYear={currentMonthYear} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

async function BudgetsContent({ currentMonthYear }: { currentMonthYear: string }) {
  const budgets = await getMonthlyBudgets(currentMonthYear);
  
  return (
    <div className="w-full">
      <BudgetTracker 
        initialBudgets={budgets}
        currentMonthYear={currentMonthYear}
      />
    </div>
  );
}
