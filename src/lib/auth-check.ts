import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Hàm lấy thông tin user được lưu cache trong suốt vòng đời của 1 request (React 19 cache).
 * Giúp tối ưu hóa, tránh gọi API Auth của Supabase nhiều lần cùng lúc trên Server.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Kiểm tra xác thực ở tầng Server Component.
 * Nếu chưa đăng nhập, tự động chuyển hướng (redirect) về trang /auth.
 */
export async function checkAuth() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/auth');
  }

  return user;
}
