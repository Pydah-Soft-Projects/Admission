import type { ModulePermissionLevel } from '@/types';

export const DASHBOARD_PERMISSION_KEY = 'dashboard';

export type PermissionModuleKey =
  | 'leads'
  | 'joining'
  | 'payments'
  | 'users'
  | 'communications'
  | 'reports'
  | 'formBuilder'
  | 'masterData'
  | 'visitors'
  | 'utmBuilder';

export interface PermissionModuleDefinition {
  key: PermissionModuleKey;
  label: string;
  description: string;
}

export const PERMISSION_MODULES: PermissionModuleDefinition[] = [
  {
    key: 'leads',
    label: 'Leads',
    description: 'Capture individual leads, upload bulk lists, and distribute them to counsellors.',
  },
  {
    key: 'joining',
    label: 'Joining Desk',
    description:
      'Oversee joining progress, admissions, and the desk. Grant specific desk pages, Admissions tabs, and optional edit actions for Read & Write users.',
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Configure fee settings, manage course/branch directories, and reconcile transactions.',
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'Create, activate, and monitor team members with controlled access.',
  },
  {
    key: 'communications',
    label: 'Communications',
    description: 'Message templates and sending SMS to leads.',
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'View call reports and lead conversion analytics.',
  },
  {
    key: 'formBuilder',
    label: 'Lead Form Builder',
    description: 'Create and manage dynamic forms for lead generation.',
  },
  {
    key: 'utmBuilder',
    label: 'UTM URL Builder',
    description: 'Generate and track marketing campaign links with UTM parameters.',
  },
  {
    key: 'masterData',
    label: 'States, Districts & Mandals',
    description: 'Manage states, districts, mandals, schools, and college names for dropdowns and lead data.',
  },
  {
    key: 'visitors',
    label: 'Visitor Management',
    description: 'Track and manage walk-in visitors and their statuses.',
  },
];

export const DEFAULT_PERMISSION_LEVEL: ModulePermissionLevel = 'write';

export const getFirstAccessiblePage = (
  permissions?: Record<string, unknown> | null,
  roleName?: string
): string => {
  if (roleName === 'Super Admin' || roleName === 'Sub Super Admin') {
    return '/superadmin/dashboard';
  }

  const perms = (permissions || {}) as Record<string, { access?: boolean }>;

  if (perms.reports?.access) return '/superadmin/reports';
  if (perms.communications?.access) return '/superadmin/communications/templates';
  if (perms.leads?.access) {
    if (roleName === 'Data Entry User') return '/superadmin/leads/individual';
    return '/superadmin/leads';
  }
  if (perms.joining?.access) return '/superadmin/joining/confirmed';
  if (perms.payments?.access) return '/superadmin/payments/courses';
  if (perms.users?.access || perms.userManagement?.access) return '/superadmin/users';
  if (perms.visitors?.access) return '/superadmin/visitors';
  if (perms.formBuilder?.access) return '/superadmin/form-builder';
  if (perms.masterData?.access) return '/superadmin/master-data';
  if (perms.utmBuilder?.access) return '/superadmin/utm-builder';

  return '/superadmin/profile';
};
