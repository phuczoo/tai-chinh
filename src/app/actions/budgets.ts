'use server';

import { getCachedUser } from '@/lib/auth-check';

import { createClient } from '@/lib/supabase/server';
import { Budget } from '@/types';
import { revalidatePath } from 'next/cache';
import { getCategories } from './categories';

/**
 * Lấy toàn bộ hạn mức (Budgets) của một tháng (Định dạng "YYYY-MM").
 * Đảm bảo luôn trả về đủ các danh mục chi tiêu của người dùng (tự động điền hạn mức = 0 nếu chưa tồn tại).
 */
export async function getMonthlyBudgets(monthYear: string): Promise<Budget[]> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Lấy danh sách danh mục và chỉ giữ lại danh mục chi tiêu (EXPENSE)
  const categories = (await getCategories()).filter(c => c.type === 'EXPENSE');

  // 2. Lấy dữ liệu ngân sách đã lưu trong tháng
  const { data: budgetsData, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month_year', monthYear);

  if (error) {
    throw new Error(`Lỗi lấy dữ liệu ngân sách: ${error.message}`);
  }

  // Chuyển kết quả thành Map để tra cứu nhanh bằng category_id
  const budgetMap = new Map<string, any>();
  if (budgetsData) {
    budgetsData.forEach((b) => budgetMap.set(b.category_id, b));
  }

  // Ghép nối danh mục và hạn mức ngân sách
  const result: Budget[] = categories.map((cat) => {
    const existing = budgetMap.get(cat.id);
    if (existing) {
      return {
        ...existing,
        category: cat,
      };
    }
    // Trả về ngân sách rỗng giả định nếu chưa được khởi tạo trong DB
    return {
      id: `temp-${cat.id}`,
      user_id: user.id,
      category_id: cat.id,
      amount_limit: 0,
      amount_spent: 0,
      month_year: monthYear,
      category: cat,
    };
  });

  return result;
}

/**
 * Thiết lập hoặc cập nhật hạn mức ngân sách cho một danh mục.
 */
export async function updateBudgetLimit(
  categoryId: string,
  monthYear: string,
  newLimit: number
): Promise<Budget> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // Thực hiện Upsert
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        amount_limit: newLimit,
        month_year: monthYear,
      },
      { onConflict: 'user_id,category_id,month_year' }
    )
    .select('*, category:categories!category_id(id, name, icon, color)')
    .single();

  if (error) {
    throw new Error(`Lỗi thiết lập ngân sách: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/budgets');

  return data as unknown as Budget;
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
  const user = await getCachedUser();

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

/**
 * Thống kê dữ liệu thu nhập và chi tiêu của 7 ngày gần nhất để vẽ biểu đồ theo tuần.
 * Sử dụng múi giờ Việt Nam (Asia/Ho_Chi_Minh) để nhóm dữ liệu chính xác theo ngày.
 */
export async function getWeeklyAnalyticsData(): Promise<MonthAnalytics[]> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Tính ngày bắt đầu (7 ngày trước ở múi giờ VN, tính từ 00:00:00 của ngày đó)
  const now = new Date();
  
  // Format sang định dạng VN
  const getVNFormat = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  };

  const getVNLabel = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const weekdayEN = parts.find(p => p.type === 'weekday')?.value;
    
    const map: Record<string, string> = {
      'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN'
    };
    const weekdayVN = map[weekdayEN || ''] || 'T2';
    return `${weekdayVN} (${day}/${month})`;
  };

  // Khởi tạo danh sách 7 ngày gần nhất (GMT+7)
  const daysList: { key: string; label: string }[] = [];
  const analyticsMap = new Map<string, { income: number; expense: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = getVNFormat(d);
    const label = getVNLabel(d);
    daysList.push({ key, label });
    analyticsMap.set(key, { income: 0, expense: 0 });
  }

  // Lấy ngày bắt đầu ở định dạng ISO từ ngày đầu tiên của danh sách
  // Để tối ưu hóa truy vấn, chúng ta lấy mốc thời gian từ 7 ngày trước lúc 00:00:00 VN
  const firstDay = new Date(now);
  firstDay.setDate(now.getDate() - 6);
  firstDay.setHours(0, 0, 0, 0);

  // 2. Truy vấn giao dịch thành công (SUCCESS) trong 7 ngày qua
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'SUCCESS')
    .gte('created_at', firstDay.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy dữ liệu thống kê tuần: ${error.message}`);
  }

  // 3. Phân loại và cộng dồn theo ngày của múi giờ VN
  if (transactions) {
    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      const key = getVNFormat(txDate);
      
      const stats = analyticsMap.get(key);
      if (stats) {
        const amount = Number(tx.amount);
        if (tx.type === 'INCOME') {
          stats.income += amount;
        } else if (tx.type === 'EXPENSE') {
          stats.expense += amount;
        }
      }
    });
  }

  // 4. Trả về mảng dữ liệu có tên nhãn gọn gàng cho X-axis
  return daysList.map((d) => {
    const stats = analyticsMap.get(d.key) || { income: 0, expense: 0 };
    return {
      name: d.label,
      income: stats.income,
      expense: stats.expense,
    };
  });
}
