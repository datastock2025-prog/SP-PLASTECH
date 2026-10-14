# Module: HR (Web)

## Metadata
- **Owner**: hr-team
- **Scope**: Employee directory, shift rosters, skill matrices, attendance, and payroll slips
- **Database Schema Prefix**: `hrm_`
- **Tables**: `employees`, `shift_rosters`, `skill_certifications`, `payroll_runs`, `attendance_records`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: `OperatorShiftAssigned`, `PayrollProcessed`
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
