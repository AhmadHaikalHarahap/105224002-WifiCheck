'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Shield,
  LayoutDashboard,
  ClipboardCheck,
  History,
} from 'lucide-react';

interface AppHeaderProps {
  title: string;
  description?: string;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/check', label: 'New Assessment', icon: ClipboardCheck },
  { href: '/history', label: 'Assessment History', icon: History },
];

export default function AppHeader({ title, description }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change during render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Close mobile menu on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-card-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Mobile: App name + menu button */}
          <div className="flex items-center gap-3 lg:hidden">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="font-bold text-foreground">WiFi Check</span>
          </div>

          {/* Desktop: Page title and description */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted mt-0.5">{description}</p>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Desktop: Status indicator */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden="true"></span>
            <span>Demo Mode</span>
          </div>
        </div>

        {/* Mobile: Page title below the top bar */}
        <div className="px-4 pb-3 lg:hidden">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted mt-0.5">{description}</p>
          )}
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Shield className="h-7 w-7 text-primary-light" aria-hidden="true" />
                <span className="text-lg font-bold text-white">WiFi Check</span>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="px-3 py-4" aria-label="Main navigation">
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
                        onClick={() => setMobileMenuOpen(false)}
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
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10">
              <p className="text-xs text-slate-500">v0.1 — Milestone 1</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
