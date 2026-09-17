import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  public async seedDatabase() {
    try {
      // 1. Seed Enterprise Multi-Plant Facilities
      await this.db.query(`
        INSERT INTO tenant_profiles (id, code, name, location, entity_type, address, contact_person, contact_email, contact_phone, gstin, capacity_rating, is_default)
        VALUES 
          ('PLANT-01', 'PLANT-01', 'Plant 01: Injection Molding Unit', 'Pune / Chakan Industrial Corridor, Maharashtra', 'Plant', 'Plot B-12, Chakan Industrial Area, Phase II, Pune 410501', 'Priya Rao', 'priya.rao@reboot-erp.com', '+91 98230 11223', '27AAACR1234F1Z5', '24 IMM Bays (120T - 1300T)', true),
          ('PLANT-02', 'PLANT-02', 'Plant 02: Extrusion & Pipe Unit', 'Sanand Precision Park, Gujarat', 'Plant', 'Plot 44, GIDC Sanand II, Ahmedabad 382110', 'Vikram Patel', 'vikram.patel@reboot-erp.com', '+91 98230 22334', '24AAACR1234F1Z8', '16 High-Precision IMMs', false),
          ('PLANT-03', 'PLANT-03', 'Plant 03: Blow Molding & Cleanroom', 'Chennai Molding Unit, Tamil Nadu', 'Plant', 'SIPCOT Industrial Park, Sriperumbudur 602105', 'Karthik Subramanian', 'karthik.s@reboot-erp.com', '+91 98230 33445', '33AAACR1234F1Z1', '12 Blow & Stretch Bays', false),
          ('PLANT-04', 'PLANT-04', 'Plant 04: Compounding & Masterbatch', 'Vapi Chemical Zone, Gujarat', 'Plant', 'Phase IV GIDC, Vapi 396195', 'Deepak Mehta', 'deepak.m@reboot-erp.com', '+91 98230 44556', '24AAACR1234F1Z9', '8 Twin-Screw Extruders', false),
          ('WH-01', 'WH-01', 'WH 01: Raw Material Silo & Resin Warehouse', 'Hosur Logistics Hub, Tamil Nadu', 'Warehouse', 'Sipcot Phase 1, Hosur 635126', 'Manoj Kumar', 'manoj.k@reboot-erp.com', '+91 98230 55667', '33AAACR1234F1Z2', '10 Silos / 15,000 MT', false),
          ('WH-02', 'WH-02', 'WH 02: Finished Goods Central Distribution', 'Manesar Distribution Center, Haryana', 'Warehouse', 'Sector 8, IMT Manesar 122051', 'Ramesh Yadav', 'ramesh.y@reboot-erp.com', '+91 98230 66778', '06AAACR1234F1Z3', '50,000 Sq Ft Racked Bay', false),
          ('CORP-HQ', 'CORP-HQ', 'Corporate Headquarters & Shared Services', 'Bengaluru Tech Park, Karnataka', 'Corporate office', 'Level 8, UB City Tower, Bengaluru 560001', 'Dr. Evelyn Reed', 'security.admin@rebooterp.com', '+91 98230 00001', '29AAACR1234F1Z4', 'Enterprise Tier', false)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          location = EXCLUDED.location;
      `);

      // 2. Seed Enterprise Roles
      await this.db.query(`
        INSERT INTO auth_roles (id, name, description, scope, department, is_system_role)
        VALUES 
          ('ROLE-SUPER-ADMIN', 'Super Administrator', 'Full System Master Configuration & RBAC', 'Enterprise-wide', 'Executive Leadership', true),
          ('ROLE-PLANT-MANAGER', 'Plant Operations Director', 'OEE, Production Schedules & Floor Overrides', 'Plant Scoped', 'Manufacturing Execution', true),
          ('ROLE-PROD-PLANNER', 'Production Planner', 'MRP Runs, JIT Scheduling & Job Cards', 'Plant Scoped', 'Manufacturing Execution', false),
          ('ROLE-OPERATOR', 'Machine Operator', 'Shop Floor Press Execution & Downtime Logging', 'Press Scoped', 'Shop Floor Operations', false),
          ('ROLE-QA-LEAD', 'Quality Assurance Lead', 'CMM Scans, Lab Inspections & NCR Dispositions', 'Plant Scoped', 'Quality Assurance', false),
          ('ROLE-MAINTENANCE-LEAD', 'Maintenance Engineer', 'Mold PM, Machine Breakdown & Tooling Spares', 'Plant Scoped', 'Maintenance & Facilities', false),
          ('ROLE-FINANCE-CONTROLLER', 'Financial Controller', 'Cost Rollup, AR/AP, Invoices & GST Returns', 'Enterprise-wide', 'Finance & Accounting', false),
          ('ROLE-HR-MANAGER', 'Industrial HR Manager', 'Shift Rotations, Overtime & Biometric Attendance', 'Plant Scoped', 'Human Resources', false),
          ('ROLE-PROCUREMENT-OFFICER', 'Procurement Officer', 'Polymer Resins, Additives & RFQ Comparisons', 'Enterprise-wide', 'Supply Chain Management', false),
          ('ROLE-WAREHOUSE-LEAD', 'Warehouse Staff', 'Inward GRN, Silo Bins & Material Transfers', 'Plant Scoped', 'Warehouse & Inventory', false)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description;
      `);

      // 3. Seed Permissions Mapping
      const allPermissions = [
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.impersonate',
        'roles.manage', 'tenant.config', 'audit.view', 'audit.export',
        'finance.view', 'finance.create', 'finance.edit', 'finance.delete', 'finance.approve', 'finance.export',
        'payroll.view', 'payroll.process', 'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.approve', 'sales.export',
        'procurement.view', 'procurement.create', 'procurement.edit', 'procurement.delete', 'procurement.approve',
        'mfg.view', 'mfg.plan', 'mfg.schedule', 'mfg.execute', 'mfg.abort',
        'quality.view', 'quality.inspect', 'quality.release', 'quality.reject', 'quality.ncr',
        'warehouse.view', 'warehouse.transfer', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.reconcile', 'warehouse.audit',
        'reports.view', 'reports.export', 'reports.sensitive', 'compliance.manage'
      ];

      for (const perm of allPermissions) {
        await this.db.query(
          `INSERT INTO auth_role_permissions (role_id, permission_key) VALUES ('ROLE-SUPER-ADMIN', $1) ON CONFLICT DO NOTHING;`,
          [perm]
        );
      }

      // 4. Seed Comprehensive Admin User Directory
      const defaultPasswordHash = await bcrypt.hash('Reboot2026!#', 10);
      const defaultPinHash = await bcrypt.hash('1234', 10);

      const users = [
        {
          id: 'USR-001',
          username: 'priya.rao',
          email: 'priya.rao@reboot-erp.com',
          fullName: 'Priya Rao',
          phone: '+91 98230 11223',
          designation: 'VP of Manufacturing & Plant Operations',
          department: 'Executive Operations',
          roleId: 'ROLE-SUPER-ADMIN',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01', 'PLANT-02', 'PLANT-03'],
          badgeId: 'EMP-ADM-01',
          assignedShift: 'General Shift (09:00 – 18:00)',
          avatarColor: 'from-[#0F8B8D] to-[#E8622C]',
          initials: 'PR',
          status: 'Active',
          mfaEnabled: true,
        },
        {
          id: 'USR-002',
          username: 'vikram.patel',
          email: 'vikram.patel@reboot-erp.com',
          fullName: 'Vikram Patel',
          phone: '+91 98230 22334',
          designation: 'Plant Operations Director',
          department: 'Manufacturing Execution',
          roleId: 'ROLE-PLANT-MANAGER',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01'],
          badgeId: 'EMP-PLANT-01',
          assignedShift: 'Shift A — Morning (06:00 – 14:00)',
          avatarColor: 'from-[#0F8B8D] to-[#2B2D42]',
          initials: 'VP',
          status: 'Active',
          mfaEnabled: true,
        },
        {
          id: 'USR-003',
          username: 'ananya.deshmukh',
          email: 'ananya.deshmukh@reboot-erp.com',
          fullName: 'Ananya Deshmukh',
          phone: '+91 98230 33445',
          designation: 'Head of Quality Assurance & IATF Lead',
          department: 'Quality Assurance',
          roleId: 'ROLE-QA-LEAD',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01', 'PLANT-02'],
          badgeId: 'EMP-QC-01',
          assignedShift: 'General Shift (09:00 – 18:00)',
          avatarColor: 'from-[#2A9D8F] to-[#264653]',
          initials: 'AD',
          status: 'Active',
          mfaEnabled: true,
        },
        {
          id: 'USR-004',
          username: 'rajesh.kumar',
          email: 'rajesh.kumar@reboot-erp.com',
          fullName: 'Rajesh Kumar',
          phone: '+91 98230 44556',
          designation: 'Senior Press Operator (Bays 1-6)',
          department: 'Shop Floor Operations',
          roleId: 'ROLE-OPERATOR',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01'],
          badgeId: 'EMP-OP-04',
          assignedShift: 'Shift A — Morning (06:00 – 14:00)',
          avatarColor: 'from-[#E8622C] to-[#F4A261]',
          initials: 'RK',
          status: 'Active',
          mfaEnabled: false,
        },
        {
          id: 'USR-005',
          username: 'suresh.menon',
          email: 'suresh.menon@reboot-erp.com',
          fullName: 'Suresh Menon',
          phone: '+91 98230 55667',
          designation: 'Lead Production Planner & S&OP Master',
          department: 'Manufacturing Execution',
          roleId: 'ROLE-PROD-PLANNER',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01', 'PLANT-02'],
          badgeId: 'EMP-PLAN-01',
          assignedShift: 'General Shift (09:00 – 18:00)',
          avatarColor: 'from-[#457B9D] to-[#1D3557]',
          initials: 'SM',
          status: 'Active',
          mfaEnabled: true,
        },
        {
          id: 'USR-006',
          username: 'neha.sharma',
          email: 'neha.sharma@reboot-erp.com',
          fullName: 'Neha Sharma',
          phone: '+91 98230 66778',
          designation: 'Financial Controller & Cost Accountant',
          department: 'Finance & Accounting',
          roleId: 'ROLE-FINANCE-CONTROLLER',
          tenantId: 'CORP-HQ',
          plantIds: ['PLANT-01', 'PLANT-02', 'PLANT-03', 'CORP-HQ'],
          badgeId: 'EMP-FIN-01',
          assignedShift: 'General Shift (09:00 – 18:00)',
          avatarColor: 'from-[#6A4C93] to-[#1982C4]',
          initials: 'NS',
          status: 'Active',
          mfaEnabled: true,
        },
        {
          id: 'USR-007',
          username: 'arun.kulkarni',
          email: 'arun.kulkarni@reboot-erp.com',
          fullName: 'Arun Kulkarni',
          phone: '+91 98230 77889',
          designation: 'Chief Tooling & Maintenance Engineer',
          department: 'Maintenance & Facilities',
          roleId: 'ROLE-MAINTENANCE-LEAD',
          tenantId: 'PLANT-01',
          plantIds: ['PLANT-01'],
          badgeId: 'EMP-MNT-01',
          assignedShift: 'General Shift (09:00 – 18:00)',
          avatarColor: 'from-[#E76F51] to-[#264653]',
          initials: 'AK',
          status: 'Active',
          mfaEnabled: false,
        },
      ];

      for (const u of users) {
        await this.db.query(
          `INSERT INTO auth_users (id, username, email, full_name, phone, designation, department, role_id, tenant_id, plant_ids, assigned_shift, badge_id, avatar_color, initials, password_hash, pin_hash, status, mfa_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             role_id = EXCLUDED.role_id,
             department = EXCLUDED.department,
             plant_ids = EXCLUDED.plant_ids;`,
          [
            u.id,
            u.username,
            u.email,
            u.fullName,
            u.phone,
            u.designation,
            u.department,
            u.roleId,
            u.tenantId,
            JSON.stringify(u.plantIds),
            u.assignedShift,
            u.badgeId,
            u.avatarColor,
            u.initials,
            defaultPasswordHash,
            defaultPinHash,
            u.status,
            u.mfaEnabled,
          ]
        );
      }

      // 5. Seed Document Numbering Sequences
      const numberingSequences = [
        { id: 'SEQ-WO-01', tenantId: 'PLANT-01', module: 'Manufacturing', documentType: 'Work Order', prefix: 'WO-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 416, samplePreview: 'WO-2026-0416' },
        { id: 'SEQ-PO-01', tenantId: 'PLANT-01', module: 'Procurement', documentType: 'Purchase Order', prefix: 'PO-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 90, samplePreview: 'PO-2026-0090' },
        { id: 'SEQ-SO-01', tenantId: 'PLANT-01', module: 'Sales', documentType: 'Sales Order', prefix: 'SO-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 115, samplePreview: 'SO-2026-0115' },
        { id: 'SEQ-GRN-01', tenantId: 'PLANT-01', module: 'Procurement', documentType: 'Goods Receipt Note (GRN)', prefix: 'GRN-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 204, samplePreview: 'GRN-2026-0204' },
        { id: 'SEQ-NCR-01', tenantId: 'PLANT-01', module: 'Quality', documentType: 'Non-Conformance Report (NCR)', prefix: 'NCR-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 42, samplePreview: 'NCR-2026-0042' },
        { id: 'SEQ-CAPA-01', tenantId: 'PLANT-01', module: 'Quality', documentType: '8D CAPA Action', prefix: 'CAPA-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 19, samplePreview: 'CAPA-2026-0019' },
        { id: 'SEQ-JE-01', tenantId: 'PLANT-01', module: 'Finance', documentType: 'Journal Entry Voucher', prefix: 'JE-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 93, samplePreview: 'JE-2026-0093' },
        { id: 'SEQ-INV-01', tenantId: 'PLANT-01', module: 'Finance', documentType: 'Customer Tax Invoice', prefix: 'INV-', includeYear: true, yearFormat: 'YYYY', paddingLength: 5, currentNumber: 1042, samplePreview: 'INV-2026-01042' },
        { id: 'SEQ-DC-01', tenantId: 'PLANT-01', module: 'Sales', documentType: 'Delivery Challan (Dispatch)', prefix: 'DC-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 312, samplePreview: 'DC-2026-0312' },
        { id: 'SEQ-ST-01', tenantId: 'PLANT-01', module: 'Warehouse', documentType: 'Stock Transfer Shipment', prefix: 'ST-', includeYear: true, yearFormat: 'YYYY', paddingLength: 4, currentNumber: 88, samplePreview: 'ST-2026-0088' },
        { id: 'SEQ-BOM-01', tenantId: 'PLANT-01', module: 'Engineering', documentType: 'BOM Master Formula', prefix: 'BOM-', includeYear: false, paddingLength: 4, currentNumber: 108, samplePreview: 'BOM-0108' },
        { id: 'SEQ-ECO-01', tenantId: 'PLANT-01', module: 'Engineering', documentType: 'Engineering Change Order', prefix: 'ECO-', includeYear: true, yearFormat: 'YYYY', paddingLength: 3, currentNumber: 24, samplePreview: 'ECO-2026-024' },
      ];

      for (const s of numberingSequences) {
        await this.db.query(
          `INSERT INTO admin_numbering_sequences (id, tenant_id, module, document_type, prefix, include_year, year_format, padding_length, current_number, sample_preview)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             current_number = EXCLUDED.current_number,
             sample_preview = EXCLUDED.sample_preview;`,
          [s.id, s.tenantId, s.module, s.documentType, s.prefix, s.includeYear, s.yearFormat || 'YYYY', s.paddingLength, s.currentNumber, s.samplePreview]
        );
      }

      // 6. Seed Approval Workflows
      const workflows = [
        {
          id: 'WF-PO-01',
          tenantId: 'PLANT-01',
          name: 'Purchase Order Multi-Tier Signoff',
          module: 'Procurement',
          documentType: 'Purchase Order',
          description: 'Tier 1: Plant Lead up to ₹50,000; Tier 2: Finance Controller up to ₹5,00,000; Tier 3: Director above ₹5,00,000',
          minAmount: 0,
          maxAmount: 10000000,
          tiers: [
            { tierNumber: 1, name: 'Plant Operations Lead', roleId: 'ROLE-PLANT-MANAGER', thresholdAmount: 50000, isMandatory: true },
            { tierNumber: 2, name: 'Finance Controller', roleId: 'ROLE-FINANCE-CONTROLLER', thresholdAmount: 500000, isMandatory: true },
            { tierNumber: 3, name: 'Executive Director', roleId: 'ROLE-SUPER-ADMIN', thresholdAmount: 10000000, isMandatory: true },
          ],
        },
        {
          id: 'WF-ECO-01',
          tenantId: 'PLANT-01',
          name: 'Engineering Change Order (ECO) Review',
          module: 'Engineering',
          documentType: 'ECO Order',
          description: 'Mandatory dual signoff by Quality Assurance Lead and Tooling Maintenance Lead.',
          minAmount: 0,
          tiers: [
            { tierNumber: 1, name: 'QA & Compliance Lead', roleId: 'ROLE-QA-LEAD', thresholdAmount: 0, isMandatory: true },
            { tierNumber: 2, name: 'Tooling Lead Engineer', roleId: 'ROLE-MAINTENANCE-LEAD', thresholdAmount: 0, isMandatory: true },
          ],
        },
        {
          id: 'WF-JE-01',
          tenantId: 'PLANT-01',
          name: 'Manual Journal Entry Posting',
          module: 'Finance',
          documentType: 'Journal Entry',
          description: 'Segregation of duties: Creator cannot self-approve entries above ₹1,00,000.',
          minAmount: 100000,
          tiers: [
            { tierNumber: 1, name: 'Financial Controller Signoff', roleId: 'ROLE-FINANCE-CONTROLLER', thresholdAmount: 100000, isMandatory: true },
          ],
        },
      ];

      for (const w of workflows) {
        await this.db.query(
          `INSERT INTO admin_approval_workflows (id, tenant_id, name, module, document_type, description, min_amount, max_amount, tiers)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             tiers = EXCLUDED.tiers;`,
          [w.id, w.tenantId, w.name, w.module, w.documentType, w.description, w.minAmount, w.maxAmount || null, JSON.stringify(w.tiers)]
        );
      }

      // 7. Seed Global System Parameters
      const systemParameters = [
        { id: 'PARAM-SEC-01', tenantId: 'PLANT-01', paramGroup: 'Security', paramKey: 'SESSION_INACTIVITY_TIMEOUT_MINUTES', paramName: 'Inactivity Idle Timeout', paramValue: '15', defaultValue: '15', valueType: 'NUMBER', description: 'Minutes of client inactivity before warning prompt triggers.' },
        { id: 'PARAM-SEC-02', tenantId: 'PLANT-01', paramGroup: 'Security', paramKey: 'MFA_ENFORCEMENT_POLICY', paramName: 'Enterprise MFA Policy', paramValue: 'REQUIRED_FOR_ADMINS', defaultValue: 'OPTIONAL', valueType: 'STRING', description: 'Enforcement level for TOTP two-factor authentication.' },
        { id: 'PARAM-SEC-03', tenantId: 'PLANT-01', paramGroup: 'Security', paramKey: 'MAX_FAILED_LOGIN_ATTEMPTS', paramName: 'Max Failed Login Lockout', paramValue: '5', defaultValue: '5', valueType: 'NUMBER', description: 'Failed password/PIN attempts before temporary terminal lock.' },
        { id: 'PARAM-MFG-01', tenantId: 'PLANT-01', paramGroup: 'Scheduling', paramKey: 'DEFAULT_SHIFT_DURATION_HOURS', paramName: 'Standard Shift Length', paramValue: '8', defaultValue: '8', valueType: 'NUMBER', description: 'Hours per operational production shift.' },
        { id: 'PARAM-QC-01', tenantId: 'PLANT-01', paramGroup: 'Quality', paramKey: 'AQL_DEFAULT_CRITICAL_DEFECT_LIMIT', paramName: 'AQL Critical Defect Threshold (%)', paramValue: '0.00', defaultValue: '0.00', valueType: 'NUMBER', description: 'Zero-tolerance acceptance quality limit for safety-critical parts.' },
        { id: 'PARAM-FIN-01', tenantId: 'PLANT-01', paramGroup: 'Finance', paramKey: 'AUTO_POSTING_TOLERANCE_INR', paramName: 'Invoice 3-Way Match Tolerance (₹)', paramValue: '500', defaultValue: '500', valueType: 'NUMBER', description: 'Maximum allowed line discrepancy for automated invoice clearance.' },
      ];

      for (const p of systemParameters) {
        await this.db.query(
          `INSERT INTO admin_system_parameters (id, tenant_id, param_group, param_key, param_name, param_value, default_value, value_type, description, is_system)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
           ON CONFLICT (id) DO UPDATE SET
             param_value = EXCLUDED.param_value;`,
          [p.id, p.tenantId, p.paramGroup, p.paramKey, p.paramName, p.paramValue, p.defaultValue, p.valueType, p.description]
        );
      }

      this.logger.log('Database seeded with full enterprise admin mock data (Users, Roles, Plants, Numbering, Workflows, Parameters).');
    } catch (err: any) {
      this.logger.warn(`Seed execution note: ${err.message}`);
    }
  }
}
