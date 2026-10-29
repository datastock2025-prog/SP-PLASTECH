import { SYSTEM_ROLES } from '../ability.js';
import { config } from '../config.js';
import { getDrizzle, schema } from '../db.js';
import { insertUser } from '../modules/identity/service.js';
import { writeAudit } from '../core/audit.js';
import { eq, and, isNull, sql } from 'drizzle-orm';

// Ensures the tenant and the system roles (reference data) exist and, only when
// the system has no users at all, creates the first super admin from env vars.
export async function bootstrap(): Promise<{ tenantId: string }> {
  return await getDrizzle().transaction(async (tx) => {
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({
        code: config.tenantCode,
        name: config.tenantName,
        slug: config.tenantCode.toLowerCase(),
      })
      .onConflictDoUpdate({
        target: schema.tenants.code,
        set: {
          name: config.tenantName,
          slug: config.tenantCode.toLowerCase(),
        },
      })
      .returning({ id: schema.tenants.id });
    const tenantId: string = tenant.id;

    for (const r of SYSTEM_ROLES) {
      await tx
        .insert(schema.roles)
        .values({
          tenantId,
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: true,
          permissions: r.permissions as any,
        })
        .onConflictDoNothing({
          target: [schema.roles.tenantId, schema.roles.code],
          where: isNull(schema.roles.deletedAt),
        });
    }

    // Ensure default manufacturing plants exist for multi-plant / All Plants scope
    const [existingPlantsCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.plants)
      .where(and(eq(schema.plants.tenantId, tenantId), isNull(schema.plants.deletedAt)));

    if ((existingPlantsCount?.count ?? 0) === 0) {
      const defaultPlants = [
        { code: 'PLT-01', name: 'Plant 1 - Pimpri Auto-Hub', location: 'Pune, MH', isDefault: true },
        { code: 'PLT-02', name: 'Plant 2 - Chakan Complex', location: 'Chakan, MH', isDefault: false },
        { code: 'PLT-03', name: 'Plant 3 - Sanand Mega Plant', location: 'Sanand, GJ', isDefault: false },
        { code: 'PLT-04', name: 'Plant 4 - Pantnagar Facility', location: 'Pantnagar, UK', isDefault: false },
      ];
      for (const p of defaultPlants) {
        await tx
          .insert(schema.plants)
          .values({
            tenantId,
            code: p.code,
            name: p.name,
            location: p.location,
            isDefault: p.isDefault,
            isActive: true,
          })
          .onConflictDoNothing();
      }
    }

    const allTenantPlants = await tx
      .select({ id: schema.plants.id })
      .from(schema.plants)
      .where(and(eq(schema.plants.tenantId, tenantId), isNull(schema.plants.deletedAt), eq(schema.plants.isActive, true)));
    const allPlantIds = allTenantPlants.map((p) => p.id);

    const [users] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.userProfiles);

    if ((users?.count ?? 0) === 0) {
      const { email, username, password, name } = config.bootstrapAdmin;
      if (email && password) {
        const [role] = await tx
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(and(eq(schema.roles.tenantId, tenantId), eq(schema.roles.code, 'SUPER_ADMIN')));

        const id = await insertUser(tx, {
          tenantId,
          email,
          username,
          password,
          fullName: name,
          roleId: role.id,
          plantIds: allPlantIds,
          mustChangePassword: true,
        });

        await writeAudit(tx, {
          tenantId,
          entityType: 'user',
          entityId: id,
          action: 'CREATE',
          performedBy: null,
          newValues: { email, username, role: 'SUPER_ADMIN', source: 'bootstrap' },
        });
        console.log(`[bootstrap] super admin '${username}' created (password change required at first login)`);
      } else {
        console.warn('[bootstrap] no users exist. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the first admin.');
      }
    }

    // --- Enterprise Admin Seed Data ---

    // 1. Company Profile
    const [existingCompany] = await tx
      .select({ id: schema.companySettings.id })
      .from(schema.companySettings)
      .where(eq(schema.companySettings.tenantId, tenantId))
      .limit(1);
    if (!existingCompany) {
      await tx.insert(schema.companySettings).values({
        tenantId,
        companyName: 'SP-PLASTECH Polymer Industries Private Limited',
        legalName: 'SP-PLASTECH Polymer Industries Private Limited',
        gstin: '27AABCS1429B1Z4',
        pan: 'AABCS1429B',
        cin: 'U25209MH2018PTC312456',
        registeredAddress: 'Plot A-12, Chakan Industrial Area Phase II, MIDC, Pune - 410501, Maharashtra, India',
        currency: 'INR',
        fiscalYearStart: '04-01',
      });
    }

    // 2. Standard Operating Shifts
    const [shiftCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.shifts)
      .where(eq(schema.shifts.tenantId, tenantId));
    if ((shiftCount?.count ?? 0) === 0) {
      const defaultShifts = [
        { code: 'SHIFT-GEN', name: 'General Shift', startTime: '09:00', endTime: '18:00', breakDurationMinutes: 60, isNightShift: false, isActive: true },
        { code: 'SHIFT-A', name: 'Shift A (Morning)', startTime: '06:00', endTime: '14:00', breakDurationMinutes: 30, isNightShift: false, isActive: true },
        { code: 'SHIFT-B', name: 'Shift B (Evening)', startTime: '14:00', endTime: '22:00', breakDurationMinutes: 30, isNightShift: false, isActive: true },
        { code: 'SHIFT-C', name: 'Shift C (Night)', startTime: '22:00', endTime: '06:00', breakDurationMinutes: 30, isNightShift: true, isActive: true },
      ];
      for (const s of defaultShifts) {
        await tx.insert(schema.shifts).values({ tenantId, ...s }).onConflictDoNothing();
      }
    }

    // 3. Document Numbering Sequences
    const [numCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.numberingSeries)
      .where(eq(schema.numberingSeries.tenantId, tenantId));
    if ((numCount?.count ?? 0) === 0) {
      const defaultSeries = [
        { seriesCode: 'ITEM', prefix: 'ITM-', suffix: '', currentNumber: 1000, paddingDigits: 5, isActive: true },
        { seriesCode: 'BOM', prefix: 'BOM-', suffix: '', currentNumber: 500, paddingDigits: 5, isActive: true },
        { seriesCode: 'WO', prefix: 'WO-2026-', suffix: '', currentNumber: 120, paddingDigits: 5, isActive: true },
        { seriesCode: 'SO', prefix: 'SO-2026-', suffix: '', currentNumber: 85, paddingDigits: 5, isActive: true },
        { seriesCode: 'PO', prefix: 'PO-2026-', suffix: '', currentNumber: 64, paddingDigits: 5, isActive: true },
        { seriesCode: 'DC', prefix: 'DC-', suffix: '', currentNumber: 210, paddingDigits: 5, isActive: true },
        { seriesCode: 'NCR', prefix: 'NCR-2026-', suffix: '', currentNumber: 14, paddingDigits: 4, isActive: true },
      ];
      for (const n of defaultSeries) {
        await tx.insert(schema.numberingSeries).values({ tenantId, ...n }).onConflictDoNothing();
      }
    }

    // 4. Logistics Transporters Directory
    const [transCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.transporters)
      .where(and(eq(schema.transporters.tenantId, tenantId), isNull(schema.transporters.deletedAt)));
    if ((transCount?.count ?? 0) === 0) {
      const defaultTrans = [
        { code: 'TR-SAFEX', name: 'SafeXpress Logistics Pvt Ltd', gstin: '27AAACS1234F1Z1', contactPerson: 'Rajesh Sharma', phone: '+91 98220 11223', email: 'dispatch@safexpress.com', isActive: true },
        { code: 'TR-BLUEDART', name: 'Blue Dart Express Ltd', gstin: '27AAACB5678G1Z2', contactPerson: 'Pooja Verma', phone: '+91 98220 44556', email: 'operations@bluedart.com', isActive: true },
        { code: 'TR-VRL', name: 'VRL Logistics Ltd', gstin: '27AAACV9012H1Z3', contactPerson: 'Suresh Patil', phone: '+91 98220 77889', email: 'chakan@vrllogistics.com', isActive: true },
      ];
      for (const t of defaultTrans) {
        await tx.insert(schema.transporters).values({ tenantId, ...t }).onConflictDoNothing();
      }
    }

    // 5. User Groups & Crews
    const [groupCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.userGroups)
      .where(and(eq(schema.userGroups.tenantId, tenantId), isNull(schema.userGroups.deletedAt)));
    if ((groupCount?.count ?? 0) === 0) {
      const defaultGroups = [
        { code: 'GRP-ENG', name: 'Tooling & DFM Engineering Specialists', description: 'Core mold design, cavity qualification, and engineering change team' },
        { code: 'GRP-PROD', name: 'Plant Shift Supervisors & Incharges', description: 'Daily shop floor scheduling, work order execution, and operator tracking' },
        { code: 'GRP-QA', name: 'Quality Assurance & AQL Inspectors', description: 'In-process injection inspection, melt density validation, and COA generation' },
        { code: 'GRP-MAINT', name: 'Preventive & Tooling Maintenance Crew', description: 'Hydraulic seal inspection, barrel screw cleaning, and mold repair team' },
      ];
      for (const g of defaultGroups) {
        await tx.insert(schema.userGroups).values({ tenantId, ...g }).onConflictDoNothing();
      }
    }

    // 6. Reason Codes (Downtime, Scrap, Adjustments)
    const [reasonCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reasonCodes)
      .where(and(eq(schema.reasonCodes.tenantId, tenantId), isNull(schema.reasonCodes.deletedAt)));
    if ((reasonCount?.count ?? 0) === 0) {
      const defaultReasons = [
        { category: 'DOWNTIME', code: 'DT-MOLD-BLOCK', description: 'Mold Runner or Gate Blockage', isActive: true },
        { category: 'DOWNTIME', code: 'DT-HEATER-ERR', description: 'Barrel Zone Thermocouple/Heater Band Failure', isActive: true },
        { category: 'DOWNTIME', code: 'DT-SETUP-TOOL', description: 'Scheduled Mold Interchange & Clamping Setup', isActive: true },
        { category: 'SCRAP', code: 'SCR-SHORT-SHOT', description: 'Short Shot due to Low Cushion / Inadequate Pack Pressure', isActive: true },
        { category: 'SCRAP', code: 'SCR-FLASH-BURR', description: 'Excess Flash along Parting Line from Tool Wear', isActive: true },
        { category: 'ADJUSTMENT', code: 'ADJ-CYCLE-COUNT', description: 'Physical Inventory Cycle Count Variance Reconcile', isActive: true },
      ];
      for (const r of defaultReasons) {
        await tx.insert(schema.reasonCodes).values({ tenantId, ...r }).onConflictDoNothing();
      }
    }

    // 7. Core System Parameters
    const [paramCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.systemParameters)
      .where(and(eq(schema.systemParameters.tenantId, tenantId), isNull(schema.systemParameters.deletedAt)));
    if ((paramCount?.count ?? 0) === 0) {
      const defaultParams = [
        { category: 'INVENTORY', paramKey: 'inventory.allow_negative_stock', paramValue: 'false', dataType: 'BOOLEAN', description: 'Forbid inventory dispatch when stock balance is zero' },
        { category: 'PRODUCTION', paramKey: 'production.max_regrind_tolerance_pct', paramValue: '25', dataType: 'NUMBER', description: 'Max allowable closed-loop regrind blend ratio percentage' },
        { category: 'QUALITY', paramKey: 'quality.polymer_melt_density_tolerance', paramValue: '0.005', dataType: 'NUMBER', description: 'Max polymer melt density deviation tolerance (g/cm3)' },
      ];
      for (const p of defaultParams) {
        await tx.insert(schema.systemParameters).values({ tenantId, ...p }).onConflictDoNothing();
      }
    }

    return { tenantId };
  });
}
