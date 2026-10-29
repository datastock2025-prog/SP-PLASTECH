import { z } from 'zod';

// Transporter Master — types + API row mapping only.
// Data lives in PostgreSQL (`transporters` table); the TanStack Query cache is the SSOT.
// Hooks: useAdminTransporters / useSaveAdminTransporter / useDeleteAdminTransporter (src/hooks/useAdmin.ts).

export type TransportMode = 'Road' | 'Rail' | 'Air' | 'Ship' | 'Multi-Modal';

export interface TransporterRecord {
  id: string;
  transporterCode: string;
  name: string;
  transporterIdGstin: string; // 15-digit GSTIN / E-Way Bill Transporter ID
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  transportModes: TransportMode[];
  vehicleTypes: string[];
  status: 'active' | 'inactive';
  notes?: string;
  createdDate: string;
}

const TransporterRowSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  gstin: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().nullable().optional(),
  metadata: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      transportModes: z.array(z.enum(['Road', 'Rail', 'Air', 'Ship', 'Multi-Modal'])).optional(),
      vehicleTypes: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
});

export function transporterFromApi(raw: unknown): TransporterRecord {
  const t = TransporterRowSchema.parse(raw);
  const m = t.metadata ?? {};
  return {
    id: t.id,
    transporterCode: t.code,
    name: t.name,
    transporterIdGstin: t.gstin ?? '',
    contactPerson: t.contactPerson ?? '',
    phone: t.phone ?? '',
    email: t.email ?? '',
    address: m.address ?? '',
    city: m.city ?? '',
    state: m.state ?? '',
    transportModes: m.transportModes ?? [],
    vehicleTypes: m.vehicleTypes ?? [],
    status: t.isActive ? 'active' : 'inactive',
    notes: m.notes ?? '',
    createdDate: (t.createdAt ?? '').slice(0, 10),
  };
}

/** Payload for POST/PATCH /transporters. Omits empty optional strings. */
export function transporterToApi(t: Partial<TransporterRecord>) {
  const opt = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    code: opt(t.transporterCode),
    name: opt(t.name),
    gstin: opt(t.transporterIdGstin),
    contactPerson: opt(t.contactPerson),
    phone: opt(t.phone),
    email: opt(t.email),
    metadata: {
      address: opt(t.address),
      city: opt(t.city),
      state: opt(t.state),
      transportModes: t.transportModes,
      vehicleTypes: t.vehicleTypes,
      notes: opt(t.notes),
    },
  };
}
