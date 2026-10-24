-- migrate:up
-- Protocol 1D: Organisation, Plants, Warehouses & Numbering Series Architecture

-- 1. Extend Plants table
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Exactly one default plant per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_plants_tenant_default
  ON public.plants (tenant_id)
  WHERE is_default = true AND deleted_at IS NULL;

-- Mark first plant as default for existing tenants
WITH first_plant AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at ASC) as rn
  FROM public.plants
  WHERE deleted_at IS NULL
)
UPDATE public.plants p
SET is_default = true
FROM first_plant fp
WHERE p.id = fp.id AND fp.rn = 1;

-- 2. Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  legal_name text,
  cin text,
  pan text,
  gstin text,
  currency text NOT NULL DEFAULT 'INR',
  fiscal_year_start text NOT NULL DEFAULT '04-01',
  logo_url text,
  registered_address text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_settings_tenant UNIQUE (tenant_id)
);

-- Seed company settings from tenants
INSERT INTO public.company_settings (tenant_id, company_name, legal_name, currency)
SELECT id, name, name || ' Private Limited', 'INR'
FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Warehouse Bins Table
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  warehouse_id text NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  bin_code text NOT NULL,
  zone text,
  aisle text,
  rack text,
  shelf text,
  capacity_kg numeric(12, 3) NOT NULL DEFAULT 1000.000,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_bin_capacity CHECK (capacity_kg > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouse_bin_code
  ON public.warehouse_bins (warehouse_id, bin_code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouse_bins_tenant ON public.warehouse_bins (tenant_id, is_active);

-- 4. Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_duration_minutes integer NOT NULL DEFAULT 30,
  is_night_shift boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shifts_plant ON public.shifts (tenant_id, plant_id, is_active);

-- Seed standard 3-shift plastic manufacturing roster
INSERT INTO public.shifts (tenant_id, code, name, start_time, end_time, break_duration_minutes, is_night_shift)
SELECT t.id, 'SHIFT-A', 'Morning Shift (07:00 - 15:30)', '07:00:00'::time, '15:30:00'::time, 30, false FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.shifts (tenant_id, code, name, start_time, end_time, break_duration_minutes, is_night_shift)
SELECT t.id, 'SHIFT-B', 'Evening Shift (15:30 - 00:00)', '15:30:00'::time, '00:00:00'::time, 30, false FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.shifts (tenant_id, code, name, start_time, end_time, break_duration_minutes, is_night_shift)
SELECT t.id, 'SHIFT-C', 'Night Shift (00:00 - 07:00)', '00:00:00'::time, '07:00:00'::time, 30, true FROM public.tenants t
ON CONFLICT DO NOTHING;

-- 5. Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  name text NOT NULL,
  holiday_date date NOT NULL,
  is_optional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant_date ON public.holidays (tenant_id, holiday_date);

-- 6. Transporters Table
CREATE TABLE IF NOT EXISTS public.transporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  gstin text,
  contact_person text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transporters_tenant_code
  ON public.transporters (tenant_id, code)
  WHERE deleted_at IS NULL;

-- 7. Numbering Series Table
CREATE TABLE IF NOT EXISTS public.numbering_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  series_code text NOT NULL,
  prefix text NOT NULL,
  suffix text,
  current_number bigint NOT NULL DEFAULT 0,
  padding_digits integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_numbering_series_scope
  ON public.numbering_series (tenant_id, series_code, COALESCE(plant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Seed default document sequences
INSERT INTO public.numbering_series (tenant_id, series_code, prefix, current_number, padding_digits)
SELECT t.id, 'WO', 'WO-2627-', 100, 5 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.numbering_series (tenant_id, series_code, prefix, current_number, padding_digits)
SELECT t.id, 'PO', 'PO-2627-', 100, 5 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.numbering_series (tenant_id, series_code, prefix, current_number, padding_digits)
SELECT t.id, 'SO', 'SO-2627-', 100, 5 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.numbering_series (tenant_id, series_code, prefix, current_number, padding_digits)
SELECT t.id, 'GRN', 'GRN-2627-', 100, 5 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.numbering_series (tenant_id, series_code, prefix, current_number, padding_digits)
SELECT t.id, 'INV', 'INV-2627-', 100, 5 FROM public.tenants t
ON CONFLICT DO NOTHING;

-- 8. PostgreSQL Stored Function: Gap-free next_doc_number()
CREATE OR REPLACE FUNCTION public.next_doc_number(
  p_tenant_id uuid,
  p_series_code text,
  p_plant_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_rec record;
  v_next_val bigint;
  v_doc_number text;
BEGIN
  -- Lock the sequence row FOR UPDATE
  SELECT id, prefix, suffix, current_number, padding_digits
    INTO v_rec
    FROM public.numbering_series
   WHERE tenant_id = p_tenant_id
     AND series_code = p_series_code
     AND (plant_id = p_plant_id OR (plant_id IS NULL AND p_plant_id IS NULL) OR plant_id IS NULL)
   ORDER BY plant_id NULLS LAST
   LIMIT 1
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No numbering series found for tenant %, code %', p_tenant_id, p_series_code;
  END IF;

  v_next_val := v_rec.current_number + 1;

  UPDATE public.numbering_series
     SET current_number = v_next_val,
         version = version + 1,
         updated_at = now()
   WHERE id = v_rec.id;

  v_doc_number := COALESCE(v_rec.prefix, '') ||
                  LPAD(v_next_val::text, v_rec.padding_digits, '0') ||
                  COALESCE(v_rec.suffix, '');

  RETURN v_doc_number;
END;
$$;

-- Grant permissions to erp_app
GRANT ALL ON TABLE public.company_settings TO erp_app;
GRANT ALL ON TABLE public.warehouse_bins TO erp_app;
GRANT ALL ON TABLE public.shifts TO erp_app;
GRANT ALL ON TABLE public.holidays TO erp_app;
GRANT ALL ON TABLE public.transporters TO erp_app;
GRANT ALL ON TABLE public.numbering_series TO erp_app;
GRANT EXECUTE ON FUNCTION public.next_doc_number(uuid, text, uuid) TO erp_app;

-- migrate:down
-- shortcut: no automated rollback for this historical migration; restore from backup.
