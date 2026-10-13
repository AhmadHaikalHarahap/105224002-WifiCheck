'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  ClipboardCheck,
  History,
} from 'lucide-react';

// Navigation items configuration
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/check', label: 'New Assessment', icon: ClipboardCheck },
  { href: '/history', label: 'Assessment History', icon: History },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-white">
      {/* App branding */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <Shield className="h-8 w-8 text-primary-light" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-bold tracking-tight">WiFi Check</h1>
          <p className="text-xs text-slate-400">Understand Your Wi-Fi Security</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-primary-light'
                      : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500">v0.1 — Milestone 1</p>
      </div>
    </aside>
  );
}
