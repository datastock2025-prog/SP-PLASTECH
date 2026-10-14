import React, { useState, useEffect, ReactNode } from 'react';
import { Eye, EyeOff, Lock, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export interface SensitiveDataMaskerProps {
  value: string | number;
  type: 'SSN' | 'AADHAAR' | 'EMAIL' | 'SALARY' | 'BANK_ACCOUNT' | 'PHONE' | 'CREDIT_CARD';
  canRevealPermission?: string;
  autoHideSeconds?: number;
  label?: string;
  className?: string;
}

export function maskSensitiveValue(value: string | number, type: SensitiveDataMaskerProps['type']): string {
  const str = String(value || '');
  if (!str) return '••••';

  switch (type) {
    case 'SSN':
    case 'AADHAAR':
      return str.length >= 4 ? `••••-••••-${str.slice(-4)}` : '••••';
    case 'EMAIL': {
      const parts = str.split('@');
      if (parts.length === 2) {
        const name = parts[0];
        const visible = name.length > 2 ? `${name[0]}***${name.slice(-1)}` : `${name[0]}***`;
        return `${visible}@${parts[1]}`;
      }
      return '••••@••••';
    }
    case 'SALARY':
      return '₹ ••,••,•••';
    case 'BANK_ACCOUNT':
      return str.length >= 4 ? `••••••••${str.slice(-4)}` : '••••••••';
    case 'PHONE':
      return str.length >= 4 ? `+91 ••••• ••${str.slice(-2)}` : '+91 ••••• •••••';
    case 'CREDIT_CARD':
      return str.length >= 4 ? `•••• •••• •••• ${str.slice(-4)}` : '•••• •••• •••• ••••';
    default:
      return '••••••••';
  }
}

export const SensitiveDataMasker: React.FC<SensitiveDataMaskerProps> = ({
  value,
  type,
  canRevealPermission = 'reports.sensitive',
  autoHideSeconds = 30,
  label,
  className = '',
}) => {
  const { hasPermission } = useAuth();
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(autoHideSeconds);

  const canReveal = hasPermission(canRevealPermission as any);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRevealed) {
      setCountdown(autoHideSeconds);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsRevealed(false);
            return autoHideSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRevealed, autoHideSeconds]);

  const toggleReveal = () => {
    if (!canReveal) return;
    setIsRevealed(!isRevealed);
  };

  const displayValue = isRevealed ? String(value) : maskSensitiveValue(value, type);

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
      {label && <span className="text-slate-500 font-sans text-[11px]">{label}:</span>}
      <span className={isRevealed ? 'text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-slate-800'}>
        {displayValue}
      </span>

      {canReveal && (
        <button
          type="button"
          onClick={toggleReveal}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
          title={isRevealed ? `Auto-hiding in ${countdown}s` : 'Reveal sensitive data (30s)'}
        >
          {isRevealed ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 font-sans font-bold">
              <EyeOff className="w-3.5 h-3.5" /> {countdown}s
            </span>
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </span>
  );
};
