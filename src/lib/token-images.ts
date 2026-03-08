// Token Image Loading Service - Optimized for Performance
// All token images are served from CORS-friendly CDNs

// ============================================================================
// PERSISTENT LOGO URL CACHE - localStorage backed, survives page refreshes
// ============================================================================

const LOGO_CACHE_KEY = '_gs_logos';
const LOGO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const LOGO_CACHE_MAX = 500;

interface LogoCacheEntry {
  url: string;
  ts: number; // timestamp
}

let logoCache: Record<string, LogoCacheEntry> | null = null;

const loadLogoCache = (): Record<string, LogoCacheEntry> => {
  if (logoCache) return logoCache;
  try {
    const raw = localStorage.getItem(LOGO_CACHE_KEY);
    if (raw) {
      logoCache = JSON.parse(raw);
      return logoCache!;
    }
  } catch {
    // corrupt cache
  }
  logoCache = {};
  return logoCache;
};

const getCachedLogoUrl = (symbol: string, network?: string): string | null => {
  const cache = loadLogoCache();
  const key = `${symbol.toLowerCase()}:${(network || 'avax').toLowerCase()}`;
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < LOGO_CACHE_TTL) {
    return entry.url;
  }
  if (entry) {
    // expired - clean up
    delete cache[key];
  }
  return null;
};

const setCachedLogoUrl = (symbol: string, network: string | undefined, url: string): void => {
  const cache = loadLogoCache();
  const key = `${symbol.toLowerCase()}:${(network || 'avax').toLowerCase()}`;
  cache[key] = { url, ts: Date.now() };

  // Evict oldest if over limit
  const keys = Object.keys(cache);
  if (keys.length > LOGO_CACHE_MAX) {
    const sorted = keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
    const toDelete = sorted.slice(0, keys.length - LOGO_CACHE_MAX);
    for (const k of toDelete) delete cache[k];
  }

  try {
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full - best effort
  }
};

// ============================================================================
// GECKO TERMINAL REQUEST QUEUE - Throttle to avoid 429 rate limits
// GeckoTerminal free tier: ~30 req/min. We use 2s interval to stay safe.
// ============================================================================

// In-memory cache for GeckoTerminal results (survives across component re-renders)
const geckoResultCache = new Map<string, string | null>();

const GECKO_REQUEST_INTERVAL = 2000; // 2s between requests (safe for free tier)
let geckoRequestQueue: Array<{
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];
let geckoQueueRunning = false;

const processGeckoQueue = async () => {
  if (geckoQueueRunning) return;
  geckoQueueRunning = true;

  while (geckoRequestQueue.length > 0) {
    const item = geckoRequestQueue.shift()!;
    try {
      const result = await item.execute();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
    if (geckoRequestQueue.length > 0) {
      await new Promise(r => setTimeout(r, GECKO_REQUEST_INTERVAL));
    }
  }

  geckoQueueRunning = false;
};

const enqueueGeckoRequest = <T>(execute: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    geckoRequestQueue.push({
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    processGeckoQueue();
  });
};

// ============================================================================
// DIRECT TOKEN IMAGE MAPPINGS - Instant lookup, no API calls
// ============================================================================

// Direct image URLs for common tokens (SpotHQ GitHub - CORS-friendly)
const TOKEN_IMAGE_URLS: Record<string, string> = {
  btc: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png',
  'btc.b':
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png',
  eth: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png',
  'weth.e':
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png',
  avax: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/avax.png',
  wavax:
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/avax.png',
  savax:
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/avax.png',
  usdc: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png',
  'usdc.e':
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png',
  usdt: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png',
  bands: '/bands.png',
};

// Tokens that should skip validation and use URL directly (trusted sources)
const SKIP_VALIDATION_TOKENS = new Set(['bands']);

// Direct image URLs by token contract address (case-insensitive lookup)
const TOKEN_ADDRESS_IMAGE_URLS: Record<string, string> = {
  // BANDS token on Avalanche
  '0x635d08c0e2ff1fa2f19f89db3552c7ab4158af29': '/bands.png',
};

export const TOKEN_ADDRESSES: Record<string, string> = {
  NOCHILL: '0xAcFb898Cff266E53278cC0124fC2C7C94C8cB9a5',
  LAMBO: '0x6F43fF77A9C0Cf552b5b653268fBFe26A052429b',
  FINANCE: '0xac6E53f1e1eBaFDA8553C0ADD8C5B32BcB5890C4',
  GOAT: '0xB9C188BC558a82a1eE9E75AE0857df443F407632',
};

export const AVAX_TOKEN_IDS = TOKEN_IMAGE_URLS;
export const EXAMPLE_AVAX_TOKENS = TOKEN_ADDRESSES;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Map network to CoinGecko platform ID
const getCoingeckoPlatform = (network?: string): string => {
  switch (network?.toUpperCase()) {
    case 'ARBITRUM':
      return 'arbitrum-one';
    case 'BASE':
      return 'base';
    case 'SOLANA':
      return 'solana';
    case 'MONAD':
      return 'monad'; // Monad platform ID
    case 'AVAX':
    default:
      return 'avalanche';
  }
};

// Map network to GeckoTerminal network ID
const getGeckoTerminalNetwork = (network?: string): string => {
  switch (network?.toUpperCase()) {
    case 'ARBITRUM':
      return 'arbitrum';
    case 'BASE':
      return 'base';
    case 'SOLANA':
      return 'solana';
    case 'MONAD':
      return 'monad'; // Monad network ID
    case 'AVAX':
    default:
      return 'avax';
  }
};

// GeckoTerminal API - Get token image by contract address
// Uses /api/gecko/ proxy to avoid CORS issues (see vercel.json rewrite)
// Queued + cached to avoid 429 rate limits
const getGeckoTerminalImageByAddress = async (
  address: string,
  network: string = 'avax'
): Promise<string | null> => {
  const cacheKey = `addr:${network}:${address.toLowerCase()}`;
  if (geckoResultCache.has(cacheKey)) {
    return geckoResultCache.get(cacheKey)!;
  }

  const result = await enqueueGeckoRequest(async () => {
    try {
      const response = await fetch(
        `/api/gecko/networks/${network}/tokens/${address.toLowerCase()}`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();

      // GeckoTerminal returns image_url in data.attributes
      return data?.data?.attributes?.image_url || null;
    } catch {
      return null;
    }
  });

  geckoResultCache.set(cacheKey, result);
  return result;
};

// CoinGecko API - Get token image by contract address
const getCoinGeckoImageByAddress = async (
  address: string,
  platform: string = 'avalanche'
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address.toLowerCase()}`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!response.ok) return null;

    const data = await response.json();

    // CoinGecko returns images in large, small, and thumb sizes
    // Prefer large > small > thumb
    return data?.image?.large || data?.image?.small || data?.image?.thumb || null;
  } catch {
    return null;
  }
};

const isValidTokenSymbol = (symbol: string): boolean => {
  const invalid = [
    /^collection\s+0x/i,
    /^0x[a-f0-9]{6,}/i,
    /\s+avalanche\s+c-chain$/i,
    /^[a-f0-9]{40}$/i,
    /^\d+$/,
  ];
  return !invalid.some(pattern => pattern.test(symbol.trim()));
};

const getDirectImageUrl = (symbol: string): string | null => {
  const normalized = symbol.toLowerCase().trim();
  return TOKEN_IMAGE_URLS[normalized] || null;
};

const getFallbackProviders = (symbol: string, address?: string): string[] => {
  const providers: string[] = [];

  // Get address from mapping or use provided address
  const tokenAddress = address || TOKEN_ADDRESSES[symbol.toUpperCase()];

  // Only use Pangolin for Avalanche meme tokens
  if (tokenAddress) {
    providers.push(
      `https://raw.githubusercontent.com/pangolindex/tokens/main/assets/43114/${tokenAddress}/logo_48.png`
    );
  }

  return providers;
};

const testImageUrl = (url: string, timeout: number = 3000): Promise<boolean> => {
  return new Promise(resolve => {
    const img = new Image();
    let resolved = false;

    const handleResolve = (success: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(success);
      }
    };

    const timeoutId = setTimeout(() => handleResolve(false), timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      handleResolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      handleResolve(false);
    };

    img.src = url;
  });
};

// ============================================================================
// PUBLIC API
// ============================================================================

export const findValidTokenImage = async (
  symbol: string,
  address?: string,
  options?: { timeout?: number; network?: string }
): Promise<string | null> => {
  const { timeout = 3000, network } = options || {};

  if (!isValidTokenSymbol(symbol)) {
    return null;
  }

  const normalizedSymbol = symbol.toLowerCase().trim();

  // For trusted tokens, skip validation and return URL directly
  if (SKIP_VALIDATION_TOKENS.has(normalizedSymbol)) {
    const directUrl = TOKEN_IMAGE_URLS[normalizedSymbol];
    if (directUrl) return directUrl;
  }

  // Check address-specific mapping first (highest priority)
  if (address) {
    const addressImageUrl = TOKEN_ADDRESS_IMAGE_URLS[address.toLowerCase()];
    if (addressImageUrl) {
      return addressImageUrl;
    }
  }

  // Try direct URL mapping first (SpotHQ for BTC, ETH, AVAX, USDC, USDT etc.)
  const directUrl = getDirectImageUrl(symbol);
  if (directUrl) {
    const isValid = await testImageUrl(directUrl, timeout);
    if (isValid) return directUrl;
  }

  // Check persistent localStorage cache (avoids API calls on repeat visits)
  const cached = getCachedLogoUrl(symbol, network);
  if (cached) {
    const isValid = await testImageUrl(cached, timeout);
    if (isValid) return cached;
    // cached URL no longer valid — fall through to re-fetch
  }

  // For all EVM chains with address, try GeckoTerminal token endpoint (most reliable)
  if (address && address.startsWith('0x')) {
    const geckoNetwork = getGeckoTerminalNetwork(network);
    const geckoTerminalUrl = await getGeckoTerminalImageByAddress(address, geckoNetwork);
    if (geckoTerminalUrl) {
      const isValid = await testImageUrl(geckoTerminalUrl, timeout);
      if (isValid) {
        setCachedLogoUrl(symbol, network, geckoTerminalUrl);
        return geckoTerminalUrl;
      }
    }
  }

  // Fallback to CoinGecko API with contract address (if address is provided)
  if (address && address.startsWith('0x')) {
    const platform = getCoingeckoPlatform(network);
    const coinGeckoUrl = await getCoinGeckoImageByAddress(address, platform);
    if (coinGeckoUrl) {
      const isValid = await testImageUrl(coinGeckoUrl, timeout);
      if (isValid) {
        setCachedLogoUrl(symbol, network, coinGeckoUrl);
        return coinGeckoUrl;
      }
    }
  }

  // Try Pangolin for Avalanche meme tokens
  const providers = getFallbackProviders(symbol, address);

  for (const url of providers) {
    const isValid = await testImageUrl(url, timeout);
    if (isValid) {
      setCachedLogoUrl(symbol, network, url);
      return url;
    }
  }

  return null;
};

export const getTokenImageBySymbol = (symbol: string): string | null => {
  return getDirectImageUrl(symbol);
};

export const fetchTokenImageWithFallback = async (
  identifier: string,
  chainId: string = '43114'
): Promise<string | null> => {
  // Try direct URL mapping first (for BTC, ETH, AVAX)
  if (!identifier.startsWith('0x')) {
    const directUrl = getDirectImageUrl(identifier);
    if (directUrl) {
      const isValid = await testImageUrl(directUrl, 3000);
      if (isValid) return directUrl;
    }
  }

  // For addresses, try CoinGecko first
  if (identifier.startsWith('0x')) {
    const coinGeckoUrl = await getCoinGeckoImageByAddress(identifier);
    if (coinGeckoUrl) {
      const isValid = await testImageUrl(coinGeckoUrl, 3000);
      if (isValid) return coinGeckoUrl;
    }

    // Fallback to Pangolin
    const pangolinUrl = `https://raw.githubusercontent.com/pangolindex/tokens/main/assets/${chainId}/${identifier}/logo_48.png`;
    const isValid = await testImageUrl(pangolinUrl, 3000);
    if (isValid) return pangolinUrl;
  }

  return null;
};

export const getTokenImageProviders = (symbol: string, address?: string): string[] => {
  const urls: string[] = [];
  const direct = getDirectImageUrl(symbol);
  if (direct) urls.push(direct);
  urls.push(...getFallbackProviders(symbol, address));
  return urls;
};

export const getTokenImage = (symbol: string, address?: string): string => {
  const direct = getDirectImageUrl(symbol);
  if (direct) return direct;
  const providers = getFallbackProviders(symbol, address);
  return providers[0] || '';
};

export const isValidImageUrl = (url: string): Promise<boolean> => {
  return testImageUrl(url, 3000);
};

/** Cache a logo URL from an external source (e.g. backend src) */
export const cacheLogoUrl = (symbol: string, network: string | undefined, url: string): void => {
  setCachedLogoUrl(symbol, network, url);
};

export const fetchMultipleTokenImages = async (
  identifiers: string[],
  chainId: string = '43114'
): Promise<Record<string, string | null>> => {
  const results: Record<string, string | null> = {};

  await Promise.all(
    identifiers.map(async identifier => {
      results[identifier] = await fetchTokenImageWithFallback(identifier, chainId);
    })
  );

  return results;
};
