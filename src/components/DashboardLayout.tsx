'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
        setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User');
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#090a0f] text-white">
      {/* ==========================================
          DESKTOP LEFT SLIM SIDEBAR
          ========================================== */}
      <aside className="hidden md:flex flex-col w-[80px] bg-[#0c0d12]/60 border-r border-brand-border py-8 items-center justify-between shrink-0 z-20 backdrop-blur-md print:hidden">
        <div className="flex flex-col items-center gap-10 w-full">
          {/* Logo */}
          <Link 
            href="/"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-[#bfa145] flex items-center justify-center shadow-lg shadow-brand-gold/10 hover:scale-105 transition"
            title="Antigravity Finance"
          >
            <Wallet className="w-5 h-5 text-brand-charcoal" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-3 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <div key={item.path} className="relative group w-full flex justify-center">
                  <Link
                    href={item.path}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
                      isActive
                        ? 'bg-[#1b1e28] text-brand-gold border border-brand-gold/20 shadow-md shadow-brand-gold/5'
                        : 'text-brand-text-soft hover:text-white hover:bg-brand-card/40'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    
                    {/* Active vertical accent bar */}
                    {isActive && (
                      <span className="absolute left-[-8px] top-1/4 bottom-1/4 w-[3px] bg-brand-gold rounded-r-md" />
                    )}
                  </Link>
                  
                  {/* Premium Hover Tooltip */}
                  <span className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-[#12141c] border border-brand-border text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 shadow-xl whitespace-nowrap z-50">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="flex flex-col items-center gap-6 w-full px-2">
          {/* User profile with tooltip */}
          <div className="relative group w-full flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[#1b1e28] flex items-center justify-center border border-brand-border cursor-pointer hover:border-brand-gold/45 transition">
              <User className="w-4.5 h-4.5 text-brand-gold" />
            </div>
            <div className="absolute left-[70px] bottom-0 bg-[#12141c] border border-brand-border p-3 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 shadow-xl z-50 w-44">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-brand-text-soft truncate mt-0.5">{userEmail}</p>
            </div>
          </div>

          {/* Logout */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-neon-rose/85 hover:text-neon-rose hover:bg-neon-rose/10 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
            </button>
            <span className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-[#12141c] border border-brand-border text-[10px] font-bold text-neon-rose px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 shadow-xl whitespace-nowrap z-50">
              Đăng xuất
            </span>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MOBILE HEADER
          ========================================== */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#0c0d12]/90 border-b border-brand-border z-20 sticky top-0 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-gold to-[#bfa145] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-brand-charcoal" />
          </div>
          <span className="font-bold text-base text-white">
            Antigravity <span className="text-brand-gold font-medium">Fin</span>
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
        <div className="md:hidden fixed inset-0 top-[65px] bg-[#090a0f]/95 backdrop-blur-md z-30 flex flex-col p-6 justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-semibold cursor-pointer transition ${
                    isActive
                      ? 'bg-[#1b1e28] text-brand-gold border border-brand-gold/10'
                      : 'text-brand-text-soft hover:text-white hover:bg-[#12141c]/50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-brand-border space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1b1e28] flex items-center justify-center border border-brand-border">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0c0d12]/90 backdrop-blur-md border-t border-brand-border flex justify-around items-center px-4 z-20 print:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition duration-150 cursor-pointer ${
                isActive ? 'text-brand-gold' : 'text-brand-text-soft'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
