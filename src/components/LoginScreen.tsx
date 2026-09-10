import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  Clock,
  KeyRound,
  CheckCircle2,
  Zap,
  Radio,
  Cpu,
  Fingerprint,
  ArrowRight,
  Server,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AuthUser } from '../types';
import { DEMO_USERS, ENTERPRISE_PLANTS, SHIFTS } from '../data/authUsers';

interface LoginScreenProps {
  onLogin: (user: AuthUser, plantId: string, shiftId: string) => void;
  lastLoggedOutUser?: AuthUser | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, lastLoggedOutUser }) => {
  const [authMode, setAuthMode] = useState<'quick' | 'credentials' | 'pin'>('quick');
  
  // Credentials State
  const [email, setEmail] = useState<string>(lastLoggedOutUser?.email || 'priya.rao@reboot-erp.com');
  const [password, setPassword] = useState<string>('Reboot2026!#');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberTerminal, setRememberTerminal] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selected Plant & Shift
  const [selectedPlant, setSelectedPlant] = useState<string>(lastLoggedOutUser?.plantId || 'PLANT-01');
  const [selectedShift, setSelectedShift] = useState<string>(
    lastLoggedOutUser?.shift ? (SHIFTS.find(s => s.name === lastLoggedOutUser.shift)?.id || 'SHIFT-A') : 'SHIFT-A'
  );

  // Operator PIN state
  const [pinDigits, setPinDigits] = useState<string>('');
  const [selectedOperatorUser, setSelectedOperatorUser] = useState<AuthUser>(
    DEMO_USERS.find(u => u.roleType === 'operator') || DEMO_USERS[0]
  );

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    setTimeout(() => {
      const foundUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (foundUser) {
        setIsLoading(false);
        const shiftObj = SHIFTS.find(s => s.id === selectedShift);
        const plantObj = ENTERPRISE_PLANTS.find(p => p.id === selectedPlant);
        
        onLogin(
          {
            ...foundUser,
            plantId: selectedPlant,
            plantName: plantObj?.name || foundUser.plantName,
            shift: shiftObj?.name || foundUser.shift
          },
          selectedPlant,
          selectedShift
        );
      } else {
        // If custom user email, allow seamless enterprise sign-in as custom manager
        const plantObj = ENTERPRISE_PLANTS.find(p => p.id === selectedPlant);
        const shiftObj = SHIFTS.find(s => s.id === selectedShift);
        const customUser: AuthUser = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email: email.trim(),
          role: 'Plant System Engineer',
          roleType: 'admin',
          department: 'Operations & Engineering',
          plantId: selectedPlant,
          plantName: plantObj?.name || 'Plant 01 — Pune / Chakan Hub',
          shift: shiftObj?.name || 'Shift A — Morning',
          badgeId: `OPR-${Math.floor(100 + Math.random() * 900)}`,
          pin: '1234',
          avatarColor: 'from-[#0F8B8D] to-[#14213D]',
          initials: email.slice(0, 2).toUpperCase(),
          permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance']
        };
        setIsLoading(false);
        onLogin(customUser, selectedPlant, selectedShift);
      }
    }, 450);
  };

  const handleQuickLogin = (user: AuthUser) => {
    setIsLoading(true);
    setTimeout(() => {
      const shiftObj = SHIFTS.find(s => s.id === selectedShift);
      const plantObj = ENTERPRISE_PLANTS.find(p => p.id === selectedPlant);
      setIsLoading(false);
      onLogin(
        {
          ...user,
          plantId: selectedPlant,
          plantName: plantObj?.name || user.plantName,
          shift: shiftObj?.name || user.shift
        },
        selectedPlant,
        selectedShift
      );
    }, 250);
  };

  const handlePinKey = (digit: string) => {
    if (pinDigits.length < 4) {
      const newPin = pinDigits + digit;
      setPinDigits(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const verifyPin = (pin: string) => {
    setIsLoading(true);
    setAuthError(null);
    setTimeout(() => {
      const user = DEMO_USERS.find(u => u.id === selectedOperatorUser.id);
      if (user && (user.pin === pin || pin === '1234' || pin === '0000')) {
        setIsLoading(false);
        const shiftObj = SHIFTS.find(s => s.id === selectedShift);
        const plantObj = ENTERPRISE_PLANTS.find(p => p.id === selectedPlant);
        onLogin(
          {
            ...user,
            plantId: selectedPlant,
            plantName: plantObj?.name || user.plantName,
            shift: shiftObj?.name || user.shift
          },
          selectedPlant,
          selectedShift
        );
      } else {
        setIsLoading(false);
        setAuthError(`Invalid PIN for ${selectedOperatorUser.name}. (Demo PIN: ${selectedOperatorUser.pin})`);
        setPinDigits('');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-[#0E172A] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#E8622C] selection:text-white relative overflow-hidden">
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Glowing atmospheric spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0F8B8D]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E8622C]/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-[#14213D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Industrial ERP Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#101B33] via-[#14213D] to-[#0A1120] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F8B8D] via-[#E8622C] to-[#0F8B8D]" />

          <div>
            {/* Logo & System Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8622C] to-[#C44312] flex items-center justify-center shadow-lg shadow-[#E8622C]/20 text-white">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  REBOOT<span className="text-[#E8622C]">ERP</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#0F8B8D]/20 text-[#38BDF8] border border-[#0F8B8D]/40 rounded">ERP 4.0</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] font-medium">
                  Plastic Injection & Extrusion MES Suite
                </div>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed mb-6">
              Next-generation unified manufacturing execution, recipe management, multi-cavity mold telemetry, and real-time shop floor dispatching.
            </p>

            {/* Industrial Telemetry Widget */}
            <div className="space-y-2.5 mb-6 bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Shop Floor Connectivity
                </span>
                <span className="text-emerald-400 font-mono">100% OPERATIONAL</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-[#0A1120]/60 p-2 rounded-lg border border-white/5 text-center">
                  <div className="text-[10px] text-[#94A3B8]">Active Presses</div>
                  <div className="text-sm font-bold text-white font-mono">8 / 8 IMM</div>
                </div>
                <div className="bg-[#0A1120]/60 p-2 rounded-lg border border-white/5 text-center">
                  <div className="text-[10px] text-[#94A3B8]">Shift OEE</div>
                  <div className="text-sm font-bold text-[#38BDF8] font-mono">88.4%</div>
                </div>
                <div className="bg-[#0A1120]/60 p-2 rounded-lg border border-white/5 text-center">
                  <div className="text-[10px] text-[#94A3B8]">Open WOs</div>
                  <div className="text-sm font-bold text-[#E8622C] font-mono">12 Active</div>
                </div>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="space-y-2 text-[11px] text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>IATF 16949 & ISO 9001:2015 Audit Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Euromap 63 / 77 Machine Protocol Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>Angular 18 Enterprise Migration Ready</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Terminal: IMM-CONSOLE-01</span>
            <span className="font-mono">v4.8.2-PROD</span>
          </div>
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="lg:col-span-7 bg-[#101B33] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header with Plant & Shift Pickers */}
            <div className="mb-5">
              {/* Instant 1-Click Launch Bar */}
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-900/60 via-[#18233D] to-teal-900/60 border border-indigo-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Live Demo Ready:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(DEMO_USERS[0])}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#D35422] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡ Enter Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hrUser = DEMO_USERS.find(u => u.roleType === 'hr') || DEMO_USERS[0];
                      handleQuickLogin(hrUser);
                    }}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>👥 Enter HRMS</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#E8622C]" />
                  Sign In to Terminal
                </h2>
                <div className="flex items-center gap-1 bg-[#1E293B] border border-white/10 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => { setAuthMode('quick'); setAuthError(null); }}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      authMode === 'quick' ? 'bg-[#E8622C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Quick Roles
                  </button>
                  <button
                    onClick={() => { setAuthMode('credentials'); setAuthError(null); }}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      authMode === 'credentials' ? 'bg-[#E8622C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Credentials
                  </button>
                  <button
                    onClick={() => { setAuthMode('pin'); setAuthError(null); }}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      authMode === 'pin' ? 'bg-[#E8622C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Operator PIN
                  </button>
                </div>
              </div>

              {/* Plant & Shift Selection Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
                <div>
                  <label className="text-[10.5px] uppercase font-bold tracking-wider text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3 h-3 text-[#0F8B8D]" />
                    Manufacturing Plant
                  </label>
                  <select
                    value={selectedPlant}
                    onChange={(e) => setSelectedPlant(e.target.value)}
                    className="w-full bg-[#1A2642] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E8622C]"
                  >
                    {ENTERPRISE_PLANTS.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] uppercase font-bold tracking-wider text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-[#E8622C]" />
                    Operating Shift
                  </label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="w-full bg-[#1A2642] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E8622C]"
                  >
                    {SHIFTS.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {/* MODE 1: 1-Click Role Switcher */}
            {authMode === 'quick' && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Select Enterprise Persona (1-Click Instant Demo Login)
                  </span>
                  <span className="text-[11px] text-[#38BDF8] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> All modules unlocked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickLogin(user)}
                      disabled={isLoading}
                      className="group p-3 rounded-xl bg-[#18233D] hover:bg-[#1E2D4E] border border-white/5 hover:border-[#E8622C]/40 transition-all text-left flex items-center gap-3 relative overflow-hidden disabled:opacity-50"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        {user.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                          <span>{user.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-[#94A3B8]">
                            PIN: {user.pin}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] truncate">{user.role}</div>
                        <div className="text-[10px] text-[#64748B] truncate">{user.department}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 text-[#E8622C]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODE 2: Credentials Form */}
            {authMode === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Corporate Email / SSO Identity
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. priya.rao@reboot-erp.com"
                      className="w-full bg-[#18233D] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#E8622C]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#CBD5E1]">
                      Password / AD Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthError('Demo notice: You can use any password or click Quick Roles above.')}
                      className="text-[11px] text-[#38BDF8] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full bg-[#18233D] border border-white/10 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#E8622C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberTerminal}
                      onChange={(e) => setRememberTerminal(e.target.checked)}
                      className="rounded border-white/20 bg-[#18233D] text-[#E8622C] focus:ring-0"
                    />
                    <span>Remember terminal authentication</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> SSL 256-Bit
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#E8622C] hover:bg-[#C44312] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Authenticating System...</span>
                  ) : (
                    <>
                      <span>Sign In to Plant Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 3: Operator PIN / Badge Keypad */}
            {authMode === 'pin' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs text-[#94A3B8] flex-1">
                    Select Operator Badge:
                  </div>
                  <select
                    value={selectedOperatorUser.id}
                    onChange={(e) => {
                      const user = DEMO_USERS.find(u => u.id === e.target.value);
                      if (user) {
                        setSelectedOperatorUser(user);
                        setPinDigits('');
                        setAuthError(null);
                      }
                    }}
                    className="bg-[#18233D] border border-white/10 rounded-md px-2 py-1 text-xs text-white"
                  >
                    {DEMO_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleType.toUpperCase()} - {u.badgeId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN Display */}
                <div className="bg-[#18233D] border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-[10.5px] text-[#94A3B8] mb-1">
                    Enter 4-Digit Security PIN for <span className="text-white font-bold">{selectedOperatorUser.name}</span> (Demo PIN: <span className="font-mono text-[#E8622C]">{selectedOperatorUser.pin}</span>)
                  </div>
                  <div className="flex justify-center gap-3 my-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-base transition-all ${
                          pinDigits[idx]
                            ? 'bg-[#E8622C]/20 border-[#E8622C] text-white shadow-xs'
                            : 'bg-[#0A1120] border-white/10 text-white/20'
                        }`}
                      >
                        {pinDigits[idx] ? '●' : '—'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinKey(digit)}
                      className="py-2.5 rounded-lg bg-[#18233D] hover:bg-[#223154] active:bg-[#E8622C] border border-white/5 text-sm font-bold text-white transition-all shadow-xs"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setPinDigits(''); setAuthError(null); }}
                    className="py-2.5 rounded-lg bg-[#18233D] hover:bg-rose-900/30 border border-white/5 text-xs font-semibold text-rose-400 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinKey('0')}
                    className="py-2.5 rounded-lg bg-[#18233D] hover:bg-[#223154] border border-white/5 text-sm font-bold text-white transition-all shadow-xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => verifyPin(pinDigits)}
                    disabled={pinDigits.length !== 4}
                    className="py-2.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0C6E70] disabled:opacity-40 border border-white/5 text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    Enter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick SSO & Help Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Plant Network Security: ISO 27001 Enforced</span>
            </div>
            <button
              onClick={() => handleQuickLogin(DEMO_USERS[0])}
              className="text-[#38BDF8] hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-[#E8622C]" /> Bypass to Admin Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
