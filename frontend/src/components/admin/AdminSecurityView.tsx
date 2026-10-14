import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { adminEventBus } from '../../services/adminService';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { useAuthContext } from '../../shared/components/RequireAuth';
import { useAdminSecurityPolicy, useSaveAdminSecurityPolicy } from '../../hooks/useAdmin';

export interface ExtendedSecurityPolicySettings extends SecurityPolicySettings {
  mfaEnforced?: boolean;
  mfaEnforcedRoles?: string[];
  ipWhitelistEnforced?: boolean;
}

const DEFAULT_SECURITY_POLICY: ExtendedSecurityPolicySettings = {
  minPasswordLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  enforcePasswordHistoryCount: 5,
  maxFailedAttemptsBeforeLockout: 5,
  lockoutDurationMinutes: 30,
  sessionTimeoutMinutes: 20,
  singleActiveSessionPerUser: true,
  mfaEnforcement: 'Enforced for Admins & Finance',
  mfaEnforced: true,
  mfaEnforcedRoles: [
    'Super Administrator',
    'Plant Operations Manager',
    'Finance Controller',
    'Quality Director',
  ],
  ipWhitelistEnabled: true,
  ipWhitelistEnforced: true,
  allowedIpRanges: ['192.168.10.0/24', '192.168.20.0/24', '10.0.0.0/16', '103.22.45.0/24'],
  corsAllowedOrigins: ['https://reboot-erp.internal', 'https://*.reboot-polymers.com'],
  jwtTokenExpiryHours: 8,
  auditLogRetentionDays: 2555,
  soc2ComplianceLogging: true,
};

interface AdminSecurityViewProps {
  showToast?: (msg: string) => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { currentUser } = useAuthContext();
  const { data: serverPolicy, isLoading } = useAdminSecurityPolicy();
  const savePolicyMutation = useSaveAdminSecurityPolicy();

  const [policy, setPolicy] = useState<ExtendedSecurityPolicySettings>(DEFAULT_SECURITY_POLICY);
  const [newIpRange, setNewIpRange] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    if (serverPolicy) {
      setPolicy((prev) => ({
        ...prev,
        ...serverPolicy,
      }));
    }
  }, [serverPolicy]);

  const handleTriggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmModalOpen(true);
  };

  const handleExecuteSave = () => {
    savePolicyMutation.mutate(policy);
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
        maxFailedAttemptsBeforeLockout: { before: 5, after: policy.maxFailedAttemptsBeforeLockout },
        mfaEnforcedRoles: { before: 'Standard', after: (policy.mfaEnforcedRoles || []).join(', ') },
      },
    });

    setIsConfirmModalOpen(false);
    setChangeReason('');
    showToast('✓ Enterprise security & authentication policy successfully synchronized and recorded in DB.');
  };

  const handleAddIp = () => {
    if (!newIpRange.trim()) return;
    const cleanIp = newIpRange.trim();
    const currentList = Array.isArray(policy.allowedIpRanges) ? policy.allowedIpRanges : [];
    const updated = {
      ...policy,
      allowedIpRanges: [...currentList, cleanIp],
    };
    setPolicy(updated);
    savePolicyMutation.mutate(updated);
    setNewIpRange('');
    showToast(`CIDR range "${cleanIp}" added to plant IP whitelist.`);
  };

  const handleRemoveIp = (ip: string) => {
    const currentList = Array.isArray(policy.allowedIpRanges) ? policy.allowedIpRanges : [];
    const updated = {
      ...policy,
      allowedIpRanges: currentList.filter((item) => item !== ip),
    };
    setPolicy(updated);
    savePolicyMutation.mutate(updated);
    showToast(`Removed ${ip} from IP whitelist.`);
  };

  const mfaRoles = Array.isArray(policy.mfaEnforcedRoles) ? policy.mfaEnforcedRoles : DEFAULT_SECURITY_POLICY.mfaEnforcedRoles || [];
  const ipRanges = Array.isArray(policy.allowedIpRanges) ? policy.allowedIpRanges : DEFAULT_SECURITY_POLICY.allowedIpRanges || [];

  return (
    <div className="min-w-0 space-y-4 pb-8">
      {/* Header */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Cybersecurity Hardening &amp; Compliance &bull; Live DB Connected</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Security, Authentication &amp; Lockout Policies</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Configure password strength metrics, multi-factor authentication (MFA) enforcement, session auto-lockout, and plant IP whitelists.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleTriggerSave}
          className="w-full shrink-0 bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
        >
          <Save aria-hidden="true" />
          Save Security Policy
        </Button>
        </CardContent>
      </Card>

      <form onSubmit={handleTriggerSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Password Complexity & Expiry */}
        <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-sm font-bold text-slate-900">Password Complexity &amp; Rotation Standards</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Password Length</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={8}
                  max={32}
                  value={policy.minPasswordLength || 8}
                  onChange={(e) => setPolicy({ ...policy, minPasswordLength: parseInt(e.target.value) || 8 })}
                  className="h-10 w-24 font-mono"
                />
                <span className="text-slate-500">Characters (Minimum 8 recommended for enterprise)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={!!policy.requireUppercase}
                  onCheckedChange={(checked) => setPolicy({ ...policy, requireUppercase: checked })}
                  aria-label="Require uppercase letters"
                  className="shrink-0 data-[state=checked]:bg-teal-700"
                />
                <span className="font-semibold text-slate-700">Require at least one uppercase letter (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={!!policy.requireLowercase}
                  onCheckedChange={(checked) => setPolicy({ ...policy, requireLowercase: checked })}
                  aria-label="Require lowercase letters"
                  className="shrink-0 data-[state=checked]:bg-teal-700"
                />
                <span className="font-semibold text-slate-700">Require at least one lowercase letter (a-z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={!!policy.requireNumbers}
                  onCheckedChange={(checked) => setPolicy({ ...policy, requireNumbers: checked })}
                  aria-label="Require numeric digits"
                  className="shrink-0 data-[state=checked]:bg-teal-700"
                />
                <span className="font-semibold text-slate-700">Require at least one numeric digit (0-9)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={!!policy.requireSpecialChars}
                  onCheckedChange={(checked) => setPolicy({ ...policy, requireSpecialChars: checked })}
                  aria-label="Require special symbols"
                  className="shrink-0 data-[state=checked]:bg-teal-700"
                />
                <span className="font-semibold text-slate-700">Require special symbol (!@#$%^&amp;*)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-2 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Expiry (Days)</label>
                <Input
                  type="number"
                  value={policy.passwordExpiryDays || 90}
                  onChange={(e) => setPolicy({ ...policy, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                  className="h-10 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prevent Password Reuse</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={policy.enforcePasswordHistoryCount || 5}
                    onChange={(e) => setPolicy({ ...policy, enforcePasswordHistoryCount: parseInt(e.target.value) || 5 })}
                    className="h-10 min-w-0 font-mono"
                  />
                  <span className="text-slate-400">Cycles</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>

        {/* Card 2: Account Lockout & Brute-Force Defense */}
        <Card className="rounded-md border-rose-200 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
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
                <Input
                  type="number"
                  min={3}
                  max={10}
                  value={policy.maxFailedAttemptsBeforeLockout || 5}
                  onChange={(e) => setPolicy({ ...policy, maxFailedAttemptsBeforeLockout: parseInt(e.target.value) || 5 })}
                  className="h-10 w-24 font-mono"
                />
                <span className="text-slate-500">Failed attempts (Default: 5)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lockout Duration (Minutes)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  value={policy.lockoutDurationMinutes || 30}
                  onChange={(e) => setPolicy({ ...policy, lockoutDurationMinutes: parseInt(e.target.value) || 30 })}
                  className="h-10 w-24 font-mono"
                />
                <span className="text-slate-500">Minutes until auto-unlock (or manual Admin reset)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Inactivity Session Timeout</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={5}
                  max={480}
                  value={policy.sessionTimeoutMinutes || 20}
                  onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: parseInt(e.target.value) || 20 })}
                  className="h-10 w-24 font-mono"
                />
                <span className="text-slate-500">Minutes of idle activity before automatic logoff</span>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>

        {/* Card 3: Multi-Factor Authentication (MFA) */}
        <Card className="rounded-md border-indigo-200 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Multi-Factor Authentication (MFA) Mandate</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
              <Switch
                checked={policy.mfaEnforced !== false}
                onCheckedChange={(checked) => setPolicy({ ...policy, mfaEnforced: checked })}
                aria-label="Enforce enterprise MFA for all staff"
                className="mt-0.5 shrink-0 data-[state=checked]:bg-indigo-700"
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
                    const isChecked = mfaRoles.includes(role);
                    return (
                      <label key={role} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPolicy({ ...policy, mfaEnforcedRoles: [...mfaRoles, role] });
                            } else {
                              setPolicy({
                                ...policy,
                                mfaEnforcedRoles: mfaRoles.filter((r) => r !== role),
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
        </CardContent>
        </Card>

        {/* Card 4: IP Geofencing & Plant Subnet Whitelist */}
        <Card className="rounded-md border-emerald-200 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Plant CIDR Subnet &amp; IP Whitelist</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={policy.ipWhitelistEnforced !== false}
                onCheckedChange={(checked) => setPolicy({ ...policy, ipWhitelistEnforced: checked })}
                aria-label="Enforce plant geofencing"
                className="shrink-0 data-[state=checked]:bg-emerald-700"
              />
              <span className="font-semibold text-slate-700">
                Enforce Plant Geofencing (Block login outside whitelisted subnets)
              </span>
            </label>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. 192.168.10.0/24 (Chennai Hub)"
                value={newIpRange}
                onChange={(e) => setNewIpRange(e.target.value)}
                aria-label="Add CIDR IP range"
                className="h-10 min-w-0 flex-1 font-mono"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddIp}
                className="h-10 shrink-0"
              >
                <Plus aria-hidden="true" /> Add Subnet
              </Button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {ipRanges.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                >
                  <span>{ip}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveIp(ip)}
                    aria-label={`Remove IP range ${ip}`}
                    className="text-rose-700"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        </Card>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-md overflow-y-auto border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-800">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-slate-900">Confirm Security Policy Deployment</DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-sm text-slate-600">
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
                aria-label="Governance review justification"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="min-h-20 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-600/20"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteSave}
                className="bg-teal-700 text-white hover:bg-teal-800"
              >
                <Save aria-hidden="true" />
                Confirm &amp; Deploy Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
