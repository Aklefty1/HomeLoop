'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homes', label: 'My Homes', icon: Home },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-56 flex-col border-r border-neutral-200 bg-white">
        <div className="px-5 py-5 border-b border-neutral-200">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            HomeLoop
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-50">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          HomeLoop
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-40 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-neutral-500 mt-4"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto">
        <div className="md:hidden h-14" /> {/* Spacer for mobile header */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
