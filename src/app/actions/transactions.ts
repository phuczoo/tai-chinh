'use server';

import { createClient } from '@/lib/supabase/server';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { revalidatePath } from 'next/cache';

interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  category_id?: string | null;
  description?: string;
  to_account_id?: string;
  created_at?: string; // Cho phép điền ngày giờ giao dịch thủ công
}

/**
 * Tạo mới một giao dịch.
 * Cơ sở dữ liệu Supabase sẽ tự động chạy Trigger để cập nhật số dư Accounts và Budgets.
 */
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const insertData = {
    user_id: user.id,
    account_id: input.account_id,
    type: input.type,
    status: input.status,
    amount: input.amount,
    category_id: input.category_id || null,
    description: input.description || null,
    to_account_id: input.type === 'TRANSFER' ? (input.to_account_id || null) : null,
    created_at: input.created_at ? new Date(input.created_at).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([insertData])
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type), category:categories!category_id(id, name, icon, color)')
    .single();

  if (error) {
    throw new Error(`Lỗi tạo giao dịch: ${error.message}`);
  }

  // Làm mới cache các trang liên quan
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  revalidatePath('/analytics');

  return data as unknown as Transaction;
}

/**
 * Cập nhật một giao dịch hiện có.
 * Trigger DB tự động hoàn tác ảnh hưởng của giao dịch cũ và áp dụng giao dịch mới.
 */
export async function updateTransaction(
  id: string,
  input: Partial<CreateTransactionInput>
): Promise<Transaction> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const updateData: Record<string, any> = {};
  if (input.account_id !== undefined) updateData.account_id = input.account_id;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.to_account_id !== undefined) {
    updateData.to_account_id = input.type === 'TRANSFER' ? (input.to_account_id || null) : null;
  }
  if (input.created_at !== undefined) {
    updateData.created_at = new Date(input.created_at).toISOString();
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type), category:categories!category_id(id, name, icon, color)')
    .single();

  if (error) {
    throw new Error(`Lỗi cập nhật giao dịch: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  revalidatePath('/analytics');

  return data as unknown as Transaction;
}

/**
 * Xóa một giao dịch.
 * Trigger DB tự động hoàn tác tác động của giao dịch bị xóa đối với số dư tài khoản/ngân sách.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Lỗi xóa giao dịch: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  revalidatePath('/analytics');
}

/**
 * Lấy danh sách giao dịch gần nhất của user.
 */
export async function getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type), category:categories!category_id(id, name, icon, color)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Lỗi lấy lịch sử giao dịch gần đây: ${error.message}`);
  }

  return data as unknown as Transaction[];
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  icon: string;
  color: string;
}

export async function getExpenseBreakdown(
  startDate?: string,
  endDate?: string
): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  let query = supabase
    .from('transactions')
    .select('*, category:categories!category_id(id, name, icon, color)')
    .eq('user_id', user.id)
    .eq('type', 'EXPENSE')
    .eq('status', 'SUCCESS');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: transactions, error } = await query;

  if (error) {
    throw new Error(`Lỗi lấy dữ liệu phân bổ chi tiêu: ${error.message}`);
  }

  const groups: Record<string, CategoryBreakdown> = {};
  const defaultCategoryKey = 'none';

  if (transactions) {
    transactions.forEach((tx) => {
      const cat = tx.category;
      const catId = cat ? cat.id : null;
      const catName = cat ? cat.name : 'Khác';
      const catIcon = cat ? cat.icon : 'MoreHorizontal';
      const catColor = cat ? cat.color : '#9ca3af';
      const amount = Number(tx.amount);

      const key = catId || defaultCategoryKey;
      if (!groups[key]) {
        groups[key] = {
          categoryId: catId,
          categoryName: catName,
          amount: 0,
          icon: catIcon,
          color: catColor,
        };
      }
      groups[key].amount += amount;
    });
  }

  return Object.values(groups).sort((a, b) => b.amount - a.amount);
}

export interface MonthNetWorth {
  name: string;
  netWorth: number;
}

export async function getNetWorthTrend(): Promise<MonthNetWorth[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Lấy tổng số dư hiện tại của tất cả tài khoản của user
  const { data: accounts, error: acctError } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('user_id', user.id);

  if (acctError) {
    throw new Error(`Lỗi lấy danh sách tài khoản: ${acctError.message}`);
  }

  const currentNetWorth = accounts ? accounts.reduce((sum, a) => sum + Number(a.current_balance), 0) : 0;

  // 2. Tính mốc thời gian bắt đầu (6 tháng trước từ đầu tháng)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 3. Chỉ fetch các giao dịch trong vòng 6 tháng gần đây (SUCCESS) để tránh O(N) bottleneck
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, type, created_at')
    .eq('user_id', user.id)
    .eq('status', 'SUCCESS')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false }); // descending (mới nhất lên trước)

  if (txError) {
    throw new Error(`Lỗi lấy lịch sử giao dịch Net Worth: ${txError.message}`);
  }

  // 4. Khởi tạo danh sách 6 tháng gần nhất
  const monthsList: { key: string; label: string; netWorth: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `T${d.getMonth() + 1}`;
    monthsList.push({ key, label, netWorth: 0 });
  }

  // 5. Nhóm các giao dịch theo tháng (YYYY-MM)
  const txsByMonth: Record<string, any[]> = {};
  if (transactions) {
    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!txsByMonth[key]) txsByMonth[key] = [];
      txsByMonth[key].push(tx);
    });
  }

  // 6. Tính toán cuốn chiếu ngược về quá khứ (O(T) với T là số lượng giao dịch trong 6 tháng)
  let runningWorth = currentNetWorth;
  for (let i = 5; i >= 0; i--) {
    const m = monthsList[i];
    m.netWorth = runningWorth;

    // Undo tất cả các giao dịch phát sinh trong tháng m.key để tìm số dư cuối tháng trước
    const monthTxs = txsByMonth[m.key] || [];
    monthTxs.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'EXPENSE') {
        runningWorth += amount; // undo expense
      } else if (tx.type === 'INCOME') {
        runningWorth -= amount; // undo income
      }
    });
  }

  // 7. Trả về định dạng cho biểu đồ đường
  return monthsList.map(m => ({
    name: m.label,
    netWorth: m.netWorth
  }));
}


