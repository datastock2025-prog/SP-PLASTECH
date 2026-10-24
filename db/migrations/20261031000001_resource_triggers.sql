-- migrate:up
-- Attach the DB-side audit trail (audit_row_change) and realtime feed (erp_notify) to every table served by
-- core/resource.ts. App code no longer writes audit rows for these resources. Tables that do not exist or lack
-- the required columns are skipped, so the migration is safe on partially migrated databases.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'bill_of_materials','bom_lines','gl_accounts','journal_entries','journal_lines','ap_invoices',
    'employees','attendance_records','shift_rosters','operator_skills','maintenance_schedules','breakdown_tickets',
    'machines','work_orders','production_entries','downtime_logs','mrp_runs',
    'suppliers','purchase_orders','purchase_requisitions','goods_receipt_notes',
    'customers','sales_orders','sales_order_lines','delivery_challans',
    'warehouses','warehouse_bins','warehouse_stock','stock_movement_ledger',
    'workspace_tasks','notifications','workspace_presets'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = t AND column_name IN ('id','tenant_id','deleted_at')) = 3 THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
      EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
      EXECUTE format('DROP TRIGGER IF EXISTS notify_%1$s ON public.%1$I', t);
      EXECUTE format('CREATE TRIGGER notify_%1$s AFTER INSERT OR UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.erp_notify()', t);
    ELSE
      RAISE NOTICE 'skipped triggers on %', t;
    END IF;
  END LOOP;
END $$;

-- migrate:down
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_trigger g JOIN pg_class c ON c.oid = g.tgrelid
            WHERE g.tgname = 'audit_' || c.relname OR g.tgname = 'notify_' || c.relname LOOP
    IF t <> 'qc_inspections' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
      EXECUTE format('DROP TRIGGER IF EXISTS notify_%1$s ON public.%1$I', t);
    END IF;
  END LOOP;
END $$;
