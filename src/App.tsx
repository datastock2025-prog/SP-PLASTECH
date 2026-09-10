import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Drawer } from './components/Drawer';
import { ConfirmModal } from './components/ConfirmModal';
import { HomeView } from './components/HomeView';
import { MasterDataViews } from './components/MasterDataViews';
import { EngineeringViews } from './components/EngineeringViews';
import { ManufacturingViews } from './components/ManufacturingViews';
import { ProcurementViews } from './components/ProcurementViews';
import { WarehouseViews } from './components/WarehouseViews';
import { SalesViews } from './components/SalesViews';
import { FinanceViews } from './components/FinanceViews';
import { QualityViews } from './components/QualityViews';
import { MepViews } from './components/MepViews';
import { HrViews } from './components/HrViews';
import { ScmViews } from './components/scm/ScmViews';
import { CrmViews } from './components/CrmViews';
import { AdminViews } from './components/AdminViews';
import { AngularArchitectureGuide } from './components/AngularArchitectureGuide';
import { LoginScreen } from './components/LoginScreen';
import {
  WorkspaceTasksView,
  WorkspaceApprovalsView,
  WorkspaceNotificationsView,
  WorkspaceSavedViewsView,
  WorkspaceRecentRecordsView,
} from './components/common/WorkspaceHomeTools';

import {
  initialItems,
  initialBoms,
  initialMachines,
  initialWorkOrders,
  initialPurchaseOrders,
  initialSalesOrders,
  initialAccounts,
  initialJournalEntries,
  initialNcrs,
  initialCapas,
  initialCoas,
  initialCustomers,
  initialQuotations,
  initialCostCenters,
  initialSubcontractOrders,
  initialInspectionPlans,
  initialStockTransactions,
  INITIAL_RMAS,
} from './data/initialData';
import { INITIAL_BOMS } from './data/engineeringData';
import { DEMO_USERS } from './data/authUsers';

import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  WorkOrder,
  PurchaseOrder,
  SalesOrder,
  Account,
  JournalEntry,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  Customer,
  Quotation,
  ReturnMerchandise,
  AuthUser,
} from './types';

export const App: React.FC = () => {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('reboot_auth_user') || localStorage.getItem('polymer_auth_user');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name) {
          return parsed;
        }
      }
      return DEMO_USERS[0];
    } catch {
      return DEMO_USERS[0];
    }
  });
  const [lastLoggedOutUser, setLastLoggedOutUser] = useState<AuthUser | null>(null);

  // Current active navigation view
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Primary Business Entities State
  const [items, setItems] = useState<ItemMaster[]>(initialItems);
  const [boms, setBoms] = useState<BomMaster[]>(INITIAL_BOMS);
  const [machines, setMachines] = useState<MachineMaster[]>(initialMachines);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>(initialNcrs);
  const [capas, setCapas] = useState<CapaReport[]>(initialCapas);
  const [coas, setCoas] = useState<CertificateOfAnalysis[]>(initialCoas);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [rmas, setRmas] = useState<ReturnMerchandise[]>(INITIAL_RMAS);

  // Drawer & Modal State
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | null;
    footer?: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    content: null,
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handlePlantChange = (plantId: string, plantName: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, plantId };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('reboot_auth_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('reboot_auth_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = (user: AuthUser, plantId: string, shiftId: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('reboot_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(`Authenticated as ${user.name} (${user.role}) — ${user.plantId}`);
  };

  const handleLogout = () => {
    setLastLoggedOutUser(currentUser);
    setCurrentUser(null);
    try {
      localStorage.removeItem('reboot_auth_user');
      localStorage.removeItem('polymer_auth_user');
    } catch (e) {
      console.error(e);
    }
    showToast('Terminal session locked / Signed out');
  };

  const handleSwitchUser = () => {
    setLastLoggedOutUser(currentUser);
    setCurrentUser(null);
  };

  const handleNavigate = (view: string, param?: any) => {
    setCurrentView(view);
    setViewParams(param || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDrawer = (title: string, content: React.ReactNode, footer?: React.ReactNode) => {
    setDrawerState({ isOpen: true, title, content, footer });
  };

  const closeDrawer = () => {
    setDrawerState((prev) => ({ ...prev, isOpen: false }));
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Breadcrumbs helper
  const getBreadcrumbs = (): string[] => {
    const map: Record<string, string[]> = {
      home: ['Workspace Home'],
      tasks: ['Workspace Home', 'My Tasks & Work Items'],
      approvals: ['Workspace Home', 'My Approvals Hub'],
      notifications: ['Workspace Home', 'Notification Center'],
      savedViews: ['Workspace Home', 'Saved Views & Presets'],
      recentRecords: ['Workspace Home', 'Recent Records Log'],
      angularGuide: ['Workspace', 'Angular 18+ Architecture Guide'],
      itemList: ['Master Data', 'Item Master'],
      itemDetail: ['Master Data', 'Item Master', viewParams.code || 'Detail'],
      bomList: ['BOM & Engineering', 'BOM / Formula Master Grid'],
      bomDetail: ['BOM & Engineering', 'BOM Detail', viewParams.id || 'Detail'],
      engineeringDash: ['BOM & Engineering', 'Engineering Center'],
      bomDash: ['BOM & Engineering', 'Engineering Center'],
      bomBuilder: ['BOM & Engineering', 'BOM Builder Workspace', viewParams.id || 'New'],
      bomTree: ['BOM & Engineering', 'Multi-Level BOM Tree'],
      recipeFormula: ['BOM & Engineering', 'Percentage Formula & Recipe Scaler'],
      ecrList: ['Engineering Changes', 'ECR Requests'],
      ecoList: ['Engineering Changes', 'ECO Orders'],
      bomCompare: ['BOM & Engineering', 'BOM Version Comparison Diff'],
      whereUsed: ['BOM & Engineering', 'Where-Used Traceability'],
      approvalWorkflow: ['BOM & Engineering', 'Multi-Stage Approval Workflow Hub'],
      machineList: ['Master Data', 'Machines & Molds'],
      mfgDash: ['Manufacturing', 'Command Center'],
      machineSchedule: ['Manufacturing', 'Planning Board'],
      woList: ['Manufacturing', 'Work Orders'],
      woDetail: ['Manufacturing', 'Work Orders', viewParams.id || 'Detail'],
      jitBoard: ['Manufacturing', 'JIT Scheduling'],
      prodEntryGrid: ['Manufacturing', 'Production Entry Grid'],
      shopFloor: ['Manufacturing', 'Shop Floor Console'],
      changeover: ['Manufacturing', 'Changeover (SMED)'],
      scrapDowntime: ['Manufacturing', 'Scrap & Downtime'],
      oeeDash: ['Manufacturing', 'OEE Analytics'],
      genealogy: ['Manufacturing', 'Genealogy & EBR'],
      invDash: ['Stock & Warehouse', 'Inventory Dashboard'],
      stockList: ['Stock & Warehouse', 'Stock Overview'],
      binMap: ['Stock & Warehouse', '2D Bin Location Map'],
      putaway: ['Stock & Warehouse', 'Putaway Management'],
      picking: ['Stock & Warehouse', 'Pick & Pack Fulfillment'],
      cycleCount: ['Stock & Warehouse', 'Cycle Count Audits'],
      quarantine: ['Stock & Warehouse', 'Quarantine & Quality Hold'],
      regrindScrap: ['Stock & Warehouse', 'Closed-Loop Regrind Recycling'],
      subcontractList: ['Stock & Warehouse', 'Subcontracting (Job-Work)'],
      subcontractDetail: ['Stock & Warehouse', 'Subcontracting', viewParams.id || 'Detail'],
      scanner: ['Stock & Warehouse', 'Handheld RF Barcode Scanner'],
      labelPrint: ['Stock & Warehouse', 'Zebra Thermal Label Generator'],
      procurementDash: ['Procurement & Sourcing', 'Procurement Command Center'],
      procurementHub: ['Procurement & Sourcing', 'Procurement Command Center'],
      procurement: ['Procurement & Sourcing', 'Procurement Command Center'],
      procDashboard: ['Procurement & Sourcing', 'Procurement Command Center'],
      supplierList: ['Procurement & Sourcing', 'Supplier Directory'],
      suppliers: ['Procurement & Sourcing', 'Supplier Directory'],
      supplierDetail: ['Procurement & Sourcing', 'Supplier Directory', viewParams.id || 'Detail'],
      supplierScorecard: ['Procurement & Sourcing', 'Supplier 360 Scorecard'],
      supplierScorecards: ['Procurement & Sourcing', 'Supplier 360 Scorecard'],
      supplierRisk: ['Procurement & Sourcing', 'Vendor Risk & Compliance Matrix'],
      supplierRiskCompliance: ['Procurement & Sourcing', 'Vendor Risk & Compliance Matrix'],
      procRiskCompliance: ['Procurement & Sourcing', 'Vendor Risk & Compliance Matrix'],
      supplierContracts: ['Procurement & Sourcing', 'Vendor Contracts & Blanket POs'],
      contracts: ['Procurement & Sourcing', 'Vendor Contracts & Blanket POs'],
      supplierPriceList: ['Procurement & Sourcing', 'Vendor Price Schedules (Platts/ICIS)'],
      supplierPriceLists: ['Procurement & Sourcing', 'Vendor Price Schedules (Platts/ICIS)'],
      purchaseReqList: ['Procurement & Sourcing', 'Purchase Requisitions (PR)'],
      prList: ['Procurement & Sourcing', 'Purchase Requisitions (PR)'],
      purchaseReqForm: ['Procurement & Sourcing', 'Create Purchase Requisition'],
      prDetail: ['Procurement & Sourcing', 'Purchase Requisition Details', viewParams.id || 'Detail'],
      prCreate: ['Procurement & Sourcing', 'Create Purchase Requisition'],
      rfqList: ['Procurement & Sourcing', 'Requests for Quotation (RFQ)'],
      rfqs: ['Procurement & Sourcing', 'Requests for Quotation (RFQ)'],
      rfqCompare: ['Procurement & Sourcing', 'RFQ Bid Comparison Matrix'],
      rfqComparison: ['Procurement & Sourcing', 'RFQ Bid Comparison Matrix'],
      poList: ['Procurement & Sourcing', 'Purchase Orders (PO)'],
      pos: ['Procurement & Sourcing', 'Purchase Orders (PO)'],
      poDetail: ['Procurement & Sourcing', 'Purchase Orders', viewParams.id || 'Detail'],
      poPrint: ['Procurement & Sourcing', 'Purchase Order Print View'],
      poApprovals: ['Procurement & Sourcing', 'Multi-Tier PO Approval Hub'],
      procApprovals: ['Procurement & Sourcing', 'Multi-Tier PO Approval Hub'],
      procApprovalQueue: ['Procurement & Sourcing', 'Multi-Tier PO Approval Hub'],
      grnList: ['Procurement & Sourcing', 'Goods Receipt Notes (GRN)'],
      grns: ['Procurement & Sourcing', 'Goods Receipt Notes (GRN)'],
      supplierInvoices: ['Procurement & Sourcing', '3-Way Match Supplier Invoices'],
      invoiceMatching: ['Procurement & Sourcing', '3-Way Match Supplier Invoices'],
      supplierInvoiceList: ['Procurement & Sourcing', '3-Way Match Supplier Invoices'],
      purchaseReturns: ['Procurement & Sourcing', 'Vendor Debit Notes & Returns'],
      debitNotes: ['Procurement & Sourcing', 'Vendor Debit Notes & Returns'],
      procurementMrp: ['Procurement & Sourcing', 'MRP Material Requirements Planning'],
      procMrp: ['Procurement & Sourcing', 'MRP Material Requirements Planning'],
      mrpSuggestions: ['Procurement & Sourcing', 'MRP Material Requirements Planning'],
      procurementReports: ['Procurement & Sourcing', 'Procurement Analytics & Spend Reports'],
      procReports: ['Procurement & Sourcing', 'Procurement Analytics & Spend Reports'],
      procurementSettings: ['Procurement & Sourcing', 'Procurement Global Policy Settings'],
      procSettings: ['Procurement & Sourcing', 'Procurement Global Policy Settings'],
      salesDash: ['Sales & Customers', 'Sales Command Center'],
      quoteList: ['Sales & Customers', 'Quotations'],
      quoteDetail: ['Sales & Customers', 'Quotations', viewParams.id || 'Detail'],
      soList: ['Sales & Customers', 'Sales Orders'],
      soDetail: ['Sales & Customers', 'Sales Orders', viewParams.id || 'Detail'],
      soConfirm: ['Sales & Customers', 'Sales Orders', 'Order Confirmation Document'],
      deliverySchedule: ['Sales & Customers', 'Delivery Schedule & Dispatches'],
      rmaList: ['Sales & Customers', 'Customer Returns (RMA)'],
      creditControl: ['Sales & Customers', 'Customer Credit Control & Exposure'],
      billingStatus: ['Sales & Customers', 'Sales Billing & Invoicing Status'],
      orderTracking: ['Sales & Customers', '13-Stage Order Milestone Tracking'],
      backorderMgmt: ['Sales & Customers', 'Backorders & Demand Planning'],
      salesForecast: ['Sales & Customers', '12-Month Sales Forecast vs Actual'],
      pricingMgmt: ['Sales & Customers', 'Pricing Matrix & Customer Rebates'],
      contractList: ['Sales & Customers', 'Sales Contracts & Blanket Orders'],
      contractDetail: ['Sales & Customers', 'Sales Contracts', viewParams.id || 'Detail'],
      customerList: ['Sales & Customers', 'Customer Master Directory'],
      customerDetail: ['Sales & Customers', 'Customer 360° Profile', viewParams.id || 'Detail'],
      financeDash: ['Finance & Accounting', 'Finance Command Center'],
      coaList: ['Finance & Accounting', 'Chart of Accounts'],
      jeList: ['Finance & Accounting', 'General Ledger Journal Entries'],
      jeDetail: ['Finance & Accounting', 'Journal Entry Voucher', viewParams.id || 'Detail'],
      apDash: ['Finance & Accounting', 'Accounts Payable & 3-Way Match'],
      apMatch: ['Finance & Accounting', 'AP 3-Way GRN Match Inspector'],
      paymentRun: ['Finance & Accounting', 'AP Batch Payment Run'],
      arDash: ['Finance & Accounting', 'Accounts Receivable & Collections'],
      arCollections: ['Finance & Accounting', 'AR Customer Aging & Dunning'],
      invoiceList: ['Finance & Accounting', 'Customer Tax Invoices & Credit Notes'],
      invoiceDetail: ['Finance & Accounting', 'Customer Tax Invoice', viewParams.id || 'Detail'],
      costCenterList: ['Finance & Accounting', 'Cost Centers & Overhead Absorption'],
      costCenterDetail: ['Finance & Accounting', 'Cost Center Controlling', viewParams.id || 'Detail'],
      productCosting: ['Finance & Accounting', 'Product Costing & BOM Rollup'],
      varianceAnalysis: ['Finance & Accounting', 'Production Variance Analysis'],
      periodClose: ['Finance & Accounting', 'Accounting Period Close & Audit'],
      assetList: ['Finance & Accounting', 'Fixed Asset Register & Depreciation'],
      assetDetail: ['Finance & Accounting', 'Fixed Asset Master', viewParams.id || 'Detail'],
      qualityDash: ['Quality Management', 'Quality Command Center'],
      inspectionPlanList: ['Quality Management', 'Inspection Plans & AQL Protocols'],
      inspectionPlanDetail: ['Quality Management', 'Inspection Plan', viewParams.id || 'Detail'],
      incomingInspection: ['Quality Management', 'Incoming Material Inspection (IQC)'],
      spcMonitor: ['Quality Management', 'In-Process SPC Control Charts'],
      finalInspection: ['Quality Management', 'Final Product Release (FQC)'],
      ncrList: ['Quality Management', 'Non-Conformance Reports (NCR)'],
      ncrDetail: ['Quality Management', 'NCR Management', viewParams.id || 'Detail'],
      capaList: ['Quality Management', '8D CAPA Corrective Actions'],
      capaDetail: ['Quality Management', '8D CAPA Report', viewParams.id || 'Detail'],
      qcoaList: ['Quality Management', 'Certificates of Analysis (COA)'],
      qcoaDetail: ['Quality Management', 'Certificate of Analysis', viewParams.id || 'Detail'],
      calibrationList: ['Quality Management', 'Gauge & Equipment Calibration (MSA)'],
      docControlList: ['Quality Management', 'ISO 9001 Document Control & Audits'],
      mepDash: ['MEP & Plant Utilities', 'MEP Operations Command Center'],
      mepMechanical: ['MEP & Plant Utilities', 'Mechanical Systems, Chillers & Compressors'],
      mepElectrical: ['MEP & Plant Utilities', 'Electrical Substation & Energy Management'],
      mepPlumbing: ['MEP & Plant Utilities', 'Plumbing, RO Water & Effluent Treatment (ETP)'],
      mepHvac: ['MEP & Plant Utilities', 'HVAC, Cleanroom ISO 14644 & Scrubbers'],
      mepWorkOrders: ['MEP & Plant Utilities', 'Plant Maintenance & PM Work Orders'],
      hrCommandCenter: ['Human Resources & HRMS', 'HR Command Center'],
      hrOrgStructure: ['Human Resources & HRMS', 'Organization Structure & Grades'],
      hrEmployeeList: ['Human Resources & HRMS', 'Employee Master Directory (360°)'],
      hrEmployeeDetail: ['Human Resources & HRMS', 'Employee 360° Profile', viewParams.employeeId || 'EMP-1001'],
      hrOnboarding: ['Human Resources & HRMS', 'Onboarding & Lifecycle Transitions'],
      hrAttendance: ['Human Resources & HRMS', 'Biometric Attendance & Punches'],
      hrShiftRoster: ['Human Resources & HRMS', 'Shift Roster & Line Staffing'],
      hrLeaveOvertime: ['Human Resources & HRMS', 'Leave Approvals & Overtime (OT)'],
      hrSkillsTraining: ['Human Resources & HRMS', 'Skill Competency Matrix & Training'],
      hrSafetyPpe: ['Human Resources & HRMS', 'EHS Safety Incidents & PPE Registry'],
      hrPayroll: ['Human Resources & HRMS', 'Payroll Computation & Disbursal'],
      hrCompliance: ['Human Resources & HRMS', 'Labor Law & CLRA Compliance Registers'],
      hrReports: ['Human Resources & HRMS', 'Workforce Analytics & MIS Reports'],
      scmControlTower: ['Supply Chain Management', 'Control Tower & Flow Map'],
      scmDemandPlanning: ['Supply Chain Management', 'Demand Planning & Consensus'],
      scmSalesForecast: ['Supply Chain Management', 'Sales Forecast Management'],
      scmSOP: ['Supply Chain Management', 'S&OP Alignment & Bottlenecks'],
      scmInventoryPlanning: ['Supply Chain Management', 'Plastic Inventory & Days of Cover'],
      scmMRP: ['Supply Chain Management', 'MRP Material Requirements Planning'],
      scmReplenishment: ['Supply Chain Management', 'Replenishment & Kanban Floor Stock'],
      scmSupplierCollaboration: ['Supply Chain Management', 'Supplier Portal & Advance Shipping Notices'],
      scmInboundLogistics: ['Supply Chain Management', 'Inbound Freight & Customs Clearance'],
      scmOutboundLogistics: ['Supply Chain Management', 'Outbound Deliveries & Electronic POD'],
      scmFreight: ['Supply Chain Management', 'Freight & Transport Management (TMS)'],
      scmTrackTrace: ['Supply Chain Management', '360° End-to-End Traceability'],
      scmSupplierRisk: ['Supply Chain Management', 'Supplier Risk & Dual-Sourcing'],
      scmInventoryAging: ['Supply Chain Management', 'Inventory Aging & FEFO Shelf-Life'],
      scmOrderTimeline: ['Supply Chain Management', '16-Stage Order-to-Delivery Pipeline'],
      scmExceptions: ['Supply Chain Management', 'Exceptions & CAPA Incident Resolution'],
      scmSustainability: ['Supply Chain Management', 'Circular Economy & ESG Metrics'],
      scmReports: ['Supply Chain Management', 'SCM Intelligence & Reports'],
      scmSettings: ['Supply Chain Management', 'Planning Policies & Parameters'],
      scmRbac: ['Supply Chain Management', 'SCM Role-Based Access Control (RBAC)'],
      crmDashboard: ['CRM & Client 360', 'CRM Command Center'],
      crmLeadList: ['CRM & Client 360', 'Leads & Qualification Pipeline'],
      crmLeadDetail: ['CRM & Client 360', 'Lead Detail & Qualification', viewParams.leadId || 'Detail'],
      crmOpportunityPipeline: ['CRM & Client 360', 'Opportunity Pipeline & Deals'],
      crmOpportunityDetail: ['CRM & Client 360', 'Opportunity Proposal', viewParams.oppId || 'Detail'],
      crmAccountList: ['CRM & Client 360', 'Accounts & Converters Directory'],
      crmCustomer360: ['CRM & Client 360', 'Customer 360° Profile', viewParams.accountId || 'ACC-1001'],
      crmContactList: ['CRM & Client 360', 'Key Stakeholders & Contacts'],
      crmActivityManagement: ['CRM & Client 360', 'Sales Cadence & Activities'],
      crmInquiryCosting: ['CRM & Client 360', 'Polymer Inquiry & Costing Modeler'],
      crmQuotationManagement: ['CRM & Client 360', 'Quotation Proposals & Pricing Desk'],
      crmSampleRequest: ['CRM & Client 360', 'Sample Requests & Mold Trials'],
      crmComplaintManagement: ['CRM & Client 360', 'Customer Quality & 8D CAPA Incident Tracker'],
      crmDocumentCenter: ['CRM & Client 360', 'Document Center & Regulatory Vault'],
      crmCustomerSegmentation: ['CRM & Client 360', 'Customer Segmentation & Strategic Tiers'],
      crmAnalyticsReports: ['CRM & Client 360', 'CRM Revenue & Velocity Analytics'],
      adminDashboard: ['Admin & System Settings', 'Operations & System Health'],
      adminUsers: ['Admin & System Settings', 'User Directory & Plant Access'],
      adminRoles: ['Admin & System Settings', 'RBAC Permission Matrix & Role Simulator Sandbox'],
      adminMultiContextSecurity: ['Admin & System Settings', 'RBAC Security & Multi-Context Scope Governance'],
      adminMultiContextRbac: ['Admin & System Settings', 'RBAC Security & Multi-Context Scope Governance'],
      adminRbacSecurity: ['Admin & System Settings', 'RBAC Security & Multi-Context Scope Governance'],
      adminPlants: ['Admin & System Settings', 'Company Profile & Multi-Plant Facilities'],
      adminNumbering: ['Admin & System Settings', 'Document Numbering & Prefix Sequences'],
      adminWorkflows: ['Admin & System Settings', 'Approval Workflow & Escalation Engine'],
      adminSecurity: ['Admin & System Settings', 'Security, MFA & Account Lockout Policies'],
      adminAuditLogs: ['Admin & System Settings', 'Immutable System Audit Logs & Forensics'],
      adminIntegrations: ['Admin & System Settings', 'Hardware Interfaces & External Connectors'],
      adminBackups: ['Admin & System Settings', 'Database Snapshots & Disaster Recovery'],
      adminNotifications: ['Admin & System Settings', 'Notification Templates & Event Routing'],
      adminCustomFields: ['Admin & System Settings', 'Global System Parameters & User Defined Fields'],
      adminSystemParameters: ['Admin & System Settings', 'Global System Parameters & User Defined Fields'],
    };
    return map[currentView] || ['Reboot ERP', currentView];
  };

  // Group membership checks
  const isEngineering = [
    'engineeringDash',
    'bomDash',
    'bomList',
    'bomDetail',
    'bomBuilder',
    'bomTree',
    'recipeFormula',
    'ecrList',
    'ecoList',
    'bomCompare',
    'whereUsed',
    'approvalWorkflow',
    'bomImport',
  ].includes(currentView);
  const isMasterData = ['itemList', 'itemDetail', 'machineList'].includes(currentView);
  const isManufacturing = [
    'mfgDash',
    'machineSchedule',
    'woList',
    'woDetail',
    'jitBoard',
    'prodEntryGrid',
    'shopFloor',
    'changeover',
    'scrapDowntime',
    'oeeDash',
    'genealogy',
    'reportsHub',
    'mfgSettings',
    'operatorHistory',
    'materialIssuing',
    'moldTooling',
  ].includes(currentView);
  const isProcurement = [
    'procurementDash',
    'procurementHub',
    'procurement',
    'procDashboard',
    'supplierList',
    'suppliers',
    'supplierMaster',
    'supplierDetail',
    'supplierView',
    'supplierScorecard',
    'supplierScorecards',
    'supplierRisk',
    'supplierRiskCompliance',
    'procRiskCompliance',
    'supplierContracts',
    'contracts',
    'supplierPriceList',
    'supplierPriceLists',
    'priceLists',
    'purchaseReqList',
    'prList',
    'purchaseReqForm',
    'prDetail',
    'prCreate',
    'newPR',
    'rfqList',
    'rfqs',
    'rfqCompare',
    'rfqComparison',
    'poList',
    'pos',
    'poDetail',
    'poPrint',
    'poApprovals',
    'procApprovals',
    'procApprovalQueue',
    'grnList',
    'grns',
    'supplierInvoices',
    'invoiceMatching',
    'supplierInvoiceList',
    'purchaseReturns',
    'debitNotes',
    'procurementMrp',
    'procMrp',
    'mrpSuggestions',
    'procurementReports',
    'procReports',
    'procurementSettings',
    'procSettings',
  ].includes(currentView);
  const isWarehouse = [
    'invDash',
    'stockList',
    'subcontractList',
    'subcontractDetail',
    'putaway',
    'picking',
    'cycleCount',
    'quarantine',
    'regrindScrap',
    'binMap',
    'labelPrint',
    'scanner',
  ].includes(currentView);
  const isSales = [
    'salesDash',
    'sales',
    'quoteList',
    'quotations',
    'quoteDetail',
    'newQuote',
    'soList',
    'salesOrders',
    'soDetail',
    'soConfirm',
    'soPrint',
    'deliverySchedule',
    'salesDeliveries',
    'rmaList',
    'rmaDetail',
    'returnsRMA',
    'salesRMA',
    'creditControl',
    'creditExposure',
    'billingStatus',
    'salesBilling',
    'orderTracking',
    'salesTracking',
    'backorderMgmt',
    'backordersForecast',
    'salesBackorders',
    'contractList',
    'contractDetail',
    'contracts',
    'salesContracts',
    'pricingMgmt',
    'pricingMatrix',
    'rebates',
    'salesForecast',
    'forecast',
    'customerList',
    'customers',
    'customerDetail',
    'customer360',
  ].includes(currentView);
  const isFinance = [
    'financeDash',
    'coaList',
    'jeList',
    'jeDetail',
    'jeCreate',
    'apDash',
    'apMatch',
    'paymentRun',
    'arDash',
    'arCollections',
    'invoiceList',
    'invoiceDetail',
    'costCenterList',
    'costCenterDetail',
    'productCosting',
    'varianceAnalysis',
    'periodClose',
    'assetList',
    'assetDetail',
  ].includes(currentView);
  const isQuality = [
    'qualityDash',
    'inspectionPlanList',
    'incomingInspection',
    'spcMonitor',
    'finalInspection',
    'ncrList',
    'ncrDetail',
    'capaList',
    'capaDetail',
    'qcoaList',
    'supplierScorecard',
    'calibrationList',
    'docControlList',
  ].includes(currentView);
  const isMep = [
    'mepDash',
    'mepMechanical',
    'mepElectrical',
    'mepPlumbing',
    'mepHvac',
    'mepWorkOrders',
  ].includes(currentView);
  const isHr = [
    'hrCommandCenter',
    'hrOrgStructure',
    'hrEmployeeList',
    'hrEmployeeDetail',
    'hrOnboarding',
    'hrAttendance',
    'hrShiftRoster',
    'hrLeaveOvertime',
    'hrSkillsTraining',
    'hrSafetyPpe',
    'hrPayroll',
    'hrCompliance',
    'hrReports',
  ].includes(currentView) || currentView.startsWith('hr');
  const isScm = currentView.startsWith('scm') || [
    'scmControlTower',
    'scmDemandPlanning',
    'scmSalesForecast',
    'scmSOP',
    'scmInventoryPlanning',
    'scmMRP',
    'scmReplenishment',
    'scmSupplierCollaboration',
    'scmInboundLogistics',
    'scmOutboundLogistics',
    'scmFreight',
    'scmTrackTrace',
    'scmSupplierRisk',
    'scmInventoryAging',
    'scmOrderTimeline',
    'scmExceptions',
    'scmSustainability',
    'scmReports',
    'scmSettings',
    'scmRbac',
  ].includes(currentView);
  const isCrm = currentView.startsWith('crm');
  const isAdmin = currentView.startsWith('admin');

  const activeWOCount = workOrders.filter((w) => !['completed', 'cancelled'].includes(w.status)).length;
  const lowStockCount = items.filter((i) => i.status === 'low').length;
  const openPOCount = purchaseOrders.filter((p) => p.status !== 'received').length;

  if (!currentUser) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} lastLoggedOutUser={lastLoggedOutUser} />
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#14213D] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-white/10 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-[#0F8B8D]" />
            <span>{toastMsg}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F6F4EF] text-[#1C1F26] font-['Plus_Jakarta_Sans']">
      {/* Topbar: Fixed at top, full width */}
      <Topbar
        breadcrumbs={getBreadcrumbs()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onNavigate={handleNavigate}
        openAngularGuide={() => handleNavigate('angularGuide')}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
          } else {
            setIsSidebarCollapsed((prev) => !prev);
          }
        }}
        onPlantChange={handlePlantChange}
        onRoleChange={handleRoleChange}
        showToast={showToast}
      />

      {/* Workspace Body: Sidebar on left + Content on right */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          openAngularGuide={() => handleNavigate('angularGuide')}
          currentUser={currentUser}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          activeWOCount={activeWOCount}
          lowStockCount={lowStockCount}
          openPOCount={openPOCount}
          showToast={showToast}
        />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 min-w-0 transition-all">
          {currentView === 'home' && (
            <HomeView
              onNavigate={handleNavigate}
              openAngularGuide={() => handleNavigate('angularGuide')}
              activeWOCount={activeWOCount}
              lowStockCount={lowStockCount}
              openPOCount={openPOCount}
            />
          )}

          {currentView === 'tasks' && (
            <WorkspaceTasksView onNavigate={handleNavigate} showToast={showToast} />
          )}

          {currentView === 'approvals' && (
            <WorkspaceApprovalsView onNavigate={handleNavigate} showToast={showToast} />
          )}

          {currentView === 'notifications' && (
            <WorkspaceNotificationsView onNavigate={handleNavigate} showToast={showToast} />
          )}

          {currentView === 'savedViews' && (
            <WorkspaceSavedViewsView onNavigate={handleNavigate} showToast={showToast} />
          )}

          {currentView === 'recentRecords' && (
            <WorkspaceRecentRecordsView onNavigate={handleNavigate} showToast={showToast} />
          )}

          {currentView === 'angularGuide' && (
            <AngularArchitectureGuide />
          )}

          {isEngineering && (
            <EngineeringViews
              view={currentView}
              items={items}
              boms={boms}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateBom={(updated) => {
                setBoms((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
              }}
              onDeleteBom={(id) => {
                setBoms((prev) => prev.filter((b) => b.id !== id));
              }}
              onCreateBom={(newBom) => {
                setBoms((prev) => [newBom, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isMasterData && (
            <MasterDataViews
              view={currentView}
              items={items}
              boms={boms}
              machines={machines}
              selectedCode={viewParams.code}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateItem={(updated) => {
                setItems((prev) => prev.map((i) => (i.code === updated.code ? updated : i)));
              }}
              onDeleteItem={(code) => {
                setItems((prev) => prev.filter((i) => i.code !== code));
              }}
              onCreateItem={(newItem) => {
                setItems((prev) => [newItem, ...prev]);
              }}
              onUpdateBom={(updated) => {
                setBoms((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
              }}
              onDeleteBom={(id) => {
                setBoms((prev) => prev.filter((b) => b.id !== id));
              }}
              onCreateBom={(newBom) => {
                setBoms((prev) => [newBom, ...prev]);
              }}
              onUpdateMachine={(updated) => {
                setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
              }}
              onDeleteMachine={(id) => {
                setMachines((prev) => prev.filter((m) => m.id !== id));
              }}
              onCreateMachine={(newM) => {
                setMachines((prev) => [newM, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isManufacturing && (
            <ManufacturingViews
              view={currentView}
              workOrders={workOrders}
              items={items}
              machines={machines}
              boms={boms}
              stockTxns={initialStockTransactions}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateWO={(updated) => {
                setWorkOrders((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
              }}
              onCreateWO={(newWO) => {
                setWorkOrders((prev) => [newWO, ...prev]);
              }}
              onDeleteWO={(id) => {
                setWorkOrders((prev) => prev.filter((w) => w.id !== id));
              }}
              onIssueMaterial={(woId, itemCode, qty) => {
                showToast(`Issued ${qty} KG of ${itemCode} to ${woId}`);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isProcurement && (
            <ProcurementViews
              view={currentView}
              viewParams={viewParams}
              onNavigate={handleNavigate}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isWarehouse && (
            <WarehouseViews
              view={currentView}
              items={items}
              pos={purchaseOrders}
              subcontracts={initialSubcontractOrders}
              stockTxns={initialStockTransactions}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateItem={(updated) => {
                setItems((prev) => prev.map((i) => (i.code === updated.code ? updated : i)));
              }}
              onUpdatePO={(updated) => {
                setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              }}
              onCreatePO={(newPO) => {
                setPurchaseOrders((prev) => [newPO, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isSales && (
            <SalesViews
              view={currentView}
              sos={salesOrders}
              quotes={quotations}
              customers={customers}
              rmas={rmas}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateSO={(updated) => {
                setSalesOrders((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              }}
              onCreateSO={(newSO) => {
                setSalesOrders((prev) => [newSO, ...prev]);
              }}
              onUpdateQuote={(updated) => {
                setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
              }}
              onCreateQuote={(newQ) => {
                setQuotations((prev) => [newQ, ...prev]);
              }}
              onUpdateRMA={(updated) => {
                setRmas((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              }}
              onCreateRMA={(newRMA) => {
                setRmas((prev) => [newRMA, ...prev]);
              }}
              onUpdateCustomer={(updated) => {
                setCustomers((prev) => prev.map((c) => (c.code === updated.code ? updated : c)));
              }}
              onCreateCustomer={(newCust) => {
                setCustomers((prev) => [newCust, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isFinance && (
            <FinanceViews
              view={currentView}
              accounts={accounts}
              journalEntries={journalEntries}
              costCenters={initialCostCenters}
              invoices={[]}
              customers={customers}
              purchaseOrders={purchaseOrders}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateAccount={(updated) => {
                setAccounts((prev) => prev.map((a) => (a.code === updated.code ? updated : a)));
              }}
              onCreateAccount={(newAcc) => {
                setAccounts((prev) => [...prev, newAcc]);
              }}
              onCreateJE={(newJE) => {
                setJournalEntries((prev) => [newJE, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isQuality && (
            <QualityViews
              view={currentView}
              inspectionPlans={initialInspectionPlans}
              ncrs={ncrs}
              capas={capas}
              coas={coas}
              selectedId={viewParams.id}
              onNavigate={handleNavigate}
              onUpdateNCR={(updated) => {
                setNcrs((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
              }}
              onCreateNCR={(newNCR) => {
                setNcrs((prev) => [newNCR, ...prev]);
              }}
              onUpdateCAPA={(updated) => {
                setCapas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              }}
              onCreateCAPA={(newCAPA) => {
                setCapas((prev) => [newCAPA, ...prev]);
              }}
              onUpdateCOA={(updated) => {
                setCoas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              }}
              onCreateCOA={(newCOA) => {
                setCoas((prev) => [newCOA, ...prev]);
              }}
              openDrawer={openDrawer}
              closeDrawer={closeDrawer}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {isMep && (
            <MepViews
              currentView={currentView}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}

          {isHr && (
            <HrViews
              currentView={currentView}
              viewParams={viewParams}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}

          {isScm && (
            <ScmViews
              activeSubView={currentView}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}

          {isCrm && (
            <CrmViews
              currentView={currentView}
              viewParams={viewParams}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}

          {isAdmin && (
            <AdminViews
              currentView={currentView}
              viewParams={viewParams}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Slide-Over Drawer */}
      <Drawer
        isOpen={drawerState.isOpen}
        title={drawerState.title}
        onClose={closeDrawer}
        footer={drawerState.footer}
      >
        {drawerState.content}
      </Drawer>

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onClose={closeConfirm}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14213D] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-white/10 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-[#0F8B8D]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
export default App;
