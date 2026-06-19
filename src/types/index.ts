export type AccountType = 'BANK' | 'WALLET' | 'CASH';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type BudgetCategory = 
  | 'FOOD' 
  | 'FIXED_EXPENSES' 
  | 'EDUCATION' 
  | 'SHOPPING' 
  | 'TRANSPORT' 
  | 'INCOME_GEN' 
  | 'OTHERS';

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
  category: BudgetCategory;
  description: string | null;
  to_account_id: string | null;
  created_at: string;
  
  // Optional relations (loaded via join)
  account?: Account;
  to_account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category: BudgetCategory;
  amount_limit: number;
  amount_spent: number;
  month_year: string; // YYYY-MM
}

// ==========================================
// MAPPING HELPER CONSTANTS FOR UI/UX
// ==========================================

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  FOOD: 'Ăn uống',
  FIXED_EXPENSES: 'Cố định',
  EDUCATION: 'Giáo dục',
  SHOPPING: 'Mua sắm',
  TRANSPORT: 'Di chuyển',
  INCOME_GEN: 'Thu nhập',
  OTHERS: 'Khác',
};

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  FOOD: '#e5c158',          // Gold
  FIXED_EXPENSES: '#60a5fa',  // Blue
  EDUCATION: '#c084fc',     // Purple
  SHOPPING: '#f472b6',      // Pink
  TRANSPORT: '#fb923c',     // Orange
  INCOME_GEN: '#34d399',    // Emerald Green
  OTHERS: '#9ca3af',        // Gray
};

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
