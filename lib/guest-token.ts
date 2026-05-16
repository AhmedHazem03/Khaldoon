const STORAGE_KEY = "khaldoun_guest_token";
const LEGACY_KEY = "guest_token"; // previously stored in sessionStorage

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read the guest_token from localStorage. Falls back to the legacy
 * sessionStorage key (and migrates it) so users mid-flow during deploy
 * don't lose their unauthenticated order history.
 *
 * Returns null when called server-side or when no valid token exists.
 */
export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && UUID_RE.test(stored)) return stored;

    const legacy = window.sessionStorage.getItem(LEGACY_KEY);
    if (legacy && UUID_RE.test(legacy)) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.sessionStorage.removeItem(LEGACY_KEY);
      return legacy;
    }
  } catch {
    // Storage may be disabled (e.g. Safari private mode) — caller decides.
  }

  return null;
}

/**
 * Generate, persist, and return a guest_token. Idempotent — returns the
 * existing token if one is already present.
 */
export function ensureGuestToken(): string | null {
  if (typeof window === "undefined") return null;

  const existing = getGuestToken();
  if (existing) return existing;

  try {
    const token = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return null;
  }
}
