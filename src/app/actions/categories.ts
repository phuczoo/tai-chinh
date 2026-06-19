'use server';

import { createClient } from '@/lib/supabase/server';
import { Category } from '@/types';
import { revalidatePath } from 'next/cache';

// Các danh mục mặc định dự phòng nếu người dùng chưa có danh mục nào
const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', icon: 'Utensils', color: '#e5c158' },
  { name: 'Cố định', icon: 'Home', color: '#60a5fa' },
  { name: 'Giáo dục', icon: 'GraduationCap', color: '#c084fc' },
  { name: 'Mua sắm', icon: 'ShoppingBag', color: '#f472b6' },
  { name: 'Di chuyển', icon: 'Car', color: '#fb923c' },
  { name: 'Khác', icon: 'MoreHorizontal', color: '#9ca3af' },
];

/**
 * Lấy danh sách danh mục của user đang đăng nhập.
 * Nếu chưa có danh mục nào, tự động khởi tạo 6 danh mục mặc định.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Người dùng chưa đăng nhập.');
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy danh sách danh mục: ${error.message}`);
  }

  // Khởi tạo dự phòng nếu chưa có danh mục nào
  if (!data || data.length === 0) {
    const toInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: user.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert(toInsert)
      .select();

    if (insertError) {
      throw new Error(`Lỗi khởi tạo danh mục mặc định: ${insertError.message}`);
    }

    return inserted as Category[];
  }

  return data as Category[];
}

/**
 * Thêm mới một danh mục chi tiêu tùy chỉnh.
 */
export async function createCategory(name: string, icon: string, color: string): Promise<Category> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
  const { data: { user } } = await supabase.auth.getUser();

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
