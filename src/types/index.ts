export type AccountType = 'BANK' | 'WALLET' | 'CASH';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string; // Tên icon Lucide
  color: string; // Mã màu hex
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  category_id: string | null;
  description: string | null;
  to_account_id: string | null;
  created_at: string;
  
  // Relations
  account?: Account;
  to_account?: Account;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;
  amount_spent: number;
  month_year: string; // YYYY-MM
  
  // Relations
  category?: Category;
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  SUCCESS: 'Thành công',
  PENDING: 'Đang xử lý',
  FAILED: 'Thất bại',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Ngân hàng',
  WALLET: 'Ví điện tử',
  CASH: 'Tiền mặt',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Ăn uống': '#e5c158',
  'Cố định': '#60a5fa',
  'Giáo dục': '#c084fc',
  'Mua sắm': '#f472b6',
  'Di chuyển': '#fb923c',
  'Khác': '#9ca3af',
};

export const CATEGORY_LABELS: Record<string, string> = {
  'Ăn uống': 'Ăn uống',
  'Cố định': 'Cố định',
  'Giáo dục': 'Giáo dục',
  'Mua sắm': 'Mua sắm',
  'Di chuyển': 'Di chuyển',
  'Khác': 'Khác',
};

