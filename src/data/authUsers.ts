import { AuthUser } from '../types';

export const ENTERPRISE_PLANTS = [
  { id: 'PLANT-01', name: 'Plant 01 — Pune / Chakan Industrial Hub (Extrusion & IMM)', location: 'Pune, Maharashtra' },
  { id: 'PLANT-02', name: 'Plant 02 — Sanand Precision Polymers (Blow Molding & Cleanroom)', location: 'Sanand, Gujarat' },
  { id: 'PLANT-03', name: 'Plant 03 — Chennai Auto Component Molding Unit', location: 'Sriperumbudur, Tamil Nadu' },
];

export const SHIFTS = [
  { id: 'SHIFT-A', name: 'Shift A — Morning (06:00 – 14:00)', lead: 'Vikram Singh' },
  { id: 'SHIFT-B', name: 'Shift B — Afternoon (14:00 – 22:00)', lead: 'Sunil Patil' },
  { id: 'SHIFT-C', name: 'Shift C — Night (22:00 – 06:00)', lead: 'Deepak More' },
  { id: 'SHIFT-GEN', name: 'General Shift (09:00 – 18:00)', lead: 'Management' },
];

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'USR-001',
    name: 'Priya Rao',
    email: 'priya.rao@reboot-erp.com',
    role: 'Plant Operations Director & Admin',
    roleType: 'admin',
    department: 'Executive Operations',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'Shift A — Morning (06:00 – 14:00)',
    badgeId: 'PLANT-001',
    pin: '1001',
    avatarColor: 'from-[#0F8B8D] to-[#E8622C]',
    initials: 'PR',
    permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance', 'sales']
  },
  {
    id: 'USR-002',
    name: 'Vikram Singh',
    email: 'vikram.s@reboot-erp.com',
    role: 'Production Supervisor & MES Lead',
    roleType: 'production',
    department: 'Manufacturing Execution',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'Shift A — Morning (06:00 – 14:00)',
    badgeId: 'PROD-042',
    pin: '2002',
    avatarColor: 'from-[#14213D] to-[#2563EB]',
    initials: 'VS',
    permissions: ['mfg', 'scheduler', 'maintenance', 'dispatch']
  },
  {
    id: 'USR-003',
    name: 'Ananya Sen',
    email: 'ananya.sen@reboot-erp.com',
    role: 'Quality Assurance Lead & Auditor',
    roleType: 'quality',
    department: 'Quality & SPC Laboratory',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'Shift A — Morning (06:00 – 14:00)',
    badgeId: 'QC-108',
    pin: '3003',
    avatarColor: 'from-[#16A34A] to-[#0F8B8D]',
    initials: 'AS',
    permissions: ['qc', 'spc', 'ncr', 'capa', 'coa', 'audit']
  },
  {
    id: 'USR-004',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@reboot-erp.com',
    role: 'Warehouse & Logistics Lead',
    roleType: 'warehouse',
    department: 'Supply Chain & Inventory',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'Shift A — Morning (06:00 – 14:00)',
    badgeId: 'WH-019',
    pin: '4004',
    avatarColor: 'from-[#D97706] to-[#E8622C]',
    initials: 'RS',
    permissions: ['wh', 'grn', 'mrp', 'stock', 'bin_mgmt']
  },
  {
    id: 'USR-005',
    name: 'Neha Deshmukh',
    email: 'neha.d@reboot-erp.com',
    role: 'Financial Controller & Cost Lead',
    roleType: 'finance',
    department: 'Finance & Accounts',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'General Shift (09:00 – 18:00)',
    badgeId: 'FIN-007',
    pin: '5005',
    avatarColor: 'from-[#9333EA] to-[#4F46E5]',
    initials: 'ND',
    permissions: ['finance', 'gl', 'costing', 'invoices', 'audit']
  },
  {
    id: 'USR-006',
    name: 'K. Iyer',
    email: 'k.iyer@reboot-erp.com',
    role: 'Senior IMM Press Operator',
    roleType: 'operator',
    department: 'Shop Floor Press Lines',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'Shift A — Morning (06:00 – 14:00)',
    badgeId: 'OPR-332',
    pin: '6006',
    avatarColor: 'from-[#64748B] to-[#334155]',
    initials: 'KI',
    permissions: ['operator', 'prod_entry', 'downtime_log']
  },
  {
    id: 'USR-007',
    name: 'Deepak Sawant',
    email: 'deepak.sawant@reboot-erp.com',
    role: 'HR & Labor Compliance Manager',
    roleType: 'hr',
    department: 'Human Resources & Personnel',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    shift: 'General Shift (09:00 – 18:00)',
    badgeId: 'HR-012',
    pin: '7007',
    avatarColor: 'from-[#4F46E5] to-[#0F8B8D]',
    initials: 'DS',
    permissions: ['all', 'hr', 'payroll', 'attendance', 'safety', 'compliance']
  }
];
