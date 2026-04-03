'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '📊', exact: true },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/guides', label: 'Guides', icon: '📖' },
  { href: '/admin/aptitude', label: 'Aptitude Qs', icon: '🧠' },
  { href: '/admin/rtr', label: 'RTR Tests', icon: '📡' },
  { href: '/admin/exams', label: 'Exams (Pariksha)', icon: '🎓' },
  { href: '/admin/purchases', label: 'Purchases', icon: '💳' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={`flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-neutral-800">
        <div className="w-9 h-9 bg-violet rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">PN</div>
        {!collapsed && (
          <div>
            <p className="font-black text-white text-sm">Pilot Note</p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-neutral-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                active
                  ? 'bg-violet/20 text-violet border border-violet/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span className="text-xl flex-shrink-0 leading-none">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
        >
          <span className="text-xl leading-none">↗</span>
          {!collapsed && <span className="text-sm font-semibold">Back to Site</span>}
        </Link>
      </div>
    </aside>
  );
}
