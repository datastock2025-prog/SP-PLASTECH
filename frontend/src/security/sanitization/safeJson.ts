/**
 * Prototype Pollution immune JSON Parser
 * Rejects JSON containing __proto__, constructor, or prototype injections.
 */

export class SafeJsonParser {
  public static parse<T = any>(text: string, fallback?: T): T {
    if (!text || typeof text !== 'string') return fallback as T;

    try {
      return JSON.parse(text, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          console.warn(`[Security Alert] Prototype pollution attempt blocked for key: ${key}`);
          return undefined;
        }
        return value;
      });
    } catch (err) {
      if (fallback !== undefined) return fallback;
      throw new Error(`JSON Parsing Error: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
    }
  }

  public static stringify(value: any, space?: number): string {
    return JSON.stringify(value, (key, val) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return val;
    }, space);
  }
}
