'use server';

import { createClient } from '@/lib/supabase/server';
import { Budget, BudgetCategory, BudgetCategory as TypeCategory } from '@/types';
import { revalidatePath } from 'next/cache';

const EXPENSE_CATEGORIES: BudgetCategory[] = [
  'FOOD',
  'FIXED_EXPENSES',
  'EDUCATION',
  'SHOPPING',
  'TRANSPORT',
  'OTHERS',
];

/**
 * Lấy toàn bộ hạn mức (Budgets) của một tháng (Định dạng "YYYY-MM").
 * Bảo đảm luôn trả về đủ 6 danh mục chi tiêu chính (tự động điền hạn mức = 0 nếu chưa tồn tại).
 */
export async function getMonthlyBudgets(monthYear: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month_year', monthYear);

  if (error) {
    throw new Error(`Lỗi lấy dữ liệu ngân sách: ${error.message}`);
  }

  // Chuyển kết quả thành Map để tra cứu nhanh
  const budgetMap = new Map<string, Budget>();
  if (data) {
    data.forEach((b: Budget) => budgetMap.set(b.category, b));
  }

  // Đảm bảo đủ các danh mục chi tiêu
  const result: Budget[] = EXPENSE_CATEGORIES.map((cat) => {
    const existing = budgetMap.get(cat);
    if (existing) {
      return existing;
    }
    return {
      id: `temp-${cat}`,
      user_id: user.id,
      category: cat,
      amount_limit: 0,
      amount_spent: 0,
      month_year: monthYear,
    };
  });

  return result;
}

/**
 * Thiết lập hoặc cập nhật hạn mức ngân sách cho một danh mục.
 */
export async function updateBudgetLimit(
  category: BudgetCategory,
  monthYear: string,
  newLimit: number
): Promise<Budget> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // Thực hiện Upsert
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: user.id,
        category,
        amount_limit: newLimit,
        month_year: monthYear,
      },
      { onConflict: 'user_id,category,month_year' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi thiết lập ngân sách: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/budgets');

  return data as Budget;
}

/**
 * Thống kê dữ liệu thu nhập và chi tiêu của 6 tháng gần nhất để vẽ biểu đồ.
 */
export interface MonthAnalytics {
  name: string;      // Ví dụ: "Tháng 01" hoặc "T1"
  income: number;    // Tổng thu nhập
  expense: number;   // Tổng chi tiêu
}

export async function getAnalyticsData(): Promise<MonthAnalytics[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Tính toán ngày bắt đầu (6 tháng trước từ đầu tháng)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 2. Truy vấn tất cả giao dịch SUCCESS từ ngày bắt đầu
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'SUCCESS')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy dữ liệu thống kê: ${error.message}`);
  }

  // 3. Khởi tạo danh sách 6 tháng gần nhất
  const analyticsMap = new Map<string, { income: number; expense: number }>();
  const monthsList: { key: string; label: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    const label = `T${d.getMonth() + 1}`; // T1, T2,...
    monthsList.push({ key, label });
    analyticsMap.set(key, { income: 0, expense: 0 });
  }

  // 4. Cộng dồn doanh thu / chi tiêu
  if (transactions) {
    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      const stats = analyticsMap.get(key);
      if (stats) {
        const amount = Number(tx.amount);
        if (tx.type === 'INCOME') {
          stats.income += amount;
        } else if (tx.type === 'EXPENSE') {
          stats.expense += amount;
        }
        // Bỏ qua TRANSFER vì không trực tiếp làm tăng/giảm thu chi ròng của tổng tài sản
      }
    });
  }

  // 5. Build dữ liệu trả về theo đúng trật tự thời gian
  return monthsList.map((m) => {
    const stats = analyticsMap.get(m.key) || { income: 0, expense: 0 };
    return {
      name: m.label,
      income: stats.income,
      expense: stats.expense,
    };
  });
}
