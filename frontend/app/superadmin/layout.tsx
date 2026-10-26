'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DashboardShell,
  DashboardNavItem,
  HomeIcon,
  ListIcon,
  TemplateIcon,
  CommunicationsIcon,
  AcademicIcon,
  UserIcon,
  CurrencyIcon,
  SettingsIcon,
  ReportIcon,
} from '@/components/layout/DashboardShell';
import { auth } from '@/lib/auth';
import { refreshSessionUser } from '@/lib/sessionUser';
import type { ModulePermission, User } from '@/types';
import {
  PERMISSION_MODULES,
  DASHBOARD_PERMISSION_KEY,
  PermissionModuleKey,
  getFirstAccessiblePage,
} from '@/constants/permissions';
import {
  admissionTabsFromStored,
  joiningExtrasFromStored,
  joiningPagesFromStored,
} from '@/lib/joiningPermissions';
import { TestNotificationsButton } from '@/components/TestNotificationsButton';
import { Loading } from '@/components/Loading';

const BASE_NAV_ITEMS: DashboardNavItem[] = [
  { href: '/superadmin/dashboard', label: 'Overview', icon: HomeIcon, permissionKey: DASHBOARD_PERMISSION_KEY },
  {
    href: '/superadmin/leads',
    label: 'Leads',
    icon: ListIcon,
    permissionKey: 'leads',
  },
  {
    href: '/superadmin/joining',
    label: 'Joining Desk',
    icon: AcademicIcon,
    permissionKey: 'joining',
    children: [
      { href: '/superadmin/joining/confirmed', label: 'Confirmed Leads', icon: ListIcon, permissionKey: 'joining', joiningPage: 'confirmed' },
      { href: '/superadmin/joining/self-registration', label: 'Self Registration', icon: TemplateIcon, permissionKey: 'joining', joiningPage: 'self-registration' },
      { href: '/superadmin/joining/pipeline', label: 'Joining Pipeline', icon: AcademicIcon, permissionKey: 'joining', joiningPage: 'pipeline' },
      // { href: '/superadmin/joining/fee-requests', label: 'Fee Requests', icon: CurrencyIcon, permissionKey: 'joining', joiningPage: 'fee-requests' },
      { href: '/superadmin/joining/completed', label: 'Admissions', icon: AcademicIcon, permissionKey: 'joining', joiningPage: 'admissions' },
    ],
  },
  {
    href: '/superadmin/payments',
    label: 'Payments',
    icon: CurrencyIcon,
    permissionKey: 'payments',
    children: [
      { href: '/superadmin/payments/courses', label: 'Courses & Branches', icon: ListIcon, permissionKey: 'payments' },
      { href: '/superadmin/payments/settings', label: 'Fee Configuration', icon: SettingsIcon, permissionKey: 'payments' },
      { href: '/superadmin/payments/transactions', label: 'Transactions', icon: TemplateIcon, permissionKey: 'payments' },
    ],
  },
  { href: '/superadmin/users', label: 'User Management', icon: UserIcon, permissionKey: 'users' },
  { href: '/superadmin/whatsapp/chat', label: 'WhatsApp Chat', icon: CommunicationsIcon, permissionKey: 'communications' },
  { href: '/superadmin/communications/templates', label: 'Communications', icon: CommunicationsIcon, permissionKey: 'communications' },
  { href: '/superadmin/form-builder', label: 'Lead Form Builder', icon: TemplateIcon, permissionKey: 'formBuilder' },
  { href: '/superadmin/master-data', label: 'Districts & Mandals', icon: AcademicIcon, permissionKey: 'masterData' },
  { href: '/superadmin/utm-builder', label: 'UTM Builder', icon: TemplateIcon, permissionKey: 'utmBuilder' },
  { href: '/superadmin/visitors', label: 'Visitors', icon: UserIcon, permissionKey: 'visitors' },
  { href: '/superadmin/reports', label: 'Reports', icon: ReportIcon, permissionKey: 'reports' },
  { href: '/superadmin/profile', label: 'Profile & Settings', icon: UserIcon, permissionKey: 'dashboard' },
];

const buildFullAccessPermissions = (): Record<PermissionModuleKey, ModulePermission> => {
  const permissions: Record<PermissionModuleKey, ModulePermission> = {} as Record<
    PermissionModuleKey,
    ModulePermission
  >;

  PERMISSION_MODULES.forEach((module) => {
    permissions[module.key] =
      module.key === 'joining'
        ? {
            access: true,
            permission: 'write',
            editReference: true,
            editAdmission: true,
            activateAdmission: true,
            approveFeeRequest: true,
            pageConfirmedLeads: true,
            pageSelfRegistration: true,
            pageJoiningPipeline: true,
            pageFeeRequests: true,
            pageAdmissions: true,
            admissionTabAbstract: true,
            admissionTabStudentInfo: true,
            admissionTabReference: true,
            admissionTabSource: true,
            admissionTabDateWise: true,
          }
        : {
            access: true,
            permission: 'write',
          };
  });

  return permissions;
};

const sanitizeSubAdminPermissions = (
  permissions?: Record<string, ModulePermission>
): Record<PermissionModuleKey, ModulePermission> => {
  const sanitized: Record<PermissionModuleKey, ModulePermission> = {} as Record<
    PermissionModuleKey,
    ModulePermission
  >;

  PERMISSION_MODULES.forEach((module) => {
    const entry =
      permissions?.[module.key] ||
      (module.key === 'users' ? permissions?.['userManagement'] : undefined);
    if (entry?.access) {
      const permission = entry.permission === 'write' ? 'write' : 'read';
      if (module.key === 'joining') {
        const typedEntry = entry as import('@/types').ModulePermission;
        const joiningExtras = joiningExtrasFromStored(typedEntry);
        const allowedColleges = Array.isArray(typedEntry.allowedColleges)
          ? typedEntry.allowedColleges.filter((id) => typeof id === 'string')
          : undefined;
        sanitized[module.key] = {
          access: true,
          permission,
          ...joiningPagesFromStored(typedEntry),
          ...admissionTabsFromStored(typedEntry),
          ...(permission === 'write'
            ? {
                editReference: joiningExtras.editReference,
                editAdmission: joiningExtras.editAdmission,
                activateAdmission: joiningExtras.activateAdmission,
                approveFeeRequest: joiningExtras.approveFeeRequest,
                requireStudentPhoto: joiningExtras.requireStudentPhoto,
              }
            : {}),
          ...(allowedColleges ? { allowedColleges } : {}),
        };
      } else {
        sanitized[module.key] = {
          access: true,
          permission,
        };
      }
    } else {
      sanitized[module.key] = {
        access: false,
        permission: 'read',
      };
    }
  });

  return sanitized;
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorised, setIsAuthorised] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const cached = auth.getUser();
      if (!cached) {
        router.replace('/auth/login');
        return;
      }

      const hasAdminAccess = (u: User) => {
        if (
          u.roleName === 'Super Admin' ||
          u.roleName === 'Sub Super Admin' ||
          u.roleName === 'Data Entry User'
        ) {
          return true;
        }
        if (u.permissions && typeof u.permissions === 'object') {
          return Object.entries(u.permissions).some(
            ([k, v]) =>
              k !== 'allowedSources' &&
              v &&
              typeof v === 'object' &&
              (v as { access?: boolean }).access === true
          );
        }
        return false;
      };

      if (!hasAdminAccess(cached)) {
        router.replace('/user/dashboard');
        return;
      }

      let user = cached;
      if (cached.roleName !== 'Super Admin') {
        const fresh = await refreshSessionUser();
        if (!cancelled && fresh) {
          user = fresh;
        }
      }

      if (!cancelled) {
        setCurrentUser(user);
        setIsAuthorised(true);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!currentUser || currentUser.roleName === 'Super Admin') return;

    const applyFreshUser = (fresh: User | null) => {
      if (fresh) {
        setCurrentUser((prev) => (prev ? { ...prev, ...fresh, permissions: fresh.permissions } : fresh));
      }
    };

    const syncPermissions = () => {
      void refreshSessionUser().then(applyFreshUser);
    };

    const onPermissionsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; roleName?: string }>).detail;
      const userId = detail?.userId;
      const roleName = detail?.roleName;
      if (!userId && !roleName) {
        syncPermissions();
        return;
      }
      if (userId && userId === currentUser._id) {
        syncPermissions();
        return;
      }
      if (
        roleName &&
        String(roleName).trim().toLowerCase() === String(currentUser.roleName || '').trim().toLowerCase()
      ) {
        syncPermissions();
        return;
      }
    };

    window.addEventListener('focus', syncPermissions);
    window.addEventListener('crm-session-permissions-changed', onPermissionsChanged);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncPermissions();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', syncPermissions);
      window.removeEventListener('crm-session-permissions-changed', onPermissionsChanged);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentUser]);

  const permissionConfig = useMemo(() => {
    if (!currentUser) {
      return buildFullAccessPermissions();
    }

    if (currentUser.roleName === 'Super Admin') {
      return buildFullAccessPermissions();
    }

    // Dynamic resolution based strictly on effective permissions
    return sanitizeSubAdminPermissions(
      (currentUser.permissions || {}) as unknown as Record<string, ModulePermission>
    );
  }, [currentUser]);

  const navItems = useMemo(() => {
    const isElevatedAdmin = currentUser?.roleName === 'Super Admin' || currentUser?.roleName === 'Sub Super Admin';
    if (isElevatedAdmin) return BASE_NAV_ITEMS;
    // For role-assigned users, hide the global overview analytics dashboard
    return BASE_NAV_ITEMS.filter((item) => item.permissionKey !== DASHBOARD_PERMISSION_KEY);
  }, [currentUser]);

  // Route Access Guard: Redirect non-superadmin users away from modules they don't have permission for
  useEffect(() => {
    if (!currentUser || !isAuthorised) return;
    if (currentUser.roleName === 'Super Admin' || currentUser.roleName === 'Sub Super Admin') return;

    const getRequiredPermissionForPath = (path: string): PermissionModuleKey | 'dashboard' | 'profile' | null => {
      if (path.startsWith('/superadmin/dashboard')) return 'dashboard';
      if (path.startsWith('/superadmin/leads')) return 'leads';
      if (path.startsWith('/superadmin/joining')) return 'joining';
      if (path.startsWith('/superadmin/payments')) return 'payments';
      if (path.startsWith('/superadmin/users')) return 'users';
      if (path.startsWith('/superadmin/communications') || path.startsWith('/superadmin/whatsapp')) return 'communications';
      if (path.startsWith('/superadmin/form-builder')) return 'formBuilder';
      if (path.startsWith('/superadmin/master-data')) return 'masterData';
      if (path.startsWith('/superadmin/utm-builder')) return 'utmBuilder';
      if (path.startsWith('/superadmin/visitors')) return 'visitors';
      if (path.startsWith('/superadmin/reports')) return 'reports';
      if (path.startsWith('/superadmin/profile')) return 'profile';
      return null;
    };

    const requiredKey = getRequiredPermissionForPath(pathname);
    if (!requiredKey || requiredKey === 'profile') return;

    if (requiredKey === 'dashboard') {
      const dest = getFirstAccessiblePage(permissionConfig, currentUser.roleName);
      if (dest !== pathname) {
        router.replace(dest);
      }
      return;
    }

    const hasModuleAccess = Boolean(permissionConfig[requiredKey]?.access);
    if (!hasModuleAccess) {
      const dest = getFirstAccessiblePage(permissionConfig, currentUser.roleName);
      if (dest !== pathname) {
        router.replace(dest);
      }
    }
  }, [currentUser, isAuthorised, pathname, permissionConfig, router]);

  const roleLabel = currentUser?.roleName ?? 'Super Admin';
  const userName = currentUser?.name ?? 'Super Admin';

  const useMobileBottomNav = useMemo(() => {
    if (currentUser?.roleName !== 'Sub Super Admin') return false;
    if (!pathname) return false;
    if (pathname === '/superadmin/leads') return true;
    const leadSubRoutes = new Set(['upload', 'assign', 'individual', 'group-update']);
    const match = pathname.match(/^\/superadmin\/leads\/([^/]+)$/);
    if (match && !leadSubRoutes.has(match[1])) return true;
    return false;
  }, [pathname, currentUser?.roleName]);

  if (!isAuthorised) {
    return <Loading />;
  }

  return (
    <DashboardShell
      navItems={navItems}
      title=""
      description=""
      role={roleLabel}
      roleName={roleLabel}
      userName={userName}
      permissions={permissionConfig}
      useMobileBottomNav={useMobileBottomNav}
    >
      {children}
      {/* Floating Test Notifications Button - Only for Super Admin */}
      {currentUser?.roleName === 'Super Admin' && <TestNotificationsButton />}
    </DashboardShell>
  );
}
