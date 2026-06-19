'use client';

import React, { useState } from 'react';
import { Transaction } from '@/types';
import { deleteTransaction } from '@/app/actions/transactions';
import { ICON_MAP } from './CategoryManager';
import { 
  MoreHorizontal, 
  Trash2, 
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';

interface RecentTransactionsProps {
  initialTransactions: Transaction[];
  onTransactionDeleted?: () => void;
}

const formatVietnameseDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function RecentTransactions({ initialTransactions, onTransactionDeleted }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state if prop updates
  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này? Số dư tài khoản liên quan sẽ được tự động hoàn tác.')) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteTransaction(id);
      
      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa giao dịch.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
            <span className="w-1 h-1 rounded-full bg-[#10b981]" />
            Thành công
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fb923c]/10 text-[#fb923c] border border-[#fb923c]/20">
            <span className="w-1 h-1 rounded-full bg-[#fb923c] animate-pulse" />
            Đang chờ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20">
            <span className="w-1 h-1 rounded-full bg-[#f43f5e]" />
            Thất bại
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-brand-gold" />
          Giao dịch gần đây
        </h2>
        <span className="text-xs text-brand-text-soft font-semibold">
          Hiển thị {transactions.length} giao dịch mới nhất
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-brand-border rounded-xl">
          <p className="text-sm text-brand-text-soft">Chưa có giao dịch nào được nhập.</p>
          <p className="text-xs text-brand-text-soft/60 mt-1">Sử dụng nút nhập nhanh ở thanh điều hướng để ghi nhận chi tiêu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
            <thead>
              <tr className="border-b border-brand-border text-[11px] font-semibold text-brand-text-soft uppercase tracking-wider">
                <th className="pb-3 pl-2">Chi tiết</th>
                <th className="pb-3">Tài khoản</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3 text-right pr-4">Số tiền</th>
                <th className="pb-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {transactions.map((tx) => {
                const category = tx.category;
                const Icon = ICON_MAP[category?.icon || ''] || MoreHorizontal;
                const categoryColor = category?.color || '#9ca3af';
                const categoryName = category?.name || (tx.type === 'INCOME' ? 'Thu nhập' : 'Khác');
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';

                return (
                  <tr key={tx.id} className="group hover:bg-brand-card/45 transition duration-150">
                    {/* Column 1: Category Icon & Details */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center border bg-[#12141c]"
                          style={{ 
                            color: categoryColor,
                            borderColor: `${categoryColor}30`,
                            backgroundColor: `${categoryColor}08`
                          }}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {categoryName}
                          </p>
                          <p className="text-[11px] text-brand-text-soft/80 mt-0.5 truncate max-w-[200px]">
                            {tx.description || (isTransfer ? `Chuyển sang ${tx.to_account?.name || 'Tài khoản khác'}` : 'Không có ghi chú')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Account Source/Dest */}
                    <td className="py-4 text-xs font-semibold text-white">
                      {isTransfer ? (
                        <div className="flex items-center gap-1.5 text-brand-text-soft">
                          <span className="text-white">{tx.account?.name}</span>
                          <span>➔</span>
                          <span className="text-brand-gold">{tx.to_account?.name}</span>
                        </div>
                      ) : (
                        <span>{tx.account?.name}</span>
                      )}
                      <p className="text-[10px] text-brand-text-soft mt-0.5">
                        {formatVietnameseDateTime(tx.created_at)}
                      </p>
                    </td>

                    {/* Column 3: Status Badge */}
                    <td className="py-4">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Column 4: Amount */}
                    <td className="py-4 text-right pr-4">
                      <span className={`text-sm font-black ${
                        isIncome 
                          ? 'text-neon-emerald' 
                          : isTransfer
                          ? 'text-[#60a5fa]'
                          : 'text-[#f43f5e]'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '⇌ ' : '-'}
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(tx.amount))}
                      </span>
                      <p className="text-[9px] text-brand-text-soft font-semibold uppercase tracking-wider mt-0.5">
                        {isIncome ? 'Thu nhập' : isTransfer ? 'Chuyển khoản' : 'Chi tiêu'}
                      </p>
                    </td>

                    {/* Column 5: Actions */}
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-2 rounded-lg border border-transparent hover:border-neon-rose/30 hover:bg-neon-rose/10 text-brand-text-soft hover:text-neon-rose transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        {deletingId === tx.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neon-rose" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
