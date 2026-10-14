import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ShieldCheck, Smartphone, Key, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  isOpen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  stepUpActionName?: string;
}

export const MfaVerificationModal: React.FC<Props> = ({
  isOpen: propIsOpen,
  onSuccess,
  onCancel,
  stepUpActionName,
}) => {
  const { mfaChallenge, verifyMfaChallenge, cancelMfaChallenge } = useAuth();
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'TOTP' | 'SMS' | 'RECOVERY'>('TOTP');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isModalOpen = propIsOpen ?? !!mfaChallenge;
  const challengeId = mfaChallenge?.challengeId;

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 6) {
      setErrorMessage('Please enter a valid verification code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (challengeId) {
        const ok = await verifyMfaChallenge(challengeId, code.trim());
        if (ok) {
          onSuccess?.();
        } else {
          setErrorMessage('Invalid authentication code. Please try again.');
        }
      } else {
        // Direct step-up mock check
        if (code.trim().length >= 6) {
          onSuccess?.();
        } else {
          setErrorMessage('Invalid verification code.');
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (mfaChallenge) {
      cancelMfaChallenge();
    }
    onCancel?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {stepUpActionName ? `Step-Up Verification` : 'Two-Factor Authentication'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {stepUpActionName
                ? `Authorizing sensitive operation: "${stepUpActionName}"`
                : 'Enter your 6-digit security code to verify your identity.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {mode === 'TOTP' && 'Authenticator App Code'}
              {mode === 'SMS' && 'SMS Verification Code'}
              {mode === 'RECOVERY' && 'Backup Recovery Code'}
            </label>
            <input
              type="text"
              autoFocus
              maxLength={mode === 'RECOVERY' ? 12 : 6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder={mode === 'RECOVERY' ? 'e.g. A1B2-C3D4' : '000000'}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-center text-2xl font-mono tracking-widest text-slate-100 placeholder-slate-600 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Confirm & Authenticate
          </button>
        </form>

        {/* Alternate methods selection */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col gap-2">
          {mode !== 'TOTP' && (
            <button
              type="button"
              onClick={() => {
                setMode('TOTP');
                setCode('');
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" /> Use Authenticator App (TOTP)
            </button>
          )}

          {mode !== 'SMS' && (
            <button
              type="button"
              onClick={() => {
                setMode('SMS');
                setCode('');
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" /> Send code via SMS
            </button>
          )}

          {mode !== 'RECOVERY' && (
            <button
              type="button"
              onClick={() => {
                setMode('RECOVERY');
                setCode('');
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <Key className="w-3.5 h-3.5" /> Use a Backup Recovery Code
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="mt-2 text-xs text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel Verification
          </button>
        </div>
      </div>
    </div>
  );
};
