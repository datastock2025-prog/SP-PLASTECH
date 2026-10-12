# Module: HR (API)

## Metadata
- **Owner**: hr-team
- **Scope**: Employee directory, shift rosters, skill matrices, attendance, and payroll slips
- **Database Schema Prefix**: `hrm_`
- **Tables**: `employees`, `shift_rosters`, `skill_certifications`, `payroll_runs`, `attendance_records`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `OperatorShiftAssigned`, `PayrollProcessed`
- **Consumes**: None
