import { adminEventBus } from './adminService';

export interface SystemSettingsConfig {
  baseCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AED' | string;
  currencySymbol: string;
  currencyName: string;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  numberFormat: 'indian' | 'international';
}

const STORAGE_KEY = 'reboot_erp_system_settings_config';

export const CURRENCY_OPTIONS: Array<{ code: string; symbol: string; name: string }> = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹ INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($ USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€ EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£ GBP)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥ JPY)' },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  baseCurrency: 'INR',
  currencySymbol: '₹',
  currencyName: 'Indian Rupee (₹ INR)',
  timeFormat: '24h',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'indian',
};

function loadSettings(): SystemSettingsConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const foundCurr = CURRENCY_OPTIONS.find((c) => c.code === parsed.baseCurrency);
        return {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...parsed,
          currencySymbol: foundCurr?.symbol || parsed.currencySymbol || '₹',
          currencyName: foundCurr?.name || parsed.currencyName || 'Indian Rupee (₹ INR)',
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load system settings from localStorage', e);
  }
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

class SystemSettingsService {
  private current: SystemSettingsConfig = loadSettings();

  public getSettings(): SystemSettingsConfig {
    return { ...this.current };
  }

  public getCurrency(): { code: string; symbol: string; name: string } {
    return {
      code: this.current.baseCurrency,
      symbol: this.current.currencySymbol || '₹',
      name: this.current.currencyName || 'Indian Rupee (₹ INR)',
    };
  }

  public getCurrencySymbol(): string {
    return this.current.currencySymbol || '₹';
  }

  public getTimeFormat(): '12h' | '24h' {
    return this.current.timeFormat || '24h';
  }

  public updateSettings(patch: Partial<SystemSettingsConfig>): SystemSettingsConfig {
    let symbol = this.current.currencySymbol;
    let name = this.current.currencyName;

    if (patch.baseCurrency) {
      const found = CURRENCY_OPTIONS.find((c) => c.code === patch.baseCurrency);
      if (found) {
        symbol = found.symbol;
        name = found.name;
      }
    }

    this.current = {
      ...this.current,
      ...patch,
      currencySymbol: patch.currencySymbol || symbol,
      currencyName: patch.currencyName || name,
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
      }
    } catch (e) {
      console.warn('Failed to save system settings to localStorage', e);
    }

    adminEventBus.emit('SYSTEM_SETTINGS_UPDATED', this.current);
    return { ...this.current };
  }

  public formatMoney(amount: number, options?: { decimals?: number; showSymbol?: boolean }): string {
    const decimals = options?.decimals ?? 2;
    const showSymbol = options?.showSymbol ?? true;
    const sym = showSymbol ? this.getCurrencySymbol() : '';
    const num = Number(amount) || 0;

    let formattedNum = '';
    if (this.current.numberFormat === 'indian') {
      // Indian numbering system (Lakhs & Crores)
      formattedNum = num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } else {
      formattedNum = num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    return `${sym}${formattedNum}`;
  }

  public formatTime(date: Date | string | number): string {
    const d = typeof date === 'object' ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    if (this.current.timeFormat === '12h') {
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }

    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  public formatDateTime(date: Date | string | number): string {
    const d = typeof date === 'object' ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeStr = this.formatTime(d);
    return `${dateStr} ${timeStr}`;
  }
}

export const systemSettingsService = new SystemSettingsService();
