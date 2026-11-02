import { getPool } from '../src/config-sql/database.js';

async function setup() {
  const pool = getPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS role_configurations (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255) DEFAULT '',
      color VARCHAR(30) DEFAULT '#0ea5e9',
      permissions JSON,
      is_system TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('role_configurations table created or verified.');

  const defaultRoles = [
    {
      id: 'super-admin',
      name: 'Super Admin',
      description: 'Unrestricted full access across all modules and administrative settings.',
      color: '#dc2626',
      is_system: 1,
      permissions: {
        leads: { access: true, permission: 'write' },
        joining: { access: true, permission: 'write', pageAdmissions: true, pageJoiningPipeline: true, pageConfirmedLeads: true, pageSelfRegistration: true, pageFeeRequests: true, editAdmission: true, editReference: true, approveFeeRequest: true, activateAdmission: true, requireStudentPhoto: false, admissionTabAbstract: true, admissionTabStudentInfo: true, admissionTabReference: true, admissionTabSource: true, admissionTabDateWise: true },
        payments: { access: true, permission: 'write' },
        users: { access: true, permission: 'write' },
        userManagement: { access: true, permission: 'write' },
        communications: { access: true, permission: 'write' },
        reports: { access: true, permission: 'write' },
        formBuilder: { access: true, permission: 'write' },
        utmBuilder: { access: true, permission: 'write' },
        masterData: { access: true, permission: 'write' },
        visitors: { access: true, permission: 'write' }
      }
    },
    {
      id: 'sub-super-admin',
      name: 'Sub Super Admin',
      description: 'High-level operational administrator with configurable module permissions.',
      color: '#ea580c',
      is_system: 1,
      permissions: {
        leads: { access: true, permission: 'write' },
        joining: { access: true, permission: 'write', pageAdmissions: true, pageJoiningPipeline: true, pageConfirmedLeads: true, pageSelfRegistration: true, pageFeeRequests: true, editAdmission: true, editReference: true, approveFeeRequest: false, activateAdmission: true, requireStudentPhoto: false, admissionTabAbstract: true, admissionTabStudentInfo: true, admissionTabReference: true, admissionTabSource: true, admissionTabDateWise: true },
        payments: { access: true, permission: 'write' },
        users: { access: true, permission: 'read' },
        userManagement: { access: true, permission: 'read' },
        communications: { access: true, permission: 'write' },
        reports: { access: true, permission: 'write' },
        formBuilder: { access: true, permission: 'write' },
        utmBuilder: { access: true, permission: 'write' },
        masterData: { access: true, permission: 'write' },
        visitors: { access: true, permission: 'write' }
      }
    },
    {
      id: 'student-counselor',
      name: 'Student Counselor',
      description: 'Lead engagement, admissions counseling, and student onboarding pipeline.',
      color: '#0284c7',
      is_system: 1,
      permissions: {
        leads: { access: true, permission: 'write' },
        joining: { access: true, permission: 'write', pageAdmissions: true, pageJoiningPipeline: true, pageConfirmedLeads: true, pageSelfRegistration: false, pageFeeRequests: false, editAdmission: false, editReference: false, approveFeeRequest: false, activateAdmission: false, requireStudentPhoto: false, admissionTabAbstract: true, admissionTabStudentInfo: true, admissionTabReference: true, admissionTabSource: true, admissionTabDateWise: true },
        payments: { access: false, permission: 'read' },
        users: { access: false, permission: 'read' },
        userManagement: { access: false, permission: 'read' },
        communications: { access: true, permission: 'write' },
        reports: { access: true, permission: 'read' },
        formBuilder: { access: false, permission: 'read' },
        utmBuilder: { access: false, permission: 'read' },
        masterData: { access: false, permission: 'read' },
        visitors: { access: true, permission: 'read' }
      }
    },
    {
      id: 'data-entry-user',
      name: 'Data Entry User',
      description: 'Bulk data ingestion, lead records creation, and visitor logs.',
      color: '#16a34a',
      is_system: 1,
      permissions: {
        leads: { access: true, permission: 'write' },
        joining: { access: false, permission: 'read', pageAdmissions: false, pageJoiningPipeline: false, pageConfirmedLeads: false, pageSelfRegistration: false, pageFeeRequests: false, editAdmission: false, editReference: false, approveFeeRequest: false, activateAdmission: false, requireStudentPhoto: false, admissionTabAbstract: false, admissionTabStudentInfo: false, admissionTabReference: false, admissionTabSource: false, admissionTabDateWise: false },
        payments: { access: false, permission: 'read' },
        users: { access: false, permission: 'read' },
        userManagement: { access: false, permission: 'read' },
        communications: { access: false, permission: 'read' },
        reports: { access: false, permission: 'read' },
        formBuilder: { access: false, permission: 'read' },
        utmBuilder: { access: false, permission: 'read' },
        masterData: { access: false, permission: 'read' },
        visitors: { access: true, permission: 'write' }
      }
    },
    {
      id: 'pro',
      name: 'PRO',
      description: 'Public Relations Officer for field campaigns, school visits, and lead outreach.',
      color: '#9333ea',
      is_system: 1,
      permissions: {
        leads: { access: true, permission: 'write' },
        joining: { access: false, permission: 'read', pageAdmissions: false, pageJoiningPipeline: false, pageConfirmedLeads: false, pageSelfRegistration: false, pageFeeRequests: false, editAdmission: false, editReference: false, approveFeeRequest: false, activateAdmission: false, requireStudentPhoto: false, admissionTabAbstract: false, admissionTabStudentInfo: false, admissionTabReference: false, admissionTabSource: false, admissionTabDateWise: false },
        payments: { access: false, permission: 'read' },
        users: { access: false, permission: 'read' },
        userManagement: { access: false, permission: 'read' },
        communications: { access: true, permission: 'write' },
        reports: { access: false, permission: 'read' },
        formBuilder: { access: false, permission: 'read' },
        utmBuilder: { access: false, permission: 'read' },
        masterData: { access: false, permission: 'read' },
        visitors: { access: true, permission: 'write' }
      }
    }
  ];

  for (const role of defaultRoles) {
    await pool.execute(`
      INSERT INTO role_configurations (id, name, description, color, permissions, is_system)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        color = VALUES(color),
        is_system = VALUES(is_system)
    `, [role.id, role.name, role.description, role.color, JSON.stringify(role.permissions), role.is_system]);
  }

  const [rows] = await pool.execute('SELECT id, name, description, is_system FROM role_configurations');
  console.log('Role configurations ready:', rows);
  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
