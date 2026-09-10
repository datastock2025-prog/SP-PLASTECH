import React from 'react';
import {
  InspectionPlan,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
} from '../types';

import { QualityDashboardView } from './quality/QualityDashboardView';
import { InspectionPlansView } from './quality/InspectionPlansView';
import { IncomingInspectionView } from './quality/IncomingInspectionView';
import { SpcMonitorView } from './quality/SpcMonitorView';
import { FinalInspectionView } from './quality/FinalInspectionView';
import { NcrManagementView } from './quality/NcrManagementView';
import { CapaManagementView } from './quality/CapaManagementView';
import { CoaManagementView } from './quality/CoaManagementView';
import { CalibrationEquipmentView } from './quality/CalibrationEquipmentView';
import { DocControlAuditView } from './quality/DocControlAuditView';

interface QualityProps {
  view: string;
  inspectionPlans: InspectionPlan[];
  ncrs: NonConformanceReport[];
  capas: CapaReport[];
  coas: CertificateOfAnalysis[];
  selectedId?: string;
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
  /* ----------------------------------------------------
     1. QUALITY COMMAND CENTER (DASHBOARD)
  ---------------------------------------------------- */
  if (view === 'qualityDash') {
    return (
      <QualityDashboardView
        inspectionPlans={inspectionPlans}
        ncrs={ncrs}
        capas={capas}
        coas={coas}
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
        inspectionPlans={inspectionPlans}
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
        onCreateNCR={onCreateNCR}
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
        ncrs={ncrs}
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
        capas={capas}
        ncrs={ncrs}
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
        coas={coas}
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
      inspectionPlans={inspectionPlans}
      ncrs={ncrs}
      capas={capas}
      coas={coas}
      onNavigate={onNavigate}
      openDrawer={openDrawer}
      closeDrawer={closeDrawer}
      showToast={showToast}
    />
  );
};
