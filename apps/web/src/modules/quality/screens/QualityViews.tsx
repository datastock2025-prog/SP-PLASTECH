import React from 'react';
import {
  InspectionPlan,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
} from '@/src/types';
import {
  useInspectionPlans,
  useNcrs,
  useCapas,
  useCoas,
} from '../api/useQuality';

import { QualityDashboardView } from '../components/QualityDashboardView';
import { InspectionPlansView } from '../components/InspectionPlansView';
import { IncomingInspectionView } from '../components/IncomingInspectionView';
import { SpcMonitorView } from '../components/SpcMonitorView';
import { FinalInspectionView } from '../components/FinalInspectionView';
import { NcrManagementView } from '../components/NcrManagementView';
import { CapaManagementView } from '../components/CapaManagementView';
import { CoaManagementView } from '../components/CoaManagementView';
import { CalibrationEquipmentView } from '../components/CalibrationEquipmentView';
import { DocControlAuditView } from '../components/DocControlAuditView';
import { WipStoreQcInspectionView } from '../components/WipStoreQcInspectionView';
import { WipInventoryRecord } from '@/src/types/operationsWipTypes';
import { ItemMaster, WorkOrder } from '@/src/types';
import { INITIAL_WIP_RECORDS } from '@/src/data/operationsWipData';

interface QualityProps {
  view: string;
  inspectionPlans: InspectionPlan[];
  ncrs: NonConformanceReport[];
  capas: CapaReport[];
  coas: CertificateOfAnalysis[];
  selectedId?: string;
  wipRecords?: WipInventoryRecord[];
  items?: ItemMaster[];
  workOrders?: WorkOrder[];
  onUpdateWipRecord?: (record: WipInventoryRecord) => void;
  onNavigate: (view: string, param?: any) => void;
  onUpdateNCR: (ncr: NonConformanceReport) => void;
  onCreateNCR: (ncr: NonConformanceReport) => void;
  onUpdateCAPA: (capa: CapaReport) => void;
  onCreateCAPA: (capa: CapaReport) => void;
  onUpdateCOA: (coa: CertificateOfAnalysis) => void;
  onCreateCOA: (coa: CertificateOfAnalysis) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const QualityViews: React.FC<QualityProps> = ({
  view,
  inspectionPlans,
  ncrs,
  capas,
  coas,
  selectedId,
  wipRecords = INITIAL_WIP_RECORDS,
  items = [],
  workOrders = [],
  onUpdateWipRecord = () => {},
  onNavigate,
  onUpdateNCR,
  onCreateNCR,
  onUpdateCAPA,
  onCreateCAPA,
  onUpdateCOA,
  onCreateCOA,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  // TanStack Query SSOT (Rule 1 & Rule 3)
  const { data: queryPlans } = useInspectionPlans();
  const { data: queryNcrs } = useNcrs();
  const { data: queryCapas } = useCapas();
  const { data: queryCoas } = useCoas();

  const effectiveInspectionPlans = (inspectionPlans && inspectionPlans.length > 0 ? inspectionPlans : queryPlans) || [];
  const effectiveNcrs = (ncrs && ncrs.length > 0 ? ncrs : queryNcrs) || [];
  const effectiveCapas = (capas && capas.length > 0 ? capas : queryCapas) || [];
  const effectiveCoas = (coas && coas.length > 0 ? coas : queryCoas) || [];
  /* ----------------------------------------------------
     0. CONSOLIDATED STORE QUALITY CHECK (WIP / DEFLASH / ASSEMBLY)
  ---------------------------------------------------- */
  if (view === 'wipStoreQc' || view === 'storeQcCheck' || view === 'wipQcInspection') {
    return (
      <WipStoreQcInspectionView
        wipRecords={wipRecords}
        items={items}
        workOrders={workOrders}
        onUpdateWipRecord={onUpdateWipRecord}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }
  /* ----------------------------------------------------
     1. QUALITY COMMAND CENTER (DASHBOARD)
  ---------------------------------------------------- */
  if (view === 'qualityDash') {
    return (
      <QualityDashboardView
        inspectionPlans={effectiveInspectionPlans}
        ncrs={effectiveNcrs}
        capas={effectiveCapas}
        coas={effectiveCoas}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     2. INSPECTION PLANS & SAMPLING PROTOCOLS
  ---------------------------------------------------- */
  if (view === 'inspectionPlanList' || view === 'inspectionPlanDetail') {
    return (
      <InspectionPlansView
        inspectionPlans={effectiveInspectionPlans}
        selectedId={selectedId}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     3. INCOMING RAW MATERIAL INSPECTION (IQC)
  ---------------------------------------------------- */
  if (view === 'incomingInspection') {
    return (
      <IncomingInspectionView
        inspectionPlans={effectiveInspectionPlans}
        ncrs={effectiveNcrs}
        onNavigate={onNavigate}
        onCreateNCR={onCreateNCR}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     4. IN-PROCESS STATISTICAL PROCESS CONTROL (SPC)
  ---------------------------------------------------- */
  if (view === 'spcMonitor') {
    return (
      <SpcMonitorView
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     5. FINAL PRODUCT RELEASE & COA TRIGGER (FQC)
  ---------------------------------------------------- */
  if (view === 'finalInspection') {
    return (
      <FinalInspectionView
        coas={effectiveCoas}
        ncrs={effectiveNcrs}
        onNavigate={onNavigate}
        onCreateNCR={onCreateNCR}
        onCreateCOA={onCreateCOA}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     6. NON-CONFORMANCE REPORTS (NCR) & 5-WHY RCA
  ---------------------------------------------------- */
  if (view === 'ncrList' || view === 'ncrDetail') {
    return (
      <NcrManagementView
        ncrs={effectiveNcrs}
        selectedId={selectedId}
        onNavigate={onNavigate}
        onUpdateNCR={onUpdateNCR}
        onCreateNCR={onCreateNCR}
        onCreateCAPA={onCreateCAPA}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     7. 8D CAPA MANAGEMENT & EFFECTIVENESS
  ---------------------------------------------------- */
  if (view === 'capaList' || view === 'capaDetail') {
    return (
      <CapaManagementView
        capas={effectiveCapas}
        ncrs={effectiveNcrs}
        selectedId={selectedId}
        onNavigate={onNavigate}
        onUpdateCAPA={onUpdateCAPA}
        onCreateCAPA={onCreateCAPA}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     8. CERTIFICATE OF ANALYSIS (COA)
  ---------------------------------------------------- */
  if (view === 'qcoaList' || view === 'qcoaDetail') {
    return (
      <CoaManagementView
        coas={effectiveCoas}
        selectedId={selectedId}
        onNavigate={onNavigate}
        onUpdateCOA={onUpdateCOA}
        onCreateCOA={onCreateCOA}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     9. GAUGE & METROLOGY CALIBRATION (MSA)
  ---------------------------------------------------- */
  if (view === 'calibrationList') {
    return (
      <CalibrationEquipmentView
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     10. DOCUMENT CONTROL & QUALITY AUDITS
  ---------------------------------------------------- */
  if (view === 'docControlList') {
    return (
      <DocControlAuditView
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     FALLBACK FOR OTHER QUALITY SCREENS
  ---------------------------------------------------- */
  return (
    <QualityDashboardView
      inspectionPlans={effectiveInspectionPlans}
      ncrs={effectiveNcrs}
      capas={effectiveCapas}
      coas={effectiveCoas}
      onNavigate={onNavigate}
      openDrawer={openDrawer}
      closeDrawer={closeDrawer}
      showToast={showToast}
    />
  );
};
