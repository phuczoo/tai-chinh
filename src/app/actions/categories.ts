'use server';

import { getCachedUser } from '@/lib/auth-check';

import { createClient } from '@/lib/supabase/server';
import { Category } from '@/types';
import { revalidatePath } from 'next/cache';

// Các danh mục mặc định dự phòng nếu người dùng chưa có danh mục nào
const DEFAULT_CATEGORIES = [
  // Khoản chi (Expense)
  { name: 'Ăn uống', icon: 'Utensils', color: '#e5c158', type: 'EXPENSE' },
  { name: 'Cố định', icon: 'Home', color: '#60a5fa', type: 'EXPENSE' },
  { name: 'Giáo dục', icon: 'GraduationCap', color: '#c084fc', type: 'EXPENSE' },
  { name: 'Mua sắm', icon: 'ShoppingBag', color: '#f472b6', type: 'EXPENSE' },
  { name: 'Di chuyển', icon: 'Car', color: '#fb923c', type: 'EXPENSE' },
  { name: 'Khác', icon: 'MoreHorizontal', color: '#9ca3af', type: 'EXPENSE' },
  // Khoản thu (Income)
  { name: 'Lương', icon: 'Wallet', color: '#10b981', type: 'INCOME' },
  { name: 'Thưởng', icon: 'Gift', color: '#ec4899', type: 'INCOME' },
  { name: 'Đầu tư', icon: 'TrendingUp', color: '#3b82f6', type: 'INCOME' },
  { name: 'Kinh doanh', icon: 'Briefcase', color: '#f59e0b', type: 'INCOME' },
  { name: 'Thu nhập khác', icon: 'Coins', color: '#a855f7', type: 'INCOME' },
];

/**
 * Lấy danh sách danh mục của user đang đăng nhập.
 * Nếu chưa có danh mục nào, tự động khởi tạo các danh mục mặc định.
 * Hỗ trợ lọc theo loại danh mục (Thu nhập hoặc Chi tiêu).
 */
export async function getCategories(type?: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  // 1. Lấy toàn bộ danh mục của user trước
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy danh sách danh mục: ${error.message}`);
  }

  let categoriesList = data || [];

  // 2. Khởi tạo dự phòng nếu chưa có bất kỳ danh mục nào
  if (categoriesList.length === 0) {
    const toInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: user.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert(toInsert)
      .select();

    if (insertError) {
      throw new Error(`Lỗi khởi tạo danh mục mặc định: ${insertError.message}`);
    }

    categoriesList = inserted as Category[];
  }

  // 3. Nếu có tham số lọc type, trả về danh mục tương ứng
  if (type) {
    return categoriesList.filter(c => c.type === type) as Category[];
  }

  return categoriesList as Category[];
}

/**
 * Thêm mới một danh mục tùy chỉnh.
 */
export async function createCategory(
  name: string,
  icon: string,
  color: string,
  type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
): Promise<Category> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  if (!name.trim()) {
    throw new Error('Tên danh mục không được để trống.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: name.trim(),
      icon,
      color,
      type,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Danh mục này đã tồn tại.');
    }
    throw new Error(`Lỗi tạo danh mục: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/budgets');
  revalidatePath('/transactions');

  return data as Category;
}

/**
 * Xóa một danh mục chi tiêu.
 * Các giao dịch thuộc danh mục này sẽ có category_id = null (ON DELETE SET NULL).
 * Các hạn mức ngân sách liên quan sẽ bị xóa (ON DELETE CASCADE).
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Chỉ được xóa danh mục của chính mình

  if (error) {
    throw new Error(`Lỗi xóa danh mục: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/budgets');
  revalidatePath('/transactions');
}
