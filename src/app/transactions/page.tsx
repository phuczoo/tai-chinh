import DashboardLayout from '@/components/DashboardLayout';
import RecentTransactions from '@/components/RecentTransactions';
import { getRecentTransactions } from '@/app/actions/transactions';

export const metadata = {
  title: 'Lịch sử giao dịch | Antigravity Finance',
  description: 'Quản lý và xem lịch sử giao dịch thu chi của bạn.',
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  // Lấy danh sách giao dịch nhiều hơn (tối đa 100 giao dịch gần nhất)
  const transactions = await getRecentTransactions(100);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Lịch sử giao dịch</h1>
          <p className="text-brand-text-soft text-sm mt-1">
            Xem và quản lý tất cả các khoản thu, chi và chuyển khoản bạn đã ghi nhận.
          </p>
        </div>
        
        <RecentTransactions 
          initialTransactions={transactions}
        />
      </div>
    </DashboardLayout>
  );
}
