import React, { useState } from 'react';
import {
  INITIAL_HR_DEPARTMENTS,
  INITIAL_HR_DESIGNATIONS,
  INITIAL_HR_EMPLOYEES,
  INITIAL_HR_SHIFTS,
  INITIAL_HR_ATTENDANCE,
  INITIAL_HR_LEAVES,
  INITIAL_HR_OVERTIME,
  INITIAL_HR_SKILLS_MATRIX,
  INITIAL_HR_TRAININGS,
  INITIAL_HR_SAFETY_INCIDENTS,
  INITIAL_HR_PPE_ISSUES,
  INITIAL_HR_PPE_INVENTORY,
  INITIAL_HR_PAYROLL_INPUTS,
  INITIAL_HR_COMPLIANCE_DOCS,
  INITIAL_HR_CONTRACT_AGENCIES,
  INITIAL_HR_SHIFT_ROSTER,
} from '../data/hrData';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrLeaveRequest,
  HrOvertimeRequest,
  HrSafetyIncident,
  HrPpeIssueRecord,
  HrPpeInventoryItem,
  HrPayrollInputRow,
  HrShiftRosterCell,
  HrTrainingProgram,
  HrDepartment,
} from '../types';
import { HrCommandCenter } from './hr/HrCommandCenter';
import { HrOrgStructureView } from './hr/HrOrgStructureView';
import { HrEmployeeListView } from './hr/HrEmployeeListView';
import { HrEmployeeDetailView } from './hr/HrEmployeeDetailView';
import { HrOnboardingOffboardingView } from './hr/HrOnboardingOffboardingView';
import { HrAttendanceView } from './hr/HrAttendanceView';
import { HrShiftRosterView } from './hr/HrShiftRosterView';
import { HrLeaveOvertimeView } from './hr/HrLeaveOvertimeView';
import { HrSkillsTrainingView } from './hr/HrSkillsTrainingView';
import { HrSafetyPpeView } from './hr/HrSafetyPpeView';
import { HrPayrollView } from './hr/HrPayrollView';
import { HrComplianceContractView } from './hr/HrComplianceContractView';
import { HrReportsAnalyticsView } from './hr/HrReportsAnalyticsView';

interface HrViewsProps {
  currentView: string;
  viewParams?: any;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const HrViews: React.FC<HrViewsProps> = ({
  currentView,
  viewParams,
  onNavigate,
  showToast,
}) => {
  // Master State for HR entities
  const [departments, setDepartments] = useState<HrDepartment[]>(INITIAL_HR_DEPARTMENTS);
  const [designations] = useState(INITIAL_HR_DESIGNATIONS);
  const [employees, setEmployees] = useState<HrEmployee[]>(INITIAL_HR_EMPLOYEES);
  const [shifts] = useState(INITIAL_HR_SHIFTS);
  const [attendance, setAttendance] = useState<HrAttendanceRecord[]>(INITIAL_HR_ATTENDANCE);
  const [leaves, setLeaves] = useState<HrLeaveRequest[]>(INITIAL_HR_LEAVES);
  const [overtime, setOvertime] = useState<HrOvertimeRequest[]>(INITIAL_HR_OVERTIME);
  const [skills, setSkills] = useState(INITIAL_HR_SKILLS_MATRIX);
  const [trainings, setTrainings] = useState<HrTrainingProgram[]>(INITIAL_HR_TRAININGS);
  const [incidents, setIncidents] = useState<HrSafetyIncident[]>(INITIAL_HR_SAFETY_INCIDENTS);
  const [ppeIssues, setPpeIssues] = useState<HrPpeIssueRecord[]>(INITIAL_HR_PPE_ISSUES);
  const [ppeInventory] = useState<HrPpeInventoryItem[]>(INITIAL_HR_PPE_INVENTORY);
  const [payrollRows, setPayrollRows] = useState<HrPayrollInputRow[]>(INITIAL_HR_PAYROLL_INPUTS);
  const [complianceDocs] = useState(INITIAL_HR_COMPLIANCE_DOCS);
  const [agencies] = useState(INITIAL_HR_CONTRACT_AGENCIES);
  const [roster, setRoster] = useState<HrShiftRosterCell[]>(INITIAL_HR_SHIFT_ROSTER);

  // Selected Employee for 360 Detail View
  const selectedEmployeeId = viewParams?.employeeId || 'EMP-1001';
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Actions
  const handleAddNewEmployee = (newEmp: Partial<HrEmployee>) => {
    setEmployees((prev) => [newEmp as HrEmployee, ...prev]);
  };

  const handleUpdateAttendance = (record: HrAttendanceRecord) => {
    setAttendance((prev) => prev.map((a) => (a.id === record.id ? record : a)));
  };

  const handleApproveLeave = (leaveId: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'Approved' } : l))
    );
    showToast('Leave request approved and synchronized with shift roster.');
  };

  const handleRejectLeave = (leaveId: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'Rejected' } : l))
    );
    showToast('Leave request rejected.');
  };

  const handleApproveOvertime = (otId: string) => {
    setOvertime((prev) =>
      prev.map((o) => (o.id === otId ? { ...o, status: 'Approved' } : o))
    );
    showToast('Production Overtime approved and authorized for payroll computation.');
  };

  const handleRejectOvertime = (otId: string) => {
    setOvertime((prev) =>
      prev.map((o) => (o.id === otId ? { ...o, status: 'Rejected' } : o))
    );
    showToast('Production Overtime rejected.');
  };

  const handleAddIncident = (incident: HrSafetyIncident) => {
    setIncidents((prev) => [incident, ...prev]);
  };

  const handleAddTraining = (training: HrTrainingProgram) => {
    setTrainings((prev) => [training, ...prev]);
  };

  const handleLockPayroll = (month: string) => {
    showToast(`Payroll month ${month} locked. Payslips finalized.`);
  };

  switch (currentView) {
    case 'hrCommandCenter':
      return (
        <HrCommandCenter
          employees={employees}
          attendance={attendance}
          shifts={shifts}
          leaves={leaves}
          incidents={incidents}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );

    case 'hrOrgStructure':
      return (
        <HrOrgStructureView
          departments={departments}
          designations={designations}
          showToast={showToast}
        />
      );

    case 'hrEmployeeList':
      return (
        <HrEmployeeListView
          employees={employees}
          onSelectEmployee={(empId) => onNavigate('hrEmployeeDetail', { employeeId: empId })}
          onAddEmployeeModal={() => onNavigate('hrOnboarding')}
          showToast={showToast}
        />
      );

    case 'hrEmployeeDetail':
      return (
        <HrEmployeeDetailView
          employee={selectedEmployee}
          attendanceHistory={attendance}
          leaves={leaves}
          overtime={overtime}
          incidents={incidents}
          ppeIssues={ppeIssues}
          onBack={() => onNavigate('hrEmployeeList')}
          showToast={showToast}
        />
      );

    case 'hrOnboarding':
      return (
        <HrOnboardingOffboardingView
          departments={departments}
          onAddNewEmployee={handleAddNewEmployee}
          showToast={showToast}
        />
      );

    case 'hrAttendance':
      return (
        <HrAttendanceView
          attendance={attendance}
          onUpdateAttendance={handleUpdateAttendance}
          showToast={showToast}
        />
      );

    case 'hrShiftRoster':
      return (
        <HrShiftRosterView
          shifts={shifts}
          roster={roster}
          employees={employees}
          onUpdateRoster={setRoster}
          showToast={showToast}
        />
      );

    case 'hrLeaveOvertime':
      return (
        <HrLeaveOvertimeView
          leaves={leaves}
          overtime={overtime}
          onApproveLeave={handleApproveLeave}
          onRejectLeave={handleRejectLeave}
          onApproveOvertime={handleApproveOvertime}
          onRejectOvertime={handleRejectOvertime}
          showToast={showToast}
        />
      );

    case 'hrSkillsTraining':
      return (
        <HrSkillsTrainingView
          skills={skills}
          trainings={trainings}
          onAddTraining={handleAddTraining}
          showToast={showToast}
        />
      );

    case 'hrSafetyPpe':
      return (
        <HrSafetyPpeView
          incidents={incidents}
          ppeIssues={ppeIssues}
          ppeInventory={ppeInventory}
          onAddIncident={handleAddIncident}
          showToast={showToast}
        />
      );

    case 'hrPayroll':
      return (
        <HrPayrollView
          payrollRows={payrollRows}
          onLockPayroll={handleLockPayroll}
          showToast={showToast}
        />
      );

    case 'hrCompliance':
      return (
        <HrComplianceContractView
          complianceDocs={complianceDocs}
          agencies={agencies}
          showToast={showToast}
        />
      );

    case 'hrReports':
      return (
        <HrReportsAnalyticsView
          employees={employees}
          attendance={attendance}
          departments={departments}
          showToast={showToast}
        />
      );

    default:
      return (
        <HrCommandCenter
          employees={employees}
          attendance={attendance}
          shifts={shifts}
          leaves={leaves}
          incidents={incidents}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );
  }
};
