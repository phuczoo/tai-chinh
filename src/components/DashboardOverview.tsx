'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Account, Transaction, Budget, Category } from '@/types';
import { updateInitialBalance } from '@/app/actions/accounts';
import { MonthAnalytics } from '@/app/actions/budgets';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  Plus,
  Search,
  Bell,
  Sun,
  Moon,
  Share2,
  Download,
  ArrowRight
} from 'lucide-react';

interface DashboardOverviewProps {
  initialAccounts: Account[];
  initialTransactions: Transaction[];
  initialBudgets: Budget[];
  currentMonthYear: string;
  analyticsData: MonthAnalytics[];
  weeklyAnalyticsData: MonthAnalytics[];
  categories: Category[];
}

const WALLET_THEMES: Record<string, { gradient: string; text: string; border: string; glow: string }> = {
  'Techcombank': {
    gradient: 'from-[#e01e26]/20 via-[#161924] to-[#12141c]',
    text: 'text-[#ff4d54]',
    border: 'border-[#e01e26]/30',
    glow: 'shadow-[#e01e26]/5'
  },
  'Vietcombank': {
    gradient: 'from-[#7abf17]/20 via-[#161924] to-[#12141c]',
    text: 'text-[#9ee835]',
    border: 'border-[#7abf17]/30',
    glow: 'shadow-[#7abf17]/5'
  },
  'Ví MoMo': {
    gradient: 'from-[#ae2070]/20 via-[#161924] to-[#12141c]',
    text: 'text-[#f453a5]',
    border: 'border-[#ae2070]/30',
    glow: 'shadow-[#ae2070]/5'
  },
  'Ví ZaloPay': {
    gradient: 'from-[#008fe5]/20 via-[#161924] to-[#12141c]',
    text: 'text-[#38b2ac]',
    border: 'border-[#008fe5]/30',
    glow: 'shadow-[#008fe5]/5'
  },
  'Ví VNPay': {
    gradient: 'from-[#005aab]/20 via-[#161924] to-[#12141c]',
    text: 'text-[#4299e1]',
    border: 'border-[#005aab]/30',
    glow: 'shadow-[#005aab]/5'
  },
  'Tiền mặt': {
    gradient: 'from-[#e5c158]/20 via-[#161924] to-[#12141c]',
    text: 'text-brand-gold',
    border: 'border-brand-gold/30',
    glow: 'shadow-brand-gold/5'
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
  analyticsData,
  weeklyAnalyticsData,
  categories
}: DashboardOverviewProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('Arthur');
  const [greeting, setGreeting] = useState<string>('Good Morning');
  
  // Interactive features states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'Chào mừng bạn đến với Antigravity Fin! Hãy bắt đầu thiết lập hạn mức chi tiêu.', time: 'Vừa xong' },
    { id: 2, text: 'Tài chính khỏe mạnh: Chi tiêu của bạn hiện đang rất ổn định so với tháng trước.', time: '1 giờ trước' },
    { id: 3, text: 'Mẹo: Nhập nhanh giao dịch bằng phím bấm (+) màu vàng ở góc phải màn hình.', time: '2 giờ trước' }
  ];
  
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

  // Load preferences and setup listeners
  useEffect(() => {
    // Show balance preference
    const saved = localStorage.getItem('dashboard_show_balance');
    if (saved !== null) {
      setShowBalance(saved === 'true');
    }

    // App Theme preference
    const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }

    // Greeting logic
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Fetch user profile name
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Arthur';
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    };
    fetchUser();

    // Close popover when click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleBalance = () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    localStorage.setItem('dashboard_show_balance', String(newValue));
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    localStorage.setItem('app_theme', nextTheme);
    setToastMessage(`Đã chuyển sang giao diện ${nextTheme === 'light' ? 'Sáng' : 'Tối'}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      setToastMessage('Không có dữ liệu giao dịch để xuất.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Headers
    const headers = ['Ngay', 'Tai Khoan', 'Loai Giao Dich', 'So Tien (VND)', 'Danh Muc', 'Ghi Chu', 'Trang Thai'];
    
    // Rows
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString('vi-VN'),
      tx.account?.name || '',
      tx.type === 'INCOME' ? 'Thu nhap' : tx.type === 'EXPENSE' ? 'Chi tieu' : 'Chuyen khoan',
      tx.amount,
      tx.category?.name || (tx.type === 'INCOME' ? 'Thu nhap' : 'Khac'),
      tx.description || '',
      tx.status === 'SUCCESS' ? 'Thanh cong' : tx.status === 'PENDING' ? 'Cho' : 'That bai'
    ]);

    // Construct CSV String
    const csvContent = '\uFEFF' + // UTF-8 BOM for Vietnamese Excel support
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `antigravity_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Tải xuống dữ liệu CSV thành công.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareLink = () => {
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      navigator.share({
        title: 'Antigravity Finance',
        text: 'Quản lý tài chính cá nhân thông minh cùng Antigravity Finance!',
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setToastMessage('Đã sao chép link ứng dụng vào bộ nhớ tạm.');
        setTimeout(() => setToastMessage(null), 3000);
      }).catch(() => {
        setToastMessage('Không thể sao chép link. Vui lòng thử lại.');
        setTimeout(() => setToastMessage(null), 3000);
      });
    }
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
      case 'BANK': return <CreditCard className="w-4 h-4" />;
      case 'WALLET': return <Wallet className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
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
      
      router.refresh();
      
      setToastMessage(`Đã cập nhật số dư cho ${updated.name}.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu số dư.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransactionSuccess = () => {
    router.refresh();
    setToastMessage('Giao dịch đã được ghi nhận.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTransactionDeleted = () => {
    router.refresh();
    setToastMessage('Giao dịch đã được xóa.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBudgetUpdated = () => {
    router.refresh();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full relative">
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
      <button
        onClick={() => setIsQuickActionOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-14 h-14 rounded-full bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal flex items-center justify-center shadow-lg shadow-brand-gold/20 hover:scale-110 active:scale-95 transition-all duration-200 z-40 cursor-pointer"
        title="Nhập giao dịch nhanh"
      >
        <Plus className="w-6 h-6 stroke-[3px]" />
      </button>

      {/* ==========================================
          HEADER SECTION (Greeting & Tools)
          ========================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-xl md:text-2xl font-light text-brand-text-soft mt-1">
            {userName}
          </p>
        </div>

        {/* Tools bar matching the reference design */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar - Now fully functional */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-brand-text-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm giao dịch..." 
              className="w-full bg-[#0c0d12]/50 border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-brand-gold/50 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-text-soft hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle eye */}
          <button
            onClick={toggleBalance}
            className="p-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 hover:bg-brand-card hover:text-white text-brand-text-soft transition cursor-pointer"
            title={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
          >
            {showBalance ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>

          {/* Sun/Moon icon - Light/Darkmode switcher */}
          <button 
            onClick={handleThemeToggle}
            className="p-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 hover:bg-brand-card hover:text-brand-gold text-brand-text-soft transition cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Notification bell popover */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 hover:bg-brand-card hover:text-brand-gold text-brand-text-soft transition cursor-pointer relative"
              title="Thông báo tài chính"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold absolute top-2.5 right-2.5" />
            </button>

            {/* Notification Popover Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-72 glass-panel rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-3 bg-[#0c0d12]/95">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-brand-border/40 pb-2 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-brand-gold" />
                  Thông báo mới
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="text-[11px] leading-normal border-b border-brand-border/20 pb-2.5 last:border-0 last:pb-0">
                      <p className="text-white">{notif.text}</p>
                      <span className="text-[9px] text-brand-text-soft/60 block mt-1">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export button - Fully functional */}
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 text-brand-text-soft text-xs font-semibold hover:text-white transition cursor-pointer"
            title="Tải xuống toàn bộ giao dịch dạng file Excel CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>

          {/* Share button (Gold) - Fully functional */}
          <button 
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal text-xs font-bold transition cursor-pointer shadow-md shadow-brand-gold/10"
            title="Chia sẻ liên kết ứng dụng"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          THREE COLUMN MAIN GRID LAYOUT
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: LEFT PANEL (Total Balance, Wallet list, Promo Banner) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* A. Total Balance Card - cộng (+) button opens Modal */}
          <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-44">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-brand-text-soft uppercase tracking-wider">Total Balance</span>
              <button 
                onClick={() => setIsQuickActionOpen(true)}
                className="w-7 h-7 rounded-lg bg-[#1b1e28] border border-brand-border flex items-center justify-center text-brand-text-soft hover:text-brand-gold hover:border-brand-gold/20 transition cursor-pointer"
                title="Nhập nhanh giao dịch"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight block">
                {formatCurrency(totalBalance, showBalance)}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-bold text-neon-emerald bg-neon-emerald/10 border border-neon-emerald/20 px-1.5 py-0.5 rounded">
                  +12.4%
                </span>
                <span className="text-[9px] text-brand-text-soft/80">so với tháng trước</span>
              </div>
            </div>
            
            <div className="text-[9px] text-brand-text-soft border-t border-brand-border/40 pt-3 flex justify-between items-center">
              <span>Cập nhật mới nhất</span>
              <span className="font-semibold text-white">Vừa xong</span>
            </div>
          </div>

          {/* B. My Wallet Stack */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-brand-gold" />
                Nguồn tiền của tôi
              </h3>
              <span className="text-[10px] text-brand-text-soft font-semibold bg-brand-border/40 px-2 py-0.5 rounded-full border border-brand-border/30">
                {accounts.length} Ví
              </span>
            </div>

            {/* Overlapping/list representation of cards */}
            <div className="flex flex-col gap-2.5">
              {accounts.map((account) => {
                const theme = getWalletTheme(account.name);
                return (
                  <div 
                    key={account.id}
                    className={`p-3.5 rounded-xl border bg-gradient-to-r ${theme.gradient} ${theme.border} flex justify-between items-center hover:scale-[1.01] transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border ${theme.border} bg-[#161924]/60 text-white`}>
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{account.name}</h4>
                        <p className="text-[8px] text-brand-text-soft font-semibold uppercase tracking-wider mt-0.5">
                          {account.type === 'BANK' ? 'Ngân hàng' : account.type === 'WALLET' ? 'Ví' : 'Tiền mặt'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">
                        {formatCurrency(Number(account.current_balance), showBalance)}
                      </span>
                      <button 
                        onClick={() => handleOpenEditModal(account)}
                        className="p-1 rounded text-brand-text-soft/60 hover:text-brand-gold hover:bg-[#12141c]/40 transition"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. Promo Banner (Bottom Left) - Bắt đầu kế hoạch của bạn navigates to budgets */}
          <div className="relative rounded-2xl p-5 overflow-hidden min-h-[170px] flex flex-col justify-between border border-brand-border/60 bg-gradient-to-br from-[#1b2230] to-[#0c0d12] shadow-xl group">
            {/* Rock texture background simulation via gradient and mesh opacity */}
            <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=400&auto=format&fit=crop')` }} />
            
            <div className="space-y-1.5 z-10">
              <h3 className="text-lg font-black text-white leading-tight font-serif italic tracking-wide">
                Ready to Break Free Financially?
              </h3>
              <p className="text-[10px] text-brand-text-soft leading-normal">
                Đây là thời điểm để kiểm soát dòng tiền và nâng tầm tự do tài chính của bạn.
              </p>
            </div>

            <div className="z-10 pt-4 flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-brand-gold">28%</span>
                <span className="text-[8px] font-semibold text-brand-text-soft uppercase tracking-wide">Tăng trưởng tiết kiệm</span>
              </div>
              <button 
                onClick={() => router.push('/budgets')}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[10px] font-bold py-2.5 px-3 rounded-lg transition cursor-pointer"
              >
                <span>Bắt đầu kế hoạch của bạn</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gold group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: MIDDLE PANEL (Analytics Chart, Recent Transactions with search) */}
        <div className="lg:col-span-6 space-y-6">
          <AnalyticsChart data={analyticsData} weeklyData={weeklyAnalyticsData} />
          
          <RecentTransactions 
            initialTransactions={transactions}
            searchTerm={searchTerm}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </div>

        {/* COLUMN 3: RIGHT PANEL (Budget Tracker) */}
        <div className="lg:col-span-3">
          <BudgetTracker 
            initialBudgets={budgets}
            currentMonthYear={currentMonthYear}
            onBudgetUpdated={handleBudgetUpdated}
          />
        </div>
      </div>

      {/* ==========================================
          MODAL: THIẾT LẬP SỐ DƯ BAN ĐẦU
          ========================================== */}
      {isEditBalanceOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className={`h-[3px] bg-gradient-to-r ${getWalletTheme(editingAccount.name).gradient.replace('/20', '/80')}`} />
            
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
              <div className="p-3 bg-[#12141c]/50 rounded-xl border border-brand-border flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${getWalletTheme(editingAccount.name).border} bg-[#161924]/60 text-white`}>
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
                    className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-8 pr-4 py-3 outline-none transition duration-200"
                    required
                    min="0"
                    step="any"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-brand-text-soft leading-normal">
                  <span className="font-semibold text-brand-gold">Lưu ý:</span> Số dư hiện tại sẽ được tự động tính dựa trên số dư gốc mới cộng chênh lệch thu chi.
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
        categories={categories}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
