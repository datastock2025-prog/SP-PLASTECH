import React, { useState } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  ShieldCheck,
  Smartphone,
  Eye,
  Terminal,
} from 'lucide-react';
import { SecurityPolicySettings } from '../../types/admin';
import { mockSecurityPolicy } from '../../data/mockAdminData';
import { adminEventBus } from '../../services/adminService';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { useAuthContext } from '../../shared/components/RequireAuth';

const SECURITY_POLICY_STORAGE_KEY = 'reboot_erp_security_policy_v2';

function loadStoredSecurityPolicy(): SecurityPolicySettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SECURITY_POLICY_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return { ...mockSecurityPolicy };
}

function saveStoredSecurityPolicy(p: SecurityPolicySettings) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SECURITY_POLICY_STORAGE_KEY, JSON.stringify(p));
    }
  } catch (e) {}
}

interface AdminSecurityViewProps {
  showToast?: (msg: string) => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { currentUser } = useAuthContext();
  const [policy, setPolicy] = useState<SecurityPolicySettings>(loadStoredSecurityPolicy);
  const [newIpRange, setNewIpRange] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const handleTriggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmModalOpen(true);
  };

  const handleExecuteSave = () => {
    saveStoredSecurityPolicy(policy);
    adminEventBus.emit('SECURITY_POLICY_SAVED', policy);

    masterDataGovernanceService.recordAudit({
      entityType: 'SECURITY_POLICY',
      entityCode: 'SEC-GLOBAL-POL',
      entityName: 'Enterprise Password & Lockout Policy',
      action: 'UPDATE',
      changedBy: currentUser?.fullName || 'Super Administrator',
      userRole: 'admin',
      changeSummary: `Updated enterprise security & lockout policy. Reason: ${changeReason || 'Security hardening / Periodic review'}`,
      diff: {
        minPasswordLength: { before: 8, after: policy.minPasswordLength },
        sessionTimeoutMinutes: { before: 30, after: policy.sessionTimeoutMinutes },
        maxFailedAttempts: { before: 5, after: policy.maxFailedAttempts },
        mfaEnforcedRoles: { before: 'Standard', after: policy.mfaEnforcedRoles.join(', ') },
      },
    });

    setIsConfirmModalOpen(false);
    setChangeReason('');
    showToast('✓ Enterprise security & authentication policy successfully synchronized and recorded in DB.');
  };

  const handleAddIp = () => {
    if (!newIpRange.trim()) return;
    const cleanIp = newIpRange.trim();
    const updated = {
      ...policy,
      allowedIpRanges: [...policy.allowedIpRanges, cleanIp],
    };
    setPolicy(updated);
    saveStoredSecurityPolicy(updated);
    setNewIpRange('');
    showToast(`CIDR range "${cleanIp}" added to plant IP whitelist.`);
  };

  const handleRemoveIp = (ip: string) => {
    const updated = {
      ...policy,
      allowedIpRanges: policy.allowedIpRanges.filter((item) => item !== ip),
    };
    setPolicy(updated);
    saveStoredSecurityPolicy(updated);
    showToast(`Removed ${ip} from IP whitelist.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Cybersecurity Hardening &amp; Compliance &bull; Live DB Connected</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Security, Authentication &amp; Lockout Policies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure password strength metrics, multi-factor authentication (MFA) enforcement, session auto-lockout, and plant IP whitelists.
          </p>
        </div>

        <button
          onClick={handleTriggerSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Security Policy
        </button>
      </div>

      <form onSubmit={handleTriggerSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Password Complexity & Expiry */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-sm font-bold text-slate-900">Password Complexity &amp; Rotation Standards</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Password Length</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={8}
                  max={32}
                  value={policy.minPasswordLength}
                  onChange={(e) => setPolicy({ ...policy, minPasswordLength: parseInt(e.target.value) || 8 })}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-slate-500">Characters (Minimum 8 recommended for enterprise)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireUppercase}
                  onChange={(e) => setPolicy({ ...policy, requireUppercase: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">Require at least one uppercase letter (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireLowercase}
                  onChange={(e) => setPolicy({ ...policy, requireLowercase: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">Require at least one lowercase letter (a-z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireNumbers}
                  onChange={(e) => setPolicy({ ...policy, requireNumbers: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">Require at least one numeric digit (0-9)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireSpecialChars}
                  onChange={(e) => setPolicy({ ...policy, requireSpecialChars: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">Require special symbol (!@#$%^&amp;*)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Expiry (Days)</label>
                <input
                  type="number"
                  value={policy.passwordExpiryDays}
                  onChange={(e) => setPolicy({ ...policy, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prevent Password Reuse</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={policy.passwordHistoryCount}
                    onChange={(e) => setPolicy({ ...policy, passwordHistoryCount: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="text-slate-400">Cycles</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Account Lockout & Brute-Force Defense */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Account Lockout &amp; Threat Defense</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Failed Login Attempts Before Account Lockout
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={policy.maxFailedAttempts}
                  onChange={(e) => setPolicy({ ...policy, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-slate-500">Failed attempts (Default: 5)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lockout Duration (Minutes)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={policy.lockoutDurationMinutes}
                  onChange={(e) => setPolicy({ ...policy, lockoutDurationMinutes: parseInt(e.target.value) || 30 })}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-slate-500">Minutes until auto-unlock (or manual Admin reset)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Inactivity Session Timeout</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={policy.sessionTimeoutMinutes}
                  onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: parseInt(e.target.value) || 20 })}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-slate-500">Minutes of idle activity before automatic logoff</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Multi-Factor Authentication (MFA) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Multi-Factor Authentication (MFA) Mandate</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.mfaEnforced}
                onChange={(e) => setPolicy({ ...policy, mfaEnforced: e.target.checked })}
                className="mt-0.5 rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Enforce Enterprise 2FA for All Staff</span>
                <span className="text-[11px] text-slate-500">
                  Requires Time-based One-Time Passwords (TOTP) from Google Authenticator, Microsoft Authenticator, or biometric security keys.
                </span>
              </div>
            </label>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mandatory MFA Enforced Roles</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Super Administrator', 'Plant Operations Manager', 'Finance Controller', 'Quality Director'].map(
                  (role) => {
                    const isChecked = policy.mfaEnforcedRoles.includes(role);
                    return (
                      <label key={role} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPolicy({ ...policy, mfaEnforcedRoles: [...policy.mfaEnforcedRoles, role] });
                            } else {
                              setPolicy({
                                ...policy,
                                mfaEnforcedRoles: policy.mfaEnforcedRoles.filter((r) => r !== role),
                              });
                            }
                          }}
                          className="rounded text-[#0F8B8D]"
                        />
                        <span className="font-medium text-slate-800">{role}</span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: IP Geofencing & Plant Subnet Whitelist */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Plant CIDR Subnet &amp; IP Whitelist</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.ipWhitelistEnforced}
                onChange={(e) => setPolicy({ ...policy, ipWhitelistEnforced: e.target.checked })}
                className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
              />
              <span className="font-semibold text-slate-700">
                Enforce Plant Geofencing (Block login outside whitelisted subnets)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.10.0/24 (Chennai Hub)"
                value={newIpRange}
                onChange={(e) => setNewIpRange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleAddIp}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                + Add Subnet
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {policy.allowedIpRanges.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                >
                  <span>{ip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    className="p-1 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100 text-[#0F8B8D]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Confirm Security Policy Deployment</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Updating enterprise security policies impacts active user sessions, password requirements, and plant geofence checks across all connected facilities.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mandatory Governance Review Justification:
              </label>
              <textarea
                rows={2}
                placeholder="Enter justification for governance audit ledger..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSave}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] shadow-sm cursor-pointer"
              >
                Confirm &amp; Deploy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
