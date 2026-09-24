import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Module-7: People (HR) (All 10 Screens)
// ============================================================================

// Screen 2: Employee Master
export interface Employee {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  maritalStatus?: string;
  nationality: string;
  photoUrl?: string;
  designation: string;
  department: string;
  plantId?: string;
  workCenterId?: string;
  employmentType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'INTERN' | 'APPRENTICE' | 'CONSULTANT';
  employmentStatus: 'ACTIVE' | 'ON_PROBATION' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RESIGNED' | 'RETIRED';
  dateOfJoining: string;
  dateOfConfirmation?: string;
  dateOfExit?: string;
  exitReason?: string;
  noticePeriodDays: number;
  probationPeriodDays: number;
  ctc: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  pan?: string;
  aadhar?: string;
  uan?: string;
  esi?: string;
  reportingToId?: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPincode?: string;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentPincode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 3: Attendance & Punches
export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  attendanceDate: string;
  firstPunchIn?: string;
  lastPunchOut?: string;
  totalPunches: number;
  workHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'EARLY_LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY' | 'ON_LEAVE' | 'PENDING';
  isHalfDay: boolean;
  isWeeklyOff: boolean;
  isHoliday: boolean;
  biometricDeviceId?: string;
  isManualEntry: boolean;
  manualAdjustmentReason?: string;
  adjustedById?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 4: Shift Roster
export interface ShiftAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  shiftId: string;
  assignmentDate: string;
  startTime?: string;
  endTime?: string;
  workCenterId?: string;
  lineId?: string;
  isOverride: boolean;
  overrideReason?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'SWAPPED';
  version: string;
  createdAt?: string;
}

// Screen 5: Leaves & Overtime
export interface LeaveRequest {
  id: string;
  tenantId: string;
  leaveNumber: string;
  employeeId: string;
  leaveType: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE' | 'COMPENSATORY_OFF' | 'UNPAID_LEAVE' | 'PUBLIC_HOLIDAY' | 'WEEKLY_OFF' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDaySession?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt?: string;
}

export interface LeaveBalance {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveType: string;
  year: number;
  openingBalance: number;
  allocated: number;
  availed: number;
  closingBalance: number;
  carryForward: number;
}

export interface OvertimeRequest {
  id: string;
  tenantId: string;
  otNumber: string;
  employeeId: string;
  otDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  otType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  otRate: number;
  otAmount: number;
  approvedById?: string;
  approvedAt?: string;
  createdAt?: string;
}

// Screen 6: Skill Matrix & Training
export interface Skill {
  id: string;
  tenantId: string;
  skillCode: string;
  skillName: string;
  skillCategory: 'TECHNICAL' | 'SOFT' | 'SAFETY' | 'QUALITY';
  skillLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'MASTER';
  isIatfRequired: boolean;
  description?: string;
  isActive: boolean;
}

export interface EmployeeSkill {
  id: string;
  tenantId: string;
  employeeId: string;
  skillId: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  certified: boolean;
  certificationDate?: string;
  certificationExpiry?: string;
}

export interface Training {
  id: string;
  tenantId: string;
  trainingCode: string;
  trainingName: string;
  trainingType: string;
  category: string;
  description?: string;
  durationHours: number;
  maxParticipants: number;
  scheduledStart: string;
  scheduledEnd: string;
  location?: string;
  trainer?: string;
  cost: number;
  status: 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
}

// Screen 7: Safety & PPE
export interface SafetyIncident {
  id: string;
  tenantId: string;
  incidentNumber: string;
  incidentType: 'NEAR_MISS' | 'INJURY' | 'FATALITY' | 'PROPERTY_DAMAGE' | 'ENVIRONMENTAL' | 'FIRE' | 'CHEMICAL_SPILL' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'FATAL';
  incidentDate: string;
  incidentTime: string;
  location: string;
  department?: string;
  plantId?: string;
  description: string;
  injuredPersonId?: string;
  injuryType?: string;
  bodyPartAffected?: string;
  daysLost: number;
  medicalTreatmentRequired: boolean;
  propertyDamageCost?: number;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  status: 'REPORTED' | 'UNDER_INVESTIGATION' | 'INVESTIGATION_COMPLETE' | 'CORRECTIVE_ACTION_PLANNED' | 'CORRECTIVE_ACTION_IMPLEMENTED' | 'CLOSED' | 'REOPENED';
  reportedById: string;
  investigatedById?: string;
  investigationDate?: string;
  createdAt?: string;
}

export interface PpeIssuance {
  id: string;
  tenantId: string;
  employeeId: string;
  ppeType: string;
  ppeItem: string;
  quantity: number;
  issueDate: string;
  expectedExpiryDate?: string;
  actualExpiryDate?: string;
  condition: string;
  replaced: boolean;
  replacedDate?: string;
}

// Screen 8: Payroll
export interface PayrollRecord {
  id: string;
  tenantId: string;
  payrollNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  period: string;
  fiscalYear: number;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossEarnings: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  incomeTax: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'PENDING' | 'PROCESSED' | 'PAID' | 'FAILED' | 'CANCELLED';
  slipGenerated: boolean;
  createdAt?: string;
}

// Screen 9: Labor Law & CLRA Compliance
export interface ContractLabor {
  id: string;
  tenantId: string;
  contractorId: string;
  contractorName: string;
  contractorLicense?: string;
  contractorPan?: string;
  contractorGstin?: string;
  contractStart: string;
  contractEnd: string;
  totalWorkers: number;
  monthlyBilling: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  complianceStatus: string;
  lastAuditDate?: string;
}

export interface StatutoryCompliance {
  id: string;
  tenantId: string;
  complianceType: string;
  period: string;
  fiscalYear: number;
  month?: number;
  quarter?: number;
  dueDate?: string;
  filingDate?: string;
  status: string;
  amount: number;
  referenceNumber?: string;
  remarks?: string;
}

// ============================================================================
// Frontend HR API Client Class
// ============================================================================

class HrApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE}/hr`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auto-inject CSRF and Tenant headers
    this.client.interceptors.request.use((config) => {
      const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
      if (match) {
        config.headers['x-csrf-token'] = decodeURIComponent(match[2]);
      }
      const tenantId = localStorage.getItem('tenant_id') || 'TENANT-ALPHA-IND';
      config.headers['x-tenant-id'] = tenantId;
      return config;
    });
  }

  // --------------------------------------------------------------------------
  // Screen 1: HR Command Center
  // --------------------------------------------------------------------------
  public async getHrDashboard() {
    const res = await this.client.get('/dashboard');
    return res.data;
  }

  public async getHrKpis(filters: any = {}) {
    const res = await this.client.get('/dashboard/kpis', { params: filters });
    return res.data;
  }

  public async getHeadcount(filters: any = {}) {
    const res = await this.client.get('/dashboard/headcount', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 2: Employee Master (360°)
  // --------------------------------------------------------------------------
  public async getEmployees(filters: any = {}) {
    const res = await this.client.get('/employees', { params: filters });
    return res.data;
  }

  public async createEmployee(employeeData: Partial<Employee>) {
    const res = await this.client.post('/employees', employeeData);
    return res.data;
  }

  public async updateEmployee(id: string, employeeData: Partial<Employee>) {
    const res = await this.client.put(`/employees/${id}`, employeeData);
    return res.data;
  }

  public async getEmployee360(id: string) {
    const res = await this.client.get(`/employees/${id}/360`);
    return res.data;
  }

  public async onboardEmployee(id: string) {
    const res = await this.client.post(`/employees/${id}/onboard`);
    return res.data;
  }

  public async exitEmployee(id: string, exitData: { dateOfExit: string; exitReason: string; employmentStatus?: string }) {
    const res = await this.client.post(`/employees/${id}/exit`, exitData);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 3: Attendance & Punches
  // --------------------------------------------------------------------------
  public async getAttendance(filters: any = {}) {
    const res = await this.client.get('/attendance', { params: filters });
    return res.data;
  }

  public async recordPunch(punchData: { employeeId: string; punchTime?: string; punchType?: string }) {
    const res = await this.client.post('/attendance/punch', punchData);
    return res.data;
  }

  public async syncBiometricData(syncData: { deviceId: string; punches: any[] }) {
    const res = await this.client.post('/attendance/sync-biometric', syncData);
    return res.data;
  }

  public async adjustAttendance(id: string, adjustmentData: any) {
    const res = await this.client.post(`/attendance/${id}/adjust`, adjustmentData);
    return res.data;
  }

  public async getAttendanceSummary(filters: any = {}) {
    const res = await this.client.get('/attendance/summary', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 4: Shift Roster & Line Staffing
  // --------------------------------------------------------------------------
  public async getShiftRoster(filters: any = {}) {
    const res = await this.client.get('/shifts/roster', { params: filters });
    return res.data;
  }

  public async assignShift(assignmentData: Partial<ShiftAssignment>) {
    const res = await this.client.post('/shifts/assign', assignmentData);
    return res.data;
  }

  public async swapShift(swapData: { requesterAssignmentId: string; targetAssignmentId: string; reason: string }) {
    const res = await this.client.post('/shifts/swap', swapData);
    return res.data;
  }

  public async getLineStaffing(filters: any = {}) {
    const res = await this.client.get('/shifts/line-staffing', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 5: Leave & Overtime
  // --------------------------------------------------------------------------
  public async getLeaves(filters: any = {}) {
    const res = await this.client.get('/leaves', { params: filters });
    return res.data;
  }

  public async createLeaveRequest(leaveData: Partial<LeaveRequest>) {
    const res = await this.client.post('/leaves', leaveData);
    return res.data;
  }

  public async approveLeave(id: string) {
    const res = await this.client.post(`/leaves/${id}/approve`);
    return res.data;
  }

  public async rejectLeave(id: string, reason: string) {
    const res = await this.client.post(`/leaves/${id}/reject`, { reason });
    return res.data;
  }

  public async getLeaveBalance(filters: any = {}) {
    const res = await this.client.get('/leaves/balance', { params: filters });
    return res.data;
  }

  public async getPendingLeaveApprovals() {
    const res = await this.client.get('/leaves/pending-approvals');
    return res.data;
  }

  public async getOvertimeRequests(filters: any = {}) {
    const res = await this.client.get('/overtime', { params: filters });
    return res.data;
  }

  public async createOvertimeRequest(otData: Partial<OvertimeRequest>) {
    const res = await this.client.post('/overtime', otData);
    return res.data;
  }

  public async approveOvertime(id: string) {
    const res = await this.client.post(`/overtime/${id}/approve`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 6: Skill Matrix & Competency
  // --------------------------------------------------------------------------
  public async getSkills(filters: any = {}) {
    const res = await this.client.get('/skills', { params: filters });
    return res.data;
  }

  public async createSkill(skillData: Partial<Skill>) {
    const res = await this.client.post('/skills', skillData);
    return res.data;
  }

  public async getEmployeeSkills(employeeId: string) {
    const res = await this.client.get(`/employees/${employeeId}/skills`);
    return res.data;
  }

  public async addEmployeeSkill(employeeId: string, skillData: any) {
    const res = await this.client.post(`/employees/${employeeId}/skills`, skillData);
    return res.data;
  }

  public async getTrainings(filters: any = {}) {
    const res = await this.client.get('/trainings', { params: filters });
    return res.data;
  }

  public async createTraining(trainingData: Partial<Training>) {
    const res = await this.client.post('/trainings', trainingData);
    return res.data;
  }

  public async enrollInTraining(trainingId: string, employeeIds: string[]) {
    const res = await this.client.post(`/trainings/${trainingId}/enroll`, { employeeIds });
    return res.data;
  }

  public async getSkillMatrix(filters: any = {}) {
    const res = await this.client.get('/skill-matrix', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 7: Safety & PPE
  // --------------------------------------------------------------------------
  public async getIncidents(filters: any = {}) {
    const res = await this.client.get('/safety/incidents', { params: filters });
    return res.data;
  }

  public async reportIncident(incidentData: Partial<SafetyIncident>) {
    const res = await this.client.post('/safety/incidents', incidentData);
    return res.data;
  }

  public async updateIncident(id: string, incidentData: Partial<SafetyIncident>) {
    const res = await this.client.put(`/safety/incidents/${id}`, incidentData);
    return res.data;
  }

  public async investigateIncident(id: string, investigationData: { rootCause: string; correctiveAction: string; preventiveAction: string; investigationReport?: string }) {
    const res = await this.client.post(`/safety/incidents/${id}/investigate`, investigationData);
    return res.data;
  }

  public async getPpeIssuance(filters: any = {}) {
    const res = await this.client.get('/safety/ppe', { params: filters });
    return res.data;
  }

  public async issuePpe(ppeData: { employeeId: string; ppeType: string; ppeItem: string; quantity?: number }) {
    const res = await this.client.post('/safety/ppe/issue', ppeData);
    return res.data;
  }

  public async getSafetyMetrics(filters: any = {}) {
    const res = await this.client.get('/safety/metrics', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 8: Payroll & Statutory Slips
  // --------------------------------------------------------------------------
  public async getPayrollRecords(filters: any = {}) {
    const res = await this.client.get('/payroll', { params: filters });
    return res.data;
  }

  public async runPayroll(payrollData: { period: string; fiscalYear?: number; month?: number; year?: number; department?: string }) {
    const res = await this.client.post('/payroll/run', payrollData);
    return res.data;
  }

  public async approvePayroll(id: string) {
    const res = await this.client.post(`/payroll/${id}/approve`);
    return res.data;
  }

  public async generatePaySlip(id: string) {
    const res = await this.client.post(`/payroll/${id}/generate-slip`);
    return res.data;
  }

  public async getPaySlip(id: string) {
    const res = await this.client.get(`/payroll/${id}/slip`);
    return res.data;
  }

  public async getStatutoryDeductions(filters: any = {}) {
    const res = await this.client.get('/payroll/statutory', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 9: Labor Law & CLRA Compliance
  // --------------------------------------------------------------------------
  public async getContractors(filters: any = {}) {
    const res = await this.client.get('/compliance/contractors', { params: filters });
    return res.data;
  }

  public async addContractor(contractorData: Partial<ContractLabor>) {
    const res = await this.client.post('/compliance/contractors', contractorData);
    return res.data;
  }

  public async getStatutoryCompliance(filters: any = {}) {
    const res = await this.client.get('/compliance/statutory', { params: filters });
    return res.data;
  }

  public async fileStatutoryReturn(filingData: { complianceType: string; period: string; fiscalYear?: number; amount?: number; referenceNumber?: string }) {
    const res = await this.client.post('/compliance/statutory/file', filingData);
    return res.data;
  }

  public async getComplianceAudit(filters: any = {}) {
    const res = await this.client.get('/compliance/audit', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 10: HR Analytics & Reports
  // --------------------------------------------------------------------------
  public async getHeadcountAnalytics(filters: any = {}) {
    const res = await this.client.get('/analytics/headcount', { params: filters });
    return res.data;
  }

  public async getAttritionAnalytics(filters: any = {}) {
    const res = await this.client.get('/analytics/attrition', { params: filters });
    return res.data;
  }

  public async getAttendanceAnalytics(filters: any = {}) {
    const res = await this.client.get('/analytics/attendance', { params: filters });
    return res.data;
  }

  public async getPayrollAnalytics(filters: any = {}) {
    const res = await this.client.get('/analytics/payroll', { params: filters });
    return res.data;
  }

  public async getSafetyAnalytics(filters: any = {}) {
    const res = await this.client.get('/analytics/safety', { params: filters });
    return res.data;
  }

  public async generateHrReport(reportData: { reportType: string; period: string; department?: string; format?: string }) {
    const res = await this.client.post('/analytics/reports/generate', reportData);
    return res.data;
  }
}

export const hrApi = new HrApiClient();
