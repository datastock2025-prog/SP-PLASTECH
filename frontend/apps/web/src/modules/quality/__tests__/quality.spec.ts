import { describe, it, expect } from 'vitest';
import {
  NcrSchema,
  CreateNcrInputSchema,
  UpdateNcrInputSchema,
  CapaSchema,
  CertificateOfAnalysisSchema,
  InspectionPlanSchema,
} from '@/packages/contracts/quality';

describe('Quality Module Contracts & Validation', () => {
  it('validates a valid NcrSchema payload', () => {
    const rawNcr = {
      id: 'NCR-2026-0034',
      title: 'Sink marks observed on exterior surface of rear bumper',
      itemCode: 'FG-AUTO-BUMPER-01',
      severity: 'Major' as const,
      defectType: 'Visual Defect',
      lotNumber: 'LOT-2026-10-098',
      reportedBy: 'Kavita Patil',
      description: 'Excessive cycle time cooling variance led to 0.4mm depression sink marks.',
      quantityAffected: 45,
      status: 'open' as const,
      version: 1,
    };

    const parsed = NcrSchema.safeParse(rawNcr);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('NCR-2026-0034');
      expect(parsed.data.severity).toBe('Major');
      expect(parsed.data.quantityAffected).toBe(45);
    }
  });

  it('rejects an NCR with non-positive affected quantity', () => {
    const invalid = {
      title: 'Short shot on container cap',
      itemCode: 'FG-CAP-01',
      severity: 'Minor' as const,
      defectType: 'Molding Defect',
      lotNumber: 'LOT-01',
      reportedBy: 'Inspector',
      description: 'Material starving in mold cavity 4.',
      quantityAffected: -10,
    };

    const parsed = NcrSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateNcrInputSchema with version check', () => {
    const update = {
      status: 'capa_pending' as const,
      version: 2,
    };

    const parsed = UpdateNcrInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.status).toBe('capa_pending');
    }
  });

  it('validates a CapaSchema payload', () => {
    const rawCapa = {
      id: 'CAPA-2026-0012',
      title: 'Cooling line descaling & temperature controller recalibration',
      ncrId: 'NCR-2026-0034',
      assignedTo: 'Vikram Shinde',
      rootCause: 'Scale accumulation in mold core cooling channels.',
      actionPlan: 'Acid flush cooling channels and install magnetic water treatment filter.',
      status: 'in_progress' as const,
      dueDate: '2026-10-25',
      version: 1,
    };

    const parsed = CapaSchema.safeParse(rawCapa);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('CAPA-2026-0012');
      expect(parsed.data.assignedTo).toBe('Vikram Shinde');
    }
  });

  it('validates a CertificateOfAnalysisSchema payload', () => {
    const rawCoa = {
      id: 'coa-uuid-001',
      coaNumber: 'COA-2026-0891',
      lotNumber: 'LOT-2026-10-098',
      itemCode: 'FG-AUTO-BUMPER-01',
      customerName: 'Tata Motors Limited',
      status: 'released' as const,
      issuedDate: '2026-10-13',
    };

    const parsed = CertificateOfAnalysisSchema.safeParse(rawCoa);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.coaNumber).toBe('COA-2026-0891');
      expect(parsed.data.status).toBe('released');
    }
  });

  it('validates an InspectionPlanSchema payload', () => {
    const rawPlan = {
      id: 'ip-uuid-001',
      name: 'Receiving Inspection - PP Homopolymer Resin',
      itemCode: 'RM-PP-001',
      type: 'incoming' as const,
      active: true,
    };

    const parsed = InspectionPlanSchema.safeParse(rawPlan);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Receiving Inspection - PP Homopolymer Resin');
      expect(parsed.data.type).toBe('incoming');
    }
  });
});
