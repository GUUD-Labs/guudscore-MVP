import { getNftImageUrl } from '@/lib/format';

const globalImageCache = new Map<string, string>();
const pendingImageRequests = new Map<string, Promise<string>>();
const cacheMetadata = new Map<string, { timestamp: number; size: number }>();

// Cache Storage for persistent caching
const CACHE_STORAGE_NAME = 'nft-image-cache';
let cacheStorage: Cache | null = null;

const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_STORAGE_MAX_SIZE = 50;

export const fallbackImageUrl =
  'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.IMYEa-ECkbVQ66EO1LCUDwHaHa%3Fpid%3DApi&f=1&ipt=93d62d2b38f6a86c3e8ba920f8bf68c5d71b9643e2ec80068fd019a039328c8a&ipo=images';

// Optimized placeholder - lighter weight SVG
export const placeholderImageUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%23d1d5db'/%3E%3C/svg%3E";

export const generateBlurredPlaceholder = (
  width: number = 100,
  height: number = 100,
  color: string = '#e5e7eb'
): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='${color}' opacity='0.7'/%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3C/filter%3E%3C/svg%3E`;
};

export interface ImageLoadingState {
  url: string;
  isLoading: boolean;
  hasError: boolean;
  isPlaceholder: boolean;
  isFromCache: boolean;
  isHighResolution: boolean;
}

export interface OptimizedImageResult {
  immediate: ImageLoadingState;
  highResolution: Promise<ImageLoadingState>;
}

const initCacheStorage = async (): Promise<Cache | null> => {
  if (typeof caches === 'undefined') {
    console.warn('Cache Storage not available in this environment');
    return null;
  }

  try {
    cacheStorage = await caches.open(CACHE_STORAGE_NAME);
    return cacheStorage;
  } catch (error) {
    console.error('Failed to initialize Cache Storage:', error);
    return null;
  }
};

const getFromCacheStorage = async (
  imageUrl: string
): Promise<string | null> => {
  try {
    if (!cacheStorage) {
      cacheStorage = await initCacheStorage();
    }

    if (!cacheStorage) return null;

    const response = await cacheStorage.match(imageUrl);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error('Error getting from Cache Storage:', error);
    return null;
  }
};

const saveToCacheStorage = async (
  imageUrl: string,
  imageBlob: Blob
): Promise<void> => {
  try {
    if (!cacheStorage) {
      cacheStorage = await initCacheStorage();
    }

    if (!cacheStorage) return;
    const keys = await cacheStorage.keys();
    if (keys.length >= CACHE_STORAGE_MAX_SIZE) {
      const toDelete = keys.slice(0, keys.length - CACHE_STORAGE_MAX_SIZE + 1);
      await Promise.all(toDelete.map(key => cacheStorage!.delete(key)));
    }

    const response = new Response(imageBlob, {
      headers: {
        'Content-Type': imageBlob.type || 'image/jpeg',
        'Cache-Control': 'max-age=86400',
      },
    });

    await cacheStorage.put(imageUrl, response);
  } catch (error) {
    console.error('Error saving to Cache Storage:', error);
  }
};

// Fetch and cache image blob
const fetchAndCacheImage = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    saveToCacheStorage(imageUrl, blob).catch(error => {
      console.error('Background cache save failed:', error);
    });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching image:', error);
    return fallbackImageUrl;
  }
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, metadata] of cacheMetadata.entries()) {
    if (now - metadata.timestamp > CACHE_TTL) {
      globalImageCache.delete(key);
      cacheMetadata.delete(key);
    }
  }
};

const evictLeastRecentlyUsed = () => {
  if (globalImageCache.size <= CACHE_MAX_SIZE) return;

  const entries = Array.from(cacheMetadata.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  const toRemove = entries.slice(0, entries.length - CACHE_MAX_SIZE);
  for (const [key] of toRemove) {
    globalImageCache.delete(key);
    cacheMetadata.delete(key);
  }
};

export const getImmediateImageUrl = (
  imageUrl: string | null
): ImageLoadingState => {
  if (!imageUrl?.startsWith('http://') && !imageUrl?.startsWith('https://')) {
    return {
      url: fallbackImageUrl,
      isLoading: false,
      hasError: true,
      isPlaceholder: false,
      isFromCache: false,
      isHighResolution: false,
    };
  }

  if (globalImageCache.has(imageUrl)) {
    const cached = globalImageCache.get(imageUrl)!;

    if (cacheMetadata.has(imageUrl)) {
      cacheMetadata.set(imageUrl, {
        ...cacheMetadata.get(imageUrl)!,
        timestamp: Date.now(),
      });
    }

    return {
      url: cached,
      isLoading: false,
      hasError: cached === fallbackImageUrl,
      isPlaceholder: false,
      isFromCache: true,
      isHighResolution: true,
    };
  }

  return {
    url: generateBlurredPlaceholder(),
    isLoading: true,
    hasError: false,
    isPlaceholder: true,
    isFromCache: false,
    isHighResolution: false,
  };
};

export const getOptimizedImage = (
  imageUrl: string | null
): OptimizedImageResult => {
  const immediate = getImmediateImageUrl(imageUrl);
  const highResolution =
    immediate.isFromCache && immediate.isHighResolution
      ? Promise.resolve(immediate)
      : fetchHighResolutionImage(imageUrl);

  return {
    immediate,
    highResolution,
  };
};

export const fetchHighResolutionImage = async (
  imageUrl: string | null
): Promise<ImageLoadingState> => {
  if (!imageUrl?.startsWith('http://') && !imageUrl?.startsWith('https://')) {
    return {
      url: fallbackImageUrl,
      isLoading: false,
      hasError: true,
      isPlaceholder: false,
      isFromCache: false,
      isHighResolution: false,
    };
  }

  // Check memory cache first
  if (globalImageCache.has(imageUrl)) {
    return {
      url: globalImageCache.get(imageUrl)!,
      isLoading: false,
      hasError: false,
      isPlaceholder: false,
      isFromCache: true,
      isHighResolution: true,
    };
  }

  if (pendingImageRequests.has(imageUrl)) {
    try {
      const resolvedUrl = await pendingImageRequests.get(imageUrl)!;
      return {
        url: resolvedUrl,
        isLoading: false,
        hasError: resolvedUrl === fallbackImageUrl,
        isPlaceholder: false,
        isFromCache: true,
        isHighResolution: true,
      };
    } catch (error) {
      return {
        url: fallbackImageUrl,
        isLoading: false,
        hasError: true,
        isPlaceholder: false,
        isFromCache: false,
        isHighResolution: false,
      };
    }
  }

  const imagePromise = (async () => {
    try {
      const cachedUrl = await getFromCacheStorage(imageUrl);
      if (cachedUrl) {
        return cachedUrl;
      }

      const resolvedUrl = await getNftImageUrl(imageUrl);
      if (!resolvedUrl) {
        console.warn('Resolved URL is null, trying direct fetch');
        return await fetchAndCacheImage(imageUrl);
      }

      const finalUrl = await fetchAndCacheImage(resolvedUrl);
      return finalUrl;
    } catch (error) {
      console.warn('Error resolving image URL:', error);
      return fallbackImageUrl;
    } finally {
      pendingImageRequests.delete(imageUrl);
    }
  })();

  pendingImageRequests.set(imageUrl, imagePromise);

  try {
    const resolvedUrl = await imagePromise;

    const isError = resolvedUrl === fallbackImageUrl;
    if (!isError) {
      cleanupExpiredEntries();
      globalImageCache.set(imageUrl, resolvedUrl);
      cacheMetadata.set(imageUrl, {
        timestamp: Date.now(),
        size: 1,
      });
      evictLeastRecentlyUsed();
    } else {
      globalImageCache.set(imageUrl, resolvedUrl);
    }

    return {
      url: resolvedUrl,
      isLoading: false,
      hasError: isError,
      isPlaceholder: false,
      isFromCache: false,
      isHighResolution: true,
    };
  } catch (error) {
    return {
      url: fallbackImageUrl,
      isLoading: false,
      hasError: true,
      isPlaceholder: false,
      isFromCache: false,
      isHighResolution: false,
    };
  }
};

export const resolveImageUrlWithCache = async (
  imageUrl: string | null
): Promise<string> => {
  const result = await fetchHighResolutionImage(imageUrl);
  return result.url;
};

export const saveImageToCache = (imageUrl: string, resolvedUrl: string) => {
  if (!imageUrl || !resolvedUrl) return;

  cleanupExpiredEntries();
  globalImageCache.set(imageUrl, resolvedUrl);
  cacheMetadata.set(imageUrl, {
    timestamp: Date.now(),
    size: 1,
  });
  evictLeastRecentlyUsed();
};

export const getCacheSize = () => globalImageCache.size;

export const isCached = (imageUrl: string) => globalImageCache.has(imageUrl);

export const refreshCachedImage = async (
  imageUrl: string
): Promise<ImageLoadingState> => {
  globalImageCache.delete(imageUrl);
  cacheMetadata.delete(imageUrl);

  // Also remove from Cache Storage
  try {
    if (!cacheStorage) {
      cacheStorage = await initCacheStorage();
    }
    if (cacheStorage) {
      await cacheStorage.delete(imageUrl);
    }
  } catch (error) {
    console.error('Error removing from Cache Storage:', error);
  }

  return await fetchHighResolutionImage(imageUrl);
};

// Enhanced preload function with Cache Storage support
export const preloadImage = async (imageUrl: string): Promise<boolean> => {
  if (
    !imageUrl ||
    imageUrl === fallbackImageUrl ||
    imageUrl === placeholderImageUrl
  ) {
    return false;
  }

  // Check if already cached
  if (globalImageCache.has(imageUrl)) {
    return true;
  }

  // Check Cache Storage
  try {
    const cachedUrl = await getFromCacheStorage(imageUrl);
    if (cachedUrl) {
      globalImageCache.set(imageUrl, cachedUrl);
      cacheMetadata.set(imageUrl, {
        timestamp: Date.now(),
        size: 1,
      });
      return true;
    }
  } catch (error) {
    console.error('Error checking Cache Storage during preload:', error);
  }

  // Preload and cache
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      // Save to memory cache
      globalImageCache.set(imageUrl, imageUrl);
      cacheMetadata.set(imageUrl, {
        timestamp: Date.now(),
        size: 1,
      });

      // Attempt to save to Cache Storage
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => saveToCacheStorage(imageUrl, blob))
        .catch(error =>
          console.error('Error saving to Cache Storage during preload:', error)
        );

      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};

// Enhanced cache management
export const clearCache = async () => {
  globalImageCache.clear();
  pendingImageRequests.clear();
  cacheMetadata.clear();

  // Clear Cache Storage
  try {
    if (!cacheStorage) {
      cacheStorage = await initCacheStorage();
    }
    if (cacheStorage) {
      const keys = await cacheStorage.keys();
      await Promise.all(keys.map(key => cacheStorage!.delete(key)));
    }
  } catch (error) {
    console.error('Error clearing Cache Storage:', error);
  }
};

// Enhanced cache stats
export const getCacheStats = async () => {
  let cacheStorageSize = 0;
  let cacheStorageKeys: string[] = [];

  try {
    if (!cacheStorage) {
      cacheStorage = await initCacheStorage();
    }
    if (cacheStorage) {
      const keys = await cacheStorage.keys();
      cacheStorageSize = keys.length;
      cacheStorageKeys = keys.map(key => key.url);
    }
  } catch (error) {
    console.error('Error getting Cache Storage stats:', error);
  }

  return {
    memoryCache: {
      size: globalImageCache.size,
      maxSize: CACHE_MAX_SIZE,
      pendingRequests: pendingImageRequests.size,
      oldestEntry:
        cacheMetadata.size > 0
          ? Math.min(
              ...Array.from(cacheMetadata.values()).map(m => m.timestamp)
            )
          : null,
      newestEntry:
        cacheMetadata.size > 0
          ? Math.max(
              ...Array.from(cacheMetadata.values()).map(m => m.timestamp)
            )
          : null,
    },
    cacheStorage: {
      size: cacheStorageSize,
      maxSize: CACHE_STORAGE_MAX_SIZE,
      keys: cacheStorageKeys,
    },
  };
};

// Utility to warm up cache with critical images
export const warmUpCache = async (imageUrls: string[]): Promise<void> => {
  const preloadPromises = imageUrls
    .filter(url => url && url.startsWith('http'))
    .slice(0, 10) // Limit to first 10 to avoid overwhelming
    .map(url => preloadImage(url));

  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.error('Error warming up cache:', error);
  }
};

// Mobile-optimized image loading with progressive enhancement
export const getMobileOptimizedImage = (
  imageUrl: string | null
): OptimizedImageResult => {
  // For mobile, prioritize speed over quality initially
  const immediate = getImmediateImageUrl(imageUrl);

  // If we have a cached version, use it immediately
  if (immediate.isFromCache && immediate.isHighResolution) {
    return {
      immediate,
      highResolution: Promise.resolve(immediate),
    };
  }

  // For mobile, show blurred placeholder immediately and fetch high-res in background
  const mobileImmediate: ImageLoadingState = {
    url: immediate.isPlaceholder
      ? generateBlurredPlaceholder(200, 200, '#f3f4f6')
      : immediate.url,
    isLoading: !immediate.isFromCache,
    hasError: immediate.hasError,
    isPlaceholder: immediate.isPlaceholder,
    isFromCache: immediate.isFromCache,
    isHighResolution: immediate.isHighResolution,
  };

  return {
    immediate: mobileImmediate,
    highResolution: fetchHighResolutionImage(imageUrl),
  };
};
