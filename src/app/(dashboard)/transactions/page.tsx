import RecentTransactions from '@/components/RecentTransactions';
import { getRecentTransactions } from '@/app/actions/transactions';
import { getAccounts } from '@/app/actions/accounts';
import { getCategories } from '@/app/actions/categories';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Suspense } from 'react';

import { checkAuth } from '@/lib/auth-check';

export const metadata = {
  title: 'Lịch sử giao dịch | Antigravity Finance',
  description: 'Quản lý và xem lịch sử giao dịch thu chi của bạn.',
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  await checkAuth(); // Kiểm tra bảo mật
  
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Lịch sử giao dịch</h1>
        <p className="text-brand-text-soft text-sm mt-1">
          Xem và quản lý tất cả các khoản thu, chi và chuyển khoản bạn đã ghi nhận.
        </p>
      </div>
      
      <Suspense fallback={<LoadingSpinner message="Đang tải lịch sử giao dịch..." />}>
        <TransactionsContent />
      </Suspense>
    </div>
  );
}

async function TransactionsContent() {
  const [transactions, accounts, categories] = await Promise.all([
    getRecentTransactions(100),
    getAccounts(),
    getCategories()
  ]);
  
  return (
    <RecentTransactions 
      initialTransactions={transactions} 
      accounts={accounts}
      categories={categories}
    />
  );
}
