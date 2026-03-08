// Shared cache for avatar components to prevent repeated requests

// Cache for failed URLs with retry information
export interface FailedUrlInfo {
  timestamp: number;
  retryCount: number;
  nextRetryTime: number;
}

export const failedUrls = new Map<string, FailedUrlInfo>();

// Cache for successfully loaded images
export const loadedUrls = new Set<string>();

// Cache for currently loading URLs to prevent multiple simultaneous requests
export const loadingUrls = new Set<string>();

// DOM image cache to store loaded image elements
const imageCache = new Map<string, HTMLImageElement>();

// Persistent blob URL cache (restored from Cache Storage on init)
const blobUrlCache = new Map<string, string>();

// Retry configuration
const RETRY_DELAYS = [5000, 15000, 60000, 300000]; // 5s, 15s, 1m, 5m
const MAX_RETRIES = RETRY_DELAYS.length;

// Rate limiting for external requests
let lastRequestTime = 0;
const REQUEST_DELAY = 100; // 100ms between requests

// --- Cache Storage for persistent avatar caching across refreshes ---
const AVATAR_CACHE_NAME = 'avatar-image-cache';
const AVATAR_CACHE_MAX_SIZE = 200;
let avatarCacheStorage: Cache | null = null;

const initAvatarCacheStorage = async (): Promise<Cache | null> => {
  if (typeof caches === 'undefined') return null;
  try {
    avatarCacheStorage = await caches.open(AVATAR_CACHE_NAME);
    return avatarCacheStorage;
  } catch {
    return null;
  }
};

/**
 * Save an image blob to persistent Cache Storage keyed by original URL
 */
const saveAvatarToStorage = async (originalUrl: string, blob: Blob): Promise<void> => {
  try {
    if (!avatarCacheStorage) avatarCacheStorage = await initAvatarCacheStorage();
    if (!avatarCacheStorage) return;

    // Evict oldest entries if at capacity
    const keys = await avatarCacheStorage.keys();
    if (keys.length >= AVATAR_CACHE_MAX_SIZE) {
      const toDelete = keys.slice(0, keys.length - AVATAR_CACHE_MAX_SIZE + 1);
      await Promise.all(toDelete.map(k => avatarCacheStorage!.delete(k)));
    }

    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'max-age=86400',
      },
    });
    await avatarCacheStorage.put(originalUrl, response);
  } catch {
    // Silently fail - caching is best-effort
  }
};

/**
 * Try to get a cached avatar blob URL from persistent Cache Storage
 */
export const getAvatarFromStorage = async (originalUrl: string): Promise<string | null> => {
  try {
    if (!avatarCacheStorage) avatarCacheStorage = await initAvatarCacheStorage();
    if (!avatarCacheStorage) return null;

    const response = await avatarCacheStorage.match(originalUrl);
    if (response) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(originalUrl, blobUrl);
      return blobUrl;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Persist a successfully loaded avatar image to Cache Storage.
 * Fetches via wsrv.nl proxy (which adds CORS) to get a blob we can store.
 */
export const persistAvatarImage = async (originalUrl: string, loadedFromUrl: string): Promise<void> => {
  try {
    // Use wsrv.nl proxy to ensure CORS headers are present for fetch
    const fetchUrl = loadedFromUrl.includes('wsrv.nl')
      ? loadedFromUrl
      : `https://wsrv.nl/?url=${encodeURIComponent(loadedFromUrl)}&default=1`;

    const response = await fetch(fetchUrl);
    if (!response.ok) return;

    const blob = await response.blob();
    if (blob.size > 0) {
      await saveAvatarToStorage(originalUrl, blob);
    }
  } catch {
    // Best-effort: don't block UI if persistence fails
  }
};

/**
 * Get blob URL from in-memory blob cache (populated from Cache Storage)
 */
export const getCachedBlobUrl = (originalUrl: string): string | null => {
  return blobUrlCache.get(originalUrl) || null;
};

export const isExternalImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  return (
    url.includes('ipfs') ||
    url.includes('gateway.pinata.cloud') ||
    url.includes('arweave') ||
    url.includes('nftstorage') ||
    url.includes('pinata.cloud') ||
    (url.startsWith('https://') &&
      typeof window !== 'undefined' &&
      !url.includes(window.location.hostname))
  );
};

export const shouldDelayRequest = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (!isExternalImageUrl(url)) return false;

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    return true;
  }

  lastRequestTime = now;
  return false;
};

export const markUrlAsFailed = (url: string) => {
  if (!url || typeof url !== 'string') return;

  const now = Date.now();
  const existing = failedUrls.get(url);
  const retryCount = existing ? existing.retryCount + 1 : 1;

  // Calculate next retry time based on retry count
  const delayIndex = Math.min(retryCount - 1, RETRY_DELAYS.length - 1);
  const delay = RETRY_DELAYS[delayIndex];
  const nextRetryTime = now + delay;

  failedUrls.set(url, {
    timestamp: now,
    retryCount,
    nextRetryTime,
  });

  loadedUrls.delete(url);
  loadingUrls.delete(url);
  imageCache.delete(url);
};

export const markUrlAsLoaded = (url: string) => {
  if (!url || typeof url !== 'string') return;
  loadedUrls.add(url);
  failedUrls.delete(url);
  loadingUrls.delete(url);
};

export const markUrlAsLoading = (url: string) => {
  if (!url || typeof url !== 'string') return;
  loadingUrls.add(url);
};

export const isUrlLoading = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return loadingUrls.has(url);
};

export const stopUrlLoading = (url: string) => {
  if (!url || typeof url !== 'string') return;
  loadingUrls.delete(url);
};

export const isUrlFailed = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const failedInfo = failedUrls.get(url);
  if (!failedInfo) return false;

  // Check if enough time has passed for retry
  const now = Date.now();
  return now < failedInfo.nextRetryTime;
};

export const canRetryUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const failedInfo = failedUrls.get(url);
  if (!failedInfo) return true;

  const now = Date.now();
  return now >= failedInfo.nextRetryTime && failedInfo.retryCount < MAX_RETRIES;
};

export const shouldRetryUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const failedInfo = failedUrls.get(url);
  if (!failedInfo) return false;

  const now = Date.now();
  return now >= failedInfo.nextRetryTime && failedInfo.retryCount < MAX_RETRIES;
};

export const isUrlLoaded = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return loadedUrls.has(url);
};

export const clearCache = async () => {
  failedUrls.clear();
  loadedUrls.clear();
  loadingUrls.clear();
  imageCache.clear();
  // Revoke blob URLs to free memory
  for (const blobUrl of blobUrlCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  blobUrlCache.clear();
  // Clear persistent Cache Storage
  try {
    if (!avatarCacheStorage) avatarCacheStorage = await initAvatarCacheStorage();
    if (avatarCacheStorage) {
      const keys = await avatarCacheStorage.keys();
      await Promise.all(keys.map(k => avatarCacheStorage!.delete(k)));
    }
  } catch {
    // Best-effort
  }
};

// Preload an image and cache it with retry logic
export const preloadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string') {
      reject(new Error('Invalid URL'));
      return;
    }

    // Check if already cached
    const cached = imageCache.get(url);
    if (cached) {
      resolve(cached);
      return;
    }

    // Check if failed before and if retry is allowed
    if (isUrlFailed(url) && !shouldRetryUrl(url)) {
      reject(new Error('URL failed and retry not allowed yet'));
      return;
    }

    // Check if already loading
    if (isUrlLoading(url)) {
      // Wait for the existing load to complete
      const checkInterval = setInterval(() => {
        if (!isUrlLoading(url)) {
          clearInterval(checkInterval);
          const cached = imageCache.get(url);
          if (cached) {
            resolve(cached);
          } else {
            reject(new Error('Loading failed'));
          }
        }
      }, 50);
      return;
    }

    markUrlAsLoading(url);

    const img = new Image();
    // Don't set crossOrigin for display-only preloading - it causes
    // failures on macOS browsers when proxy CORS headers are incomplete.
    // crossOrigin is only needed for canvas operations (card-renderer).

    // Add timeout
    const timeout = setTimeout(() => {
      markUrlAsFailed(url);
      reject(new Error('Image load timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      imageCache.set(url, img);
      markUrlAsLoaded(url);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // Try once more without any CORS attributes via wsrv fallback
      const fallbackUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&default=1`;
      if (url !== fallbackUrl && !url.includes('wsrv.nl')) {
        const fallbackImg = new Image();
        const fallbackTimeout = setTimeout(() => {
          markUrlAsFailed(url);
          reject(new Error('Fallback image load timeout'));
        }, 10000);
        fallbackImg.onload = () => {
          clearTimeout(fallbackTimeout);
          imageCache.set(url, fallbackImg);
          markUrlAsLoaded(url);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = () => {
          clearTimeout(fallbackTimeout);
          markUrlAsFailed(url);
          reject(new Error('Failed to load image'));
        };
        fallbackImg.src = fallbackUrl;
      } else {
        markUrlAsFailed(url);
        reject(new Error('Failed to load image'));
      }
    };

    img.src = url;
  });
};

export const getCachedImage = (url: string): HTMLImageElement | null => {
  if (!url || typeof url !== 'string') return null;
  return imageCache.get(url) || null;
};

/**
 * Automatically retry failed URLs when their retry time is reached
 * Call this function periodically to check for URLs ready for retry
 */
export const processRetryQueue = (): string[] => {
  const now = Date.now();
  const urlsToRetry: string[] = [];

  for (const [url, failedInfo] of failedUrls.entries()) {
    if (
      now >= failedInfo.nextRetryTime &&
      failedInfo.retryCount < MAX_RETRIES
    ) {
      urlsToRetry.push(url);
    }
  }

  return urlsToRetry;
};

/**
 * Get retry information for a URL
 */
export const getRetryInfo = (url: string): FailedUrlInfo | null => {
  if (!url || typeof url !== 'string') return null;
  return failedUrls.get(url) || null;
};

/**
 * Start automatic retry processing
 * This will check every 5 seconds for URLs ready to retry
 */
let retryInterval: NodeJS.Timeout | null = null;

export const startAutoRetry = (retryCallback?: (url: string) => void) => {
  if (retryInterval) return; // Already running

  retryInterval = setInterval(() => {
    const urlsToRetry = processRetryQueue();
    urlsToRetry.forEach(url => {
      if (retryCallback) {
        retryCallback(url);
      } else {
        // Default retry behavior - attempt to preload the image
        preloadImage(url).catch(() => {
          // Retry failed, will be handled by markUrlAsFailed
        });
      }
    });
  }, 5000); // Check every 5 seconds
};

export const stopAutoRetry = () => {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
};
