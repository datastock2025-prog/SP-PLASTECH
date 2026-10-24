-- migrate:up
-- Platform admin tables served by core/resource.ts: give system_parameters and privacy_requests the soft-delete
-- (and version) columns the resource layer requires, then attach the audit + realtime triggers to all five.
-- Before this, crud.ts filtered `deleted_at IS NULL` on tables that had no such column, so those endpoints failed.
ALTER TABLE public.system_parameters ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.privacy_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.privacy_requests ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['reason_codes','document_templates','system_parameters','backup_runs','privacy_requests'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
    EXECUTE format('DROP TRIGGER IF EXISTS notify_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER notify_%1$s AFTER INSERT OR UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.erp_notify()', t);
  END LOOP;
END $$;

-- migrate:down
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['reason_codes','document_templates','system_parameters','backup_runs','privacy_requests'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS notify_%1$s ON public.%1$I', t);
  END LOOP;
END $$;
ALTER TABLE public.privacy_requests DROP COLUMN IF EXISTS version;
ALTER TABLE public.privacy_requests DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.system_parameters DROP COLUMN IF EXISTS deleted_at;
