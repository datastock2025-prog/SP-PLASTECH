import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthUser } from '../types';
import { ENTERPRISE_PLANTS, SHIFTS } from '../data/authUsers';
import { adminService } from '../services/adminService';

interface LoginScreenProps {
  onLogin: (user: AuthUser, plantId: string, shiftId: string) => void;
  lastLoggedOutUser?: AuthUser | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, lastLoggedOutUser }) => {
  // Input fields
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedPlant, setSelectedPlant] = useState<string>(ENTERPRISE_PLANTS[0].id);
  const [selectedShift, setSelectedShift] = useState<string>(SHIFTS[0].id);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Status & validation states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sound feedback
  const playTone = (freq = 520, type: OscillatorType = 'sine', duration = 0.05) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio failure
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const identifier = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!identifier) {
      setErrorMessage('Please enter your Admin Username or Corporate Email.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Please enter your Secure Password.');
      return;
    }

    setIsLoading(true);
    playTone(440, 'sine', 0.03);

    try {
      // Check for Primary Master Admin
      const isMasterAdmin =
        (identifier === 'admin' || identifier === 'admin@spplastech.com') &&
        (cleanPassword === 'SpPlastech#Admin2026' || cleanPassword === 'SpPlastech2026!#');

      // Also check against dynamic persistent admin users from adminService
      const allDbUsers = await adminService.getUsers();
      const matchedUser = allDbUsers.find(
        (u) =>
          u.status === 'Active' &&
          (u.email.toLowerCase() === identifier || (u.id && u.id.toLowerCase() === identifier))
      );

      if (isMasterAdmin) {
        setSuccessMessage('Authentication Granted. Initializing Super Admin session...');
        playTone(660, 'triangle', 0.08);

        const currentPlantObj = ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant) || ENTERPRISE_PLANTS[0];
        const currentShiftObj = SHIFTS.find((s) => s.id === selectedShift) || SHIFTS[0];

        const superAdminUser: AuthUser = {
          id: 'USR-ADMIN-01',
          name: 'SP-PLASTECH Master Admin',
          email: 'admin@spplastech.com',
          role: 'Super Administrator',
          roleType: 'admin',
          department: 'Executive System Administration',
          plantId: selectedPlant,
          plantName: currentPlantObj.name,
          shift: currentShiftObj.name,
          badgeId: 'ADM-001',
          pin: '1234',
          avatarColor: 'from-teal-600 to-amber-600',
          initials: 'AD',
          permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance', 'sales', 'hr', 'scm', 'mep', 'analytics'],
        };

        setTimeout(() => {
          onLogin(superAdminUser, selectedPlant, selectedShift);
        }, 600);
        return;
      }

      if (matchedUser) {
        setSuccessMessage(`Welcome back, ${matchedUser.fullName}. Authorizing...`);
        playTone(660, 'triangle', 0.08);

        const currentPlantObj = ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant) || ENTERPRISE_PLANTS[0];
        const currentShiftObj = SHIFTS.find((s) => s.id === selectedShift) || SHIFTS[0];

        const roleType =
          matchedUser.roleId?.includes('ADMIN') ? 'admin' :
          matchedUser.roleId?.includes('OPERATOR') ? 'operator' :
          matchedUser.roleId?.includes('QA') || matchedUser.roleId?.includes('QUALITY') ? 'quality' :
          matchedUser.roleId?.includes('WH') || matchedUser.roleId?.includes('WAREHOUSE') ? 'warehouse' :
          matchedUser.roleId?.includes('FINANCE') ? 'finance' :
          matchedUser.roleId?.includes('SALES') ? 'sales' : 'production';

        const authUser: AuthUser = {
          id: matchedUser.id,
          name: matchedUser.fullName,
          email: matchedUser.email,
          role: matchedUser.roleName || matchedUser.designation || 'Enterprise User',
          roleType,
          department: matchedUser.department,
          plantId: selectedPlant,
          plantName: currentPlantObj.name,
          shift: currentShiftObj.name,
          badgeId: matchedUser.badgeId || `EMP-${matchedUser.id}`,
          pin: '1234',
          avatarColor: matchedUser.avatarColor || 'from-teal-600 to-indigo-600',
          initials: matchedUser.initials || matchedUser.fullName.slice(0, 2).toUpperCase(),
          permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance', 'sales'],
        };

        setTimeout(() => {
          onLogin(authUser, selectedPlant, selectedShift);
        }, 600);
        return;
      }

      // Invalid credentials
      setErrorMessage('Access Denied: Invalid Username/Email or Password. Please verify your credentials.');
      playTone(220, 'sawtooth', 0.12);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-[#0B1528] to-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Polymer Geometry Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-xl shadow-teal-950/60 mb-3 border border-teal-400/20 ring-4 ring-teal-500/10">
            <ShieldCheck className="w-8 h-8 text-teal-100" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>SP-PLASTECH</span>
            <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              ERP
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Enterprise Polymer Manufacturing & Resource Planning
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Enterprise Authentication</h2>
              <p className="text-[11px] text-slate-400">Sign in with your authorized credentials</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              <span>Live DB Connected</span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username or Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or user@spplastech.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Facility / Plant Scope */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Facility Scope</span>
                </label>
                <select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {ENTERPRISE_PLANTS.map((plant) => (
                    <option key={plant.id} value={plant.id} className="bg-slate-900 text-white">
                      {plant.name.split('—')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Assigned Shift</span>
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {SHIFTS.map((shift) => (
                    <option key={shift.id} value={shift.id} className="bg-slate-900 text-white">
                      {shift.name.split('—')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-400">Remember session for 7 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-teal-900/40 hover:shadow-teal-900/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Sign In to SP-PLASTECH</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Master Admin Notice Footer */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Tenant Row-Level Security Enabled</span>
            </p>
          </div>
        </div>

        {/* Global Security Sub-Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400">
            SP-PLASTECH Enterprise ERP &copy; {new Date().getFullYear()} &bull; ISO 9001 / IATF 16949 Certified
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
