'use server';

import { createClient } from '@/lib/supabase/server';
import { Transaction, TransactionType, TransactionStatus, BudgetCategory } from '@/types';
import { revalidatePath } from 'next/cache';

interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  category: BudgetCategory;
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
    category: input.category,
    description: input.description || null,
    to_account_id: input.type === 'TRANSFER' ? (input.to_account_id || null) : null,
    created_at: input.created_at ? new Date(input.created_at).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([insertData])
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type)')
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
  if (input.category !== undefined) updateData.category = input.category;
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
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type)')
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
    .select('*, account:accounts!account_id(id, name, type), to_account:accounts!to_account_id(id, name, type)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Lỗi lấy lịch sử giao dịch gần đây: ${error.message}`);
  }

  return data as unknown as Transaction[];
}
