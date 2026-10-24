// ============================================================================
// HR MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/hr/index.ts
// ============================================================================

export { HrViews, hrRoutes } from './routes';

export {
  useHr,
  useEmployees,
  useSaveEmployee,
  useAttendance,
  useShiftRosters,
} from './api/useHr';

export { hrApi } from './api/hrApi';

export {
  EmployeeSchema,
  CreateEmployeeInputSchema,
  UpdateEmployeeInputSchema,
  AttendanceRecordSchema,
  ShiftRosterSchema,
  PayrollRunSchema,
  SkillCertificationSchema,
  EmployeeStatusEnum,
  SkillLevelEnum,
  AttendanceStatusEnum,
  employeeFormSchema,
} from './model/hrSchemas';

export type {
  EmployeeContract,
  CreateEmployeeContract,
  UpdateEmployeeContract,
  AttendanceRecordContract,
  ShiftRosterContract,
  PayrollRunContract,
  SkillCertificationContract,
  EmployeeFormValues,
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
  HrDesignation,
  HrTrainingProgram,
  HrPpeInventoryItem,
  HrEmployeeStatus,
  HrEmployeeType,
  HrAttendanceStatus,
  HrSkillMatrixRecord,
} from './model/hrSchemas';

// HR Sub-components
export { HrAttendanceView } from './components/HrAttendanceView';
export { HrCommandCenter } from './components/HrCommandCenter';
export { HrComplianceContractView } from './components/HrComplianceContractView';
export { HrEmployeeDetailView } from './components/HrEmployeeDetailView';
export { HrEmployeeListView } from './components/HrEmployeeListView';
export { HrLeaveOvertimeView } from './components/HrLeaveOvertimeView';
export { HrOnboardingOffboardingView } from './components/HrOnboardingOffboardingView';
export { HrOrgStructureView } from './components/HrOrgStructureView';
export { HrPayrollView } from './components/HrPayrollView';
export { HrReportsAnalyticsView } from './components/HrReportsAnalyticsView';
export { HrSafetyPpeView } from './components/HrSafetyPpeView';
export { HrShiftRosterView } from './components/HrShiftRosterView';
export { HrSkillsTrainingView } from './components/HrSkillsTrainingView';
