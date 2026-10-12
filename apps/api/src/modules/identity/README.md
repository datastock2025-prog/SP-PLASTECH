# Module: IDENTITY (API)

## Metadata
- **Owner**: security-team
- **Scope**: User authentication, profile management, RBAC authorization, and tenant isolation
- **Database Schema Prefix**: `idn_`
- **Tables**: `user`, `session`, `account`, `verification`, `tenants`, `plants`, `roles`, `user_profiles`, `plant_user`, `user_preferences`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `UserCreated`, `UserRoleChanged`, `SessionTerminated`
- **Consumes**: None
