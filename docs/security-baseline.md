# SP-PLASTECH ERP — Security Baseline & Audit Report

**Date**: 2026-10-14  
**Author**: Antigravity (Ponytail Mode)  
**Scope**: Read-only platform security audit prior to local runtime hardening.

---

## 1. Secrets & Credentials Inventory

The following files were identified containing hardcoded credentials or fallback literals:

1. **Supabase Cloud URL (`https://gqrelwvmeoqvfnanoutz.supabase.co`)**:
   - `frontend/src/shared/db/index.ts` (line 22)
   - `frontend/src/shared/supabaseClient.ts` (line 7)
   - `frontend/src/lib/api-client.ts` (line 12)
   - `functions/rest/[[path]].ts` (line 19)
   - `frontend/index.html` (lines 12-13: `<link rel="preconnect">` and `<link rel="dns-prefetch">`)
   - `.github/workflows/ci-cd.yml` (line 159, 208)
   - `scripts/seedPriceListsSupabase.ts`, `scripts/seedLiveTs.ts`, `scripts/migrateSupabaseCloudSchema.cjs`, `scripts/auditAll29Endpoints.cjs`

2. **Supabase Anon / Publishable Key (`sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R`)**:
   - `frontend/src/shared/db/index.ts` (line 25)
   - `frontend/src/shared/supabaseClient.ts` (line 9)
   - `functions/rest/[[path]].ts` (line 21)
   - `.github/workflows/ci-cd.yml` (line 160, 209)
   - `scripts/seedPriceListsSupabase.ts`, `scripts/seedLiveTs.ts`

3. **Password Literals & Default Secrets**:
   - `playwright.config.ts` (line 45: `BOOTSTRAP_ADMIN_PASSWORD: 'Plas!Tech#Boot91'`)
   - `e2e/global-setup.ts` (line 4: `'E2e#Secure2026pw'`, line 5: `'Plas!Tech#Boot91'`)
   - `compose.yaml` (line 14: `${DEV_DB_PASSWORD:-erp_local_only}`, line 35: `${BETTER_AUTH_SECRET:-sp_plastech_dev_auth_secret_local_only_2026}`)

### Rotation Advisory
The Supabase publishable key and bootstrap passwords committed to git history must be rotated before production deployment. For local development, all credentials are read from `.env` or system environment variables.

---

## 2. Error-Swallowing Catch Blocks Inventory

The following catch blocks were detected violating enterprise integrity rules by swallowing errors or returning fake success:

1. **`frontend/src/services/api.ts`**:
   - Lines 20-26: `catch { return { data: [], success: false ... } }`
   - Lines 38-44: `catch { return { data: data, success: true ... } }` (Returns `success: true` on POST failure!)
   - Lines 59-65: `catch { return { data: data, success: true ... } }` (Returns `success: true` on PUT failure!)
   - Lines 84-90: `catch { return { data: null, success: true ... } }` (Returns `success: true` on DELETE failure!)

2. **`frontend/src/shared/db/adapters/RestApiAdapter.ts`**:
   - Lines 39-42: `catch (error) { return []; }` (Swallows list fetch errors)
   - Lines 49-51: `catch { return null; }`
   - Lines 58-60: `catch { return 0; }`
   - Lines 67-75: `catch { return Array.isArray(record) ? record[0] : record; }` (Returns unpersisted payload as fake success)
   - Lines 82-84: `catch { return record; }`
   - Lines 91-93: `catch { return patch as T; }`
   - Lines 99-101: `catch { return false; }`

3. **`frontend/src/shared/db/adapters/SupabaseAdapter.ts`**:
   - Line 145: `return []` on database error instead of throwing a typed exception.
   - Line 168: `return null` on single item fetch error.

---

## 3. Future Supabase Verification Queries (Run in Supabase SQL Editor When Cloud Sync Needed)

```sql
-- Query 1: Active RLS Policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
  FROM pg_policies 
 WHERE schemaname = 'public' 
 ORDER BY tablename;

-- Query 2: Direct Table Grants for 'anon' and 'authenticated'
SELECT grantee, table_name, privilege_type 
  FROM information_schema.role_table_grants 
 WHERE table_schema = 'public' 
   AND grantee IN ('anon', 'authenticated') 
 ORDER BY table_name;

-- Query 3: Core Identity and Audit Tables
SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
 WHERE table_schema = 'public' 
   AND table_name IN ('plants', 'audit_logs', 'users', 'profiles') 
 ORDER BY table_name, ordinal_position;
```
