'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, leadAPI, roleAPI, RoleConfigItem } from '@/lib/api';
import { useInstitutions } from '@/lib/useInstitutions';
import type { User, ModulePermission, RoleName } from '@/types';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { showToast } from '@/lib/toast';
import { useDashboardHeader, useModulePermission } from '@/components/layout/DashboardShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PERMISSION_MODULES, PermissionModuleKey } from '@/constants/permissions';
import { JoiningModulePermissionExtras } from '@/components/users/JoiningModulePermissionExtras';
import {
  admissionTabsFromStored,
  defaultAdmissionTabExtras,
  defaultJoiningPageExtras,
  defaultJoiningPermissionExtras,
  joiningExtrasFromStored,
  joiningPagesFromStored,
  JOINING_PERMISSION_KEY,
  modulePermissionForSave,
} from '@/lib/joiningPermissions';
import { auth } from '@/lib/auth';
import { refreshSessionUser } from '@/lib/sessionUser';

// Action icons for table (Heroicons-style outline)
const IconPencil = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconTrash = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconList = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconCards = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const IconPhone = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const IconUserGroup = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconSearch = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconBadge = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconCheck = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconX = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
interface HrmsSearchResult {
  _id?: string;
  id?: string;
  emp_no?: string | number;
  name?: string;
  email?: string;
  mobileNumber?: string;
  division?: string;
  department?: string;
  group?: string;
  designation?: string;
}

const IconFileExport = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconCog = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconPlus = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const { setHeaderContent, clearHeaderContent } = useDashboardHeader();
  const router = useRouter();
  const { hasAccess: canAccessUsers, canWrite: canManageUsers } = useModulePermission('users');
  const currentUser = auth.getUser();
  const canDeleteUsers = canManageUsers && currentUser?.roleName !== 'Sub Super Admin';
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Role Configurations Query & State
  const { data: configuredRolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roleConfigurations'],
    queryFn: async () => roleAPI.getAll(),
  });
  const configuredRoles: RoleConfigItem[] = useMemo(() => {
    if (Array.isArray(configuredRolesData)) return configuredRolesData;
    if (Array.isArray((configuredRolesData as unknown as { data?: RoleConfigItem[] })?.data)) {
      return (configuredRolesData as unknown as { data: RoleConfigItem[] }).data;
    }
    return [];
  }, [configuredRolesData]);

  const [showRoleConfigModal, setShowRoleConfigModal] = useState(false);
  const [selectedRoleForConfig, setSelectedRoleForConfig] = useState<RoleConfigItem | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
    color: '#0ea5e9',
  });
  const [rolePermissionsDraft, setRolePermissionsDraft] = useState<Record<string, Record<string, unknown>>>({});
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Role Deletion & Transfer Modals
  const [roleToDelete, setRoleToDelete] = useState<RoleConfigItem | null>(null);
  const [showTransferDeleteModal, setShowTransferDeleteModal] = useState(false);
  const [transferTargetRole, setTransferTargetRole] = useState('');
  const [showDirectDeleteModal, setShowDirectDeleteModal] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  // Sync selected role when modal opens or roles load
  useEffect(() => {
    if (configuredRoles.length > 0 && !selectedRoleForConfig && !isCreatingRole) {
      setSelectedRoleForConfig(configuredRoles[0]);
      setRolePermissionsDraft(configuredRoles[0].permissions || {});
    }
  }, [configuredRoles, selectedRoleForConfig, isCreatingRole]);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    roleName: 'Student Counselor' as RoleName,
    designation: '',
    hrms_id: '',
    emp_no: '',
  });
  const createEmptyPermissions = () =>
    PERMISSION_MODULES.reduce(
      (acc, module) => ({
        ...acc,
        [module.key]: {
          access: false,
          permission: 'read' as ModulePermission['permission'],
          ...(module.key === JOINING_PERMISSION_KEY
            ? {
                ...defaultJoiningPermissionExtras(),
                ...defaultJoiningPageExtras(),
                ...defaultAdmissionTabExtras(),
              }
            : {}),
        },
      }),
      {} as Record<PermissionModuleKey, ModulePermission>
    );
  const [permissionState, setPermissionState] = useState<Record<PermissionModuleKey, ModulePermission>>(
    createEmptyPermissions()
  );
  const [editFormState, setEditFormState] = useState<{
    name: string;
    email: string;
    mobileNumber?: string;
    roleName: RoleName;
    designation: string;
    password?: string;
    hrms_id?: string;
    emp_no?: string;
  }>({
    name: '',
    email: '',
    mobileNumber: '',
    roleName: 'Student Counselor',
    designation: '',
    password: '',
    hrms_id: '',
    emp_no: '',
  });
  const [editPermissionState, setEditPermissionState] = useState<
    Record<PermissionModuleKey, ModulePermission>
  >(createEmptyPermissions());
  const [allowedSourcesState, setAllowedSourcesState] = useState<string[]>([]);
  const [editAllowedSourcesState, setEditAllowedSourcesState] = useState<string[]>([]);
  const { colleges } = useInstitutions();
  const collegeOptions = useMemo(
    () => colleges.map((college) => ({ id: college.id, name: college.name })),
    [colleges]
  );

  const { data: filterOptionsData } = useQuery({
    queryKey: ['leadFilterOptions'],
    queryFn: () => leadAPI.getFilterOptions(),
  });
  const allSources = useMemo(() => {
    return (filterOptionsData?.data?.sources || []) as string[];
  }, [filterOptionsData]);

  const [hrmsSearchTerm, setHrmsSearchTerm] = useState('');
  const [hrmsResults, setHrmsResults] = useState<HrmsSearchResult[]>([]);
  const [isSearchingHrms, setIsSearchingHrms] = useState(false);
  const [showTeamAssignmentModal, setShowTeamAssignmentModal] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userAPI.getAll();
      return response.data || response;
    },
    staleTime: 60000,
  });

  const users = useMemo(() => (data?.data || data || []) as User[], [data]);

  const getRoleStaffCount = useCallback((roleName?: string, fallbackCount = 0) => {
    if (!roleName) return fallbackCount;
    const target = roleName.trim().toLowerCase();
    if (Array.isArray(users) && users.length > 0) {
      return users.filter((u) => String(u.roleName || '').trim().toLowerCase() === target).length;
    }
    return fallbackCount;
  }, [users]);

  const activeRole: RoleConfigItem | null = useMemo(() => {
    if (isCreatingRole) return null;
    if (!selectedRoleForConfig) return configuredRoles[0] || null;
    return (
      configuredRoles.find(
        (r) =>
          r.id === selectedRoleForConfig.id ||
          String(r.name).trim().toLowerCase() === String(selectedRoleForConfig.name).trim().toLowerCase()
      ) || selectedRoleForConfig
    );
  }, [configuredRoles, selectedRoleForConfig, isCreatingRole]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      subAdmins: users.filter(u => u.roleName === 'Sub Super Admin').length,
      counselors: users.filter(u => u.roleName === 'Student Counselor').length,
      dataEntry: users.filter(u => u.roleName === 'Data Entry User').length,
      pro: users.filter(u => u.roleName === 'PRO').length,
      customRoles: users.filter(u => !['Super Admin', 'Sub Super Admin', 'Student Counselor', 'Data Entry User', 'PRO'].includes(u.roleName)).length,
    };
  }, [users]);

  const filterOptions = useMemo(() => {
    const divs = new Set<string>();
    const depts = new Set<string>();
    const groups = new Set<string>();
    const roles = new Set<string>();

    users.forEach(u => {
      if (u.division && u.division !== '-') divs.add(u.division);
      if (u.department && u.department !== '-') depts.add(u.department);
      if (u.group && u.group !== '-') groups.add(u.group);
      if (u.roleName) roles.add(u.roleName);
    });
    configuredRoles.forEach((r) => {
      if (r.name) roles.add(r.name);
    });

    return {
      divisions: Array.from(divs).sort(),
      departments: Array.from(depts).sort(),
      groups: Array.from(groups).sort(),
      roles: Array.from(roles).sort()
    };
  }, [users, configuredRoles]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search term filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || [user.name, user.email, user.mobileNumber, user.roleName, user.designation, user.emp_no].some((field) =>
        field?.toLowerCase().includes(term)
      );

      // Category filters
      const matchesDivision = selectedDivision === 'all' || user.division === selectedDivision;
      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      const matchesGroup = selectedGroup === 'all' || user.group === selectedGroup;
      const matchesRole = selectedRole === 'all' || user.roleName === selectedRole;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' ? user.isActive : !user.isActive);

      return matchesSearch && matchesDivision && matchesDepartment && matchesGroup && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedDivision, selectedDepartment, selectedGroup, selectedRole, selectedStatus]);

  const headerContent = useMemo(
    () => (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1 shadow-sm dark:border-[#334155] dark:bg-[#0f172a]">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${viewMode === 'list'
                ? 'bg-[#ffffff] text-[#334155] shadow dark:bg-[#1e293b] dark:text-[#f1f5f9]'
                : 'text-[#64748b] hover:text-[#334155] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]'
                }`}
              title="List View"
            >
              <IconList className="w-4 h-4 mr-1.5" /> List
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${viewMode === 'card'
                ? 'bg-[#ffffff] text-[#334155] shadow dark:bg-[#1e293b] dark:text-[#f1f5f9]'
                : 'text-[#64748b] hover:text-[#334155] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]'
                }`}
              title="Card View"
            >
              <IconCards className="w-4 h-4 mr-1.5" /> Cards
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreatingRole(false);
              const targetRole = selectedRoleForConfig || (configuredRoles.length > 0 ? configuredRoles[0] : null);
              if (targetRole) {
                setSelectedRoleForConfig(targetRole);
                setRolePermissionsDraft(targetRole.permissions || {});
              }
              setShowRoleConfigModal(true);
            }}
            className="h-9 shrink-0 px-3.5 font-semibold flex items-center gap-1.5 border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-200 rounded-xl shadow-xs"
          >
            <IconCog className="w-4 h-4 text-[#0ea5e9]" />
            <span>Role Configuration</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateUser(true)}
            disabled={!canManageUsers}
            className="h-9 shrink-0 px-4 font-medium"
          >
            Create User
          </Button>
        </div>
      </div>
    ),
    [viewMode, canManageUsers, configuredRoles, selectedRoleForConfig]
  );

  useEffect(() => {
    setHeaderContent(headerContent);
    return () => clearHeaderContent();
  }, [headerContent, setHeaderContent, clearHeaderContent]);

  useEffect(() => {
    if (!canAccessUsers) {
      router.replace('/superadmin/dashboard');
    }
  }, [canAccessUsers, router]);

  const createMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof userAPI.create>[0]) => userAPI.create(payload),
    onSuccess: () => {
      showToast.success('User created successfully');
      setFormState({ name: '', email: '', mobileNumber: '', password: '', roleName: 'Student Counselor', designation: '', hrms_id: '', emp_no: '' });
      setPermissionState(createEmptyPermissions());
      setShowCreateUser(false);
      setHrmsSearchTerm('');
      setHrmsResults([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ user, unassignLeads }: { user: User; unassignLeads?: boolean }) =>
      userAPI.update(user._id, { isActive: !user.isActive, unassignLeads }),
    onSuccess: (_, { user }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      // Update selected user detail if open
      if (selectedUserDetail && selectedUserDetail._id === user._id) {
        setSelectedUserDetail(prev => prev ? ({ ...prev, isActive: !prev.isActive }) : null);
      }
    },
    onError: () => {
      showToast.error('Unable to update user status');
    },
  });

  const assignTeamMemberMutation = useMutation({
    mutationFn: async ({ userId, managerId }: { userId: string; managerId: string | null }) =>
      userAPI.update(userId, { managedBy: managerId }),
    onSuccess: () => {
      showToast.success('Team assignment updated successfully');
      setShowTeamAssignmentModal(false);
      setSelectedUserForAssignment(null);
      setSelectedManagerId('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      setShowUserDetail(false); // Close detail modal after assignment to refresh context or start fresh
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(err.response?.data?.message || 'Failed to update team assignment');
    },
  });

  const toggleManagerRoleMutation = useMutation({
    mutationFn: async (user: User) => {
      // Toggle isManager boolean - this preserves the original roleName
      // Backend will handle clearing team members' managedBy when revoking
      const newIsManager = !user.isManager;
      return userAPI.update(user._id, { isManager: newIsManager });
    },
    onSuccess: (_, user) => {
      const action = user.isManager ? 'promoted to' : 'revoked';
      showToast.success(`User ${action} Manager successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      if (selectedUserDetail && selectedUserDetail._id === user._id) {
        setSelectedUserDetail(prev => prev ? ({ ...prev, isManager: !prev.isManager }) : null);
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(err.response?.data?.message || 'Failed to update user role');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Parameters<typeof userAPI.update>[1] }) =>
      userAPI.update(userId, data),
    onSuccess: async (_, { userId }) => {
      showToast.success('User updated successfully');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-session-permissions-changed', { detail: { userId } })
        );
      }
      const me = auth.getUser();
      if (me?._id === userId) {
        await refreshSessionUser();
      }
      setShowEditUser(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      setShowUserDetail(false);
      setHrmsSearchTerm('');
      setHrmsResults([]);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  const handleExportExcel = () => {
    try {
      if (filteredUsers.length === 0) {
        showToast.error('No data to export');
        return;
      }

      const exportData = filteredUsers.map(user => ({
        'Employee ID': user.emp_no || '-',
        'Name': user.name,
        'Email': user.email,
        'Mobile': user.mobileNumber || '-',
        'Division': user.division || '-',
        'Department': user.department || '-',
        'Group': user.group || '-',
        'Role': user.roleName,
        'Status': user.isActive ? 'Active' : 'Inactive',
        'Manager': typeof user.managedBy === 'object' ? user.managedBy?.name : (users.find(u => u._id === user.managedBy)?.name || '-')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Style adjustments if needed, though basic XLSX is limited
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `CRM_Users_Export_${date}.xlsx`);
      showToast.success('Excel export started');
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Failed to export Excel file');
    }
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => userAPI.delete(userId),
    onSuccess: () => {
      showToast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      setShowUserDetail(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  const managers = useMemo(() => {
    return users.filter((u) => u.isManager === true);
  }, [users]);

  // New state for user detail modal
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [detailPermissionsDraft, setDetailPermissionsDraft] = useState<Record<string, unknown>>({});
  const [detailAllowedSources, setDetailAllowedSources] = useState<string[]>([]);
  const [isEditingDetailSources, setIsEditingDetailSources] = useState(false);
  const [detailSourceSearch, setDetailSourceSearch] = useState('');
  const [isSavingDetailPermissions, setIsSavingDetailPermissions] = useState(false);

  useEffect(() => {
    if (selectedUserDetail) {
      setDetailPermissionsDraft(
        selectedUserDetail.permissions ? JSON.parse(JSON.stringify(selectedUserDetail.permissions)) : {}
      );
      setDetailAllowedSources(
        Array.isArray(selectedUserDetail.permissions?.allowedSources)
          ? [...selectedUserDetail.permissions.allowedSources]
          : []
      );
      setIsEditingDetailSources(false);
      setDetailSourceSearch('');
    }
  }, [selectedUserDetail]);

  useEffect(() => {
    if (selectedUserDetail?._id && Array.isArray(users) && users.length > 0) {
      const fresh = users.find((u) => u._id === selectedUserDetail._id);
      if (fresh && fresh !== selectedUserDetail) {
        setSelectedUserDetail(fresh);
      }
    }
  }, [users, selectedUserDetail]);

  const currentDetailRoleConfig = useMemo(() => {
    if (!selectedUserDetail?.roleName) return null;
    const target = String(selectedUserDetail.roleName).trim().toLowerCase();
    return configuredRoles.find((r) => String(r.name).trim().toLowerCase() === target || String(r.id).trim().toLowerCase() === target) || null;
  }, [selectedUserDetail?.roleName, configuredRoles]);

  const detailRoleBaseline = useMemo(() => {
    const raw = currentDetailRoleConfig?.permissions;
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return (raw || {}) as Record<
      string,
      { access?: boolean; permission?: 'read' | 'write' }
    >;
  }, [currentDetailRoleConfig]);

  const handleToggleDetailModulePermission = (moduleKey: string, isFromRole: boolean) => {
    setDetailPermissionsDraft((prev) => {
      const next = { ...prev };

      if (isFromRole) {
        // Toggle revocation for role baseline permission
        const currentRevoked = Array.isArray(next.revokedPermissions)
          ? [...(next.revokedPermissions as string[])]
          : [];
        const isCurrentlyRevoked =
          currentRevoked.includes(moduleKey) ||
          (moduleKey === 'users' && currentRevoked.includes('userManagement'));

        let nextRevoked: string[];
        if (isCurrentlyRevoked) {
          // Re-enable (restore to role baseline)
          nextRevoked = currentRevoked.filter(
            (k) => k !== moduleKey && k !== (moduleKey === 'users' ? 'userManagement' : '')
          );
        } else {
          // Revoke for this user
          nextRevoked = [...currentRevoked, moduleKey];
          if (moduleKey === 'users') {
            nextRevoked.push('userManagement');
          }
        }
        next.revokedPermissions = nextRevoked;
        return next;
      }

      // Non-role permission: toggle extra permission
      const currentExtras = {
        ...((next.extraPermissions as Record<string, ModulePermission>) || {}),
      };
      const current =
        currentExtras[moduleKey] ||
        (moduleKey === 'users' ? currentExtras.userManagement : undefined) ||
        {};
      const newAccess = !current.access;
      if (newAccess) {
        currentExtras[moduleKey] = {
          access: true,
          permission: current.permission || 'read',
          ...(moduleKey === JOINING_PERMISSION_KEY
            ? {
                ...defaultJoiningPermissionExtras(),
                ...defaultJoiningPageExtras(),
                ...defaultAdmissionTabExtras(),
              }
            : {}),
        };
        if (moduleKey === 'users') currentExtras.userManagement = currentExtras[moduleKey];
      } else {
        delete currentExtras[moduleKey];
        if (moduleKey === 'users') delete currentExtras['userManagement'];
        if (moduleKey === 'userManagement') delete currentExtras['users'];
      }
      next.extraPermissions = currentExtras;
      return next;
    });
  };

  const handleChangeDetailExtraPermissionLevel = (
    moduleKey: string,
    permission: 'read' | 'write'
  ) => {
    setDetailPermissionsDraft((prev) => {
      const next = { ...prev };
      const currentExtras = {
        ...((next.extraPermissions as Record<string, ModulePermission>) || {}),
      };
      const current =
        currentExtras[moduleKey] ||
        (moduleKey === 'users' ? currentExtras.userManagement : undefined) ||
        {};
      currentExtras[moduleKey] = {
        ...current,
        access: true,
        permission,
      };
      if (moduleKey === 'users') {
        currentExtras.userManagement = currentExtras[moduleKey];
      }
      next.extraPermissions = currentExtras;
      return next;
    });
  };

  const handleSaveDetailPermissionsAndSources = async () => {
    if (!selectedUserDetail) return;
    setIsSavingDetailPermissions(true);
    try {
      const extraPerms = (detailPermissionsDraft.extraPermissions || {}) as Record<string, ModulePermission>;
      const revokedPerms = Array.isArray(detailPermissionsDraft.revokedPermissions)
        ? (detailPermissionsDraft.revokedPermissions as string[])
        : [];

      const toSave: Record<string, unknown> = {
        ...detailRoleBaseline,
        allowedSources: detailAllowedSources,
        extraPermissions: extraPerms,
        revokedPermissions: revokedPerms,
      };

      // Strip revoked permissions from toSave top level
      revokedPerms.forEach((k) => {
        delete toSave[k];
        if (k === 'users') delete toSave['userManagement'];
        if (k === 'userManagement') delete toSave['users'];
      });

      // Overlay extra permissions
      Object.entries(extraPerms).forEach(([k, v]) => {
        if (v && typeof v === 'object' && v.access && !revokedPerms.includes(k)) {
          toSave[k] = v;
        }
      });
      if (toSave.users) {
        toSave.userManagement = toSave.users;
      } else if (toSave.userManagement) {
        toSave.users = toSave.userManagement;
      }
      await userAPI.update(selectedUserDetail._id, {
        permissions: toSave,
      });
      showToast.success(`User permissions & lead sources updated for ${selectedUserDetail.name}`);
      setSelectedUserDetail((prev) => (prev ? { ...prev, permissions: toSave } : null));
      setIsEditingDetailSources(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-session-permissions-changed', {
            detail: { userId: selectedUserDetail._id, roleName: selectedUserDetail.roleName },
          })
        );
      }
      const me = auth.getUser();
      if (me?._id === selectedUserDetail._id) {
        await refreshSessionUser();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update user permissions';
      showToast.error(msg);
    } finally {
      setIsSavingDetailPermissions(false);
    }
  };

  const handleRowClick = async (user: User) => {
    setSelectedUserDetail(user);
    setShowUserDetail(true);
    setDetailPermissionsDraft(user.permissions ? JSON.parse(JSON.stringify(user.permissions)) : {});
    setDetailAllowedSources(
      Array.isArray(user.permissions?.allowedSources) ? [...user.permissions.allowedSources] : []
    );
    setIsEditingDetailSources(false);
    setDetailSourceSearch('');

    // Fetch HRMS org fields: emp_no link (teaching staff) or hrms_id only (common for Student Counselors)
    const unwrapHrms = (apiBody: unknown) => {
      if (apiBody && typeof apiBody === 'object' && 'data' in apiBody) {
        return (apiBody as { data?: unknown }).data ?? apiBody;
      }
      return apiBody;
    };

    try {
      let response: unknown;
      if (user.emp_no != null && String(user.emp_no).trim() !== '') {
        response = await userAPI.getHrmsEmployeeByEmpNo(String(user.emp_no).trim());
      } else if (user.hrms_id != null && String(user.hrms_id).trim() !== '') {
        response = await userAPI.getHrmsEmployeeByMongoId(String(user.hrms_id).trim());
      }
      const hrmsData = response != null ? unwrapHrms(response) : null;
      if (hrmsData && typeof hrmsData === 'object' && hrmsData !== null) {
        const d = hrmsData as { division?: string; department?: string; group?: string };
        setSelectedUserDetail(prev => prev ? ({
          ...prev,
          division: d.division,
          department: d.department,
          group: d.group
        }) : null);
      }
    } catch (error) {
      console.error('Failed to fetch HRMS details:', error);
    }
  };

  const handleOpenTeamAssignment = (user: User, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setSelectedUserForAssignment(user);
    // Safely get manager ID - handle null, object, or string
    let managerId = '';
    if (user.managedBy) {
      if (typeof user.managedBy === 'object' && user.managedBy._id) {
        managerId = user.managedBy._id;
      } else if (typeof user.managedBy === 'string') {
        managerId = user.managedBy;
      }
    }
    setSelectedManagerId(managerId);
    setShowTeamAssignmentModal(true);
  };

  const handleAssignTeamMember = () => {
    if (!selectedUserForAssignment) return;
    const managerId = selectedManagerId || null;
    assignTeamMemberMutation.mutate({
      userId: selectedUserForAssignment._id,
      managerId,
    });
  };

  const handleSearchHrms = async (term: string) => {
    setHrmsSearchTerm(term);
    if (term.length < 2) {
      setHrmsResults([]);
      return;
    }
    setIsSearchingHrms(true);
    try {
      const response = await userAPI.searchHrmsEmployees(term);
      setHrmsResults(response.data || []);
    } catch (error) {
      console.error('HRMS Search error:', error);
    } finally {
      setIsSearchingHrms(false);
    }
  };

  const handleSelectHrmsEmployee = (emp: HrmsSearchResult, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormState(prev => ({
        ...prev,
        name: String(emp.name || ''),
        email: (emp.email as string) || prev.email,
        mobileNumber: (emp.mobileNumber as string) || prev.mobileNumber,
        emp_no: (emp.emp_no as string | number | undefined)?.toString() || '',
        hrms_id: ((emp.id || emp._id) as string) || '',
        designation: (emp.designation as string) || prev.designation,
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        name: String(emp.name || ''),
        email: (emp.email as string) || prev.email,
        mobileNumber: (emp.mobileNumber as string) || prev.mobileNumber,
        emp_no: (emp.emp_no as string | number | undefined)?.toString() || '',
        hrms_id: ((emp.id || emp._id) as string) || '',
        designation: (emp.designation as string) || prev.designation,
      }));
    }
    setHrmsResults([]);
    setHrmsSearchTerm('');
  };

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageUsers) {
      showToast.error('You do not have permission to create users');
      return;
    }
    if (!formState.name || (!formState.email && !formState.mobileNumber && !formState.emp_no)) {
      showToast.error('Full Name and at least one identifier (Email, Mobile, or Emp No) are required');
      return;
    }

    if (!formState.emp_no && !formState.hrms_id && !formState.password) {
      showToast.error('Password is required for non-HRMS users');
      return;
    }

    if (!formState.emp_no && !formState.hrms_id && formState.password.length < 6) {
      showToast.error('Password must be at least 6 characters long');
      return;
    }

    const payload = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      mobileNumber: formState.mobileNumber.trim() || undefined,
      password: formState.password,
      roleName: formState.roleName,
      hrms_id: formState.hrms_id || undefined,
      emp_no: formState.emp_no || undefined,
    } as Parameters<typeof userAPI.create>[0];

    if (
      formState.roleName === 'Student Counselor' ||
      formState.roleName === 'Data Entry User' ||
      formState.roleName === 'PRO'
    ) {
      payload.designation = formState.designation?.trim() || undefined;
    }

    const isCustomRole = !['Super Admin', 'Sub Super Admin', 'Student Counselor', 'Data Entry User', 'PRO'].includes(formState.roleName);
    if (formState.roleName === 'Sub Super Admin' || isCustomRole) {
      const selectedPermissions = Object.entries(permissionState).reduce((acc, [key, value]) => {
        if (value.access) {
          acc[key as PermissionModuleKey] = modulePermissionForSave(key, value);
        }
        return acc;
      }, {} as Record<PermissionModuleKey, ModulePermission>);

      if (Object.keys(selectedPermissions).length === 0 && formState.roleName === 'Sub Super Admin') {
        showToast.error('Select at least one module to grant access');
        return;
      }

      if (Object.keys(selectedPermissions).length > 0) {
        payload.permissions = selectedPermissions;
      }
    }

    if (allowedSourcesState.length > 0) {
      if (!payload.permissions) payload.permissions = {};
      payload.permissions.allowedSources = allowedSourcesState;
    }

    createMutation.mutate(payload);
  };

  const handleRoleChange = (roleName: string) => {
    setFormState((prev) => ({
      ...prev,
      roleName: roleName as RoleName,
      designation: '',
    }));
    const matchedRole = configuredRoles.find(
      (r) => String(r.name).trim().toLowerCase() === String(roleName).trim().toLowerCase()
    );
    if (matchedRole && matchedRole.permissions) {
      const newPerms = createEmptyPermissions();
      Object.entries(matchedRole.permissions).forEach(([modKey, val]) => {
        const k = (modKey === 'userManagement' ? 'users' : modKey) as PermissionModuleKey;
        if (newPerms[k] && typeof val === 'object' && val !== null) {
          newPerms[k] = { ...newPerms[k], ...(val as object) } as ModulePermission;
        }
      });
      setPermissionState(newPerms);
    } else if (roleName === 'Sub Super Admin') {
      setPermissionState(createEmptyPermissions());
    }
  };

  const handleEditRoleChange = (roleName: string) => {
    setEditFormState((prev) => ({
      ...prev,
      roleName: roleName as RoleName,
      designation: '',
    }));
    const matchedRole = configuredRoles.find(
      (r) => String(r.name).trim().toLowerCase() === String(roleName).trim().toLowerCase()
    );
    if (matchedRole && matchedRole.permissions) {
      const newPerms = createEmptyPermissions();
      Object.entries(matchedRole.permissions).forEach(([modKey, val]) => {
        const k = (modKey === 'userManagement' ? 'users' : modKey) as PermissionModuleKey;
        if (newPerms[k] && typeof val === 'object' && val !== null) {
          newPerms[k] = { ...newPerms[k], ...(val as object) } as ModulePermission;
        }
      });
      setEditPermissionState(newPerms);
    } else if (roleName === 'Sub Super Admin') {
      setEditPermissionState(createEmptyPermissions());
    }
  };

  // Role Configuration Handlers
  const handleDraftPermChange = (moduleKey: PermissionModuleKey, level: 'off' | 'view' | 'full') => {
    setRolePermissionsDraft((prev) => {
      const existing = (prev[moduleKey] || (moduleKey === 'users' ? prev['userManagement'] : undefined) || {}) as Record<string, unknown>;
      const newModulePerm =
        level === 'off'
          ? {
              ...existing,
              access: false,
              permission: 'read',
            }
          : {
              ...existing,
              access: true,
              permission: level === 'full' ? 'write' : 'read',
              ...(moduleKey === JOINING_PERMISSION_KEY && !existing.access
                ? {
                    ...defaultJoiningPermissionExtras(),
                    ...defaultJoiningPageExtras(),
                    ...defaultAdmissionTabExtras(),
                  }
                : {}),
            };

      const updated = {
        ...prev,
        [moduleKey]: newModulePerm,
      };
      if (moduleKey === 'users') {
        updated.userManagement = newModulePerm;
      }
      return updated;
    });
  };

  const handleSaveRoleConfig = async () => {
    const targetRole = activeRole || selectedRoleForConfig;
    if (!targetRole) return;
    setIsSavingRole(true);
    try {
      const toSave = { ...rolePermissionsDraft };
      if (toSave.users) {
        toSave.userManagement = toSave.users;
      } else if (toSave.userManagement) {
        toSave.users = toSave.userManagement;
      }
      const updated = await roleAPI.update(targetRole.id, {
        permissions: toSave,
        description: targetRole.description,
        color: targetRole.color,
      });
      showToast.success(`Role "${targetRole.name}" permissions updated`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-session-permissions-changed', {
            detail: { roleName: targetRole.name },
          })
        );
      }
      const me = auth.getUser();
      if (
        me?.roleName &&
        String(me.roleName).trim().toLowerCase() === String(targetRole.name).trim().toLowerCase()
      ) {
        await refreshSessionUser();
      }
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (updated) {
        setSelectedRoleForConfig(updated);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update role';
      showToast.error(msg);
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleCreateNewRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) {
      showToast.error('Please enter a role name');
      return;
    }
    setIsSavingRole(true);
    try {
      const toSave = { ...rolePermissionsDraft };
      if (toSave.users) {
        toSave.userManagement = toSave.users;
      } else if (toSave.userManagement) {
        toSave.users = toSave.userManagement;
      }
      const created = await roleAPI.create({
        name: newRoleForm.name.trim(),
        description: newRoleForm.description.trim(),
        color: newRoleForm.color,
        permissions: toSave,
      });
      showToast.success(`Role "${created.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreatingRole(false);
      setNewRoleForm({ name: '', description: '', color: '#0ea5e9' });
      setSelectedRoleForConfig(created);
      setRolePermissionsDraft(created.permissions || {});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create role';
      showToast.error(msg);
    } finally {
      setIsSavingRole(false);
    }
  };

  const initiateDeleteRole = (role: RoleConfigItem) => {
    if (role.name === 'Super Admin' || role.id === 'super-admin') {
      showToast.error('Super Admin role cannot be deleted');
      return;
    }
    setRoleToDelete(role);
    const count = getRoleStaffCount(role.name, role.userCount || 0);
    if (count > 0) {
      const availableTargets = configuredRoles.filter((r) => r.id !== role.id && r.name !== role.name);
      setTransferTargetRole(availableTargets[0]?.name || 'Student Counselor');
      setShowTransferDeleteModal(true);
    } else {
      setShowDirectDeleteModal(true);
    }
  };

  const handleConfirmDirectDelete = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    try {
      await roleAPI.delete(roleToDelete.id);
      showToast.success(`Role "${roleToDelete.name}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDirectDeleteModal(false);
      if (selectedRoleForConfig?.id === roleToDelete.id) {
        const next = configuredRoles.find((r) => r.id !== roleToDelete.id);
        setSelectedRoleForConfig(next || null);
        if (next) setRolePermissionsDraft(next.permissions || {});
      }
      setRoleToDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete role';
      showToast.error(msg);
    } finally {
      setIsDeletingRole(false);
    }
  };

  const handleConfirmTransferDelete = async () => {
    if (!roleToDelete) return;
    if (!transferTargetRole) {
      showToast.error('Please select a target role to transfer users to');
      return;
    }
    setIsDeletingRole(true);
    try {
      const res = await roleAPI.delete(roleToDelete.id, transferTargetRole);
      const count = res?.transferredCount ?? getRoleStaffCount(roleToDelete.name, roleToDelete.userCount || 0);
      showToast.success(`Role "${roleToDelete.name}" deleted and ${count} user(s) transferred to "${transferTargetRole}"`);
      queryClient.invalidateQueries({ queryKey: ['roleConfigurations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowTransferDeleteModal(false);
      if (selectedRoleForConfig?.id === roleToDelete.id) {
        const next = configuredRoles.find((r) => r.id !== roleToDelete.id);
        setSelectedRoleForConfig(next || null);
        if (next) setRolePermissionsDraft(next.permissions || {});
      }
      setRoleToDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to transfer users and delete role';
      showToast.error(msg);
    } finally {
      setIsDeletingRole(false);
    }
  };

  const toggleModuleAccess = (moduleKey: PermissionModuleKey) => {
    setPermissionState((prev) => {
      const nextAccess = !prev[moduleKey].access;
      return {
        ...prev,
        [moduleKey]: {
          ...prev[moduleKey],
          access: nextAccess,
          permission: nextAccess ? prev[moduleKey].permission || 'read' : prev[moduleKey].permission,
          ...(moduleKey === JOINING_PERMISSION_KEY && nextAccess && !prev[moduleKey].access
            ? {
                ...defaultJoiningPermissionExtras(),
                ...defaultJoiningPageExtras(),
                ...defaultAdmissionTabExtras(),
              }
            : {}),
        },
      };
    });
  };

  const updateModulePermissionLevel = (moduleKey: PermissionModuleKey, level: ModulePermission['permission']) => {
    setPermissionState((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        permission: level,
        ...(moduleKey === JOINING_PERMISSION_KEY && level === 'read' ? defaultJoiningPermissionExtras() : {}),
      },
    }));
  };

  const updateEditModulePermissionLevel = (moduleKey: PermissionModuleKey, level: ModulePermission['permission']) => {
    setEditPermissionState((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        permission: level,
        ...(moduleKey === JOINING_PERMISSION_KEY && level === 'read' ? defaultJoiningPermissionExtras() : {}),
      },
    }));
  };

  /** CRM role only — division/dept/group come from HRMS separately; do not substitute HRMS job titles here */
  const displayRole = (user: User) => {
    if (user.isManager) {
      return `${user.roleName} (Manager)`;
    }
    return user.roleName;
  };

  if (!canAccessUsers) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${stats.customRoles > 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
        <Card className="p-4 bg-[#3b82f6] text-[#ffffff] border-none shadow-md dark:bg-[#2563eb]">
          <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">Total Users</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-[#8b5cf6] text-[#ffffff] border-none shadow-md dark:bg-[#7c3aed]">
          <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">Sub Super Admins</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.subAdmins}</div>
        </Card>
        <Card className="p-4 bg-[#10b981] text-[#ffffff] border-none shadow-md dark:bg-[#059669]">
          <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">Counselors</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.counselors}</div>
        </Card>
        <Card className="p-4 bg-[#f97316] text-[#ffffff] border-none shadow-md dark:bg-[#ea580c]">
          <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">Data Entry Users</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.dataEntry}</div>
        </Card>
        <Card className="p-4 bg-[#0ea5e9] text-[#ffffff] border-none shadow-md dark:bg-[#0284c7]">
          <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">PRO</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.pro}</div>
        </Card>
        {stats.customRoles > 0 && (
          <Card className="p-4 bg-[#6366f1] text-[#ffffff] border-none shadow-md dark:bg-[#4f46e5]">
            <div className="text-xs font-medium text-[#f1f5f9] uppercase tracking-wider">Custom Roles</div>
            <div className="mt-1 text-2xl font-bold text-[#ffffff]">{stats.customRoles}</div>
          </Card>
        )}
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, mobile or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Divisions</option>
            {filterOptions.divisions.map(div => <option key={div} value={div}>{div}</option>)}
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            {filterOptions.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Groups</option>
            {filterOptions.groups.map(group => <option key={group} value={group}>{group}</option>)}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Roles</option>
            {filterOptions.roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button
            variant="secondary"
            onClick={handleExportExcel}
            className="flex items-center gap-2 h-10 border border-slate-200 shadow-sm"
          >
            <IconFileExport className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Export to Excel</span>
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Emp ID
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Mobile
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-w-[220px]">
                    Division
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Department
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Group
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Role
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 max-w-[100px]">
                    Manager
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-w-[120px]">

                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      Loading users…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No users match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    let manager: User | undefined = undefined;
                    if (user.managedBy) {
                      if (typeof user.managedBy === 'object') {
                        manager = user.managedBy;
                      } else if (typeof user.managedBy === 'string') {
                        manager = users.find((u) => u._id === user.managedBy);
                      }
                    }

                    return (
                      <tr
                        key={user._id}
                        className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        onClick={() => handleRowClick(user)}
                      >
                        <td className="px-3 py-2.5 align-middle text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono selection:bg-blue-100 uppercase tracking-tighter font-bold text-blue-600 dark:text-blue-400">
                          {user.emp_no || '-'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{user.name}</span>
                            {(user.emp_no || user.hrms_id) && (
                              <span title={user.emp_no ? `HRMS Linked: ${user.emp_no}` : 'Linked to HRMS (profile id)'} className="shrink-0">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {user.mobileNumber || '-'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-xs text-slate-600 dark:text-slate-300 truncate max-w-[220px]" title={user.division}>
                          {user.division || '-'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]" title={user.department}>
                          {user.department || '-'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]" title={user.group}>
                          {user.group || '-'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {displayRole(user)}
                        </td>
                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${user.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                              }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle text-sm text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                          {manager ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 truncate max-w-full" title={manager.name}>
                              {manager.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap">
                          <IconPencil className="inline-block w-4 h-4 text-slate-400" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading users…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No users match the current search.
            </div>
          ) : (
            filteredUsers.map((user) => {
              let manager: User | undefined = undefined;
              if (user.managedBy) {
                if (typeof user.managedBy === 'object') {
                  manager = user.managedBy;
                } else if (typeof user.managedBy === 'string') {
                  manager = users.find((u) => u._id === user.managedBy);
                }
              }
              return (
                <Card
                  key={user._id}
                  className="group flex cursor-pointer flex-col justify-between p-5 transition-all hover:border-blue-200 hover:shadow-md dark:hover:border-blue-900/50"
                  onClick={() => handleRowClick(user)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {user.name}
                          {(user.emp_no || user.hrms_id) && (
                            <span title={user.emp_no ? `HRMS Linked: ${user.emp_no}` : 'Linked to HRMS (profile id)'}>
                              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {displayRole(user)}
                        </div>
                      </div>
                    </div>
                    <button className="rounded-full p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                      <IconPencil className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <svg
                        className="h-4 w-4 shrink-0 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="truncate">{user.email}</span>
                    </div>

                    {(user.emp_no || user.hrms_id) && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-blue-500 dark:text-blue-400 font-mono uppercase tracking-widest mb-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span>{user.emp_no ? 'Emp ID' : 'HRMS'}</span>
                        <span>{user.emp_no || 'Linked'}</span>
                      </div>
                    )}

                    {user.division && user.division !== '-' && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          Division
                        </span>
                        <span
                          className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]"
                          title={user.division}
                        >
                          {user.division}
                        </span>
                      </div>
                    )}

                    {user.department && user.department !== '-' && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          Department
                        </span>
                        <span
                          className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]"
                          title={user.department}
                        >
                          {user.department}
                        </span>
                      </div>
                    )}

                    {user.group && user.group !== '-' && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          Group
                        </span>
                        <span
                          className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]"
                          title={user.group}
                        >
                          {user.group}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-3 w-3 text-slate-400" />
                        <span>{user.mobileNumber || '-'}</span>
                      </div>
                    </div>

                    {manager && (
                      <div className="flex items-center gap-2">
                        <IconUserGroup className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">Manager: {manager.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${user.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                        }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {user._id.slice(-4)}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-6xl max-h-[85vh] flex flex-col p-6 shadow-lg border border-slate-200 dark:border-slate-800 dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  {selectedUserDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedUserDetail.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedUserDetail.email}
                    </p>
                    {(selectedUserDetail.emp_no || selectedUserDetail.hrms_id) && (
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-800/50">
                        {selectedUserDetail.emp_no || 'HRMS'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => setShowUserDetail(false)}
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: User details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-200">{displayRole(selectedUserDetail)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUserDetail.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                          }`}
                      >
                        {selectedUserDetail.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-200">{selectedUserDetail.mobileNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-200">
                        {selectedUserDetail.managedBy && typeof selectedUserDetail.managedBy !== 'string'
                          ? selectedUserDetail.managedBy.name
                          : selectedUserDetail.managedBy
                            ? (users.find(u => u._id === selectedUserDetail.managedBy) as User)?.name || 'Unknown'
                            : '-'}
                      </p>
                    </div>
                  </div>

                  {(selectedUserDetail.emp_no || selectedUserDetail.hrms_id) && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <IconBadge className="w-3.5 h-3.5" />
                        HRMS Organizational Details
                      </h3>
                      <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Division</span>
                          <span className="font-semibold text-blue-700 dark:blue-300">{selectedUserDetail.division || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Department</span>
                          <span className="font-semibold text-blue-700 dark:blue-300">{selectedUserDetail.department || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Employee Group</span>
                          <span className="font-semibold text-blue-700 dark:blue-300">{selectedUserDetail.group || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Lead Sources & Extra Permissions */}
                <div className="space-y-4">
                  {selectedUserDetail.roleName === 'Super Admin' ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Super Admin Privileges</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Super Admins automatically have complete read and write access to all modules and lead sources.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 1. Allowed Lead Sources Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                              Allowed Lead Sources
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                detailAllowedSources.length === 0
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {detailAllowedSources.length === 0
                                ? 'All Sources Allowed'
                                : `${detailAllowedSources.length} Restricted`}
                            </span>
                          </div>
                          {canManageUsers && (
                            <button
                              type="button"
                              onClick={() => setIsEditingDetailSources((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
                            >
                              {isEditingDetailSources ? (
                                <>
                                  <IconCheck className="w-3.5 h-3.5" />
                                  Done
                                </>
                              ) : (
                                <>
                                  <IconPencil className="w-3.5 h-3.5" />
                                  Edit Sources
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {!isEditingDetailSources ? (
                          <div>
                            {detailAllowedSources.length === 0 ? (
                              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-medium">All lead sources allowed.</span>
                                <span className="text-slate-400 text-[11px]">(No source restrictions)</span>
                              </div>
                            ) : (
                              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40 flex flex-wrap gap-1.5">
                                {detailAllowedSources.map((source) => (
                                  <span
                                    key={source}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {source}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5 rounded-xl border border-blue-100 bg-blue-50/30 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  placeholder="Search sources..."
                                  value={detailSourceSearch}
                                  onChange={(e) => setDetailSourceSearch(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setDetailAllowedSources([...allSources])}
                                className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailAllowedSources([])}
                                className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 border border-slate-200 hover:bg-rose-50 dark:bg-slate-800 dark:border-slate-700 dark:text-rose-400 transition"
                              >
                                Allow All
                              </button>
                            </div>

                            <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {allSources
                                .filter(
                                  (s) =>
                                    !detailSourceSearch ||
                                    s.toLowerCase().includes(detailSourceSearch.toLowerCase())
                                )
                                .map((source) => {
                                  const isChecked = detailAllowedSources.includes(source);
                                  return (
                                    <label
                                      key={source}
                                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors border ${
                                        isChecked
                                          ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setDetailAllowedSources((prev) => [...prev, source]);
                                          } else {
                                            setDetailAllowedSources((prev) =>
                                              prev.filter((s) => s !== source)
                                            );
                                          }
                                        }}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="truncate">{source}</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Extra Permissions & Module Access Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                              Permissions & Module Access Overrides
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Baseline inherited from <strong className="text-slate-700 dark:text-slate-200">{selectedUserDetail.roleName}</strong>. You can toggle off any role baseline permission to revoke it for this user, or grant extra module permissions below.
                            </p>
                          </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                          {PERMISSION_MODULES.map((module) => {
                            const roleEntry =
                              detailRoleBaseline[module.key] ||
                              (module.key === 'users' ? detailRoleBaseline['userManagement'] : undefined);
                            const isFromRole = Boolean(roleEntry?.access);
                            const roleLevel = roleEntry?.permission || 'read';

                            const revokedList = Array.isArray(detailPermissionsDraft.revokedPermissions)
                              ? (detailPermissionsDraft.revokedPermissions as string[])
                              : [];
                            const isRevoked =
                              isFromRole &&
                              (revokedList.includes(module.key) ||
                                (module.key === 'users' && revokedList.includes('userManagement')));

                            const extraPerms = (detailPermissionsDraft.extraPermissions ||
                              {}) as Record<string, ModulePermission>;
                            const userEntry = (extraPerms[module.key] ||
                              (module.key === 'users'
                                ? extraPerms['userManagement']
                                : undefined)) as ModulePermission | undefined;
                            const isExtraGranted = !isFromRole && Boolean(userEntry?.access);
                            const currentLevel = isFromRole ? roleLevel : (userEntry?.permission || 'read');

                            const isModuleActive = isFromRole ? !isRevoked : isExtraGranted;

                            return (
                              <div
                                key={module.key}
                                className={`rounded-xl border p-3 transition-all ${
                                  isFromRole
                                    ? isRevoked
                                      ? 'border-rose-200/90 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                                      : 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                                    : isExtraGranted
                                    ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20'
                                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                                        {module.label}
                                      </p>
                                      {isFromRole && !isRevoked && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                          <IconCheck className="w-2.5 h-2.5" />
                                          Role Baseline ({roleLevel === 'write' ? 'Full Access' : 'Read Only'})
                                        </span>
                                      )}
                                      {isFromRole && isRevoked && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                          <IconX className="w-2.5 h-2.5" />
                                          Revoked from Role
                                        </span>
                                      )}
                                      {!isFromRole && isExtraGranted && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                          <IconBadge className="w-2.5 h-2.5" />
                                          Extra Permission
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                      {module.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isModuleActive}
                                        disabled={!canManageUsers}
                                        onChange={() =>
                                          handleToggleDetailModulePermission(module.key, isFromRole)
                                        }
                                      />
                                      <div
                                        className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                                          isFromRole
                                            ? 'peer-checked:bg-emerald-600'
                                            : 'peer-checked:bg-blue-600'
                                        }`}
                                      ></div>
                                    </label>

                                    {isFromRole && !isRevoked && (
                                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                        Active
                                      </span>
                                    )}
                                    {isFromRole && isRevoked && (
                                      <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                        Revoked
                                      </span>
                                    )}

                                    {!isFromRole && isExtraGranted && (
                                      <select
                                        value={currentLevel}
                                        disabled={!canManageUsers}
                                        onChange={(e) =>
                                          handleChangeDetailExtraPermissionLevel(
                                            module.key,
                                            e.target.value as 'read' | 'write'
                                          )
                                        }
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="read">Read Only</option>
                                        <option value="write">Read & Write</option>
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Save Action Bar */}
                        {canManageUsers && (
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400">
                              Applies strictly to {selectedUserDetail.name}
                            </span>
                            <Button
                              size="sm"
                              onClick={handleSaveDetailPermissionsAndSources}
                              disabled={isSavingDetailPermissions}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4"
                            >
                              {isSavingDetailPermissions
                                ? 'Saving…'
                                : 'Save User Permissions & Sources'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenTeamAssignment(selectedUserDetail)}
                disabled={!canManageUsers}
                className="justify-center"
              >
                <IconUserGroup className="w-4 h-4 mr-2" />
                Assign Manager
              </Button>

              {canManageUsers && (selectedUserDetail.roleName === 'Super Admin' || selectedUserDetail.roleName === 'Sub Super Admin' ? false : true) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedUserDetail.isManager) {
                      if (window.confirm(`Revoke Manager privileges from ${selectedUserDetail.name}?`)) {
                        toggleManagerRoleMutation.mutate(selectedUserDetail);
                      }
                    } else {
                      if (window.confirm(`Grant Manager privileges to ${selectedUserDetail.name}?`)) {
                        toggleManagerRoleMutation.mutate(selectedUserDetail);
                      }
                    }
                  }}
                  className={selectedUserDetail.isManager ? "justify-center border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "justify-center"}
                >
                  <IconBadge className="w-4 h-4 mr-2" />
                  {selectedUserDetail.isManager ? 'Revoke Manager' : 'Make Manager'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  if (selectedUserDetail.isActive) {
                    setUserToDeactivate(selectedUserDetail);
                    setShowDeactivateDialog(true);
                  } else {
                    toggleActiveMutation.mutate({ user: selectedUserDetail });
                  }
                }}
                disabled={!canManageUsers || toggleActiveMutation.isPending}
                className={selectedUserDetail.isActive ? "justify-center text-rose-600 hover:bg-rose-50 border-rose-200" : "justify-center text-emerald-600 hover:bg-emerald-50 border-emerald-200"}
              >
                {selectedUserDetail.isActive ? <IconX className="w-4 h-4 mr-2" /> : <IconCheck className="w-4 h-4 mr-2" />}
                {selectedUserDetail.isActive ? 'Deactivate' : 'Activate'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setEditingUser(selectedUserDetail);
                  setEditFormState({
                    name: selectedUserDetail.name,
                    email: selectedUserDetail.email,
                    mobileNumber: selectedUserDetail.mobileNumber || '',
                    roleName: selectedUserDetail.roleName,
                    designation: selectedUserDetail.designation || '',
                    password: '',
                    hrms_id: selectedUserDetail.hrms_id || '',
                    emp_no: selectedUserDetail.emp_no || '',
                  });
                  if (selectedUserDetail.roleName !== 'Super Admin') {
                    const base = createEmptyPermissions();
                    const matchedRole = configuredRoles.find((r) => r.name === selectedUserDetail.roleName);
                    const userPerms = (selectedUserDetail.permissions && Object.keys(selectedUserDetail.permissions).length > 0)
                      ? selectedUserDetail.permissions
                      : (matchedRole?.permissions || {});
                    const seeded: Record<PermissionModuleKey, ModulePermission> = { ...base };
                    PERMISSION_MODULES.forEach((module) => {
                      const entry = (userPerms[module.key] || (module.key === 'users' ? userPerms['userManagement'] : undefined)) as ModulePermission | undefined;
                      if (entry?.access) {
                        const permission = entry.permission === 'write' ? 'write' : 'read';
                        seeded[module.key] =
                          module.key === JOINING_PERMISSION_KEY
                            ? {
                                access: true,
                                permission,
                                ...joiningPagesFromStored(entry),
                                ...admissionTabsFromStored(entry),
                                ...(permission === 'write' ? joiningExtrasFromStored(entry) : {}),
                                allowedColleges: Array.isArray(entry.allowedColleges)
                                  ? entry.allowedColleges.filter((id) => typeof id === 'string')
                                  : [],
                              }
                            : { access: true, permission };
                      }
                    });
                    setEditPermissionState(seeded);
                    setEditAllowedSourcesState(selectedUserDetail.permissions?.allowedSources || []);
                  } else {
                    setEditPermissionState(createEmptyPermissions());
                    setEditAllowedSourcesState(selectedUserDetail.permissions?.allowedSources || []);
                  }
                  setShowEditUser(true);
                }}
                disabled={!canManageUsers}
                className="justify-center"
              >
                <IconPencil className="w-4 h-4 mr-2" />
                Edit Details
              </Button>

              {canDeleteUsers && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedUserDetail.name}? This cannot be undone.`)) {
                      deleteUserMutation.mutate(selectedUserDetail._id);
                    }
                  }}
                  disabled={!canManageUsers}
                  className="justify-center border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                >
                  <IconTrash className="w-4 h-4 mr-2" />
                  Delete User Permanently
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Deactivate User Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User?</DialogTitle>
            <DialogDescription>
              You are about to deactivate {userToDeactivate?.name}. What would you like to do with their assigned leads?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3 border-rose-200 hover:bg-rose-50"
              onClick={() => {
                if (userToDeactivate) {
                  toggleActiveMutation.mutate({ user: userToDeactivate, unassignLeads: true });
                  setShowDeactivateDialog(false);
                }
              }}
              disabled={toggleActiveMutation.isPending}
            >
              <div>
                <div className="font-semibold text-rose-700">Deactivate & Unassign Leads</div>
                <div className="text-xs text-rose-600 font-normal mt-1 whitespace-normal text-left">User will be deactivated and all their leads will be returned to the unassigned pool.</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3"
              onClick={() => {
                if (userToDeactivate) {
                  toggleActiveMutation.mutate({ user: userToDeactivate, unassignLeads: false });
                  setShowDeactivateDialog(false);
                }
              }}
              disabled={toggleActiveMutation.isPending}
            >
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">Deactivate Only</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1 whitespace-normal text-left">User will be deactivated but their leads will remain assigned to them.</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-center mt-2"
              onClick={() => setShowDeactivateDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-6xl max-h-[85vh] flex flex-col p-6 shadow-lg border border-slate-200 dark:border-slate-800 dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New User</h2>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => setShowCreateUser(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: User details */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 content-start">
                    {/* Link with HRMS Employee */}
                    <div className="col-span-full space-y-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Link with HRMS Employee
                        </h3>
                        {formState.emp_no && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Linked: {formState.emp_no}
                            <button
                              type="button"
                              onClick={() => {
                                setFormState(prev => ({ ...prev, emp_no: '', hrms_id: '' }));
                              }}
                              className="ml-1.5 hover:text-emerald-900 dark:hover:text-emerald-100"
                            >
                              <IconX className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Search by Employee Name..."
                          value={hrmsSearchTerm}
                          onChange={(e) => handleSearchHrms(e.target.value)}
                          className="bg-white dark:bg-slate-900 border-blue-200 focus:border-blue-500"
                        />
                        {isSearchingHrms && (
                          <div className="absolute right-3 top-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                        {hrmsResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <div className="max-h-48 overflow-y-auto">
                              {hrmsResults.map((emp) => (
                                <button
                                  key={emp.emp_no}
                                  type="button"
                                  onClick={() => handleSelectHrmsEmployee(emp, false)}
                                  className="flex w-full flex-col px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{emp.name}</span>
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{emp.emp_no}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {emp.division} • {emp.department} • {emp.group}
                                  </div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500 italic">
                                    {emp.email}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {!formState.emp_no && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Search and select an employee to auto-fill details and enable HRMS authentication.
                        </p>
                      )}
                    </div>
                    <Input
                      label="Full Name"
                      name="name"
                      value={formState.name}
                      onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Counsellor name"
                    />
                    <Input
                      label="Email Address (Optional)"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="name@college.com"
                    />
                    <Input
                      label="Mobile Number"
                      name="mobileNumber"
                      type="tel"
                      value={formState.mobileNumber}
                      onChange={(event) => setFormState((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                      placeholder="9876543210 (Optional)"
                    />
                    {formState.emp_no ? (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-900/20">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <IconBadge className="w-3.5 h-3.5" />
                          Password managed by HRMS
                        </p>
                      </div>
                    ) : (
                      <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formState.password}
                        onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="Temporary password"
                      />
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">Role</label>
                      <select
                        value={formState.roleName}
                        onChange={(event) => handleRoleChange(event.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                      >
                        {(configuredRoles.length > 0 ? configuredRoles : [
                          { id: '1', name: 'Student Counselor' },
                          { id: '2', name: 'Data Entry User' },
                          { id: '3', name: 'PRO' },
                          { id: '4', name: 'Sub Super Admin' },
                          { id: '5', name: 'Super Admin' },
                        ])
                          .filter((r) => r.name !== 'Super Admin' || currentUser?.roleName === 'Super Admin')
                          .map((r) => (
                            <option key={r.id || r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Other Info */}
                  <div className="space-y-4">
                    {(formState.roleName === 'Sub Super Admin' || !['Super Admin', 'Student Counselor', 'Data Entry User', 'PRO'].includes(formState.roleName)) && (
                      <div className="flex h-full flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Module Permissions
                          </h3>
                          <p className="text-xs text-blue-700/80 dark:text-blue-200/70">
                            Select which super admin modules this sub super admin can access, and whether they can edit them.
                          </p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[45vh]">
                          {PERMISSION_MODULES.map((module) => {
                            const moduleState = permissionState[module.key];
                            return (
                              <div
                                key={module.key}
                                className="flex flex-col justify-between rounded-2xl border border-white/70 bg-white p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {module.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{module.description}</p>
                                  </div>
                                  <label className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      checked={moduleState.access}
                                      onChange={() => toggleModuleAccess(module.key)}
                                    />
                                    Access
                                  </label>
                                </div>
                                {moduleState.access ? (
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-blue-200/70 bg-blue-50/70 p-2 dark:border-blue-900/50 dark:bg-blue-900/30">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-blue-600 dark:text-blue-200">
                                      Permission Level
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={moduleState.permission === 'read' ? 'primary' : 'outline'}
                                        onClick={() => updateModulePermissionLevel(module.key, 'read')}
                                      >
                                        Read Only
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={moduleState.permission === 'write' ? 'primary' : 'outline'}
                                        onClick={() => updateModulePermissionLevel(module.key, 'write')}
                                      >
                                        Read &amp; Write
                                      </Button>
                                    </div>
                                    {module.key === JOINING_PERMISSION_KEY && (
                                      <JoiningModulePermissionExtras
                                        moduleState={moduleState}
                                        collegeOptions={collegeOptions}
                                        onChange={(patch) =>
                                          setPermissionState((prev) => ({
                                            ...prev,
                                            [module.key]: { ...prev[module.key], ...patch },
                                          }))
                                        }
                                      />
                                    )}
                                    {module.key === 'leads' && (
                                      <div className="mt-3 border-t border-blue-100 pt-3 dark:border-blue-900/30 w-full">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-blue-600 dark:text-blue-200 mb-2">
                                          Allowed Lead Sources
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          {allSources.map((source) => (
                                            <label key={source} className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={allowedSourcesState.includes(source)}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setAllowedSourcesState(prev => [...prev, source]);
                                                  } else {
                                                    setAllowedSourcesState(prev => prev.filter(s => s !== source));
                                                  }
                                                }}
                                              />
                                              {source}
                                            </label>
                                          ))}
                                          {allSources.length === 0 && (
                                            <p className="text-[10px] text-slate-400 italic">No sources found.</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-medium uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
                                    Access disabled
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {formState.roleName !== 'Sub Super Admin' && formState.roleName !== 'Super Admin' && (
                      <div className="flex h-full flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Lead Source Permissions
                          </h3>
                          <p className="text-xs text-blue-700/80 dark:text-blue-200/70">
                            Restrict this user to only see leads from these sources. Leave all unchecked to show all leads.
                          </p>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[45vh] bg-white rounded-xl p-3 border border-white/70 dark:bg-slate-900/80 dark:border-slate-700/60">
                          {allSources.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No sources found in database.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {allSources.map((source) => (
                                <label key={source} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={allowedSourcesState.includes(source)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAllowedSourcesState(prev => [...prev, source]);
                                      } else {
                                        setAllowedSourcesState(prev => prev.filter(s => s !== source));
                                      }
                                    }}
                                  />
                                  {source}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {formState.roleName === 'Super Admin' && (
                      <div className="flex h-full flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Super Admin Privileges</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                          Super Admins automatically have complete read and write access to all modules and lead sources.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateUser(false);
                    setPermissionState(createEmptyPermissions());
                    setAllowedSourcesState([]);
                    setFormState({ name: '', email: '', mobileNumber: '', password: '', roleName: 'Student Counselor', designation: '', hrms_id: '', emp_no: '' });
                  }}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createMutation.isPending || !canManageUsers}>
                  {createMutation.isPending ? 'Creating…' : 'Create User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-6xl max-h-[85vh] flex flex-col p-6 shadow-lg border border-slate-200 dark:border-slate-800 dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Edit User
              </h2>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => {
                  setShowEditUser(false);
                  setEditingUser(null);
                }}
              >
                Close
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!canManageUsers || !editingUser) return;
                if (!editFormState.name || !editFormState.email) {
                  showToast.error('Please fill in name and email');
                  return;
                }

                const payload: Parameters<typeof userAPI.update>[1] = {
                  name: editFormState.name.trim(),
                  email: editFormState.email.trim(),
                  mobileNumber: editFormState.mobileNumber?.trim() || null,
                  roleName: editFormState.roleName,
                  hrms_id: editFormState.hrms_id || null,
                  emp_no: editFormState.emp_no || null,
                };

                if (editFormState.password) {
                  payload.password = editFormState.password;
                }

                if (
                  editFormState.roleName === 'Student Counselor' ||
                  editFormState.roleName === 'Data Entry User' ||
                  editFormState.roleName === 'PRO'
                ) {
                  payload.designation = editFormState.designation?.trim() || undefined;
                }

                const isCustomRole = !['Super Admin', 'Sub Super Admin', 'Student Counselor', 'Data Entry User', 'PRO'].includes(editFormState.roleName);
                if (editFormState.roleName === 'Sub Super Admin' || isCustomRole) {
                  const selectedPermissions = Object.entries(editPermissionState).reduce(
                    (acc, [key, value]) => {
                      if (value.access) {
                        acc[key as PermissionModuleKey] = modulePermissionForSave(key, value);
                      }
                      return acc;
                    },
                    {} as Record<PermissionModuleKey, ModulePermission>
                  );

                  if (Object.keys(selectedPermissions).length === 0 && editFormState.roleName === 'Sub Super Admin') {
                    showToast.error('Select at least one module to grant access');
                    return;
                  }

                  if (Object.keys(selectedPermissions).length > 0) {
                    payload.permissions = selectedPermissions;
                  }
                }

                if (editAllowedSourcesState.length > 0) {
                  if (!payload.permissions) payload.permissions = {};
                  payload.permissions.allowedSources = editAllowedSourcesState;
                } else if (payload.permissions) {
                   // If they unchecked everything, ensure we clear it on backend
                   // Actually, if we don't send it, sanitizePermissions won't include it.
                   // But wait, sanitizePermissions only includes what's there.
                   // If we want to CLEAR it, we should send an empty array.
                   payload.permissions.allowedSources = [];
                }

                updateUserMutation.mutate({ userId: editingUser._id, data: payload });
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: User details */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 content-start">
                    <div className="col-span-full space-y-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Link with HRMS Employee
                        </h3>
                        {editFormState.emp_no && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Linked: {editFormState.emp_no}
                            <button
                              type="button"
                              onClick={() => {
                                setEditFormState(prev => ({ ...prev, emp_no: '', hrms_id: '' }));
                              }}
                              className="ml-1.5 hover:text-emerald-900 dark:hover:text-emerald-100"
                            >
                              <IconX className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Search by Employee Name..."
                          value={hrmsSearchTerm}
                          onChange={(e) => handleSearchHrms(e.target.value)}
                          className="bg-white dark:bg-slate-900 border-blue-200 focus:border-blue-500"
                        />
                        {isSearchingHrms && (
                          <div className="absolute right-3 top-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                        {hrmsResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <div className="max-h-48 overflow-y-auto">
                              {hrmsResults.map((emp) => (
                                <button
                                  key={emp.emp_no}
                                  type="button"
                                  onClick={() => handleSelectHrmsEmployee(emp, true)}
                                  className="flex w-full flex-col px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{emp.name}</span>
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{emp.emp_no}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {emp.designation} • {emp.email}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {!editFormState.emp_no && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Search and select an employee to auto-fill details and enable HRMS authentication.
                        </p>
                      )}
                    </div>
                    <Input
                      label="Full Name"
                      name="name"
                      value={editFormState.name}
                      onChange={(event) =>
                        setEditFormState((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Counsellor name"
                    />
                    <Input
                      label="Email Address (Optional)"
                      name="email"
                      type="email"
                      value={editFormState.email}
                      onChange={(event) =>
                        setEditFormState((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="name@college.com"
                    />
                    <Input
                      label="Mobile Number"
                      name="mobileNumber"
                      type="tel"
                      value={editFormState.mobileNumber || ''}
                      onChange={(event) =>
                        setEditFormState((prev) => ({ ...prev, mobileNumber: event.target.value }))
                      }
                      placeholder="mobile number"
                    />
                    {editFormState.emp_no ? (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-900/20">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <IconBadge className="w-3.5 h-3.5" />
                          Password managed by HRMS
                        </p>
                      </div>
                    ) : (
                      <Input
                        label="New Password"
                        name="password"
                        type="password"
                        value={editFormState.password || ''}
                        onChange={(event) =>
                          setEditFormState((prev) => ({ ...prev, password: event.target.value }))
                        }
                        placeholder="Leave blank to keep current"
                      />
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">
                        Role
                      </label>
                      <select
                        value={editFormState.roleName}
                        onChange={(event) => handleEditRoleChange(event.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                      >
                        {(configuredRoles.length > 0 ? configuredRoles : [
                          { id: '1', name: 'Student Counselor' },
                          { id: '2', name: 'Data Entry User' },
                          { id: '3', name: 'PRO' },
                          { id: '4', name: 'Sub Super Admin' },
                          { id: '5', name: 'Super Admin' },
                        ])
                          .filter((r) => r.name !== 'Super Admin' || currentUser?.roleName === 'Super Admin')
                          .map((r) => (
                            <option key={r.id || r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Other Info */}
                  <div className="space-y-4">
                    {(editFormState.roleName === 'Sub Super Admin' || !['Super Admin', 'Student Counselor', 'Data Entry User', 'PRO'].includes(editFormState.roleName)) && (
                      <div className="flex h-full flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Module Permissions
                          </h3>
                          <p className="text-xs text-blue-700/80 dark:text-blue-200/70">
                            Select which super admin modules this sub super admin can access, and whether they can edit them.
                          </p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[45vh]">
                          {PERMISSION_MODULES.map((module) => {
                            const moduleState = editPermissionState[module.key];
                            return (
                              <div
                                key={module.key}
                                className="flex flex-col justify-between rounded-2xl border border-white/70 bg-white p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {module.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{module.description}</p>
                                  </div>
                                  <label className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      checked={moduleState.access}
                                      onChange={() =>
                                        setEditPermissionState((prev) => {
                                          const nextAccess = !prev[module.key].access;
                                          return {
                                            ...prev,
                                            [module.key]: {
                                              ...prev[module.key],
                                              access: nextAccess,
                                              permission: nextAccess
                                                ? prev[module.key].permission || 'read'
                                                : prev[module.key].permission,
                                              ...(module.key === JOINING_PERMISSION_KEY &&
                                              nextAccess &&
                                              !prev[module.key].access
                                                ? {
                                                    ...defaultJoiningPermissionExtras(),
                                                    ...defaultJoiningPageExtras(),
                                                    ...defaultAdmissionTabExtras(),
                                                  }
                                                : {}),
                                            },
                                          };
                                        })
                                      }
                                    />
                                    Access
                                  </label>
                                </div>
                                {moduleState.access ? (
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-blue-200/70 bg-blue-50/70 p-2 dark:border-blue-900/50 dark:bg-blue-900/30">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-blue-600 dark:text-blue-200">
                                      Permission Level
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={moduleState.permission === 'read' ? 'primary' : 'outline'}
                                        onClick={() => updateEditModulePermissionLevel(module.key, 'read')}
                                      >
                                        Read Only
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={moduleState.permission === 'write' ? 'primary' : 'outline'}
                                        onClick={() => updateEditModulePermissionLevel(module.key, 'write')}
                                      >
                                        Read &amp; Write
                                      </Button>
                                    </div>
                                    {module.key === JOINING_PERMISSION_KEY && (
                                      <JoiningModulePermissionExtras
                                        moduleState={moduleState}
                                        collegeOptions={collegeOptions}
                                        onChange={(patch) =>
                                          setEditPermissionState((prev) => ({
                                            ...prev,
                                            [module.key]: { ...prev[module.key], ...patch },
                                          }))
                                        }
                                      />
                                    )}
                                    {module.key === 'leads' && (
                                      <div className="mt-3 border-t border-blue-100 pt-3 dark:border-blue-900/30 w-full">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-blue-600 dark:text-blue-200 mb-2">
                                          Allowed Lead Sources
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          {allSources.map((source) => (
                                            <label key={source} className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={editAllowedSourcesState.includes(source)}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setEditAllowedSourcesState(prev => [...prev, source]);
                                                  } else {
                                                    setEditAllowedSourcesState(prev => prev.filter(s => s !== source));
                                                  }
                                                }}
                                              />
                                              {source}
                                            </label>
                                          ))}
                                          {allSources.length === 0 && (
                                            <p className="text-[10px] text-slate-400 italic">No sources found.</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-medium uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
                                    Access disabled
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {editFormState.roleName !== 'Sub Super Admin' && editFormState.roleName !== 'Super Admin' && (
                      <div className="flex h-full flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Lead Source Permissions
                          </h3>
                          <p className="text-xs text-blue-700/80 dark:text-blue-200/70">
                            Restrict this user to only see leads from these sources. Leave all unchecked to show all leads.
                          </p>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[45vh] bg-white rounded-xl p-3 border border-white/70 dark:bg-slate-900/80 dark:border-slate-700/60">
                          {allSources.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No sources found in database.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {allSources.map((source) => (
                                <label key={source} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={editAllowedSourcesState.includes(source)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditAllowedSourcesState(prev => [...prev, source]);
                                      } else {
                                        setEditAllowedSourcesState(prev => prev.filter(s => s !== source));
                                      }
                                    }}
                                  />
                                  {source}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {editFormState.roleName === 'Super Admin' && (
                      <div className="flex h-full flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Super Admin Privileges</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                          Super Admins automatically have complete read and write access to all modules and lead sources.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                  disabled={updateUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateUserMutation.isPending || !canManageUsers}
                >
                  {updateUserMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Team Assignment Modal */}
      {showTeamAssignmentModal && selectedUserForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md space-y-6 p-6 shadow-lg border border-slate-200 dark:border-slate-800 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Assign Team Member
              </h2>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => {
                  setShowTeamAssignmentModal(false);
                  setSelectedUserForAssignment(null);
                  setSelectedManagerId('');
                }}
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">
                  User
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedUserForAssignment.name} ({selectedUserForAssignment.email})
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-200">
                  Assign to Manager
                </label>
                {managers.length === 0 ? (
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      No managers available. Please create a manager first by creating a user with the &quot;Manager&quot; role.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                  >
                    <option value="">No Manager (Remove Assignment)</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} ({manager.email})
                        {manager.isActive ? '' : ' - Inactive'}
                      </option>
                    ))}
                  </select>
                )}
                {managers.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Select a manager to assign this user to their team, or select &quot;No Manager&quot; to remove the assignment.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTeamAssignmentModal(false);
                  setSelectedUserForAssignment(null);
                  setSelectedManagerId('');
                }}
                disabled={assignTeamMemberMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAssignTeamMember}
                disabled={assignTeamMemberMutation.isPending || !canManageUsers || managers.length === 0}
              >
                {assignTeamMemberMutation.isPending ? 'Updating…' : 'Update Assignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Team Cards Section - Show team metrics for managers */}
      {managers.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Manager Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <ManagerTeamCard key={manager._id} manager={manager} />
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ROLE CONFIGURATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Dialog open={showRoleConfigModal} onOpenChange={setShowRoleConfigModal}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
          <DialogTitle className="sr-only">Role Configuration & Permissions</DialogTitle>
          <DialogDescription className="sr-only">
            Configure baseline module permissions, grant more access to roles, or create new custom roles.
          </DialogDescription>
          {/* Header */}
          <div className="p-4 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] flex items-center justify-center text-white shadow-xs">
                <IconCog className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Role Configuration & Permissions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure baseline module permissions, give more access to roles, or create new custom roles.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRoleConfigModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 transition-colors"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Left sidebar + Right Workspace */}
          <div className="flex flex-col md:flex-row h-[72vh] overflow-hidden">
            {/* Left Sidebar: Roles List & + Create New Role */}
            <div className="w-full md:w-72 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Roles ({configuredRoles.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingRole(true);
                    setNewRoleForm({ name: '', description: '', color: '#0ea5e9' });
                    setRolePermissionsDraft(createEmptyPermissions() as unknown as Record<string, Record<string, unknown>>);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    isCreatingRole
                      ? 'bg-[#0ea5e9] text-white'
                      : 'bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0284c7] dark:bg-sky-950/50 dark:text-sky-300'
                  }`}
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  <span>New Role</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {isLoadingRoles ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading roles...</div>
                ) : (
                  configuredRoles.map((role) => {
                    const isSelected = !isCreatingRole && (
                      (activeRole?.id && activeRole.id === role.id) ||
                      (activeRole?.name && activeRole.name === role.name) ||
                      selectedRoleForConfig?.id === role.id ||
                      selectedRoleForConfig?.name === role.name
                    );
                    const liveCount = getRoleStaffCount(role.name, role.userCount || 0);
                    return (
                      <div
                        key={role.id || role.name}
                        onClick={() => {
                          setIsCreatingRole(false);
                          setSelectedRoleForConfig(role);
                          setRolePermissionsDraft(role.permissions || {});
                        }}
                        className={`group relative flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-[#0ea5e9] shadow-sm ring-1 ring-[#0ea5e9]'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: role.color || '#0ea5e9' }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                              <span>{role.name}</span>
                              {role.name === 'Super Admin' || role.id === 'super-admin' ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                                  Root Admin
                                </span>
                              ) : role.isSystem ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300 font-semibold">
                                  System
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {liveCount} staff assigned
                            </div>
                          </div>
                        </div>

                        {role.name !== 'Super Admin' && role.id !== 'super-admin' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              initiateDeleteRole(role);
                            }}
                            title={`Delete role "${role.name}"`}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0 ml-1"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              {isCreatingRole ? (
                /* Mode A: Create New Role */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                      Create New Role
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Define a brand new role with custom permissions to assign to counselors or coordinators.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Role Name *
                        </label>
                        <Input
                          placeholder="e.g. Telecaller, Accounts Head, Field Lead..."
                          value={newRoleForm.name}
                          onChange={(e) => setNewRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Role Badge Color
                        </label>
                        <div className="flex items-center gap-2 h-10">
                          {['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewRoleForm((prev) => ({ ...prev, color }))}
                              className={`w-7 h-7 rounded-full transition-transform ${
                                newRoleForm.color === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Description
                        </label>
                        <Input
                          placeholder="Short summary of responsibilities for this role..."
                          value={newRoleForm.description}
                          onChange={(e) => setNewRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Configure Module Permissions
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Set the initial access scope for users created with this role
                        </span>
                      </div>

                      {/* Permissions Matrix Table */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {PERMISSION_MODULES.map((module) => {
                          const perm = (rolePermissionsDraft[module.key] || (module.key === 'users' ? rolePermissionsDraft['userManagement'] : undefined) || { access: false, permission: 'read' }) as Record<string, unknown>;
                          const currentLevel = !perm.access ? 'off' : perm.permission === 'write' ? 'full' : 'view';

                          return (
                            <div key={module.key} className="p-3 bg-white dark:bg-slate-900 transition-colors">
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>{module.label}</span>
                                    {currentLevel !== 'off' && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                          currentLevel === 'full'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                        }`}
                                      >
                                        {currentLevel === 'full' ? 'Full Access' : 'Read Only'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {module.description}
                                  </div>
                                </div>
                                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDraftPermChange(module.key, 'off')}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                      currentLevel === 'off'
                                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 shadow-xs'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    Off
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDraftPermChange(module.key, 'view')}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                      currentLevel === 'view'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-blue-600'
                                    }`}
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDraftPermChange(module.key, 'full')}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                      currentLevel === 'full'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-emerald-600'
                                    }`}
                                  >
                                    Full
                                  </button>
                                </div>
                              </div>

                              {/* Expandable sub-options for Joining module */}
                              {module.key === 'joining' && currentLevel !== 'off' && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {[
                                    { k: 'pageAdmissions', l: 'Admissions List Tab' },
                                    { k: 'pageJoiningPipeline', l: 'Joining Pipeline Tab' },
                                    { k: 'pageConfirmedLeads', l: 'Confirmed Leads Tab' },
                                    { k: 'pageFeeRequests', l: 'Fee Requests Page' },
                                    { k: 'editAdmission', l: 'Edit Admission Details' },
                                    { k: 'editReference', l: 'Edit Admission Reference' },
                                    { k: 'approveFeeRequest', l: 'Approve Fee Requests' },
                                    { k: 'activateAdmission', l: 'Reactivate Admissions' },
                                  ].map((sub) => (
                                    <label key={sub.k} className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(rolePermissionsDraft.joining?.[sub.k])}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setRolePermissionsDraft((prev) => ({
                                            ...prev,
                                            joining: {
                                              ...(prev.joining || { access: true, permission: 'read' }),
                                              [sub.k]: checked,
                                            },
                                          }));
                                        }}
                                        className="rounded border-slate-300 text-[#0ea5e9] focus:ring-[#0ea5e9]"
                                      />
                                      <span>{sub.l}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingRole(false);
                        if (configuredRoles.length > 0) {
                          setSelectedRoleForConfig(configuredRoles[0]);
                          setRolePermissionsDraft(configuredRoles[0].permissions || {});
                        }
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleCreateNewRole}
                      disabled={isSavingRole || !newRoleForm.name.trim()}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold px-4"
                    >
                      {isSavingRole ? 'Creating Role…' : 'Create Role'}
                    </Button>
                  </div>
                </div>
              ) : (activeRole || selectedRoleForConfig) ? (
                /* Mode B: Configure Selected Role */
                (() => {
                  const currentRole = activeRole || selectedRoleForConfig!;
                  const liveCount = getRoleStaffCount(currentRole.name, currentRole.userCount || 0);
                  return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: currentRole.color || '#0ea5e9' }}
                            />
                            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {currentRole.name}
                            </h4>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {currentRole.name === 'Super Admin' || currentRole.id === 'super-admin'
                                ? 'Root Admin'
                                : currentRole.isSystem
                                ? 'System Role'
                                : 'Custom Role'}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {liveCount} staff members
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {currentRole.description || 'Manage module permissions and access capabilities for this role.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {currentRole.name !== 'Super Admin' && currentRole.id !== 'super-admin' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => initiateDeleteRole(currentRole)}
                              disabled={isSavingRole || isDeletingRole}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-bold shadow-xs flex items-center gap-1.5"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                              <span>Delete Role</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleSaveRoleConfig}
                            disabled={isSavingRole || isDeletingRole}
                            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold shadow-xs shrink-0"
                          >
                            {isSavingRole ? 'Saving Changes…' : 'Save Role Permissions'}
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Permissions Matrix
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            Click Off, View, or Full to configure baseline permissions for this role
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                          {PERMISSION_MODULES.map((module) => {
                            const perm = (rolePermissionsDraft[module.key] || (module.key === 'users' ? rolePermissionsDraft['userManagement'] : undefined) || { access: false, permission: 'read' }) as Record<string, unknown>;
                            const currentLevel = !perm.access ? 'off' : perm.permission === 'write' ? 'full' : 'view';

                            return (
                              <div key={module.key} className="p-3.5 bg-white dark:bg-slate-900 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                      <span>{module.label}</span>
                                      {currentLevel !== 'off' && (
                                        <span
                                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                            currentLevel === 'full'
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                          }`}
                                        >
                                          {currentLevel === 'full' ? 'Full Access' : 'Read Only'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                      {module.description}
                                    </div>
                                  </div>
                                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleDraftPermChange(module.key, 'off')}
                                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        currentLevel === 'off'
                                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 shadow-xs'
                                          : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      Off
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDraftPermChange(module.key, 'view')}
                                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        currentLevel === 'view'
                                          ? 'bg-blue-600 text-white shadow-xs'
                                          : 'text-slate-400 hover:text-blue-600'
                                      }`}
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDraftPermChange(module.key, 'full')}
                                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        currentLevel === 'full'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'text-slate-400 hover:text-emerald-600'
                                      }`}
                                    >
                                      Full
                                    </button>
                                  </div>
                                </div>

                                {/* Expandable sub-options for Joining module */}
                                {module.key === 'joining' && currentLevel !== 'off' && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    {[
                                      { k: 'pageAdmissions', l: 'Admissions List Tab' },
                                      { k: 'pageJoiningPipeline', l: 'Joining Pipeline Tab' },
                                      { k: 'pageConfirmedLeads', l: 'Confirmed Leads Tab' },
                                      { k: 'pageFeeRequests', l: 'Fee Requests Page' },
                                      { k: 'editAdmission', l: 'Edit Admission Details' },
                                      { k: 'editReference', l: 'Edit Admission Reference' },
                                      { k: 'approveFeeRequest', l: 'Approve Fee Requests' },
                                      { k: 'activateAdmission', l: 'Reactivate Admissions' },
                                    ].map((sub) => (
                                      <label key={sub.k} className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(rolePermissionsDraft.joining?.[sub.k])}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setRolePermissionsDraft((prev) => ({
                                              ...prev,
                                              joining: {
                                                ...(prev.joining || { access: true, permission: 'read' }),
                                                [sub.k]: checked,
                                              },
                                            }));
                                          }}
                                          className="rounded border-slate-300 text-[#0ea5e9] focus:ring-[#0ea5e9]"
                                        />
                                        <span>{sub.l}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                          {currentRole.name !== 'Super Admin' && currentRole.id !== 'super-admin' && (
                            <button
                              type="button"
                              onClick={() => initiateDeleteRole(currentRole)}
                              disabled={isDeletingRole}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                              <span>Delete Role</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRoleConfigModal(false)}
                            className="text-xs"
                          >
                            Close
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleSaveRoleConfig}
                            disabled={isSavingRole}
                            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold px-4"
                          >
                            {isSavingRole ? 'Saving…' : 'Save Role Permissions'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Select a role from the left to configure permissions.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Direct Delete Role (0 users assigned) */}
      <Dialog open={showDirectDeleteModal} onOpenChange={setShowDirectDeleteModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <IconTrash className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Role
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Are you sure you want to delete this custom role?
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: roleToDelete?.color || '#0ea5e9' }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {roleToDelete?.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {roleToDelete?.description || 'Custom role with 0 assigned staff members.'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This action cannot be undone. All configured permission baselines for this role will be permanently removed.
            </p>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDirectDeleteModal(false);
                setRoleToDelete(null);
              }}
              disabled={isDeletingRole}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDirectDelete}
              disabled={isDeletingRole}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingRole ? 'Deleting…' : 'Delete Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Transfer Staff & Delete Role (users are assigned) */}
      <Dialog open={showTransferDeleteModal} onOpenChange={setShowTransferDeleteModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Transfer Staff & Delete Role
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This role is currently assigned to users. Reassign them to proceed with deletion.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">{roleToDelete ? getRoleStaffCount(roleToDelete.name, roleToDelete.userCount || 0) : 0} staff member(s)</span> are currently assigned to <span className="font-bold">&quot;{roleToDelete?.name}&quot;</span>. Before this role can be deleted, you must choose a new role to transfer them to.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Transfer All Users To Role *
              </label>
              <select
                value={transferTargetRole}
                onChange={(e) => setTransferTargetRole(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white/90 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {configuredRoles
                  .filter((r) => r.id !== roleToDelete?.id && r.name !== roleToDelete?.name)
                  .map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name} {r.name === 'Super Admin' ? '(Root Admin)' : r.isSystem ? '(System Role)' : '(Custom Role)'}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                Transferred users will automatically inherit the baseline permissions of the selected replacement role.
              </p>
            </div>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTransferDeleteModal(false);
                setRoleToDelete(null);
              }}
              disabled={isDeletingRole}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmTransferDelete}
              disabled={isDeletingRole || !transferTargetRole}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
            >
              <IconTrash className="w-3.5 h-3.5" />
              <span>{isDeletingRole ? 'Transferring & Deleting…' : `Transfer ${roleToDelete ? getRoleStaffCount(roleToDelete.name, roleToDelete.userCount || 0) : 0} Users & Delete`}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Manager Team Card Component
const ManagerTeamCard = ({ manager }: { manager: User }) => {
  const { isLoading: isLoadingTeam } = useQuery({
    queryKey: ['manager-team', manager._id],
    queryFn: async () => {
      // We need to fetch team data - but managerAPI requires manager authentication
      // So we'll calculate from users list instead
      return null;
    },
    enabled: false, // Disable for now, we'll calculate from users
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userAPI.getAll();
      return response.data || response;
    },
  });

  const teamMembers = useMemo(() => {
    if (!allUsers) return [];
    const users = Array.isArray(allUsers) ? allUsers : allUsers.data || [];
    return users.filter((user: User) => {
      if (typeof user.managedBy === 'object') {
        return user.managedBy?._id === manager._id;
      }
      return user.managedBy === manager._id;
    });
  }, [allUsers, manager._id]);

  const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

  return (
    <Link href={`/superadmin/users/team/${manager._id}`}>
      <Card className="p-4 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {manager.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{manager.email}</p>
          </div>
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
            Manager
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Team Members</span>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isLoadingTeam ? '...' : formatNumber(teamMembers.length)}
            </span>
          </div>

          {teamMembers.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Team Members:
              </p>
              <div className="space-y-1">
                {teamMembers.slice(0, 3).map((member: User) => (
                  <div
                    key={member._id}
                    className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {member.name} ({member.roleName})
                  </div>
                ))}
                {teamMembers.length > 3 && (
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    +{teamMembers.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {teamMembers.length === 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No team members assigned yet
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center">
            Click to view team analytics →
          </p>
        </div>
      </Card>
    </Link>
  );
};

export default UserManagementPage;
