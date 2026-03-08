/**
 * Secure Token Store
 * 
 * Stores access token in-memory (module scope) as primary storage.
 * Uses obfuscated localStorage as backup for page reloads (30-day session).
 * 
 * Why not plain localStorage?
 *  - XSS attacks can trivially read localStorage.getItem('accessToken')
 *  - In-memory storage is harder to extract via XSS
 *  - Obfuscated backup prevents simple automated token scraping
 * 
 * Limitations:
 *  - Full XSS protection requires httpOnly cookies (backend change needed)
 *  - This is defense-in-depth, not a silver bullet
 */

// ─── Storage Keys ───────────────────────────────────────────
const STORAGE_KEY = '_gs_sess';
const EXPIRY_KEY = '_gs_exp';

// ─── In-Memory Store (primary) ──────────────────────────────
let _memoryToken: string | null = null;
let _memoryExpiry: number | null = null;

// ─── Obfuscation Helpers ────────────────────────────────────
// Simple reversible encoding — NOT encryption.
// Goal: prevent `localStorage.getItem('accessToken')` style automated scraping.

function encode(value: string): string {
  try {
    // Reverse + base64
    const reversed = value.split('').reverse().join('');
    return btoa(reversed);
  } catch {
    return '';
  }
}

function decode(encoded: string): string {
  try {
    const reversed = atob(encoded);
    return reversed.split('').reverse().join('');
  } catch {
    return '';
  }
}

// ─── Public API ─────────────────────────────────────────────

export const secureTokenStore = {
  /**
   * Get the access token (reads from memory first, then falls back to localStorage)
   */
  getAccessToken(): string | null {
    if (_memoryToken) return _memoryToken;

    // Hydrate from localStorage on first access (page reload)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const token = decode(stored);
      if (token) {
        _memoryToken = token;
        return token;
      }
    }
    return null;
  },

  /**
   * Get token expiry timestamp
   */
  getTokenExpiry(): number | null {
    if (_memoryExpiry) return _memoryExpiry;

    const stored = localStorage.getItem(EXPIRY_KEY);
    if (stored) {
      const expiry = parseInt(stored, 10);
      if (!isNaN(expiry)) {
        _memoryExpiry = expiry;
        return expiry;
      }
    }
    return null;
  },

  /**
   * Store tokens (both in-memory and obfuscated localStorage backup)
   */
  setTokens(accessToken: string, expiresInSeconds = 2592000): void {
    // 1) In-memory (primary)
    _memoryToken = accessToken;
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    _memoryExpiry = expiryTime;

    // 2) Obfuscated localStorage backup (for page reloads)
    localStorage.setItem(STORAGE_KEY, encode(accessToken));
    localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

    // 3) Clean up legacy plain-text key if exists
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiry');
  },

  /**
   * Clear all token data
   */
  clearTokens(): void {
    _memoryToken = null;
    _memoryExpiry = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    // Also clear legacy keys
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiry');
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= expiry;
  },

  /**
   * Check if token should be proactively refreshed (< 7 days remaining)
   */
  shouldRefreshToken(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const remaining = expiry - Date.now();
    return remaining < sevenDaysMs && remaining > 0;
  },

  /**
   * Migrate legacy plain-text localStorage token to new store
   * Called once on app startup
   */
  migrateLegacyToken(): void {
    const legacyToken = localStorage.getItem('accessToken');
    if (legacyToken) {
      const legacyExpiry = localStorage.getItem('tokenExpiry');
      const expiryTime = legacyExpiry ? parseInt(legacyExpiry, 10) : Date.now() + 2592000 * 1000;

      // Store in new format
      _memoryToken = legacyToken;
      _memoryExpiry = expiryTime;
      localStorage.setItem(STORAGE_KEY, encode(legacyToken));
      localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

      // Remove legacy keys
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenExpiry');
    }
  },
};

// ─── Auto-migrate on module load ────────────────────────────
secureTokenStore.migrateLegacyToken();
