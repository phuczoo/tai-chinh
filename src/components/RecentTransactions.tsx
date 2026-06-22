'use client';

import React, { useState } from 'react';
import { Account, Category, Transaction } from '@/types';
import { deleteTransaction } from '@/app/actions/transactions';
import { ICON_MAP } from './CategoryManager';
import QuickActionModal from './QuickActionModal';
import { useRouter } from 'next/navigation';
import { 
  MoreHorizontal, 
  Trash2, 
  Loader2,
  ArrowLeftRight,
  Edit2
} from 'lucide-react';

interface RecentTransactionsProps {
  initialTransactions: Transaction[];
  searchTerm?: string;
  onTransactionDeleted?: () => void;
  onTransactionUpdated?: () => void;
  accounts?: Account[];
  categories?: Category[];
}

const getLocalDateKey = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
};

const getGroupDateLabel = (dateKey: string) => {
  const parts = dateKey.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);

  // Get today and yesterday in local timezone
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDate = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const formattedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

  if (isSameDate(dateObj, today)) {
    return `Hôm nay, ${formattedDate}`;
  }
  if (isSameDate(dateObj, yesterday)) {
    return `Hôm qua, ${formattedDate}`;
  }

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[dateObj.getDay()];
  return `${dayName}, ${formattedDate}`;
};

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

export default function RecentTransactions({ 
  initialTransactions, 
  searchTerm = '', 
  onTransactionDeleted,
  onTransactionUpdated,
  accounts = [],
  categories = []
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const router = useRouter();

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

  // Client-side live search filtering
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    
    const descriptionMatch = tx.description?.toLowerCase().includes(query) ?? false;
    const categoryMatch = tx.category?.name?.toLowerCase().includes(query) ?? false;
    const accountMatch = tx.account?.name?.toLowerCase().includes(query) ?? false;
    const typeMatch = (tx.type === 'INCOME' ? 'thu nhập' : tx.type === 'EXPENSE' ? 'chi tiêu' : 'chuyển khoản').includes(query);
    
    return descriptionMatch || categoryMatch || accountMatch || typeMatch;
  });

  // Calculate comparison metric today vs yesterday (based on full transactions list)
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const yesterdayObj = new Date();
  yesterdayObj.setDate(todayObj.getDate() - 1);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

  const todayExpense = transactions
    .filter(tx => getLocalDateKey(tx.created_at) === todayStr && tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const yesterdayExpense = transactions
    .filter(tx => getLocalDateKey(tx.created_at) === yesterdayStr && tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const hasYesterdayExpenseData = transactions.some(
    tx => getLocalDateKey(tx.created_at) === yesterdayStr && tx.type === 'EXPENSE'
  );

  let comparisonText = '• Chi tiêu bằng hôm qua';
  let comparisonColorClass = 'text-brand-text-soft';
  let comparisonBgClass = 'bg-brand-border/30 border-brand-border/20';

  if (!hasYesterdayExpenseData) {
    comparisonText = '📉 Hôm qua không phát sinh chi tiêu';
    comparisonColorClass = 'text-brand-text-soft';
    comparisonBgClass = 'bg-brand-border/20 border-brand-border/10';
  } else {
    const delta = todayExpense - yesterdayExpense;
    if (delta < 0) {
      comparisonText = `Tiêu ít hơn hôm qua ${new Intl.NumberFormat('vi-VN').format(Math.abs(delta))} đ`;
      comparisonColorClass = 'text-neon-emerald';
      comparisonBgClass = 'bg-neon-emerald/10 border-neon-emerald/20';
    } else if (delta > 0) {
      comparisonText = `Tiêu nhiều hơn hôm qua ${new Intl.NumberFormat('vi-VN').format(delta)} đ`;
      comparisonColorClass = 'text-[#fb923c]';
      comparisonBgClass = 'bg-[#fb923c]/10 border-[#fb923c]/20';
    }
  }

  // Group filtered transactions by local date
  const groupedGroups = filteredTransactions.reduce((acc, tx) => {
    const dateKey = getLocalDateKey(tx.created_at);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        dateKey,
        items: [],
        totalExpense: 0,
        totalIncome: 0
      };
    }
    acc[dateKey].items.push(tx);
    const amount = Number(tx.amount);
    if (tx.type === 'EXPENSE') {
      acc[dateKey].totalExpense += amount;
    } else if (tx.type === 'INCOME') {
      acc[dateKey].totalIncome += amount;
    }
    return acc;
  }, {} as Record<string, { dateKey: string; items: Transaction[]; totalExpense: number; totalIncome: number }>);

  // Sort groups descending
  const sortedGroupedTransactions = Object.values(groupedGroups).sort((a, b) => {
    return b.dateKey.localeCompare(a.dateKey);
  });

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-brand-gold" />
          Giao dịch gần đây
        </h2>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border transition ${comparisonBgClass} ${comparisonColorClass}`}>
            {comparisonText}
          </span>
          <span className="text-xs text-brand-text-soft font-semibold">
            {searchTerm ? `Tìm thấy ${filteredTransactions.length} kết quả` : `Hiển thị ${filteredTransactions.length} giao dịch mới nhất`}
          </span>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-brand-border rounded-xl">
          <p className="text-sm text-brand-text-soft">Chưa tìm thấy giao dịch nào phù hợp.</p>
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
            <tbody>
              {sortedGroupedTransactions.map((group) => {
                const dateLabel = getGroupDateLabel(group.dateKey);
                const dayExpense = group.totalExpense;
                const dayIncome = group.totalIncome;

                return (
                  <React.Fragment key={group.dateKey}>
                    {/* Sub-header row */}
                    <tr className="no-hover select-none">
                      <td colSpan={5} className="pt-6 pb-2 pl-0 pr-0">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#171923]/60 border border-brand-border/40 rounded-xl">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                            {dateLabel}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {dayIncome > 0 && (
                              <span className="text-neon-emerald">
                                Tổng thu: +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dayIncome)}
                              </span>
                            )}
                            {dayIncome > 0 && dayExpense > 0 && (
                              <span className="text-brand-border/50">|</span>
                            )}
                            {dayExpense > 0 ? (
                              <span className="text-[#f43f5e]">
                                Tổng chi: -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dayExpense)}
                              </span>
                            ) : (
                              <span className="text-brand-text-soft/60">
                                Tổng chi: 0 đ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Transaction rows for this date */}
                    {group.items.map((tx) => {
                      const category = tx.category;
                      const Icon = ICON_MAP[category?.icon || ''] || MoreHorizontal;
                      const categoryColor = category?.color || '#9ca3af';
                      const categoryName = category?.name || (tx.type === 'INCOME' ? 'Thu nhập' : 'Khác');
                      const isIncome = tx.type === 'INCOME';
                      const isTransfer = tx.type === 'TRANSFER';

                      return (
                        <tr 
                          key={tx.id} 
                          className="group hover:bg-brand-card/45 transition duration-150 border-b border-brand-border/20 last:border-b-0"
                        >
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
                            <div className="flex justify-end gap-1.5 items-center">
                              {accounts.length > 0 && categories.length > 0 && (
                                <button
                                  onClick={() => setEditingTransaction(tx)}
                                  className="p-2 rounded-lg border border-transparent hover:border-brand-gold/30 hover:bg-brand-gold/10 text-brand-text-soft hover:text-brand-gold transition cursor-pointer inline-flex items-center justify-center"
                                  title="Sửa giao dịch"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingTransaction && accounts.length > 0 && categories.length > 0 && (
        <QuickActionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          accounts={accounts}
          categories={categories}
          editingTransaction={editingTransaction}
          onSuccess={() => {
            router.refresh();
            if (onTransactionUpdated) {
              onTransactionUpdated();
            }
          }}
        />
      )}
    </div>
  );
}
