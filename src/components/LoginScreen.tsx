import React, { useState } from 'react';
import { Building2, ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useChangePassword, useLogin, useLogout, useMe } from '../features/identity/useIdentity';

const inputCls =
  'w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all';
const btnCls =
  'w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all';

const msgOf = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

/**
 * Three server-driven steps: credentials -> (forced password change) -> plant & shift selection.
 * Plant/shift are only offered after a successful login; the parent shell renders the app once all are done.
 */
export const LoginScreen: React.FC = () => {
  const me = useMe();
  const login = useLogin();
  const logout = useLogout();
  const changePassword = useChangePassword();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const user = me.data;
  const step: 'credentials' | 'password' | 'context' = !user ? 'credentials' : user.mustChangePassword ? 'password' : 'context';
  const error = localError
    ?? (login.error && msgOf(login.error))
    ?? (changePassword.error && msgOf(changePassword.error))
    ?? (me.error && 'Unable to reach the authentication service.')
    ?? null;

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    login.mutate({ username, password }, { onSuccess: () => setPassword('') });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (newPw.length < 10) return setLocalError('New password must be at least 10 characters.');
    if (newPw !== confirmPw) return setLocalError('Passwords do not match.');
    changePassword.mutate({ currentPassword: currentPw, newPassword: newPw }, {
      onSuccess: () => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); },
    });
  };

  const title = step === 'credentials' ? 'Enterprise Authentication' : step === 'password' ? 'Set a new password' : 'Signing you in';
  const subtitle =
    step === 'credentials' ? 'Sign in with your authorized credentials'
    : step === 'password' ? 'Your administrator issued a temporary password. Choose your own to continue.'
    : `Welcome, ${user?.fullName}.`;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-xl mb-3 border border-teal-400/20 ring-4 ring-teal-500/10">
            <ShieldCheck className="w-8 h-8 text-teal-100" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>SP-PLASTECH</span>
            <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">ERP</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise Polymer Manufacturing & Resource Planning</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="pb-4 mb-5 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100">{title}</h2>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-xs font-bold text-slate-300 mb-1.5">Username or Corporate Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username" required maxLength={200} className={inputCls} />
                </div>
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password" required maxLength={128} className={inputCls} />
                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={login.isPending} className={btnCls}>
                {login.isPending ? 'Signing in…' : (<><span>Sign in</span><ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={submitPassword} className="space-y-4">
              {[
                ['Temporary password', currentPw, setCurrentPw, 'current-password'],
                ['New password (min 10 characters)', newPw, setNewPw, 'new-password'],
                ['Confirm new password', confirmPw, setConfirmPw, 'new-password'],
              ].map(([label, val, set, ac]) => (
                <div key={label as string}>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{label as string}</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="password" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                      autoComplete={ac as string} required maxLength={128} className={inputCls} />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={changePassword.isPending} className={btnCls}>
                {changePassword.isPending ? 'Saving…' : 'Update password & continue'}
              </button>
            </form>
          )}

          {step === 'context' && user && (
            user.plants.length === 0 ? (
              <div role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2.5">
                <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No plant is assigned to your account. Ask your administrator to assign at least one plant.</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Loading your workspace…</p>
            )
          )}

          {step !== 'credentials' && (
            <button type="button" onClick={() => logout.mutate()} className="mt-4 w-full text-center text-[11px] text-slate-400 hover:text-slate-200">
              Not you? Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
