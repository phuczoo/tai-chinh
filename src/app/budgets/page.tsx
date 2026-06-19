import DashboardLayout from '@/components/DashboardLayout';
import BudgetTracker from '@/components/BudgetTracker';
import CategoryManager from '@/components/CategoryManager';
import { getMonthlyBudgets } from '@/app/actions/budgets';
import { getCategories } from '@/app/actions/categories';
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
  const [budgets, categories] = await Promise.all([
    getMonthlyBudgets(currentMonthYear),
    getCategories()
  ]);
  
  return (
    <div className="w-full space-y-10">
      <BudgetTracker 
        initialBudgets={budgets}
        currentMonthYear={currentMonthYear}
      />
      
      <div className="border-t border-brand-border/40 pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Quản lý danh mục</h2>
          <p className="text-brand-text-soft text-sm mt-1">
            Thiết lập danh sách các danh mục chi tiêu cá nhân để phân loại dòng tiền.
          </p>
        </div>
        
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
