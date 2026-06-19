'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutGrid, 
  ArrowLeftRight, 
  PiggyBank, 
  BarChart3, 
  LogOut, 
  User, 
  Menu, 
  X,
  Wallet
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Người dùng');
      }
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutGrid },
    { name: 'Giao dịch', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Ngân sách', path: '/budgets', icon: PiggyBank },
    { name: 'Thống kê', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-charcoal text-white">
      {/* ==========================================
          DESKTOP LEFT SIDEBAR
          ========================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-[#161924] border-r border-brand-border p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-gold to-[#bfa145] flex items-center justify-center shadow-md shadow-brand-gold/10">
              <Wallet className="w-5 h-5 text-brand-charcoal" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Antigravity <span className="text-brand-gold font-medium">Fin</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-brand-gold text-brand-charcoal shadow-md shadow-brand-gold/15'
                      : 'text-brand-text-soft hover:text-white hover:bg-brand-card'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-6 border-t border-brand-border space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#232736] flex items-center justify-center border border-brand-border">
              <User className="w-5 h-5 text-brand-gold" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-brand-text-soft truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neon-rose hover:bg-neon-rose/10 transition duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ==========================================
          MOBILE HEADER
          ========================================== */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#161924] border-b border-brand-border z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-gold to-[#bfa145] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-brand-charcoal" />
          </div>
          <span className="font-bold text-base text-white">
            Antigravity <span className="text-brand-gold">Fin</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-brand-gold focus:outline-none cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-brand-charcoal/95 backdrop-blur-md z-30 flex flex-col p-6 justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-semibold cursor-pointer transition ${
                    isActive
                      ? 'bg-brand-gold text-brand-charcoal'
                      : 'text-brand-text-soft hover:text-white hover:bg-brand-card'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-brand-border space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#232736] flex items-center justify-center border border-brand-border">
                <User className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{userName}</p>
                <p className="text-xs text-brand-text-soft">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-base font-bold text-neon-rose bg-neon-rose/10 hover:bg-neon-rose/20 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* ==========================================
          MOBILE BOTTOM NAVIGATION (Feels like native app)
          ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161924]/90 backdrop-blur-md border-t border-brand-border flex justify-around items-center px-4 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition duration-150 cursor-pointer ${
                isActive ? 'text-brand-gold' : 'text-brand-text-soft'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
