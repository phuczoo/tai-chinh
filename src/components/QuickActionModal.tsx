'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Account, Category, Transaction, TransactionType, TransactionStatus } from '@/types';
import { createTransaction, updateTransaction } from '@/app/actions/transactions';
import { ICON_MAP } from './CategoryManager';
import { 
  X, 
  Plus, 
  Loader2,
  Calendar,
  FileText,
  Delete,
  MoreHorizontal,
  Edit2,
  Check
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSuccess?: () => void;
  editingTransaction?: Transaction | null;
}

// Hàm định dạng số có dấu chấm phân cách hàng nghìn
const formatNumberString = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(clean));
};

export default function QuickActionModal({ 
  isOpen, 
  onClose, 
  accounts, 
  categories, 
  onSuccess,
  editingTransaction = null
}: QuickActionModalProps) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>(''); // Lưu trữ chuỗi đã được định dạng (vd: 100.000)
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('SUCCESS');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const isFormInitialized = useRef<boolean>(false);

  // Set default form values when modal opens
  useEffect(() => {
    if (isOpen) {
      isFormInitialized.current = false;
      setError(null);
      
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(formatNumberString(String(editingTransaction.amount)));
        setDescription(editingTransaction.description || '');
        setStatus(editingTransaction.status);
        setAccountId(editingTransaction.account_id);
        setToAccountId(editingTransaction.to_account_id || '');
        setCategoryId(editingTransaction.category_id || '');

        const txDate = new Date(editingTransaction.created_at);
        const offset = txDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(txDate.getTime() - offset)).toISOString().slice(0, 16);
        setCreatedAt(localISOTime);
      } else {
        setAmount('');
        setDescription('');
        setStatus('SUCCESS');
        
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
        setCreatedAt(localISOTime);

        setType('EXPENSE');

        if (accounts.length > 0) {
          const sorted = [...accounts].sort((a, b) => Number(b.current_balance) - Number(a.current_balance));
          setAccountId(sorted[0].id);
          
          const otherAcc = accounts.find(a => a.id !== sorted[0].id) || accounts[0];
          setToAccountId(otherAcc.id);
        }

        if (categories.length > 0) {
          const filtered = categories.filter(c => c.type === 'EXPENSE');
          const foodCat = filtered.find(c => c.name.includes('Ăn uống')) || filtered[0] || categories[0];
          setCategoryId(foodCat.id);
        }
      }

      // Đợi các state cập nhật xong rồi mới đánh dấu hoàn tất khởi tạo
      setTimeout(() => {
        isFormInitialized.current = true;
      }, 50);

      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isOpen, accounts, categories, editingTransaction]);

  // Adjust category automatically when transaction type changes
  useEffect(() => {
    if (categories.length === 0) return;
    
    // Nếu đang chỉnh sửa và form chưa khởi tạo xong thì KHÔNG tự động thay đổi category
    if (editingTransaction && !isFormInitialized.current) return;

    if (type === 'INCOME') {
      const filtered = categories.filter(c => c.type === 'INCOME');
      const incomeCat = filtered.find(c => c.name.includes('Lương')) || filtered[0] || categories[0];
      setCategoryId(incomeCat.id);
    } else if (type === 'TRANSFER') {
      setCategoryId('');
    } else {
      const filtered = categories.filter(c => c.type === 'EXPENSE');
      const foodCat = filtered.find(c => c.name.includes('Ăn uống')) || filtered[0] || categories[0];
      setCategoryId(foodCat.id);
    }
  }, [type, categories, editingTransaction]);

  if (!isOpen) return null;

  // Lấy giá trị số nguyên từ chuỗi đã định dạng
  const getRawAmount = () => {
    return Number(amount.replace(/\./g, '')) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(formatNumberString(raw));
  };

  const handleQuickAdd = (valueToAdd: number) => {
    const currentVal = getRawAmount();
    const newVal = currentVal + valueToAdd;
    setAmount(formatNumberString(String(newVal)));
  };

  const handleAppendZeros = () => {
    const raw = amount.replace(/\./g, '');
    if (!raw) return;
    const newVal = raw + '000';
    setAmount(formatNumberString(newVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = getRawAmount();
    if (numAmount <= 0) {
      setError('Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (!accountId) {
      setError('Vui lòng chọn tài khoản nguồn.');
      return;
    }

    if (type === 'TRANSFER' && !toAccountId) {
      setError('Vui lòng chọn tài khoản nhận.');
      return;
    }

    if (type === 'TRANSFER' && accountId === toAccountId) {
      setError('Tài khoản nhận phải khác tài khoản nguồn.');
      return;
    }

    setIsSaving(true);

    try {
      const transactionData = {
        account_id: accountId,
        type,
        status,
        amount: numAmount,
        category_id: type === 'TRANSFER' ? null : (categoryId || null),
        description,
        to_account_id: type === 'TRANSFER' ? toAccountId : undefined,
        created_at: createdAt ? new Date(createdAt).toISOString() : undefined,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
      } else {
        await createTransaction(transactionData);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu giao dịch.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-charcoal/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full sm:max-w-lg bg-[#161924] border-t sm:border border-brand-border rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
        
        {/* Top gold bar */}
        <div className="h-[3px] bg-brand-gold" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border shrink-0">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {editingTransaction ? (
              <Edit2 className="w-5 h-5 text-brand-gold" />
            ) : (
              <Plus className="w-5 h-5 text-brand-gold" />
            )}
            {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Nhập giao dịch mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-brand-text-soft hover:text-white hover:bg-brand-card transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* A. Transaction Type Toggle */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#12141c] rounded-xl border border-brand-border shrink-0">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition duration-200 ${
                  type === t
                    ? t === 'INCOME'
                      ? 'bg-neon-emerald text-brand-charcoal'
                      : t === 'EXPENSE'
                      ? 'bg-brand-gold text-brand-charcoal'
                      : 'bg-white text-brand-charcoal'
                    : 'text-brand-text-soft hover:text-white'
                }`}
              >
                {t === 'INCOME' ? 'THU NHẬP' : t === 'EXPENSE' ? 'CHI TIÊU' : 'CHUYỂN KHOẢN'}
              </button>
            ))}
          </div>

          {/* B. Amount Input with dots formatting */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="quickAmountInput">
                Số tiền (VND)
              </label>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-[10px] font-bold text-neon-rose hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Delete className="w-3.5 h-3.5" />
                  Xóa số
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-xl font-bold text-brand-gold">
                ₫
              </span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                id="quickAmountInput"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-2xl font-black rounded-xl pl-10 pr-4 py-3 outline-none transition"
                required
              />
            </div>

            {/* Quick Suggest Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleAppendZeros}
                disabled={!amount}
                className="px-3 py-1.5 text-xs font-bold bg-brand-border/30 hover:bg-brand-border/60 text-white rounded-lg border border-brand-border/25 cursor-pointer disabled:opacity-40"
              >
                .000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(50000)}
                className="px-3 py-1.5 text-xs font-bold bg-[#1e2330] hover:bg-[#2c3245] text-brand-gold rounded-lg border border-brand-gold/15 cursor-pointer"
              >
                +50k
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(100000)}
                className="px-3 py-1.5 text-xs font-bold bg-[#1e2330] hover:bg-[#2c3245] text-brand-gold rounded-lg border border-brand-gold/15 cursor-pointer"
              >
                +100k
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(500000)}
                className="px-3 py-1.5 text-xs font-bold bg-[#1e2330] hover:bg-[#2c3245] text-brand-gold rounded-lg border border-brand-gold/15 cursor-pointer"
              >
                +500k
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000000)}
                className="px-3 py-1.5 text-xs font-bold bg-[#1e2330] hover:bg-[#2c3245] text-brand-gold rounded-lg border border-brand-gold/15 cursor-pointer"
              >
                +1M
              </button>
            </div>
          </div>

          {/* C. Accounts Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Source Account */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="sourceAccountSelect">
                {type === 'TRANSFER' ? 'Tài khoản nguồn' : 'Tài khoản'}
              </label>
              <select
                id="sourceAccountSelect"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold text-white text-sm rounded-xl px-3 py-3 outline-none transition cursor-pointer"
                required
              >
                <option value="" disabled>-- Chọn tài khoản --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(acc.current_balance))})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account (TRANSFER ONLY) */}
            {type === 'TRANSFER' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="destAccountSelect">
                  Tài khoản nhận
                </label>
                <select
                  id="destAccountSelect"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold text-white text-sm rounded-xl px-3 py-3 outline-none transition cursor-pointer"
                  required={type === 'TRANSFER'}
                >
                  <option value="" disabled>-- Chọn tài khoản --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(acc.current_balance))})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* D. Categories Grid (EXPENSE & INCOME) */}
          {type !== 'TRANSFER' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block">
                {type === 'INCOME' ? 'Danh mục thu nhập' : 'Danh mục chi tiêu'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categories
                  .filter((cat) => (cat.type || 'EXPENSE') === type)
                  .map((cat) => {
                    const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                            : 'border-brand-border bg-[#12141c] text-brand-text-soft hover:text-white hover:border-brand-border/80'
                        }`}
                        style={{ 
                          color: isSelected ? cat.color : undefined,
                          borderColor: isSelected ? cat.color : undefined,
                          backgroundColor: isSelected ? `${cat.color}15` : undefined
                        }}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span className="text-[10px] font-semibold text-center leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* E. Additional Fields */}
          <div className="pt-2 border-t border-brand-border/40 space-y-4">
            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="descriptionInput">
                Ghi chú / Diễn giải
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-text-soft">
                  <FileText className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="descriptionInput"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ăn trưa, trà đá, chuyển khoản trả nợ..."
                  className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition"
                />
              </div>
            </div>

            {/* Date-time & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="createdAtInput">
                  Ngày giờ giao dịch
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-text-soft">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="datetime-local"
                    id="createdAtInput"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold text-white text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block">
                  Trạng thái giao dịch
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#12141c] rounded-xl border border-brand-border">
                  {(['SUCCESS', 'PENDING', 'FAILED'] as TransactionStatus[]).map((s) => {
                    const isSelected = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition ${
                          isSelected
                            ? s === 'SUCCESS'
                              ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30'
                              : s === 'PENDING'
                              ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/30'
                              : 'bg-neon-rose/20 text-neon-rose border border-neon-rose/30'
                            : 'text-brand-text-soft border border-transparent'
                        }`}
                      >
                        {s === 'SUCCESS' ? 'XONG' : s === 'PENDING' ? 'CHỜ' : 'LỖI'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-neon-rose/10 border border-neon-rose/20 text-neon-rose text-xs rounded-xl text-center shrink-0">
              {error}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-5 border-t border-brand-border shrink-0 bg-[#141722]/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-3 rounded-xl border border-brand-border hover:bg-brand-card text-brand-text-soft text-sm font-medium transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            type="submit"
            className="bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-bold text-sm rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 min-w-[120px]"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {editingTransaction ? (
                  <Check className="w-4 h-4 stroke-[3px]" />
                ) : (
                  <Plus className="w-4 h-4 stroke-[3px]" />
                )}
                {editingTransaction ? 'Cập nhật' : 'Ghi nhận'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
