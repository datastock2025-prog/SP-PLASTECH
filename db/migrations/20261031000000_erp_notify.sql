-- migrate:up
-- Realtime change feed (G3): every committed row change emits a tiny NOTIFY the API fans out over SSE.
-- Payload carries ids only (no row data), so nothing sensitive crosses the channel; clients refetch via the normal API.
CREATE OR REPLACE FUNCTION public.erp_notify() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_notify('erp_changes', json_build_object(
    'tenant_id', NEW.tenant_id, 'table', TG_TABLE_NAME, 'id', NEW.id,
    'op', CASE WHEN TG_OP = 'INSERT' THEN 'CREATE'
               WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'DELETE' ELSE 'UPDATE' END
  )::text);
  RETURN NULL;
END $$;

-- Add one trigger per table as its module moves to the Drizzle helpers.
DROP TRIGGER IF EXISTS notify_qc_inspections ON public.qc_inspections;
CREATE TRIGGER notify_qc_inspections
  AFTER INSERT OR UPDATE ON public.qc_inspections
  FOR EACH ROW EXECUTE FUNCTION public.erp_notify();

-- migrate:down
DROP TRIGGER IF EXISTS notify_qc_inspections ON public.qc_inspections;
DROP FUNCTION IF EXISTS public.erp_notify();
