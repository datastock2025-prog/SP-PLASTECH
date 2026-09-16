import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Cpu,
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
  Fingerprint,
  ArrowRight,
  ArrowLeft,
  Server,
  Sparkles,
  AlertCircle,
  QrCode,
  Search,
  UserCheck,
  Volume2,
  VolumeX,
  Smartphone,
  Check,
  RotateCcw,
  BadgeCheck,
  Compass,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AuthUser } from '../types';
import { DEMO_USERS, ENTERPRISE_PLANTS, SHIFTS } from '../data/authUsers';

interface LoginScreenProps {
  onLogin: (user: AuthUser, plantId: string, shiftId: string) => void;
  lastLoggedOutUser?: AuthUser | null;
}

// Cached AudioContext singleton to eliminate tab switching latency & audio thread lock
let globalAudioCtx: AudioContext | null = null;
const playHapticTone = (freq = 440, type: OscillatorType = 'sine', duration = 0.04) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    const ctx = globalAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Graceful fallback if audio is restricted by browser policy
  }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, lastLoggedOutUser }) => {
  // Navigation & Mode State
  const [authMode, setAuthMode] = useState<'quick' | 'operator' | 'credentials'>('quick');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Live Clock & Auto-detected shift
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active shift based on current time
  const autoShiftId = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 14) return 'SHIFT-A';
    if (hour >= 14 && hour < 22) return 'SHIFT-B';
    return 'SHIFT-C';
  }, [currentTime]);

  // Plant & Shift Selection
  const [selectedPlant, setSelectedPlant] = useState<string>(lastLoggedOutUser?.plantId || 'PLANT-01');
  const [selectedShift, setSelectedShift] = useState<string>(
    lastLoggedOutUser?.shift
      ? SHIFTS.find((s) => s.name === lastLoggedOutUser.shift)?.id || autoShiftId
      : autoShiftId
  );
  const [showPlantShiftPicker, setShowPlantShiftPicker] = useState<boolean>(false);

  // Credentials State
  const [email, setEmail] = useState<string>(lastLoggedOutUser?.email || 'priya.rao@reboot-erp.com');
  const [password, setPassword] = useState<string>('Reboot2026!#');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [rememberTerminal, setRememberTerminal] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick Persona Search & Filtering
  const [searchPersona, setSearchPersona] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Password verification state when a persona is clicked
  const [selectedPersonaForAuth, setSelectedPersonaForAuth] = useState<AuthUser | null>(null);
  const [personaPassword, setPersonaPassword] = useState<string>('');
  const [showPersonaPassword, setShowPersonaPassword] = useState<boolean>(false);
  const [personaAuthError, setPersonaAuthError] = useState<string | null>(null);
  const personaPasswordInputRef = useRef<HTMLInputElement>(null);

  // Focus password input when persona is selected
  useEffect(() => {
    if (selectedPersonaForAuth) {
      setTimeout(() => {
        personaPasswordInputRef.current?.focus();
      }, 50);
    }
  }, [selectedPersonaForAuth]);

  // Operator PIN & Badge State
  const [selectedOperator, setSelectedOperator] = useState<AuthUser>(
    DEMO_USERS.find((u) => u.roleType === 'operator') || DEMO_USERS[0]
  );
  const [pinDigits, setPinDigits] = useState<string>('');
  const [isScanningRfid, setIsScanningRfid] = useState<boolean>(false);

  const departments = useMemo(() => {
    const deps = Array.from(new Set(DEMO_USERS.map((u) => u.department.split(' ')[0])));
    return ['All', ...deps];
  }, []);

  const filteredUsers = useMemo(() => {
    return DEMO_USERS.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchPersona.toLowerCase()) ||
        u.role.toLowerCase().includes(searchPersona.toLowerCase()) ||
        u.department.toLowerCase().includes(searchPersona.toLowerCase()) ||
        u.badgeId.toLowerCase().includes(searchPersona.toLowerCase());
      const matchesDept =
        departmentFilter === 'All' || u.department.toLowerCase().includes(departmentFilter.toLowerCase());
      return matchesSearch && matchesDept;
    });
  }, [searchPersona, departmentFilter]);

  // Execute Final Login Handshake
  const executeLogin = (user: AuthUser) => {
    if (soundEnabled) requestAnimationFrame(() => playHapticTone(880, 'sine', 0.05));
    setIsLoading(true);

    setTimeout(() => {
      const shiftObj = SHIFTS.find((s) => s.id === selectedShift);
      const plantObj = ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant);
      setIsLoading(false);

      onLogin(
        {
          ...user,
          plantId: selectedPlant,
          plantName: plantObj?.name || user.plantName,
          shift: shiftObj?.name || user.shift,
        },
        selectedPlant,
        selectedShift
      );
    }, 100);
  };

  // Select a persona card and prompt for password
  const handleSelectPersona = (user: AuthUser) => {
    setSelectedPersonaForAuth(user);
    setPersonaPassword('');
    setPersonaAuthError(null);
    setAuthError(null);
    if (soundEnabled) requestAnimationFrame(() => playHapticTone(600, 'sine', 0.03));
  };

  // Handle password submission for selected persona
  const handlePersonaPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonaForAuth) return;
    setPersonaAuthError(null);

    const cleanInput = personaPassword.trim();
    if (!cleanInput) {
      setPersonaAuthError(`Please enter password or PIN for ${selectedPersonaForAuth.name}.`);
      return;
    }

    // Accept user's PIN, Reboot2026!#, 1234, admin, password, or role name
    const isValid =
      cleanInput === selectedPersonaForAuth.pin ||
      cleanInput === 'Reboot2026!#' ||
      cleanInput === '1234' ||
      cleanInput.toLowerCase() === 'password' ||
      cleanInput.toLowerCase() === 'admin' ||
      cleanInput.toLowerCase() === selectedPersonaForAuth.roleType.toLowerCase() ||
      cleanInput.replace(/\D/g, '') === selectedPersonaForAuth.pin;

    if (isValid) {
      executeLogin(selectedPersonaForAuth);
    } else {
      if (soundEnabled) requestAnimationFrame(() => playHapticTone(220, 'sawtooth', 0.12));
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      setPersonaAuthError(
        `Incorrect password or PIN for ${selectedPersonaForAuth.name} (${selectedPersonaForAuth.role}). Hint: PIN is ${selectedPersonaForAuth.pin} or default 'Reboot2026!#'`
      );
    }
  };

  // Submit Corporate Credentials
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanPass = password.trim();
    if (!cleanPass) {
      setAuthError('Password is required for corporate authentication.');
      return;
    }

    setIsLoading(true);
    if (soundEnabled) requestAnimationFrame(() => playHapticTone(520, 'triangle', 0.05));

    setTimeout(() => {
      const foundUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (foundUser) {
        const passMatches =
          cleanPass === foundUser.pin ||
          cleanPass === 'Reboot2026!#' ||
          cleanPass === '1234' ||
          cleanPass.toLowerCase() === 'password' ||
          cleanPass.toLowerCase() === 'admin';

        if (!passMatches) {
          setAuthError(`Authentication failed: Incorrect password for ${foundUser.email}. Try 'Reboot2026!#' or PIN ${foundUser.pin}.`);
          setIsLoading(false);
          return;
        }
        executeLogin(foundUser);
      } else {
        const plantObj = ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant);
        const shiftObj = SHIFTS.find((s) => s.id === selectedShift);
        const customUser: AuthUser = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: (email.split('@')[0] || 'Enterprise User').replace('.', ' ').toUpperCase(),
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
          initials: (email || 'EU').slice(0, 2).toUpperCase(),
          permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance'],
        };
        executeLogin(customUser);
      }
    }, 120);
  };

  // Operator PIN Keypad Handlers
  const handlePinKey = (digit: string) => {
    if (soundEnabled) playHapticTone(600, 'sine', 0.03);
    if (navigator.vibrate) navigator.vibrate(20);

    if (pinDigits.length < 4) {
      const updated = pinDigits + digit;
      setPinDigits(updated);
      if (updated.length === 4) {
        verifyPin(updated);
      }
    }
  };

  const handlePinDelete = () => {
    if (soundEnabled) playHapticTone(350, 'sawtooth', 0.04);
    setPinDigits((prev) => prev.slice(0, -1));
    setAuthError(null);
  };

  const verifyPin = (pin: string) => {
    setIsLoading(true);
    setAuthError(null);

    setTimeout(() => {
      const valid =
        selectedOperator.pin === pin ||
        pin === '1234' ||
        pin === '0000' ||
        pin === selectedOperator.badgeId.replace(/\D/g, '');

      if (valid) {
        executeLogin(selectedOperator);
      } else {
        if (soundEnabled) playHapticTone(220, 'square', 0.15);
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        setIsLoading(false);
        setAuthError(`Invalid PIN for ${selectedOperator.name}. Try ${selectedOperator.pin}`);
        setPinDigits('');
      }
    }, 280);
  };

  // Simulate RFID Badge Tap / Barcode Laser Scan
  const simulateRfidBadgeScan = () => {
    setIsScanningRfid(true);
    setAuthError(null);
    if (soundEnabled) playHapticTone(750, 'sine', 0.08);

    setTimeout(() => {
      setIsScanningRfid(false);
      executeLogin(selectedOperator);
    }, 650);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-100 flex flex-col justify-between font-sans selection:bg-[#E8622C] selection:text-white relative overflow-x-hidden">
      {/* Background Micro-Grid & Ambient Accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#0F8B8D]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#E8622C]/15 blur-3xl pointer-events-none" />

      {/* Top Universal Navbar */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-[#0E172A]/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8622C] to-[#C44312] flex items-center justify-center shadow-md shadow-[#E8622C]/20 text-white font-black text-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white font-['Space_Grotesk']">
                REBOOT<span className="text-[#E8622C]">ERP</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-[#0F8B8D]/20 text-[#38BDF8] border border-[#0F8B8D]/40 rounded font-bold">
                MES 4.0
              </span>
            </div>
          </div>
        </div>

        {/* Global Plant & Shift Indicator & Audio Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Plant & Shift Pill (Clickable) */}
          <button
            type="button"
            onClick={() => setShowPlantShiftPicker((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 transition text-[11px] shadow-2xs"
            title="Click to change operating Plant or Shift"
          >
            <Building2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span className="hidden md:inline font-medium">
              {ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant)?.name.split('—')[0].trim()}
            </span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <Clock className="w-3 h-3 text-[#E8622C]" />
            <span className="font-mono text-[#38BDF8]">
              {SHIFTS.find((s) => s.id === selectedShift)?.name.split('—')[0].trim()}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                showPlantShiftPicker ? 'rotate-90' : ''
              }`}
            />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-teal-400 hover:text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Keypad Sound Enabled' : 'Keypad Sound Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Floating Plant & Shift Modal / Dropdown */}
      {showPlantShiftPicker && (
        <div className="relative z-30 max-w-4xl mx-auto w-full px-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0F8B8D]" />
                <span className="font-bold text-white font-['Space_Grotesk']">
                  Configure Terminal Work Station Context
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPlantShiftPicker(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10.5px] uppercase font-bold text-slate-400 mb-1.5 block">
                  Manufacturing Facility / Site
                </label>
                <div className="space-y-1.5">
                  {ENTERPRISE_PLANTS.map((plant) => (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() => setSelectedPlant(plant.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between transition ${
                        selectedPlant === plant.id
                          ? 'bg-[#0F8B8D]/20 border-[#0F8B8D] text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{plant.name}</div>
                        <div className="text-[10px] text-slate-400">{plant.location}</div>
                      </div>
                      {selectedPlant === plant.id && (
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10.5px] uppercase font-bold text-slate-400 mb-1.5 block flex items-center justify-between">
                  <span>Operating Shift</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Auto-Detected: {SHIFTS.find((s) => s.id === autoShiftId)?.name.split('—')[0]}
                  </span>
                </label>
                <div className="space-y-1.5">
                  {SHIFTS.map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => setSelectedShift(shift.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between transition ${
                        selectedShift === shift.id
                          ? 'bg-[#E8622C]/20 border-[#E8622C] text-white shadow-xs'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{shift.name}</div>
                        <div className="text-[10px] text-slate-400">Lead: {shift.lead}</div>
                      </div>
                      {selectedShift === shift.id && (
                        <Check className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Responsive Body Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-5 lg:p-8 w-full max-w-6xl mx-auto">
        <div className="w-full bg-[#111C35]/95 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl">
          {/* ============================================================ */}
          {/* LEFT PANEL: Telemetry, Production Pulse, Terminal Context  */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0F1A30] via-[#111C35] to-[#0A1020] p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between relative">
            <div className="space-y-5">
              {/* Plant Status Header */}
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE FACTORY GATEWAY</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Space_Grotesk'] leading-snug">
                  Smart Factory MES & Operations Command
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Precision injection molding, automated recipe explosion, real-time machine telemetry, and digital traveler dispatching.
                </p>
              </div>

              {/* Live Plant Telemetry Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-teal-400" />
                    IMM Machine Bays Telemetry
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">100% ONLINE</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Presses</div>
                    <div className="text-sm font-bold text-white font-mono">8 / 8 Active</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Shift OEE</div>
                    <div className="text-sm font-bold text-teal-300 font-mono">89.2%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Open WOs</div>
                    <div className="text-sm font-bold text-[#E8622C] font-mono">14 Queue</div>
                  </div>
                </div>
              </div>

              {/* Station Hardware & Compliance Metadata */}
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>IATF 16949 & ISO 9001:2015 Audit Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#E8622C] shrink-0" />
                  <span>Euromap 63 / 77 Injection Molding Protocol Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Zero-Trust Role-Based Terminal Access (RBAC)</span>
                </div>
              </div>
            </div>

            {/* Bottom Terminal Footnote */}
            <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                STATION: IMM-GATE-01
              </span>
              <span>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANEL: Authentication Modes & Interactive Touch Pad     */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 bg-[#0E172A] p-5 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Mode Segmented Switcher (Quick / Operator / Credentials) */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('quick');
                    setSelectedPersonaForAuth(null);
                    setPersonaPassword('');
                    setPersonaAuthError(null);
                    setAuthError(null);
                    if (soundEnabled) requestAnimationFrame(() => playHapticTone(500, 'sine', 0.02));
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    authMode === 'quick'
                      ? 'bg-[#E8622C] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>1-Tap Persona</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('operator');
                    setSelectedPersonaForAuth(null);
                    setPersonaPassword('');
                    setPersonaAuthError(null);
                    setAuthError(null);
                    if (soundEnabled) requestAnimationFrame(() => playHapticTone(500, 'sine', 0.02));
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    authMode === 'operator'
                      ? 'bg-[#0F8B8D] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Operator Touch</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('credentials');
                    setSelectedPersonaForAuth(null);
                    setPersonaPassword('');
                    setPersonaAuthError(null);
                    setAuthError(null);
                    if (soundEnabled) requestAnimationFrame(() => playHapticTone(500, 'sine', 0.02));
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    authMode === 'credentials'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Password / SSO</span>
                </button>
              </div>

              {/* Error Notification Alert */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {/* ============================================================ */}
              {/* MODE 1: 1-Tap Quick Roles with Department Filtering         */}
              {/* ============================================================ */}
              {authMode === 'quick' && (
                selectedPersonaForAuth ? (
                  /* Persona Password Verification View */
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl space-y-4 animate-in fade-in duration-150">
                    {/* Back header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPersonaForAuth(null);
                          setPersonaPassword('');
                          setPersonaAuthError(null);
                          if (soundEnabled) requestAnimationFrame(() => playHapticTone(400, 'sine', 0.02));
                        }}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Persona / Role</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10.5px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                          Role Security Verification
                        </span>
                      </div>
                    </div>

                    {/* Selected User Identity Banner */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedPersonaForAuth.avatarColor} flex items-center justify-center text-sm font-black text-white shadow-md shrink-0`}
                      >
                        {selectedPersonaForAuth.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{selectedPersonaForAuth.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {selectedPersonaForAuth.badgeId}
                          </span>
                        </div>
                        <div className="text-xs text-teal-300 font-semibold truncate">
                          {selectedPersonaForAuth.role}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span>{selectedPersonaForAuth.department}</span>
                          <span>&bull;</span>
                          <span className="text-[#E8622C] font-medium">
                            {ENTERPRISE_PLANTS.find((p) => p.id === selectedPlant)?.name.split('—')[0] || selectedPlant}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Password Authentication Error */}
                    {personaAuthError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span className="leading-snug">{personaAuthError}</span>
                      </div>
                    )}

                    {/* Form for Password Entry */}
                    <form onSubmit={handlePersonaPasswordSubmit} className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-slate-300">
                            Enter Password or Security PIN for <span className="text-white font-bold">{selectedPersonaForAuth.name}</span>:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPersonaPassword(selectedPersonaForAuth.pin);
                              setPersonaAuthError(null);
                            }}
                            className="text-[11px] text-[#E8622C] hover:text-[#ff7b47] font-semibold underline decoration-dotted cursor-pointer transition"
                            title="Click to auto-fill default demo credentials"
                          >
                            Quick-Fill PIN
                          </button>
                        </div>

                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            ref={personaPasswordInputRef}
                            type={showPersonaPassword ? 'text' : 'password'}
                            value={personaPassword}
                            onChange={(e) => {
                              setPersonaPassword(e.target.value);
                              setPersonaAuthError(null);
                            }}
                            placeholder={`Enter security passcode or PIN (${selectedPersonaForAuth.pin})...`}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E8622C] shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPersonaPassword(!showPersonaPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPersonaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                          <span>
                            Default pass: <code className="text-teal-300 font-mono font-bold">Reboot2026!#</code> or PIN <code className="text-amber-300 font-mono font-bold">{selectedPersonaForAuth.pin}</code>
                          </span>
                          <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10.5px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> RBAC Protected
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPersonaForAuth(null);
                            setPersonaPassword('');
                            setPersonaAuthError(null);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition text-center cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={isLoading || !personaPassword.trim()}
                          className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E8622C] to-[#d85520] hover:from-[#f06d37] hover:to-[#e25f2a] text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? (
                            <span>Authenticating Role...</span>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Verify &amp; Authorize [{selectedPersonaForAuth.role.split('&')[0].trim()}]</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Persona List View */
                  <div className="space-y-3">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search name, role, badge or department..."
                          value={searchPersona}
                          onChange={(e) => setSearchPersona(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E8622C]"
                        />
                      </div>
                      {/* Department Quick Filter Pills */}
                      <div
                        className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar pb-0.5"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setDepartmentFilter(dept);
                              if (soundEnabled) requestAnimationFrame(() => playHapticTone(500, 'sine', 0.02));
                            }}
                            className={`px-2 py-1 rounded-md text-[10.5px] font-semibold whitespace-nowrap transition cursor-pointer ${
                              departmentFilter === dept
                                ? 'bg-[#E8622C] text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Persona Cards Grid */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-none no-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectPersona(user)}
                          disabled={isLoading}
                          className="group p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-[#E8622C]/40 transition text-left flex items-center gap-2.5 relative overflow-hidden active:scale-[0.99] cursor-pointer"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-xs font-black text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                          >
                            {user.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                              <span>{user.name}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {user.badgeId}
                              </span>
                            </div>
                            <div className="text-[11px] text-teal-300 font-medium truncate">
                              {user.role}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{user.department}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-slate-500 group-hover:text-[#E8622C] transition">
                            <Lock className="w-3 h-3 text-slate-500 group-hover:text-[#E8622C]" />
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* ============================================================ */}
              {/* MODE 2: Operator Touch Pad (Large Tactile Keypad & RFID)      */}
              {/* ============================================================ */}
              {authMode === 'operator' && (
                <div className="space-y-3">
                  {/* Operator Badge Selection & RFID Tap Banner */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedOperator.avatarColor} flex items-center justify-center text-sm font-black text-white shadow`}
                      >
                        {selectedOperator.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{selectedOperator.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[9.5px] font-mono font-bold">
                            {selectedOperator.badgeId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{selectedOperator.role}</div>
                      </div>
                    </div>

                    {/* Badge / Operator Selector Picker */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedOperator.id}
                        onChange={(e) => {
                          const found = DEMO_USERS.find((u) => u.id === e.target.value);
                          if (found) {
                            setSelectedOperator(found);
                            setPinDigits('');
                            setAuthError(null);
                          }
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {DEMO_USERS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.badgeId})
                          </option>
                        ))}
                      </select>

                      {/* Instant RFID Scanner Simulation Button */}
                      <button
                        type="button"
                        onClick={simulateRfidBadgeScan}
                        disabled={isScanningRfid || isLoading}
                        className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
                        title="Simulate scanning RFID NFC badge or barcode"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {isScanningRfid ? 'Reading...' : 'Tap Badge'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 4-PIN Visual Indicator */}
                  <div className="text-center">
                    <div className="text-[11px] text-slate-400 mb-1">
                      Enter Security PIN for <span className="font-bold text-white">{selectedOperator.name}</span>{' '}
                      <span className="text-teal-400 font-mono">(Demo PIN: {selectedOperator.pin})</span>
                    </div>
                    <div className="flex justify-center items-center gap-3 my-1">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-lg transition-all ${
                            pinDigits[idx]
                              ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm shadow-teal-500/20 scale-105'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                        >
                          {pinDigits[idx] ? '●' : '—'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High-Target Touch Keypad (Gloves-Ready touch targets >= 44px) */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinKey(digit)}
                        className="h-12 sm:h-13 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-teal-600 border border-slate-800 text-base font-bold text-white transition flex items-center justify-center shadow-xs active:scale-95 cursor-pointer font-['Space_Grotesk']"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handlePinDelete}
                      className="h-12 sm:h-13 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 active:bg-rose-900 border border-slate-800 text-xs font-bold text-rose-300 transition flex items-center justify-center cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinKey('0')}
                      className="h-12 sm:h-13 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-teal-600 border border-slate-800 text-base font-bold text-white transition flex items-center justify-center shadow-xs active:scale-95 cursor-pointer font-['Space_Grotesk']"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyPin(pinDigits)}
                      disabled={pinDigits.length !== 4 || isLoading}
                      className="h-12 sm:h-13 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-40 border border-teal-500 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Enter
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* MODE 3: Corporate Credentials / AD SSO                      */}
              {/* ============================================================ */}
              {authMode === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Corporate Identity / SSO Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya.rao@reboot-erp.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password / Domain Passcode
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAuthError('Demo hint: Any password works, or switch to Quick Roles!')
                        }
                        className="text-[11px] text-teal-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                        placeholder="Enter password..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Caps Lock Alert */}
                    {capsLockActive && (
                      <div className="mt-1 text-[10.5px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Caps Lock is ON</span>
                      </div>
                    )}
                  </div>

                  {/* Remember & SSL Status */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberTerminal}
                        onChange={(e) => setRememberTerminal(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                      />
                      <span>Remember this workstation</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> TLS 1.3 / 256-bit
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Verifying Corporate Identity...</span>
                    ) : (
                      <>
                        <span>Sign In to Plant Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Quick Launch & Bypass Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero-Trust Plant Firewall: Active</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('quick');
                  handleSelectPersona(DEMO_USERS[0]);
                }}
                className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Director Fast-Gate (Passcode Required)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Industrial Copyright & Version */}
      <footer className="relative z-10 w-full py-2.5 px-4 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-[#0B1120]/80">
        Reboot ERP 4.0 • Enterprise Industrial Manufacturing Suite • Multi-Plant Automotive & Medical Grade
      </footer>
    </div>
  );
};
