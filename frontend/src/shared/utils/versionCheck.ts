/**
 * Lightweight Enterprise Deployment Version Sync & Cache Buster
 * Periodically checks for new frontend deployments and provides seamless cache refresh.
 */

let initialBuildHash: string | null = null;
let checkIntervalTimer: any = null;

async function extractBuildHash(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/?_cb=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Match Vite's output script tag hash e.g. /assets/index-*.js
    const match = html.match(/src="[^"]*\/assets\/index-([^".]+)\.js"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function initVersionCheck(intervalMs: number = 10 * 60 * 1000): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  initialBuildHash = await extractBuildHash();

  const checkForUpdate = async () => {
    if (document.hidden) return; // Don't check when tab is backgrounded
    const latestHash = await extractBuildHash();
    if (initialBuildHash && latestHash && latestHash !== initialBuildHash) {
      window.dispatchEvent(
        new CustomEvent('app:new-version-available', {
          detail: { currentVersion: initialBuildHash, latestVersion: latestHash },
        })
      );
    }
  };

  checkIntervalTimer = setInterval(checkForUpdate, intervalMs);

  const onVisibilityChange = () => {
    if (!document.hidden) {
      checkForUpdate();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    if (checkIntervalTimer) clearInterval(checkIntervalTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export function reloadToLatestVersion(): void {
  if (typeof window === 'undefined') return;
  // Clear sessionStorage and reload bypassing cache
  try {
    sessionStorage.clear();
  } catch {}
  window.location.reload();
}
