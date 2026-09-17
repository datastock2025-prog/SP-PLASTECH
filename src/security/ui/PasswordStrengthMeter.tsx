import React, { useMemo } from 'react';
import { PasswordPolicy } from '../auth/PasswordPolicy';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  password: string;
  showChecklist?: boolean;
}

export const PasswordStrengthMeter: React.FC<Props> = ({
  password,
  showChecklist = true,
}) => {
  const result = useMemo(() => {
    return PasswordPolicy.validate(password || '');
  }, [password]);

  const strengthLabel = useMemo(() => {
    switch (result.score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong (Enterprise Ready)';
      default:
        return 'Weak';
    }
  }, [result.score]);

  const strengthColor = useMemo(() => {
    switch (result.score) {
      case 0:
      case 1:
        return 'bg-rose-500';
      case 2:
        return 'bg-amber-500';
      case 3:
        return 'bg-yellow-400';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-rose-500';
    }
  }, [result.score]);

  const strengthWidth = useMemo(() => {
    switch (result.score) {
      case 0:
        return 'w-1/12';
      case 1:
        return 'w-1/4';
      case 2:
        return 'w-2/4';
      case 3:
        return 'w-3/4';
      case 4:
        return 'w-full';
      default:
        return 'w-1/12';
    }
  }, [result.score]);

  if (!password) return null;

  return (
    <div className="w-full space-y-3 mt-2 animate-fadeIn">
      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Password Strength</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            {result.isValid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            {strengthLabel} ({result.score}/4)
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${strengthColor} ${strengthWidth}`}
          />
        </div>
      </div>

      {/* Rules Checklist */}
      {showChecklist && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            {result.hasMinLength ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.hasMinLength ? 'text-slate-200' : 'text-slate-500'}>
              At least 12 characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.hasUpper ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.hasUpper ? 'text-slate-200' : 'text-slate-500'}>
              Uppercase letter (A-Z)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.hasLower ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.hasLower ? 'text-slate-200' : 'text-slate-500'}>
              Lowercase letter (a-z)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.hasNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.hasNumber ? 'text-slate-200' : 'text-slate-500'}>
              Number (0-9)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.hasSpecial ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.hasSpecial ? 'text-slate-200' : 'text-slate-500'}>
              Special character (!@#$)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.hasNoCommonWords ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            )}
            <span className={result.hasNoCommonWords ? 'text-slate-200' : 'text-rose-400'}>
              No common dictionary words
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
