'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction, Budget } from '@/types';
import { updateInitialBalance } from '@/app/actions/accounts';
import { MonthAnalytics } from '@/app/actions/budgets';
import { useRouter } from 'next/navigation';
import RecentTransactions from './RecentTransactions';
import QuickActionModal from './QuickActionModal';
import BudgetTracker from './BudgetTracker';
import AnalyticsChart from './AnalyticsChart';
import { 
  Eye, 
  EyeOff, 
  Settings, 
  Wallet, 
  CreditCard, 
  Coins, 
  Edit2, 
  X, 
  Check, 
  Loader2, 
  Info,
  Plus
} from 'lucide-react';

interface DashboardOverviewProps {
  initialAccounts: Account[];
  initialTransactions: Transaction[];
  initialBudgets: Budget[];
  currentMonthYear: string;
  analyticsData: MonthAnalytics[];
}

const WALLET_THEMES: Record<string, { gradient: string; text: string; border: string; glow: string }> = {
  'Techcombank': {
    gradient: 'from-[#e01e26]/10 via-[#e01e26]/5 to-transparent',
    text: 'text-[#ff4d54]',
    border: 'border-[#e01e26]/30 focus:border-[#e01e26]/60',
    glow: 'shadow-[#e01e26]/5 hover:shadow-[#e01e26]/10'
  },
  'Vietcombank': {
    gradient: 'from-[#7abf17]/10 via-[#7abf17]/5 to-transparent',
    text: 'text-[#9ee835]',
    border: 'border-[#7abf17]/30 focus:border-[#7abf17]/60',
    glow: 'shadow-[#7abf17]/5 hover:shadow-[#7abf17]/10'
  },
  'Ví MoMo': {
    gradient: 'from-[#ae2070]/10 via-[#ae2070]/5 to-transparent',
    text: 'text-[#f453a5]',
    border: 'border-[#ae2070]/30 focus:border-[#ae2070]/60',
    glow: 'shadow-[#ae2070]/5 hover:shadow-[#ae2070]/10'
  },
  'Ví ZaloPay': {
    gradient: 'from-[#008fe5]/10 via-[#008fe5]/5 to-transparent',
    text: 'text-[#38b2ac]',
    border: 'border-[#008fe5]/30 focus:border-[#008fe5]/60',
    glow: 'shadow-[#008fe5]/5 hover:shadow-[#008fe5]/10'
  },
  'Ví VNPay': {
    gradient: 'from-[#005aab]/10 via-[#005aab]/5 to-transparent',
    text: 'text-[#4299e1]',
    border: 'border-[#005aab]/30 focus:border-[#005aab]/60',
    glow: 'shadow-[#005aab]/5 hover:shadow-[#005aab]/10'
  },
  'Tiền mặt': {
    gradient: 'from-[#e5c158]/10 via-[#e5c158]/5 to-transparent',
    text: 'text-brand-gold',
    border: 'border-brand-gold/30 focus:border-brand-gold/60',
    glow: 'shadow-brand-gold/5 hover:shadow-brand-gold/10'
  }
};

const getWalletTheme = (name: string) => {
  return WALLET_THEMES[name] || {
    gradient: 'from-brand-border/10 via-transparent to-transparent',
    text: 'text-white',
    border: 'border-brand-border',
    glow: ''
  };
};

const formatCurrency = (amount: number, show: boolean) => {
  if (!show) return '••••••• ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function DashboardOverview({ 
  initialAccounts, 
  initialTransactions,
  initialBudgets,
  currentMonthYear,
  analyticsData
}: DashboardOverviewProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  
  // Modal states
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');
  
  // Loading & alerts
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const router = useRouter();

  // Load showBalance preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_show_balance');
    if (saved !== null) {
      setShowBalance(saved === 'true');
    }
  }, []);

  // Update localStorage when preference changes
  const toggleBalance = () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    localStorage.setItem('dashboard_show_balance', String(newValue));
  };

  // Sync state if props change (Next.js server-side revalidation)
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK': return <CreditCard className="w-5 h-5" />;
      case 'WALLET': return <Wallet className="w-5 h-5" />;
      default: return <Coins className="w-5 h-5" />;
    }
  };

  const handleOpenEditModal = (account: Account) => {
    setEditingAccount(account);
    setNewBalance(String(account.initial_balance));
    setModalError(null);
    setIsEditBalanceOpen(true);
  };

  const handleSaveInitialBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const numBalance = Number(newBalance);
    if (isNaN(numBalance) || numBalance < 0) {
      setModalError('Vui lòng nhập số dư ban đầu hợp lệ (lớn hơn hoặc bằng 0).');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const updated = await updateInitialBalance(editingAccount.id, numBalance);
      
      // Update local state and trigger server refresh
      setAccounts(prev => prev.map(acc => acc.id === updated.id ? updated : acc));
      setIsEditBalanceOpen(false);
      setEditingAccount(null);
      
      // Refresh Next.js server data
      router.refresh();
      
      setToastMessage(`Đã cập nhật số dư ban đầu cho ${updated.name} thành công.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu số dư.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransactionSuccess = () => {
    router.refresh(); // Refresh server-side props
    setToastMessage('Giao dịch đã được lưu thành công.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTransactionDeleted = () => {
    router.refresh(); // Refresh server-side props
    setToastMessage('Giao dịch đã được xóa thành công.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBudgetUpdated = () => {
    router.refresh(); // Refresh server-side props
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 glass-panel border-neon-emerald/30 bg-[#161924]/90 px-4 py-3 rounded-xl flex items-center gap-3 text-neon-emerald text-sm shadow-xl shadow-neon-emerald/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 rounded-full bg-neon-emerald/10 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Action Button (FAB) for Quick Transaction Input */}
      {/* bottom-20 on mobile to clear bottom nav, bottom-8 on desktop */}
      <button
        onClick={() => setIsQuickActionOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-14 h-14 rounded-full bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal flex items-center justify-center shadow-lg shadow-brand-gold/20 hover:scale-110 active:scale-95 transition-all duration-200 z-40 cursor-pointer"
        title="Nhập giao dịch nhanh"
      >
        <Plus className="w-6 h-6 stroke-[3px]" />
      </button>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Tổng quan tài chính</h1>
          <p className="text-brand-text-soft text-sm mt-1">
            Chào mừng bạn trở lại. Dưới đây là phân tích nguồn tài sản của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={toggleBalance}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-card hover:text-brand-gold text-brand-text-soft text-sm font-medium transition cursor-pointer"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
          </button>
        </div>
      </div>

      {/* ==========================================
          TOTAL BALANCE CARD
          ========================================== */}
      <section className="relative glass-panel rounded-2xl p-6 md:p-8 overflow-hidden shadow-xl shadow-black/10">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-brand-gold/5 to-transparent pointer-events-none" />
        
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider flex items-center gap-1.5">
            Tổng số dư tài sản
            <span className="group relative cursor-pointer text-brand-text-soft hover:text-white">
              <Info className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-[#161924] border border-brand-border text-[10px] text-white opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 text-center leading-normal shadow-lg">
                Tổng giá trị số dư của tất cả 6 ví tài khoản hiện tại.
              </span>
            </span>
          </h2>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {formatCurrency(totalBalance, showBalance)}
            </span>
            {showBalance && (
              <span className="text-xs md:text-sm font-medium text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full border border-brand-gold/20">
                VND
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          MY WALLET GRID (Responsive: Slider on Mobile)
          ========================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-gold" />
            Nguồn tiền của tôi
          </h2>
          <span className="text-xs text-brand-text-soft font-medium">6 Tài khoản</span>
        </div>

        {/* Outer Wrapper for Mobile slider vs Desktop grid */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-none">
          {accounts.map((account) => {
            const theme = getWalletTheme(account.name);
            return (
              <div
                key={account.id}
                className={`flex-none w-[280px] md:w-auto snap-center glass-panel rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${theme.border} ${theme.glow} bg-gradient-to-br ${theme.gradient}`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${theme.border} bg-[#161924]/60`}>
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white tracking-tight leading-tight">
                          {account.name}
                        </h3>
                        <p className="text-[10px] text-brand-text-soft font-semibold uppercase tracking-wider mt-0.5">
                          {account.type === 'BANK' ? 'Ngân hàng' : account.type === 'WALLET' ? 'Ví điện tử' : 'Tiền mặt'}
                        </p>
                      </div>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(account)}
                      className="p-1.5 rounded-lg border border-brand-border bg-[#161924]/40 hover:bg-brand-gold hover:text-brand-charcoal text-brand-text-soft transition duration-200 cursor-pointer"
                      title="Thiết lập số dư ban đầu"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Balance Display */}
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold text-brand-text-soft uppercase tracking-wider mb-1">
                      Số dư hiện tại
                    </p>
                    <p className="text-xl font-extrabold text-white tracking-tight">
                      {formatCurrency(Number(account.current_balance), showBalance)}
                    </p>
                  </div>

                  {/* Footnotes */}
                  <div className="flex justify-between items-center text-[10px] text-brand-text-soft border-t border-brand-border/40 pt-2.5">
                    <span>Số dư gốc:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(Number(account.initial_balance), showBalance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==========================================
          ANALYTICS, RECENT TRANSACTIONS & BUDGETS SECTION (Grid Layout)
          ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Analytics Chart & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <AnalyticsChart data={analyticsData} />
          
          <RecentTransactions 
            initialTransactions={transactions}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </div>

        {/* Right Side: Budget Tracker */}
        <div className="lg:col-span-1">
          <BudgetTracker 
            initialBudgets={budgets}
            currentMonthYear={currentMonthYear}
            onBudgetUpdated={handleBudgetUpdated}
          />
        </div>
      </section>

      {/* ==========================================
          MODAL: THIẾT LẬP SỐ DƯ BAN ĐẦU
          ========================================== */}
      {isEditBalanceOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className={`h-[3px] bg-gradient-to-r ${getWalletTheme(editingAccount.name).gradient.replace('/10', '/80').replace('/5', '/50')}`} />
            
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-gold" />
                Thiết lập số dư ban đầu
              </h3>
              <button
                onClick={() => setIsEditBalanceOpen(false)}
                className="p-1 rounded-lg text-brand-text-soft hover:text-white hover:bg-brand-card transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialBalance} className="p-5 space-y-5">
              <div className="p-3 bg-brand-card rounded-xl border border-brand-border flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${getWalletTheme(editingAccount.name).border} bg-[#161924]/60`}>
                  {getAccountIcon(editingAccount.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{editingAccount.name}</h4>
                  <p className="text-[10px] text-brand-text-soft uppercase tracking-wider">
                    {editingAccount.type === 'BANK' ? 'Ngân hàng' : editingAccount.type === 'WALLET' ? 'Ví điện tử' : 'Tiền mặt'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="initialBalanceInput">
                  Số dư ban đầu (VND)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-text-soft">
                    ₫
                  </span>
                  <input
                    type="number"
                    id="initialBalanceInput"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="Nhập số dư, ví dụ: 500000"
                    className="w-full bg-[#141722] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-8 pr-4 py-3 outline-none transition duration-200"
                    required
                    min="0"
                    step="any"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-brand-text-soft leading-normal">
                  <span className="font-semibold text-brand-gold">Lưu ý:</span> Hệ thống sẽ tự động tính toán lại số dư hiện tại theo công thức: 
                  <code className="block mt-1 p-1 bg-[#141722] rounded border border-brand-border text-[9px] text-white">
                    Số dư hiện tại = Số dư ban đầu mới + (Tổng thu nhập - Tổng chi tiêu)
                  </code>
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
                  onClick={() => setIsEditBalanceOpen(false)}
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
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          QUICK ACTION MODAL
          ========================================== */}
      <QuickActionModal 
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        accounts={accounts}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
