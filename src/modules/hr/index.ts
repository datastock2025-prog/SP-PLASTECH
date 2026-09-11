// ============================================================================
// DOMAIN MODULE: HUMAN RESOURCES & WORKFORCE MANAGEMENT
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { HrViews } from '../../components/HrViews';
export {
  INITIAL_HR_DEPARTMENTS,
  INITIAL_HR_DESIGNATIONS,
  INITIAL_HR_EMPLOYEES,
  INITIAL_HR_ATTENDANCE,
  INITIAL_HR_SHIFTS,
  INITIAL_HR_ROSTER,
  INITIAL_HR_SHIFT_ROSTER,
  INITIAL_HR_LEAVES,
  INITIAL_HR_OVERTIME,
  INITIAL_HR_TRAININGS,
  INITIAL_HR_SKILL_MATRIX,
  INITIAL_HR_INCIDENTS,
  INITIAL_HR_PPE_MASTER,
  INITIAL_HR_PPE_ISSUES,
  INITIAL_HR_PAYROLL_ROWS,
  INITIAL_HR_PAYROLL_INPUTS,
  INITIAL_HR_LABOR_ALLOCATION,
  INITIAL_HR_COMPLIANCE_DOCS,
  INITIAL_HR_CONTRACT_AGENCIES,
  INITIAL_HR_PPE_INVENTORY,
  INITIAL_HR_SAFETY_INCIDENTS,
  INITIAL_HR_SKILLS_MATRIX,
  INITIAL_HR_AUDIT_LOGS,
} from '../../data/hrData';

export type {
  HrEmployee,
  HrDepartment,
  HrAttendanceRecord,
  HrShiftMaster,
  HrShiftRosterCell,
  HrLeaveRequest,
  HrOvertimeRequest,
  HrTrainingMaster,
  HrSkillMatrixItem,
  HrSafetyIncident,
  HrPpeMasterItem,
  HrPpeIssueRecord,
  HrPayrollInputRow,
  HrLaborAllocationLine,
  HrComplianceDoc,
  HrContractAgency,
  HrAuditEntry,
} from '../../types';
