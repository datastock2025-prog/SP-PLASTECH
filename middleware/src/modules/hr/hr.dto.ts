import { z } from 'zod';

// ============================================================================
// DTOs for Module-7: People (HR) (All 10 Screens)
// ============================================================================

// ----------------------------------------------------------------------------
// Screen 2: Employee Master (360°)
// ----------------------------------------------------------------------------
export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);

export const EmploymentTypeEnum = z.enum([
  'PERMANENT',
  'CONTRACT',
  'TEMPORARY',
  'INTERN',
  'APPRENTICE',
  'CONSULTANT',
]);

export const EmploymentStatusEnum = z.enum([
  'ACTIVE',
  'ON_PROBATION',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
  'RETIRED',
]);

export const CreateEmployeeDtoSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Phone number is required'),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: GenderEnum.default('MALE'),
  bloodGroup: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional().default('Indian'),
  photoUrl: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  plantId: z.string().optional(),
  workCenterId: z.string().optional(),
  employmentType: EmploymentTypeEnum.default('PERMANENT'),
  employmentStatus: EmploymentStatusEnum.default('ACTIVE'),
  dateOfJoining: z.string().default(new Date().toISOString().split('T')[0]),
  dateOfConfirmation: z.string().optional(),
  noticePeriodDays: z.number().int().optional().default(30),
  probationPeriodDays: z.number().int().optional().default(90),
  ctc: z.number().positive('CTC must be positive'),
  basicSalary: z.number().positive('Basic salary must be positive'),
  hra: z.number().min(0).default(0),
  specialAllowance: z.number().min(0).default(0),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
  uan: z.string().optional(),
  esi: z.string().optional(),
  reportingToId: z.string().optional(),
  permanentAddress: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentState: z.string().optional(),
  permanentPincode: z.string().optional(),
  currentAddress: z.string().optional(),
  currentCity: z.string().optional(),
  currentState: z.string().optional(),
  currentPincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateEmployeeDto = z.input<typeof CreateEmployeeDtoSchema>;

export const UpdateEmployeeDtoSchema = CreateEmployeeDtoSchema.partial();
export type UpdateEmployeeDto = z.input<typeof UpdateEmployeeDtoSchema>;

export const ExitEmployeeDtoSchema = z.object({
  dateOfExit: z.string().default(new Date().toISOString().split('T')[0]),
  exitReason: z.string().min(3, 'Exit reason is required'),
  employmentStatus: z.enum(['TERMINATED', 'RESIGNED', 'RETIRED']).default('RESIGNED'),
});
export type ExitEmployeeDto = z.input<typeof ExitEmployeeDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 3: Biometric Attendance & Punches
// ----------------------------------------------------------------------------
export const AttendanceStatusEnum = z.enum([
  'PRESENT',
  'ABSENT',
  'HALF_DAY',
  'LATE',
  'EARLY_LEAVE',
  'WEEKLY_OFF',
  'HOLIDAY',
  'ON_LEAVE',
  'PENDING',
]);

export const RecordPunchDtoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  punchTime: z.string().default(new Date().toISOString()),
  punchType: z.enum(['IN', 'OUT', 'AUTO']).default('AUTO'),
  biometricDeviceId: z.string().optional().default('BIO-MAIN-GATE'),
  rawPayload: z.record(z.string(), z.any()).optional(),
});
export type RecordPunchDto = z.input<typeof RecordPunchDtoSchema>;

export const SyncBiometricDtoSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  punches: z.array(
    z.object({
      employeeCode: z.string().min(1),
      timestamp: z.string(),
      punchType: z.string().optional(),
    })
  ).min(1, 'At least 1 punch required'),
});
export type SyncBiometricDto = z.input<typeof SyncBiometricDtoSchema>;

export const AdjustAttendanceDtoSchema = z.object({
  attendanceDate: z.string().min(1, 'Date is required'),
  firstPunchIn: z.string().optional(),
  lastPunchOut: z.string().optional(),
  status: AttendanceStatusEnum,
  workHours: z.number().min(0).optional(),
  overtimeHours: z.number().min(0).optional().default(0),
  reason: z.string().min(3, 'Adjustment reason is required'),
});
export type AdjustAttendanceDto = z.input<typeof AdjustAttendanceDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 4: Shift Roster & Line Staffing
// ----------------------------------------------------------------------------
export const AssignShiftDtoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  shiftId: z.string().min(1, 'Shift ID is required'),
  assignmentDate: z.string().default(new Date().toISOString().split('T')[0]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  workCenterId: z.string().optional(),
  lineId: z.string().optional(),
  isOverride: z.boolean().optional().default(false),
  overrideReason: z.string().optional(),
});
export type AssignShiftDto = z.input<typeof AssignShiftDtoSchema>;

export const SwapShiftDtoSchema = z.object({
  requesterAssignmentId: z.string().min(1, 'Requester assignment ID is required'),
  targetAssignmentId: z.string().min(1, 'Target assignment ID is required'),
  reason: z.string().min(3, 'Swap reason is required'),
});
export type SwapShiftDto = z.input<typeof SwapShiftDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 5: Leave & Overtime Approvals
// ----------------------------------------------------------------------------
export const LeaveTypeEnum = z.enum([
  'CASUAL_LEAVE',
  'SICK_LEAVE',
  'EARNED_LEAVE',
  'MATERNITY_LEAVE',
  'PATERNITY_LEAVE',
  'COMPENSATORY_OFF',
  'UNPAID_LEAVE',
  'PUBLIC_HOLIDAY',
  'WEEKLY_OFF',
  'OTHER',
]);

export const CreateLeaveDtoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  leaveType: LeaveTypeEnum,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalDays: z.number().positive('Total days must be positive'),
  isHalfDay: z.boolean().optional().default(false),
  halfDaySession: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().min(3, 'Leave reason is required'),
});
export type CreateLeaveDto = z.input<typeof CreateLeaveDtoSchema>;

export const CreateOvertimeDtoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  otDate: z.string().default(new Date().toISOString().split('T')[0]),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  totalHours: z.number().positive('OT hours must be positive'),
  otType: z.enum(['WEEKDAY', 'WEEKEND', 'HOLIDAY']).default('WEEKDAY'),
  reason: z.string().min(3, 'OT reason is required'),
});
export type CreateOvertimeDto = z.input<typeof CreateOvertimeDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 6: Skill Matrix & Competency (IATF 16949)
// ----------------------------------------------------------------------------
export const SkillLevelEnum = z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']);

export const CreateSkillDtoSchema = z.object({
  skillCode: z.string().min(1, 'Skill code is required'),
  skillName: z.string().min(1, 'Skill name is required'),
  skillCategory: z.enum(['TECHNICAL', 'SOFT', 'SAFETY', 'QUALITY']).default('TECHNICAL'),
  skillLevel: SkillLevelEnum.default('BASIC'),
  isIatfRequired: z.boolean().optional().default(false),
  description: z.string().optional(),
});
export type CreateSkillDto = z.input<typeof CreateSkillDtoSchema>;

export const AddSkillDtoSchema = z.object({
  skillId: z.string().min(1, 'Skill ID is required'),
  proficiencyLevel: SkillLevelEnum,
  yearsOfExperience: z.number().int().min(0).default(0),
  certified: z.boolean().optional().default(false),
  certificationDate: z.string().optional(),
  certificationExpiry: z.string().optional(),
});
export type AddSkillDto = z.input<typeof AddSkillDtoSchema>;

export const CreateTrainingDtoSchema = z.object({
  trainingCode: z.string().optional(),
  trainingName: z.string().min(1, 'Training name is required'),
  trainingType: z.enum(['INTERNAL', 'EXTERNAL', 'ONLINE', 'ON_THE_JOB', 'WORKSHOP', 'SEMINAR']).default('INTERNAL'),
  category: z.enum(['TECHNICAL', 'SAFETY', 'QUALITY', 'SOFT_SKILLS']).default('TECHNICAL'),
  description: z.string().optional(),
  durationHours: z.number().positive('Duration must be positive'),
  maxParticipants: z.number().int().positive().default(20),
  scheduledStart: z.string().min(1, 'Scheduled start is required'),
  scheduledEnd: z.string().min(1, 'Scheduled end is required'),
  location: z.string().optional(),
  trainer: z.string().optional(),
  cost: z.number().min(0).optional().default(0),
});
export type CreateTrainingDto = z.input<typeof CreateTrainingDtoSchema>;

export const EnrollDtoSchema = z.object({
  employeeIds: z.array(z.string()).min(1, 'At least 1 employee required'),
});
export type EnrollDto = z.input<typeof EnrollDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 7: Safety (EHS) & Zero-Harm Incidents
// ----------------------------------------------------------------------------
export const IncidentTypeEnum = z.enum([
  'NEAR_MISS',
  'INJURY',
  'FATALITY',
  'PROPERTY_DAMAGE',
  'ENVIRONMENTAL',
  'FIRE',
  'CHEMICAL_SPILL',
  'OTHER',
]);

export const IncidentSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'FATAL']);

export const ReportIncidentDtoSchema = z.object({
  incidentNumber: z.string().optional(),
  incidentType: IncidentTypeEnum,
  severity: IncidentSeverityEnum.default('LOW'),
  incidentDate: z.string().default(new Date().toISOString().split('T')[0]),
  incidentTime: z.string().default('10:00'),
  location: z.string().min(1, 'Location is required'),
  department: z.string().optional(),
  plantId: z.string().optional(),
  description: z.string().min(5, 'Description is required'),
  injuredPersonId: z.string().optional(),
  injuryType: z.string().optional(),
  bodyPartAffected: z.string().optional(),
  daysLost: z.number().int().min(0).optional().default(0),
  medicalTreatmentRequired: z.boolean().optional().default(false),
  propertyDamageCost: z.number().min(0).optional().default(0),
  witnessIds: z.array(z.string()).optional().default([]),
});
export type ReportIncidentDto = z.input<typeof ReportIncidentDtoSchema>;

export const UpdateIncidentDtoSchema = ReportIncidentDtoSchema.partial();
export type UpdateIncidentDto = z.input<typeof UpdateIncidentDtoSchema>;

export const InvestigateDtoSchema = z.object({
  rootCause: z.string().min(5, 'Root cause analysis required'),
  correctiveAction: z.string().min(5, 'Corrective action required'),
  preventiveAction: z.string().min(5, 'Preventive action required'),
  investigationReport: z.string().optional(),
});
export type InvestigateDto = z.input<typeof InvestigateDtoSchema>;

export const IssuePpeDtoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  ppeType: z.enum(['HELMET', 'GLOVES', 'SAFETY_SHOES', 'GOGGLES', 'MASK', 'EAR_PLUGS', 'APRON']).default('SAFETY_SHOES'),
  ppeItem: z.string().min(1, 'PPE item name is required'),
  quantity: z.number().int().positive().default(1),
  issueDate: z.string().default(new Date().toISOString().split('T')[0]),
  expectedExpiryDate: z.string().optional(),
});
export type IssuePpeDto = z.input<typeof IssuePpeDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 8: Payroll & Statutory Slips
// ----------------------------------------------------------------------------
export const RunPayrollDtoSchema = z.object({
  period: z.string().min(1, 'Period is required (e.g. 2026-09)'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  month: z.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  year: z.number().int().default(new Date().getFullYear()),
  department: z.string().optional(),
});
export type RunPayrollDto = z.input<typeof RunPayrollDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 9: Labor Law & CLRA Compliance
// ----------------------------------------------------------------------------
export const AddContractorDtoSchema = z.object({
  contractorName: z.string().min(1, 'Contractor name is required'),
  contractorLicense: z.string().optional(),
  contractorPan: z.string().optional(),
  contractorGstin: z.string().optional(),
  contractStart: z.string().min(1, 'Start date is required'),
  contractEnd: z.string().min(1, 'End date is required'),
  totalWorkers: z.number().int().min(0).default(0),
  monthlyBilling: z.number().min(0).default(0),
});
export type AddContractorDto = z.input<typeof AddContractorDtoSchema>;

export const FileStatutoryDtoSchema = z.object({
  complianceType: z.enum(['PF', 'ESI', 'PT', 'LWF', 'BONUS', 'GRATUITY', 'TDS', 'FORM_16', 'FORM_24Q']),
  period: z.string().min(1, 'Period is required (e.g. 2026-09)'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  amount: z.number().min(0).default(0),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});
export type FileStatutoryDto = z.input<typeof FileStatutoryDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 10: HR Analytics & Headcount
// ----------------------------------------------------------------------------
export const GenerateReportDtoSchema = z.object({
  reportType: z.enum(['HEADCOUNT', 'ATTRITION', 'ABSENTEEISM', 'OVERTIME', 'PAYROLL_SUMMARY', 'SAFETY_SUMMARY']),
  period: z.string().min(1, 'Period is required'),
  department: z.string().optional(),
  format: z.enum(['JSON', 'CSV', 'PDF']).default('JSON'),
});
export type GenerateReportDto = z.input<typeof GenerateReportDtoSchema>;
