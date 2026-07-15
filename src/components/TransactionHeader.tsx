'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickActionModal from './QuickActionModal';
import { Account, Category } from '@/types';
import { useRouter } from 'next/navigation';

interface TransactionHeaderProps {
  accounts: Account[];
  categories: Category[];
}

export default function TransactionHeader({ accounts, categories }: TransactionHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Lịch sử giao dịch</h1>
        <p className="text-brand-text-soft text-sm mt-1">
          Xem và quản lý tất cả các khoản thu, chi và chuyển khoản bạn đã ghi nhận.
        </p>
      </div>

      {accounts.length > 0 && categories.length > 0 && (
        <div className="shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal text-sm font-bold transition shadow-lg shadow-brand-gold/10 cursor-pointer active:scale-95 duration-150"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Thêm giao dịch</span>
          </button>

          <QuickActionModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            accounts={accounts}
            categories={categories}
            onSuccess={() => {
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
