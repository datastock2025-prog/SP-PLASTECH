# Module: IDENTITY (Web)

## Metadata
- **Owner**: security-team
- **Scope**: User authentication, profile management, RBAC authorization, and tenant isolation
- **Database Schema Prefix**: `idn_`
- **Tables**: `user`, `session`, `account`, `verification`, `tenants`, `plants`, `roles`, `user_profiles`, `plant_user`, `user_preferences`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: `UserCreated`, `UserRoleChanged`, `SessionTerminated`
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
