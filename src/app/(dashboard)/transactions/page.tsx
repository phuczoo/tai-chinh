import RecentTransactions from '@/components/RecentTransactions';
import TransactionHeader from '@/components/TransactionHeader';
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
  
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories()
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      <TransactionHeader accounts={accounts} categories={categories} />
      
      <Suspense fallback={<LoadingSpinner message="Đang tải lịch sử giao dịch..." />}>
        <TransactionsContent accounts={accounts} categories={categories} />
      </Suspense>
    </div>
  );
}

async function TransactionsContent({ accounts, categories }: { accounts: any[], categories: any[] }) {
  const transactions = await getRecentTransactions(100);
  
  return (
    <RecentTransactions 
      initialTransactions={transactions} 
      accounts={accounts}
      categories={categories}
    />
  );
}
