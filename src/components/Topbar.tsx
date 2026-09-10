import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Code,
  LogOut,
  Building2,
  Clock,
  ChevronDown,
  Shield,
  RefreshCw,
  Users,
  Grid,
  Zap,
  CheckSquare,
  AlertTriangle,
  Globe,
  Sun,
  Moon,
  Contrast,
  Sliders,
  Menu,
  X,
  PlayCircle,
  Pin,
  PinOff,
  CheckCircle2,
  FileText,
  AlertOctagon,
  Wrench,
  Package,
  Layers,
  Sparkles,
  LifeBuoy,
  Keyboard,
  FileCheck,
  Activity,
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Upload,
  Lock,
  Smartphone,
  Eye,
  Laptop,
  Check,
  User,
} from 'lucide-react';
import { AuthUser } from '../types';
import { INITIAL_QUICK_ACTIONS, QuickActionItem } from '../data/quickActionsData';
import { GlobalCommandPalette } from './common/GlobalCommandPalette';
import { QuickActionModal } from './common/QuickActionModal';

export interface PlantEntity {
  id: string;
  code: string;
  name: string;
  location: string;
  type: 'Plant' | 'Warehouse' | 'Branch' | 'Corporate office';
  userRole: string;
  isDefault?: boolean;
}

export const ENTERPRISE_ENTITIES: PlantEntity[] = [
  { id: 'PLANT-01', code: 'PLANT-01', name: 'Plant 01: Injection Molding Unit', location: 'Hosur, Tamil Nadu', type: 'Plant', userRole: 'Plant Operations Director', isDefault: true },
  { id: 'PLANT-02', code: 'PLANT-02', name: 'Plant 02: Extrusion & Pipe Unit', location: 'Manesar, Haryana', type: 'Plant', userRole: 'Area Operations Lead' },
  { id: 'PLANT-03', code: 'PLANT-03', name: 'Plant 03: Blow Molding Unit', location: 'Pune, Maharashtra', type: 'Plant', userRole: 'Regional Auditor' },
  { id: 'PLANT-04', code: 'PLANT-04', name: 'Plant 04: Compounding & Masterbatch Unit', location: 'Vapi, Gujarat', type: 'Plant', userRole: 'Visitor' },
  { id: 'WH-01', code: 'WH-01', name: 'WH 01: Raw Material Silo & Resin Warehouse', location: 'Hosur, Tamil Nadu', type: 'Warehouse', userRole: 'Inventory Controller' },
  { id: 'WH-02', code: 'WH-02', name: 'WH 02: Finished Goods & Logistics Hub', location: 'Chennai, Tamil Nadu', type: 'Warehouse', userRole: 'Dispatch Auditor' },
  { id: 'CORP-HQ', code: 'CORP-HQ', name: 'Corporate Headquarters & Shared Services', location: 'Bengaluru, Karnataka', type: 'Corporate office', userRole: 'Executive Admin' },
];

export const SYSTEM_ROLES = [
  { id: 'admin', name: 'Admin', desc: 'Full System Master Configuration & RBAC', scope: 'Enterprise-wide' },
  { id: 'plant_manager', name: 'Plant Manager', desc: 'OEE, Production Schedules & Floor Overrides', scope: 'Plant Scoped' },
  { id: 'planner', name: 'Production Planner', desc: 'MRP Runs, JIT Scheduling & Job Cards', scope: 'Plant Scoped' },
  { id: 'operator', name: 'Machine Operator', desc: 'Shop Floor Press Execution & Downtime Logging', scope: 'Press / Work Center' },
  { id: 'warehouse', name: 'Warehouse Staff', desc: 'Inward GRN, Silo Bins & Material Transfers', scope: 'Warehouse Scoped' },
  { id: 'quality', name: 'Quality Inspector', desc: 'CMM Scans, Lab Inspections & NCR Dispositions', scope: 'Plant Lab' },
  { id: 'maintenance', name: 'Maintenance Engineer', desc: 'Mold Preventive Maintenance & Spares', scope: 'Tool Room & Presses' },
  { id: 'finance', name: 'Finance Manager', desc: 'Cost Rollup, AR/AP, Invoices & GST Returns', scope: 'Company-wide' },
  { id: 'hr', name: 'HR Manager', desc: 'Shift Rotations, Overtime & Biometric Attendance', scope: 'Plant Scoped' },
  { id: 'sales', name: 'Sales Manager', desc: 'OEM Purchase Orders, Quotes & Customer Portals', scope: 'Regional' },
  { id: 'procurement', name: 'Procurement Officer', desc: 'Polymer Resins, Additives & RFQ Comparisons', scope: 'Supply Chain' },
  { id: 'scm', name: 'Supply Chain Manager', desc: 'Control Tower, Inbound Freight & Stockout Alarms', scope: 'Enterprise' },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'TR', name: 'Turkish (Türkçe)', flag: '🇹🇷' },
  { code: 'ES', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'FR', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'DE', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'AR', name: 'Arabic (العربية)', flag: '🇦🇪' },
  { code: 'ZH', name: 'Chinese (中文)', flag: '🇨🇳' },
  { code: 'VI', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
];

interface TopbarProps {
  breadcrumbs: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  openAngularGuide: () => void;
  currentView?: string;
  onNavigate?: (view: string, param?: any) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchUser?: () => void;
  onToggleSidebar?: () => void;
  onPlantChange?: (plantId: string, plantName: string) => void;
  onRoleChange?: (roleName: string) => void;
  showToast?: (msg: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  openAngularGuide,
  currentView = 'home',
  onNavigate,
  currentUser,
  onLogout,
  onSwitchUser,
  onToggleSidebar,
  onPlantChange,
  onRoleChange,
  showToast = (_msg: string) => {},
}) => {
  // Dropdown States
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [showQuickActionsDropdown, setShowQuickActionsDropdown] = useState(false);
  const [showTasksDropdown, setShowTasksDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcherModal, setShowRoleSwitcherModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportTicketModal, setShowSupportTicketModal] = useState(false);
  const [showSystemStatusModal, setShowSystemStatusModal] = useState(false);

  // Command Palette & Quick Action Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<QuickActionItem | null>(null);

  // Topbar Settings State
  const [activePlantId, setActivePlantId] = useState<string>(currentUser?.plantId || 'PLANT-01');
  const [plantSearchTerm, setPlantSearchTerm] = useState('');
  const [currentLang, setCurrentLang] = useState('EN');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'system' | 'high_contrast'>('light');
  const [pinnedActionIds, setPinnedActionIds] = useState<string[]>(['QA-001', 'QA-002', 'QA-004', 'QA-007', 'QA-008']);
  const [recentActionIds, setRecentActionIds] = useState<string[]>(['QA-001', 'QA-002', 'QA-004']);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'all' | 'approvals' | 'alerts' | 'tasks' | 'system'>('all');
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  // Close dropdowns on click outside
  const topbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target as Node)) {
        setShowPlantDropdown(false);
        setShowQuickActionsDropdown(false);
        setShowTasksDropdown(false);
        setShowNotificationsDropdown(false);
        setShowHelpDropdown(false);
        setShowLanguageDropdown(false);
        setShowThemeDropdown(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+Q, Ctrl+Shift+N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setShowQuickActionsDropdown((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        // Contextual quick create
        if (currentView.startsWith('mfg') || currentView === 'woList') {
          handleExecuteQuickActionById('QA-001');
        } else if (currentView.startsWith('quality') || currentView.startsWith('ncr')) {
          handleExecuteQuickActionById('QA-004');
        } else if (currentView.startsWith('po') || currentView.startsWith('pr')) {
          handleExecuteQuickActionById('QA-007');
        } else {
          handleExecuteQuickActionById('QA-001');
        }
      } else if (e.key === 'Escape') {
        setShowPlantDropdown(false);
        setShowQuickActionsDropdown(false);
        setShowTasksDropdown(false);
        setShowNotificationsDropdown(false);
        setShowHelpDropdown(false);
        setShowLanguageDropdown(false);
        setShowThemeDropdown(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  // Current entity details
  const currentEntity = ENTERPRISE_ENTITIES.find((p) => p.id === activePlantId) || ENTERPRISE_ENTITIES[0];

  // Plant Switch Handler
  const handleSelectPlant = (entity: PlantEntity) => {
    setActivePlantId(entity.id);
    setShowPlantDropdown(false);
    onPlantChange?.(entity.id, entity.name);
    showToast(`Switched active context to ${entity.name}`);
  };

  // Toggle Action Pin
  const handleTogglePin = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
    showToast(pinnedActionIds.includes(actionId) ? 'Removed from favorites' : 'Pinned to favorites');
  };

  // Execute Quick Action
  const handleExecuteQuickAction = (act: QuickActionItem) => {
    setShowQuickActionsDropdown(false);
    setSelectedQuickAction(act);
    setRecentActionIds((prev) => [act.id, ...prev.filter((id) => id !== act.id)].slice(0, 5));
  };

  const handleExecuteQuickActionById = (actId: string) => {
    const act = INITIAL_QUICK_ACTIONS.find((a) => a.id === actId);
    if (act) {
      setSelectedQuickAction(act);
      setRecentActionIds((prev) => [act.id, ...prev.filter((id) => id !== act.id)].slice(0, 5));
    }
  };

  // Sample Notifications Dataset matching Prompt examples
  const notificationsList = [
    {
      id: 'NOTIF-01',
      title: 'Purchase Order Pending Approval',
      desc: 'PO-2026-089 for 12,500 KG PP Resin ($24,200) requires director authorization.',
      module: 'Procurement',
      ref: 'PO-2026-089',
      time: '12m ago',
      priority: 'High',
      type: 'approvals',
      color: 'border-amber-500 bg-amber-50/50',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'NOTIF-02',
      title: 'Machine Downtime Alert',
      desc: 'Engel 650T (Press 04) reported hydraulic proportional valve alarm.',
      module: 'Production',
      ref: 'IMM-ENGEL-650',
      time: '24m ago',
      priority: 'Critical',
      type: 'alerts',
      color: 'border-rose-500 bg-rose-50/50',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'NOTIF-03',
      title: 'Quality Hold Quarantined',
      desc: 'Lot #LOT-2026-0412 sink mark defect flagged on Cavity #2. 84 pcs blocked.',
      module: 'Quality',
      ref: 'NCR-2026-0041',
      time: '45m ago',
      priority: 'Critical',
      type: 'alerts',
      color: 'border-rose-500 bg-rose-50/50',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'NOTIF-04',
      title: 'Work Order Material Shortage',
      desc: 'WO-2026-0415 requires Sabic PP 579S. Silo 02 balance is below minimum buffer.',
      module: 'Warehouse',
      ref: 'WO-2026-0415',
      time: '1h ago',
      priority: 'High',
      type: 'tasks',
      color: 'border-amber-500 bg-amber-50/50',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'NOTIF-05',
      title: 'CMM Arm Calibration Due Soon',
      desc: 'Mitutoyo 3D CMM inspection station periodic calibration due in 3 days.',
      module: 'Quality',
      ref: 'CAL-2026-11',
      time: '3h ago',
      priority: 'Informational',
      type: 'system',
      color: 'border-blue-500 bg-blue-50/50',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  // Tasks dataset matching STEP-5 (Approvals awaiting action & assigned tasks)
  const pendingTasksList = [
    { id: 'TSK-01', title: 'Approve Purchase Order PO-2026-089', module: 'Procurement', record: 'PO-2026-089', due: 'Today, 14:00', priority: 'Urgent', status: 'Pending Review' },
    { id: 'TSK-02', title: 'Review BOM Revision v2.1 (Grille Assembly)', module: 'Engineering', record: 'BOM-BUMP-01', due: 'Tomorrow', priority: 'Medium', status: 'Pending Sign-off' },
    { id: 'TSK-03', title: 'Inspect Mold Die MLD-AUTO-09 Cavity #2', module: 'Maintenance', record: 'MLD-AUTO-09', due: 'Today, 17:00', priority: 'High', status: 'In Progress' },
    { id: 'TSK-04', title: 'Resolve MRB Disposition for Lot #LOT-0819', module: 'Quality', record: 'NCR-2026-0041', due: 'Sep 06', priority: 'Urgent', status: 'Quarantined' },
    { id: 'TSK-05', title: 'Sign Off Night Shift C Overtime Sheets', module: 'HR', record: 'OT-2026-33', due: 'Today, 11:30', priority: 'Low', status: 'Pending Approval' },
  ];

  // Filter contextual quick actions based on current screen
  const contextualActions = INITIAL_QUICK_ACTIONS.filter((act) => {
    if (currentView.startsWith('mfg') || currentView === 'woList' || currentView === 'home') {
      return ['QA-001', 'QA-002', 'QA-003', 'QA-006'].includes(act.id);
    }
    if (currentView.startsWith('quality') || currentView.startsWith('ncr')) {
      return ['QA-004', 'QA-005', 'QA-010'].includes(act.id);
    }
    if (currentView.startsWith('wh') || currentView === 'stockOverview') {
      return ['QA-008', 'QA-009', 'QA-003', 'QA-010'].includes(act.id);
    }
    if (currentView.startsWith('po') || currentView.startsWith('pr')) {
      return ['QA-007', 'QA-008'].includes(act.id);
    }
    if (currentView.startsWith('sales') || currentView.startsWith('so')) {
      return ['QA-011', 'QA-001'].includes(act.id);
    }
    return ['QA-001', 'QA-002', 'QA-004', 'QA-007'].includes(act.id);
  });

  return (
    <header
      ref={topbarRef}
      className={`h-[56px] sm:h-[60px] shrink-0 bg-white border-b border-[#E4E0D6] flex items-center justify-between px-3 sm:px-5 gap-2 sm:gap-3 relative z-30 select-none shadow-2xs ${
        activeTheme === 'high_contrast' ? 'border-b-2 border-slate-950 bg-white font-semibold' : ''
      }`}
    >
      {/* ======================================================== */}
      {/* LEFT ZONE: Logo, Hamburger, Plant Selector, Breadcrumbs  */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Responsive Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Company & Multi-Plant Selector (STEP-2) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPlantDropdown(!showPlantDropdown);
              setShowQuickActionsDropdown(false);
              setShowNotificationsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/90 text-left transition-all cursor-pointer shadow-2xs group"
            title="Switch Manufacturing Plant / Warehouse Context"
          >
            <div className="w-6 h-6 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold bg-[#14213D] text-white px-1.5 py-0.2 rounded">
                  {currentEntity.code}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[130px] lg:max-w-[180px]">
                  {currentEntity.name.split(':')[1] || currentEntity.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span>{currentEntity.location}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform ${
                showPlantDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Plant Dropdown Menu */}
          {showPlantDropdown && (
            <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 bg-slate-50 rounded-xl mb-2.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Company &amp; Multi-Plant Switcher</span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Active: {currentEntity.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Datastock Polymer Solutions &bull; Multi-Entity Architecture
                </p>
                <div className="relative mt-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={plantSearchTerm}
                    onChange={(e) => setPlantSearchTerm(e.target.value)}
                    placeholder="Search plants, warehouses, locations..."
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-100">
                {ENTERPRISE_ENTITIES.filter((e) =>
                  e.name.toLowerCase().includes(plantSearchTerm.toLowerCase()) ||
                  e.location.toLowerCase().includes(plantSearchTerm.toLowerCase()) ||
                  e.code.toLowerCase().includes(plantSearchTerm.toLowerCase())
                ).map((entity) => {
                  const isActive = entity.id === activePlantId;
                  return (
                    <div
                      key={entity.id}
                      onClick={() => handleSelectPlant(entity)}
                      className={`pt-2 p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-teal-50 border border-teal-200 text-teal-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {entity.code}
                          </span>
                          <span className="text-xs font-bold truncate text-slate-900">
                            {entity.name}
                          </span>
                          {entity.isDefault && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>{entity.location}</span>
                          <span>&bull;</span>
                          <span className="text-[#0F8B8D] font-medium">{entity.type}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Assigned Role: <span className="font-medium text-slate-600">{entity.userRole}</span>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button className="px-2 py-1 rounded text-[11px] font-bold text-[#0F8B8D] hover:bg-teal-100 shrink-0">
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current Breadcrumbs / Module Title */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#6B7280] truncate border-l border-slate-200 pl-3">
          {breadcrumbs.map((part, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="opacity-40">/</span>}
                <span
                  onClick={() => {
                    if (index === 0 && onNavigate) onNavigate('home');
                  }}
                  className={
                    isLast
                      ? 'text-[#1C1F26] font-bold truncate max-w-[120px]'
                      : 'hover:text-[#1C1F26] cursor-pointer truncate max-w-[100px]'
                  }
                >
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CENTER ZONE: Global Search Bar / Command Palette Trigger */}
      {/* ======================================================== */}
      <div
        onClick={() => setIsCommandPaletteOpen(true)}
        className="flex-1 max-w-sm xl:max-w-md hidden md:flex items-center gap-2 bg-[#F6F4EF] hover:bg-[#eae6de] border border-[#E4E0D6] rounded-xl px-3 py-2 text-xs text-[#1C1F26] cursor-pointer transition-colors shadow-2xs group"
      >
        <Search className="w-3.5 h-3.5 text-[#0F8B8D] group-hover:scale-110 transition-transform" />
        <span className="text-xs text-slate-400 truncate flex-1 font-medium">
          Search orders, items, batches, machines, work orders...
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-[#E4E0D6] px-1.5 py-0.5 rounded-md text-[#6B7280] shadow-2xs font-bold">
          Ctrl K
        </kbd>
      </div>

      {/* ======================================================== */}
      {/* RIGHT ZONE: Quick Actions, Alerts, Notifs, Help, Profile */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Search Icon Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[#0F8B8D]" />
        </button>

        {/* 1. Quick Actions Primary Button (STEP-1, Pages 12-14) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickActionsDropdown(!showQuickActionsDropdown);
              setShowPlantDropdown(false);
              setShowNotificationsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45422] shadow-sm transition-all cursor-pointer"
            title="Quick Actions & Fast Record Creation (Ctrl+Shift+Q)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-300" />
            <span className="hidden sm:inline">+ Quick Actions</span>
            <kbd className="hidden xl:inline-block font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white ml-0.5">
              Q
            </kbd>
          </button>

          {/* Quick Actions Dropdown Menu (STEP-2, Page 13) */}
          {showQuickActionsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl mb-2.5 border border-orange-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                    <Zap className="w-4 h-4 text-[#E8622C] fill-[#E8622C]" />
                    <span>Quick Actions Center</span>
                  </div>
                  <p className="text-[11px] text-orange-800/80 mt-0.5">
                    Fast modal execution without losing current view.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuickActionsDropdown(false);
                    onNavigate?.('adminQuickActionsConfig');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Configure Quick Actions"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
                {/* Section 1: Pinned / Favorite Actions */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-500 fill-amber-500" /> Pinned / Favorites
                    </span>
                    <span className="text-[10px] text-slate-400">{pinnedActionIds.length} pinned</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {INITIAL_QUICK_ACTIONS.filter((a) => pinnedActionIds.includes(a.id)).map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleExecuteQuickAction(act)}
                        className="group p-2 rounded-xl border border-slate-200 hover:border-[#0F8B8D] hover:bg-teal-50/50 cursor-pointer transition-all flex items-center justify-between gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-[#E8622C]/10 text-[#E8622C] flex items-center justify-center shrink-0">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F8B8D] truncate">
                            {act.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleTogglePin(act.id, e)}
                          className="text-amber-500 hover:text-slate-400 shrink-0 p-0.5"
                          title="Unpin"
                        >
                          <Pin className="w-3 h-3 fill-amber-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Contextual Current Module Actions */}
                <div className="pt-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Current Screen Context</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-mono">
                      {breadcrumbs[breadcrumbs.length - 1] || 'General'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {contextualActions.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleExecuteQuickAction(act)}
                        className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0 font-semibold">
                            <PlayCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#0F8B8D]">
                              {act.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                              {act.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {act.shortcut && (
                            <kbd className="text-[9px] font-mono bg-slate-100 border border-slate-200 px-1 rounded text-slate-500">
                              {act.shortcut}
                            </kbd>
                          )}
                          <button
                            onClick={(e) => handleTogglePin(act.id, e)}
                            className="p-1 text-slate-300 hover:text-amber-500"
                          >
                            {pinnedActionIds.includes(act.id) ? (
                              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                            ) : (
                              <PinOff className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: All Quick Actions Grouped */}
                <div className="pt-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    All Manufacturing Quick Actions
                  </div>
                  <div className="space-y-1">
                    {INITIAL_QUICK_ACTIONS.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleExecuteQuickAction(act)}
                        className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B8D]" />
                          <span className="font-semibold text-slate-800 group-hover:text-[#0F8B8D] truncate">
                            {act.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({act.module})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold group-hover:text-slate-700">
                          Execute &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Tasks & Operational Alerts Indicator (STEP-5, Page 7) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTasksDropdown(!showTasksDropdown);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowNotificationsDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative cursor-pointer"
            title="Pending Approvals & Assigned Tasks"
          >
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-white shadow-xs">
              {pendingTasksList.length}
            </span>
          </button>

          {/* Tasks Dropdown Panel */}
          {showTasksDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>Action Tasks &amp; Approvals</span>
                  </div>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    {pendingTasksList.length} operational items awaiting your sign-off.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Priority
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {pendingTasksList.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/30 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">{task.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Module: <strong className="text-slate-700">{task.module}</strong></span>
                      <span className="font-mono text-[10px] text-slate-400">Due: {task.due}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-200/80">
                      <button
                        onClick={() => {
                          showToast(`Snoozed task ${task.id}`);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-200"
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => {
                          showToast(`Rejected / Requested Revision for ${task.record}`);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          showToast(`Approved & Completed: ${task.title}`);
                        }}
                        className="px-2.5 py-1 rounded text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                      >
                        Approve / Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Notification Center (STEP-4, Pages 5-6) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationsDropdown(!showNotificationsDropdown);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative cursor-pointer"
            title="Notifications & System Alerts"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-[#E8622C] text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-white shadow-xs">
              5
            </span>
            {/* Critical alert pulsing dot */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </button>

          {/* Notification Dropdown Panel */}
          {showNotificationsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#E8622C]" />
                    <span>Notification Center</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Live operational events &amp; telemetry</p>
                </div>
                <button
                  onClick={() => showToast('All notifications marked as read')}
                  className="text-[11px] font-bold text-[#0F8B8D] hover:underline"
                >
                  Mark all as read
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-100 pb-2 mb-2 text-xs font-bold overflow-x-auto scrollbar-none">
                {(['all', 'approvals', 'alerts', 'tasks', 'system'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveNotificationTab(tab)}
                    className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                      activeNotificationTab === tab
                        ? 'bg-[#14213D] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Notification Cards */}
              <div className="max-h-72 overflow-y-auto space-y-2">
                {notificationsList
                  .filter((n) => activeNotificationTab === 'all' || n.type === activeNotificationTab)
                  .map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl border-l-4 border shadow-2xs text-xs space-y-1 ${notif.color}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate">{notif.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${notif.badgeColor}`}>
                          {notif.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{notif.desc}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Ref: <strong className="font-mono text-slate-600">{notif.ref}</strong></span>
                        <span>{notif.time}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => showToast(`Opened ${notif.ref}`)}
                          className="text-[11px] font-bold text-[#0F8B8D] hover:underline"
                        >
                          View Record &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Help & Support Dropdown (STEP-6, Pages 7-8) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelpDropdown(!showHelpDropdown);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowTasksDropdown(false);
              setShowNotificationsDropdown(false);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Help, Documentation & System Status"
          >
            <HelpCircle className="w-4 h-4 text-slate-700" />
          </button>

          {showHelpDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4 text-[#0F8B8D]" />
                  <span>Reboot Plastics Knowledge Base</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Enterprise Suite v2.8.4 &bull; Plastics Edition
                </div>
              </div>

              <div className="space-y-0.5 text-xs text-slate-700">
                <button
                  onClick={() => {
                    setShowHelpDropdown(false);
                    setShowShortcutsModal(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-slate-500" />
                    <span>Keyboard Shortcuts</span>
                  </span>
                  <kbd className="font-mono text-[9px] bg-slate-200 px-1 rounded">?</kbd>
                </button>

                <button
                  onClick={() => {
                    setShowHelpDropdown(false);
                    setShowSupportTicketModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <Send className="w-4 h-4 text-indigo-500" />
                  <span>Contact Support / Report Issue</span>
                </button>

                <button
                  onClick={() => {
                    setShowHelpDropdown(false);
                    setShowSystemStatusModal(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>System &amp; OPC-UA Status</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </button>

                <button
                  onClick={() => {
                    setShowHelpDropdown(false);
                    openAngularGuide();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-teal-50 text-[#0F8B8D] font-bold cursor-pointer"
                >
                  <Code className="w-4 h-4" />
                  <span>Angular 18 Migration Guide</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Language Selector (STEP-7, Page 8) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLanguageDropdown(!showLanguageDropdown);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowNotificationsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
            title="Change ERP Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>{currentLang}</span>
          </button>

          {showLanguageDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1">
                Select Display Language
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 text-xs">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setShowLanguageDropdown(false);
                      showToast(`Language set to ${lang.name}`);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      currentLang === lang.code
                        ? 'bg-teal-50 text-[#0F8B8D] font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{lang.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Theme Toggle (STEP-8, Pages 8-9) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeDropdown(!showThemeDropdown);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowNotificationsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Theme & Display Settings"
          >
            {activeTheme === 'high_contrast' ? (
              <Contrast className="w-4 h-4 text-amber-600" />
            ) : activeTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {showThemeDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1">
                Visual Theme
              </div>
              <div className="space-y-0.5 text-xs">
                {[
                  { id: 'light', label: 'Light Mode', icon: Sun },
                  { id: 'dark', label: 'Dark Industrial Header', icon: Moon },
                  { id: 'system', label: 'System Default', icon: Laptop },
                  { id: 'high_contrast', label: 'Factory High Contrast', icon: Contrast },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTheme(t.id as any);
                        setShowThemeDropdown(false);
                        showToast(`Theme switched to ${t.label}`);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 text-[#0F8B8D] font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#0F8B8D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 7. User Profile Menu & Role Switcher (STEP-9, STEP-10, Pages 9-10) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowPlantDropdown(false);
              setShowQuickActionsDropdown(false);
              setShowNotificationsDropdown(false);
              setShowTasksDropdown(false);
              setShowHelpDropdown(false);
            }}
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                currentUser?.avatarColor || 'from-[#0F8B8D] to-[#E8622C]'
              } flex items-center justify-center text-xs font-bold text-white shadow-xs`}
            >
              {currentUser?.initials || 'PR'}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* User Profile Dropdown Panel */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Header (STEP-9) */}
              <div className="p-3 bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-xl mb-2.5 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${
                      currentUser?.avatarColor || 'from-[#0F8B8D] to-[#E8622C]'
                    } flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0`}
                  >
                    {currentUser?.initials || 'PR'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {currentUser?.name || 'Priya Rao'}
                    </div>
                    <div className="text-xs text-[#0F8B8D] font-semibold truncate">
                      {currentUser?.role || 'Plant Operations Director'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">
                      ID: {currentUser?.badgeId || 'PLANT-001'} &bull; {currentUser?.plantId || 'PLANT-01'}
                    </div>
                  </div>
                </div>

                {/* Security Indicators (STEP-9) */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>MFA Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> FIDO2 Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Sessions:</span>
                    <span className="font-medium text-slate-700">2 Devices (Chrome Linux, Tablet)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Password Expiry:</span>
                    <span className="font-medium text-slate-700">28 days remaining</span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-0.5 text-xs text-slate-700">
                {/* Switch Role Button (STEP-10) */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowRoleSwitcherModal(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-left font-bold text-indigo-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Switch Role Context</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 border border-indigo-200">
                    12 Roles
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate?.('hrCommandCenter');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Profile &amp; Preferences</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate?.('adminQuickActionsConfig');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Quick Action Preferences</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate?.('adminSecurity');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Security &amp; MFA Settings</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSwitchUser?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-[#E8622C]" />
                  <span>Switch User Account</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out / Lock Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS & OVERLAYS                                        */}
      {/* ======================================================== */}

      {/* 1. Global Command Palette Modal (Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view, param) => onNavigate?.(view, param)}
        onExecuteQuickAction={(actionId) => handleExecuteQuickActionById(actionId)}
        showToast={showToast}
        currentModuleTitle={breadcrumbs[breadcrumbs.length - 1]}
      />

      {/* 2. Quick Action Execution Modal / Drawer */}
      <QuickActionModal
        isOpen={Boolean(selectedQuickAction)}
        onClose={() => setSelectedQuickAction(null)}
        action={selectedQuickAction}
        onSuccess={(msg, recId) => {
          showToast(msg);
          if (recId?.startsWith('WO-') && onNavigate) onNavigate('mfgJobCard', { id: recId });
        }}
        currentUser={currentUser}
      />

      {/* 3. Role Switcher Modal (STEP-10, Page 10) */}
      {showRoleSwitcherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Switch Role Context Without Logging Out</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Temporarily switch role privileges and dashboard views for audit or operational duties.
                </p>
              </div>
              <button
                onClick={() => setShowRoleSwitcherModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SYSTEM_ROLES.map((r) => {
                const isCurrent = currentUser?.role?.toLowerCase().includes(r.name.toLowerCase());
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      onRoleChange?.(r.name);
                      setShowRoleSwitcherModal(false);
                      showToast(`Role context switched to ${r.name}`);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{r.name}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {r.scope}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{r.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Permissions: Module specific</span>
                      <span className="font-bold text-indigo-600">Activate &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Keyboard Shortcuts Sheet Modal (STEP-10) */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#0F8B8D]" />
                <span>Enterprise Global Keyboard Shortcuts</span>
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs divide-y divide-slate-100">
              {[
                { key: 'Ctrl / Cmd + K', action: 'Open Global Search / Command Palette' },
                { key: 'Ctrl / Cmd + Shift + Q', action: 'Open Quick Actions Menu' },
                { key: 'Ctrl / Cmd + Shift + N', action: 'Contextual Quick Create (Work Order, NCR, PO)' },
                { key: 'Esc', action: 'Close any active modal, drawer, or search palette' },
                { key: 'Alt + W', action: 'Quick Create Work Order' },
                { key: 'Alt + D', action: 'Quick Record Machine Downtime' },
                { key: 'Alt + N', action: 'Quick Create NCR Defect Report' },
                { key: 'Alt + P', action: 'Quick Create Purchase Requisition' },
                { key: 'Alt + R', action: 'Quick Receive Polymer Goods (GRN)' },
              ].map((sc) => (
                <div key={sc.key} className="pt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{sc.action}</span>
                  <kbd className="font-mono text-[11px] font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded shadow-2xs">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Contact Support / Report Issue Modal (STEP-6, Page 7-8) */}
      {showSupportTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#0F8B8D]" />
                <span>Submit Technical Support Ticket</span>
              </h3>
              <button
                onClick={() => setShowSupportTicketModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSupportTicketModal(false);
                showToast('Support ticket #TKT-2026-0922 submitted to IT Ops team!');
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category *</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold">
                  <option>OPC-UA PLC Telemetry Lag / Timeout</option>
                  <option>Weighbridge Serial Connector Error</option>
                  <option>Barcode / Zebra Label Printing Issue</option>
                  <option>Work Order Cycle Time Calculation Variance</option>
                  <option>Other / Feature Enhancement Request</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Summary *</label>
                <input
                  type="text"
                  placeholder="Brief description of the error"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Steps to Reproduce</label>
                <textarea
                  rows={3}
                  placeholder="Specify machine, lot number, or error prompt..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <div className="font-bold text-slate-700 mb-1">Auto-Captured Environment Metadata:</div>
                <div>Plant: {currentEntity.name} ({currentEntity.code})</div>
                <div>User: {currentUser?.name} ({currentUser?.email})</div>
                <div>Client: Chromium Linux 64-bit &bull; Build: v2.8.4 Plastics Suite</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupportTicketModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#0F8B8D] hover:bg-[#0a6c6e] shadow-md"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. System Status Modal (STEP-6, Page 8) */}
      {showSystemStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Enterprise Production System Health</span>
              </h3>
              <button
                onClick={() => setShowSystemStatusModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              {[
                { name: 'Euromap 63/77 OPC-UA Press Gateway', status: 'Operational', latency: '4ms', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'Avery Weigh-Tronix Truck Weighbridge', status: 'Operational', latency: '12ms', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'NIC GST e-Invoicing & e-Waybill API', status: 'Operational', latency: '68ms', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'PostgreSQL Enterprise DB Cluster', status: 'Operational (99.98%)', latency: '2ms', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'AWS S3 Cold Storage & WORM Vault', status: 'Operational', latency: '35ms', color: 'text-emerald-700 bg-emerald-50' },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{svc.name}</div>
                    <div className="text-[10px] text-slate-400">Response Latency: {svc.latency}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${svc.color}`}>
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
