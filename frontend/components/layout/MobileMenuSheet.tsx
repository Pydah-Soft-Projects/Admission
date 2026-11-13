'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from '../NotificationBell';
import type { DashboardNavItem } from './DashboardShell';
import { flattenNavItemsForMobile } from './MobileBottomNav';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: DashboardNavItem[];
  userName?: string;
  /** Workspace / designation (e.g. shown as "{role} Space" when distinct from roleName) */
  role?: string;
  /** System role label (e.g. Student Counselor, PRO) */
  roleName?: string;
  onLogout: () => void;
}

export function MobileMenuSheet({
  isOpen,
  onClose,
  navItems,
  userName,
  role,
  roleName,
  onLogout,
}: MobileMenuSheetProps) {
  const pathname = usePathname() || '';
  const flatItems = flattenNavItemsForMobile(navItems);
  const safeUserName = (userName || 'User').replace(/pydah/gi, 'Campo');
  const safeRoleName = roleName ? roleName.replace(/pydah/gi, 'Campo') : roleName;
  const safeRole = role ? role.replace(/pydah/gi, 'Campo') : role;

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 cursor-pointer bg-slate-900/50 transition-opacity lg:hidden"
        aria-hidden
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderColor: 'var(--border, #e2e8f0)',
          color: 'var(--text-primary, #0f172a)',
        }}
        role="dialog"
        aria-label="Menu"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div 
            className="h-1 w-12 rounded-full" 
            style={{ backgroundColor: 'var(--border-strong, #cbd5e1)' }}
          />
        </div>

        <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* Nav links */}
          <nav className="space-y-1 py-2">
            {flatItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                    active ? 'font-semibold' : 'hover:opacity-90'
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--primary-light, #ffedd5)',
                          color: 'var(--primary, #c2410c)',
                        }
                      : {
                          color: 'var(--sidebar-text, inherit)',
                        }
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  {Icon && (
                    <Icon 
                      className="h-5 w-5 shrink-0" 
                      style={{
                        color: active ? 'var(--primary, #c2410c)' : 'var(--sidebar-muted, #64748b)',
                      }}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div 
            className="my-4 border-t" 
            style={{ borderColor: 'var(--border, #e2e8f0)' }}
          />

          {/* User row + Notifications + Logout */}
          <div 
            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{
              backgroundColor: 'var(--background, #f8fafc)',
              borderColor: 'var(--border, #e2e8f0)',
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
                style={{ backgroundColor: 'var(--primary, #ea580c)' }}
              >
                {(safeUserName || 'U').slice(0, 2)}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p 
                  className="truncate font-medium"
                  style={{ color: 'var(--text-primary, #0f172a)' }}
                >
                  {safeUserName}
                </p>
                {safeRoleName ? (
                  <p 
                    className="truncate text-xs font-medium"
                    style={{ color: 'var(--text-secondary, #64748b)' }}
                  >
                    {safeRoleName}
                  </p>
                ) : null}
                {safeRole && safeRole !== safeRoleName ? (
                  <p 
                    className="truncate text-[11px]"
                    style={{ color: 'var(--text-muted, #94a3b8)' }}
                  >
                    {safeRole} Space
                  </p>
                ) : !safeRoleName && safeRole ? (
                  <p 
                    className="truncate text-xs"
                    style={{ color: 'var(--text-muted, #94a3b8)' }}
                  >
                    {safeRole} Space
                  </p>
                ) : !safeRoleName && !safeRole ? (
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--text-muted, #94a3b8)' }}
                  >
                    Workspace
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                style={{ color: 'var(--danger, #dc2626)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
