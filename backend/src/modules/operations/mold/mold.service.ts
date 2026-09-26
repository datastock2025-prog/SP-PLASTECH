import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export type MoldStatus = 'CREATION' | 'ACTIVE' | 'MAINTENANCE_REQUIRED' | 'UNDER_MAINTENANCE' | 'RETIRED';

export interface MoldRecord {
  id: string;
  tenantId: string;
  moldCode: string;
  name: string;
  cavityCount: number;
  totalShots: number;
  maxShotsBeforeMaintenance: number;
  lastMaintenanceShots: number;
  status: MoldStatus;
  mountedMachineId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTriggerResult {
  moldId: string;
  moldCode: string;
  currentShots: number;
  maintenanceTriggered: boolean;
  maintenanceWorkOrderId?: string;
}

@Injectable()
export class MoldService {
  private readonly logger = new Logger(MoldService.name);

  // In-memory mold repository
  private readonly molds = new Map<string, MoldRecord>([
    [
      'MOLD-PET-500ML-02',
      {
        id: 'MOLD-PET-500ML-02',
        tenantId: 'TENANT-ALPHA-IND',
        moldCode: 'MLD-500ML-BTL',
        name: '500ml Bottle Preform 8-Cavity Mold',
        cavityCount: 8,
        totalShots: 49850,
        maxShotsBeforeMaintenance: 50000,
        lastMaintenanceShots: 0,
        status: 'ACTIVE',
        mountedMachineId: 'IMM-04',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  /**
   * Log shots to a mold and check maintenance threshold
   */
  async recordShots(tenantId: string, moldId: string, additionalShots: number): Promise<MaintenanceTriggerResult> {
    const mold = this.molds.get(moldId);
    if (!mold || mold.tenantId !== tenantId) {
      throw new BadRequestException(`Mold ${moldId} not found for tenant ${tenantId}`);
    }

    mold.totalShots += additionalShots;
    mold.updatedAt = new Date().toISOString();

    const shotsSinceLastMaint = mold.totalShots - mold.lastMaintenanceShots;
    let maintenanceTriggered = false;
    let maintenanceWorkOrderId: string | undefined;

    if (shotsSinceLastMaint >= mold.maxShotsBeforeMaintenance && mold.status === 'ACTIVE') {
      mold.status = 'MAINTENANCE_REQUIRED';
      maintenanceTriggered = true;
      maintenanceWorkOrderId = `MWO-${Date.now()}-${mold.moldCode}`;
      this.logger.warn(
        `🚨 Mold ${mold.moldCode} exceeded threshold (${mold.totalShots} shots). Automatic maintenance work order created: ${maintenanceWorkOrderId}`,
      );
    }

    return {
      moldId: mold.id,
      moldCode: mold.moldCode,
      currentShots: mold.totalShots,
      maintenanceTriggered,
      maintenanceWorkOrderId,
    };
  }

  /**
   * Mount mold to machine or dismount
   */
  async mountMold(tenantId: string, moldId: string, machineId: string | null): Promise<MoldRecord> {
    const mold = this.molds.get(moldId);
    if (!mold || mold.tenantId !== tenantId) {
      throw new BadRequestException(`Mold ${moldId} not found`);
    }

    mold.mountedMachineId = machineId;
    mold.updatedAt = new Date().toISOString();
    this.logger.log(`Mold ${mold.moldCode} location updated: Mounted on ${machineId || 'STORAGE_RACK'}`);
    return mold;
  }
}
