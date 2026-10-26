export const hasElevatedAdminPrivileges = (roleOrUser = '', permissions = null) => {
  let roleName = '';
  let perms = permissions;

  if (roleOrUser && typeof roleOrUser === 'object') {
    roleName = roleOrUser.roleName || roleOrUser.role_name || '';
    perms = perms || roleOrUser.permissions;
  } else {
    roleName = String(roleOrUser || '');
  }

  // Root Super Admin and Sub Super Admin always have elevated privileges
  if (roleName === 'Super Admin' || roleName === 'Sub Super Admin') {
    return true;
  }

  // Check if permissions object has any active module granted
  if (perms && typeof perms === 'object') {
    return Object.entries(perms).some(([key, val]) => {
      if (key === 'allowedSources') return false;
      if (val && typeof val === 'object' && (val.access === true || val.access === 'true')) {
        return true;
      }
      return false;
    });
  }

  return false;
};

export const isTrueSuperAdmin = (roleOrUser = '') => {
  const roleName =
    roleOrUser && typeof roleOrUser === 'object'
      ? roleOrUser.roleName || roleOrUser.role_name || ''
      : String(roleOrUser || '');
  return roleName === 'Super Admin';
};


