import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Globe,
  Bell,
  Shield,
  Zap,
  Save,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
  Laptop,
  KeyRound,
  Download,
  Trash2,
  Moon,
  Sun,
  Eye,
  RefreshCw,
  Clock,
  Calendar,
  Building,
  Mail,
  Phone,
  BadgeCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { GdprService } from '../../security/compliance/GdprService';
import { useMe, useUpdateMe, usePreferences, useUpdatePreferences, useChangePassword } from '../../features/identity/useIdentity';
import type { Me, Preferences } from '../../features/identity/types';

export interface UserProfilePreferences {
  // Identity & Contact
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  badgeId: string;
  plantId: string;
  plantName: string;
  shift: string;
  managerName: string;
  emergencyContact: string;
  emergencyPhone: string;
  bio: string;

  // System & UI Preferences
  defaultLandingPage: string;
  theme: 'light' | 'dark' | 'high_contrast';
  accentColor: string;
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  defaultPageSize: number;
  autoSaveIntervalSeconds: number;
  soundAlertsEnabled: boolean;
  tableHoverHighlight: boolean;

  // Localization
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: 'indian' | 'international';

  // Notifications
  channelInApp: boolean;
  channelDesktopPush: boolean;
  channelEmail: boolean;
  channelSms: boolean;
  notifyMachineBreakdowns: boolean;
  notifyQualityRejections: boolean;
  notifyStockoutRisks: boolean;
  notifyWorkOrderDelays: boolean;
  notifyApprovalRequests: boolean;
  notifyDailyDigest: boolean;

  // Security
  mfaEnabled: boolean;
  mfaMethod: 'TOTP' | 'SMS' | 'FIDO2';
}

interface Props {
  currentUser?: AuthUser | null;
  onNavigate?: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  onUpdateUser?: (updated: AuthUser) => void;
}

const NOTIFY_KEYS = [
  'channelInApp', 'channelDesktopPush', 'channelEmail', 'channelSms',
  'notifyMachineBreakdowns', 'notifyQualityRejections', 'notifyStockoutRisks',
  'notifyWorkOrderDelays', 'notifyApprovalRequests', 'notifyDailyDigest',
  'soundAlertsEnabled', 'tableHoverHighlight',
] as const;
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

function identityFields(me: Me | null) {
  const plant = me?.plants.find((p) => p.id === me.activePlantId);
  return {
    name: me?.fullName ?? '',
    email: me?.email ?? '',
    phone: me?.phone ?? '',
    department: me?.department ?? '',
    jobTitle: me?.designation ?? me?.roleName ?? '',
    badgeId: me?.badgeId ?? '',
    plantId: plant?.code ?? '',
    plantName: plant ? `${plant.code} — ${plant.name}` : '',
    shift: me?.activeShift ?? me?.assignedShift ?? '',
  };
}

function prefsToForm(p: Preferences): Partial<UserProfilePreferences> {
  const n = p.notifications;
  const out: Record<string, unknown> = {
    theme: p.theme === 'system' ? 'light' : p.theme,
    uiDensity: p.density,
    defaultLandingPage: p.landingView,
    language: p.language,
    timeZone: p.timezone,
    dateFormat: p.dateFormat,
  };
  for (const k of NOTIFY_KEYS) if (typeof n[k] === 'boolean') out[k] = n[k];
  return out as Partial<UserProfilePreferences>;
}

function formToPrefs(f: UserProfilePreferences, version: number) {
  const notifications: Record<string, boolean> = {};
  for (const k of NOTIFY_KEYS) notifications[k] = f[k];
  return {
    version,
    theme: (f.theme === 'dark' ? 'dark' : 'light') as Preferences['theme'],
    density: f.uiDensity,
    landingView: f.defaultLandingPage,
    language: f.language,
    timezone: f.timeZone,
    dateFormat: (DATE_FORMATS as readonly string[]).includes(f.dateFormat) ? (f.dateFormat as Preferences['dateFormat']) : 'DD/MM/YYYY',
    notifications,
  };
}

export const UserProfilePreferencesView: React.FC<Props> = ({
  currentUser,
  onNavigate,
  showToast,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'localization' | 'notifications' | 'security' | 'shortcuts'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Identity comes from the authenticated server session; preferences are hydrated from the API below.
  const meQuery = useMe();
  const prefsQuery = usePreferences();
  const updateMe = useUpdateMe();
  const updatePrefs = useUpdatePreferences();
  const changePassword = useChangePassword();
  const me = meQuery.data ?? null;

  const [prefs, setPrefs] = useState<UserProfilePreferences>(() => {
    return {
      ...identityFields(me),
      managerName: '',
      emergencyContact: '',
      emergencyPhone: '',
      bio: '',

      defaultLandingPage: 'home',
      theme: 'light',
      accentColor: '#0F8B8D',
      uiDensity: 'comfortable',
      defaultPageSize: 25,
      autoSaveIntervalSeconds: 30,
      soundAlertsEnabled: true,
      tableHoverHighlight: true,

      language: 'en_IN',
      timeZone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      currency: 'INR',
      numberFormat: 'indian',

      channelInApp: true,
      channelDesktopPush: true,
      channelEmail: true,
      channelSms: false,
      notifyMachineBreakdowns: true,
      notifyQualityRejections: true,
      notifyStockoutRisks: true,
      notifyWorkOrderDelays: true,
      notifyApprovalRequests: true,
      notifyDailyDigest: true,

      mfaEnabled: false,
      mfaMethod: 'TOTP',
    };
  });

  const meVersion = me?.version;
  useEffect(() => {
    if (me) setPrefs((p) => ({ ...p, ...identityFields(me) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meVersion, me?.activePlantId, me?.activeShift]);

  const prefsVersion = prefsQuery.data?.version;
  useEffect(() => {
    if (prefsQuery.data) setPrefs((p) => ({ ...p, ...prefsToForm(prefsQuery.data) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsVersion]);

  // Password Change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Only the current browser session is known to the server.
  const sessions = [
    {
      id: 'current',
      device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'This device',
      ip: 'Current connection',
      location: prefs.plantName || '—',
      lastActive: 'Active Now (Current Session)',
      isCurrent: true,
      icon: Laptop,
    },
  ];

  const handleSaveAll = async () => {
    if (!me || !prefsQuery.data) {
      showToast('⚠ Profile is still loading. Try again in a moment.');
      return;
    }
    setIsSaving(true);
    try {
      await updateMe.mutateAsync({
        version: me.version,
        fullName: prefs.name.trim(),
        phone: prefs.phone.trim() || null,
        department: prefs.department.trim() || null,
        designation: prefs.jobTitle.trim() || null,
      });
      await updatePrefs.mutateAsync(formToPrefs(prefs, prefsQuery.data.version));
      window.dispatchEvent(new CustomEvent('sp_theme_changed', { detail: prefs.theme }));
      setSavedSuccess(true);
      showToast('✓ Profile information and system preferences saved successfully!');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      showToast(`⚠ ${err instanceof Error ? err.message : 'Save failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast('Please enter your Current Password or 24-Hour Temporary OTP.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword: oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('✓ Password updated successfully.');
    } catch (err) {
      showToast(`⚠ ${err instanceof Error ? err.message : 'Password change failed'}`);
    }
  };

  const handleRevokeSession = (_sessionId: string) => {
    showToast('Only the current session is tracked by the server.');
  };

  const handleExportMyData = () => {
    GdprService.exportUserData(currentUser?.id || 'USR-CURRENT', {
      userProfile: prefs,
      sessions,
      exportedAt: new Date().toISOString(),
    });
    showToast('✓ Personal profile and telemetry audit package exported (.JSON).');
  };

  const tabs = [
    { id: 'profile', label: 'My Profile & Details', icon: User, desc: 'Personal identity, contacts & job assignment' },
    { id: 'appearance', label: 'Display & UI Preferences', icon: Sliders, desc: 'Theme, layout density, landing page & sound' },
    { id: 'localization', label: 'Regional & Localization', icon: Globe, desc: 'Language, time zone, date & currency' },
    { id: 'notifications', label: 'Notification Alerts', icon: Bell, desc: 'Critical shopfloor & system event routing' },
    { id: 'security', label: 'Security & Active Sessions', icon: Shield, desc: 'MFA, passwords, and connected devices' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Zap, desc: 'Power user hotkeys & navigation actions' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto animate-fade-in text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentUser?.avatarColor || 'from-[#0F8B8D] to-[#E8622C]'} flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-white/20 shrink-0`}>
            {currentUser?.initials || prefs.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'PR'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white">{prefs.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                Active Account
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-white/10 text-teal-200 border border-white/10">
                {prefs.badgeId}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>{prefs.jobTitle}</span>
              <span>&bull;</span>
              <span>{prefs.department}</span>
              <span>&bull;</span>
              <span className="text-teal-300 font-medium">{prefs.plantName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-fade-in bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <Check className="w-4 h-4" />
              Changes Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0F8B8D] to-[#0c7274] hover:from-[#0c7274] hover:to-[#095759] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Nav Menu */}
        <div className="space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-[#0F8B8D] text-white font-bold shadow-md'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{tab.label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quick Help Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0F8B8D]" />
              Enterprise User Context
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your preferences are synced in real-time across all shopfloor terminals and active plant consoles.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
          {/* ========================================================= */}
          {/* TAB 1: PROFILE & DETAILS                                 */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Personal Information &amp; Plant Assignment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact info, role designation, and operational assignment details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={prefs.name}
                    onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    value={prefs.email}
                    onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile / Direct Phone</label>
                  <input
                    type="tel"
                    value={prefs.phone}
                    onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Badge ID</label>
                  <input
                    type="text"
                    disabled
                    value={prefs.badgeId}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department / Business Unit</label>
                  <input
                    type="text"
                    value={prefs.department}
                    onChange={(e) => setPrefs({ ...prefs, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designated Role / Job Title</label>
                  <input
                    type="text"
                    value={prefs.jobTitle}
                    onChange={(e) => setPrefs({ ...prefs, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Plant / Facility</label>
                  <select
                    value={prefs.plantId}
                    disabled
                    title="Plant assignment is managed by an administrator"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-600"
                  >
                    {(meQuery.data?.plants ?? []).map((p) => (
                      <option key={p.id} value={p.code}>{p.code} — {p.name}{p.location ? ` (${p.location})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Work Shift</label>
                  <select
                    value={prefs.shift}
                    onChange={(e) => setPrefs({ ...prefs, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="General Shift (08:00 - 17:00)">General Shift (08:00 - 17:00)</option>
                    <option value="Shift A - Morning (06:00 - 14:00)">Shift A - Morning (06:00 - 14:00)</option>
                    <option value="Shift B - Evening (14:00 - 22:00)">Shift B - Evening (14:00 - 22:00)</option>
                    <option value="Shift C - Night (22:00 - 06:00)">Shift C - Night (22:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Direct Reporting Manager</label>
                  <input
                    type="text"
                    value={prefs.managerName}
                    onChange={(e) => setPrefs({ ...prefs, managerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact &amp; Phone</label>
                  <input
                    type="text"
                    value={`${prefs.emergencyContact} - ${prefs.emergencyPhone}`}
                    onChange={(e) => {
                      const [contact, phone] = e.target.value.split('-');
                      setPrefs({ ...prefs, emergencyContact: contact?.trim() || '', emergencyPhone: phone?.trim() || '' });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    placeholder="e.g. S. Rao - +91 98765 00112"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Professional Bio &amp; Role Focus</label>
                  <textarea
                    rows={3}
                    value={prefs.bio}
                    onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    placeholder="Brief description of your operational responsibilities..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: APPEARANCE & UI PREFERENCES                        */}
          {/* ========================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Display, Theme &amp; UI Ergonomics</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure visual themes, default landing views, table density, and audio feedback.
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Application Visual Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light Clean', desc: 'Optimized for well-lit plant offices & labs', icon: Sun },
                    { id: 'dark', label: 'Dark Charcoal', desc: 'Comfortable for low-light shopfloor consoles', icon: Moon },
                    { id: 'high_contrast', label: 'High Contrast (WCAG)', desc: 'Maximum readability & bold borders', icon: Eye },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = prefs.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, theme: t.id as any })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0F8B8D] bg-teal-50/50 ring-2 ring-[#0F8B8D]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0F8B8D]' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs text-slate-900">{t.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UI Density & Landing Page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Landing Dashboard</label>
                  <select
                    value={prefs.defaultLandingPage}
                    onChange={(e) => setPrefs({ ...prefs, defaultLandingPage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="home">Executive Command Center (Default)</option>
                    <option value="mfgDash">Manufacturing &amp; Machine Press Control</option>
                    <option value="scmControlTower">Supply Chain Control Tower</option>
                    <option value="qualityDash">Quality Management &amp; IQC/FQC</option>
                    <option value="inventoryDash">Warehouse &amp; Polymer Silo Inventory</option>
                    <option value="salesForecast">Sales, Quotes &amp; OEM Orders</option>
                    <option value="financeDash">Finance &amp; Accounts Payable/Receivable</option>
                    <option value="hrCommandCenter">Human Resources &amp; Biometric Roster</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Table &amp; Grid Density</label>
                  <select
                    value={prefs.uiDensity}
                    onChange={(e) => setPrefs({ ...prefs, uiDensity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="compact">Compact (High Information Density - More rows)</option>
                    <option value="comfortable">Comfortable (Standard Touch-friendly spacing)</option>
                    <option value="spacious">Spacious (Large Touch Buttons for Shop Floor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Table Rows per Page</label>
                  <select
                    value={prefs.defaultPageSize}
                    onChange={(e) => setPrefs({ ...prefs, defaultPageSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="10">10 Rows per page</option>
                    <option value="25">25 Rows per page (Recommended)</option>
                    <option value="50">50 Rows per page</option>
                    <option value="100">100 Rows per page</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Form Draft Auto-Save Frequency</label>
                  <select
                    value={prefs.autoSaveIntervalSeconds}
                    onChange={(e) => setPrefs({ ...prefs, autoSaveIntervalSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="15">Every 15 seconds (High Safety)</option>
                    <option value="30">Every 30 seconds (Standard)</option>
                    <option value="60">Every 60 seconds</option>
                    <option value="0">Disabled (Manual Save Only)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {prefs.soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-[#0F8B8D]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      Audio Chime for Critical Alarms
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Plays audio on emergency stops &amp; quality holds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.soundAlertsEnabled}
                    onChange={(e) => setPrefs({ ...prefs, soundAlertsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F8B8D]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-800">Highlight Active Table Row on Hover</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Enhances readability in large audit lists</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.tableHoverHighlight}
                    onChange={(e) => setPrefs({ ...prefs, tableHoverHighlight: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F8B8D]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Display Settings
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LOCALIZATION & REGIONAL                            */}
          {/* ========================================================= */}
          {activeTab === 'localization' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Regional, Currency &amp; Localization Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set language, regional time zone, date formatting, and financial currency symbols.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Language</label>
                  <select
                    value={prefs.language}
                    onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="en_IN">English (India - English)</option>
                    <option value="en_US">English (United States)</option>
                    <option value="hi_IN">Hindi (हिंदी)</option>
                    <option value="de_DE">German (Deutsch)</option>
                    <option value="tr_TR">Turkish (Türkçe)</option>
                    <option value="es_ES">Spanish (Español)</option>
                    <option value="fr_FR">French (Français)</option>
                    <option value="zh_CN">Chinese (中文 - 简体)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Time Zone</label>
                  <select
                    value={prefs.timeZone}
                    onChange={(e) => setPrefs({ ...prefs, timeZone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST UTC+05:30) - Standard</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET UTC+01:00)</option>
                    <option value="America/New_York">America/New_York (EST UTC-05:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT UTC+08:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Display Format</label>
                  <select
                    value={prefs.dateFormat}
                    onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/09/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 - e.g. 2026-09-18)</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 18-Sep-2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/18/2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Notation</label>
                  <select
                    value={prefs.timeFormat}
                    onChange={(e) => setPrefs({ ...prefs, timeFormat: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="12h">12-Hour AM/PM (e.g. 02:45 PM)</option>
                    <option value="24h">24-Hour Military Format (e.g. 14:45)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Base Currency</label>
                  <select
                    value={prefs.currency}
                    onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numerical Separators</label>
                  <select
                    value={prefs.numberFormat}
                    onChange={(e) => setPrefs({ ...prefs, numberFormat: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="indian">Indian Lakhs &amp; Crores (e.g. 12,50,000.00)</option>
                    <option value="international">International Thousands (e.g. 1,250,000.00)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Localization
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: NOTIFICATIONS & EVENT ROUTING                     */}
          {/* ========================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Notification Channels &amp; Event Subscriptions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select how and when you receive operational alerts, approval requests, and shopfloor alarms.
                </p>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Delivery Channels</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <span className="font-semibold text-slate-800">In-App Popups</span>
                    <input
                      type="checkbox"
                      checked={prefs.channelInApp}
                      onChange={(e) => setPrefs({ ...prefs, channelInApp: e.target.checked })}
                      className="rounded text-[#0F8B8D]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <span className="font-semibold text-slate-800">Desktop Push</span>
                    <input
                      type="checkbox"
                      checked={prefs.channelDesktopPush}
                      onChange={(e) => setPrefs({ ...prefs, channelDesktopPush: e.target.checked })}
                      className="rounded text-[#0F8B8D]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <span className="font-semibold text-slate-800">Email Alerts</span>
                    <input
                      type="checkbox"
                      checked={prefs.channelEmail}
                      onChange={(e) => setPrefs({ ...prefs, channelEmail: e.target.checked })}
                      className="rounded text-[#0F8B8D]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <span className="font-semibold text-slate-800">SMS / WhatsApp</span>
                    <input
                      type="checkbox"
                      checked={prefs.channelSms}
                      onChange={(e) => setPrefs({ ...prefs, channelSms: e.target.checked })}
                      className="rounded text-[#0F8B8D]"
                    />
                  </label>
                </div>
              </div>

              {/* Event Subscriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Event Subscriptions</label>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'notifyMachineBreakdowns', title: 'Machine Breakdown & Press Emergency Stops', desc: 'Critical alert when an injection molding machine triggers an alarm', critical: true },
                    { key: 'notifyQualityRejections', title: 'Quality Gate & IQC Inspection Rejections', desc: 'Instant notice when lot samples fail AQL or tolerance limits', critical: true },
                    { key: 'notifyStockoutRisks', title: 'Polymer Raw Material & Additive Stockout Risks', desc: 'Warning when Silo stock falls below safety stock buffer' },
                    { key: 'notifyWorkOrderDelays', title: 'Work Order Cycle Time & Production Target Delays', desc: 'Notice when daily output falls below 90% target rate' },
                    { key: 'notifyApprovalRequests', title: 'Master Data & Purchase Order Approval Requests', desc: 'Pending sign-offs assigned to your approval hierarchy' },
                    { key: 'notifyDailyDigest', title: 'Daily Morning Executive Production Summary', desc: 'Daily 07:00 AM briefing of OEE, scrap rates, and open dispatches' },
                  ].map((sub) => (
                    <label key={sub.key} className="flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sub.title}</span>
                          {sub.critical && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{sub.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={(prefs as any)[sub.key]}
                        onChange={(e) => setPrefs({ ...prefs, [sub.key]: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded text-[#0F8B8D]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SECURITY, MFA & SESSIONS                           */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security, Multi-Factor Authentication &amp; Sessions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your account credentials, 2-step verification, and active connected devices.
                </p>
              </div>

              {/* MFA Status Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-2">
                      Two-Factor Authentication (2FA / MFA)
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Account is protected via TOTP Authenticator &bull; FIDO2 Hardware Key Enabled
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('MFA is not enabled on this deployment yet.')}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Reconfigure MFA
                </button>
              </div>

              {/* Active Sessions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Active Connected Sessions</label>
                  <button
                    type="button"
                    onClick={() => showToast('No other sessions are active for this account.')}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Terminate Other Sessions
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {sessions.map((sess) => {
                    const DeviceIcon = sess.icon;
                    return (
                      <div key={sess.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                            <DeviceIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {sess.device}
                              {sess.isCurrent && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sess.ip} &bull; {sess.location} &bull; {sess.lastActive}
                            </div>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordChange} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#0F8B8D]" />
                  Change Account Password
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Password / 24h Temp OTP *</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter Current Password or 6-digit OTP"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>

              {/* GDPR Export */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  <span>GDPR / DPDP Compliance Article 20: </span>
                  <span className="font-medium text-slate-700">Right to data portability</span>
                </div>
                <button
                  type="button"
                  onClick={handleExportMyData}
                  className="flex items-center gap-1.5 text-xs text-[#0F8B8D] hover:text-[#0c7274] font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Personal Data (.JSON)
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: KEYBOARD SHORTCUTS                                 */}
          {/* ========================================================= */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Power User Keyboard Shortcuts</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quickly navigate workspaces, trigger command palette, and perform operational tasks with hotkeys.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: '/', desc: 'Global Navigation & Search Palette' },
                  { key: 'Ctrl + K / Cmd + K', desc: 'Quick Action Command Menu' },
                  { key: 'Alt + H', desc: 'Navigate to Home Command Center' },
                  { key: 'Alt + M', desc: 'Open Manufacturing / Work Orders' },
                  { key: 'Alt + I', desc: 'Create New Item Wizard' },
                  { key: 'Alt + S', desc: 'Open Supply Chain Control Tower' },
                  { key: 'Alt + Q', desc: 'Open Quality IQC Inspection Plan' },
                  { key: 'Esc', desc: 'Close any active Modal / Slide-Over Drawer' },
                ].map((s) => (
                  <div key={s.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{s.desc}</span>
                    <kbd className="px-2 py-1 rounded bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
