/**
 * useAppNavigate: Standardized URL-driven navigation hook (Part A5.1)
 * Decouples navigation from browser sessionStorage and enforces URL Single Source of Truth
 */

export interface NavigateOptions {
  replace?: boolean;
}

export function useAppNavigate() {
  const navigate = (view: string, params?: Record<string, any>, options?: NavigateOptions) => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    if (options?.replace) {
      window.history.replaceState({ view, params }, '', origin);
    } else {
      window.history.pushState({ view, params }, '', origin);
    }

    window.dispatchEvent(new PopStateEvent('popstate', { state: { view, params } }));
  };

  return { navigate };
}
