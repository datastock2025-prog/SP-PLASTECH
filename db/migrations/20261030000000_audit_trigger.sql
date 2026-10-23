-- migrate:up
-- Row-level audit trail written by the database, in the same transaction as the mutation.
-- Replaces per-route writeAudit() calls. SECURITY DEFINER so request roles cannot skip or alter it.
CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o jsonb;
  n jsonb := to_jsonb(NEW);
  act text;
  changed text[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    act := 'CREATE';
  ELSE
    o := to_jsonb(OLD);
    act := CASE WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'DELETE' ELSE 'UPDATE' END;
    SELECT coalesce(array_agg(e.key ORDER BY e.key), '{}') INTO changed
      FROM jsonb_each(n) e
     WHERE e.value IS DISTINCT FROM o -> e.key
       AND e.key NOT IN ('updated_at', 'updated_by', 'version');
  END IF;

  INSERT INTO audit_logs (tenant_id, entity_type, entity_id, action, changed_fields, old_values, new_values, performed_by, ip_address)
  VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id::text, act, coalesce(changed, '{}'), o, n,
          nullif(current_setting('app.user_id', true), ''), nullif(current_setting('app.ip', true), ''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS audit_qc_inspections ON public.qc_inspections;
CREATE TRIGGER audit_qc_inspections
  AFTER INSERT OR UPDATE ON public.qc_inspections
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- migrate:down
DROP TRIGGER IF EXISTS audit_qc_inspections ON public.qc_inspections;
DROP FUNCTION IF EXISTS public.audit_row_change();
