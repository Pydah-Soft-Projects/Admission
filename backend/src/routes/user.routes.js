import express from 'express';
import {
  getUsers,
  getAssignableUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  searchHrmsEmployees,
  getHrmsEmployeeByMongoId,
  getHrmsEmployeeByEmpNo,
  getRoleConfigurations,
  createRoleConfiguration,
  updateRoleConfiguration,
  deleteRoleConfiguration,
} from '../controllers/user.controller.js';
import { getMySettings, updateMySettings } from '../controllers/userSettings.controller.js';
import { updateMyProfile } from '../controllers/userProfile.controller.js';
import { getMyLoginLogs, getAllUserLoginLogs } from '../controllers/userLoginLogs.controller.js';
import { getUserAuditLogs, getAllUserAuditLogs } from '../controllers/userAudit.controller.js';
import { protect, isSuperAdmin, requireModule, requireTimeTrackingEnabled } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Role Configurations - must be defined before /:id to avoid ID conflict
router.get('/roles/config', getRoleConfigurations);
router.post('/roles/config', requireModule('users', 'write'), createRoleConfiguration);
router.put('/roles/config/:id', requireModule('users', 'write'), updateRoleConfiguration);
router.delete('/roles/config/:id', requireModule('users', 'write'), deleteRoleConfiguration);

// Current user's settings and login logs (no time-tracking restriction - user must access settings to enable)
router.get('/me/settings', getMySettings);
router.put('/me/settings', updateMySettings);
router.put('/me/profile', updateMyProfile);
router.get('/me/login-logs', getMyLoginLogs);

// Routes that require User Management permission
router.route('/').get(requireModule('users'), getUsers).post(requireModule('users', 'write'), createUser);
router.get('/assignable', requireModule('users'), getAssignableUsers);
router.get('/all/login-logs', requireModule('users'), getAllUserLoginLogs);
router.get('/all/audit-logs', requireModule('users'), getAllUserAuditLogs);
router.get('/hrms/search', requireModule('users'), searchHrmsEmployees);
router.get('/hrms/id/:mongoId', requireModule('users'), getHrmsEmployeeByMongoId);
router.get('/hrms/:empNo', requireModule('users'), getHrmsEmployeeByEmpNo);
router.get('/:id/audit-logs', requireModule('users'), getUserAuditLogs);

// Require time tracking for User/Counsellor/Manager dashboard routes below
router.use(requireTimeTrackingEnabled);

// Get user route - accessible to Super Admin and Managers (for their team members)
// Must be defined before PUT/DELETE to avoid route conflicts
router.get('/:id', getUser);

// Update and delete routes - User Management write permission required
router.put('/:id', requireModule('users', 'write'), updateUser);
router.delete('/:id', requireModule('users', 'write'), deleteUser);

export default router;

