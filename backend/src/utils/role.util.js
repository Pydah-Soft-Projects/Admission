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

  if (perms && typeof perms === 'string') {
    try {
      perms = JSON.parse(perms);
    } catch {
      perms = null;
    }
  }

  // Check if permissions object has any active module granted
  if (perms && typeof perms === 'object') {
    return Object.entries(perms).some(([key, val]) => {
      if (key === 'allowedSources' || key === 'extraPermissions') return false;
      if (val && typeof val === 'object' && (val.access === true || val.access === 'true')) {
        return true;
      }
      return false;
    });
  }

  return false;
};

/**
 * Checks if a user has access to a specific module.
 * Super Admin and Sub Super Admin always have access to all modules.
 * Other users have access if their effective permissions object grants access to the module.
 * @param {object|string} userOrRole - User object or role name
 * @param {string} moduleKey - Module name ('reports', 'visitors', 'leads', 'communications', 'users', 'joining', 'payments', 'formBuilder', 'masterData', 'utmBuilder')
 * @param {'read'|'write'} requiredLevel - Minimum required level ('read' or 'write')
 * @returns {boolean}
 */
export const hasModuleAccess = (userOrRole, moduleKey, requiredLevel = 'read') => {
  if (!userOrRole) return false;

  let roleName = '';
  let perms = null;

  if (typeof userOrRole === 'object') {
    roleName = userOrRole.roleName || userOrRole.role_name || '';
    perms = userOrRole.permissions;
  } else {
    roleName = String(userOrRole || '');
  }

  // Super Admin and Sub Super Admin have full access
  if (roleName === 'Super Admin' || roleName === 'Sub Super Admin') {
    return true;
  }

  if (!perms) return false;

  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms);
    } catch {
      return false;
    }
  }

  if (typeof perms !== 'object') return false;

  // Resolve module permission object with alias fallbacks
  let mod = perms[moduleKey];
  if (!mod || typeof mod !== 'object') {
    if (moduleKey === 'users') mod = perms.userManagement;
    else if (moduleKey === 'userManagement') mod = perms.users;
    else if (moduleKey === 'formBuilder') mod = perms.form_builder;
    else if (moduleKey === 'utmBuilder') mod = perms.utm_builder || perms.utm;
    else if (moduleKey === 'masterData') mod = perms.master_data || perms.locations;
  }

  if (!mod || typeof mod !== 'object') {
    return false;
  }

  const hasAccess = mod.access === true || mod.access === 'true';
  if (!hasAccess) return false;

  if (requiredLevel === 'write') {
    const level = String(mod.level || 'write').toLowerCase();
    return level === 'write' || level === 'read_write' || level === 'admin';
  }

  return true;
};

export const isTrueSuperAdmin = (roleOrUser = '') => {
  const roleName =
    roleOrUser && typeof roleOrUser === 'object'
      ? roleOrUser.roleName || roleOrUser.role_name || ''
      : String(roleOrUser || '');
  return roleName === 'Super Admin';
};

/**
 * Pure merger that applies role baseline permissions and overlays user-specific extra permissions and lead sources.
 * @param {object|string} roleBaseline - Role baseline permissions from role_configurations
 * @param {object|string} userPerms - User-specific stored permissions
 * @returns {object} Merged effective permissions
 */
export const mergeEffectivePermissions = (roleBaseline = {}, userPerms = {}, roleName = '') => {
  if (roleName === 'Sub Super Admin') {
    let user = {};
    if (typeof userPerms === 'string') {
      try {
        user = JSON.parse(userPerms);
      } catch {
        user = {};
      }
    } else if (userPerms && typeof userPerms === 'object') {
      user = { ...userPerms };
    }
    return user;
  }

  let base = {};
  if (roleBaseline) {
    if (typeof roleBaseline === 'string') {
      try {
        base = JSON.parse(roleBaseline);
      } catch {
        base = {};
      }
    } else if (typeof roleBaseline === 'object') {
      base = { ...roleBaseline };
    }
  }

  let user = {};
  if (userPerms) {
    if (typeof userPerms === 'string') {
      try {
        user = JSON.parse(userPerms);
      } catch {
        user = {};
      }
    } else if (typeof userPerms === 'object') {
      user = { ...userPerms };
    }
  }

  // 1. Role baseline permissions strictly govern module access
  const effective = { ...base };

  // 2. Revoked permissions (explicitly removed from role for this user)
  const revoked = new Set();
  if (Array.isArray(user.revokedPermissions)) {
    user.revokedPermissions.forEach((k) => revoked.add(String(k).trim()));
  } else if (user.revokedPermissions && typeof user.revokedPermissions === 'object') {
    Object.entries(user.revokedPermissions).forEach(([k, v]) => {
      if (v === true || v === 'true') revoked.add(String(k).trim());
    });
  }

  // Also check extraPermissions with access === false
  if (user.extraPermissions && typeof user.extraPermissions === 'object') {
    Object.entries(user.extraPermissions).forEach(([k, v]) => {
      if (v && typeof v === 'object' && (v.access === false || v.access === 'false')) {
        revoked.add(String(k).trim());
      }
    });
  }

  // Remove revoked modules from effective
  revoked.forEach((modKey) => {
    delete effective[modKey];
    if (modKey === 'users') delete effective['userManagement'];
    if (modKey === 'userManagement') delete effective['users'];
    if (modKey === 'formBuilder') delete effective['form_builder'];
    if (modKey === 'utmBuilder') {
      delete effective['utm_builder'];
      delete effective['utm'];
    }
    if (modKey === 'masterData') {
      delete effective['master_data'];
      delete effective['locations'];
    }
  });

  effective.revokedPermissions = Array.from(revoked);

  // 3. Lead sources: preserve user's assigned lead sources
  if (Array.isArray(user.allowedSources)) {
    effective.allowedSources = user.allowedSources;
  } else if (!effective.allowedSources) {
    effective.allowedSources = [];
  }

  // 4. User explicit extra permissions (if explicitly granted for this individual user)
  if (user.extraPermissions && typeof user.extraPermissions === 'object') {
    effective.extraPermissions = user.extraPermissions;
    Object.entries(user.extraPermissions).forEach(([subKey, subVal]) => {
      if (
        subVal &&
        typeof subVal === 'object' &&
        (subVal.access === true || subVal.access === 'true') &&
        !revoked.has(subKey)
      ) {
        effective[subKey] = subVal;
      }
    });
  }

  return effective;
};

/**
 * Resolves effective permissions by looking up role_configurations baseline and merging user-level overrides.
 * @param {object} pool - MySQL pool connection
 * @param {string} roleName - User's role name
 * @param {object|string} rawUserPermissions - User's stored permissions
 * @returns {Promise<object>} Merged effective permissions
 */
export const resolveEffectivePermissions = async (pool, roleName, rawUserPermissions) => {
  let userPerms = {};
  if (rawUserPermissions) {
    if (typeof rawUserPermissions === 'string') {
      try {
        userPerms = JSON.parse(rawUserPermissions);
      } catch {
        userPerms = {};
      }
    } else if (typeof rawUserPermissions === 'object') {
      userPerms = rawUserPermissions;
    }
  }

  // Super Admin has full system access
  if (roleName === 'Super Admin') {
    return userPerms;
  }

  // Sub Super Admin has direct custom permissions
  if (roleName === 'Sub Super Admin') {
    return userPerms;
  }

  let roleBaseline = {};
  if (roleName && pool) {
    try {
      const [roleConfigs] = await pool.execute(
        'SELECT permissions FROM role_configurations WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(id)) = LOWER(TRIM(?))',
        [String(roleName).trim(), String(roleName).trim()]
      );
      if (roleConfigs.length > 0 && roleConfigs[0].permissions) {
        roleBaseline = typeof roleConfigs[0].permissions === 'string'
          ? JSON.parse(roleConfigs[0].permissions)
          : roleConfigs[0].permissions;
      }
    } catch (err) {
      console.error('Error fetching role baseline in resolveEffectivePermissions:', err);
    }
  }

  return mergeEffectivePermissions(roleBaseline, userPerms, roleName);
};


