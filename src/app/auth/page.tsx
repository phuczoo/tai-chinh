'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage(
            'Đăng ký thành công! Hãy kiểm tra email để xác minh tài khoản, hoặc thử đăng nhập lại.'
          );
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không chính xác.' : signInError.message);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-[#0d0f14] via-[#12141c] to-[#1a1d29] overflow-hidden">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-neon-emerald/5 blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-gold to-[#bfa145] flex items-center justify-center shadow-lg shadow-brand-gold/20 mb-3 border border-brand-gold/30">
            <Wallet className="w-6 h-6 text-brand-charcoal" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Antigravity <span className="text-brand-gold">Finance</span>
          </h1>
          <p className="text-brand-text-soft text-sm mt-1">
            Hệ thống quản lý tài chính cá nhân tối giản & cao cấp
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
          
          <h2 className="text-xl font-semibold text-white mb-6">
            {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập vào hệ thống'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Input Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="name">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-brand-text-soft/60" />
                  </span>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#141722] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition duration-200"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="email">
                Địa chỉ Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-brand-text-soft/60" />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#141722] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-text-soft/60" />
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141722] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Feedback Banners */}
            {error && (
              <div className="p-3 bg-neon-rose/10 border border-neon-rose/20 text-neon-rose text-xs rounded-xl text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-neon-emerald/10 border border-neon-emerald/20 text-neon-emerald text-xs rounded-xl text-center">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-semibold text-sm rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-brand-gold/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Đăng ký ngay' : 'Đăng nhập'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-xs text-brand-text-soft hover:text-brand-gold transition duration-200 underline underline-offset-4 cursor-pointer"
            >
              {isSignUp
                ? 'Đã có tài khoản? Đăng nhập tại đây'
                : 'Chưa có tài khoản? Tạo tài khoản mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
