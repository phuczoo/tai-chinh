import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Kiểm tra xác thực ở tầng Server Component.
 * Nếu chưa đăng nhập, tự động chuyển hướng (redirect) về trang /auth.
 * Tránh việc chỉ phụ thuộc hoàn toàn vào proxy/middleware ở tầng network routing.
 */
export async function checkAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return user;
}
