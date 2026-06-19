'use client';

import React, { useState, useEffect } from 'react';
import { Budget } from '@/types';
import { updateBudgetLimit } from '@/app/actions/budgets';
import { ICON_MAP } from './CategoryManager';
import { useRouter } from 'next/navigation';
import { 
  PiggyBank, 
  Settings, 
  X, 
  Check, 
  Loader2, 
  TrendingUp, 
  AlertTriangle,
  Flame,
  Percent,
  MoreHorizontal
} from 'lucide-react';

interface BudgetTrackerProps {
  initialBudgets: Budget[];
  currentMonthYear: string; // Định dạng "YYYY-MM"
  onBudgetUpdated?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function BudgetTracker({ initialBudgets, currentMonthYear, onBudgetUpdated }: BudgetTrackerProps) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newLimit, setNewLimit] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  // Tính toán ngân sách tổng quát (loại trừ các danh mục chưa cài hạn mức > 0)
  const activeBudgets = budgets.filter(b => Number(b.amount_limit) > 0);
  const totalLimit = activeBudgets.reduce((sum, b) => sum + Number(b.amount_limit), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.amount_spent), 0);
  
  let overallPercentage = 0;
  let remainingText = 'Chưa đặt hạn mức';
  let overallColorClass = 'text-brand-text-soft';
  let statusEmoji = <PiggyBank className="w-5 h-5 text-brand-gold" />;

  if (totalLimit > 0) {
    overallPercentage = Math.round(((totalLimit - totalSpent) / totalLimit) * 100);
    
    if (overallPercentage >= 30) {
      remainingText = `${overallPercentage}% Còn lại (Ổn định)`;
      overallColorClass = 'text-neon-emerald';
      statusEmoji = <TrendingUp className="w-5 h-5 text-neon-emerald" />;
    } else if (overallPercentage > 0) {
      remainingText = `${overallPercentage}% Còn lại (Cảnh báo)`;
      overallColorClass = 'text-neon-amber';
      statusEmoji = <AlertTriangle className="w-5 h-5 text-neon-amber" />;
    } else {
      const overspentPercent = Math.abs(overallPercentage);
      remainingText = `Vượt ${overspentPercent}% Hạn mức`;
      overallColorClass = 'text-neon-rose';
      statusEmoji = <Flame className="w-5 h-5 text-neon-rose animate-pulse" />;
    }
  }

  const getProgressColor = (spent: number, limit: number) => {
    if (limit === 0) return 'bg-brand-border';
    const ratio = spent / limit;
    if (ratio > 1.0) return 'bg-neon-rose shadow-[0_0_10px_rgba(244,63,94,0.4)]'; // Neon Rose glow
    if (ratio >= 0.7) return 'bg-neon-amber';
    return 'bg-neon-emerald';
  };

  const handleOpenEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setNewLimit(String(budget.amount_limit));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    const numLimit = Number(newLimit);
    if (isNaN(numLimit) || numLimit < 0) {
      setModalError('Hạn mức phải là một số lớn hơn hoặc bằng 0.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const updated = await updateBudgetLimit(editingBudget.category_id, currentMonthYear, numLimit);
      
      // Update local state
      setBudgets(prev => prev.map(b => b.category_id === updated.category_id ? { ...b, amount_limit: updated.amount_limit } : b));
      setIsModalOpen(false);
      setEditingBudget(null);

      // Trigger Next.js router refresh
      router.refresh();
      
      if (onBudgetUpdated) {
        onBudgetUpdated();
      }

      setToastMessage(`Đã cập nhật hạn mức cho danh mục ${updated.category?.name || 'Khác'}.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Lỗi khi lưu hạn mức.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 glass-panel border-neon-emerald/30 bg-[#161924]/90 px-4 py-3 rounded-xl flex items-center gap-3 text-neon-emerald text-sm shadow-xl shadow-neon-emerald/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 rounded-full bg-neon-emerald/10 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-brand-gold" />
          Hạn mức chi tiêu
        </h2>
        <span className="text-xs text-brand-text-soft font-semibold uppercase tracking-wider bg-brand-border/30 px-3 py-1 rounded-full">
          Tháng {currentMonthYear.split('-')[1]}
        </span>
      </div>

      {/* Overall Budget Ring/Progress Text */}
      <div className="p-4 bg-[#12141c] rounded-xl border border-brand-border/60 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-card flex items-center justify-center border border-brand-border">
          {statusEmoji}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-brand-text-soft uppercase tracking-wider">Trạng thái chung</p>
          <p className={`text-sm font-extrabold ${overallColorClass} mt-0.5`}>{remainingText}</p>
        </div>
      </div>

      {/* Categories Progress Bars */}
      <div className="space-y-4">
        {budgets.map((budget) => {
          const spent = Number(budget.amount_spent);
          const limit = Number(budget.amount_limit);
          const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const ratio = limit > 0 ? spent / limit : 0;
          const category = budget.category;
          const categoryName = category?.name || 'Khác';
          const categoryColor = category?.color || '#9ca3af';

          return (
            <div key={budget.category_id} className="space-y-2">
              {/* Row 1: Labels & Edit */}
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {categoryName}
                  </span>
                  {limit > 0 && ratio > 1.0 && (
                    <span className="text-[8px] font-bold text-neon-rose bg-neon-rose/10 border border-neon-rose/25 px-1.5 py-0.2 rounded uppercase tracking-wide">
                      Vượt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-brand-text-soft">
                    {formatCurrency(spent)} /{' '}
                    <span className="font-semibold text-white">
                      {limit > 0 ? formatCurrency(limit) : 'Chưa đặt'}
                    </span>
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(budget)}
                    className="p-1 rounded text-brand-text-soft hover:text-brand-gold hover:bg-brand-card transition cursor-pointer"
                    title="Chỉnh sửa hạn mức"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Progress bar */}
              <div className="h-1.5 w-full bg-[#0c0d12]/50 rounded-full overflow-hidden border border-brand-border/20">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(spent, limit)}`}
                  style={{ 
                    width: `${limit > 0 ? percentage : 0}%`,
                    backgroundColor: limit > 0 && ratio < 0.7 ? categoryColor : undefined
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ==========================================
          MODAL: THIẾT LẬP HẠN MỨC CHI TIÊU
          ========================================== */}
      {isModalOpen && editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="h-[3px] bg-brand-gold" />

            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Percent className="w-4.5 h-4.5 text-brand-gold" />
                Đặt hạn mức chi tiêu
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-brand-text-soft hover:text-white hover:bg-brand-card transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 space-y-5">
              <div className="p-3 bg-brand-card rounded-xl border border-brand-border">
                <h4 className="font-bold text-sm text-white">
                  Danh mục: {editingBudget.category?.name || 'Khác'}
                </h4>
                <p className="text-[10px] text-brand-text-soft mt-0.5">
                  Tháng {currentMonthYear.split('-')[1]} năm {currentMonthYear.split('-')[0]}
                </p>
                <div className="mt-2 text-xs text-brand-text-soft">
                  Đã tiêu dùng tháng này: <span className="font-semibold text-white">{formatCurrency(Number(editingBudget.amount_spent))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="limitInput">
                  Hạn mức chi tiêu mới (VND)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-text-soft">
                    ₫
                  </span>
                  <input
                    type="number"
                    id="limitInput"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Ví dụ: 3000000"
                    className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-8 pr-4 py-3 outline-none transition"
                    required
                    min="0"
                    step="any"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-brand-text-soft leading-normal">
                  Đặt bằng <span className="font-semibold text-brand-gold">0</span> để hủy theo dõi hạn mức cho danh mục này.
                </p>
              </div>

              {modalError && (
                <div className="p-3 bg-neon-rose/10 border border-neon-rose/20 text-neon-rose text-xs rounded-xl text-center">
                  {modalError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-card text-brand-text-soft text-sm font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-semibold text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Lưu hạn mức
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
