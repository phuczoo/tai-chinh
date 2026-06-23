'use server';

import { getCachedUser } from '@/lib/auth-check';

import { createClient } from '@/lib/supabase/server';
import { Account } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Lấy danh sách tài khoản của user đang đăng nhập.
 * Nếu chưa có tài khoản nào (trường hợp đăng ký trước khi tạo trigger),
 * tự động khởi tạo 6 tài khoản mặc định.
 */
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const user = await getCachedUser();
  
  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy danh sách tài khoản: ${error.message}`);
  }

  // Khởi tạo dự phòng nếu chưa có tài khoản nào
  if (!data || data.length === 0) {
    const defaultAccounts = [
      { user_id: user.id, name: 'Techcombank', type: 'BANK', initial_balance: 0, current_balance: 0 },
      { user_id: user.id, name: 'Vietcombank', type: 'BANK', initial_balance: 0, current_balance: 0 },
      { user_id: user.id, name: 'Ví MoMo', type: 'WALLET', initial_balance: 0, current_balance: 0 },
      { user_id: user.id, name: 'Ví ZaloPay', type: 'WALLET', initial_balance: 0, current_balance: 0 },
      { user_id: user.id, name: 'Ví VNPay', type: 'WALLET', initial_balance: 0, current_balance: 0 },
      { user_id: user.id, name: 'Tiền mặt', type: 'CASH', initial_balance: 0, current_balance: 0 },
    ];
    
    const { data: inserted, error: insertError } = await supabase
      .from('accounts')
      .insert(defaultAccounts)
      .select();

    if (insertError) {
      throw new Error(`Lỗi khởi tạo tài khoản mặc định: ${insertError.message}`);
    }
    
    return inserted as Account[];
  }

  return data as Account[];
}

/**
 * Thiết lập số dư ban đầu cho một tài khoản.
 * Tính toán lại số dư hiện tại dựa trên công thức:
 * current_balance = new_initial_balance + (tổng thu nhập - tổng chi tiêu của tài khoản đó)
 */
export async function updateInitialBalance(accountId: string, newInitialBalance: number): Promise<Account> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Lấy tất cả các giao dịch thành công (SUCCESS) liên quan đến tài khoản này
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'SUCCESS')
    .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);

  if (txError) {
    throw new Error(`Lỗi lấy lịch sử giao dịch: ${txError.message}`);
  }

  // 2. Tính toán tổng chênh lệch thu - chi
  let netChange = 0;
  if (transactions) {
    transactions.forEach((tx) => {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        netChange += amount;
      } else if (tx.type === 'EXPENSE') {
        netChange -= amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.account_id === accountId) {
          netChange -= amount; // Chuyển đi
        }
        if (tx.to_account_id === accountId) {
          netChange += amount; // Nhận về
        }
      }
    });
  }

  // 3. Tính current_balance mới
  const newCurrentBalance = newInitialBalance + netChange;

  // 4. Cập nhật vào DB
  const { data, error: updateError } = await supabase
    .from('accounts')
    .update({
      initial_balance: newInitialBalance,
      current_balance: newCurrentBalance
    })
    .eq('id', accountId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Lỗi cập nhật số dư ban đầu: ${updateError.message}`);
  }

  // Revalidate cache của trang chủ
  revalidatePath('/');

  return data as Account;
}
