import { useCallback } from 'react';

/**
 * Hook for secure clipboard handling and automatic clipboard purging for sensitive data
 */
export function useClipboardProtection() {
  const copySecurely = useCallback(async (text: string, autoPurgeSeconds = 45): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);

      // Auto-purge clipboard after configured duration to avoid leaving confidential tokens/passwords in clipboard
      if (autoPurgeSeconds > 0) {
        setTimeout(async () => {
          try {
            const current = await navigator.clipboard.readText();
            if (current === text) {
              await navigator.clipboard.writeText('');
            }
          } catch {
            // Ignore clipboard read permission denials
          }
        }, autoPurgeSeconds * 1000);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { copySecurely };
}
