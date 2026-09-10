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

interface AdminSecurityViewProps {
  showToast?: (msg: string) => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [policy, setPolicy] = useState<SecurityPolicySettings>(mockSecurityPolicy);
  const [newIpRange, setNewIpRange] = useState('');

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Enterprise security & authentication policy successfully synchronized.');
  };

  const handleAddIp = () => {
    if (!newIpRange.trim()) return;
    setPolicy((prev) => ({
      ...prev,
      allowedIpRanges: [...prev.allowedIpRanges, newIpRange.trim()],
    }));
    setNewIpRange('');
    showToast('CIDR range added to plant IP whitelist.');
  };

  const handleRemoveIp = (ip: string) => {
    setPolicy((prev) => ({
      ...prev,
      allowedIpRanges: prev.allowedIpRanges.filter((item) => item !== ip),
    }));
    showToast(`Removed ${ip} from IP whitelist.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Cybersecurity Hardening &amp; Compliance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Security, Authentication &amp; Lockout Policies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure password strength metrics, multi-factor authentication (MFA) enforcement, session auto-lockout, and plant IP whitelists.
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          Save Security Policy
        </button>
      </div>

      <form onSubmit={handleSavePolicy} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <label className="block font-semibold text-slate-700 mb-1">Remember History Count</label>
                <input
                  type="number"
                  value={policy.enforcePasswordHistoryCount}
                  onChange={(e) => setPolicy({ ...policy, enforcePasswordHistoryCount: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Account Lockout & Brute-Force Prevention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-sm font-bold text-slate-900">Brute-Force Shield &amp; Account Lockouts</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Failed Attempts</label>
                <input
                  type="number"
                  value={policy.maxFailedAttemptsBeforeLockout}
                  onChange={(e) =>
                    setPolicy({ ...policy, maxFailedAttemptsBeforeLockout: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Locks account after X failures</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lockout Duration (Mins)</label>
                <input
                  type="number"
                  value={policy.lockoutDurationMinutes}
                  onChange={(e) => setPolicy({ ...policy, lockoutDurationMinutes: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Auto-unlock cooldown period</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terminal Idle Timeout</label>
                <input
                  type="number"
                  value={policy.sessionTimeoutMinutes}
                  onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minutes of user inactivity</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">JWT Token Life (Hours)</label>
                <input
                  type="number"
                  value={policy.jwtTokenExpiryHours}
                  onChange={(e) => setPolicy({ ...policy, jwtTokenExpiryHours: parseInt(e.target.value) || 8 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Shift expiration duration</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.singleActiveSessionPerUser}
                  onChange={(e) => setPolicy({ ...policy, singleActiveSessionPerUser: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">
                  Enforce Single Concurrent Active Session Per User
                </span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 ml-6">
                Logging in from a new machine or tablet automatically terminates previous terminal sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Multi-Factor Authentication (MFA) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Smartphone className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-sm font-bold text-slate-900">Multi-Factor Authentication (MFA) Policy</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MFA Enforcement Level</label>
              <select
                value={policy.mfaEnforcement}
                onChange={(e) => setPolicy({ ...policy, mfaEnforcement: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="Enforced for All">Enforced for All Employees (Factory &amp; Corporate)</option>
                <option value="Enforced for Admins & Finance">Enforced for Admins &amp; Finance Controllers Only</option>
                <option value="Optional">Optional (User self-enrollment)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Supported Authentication Factors:</div>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                <li>Time-based One-Time Password (TOTP via Google Authenticator, Authy, Microsoft Authenticator)</li>
                <li>SMS OTP fallback via Twilio SMS Gateway</li>
                <li>FIDO2 / WebAuthn Hardware Security Keys (YubiKey)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Card 4: IP Whitelisting & Network Fence */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-[#0F8B8D]" />
            <h2 className="text-sm font-bold text-slate-900">Plant Subnet Whitelisting (CIDR)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.ipWhitelistEnabled}
                  onChange={(e) => setPolicy({ ...policy, ipWhitelistEnabled: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="font-semibold text-slate-700">Enforce Plant Geo-Fencing &amp; Subnet Check</span>
              </label>
              <span className="text-[10px] text-slate-400">{policy.allowedIpRanges.length} Active Subnets</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newIpRange}
                onChange={(e) => setNewIpRange(e.target.value)}
                placeholder="e.g. 192.168.20.0/24"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleAddIp}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Add Subnet
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {policy.allowedIpRanges.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 font-mono text-xs"
                >
                  <span className="text-slate-800">{ip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
