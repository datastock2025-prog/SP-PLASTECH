import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  expectedConfirmationPhrase: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const DestructiveConfirmationModal: React.FC<Props> = ({
  isOpen,
  title,
  description,
  expectedConfirmationPhrase,
  onConfirm,
  onCancel,
  isDangerous = true,
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  if (!isOpen) return null;

  const isMatch = typedPhrase.trim() === expectedConfirmationPhrase.trim();

  const handleConfirm = () => {
    if (isMatch) {
      setTypedPhrase('');
      onConfirm();
    }
  };

  const handleCancel = () => {
    setTypedPhrase('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                Irreversible Action Warning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">{description}</p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            To confirm this destructive action, please type:
          </label>
          <div className="p-2 bg-slate-900 border border-slate-700/60 rounded-lg text-xs font-mono text-rose-400 font-bold mb-3 select-all">
            {expectedConfirmationPhrase}
          </div>
          <input
            type="text"
            autoFocus
            value={typedPhrase}
            onChange={(e) => setTypedPhrase(e.target.value)}
            placeholder="Type the confirmation phrase exactly..."
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatch}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Confirm Destructive Execution
          </button>
        </div>
      </div>
    </div>
  );
};
