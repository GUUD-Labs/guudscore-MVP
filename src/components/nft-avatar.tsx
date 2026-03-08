import { type VariantProps, cva } from 'class-variance-authority';

import { type HTMLAttributes, memo, useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/utils/image';

// Enhanced in-memory cache for NFT images with localStorage persistence
const NFT_CACHE_KEY = 'guud_nft_image_cache';
const NFT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  loaded: boolean;
  timestamp: number;
}

// Load cache from localStorage on initialization
const loadCacheFromStorage = (): Map<string, CacheEntry> => {
  try {
    const stored = localStorage.getItem(NFT_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      const cache = new Map<string, CacheEntry>();
      
      // Filter out expired entries
      Object.entries(parsed).forEach(([key, value]) => {
        const entry = value as CacheEntry;
        if (now - entry.timestamp < NFT_CACHE_TTL) {
          cache.set(key, entry);
        }
      });
      
      return cache;
    }
  } catch (e) {
    console.warn('Failed to load NFT image cache:', e);
  }
  return new Map();
};

const nftImageCache = loadCacheFromStorage();

// Save cache to localStorage (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const saveCacheToStorage = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const obj: Record<string, CacheEntry> = {};
      nftImageCache.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(NFT_CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save NFT image cache:', e);
    }
  }, 1000);
};

// Preload image function for batch loading
export const preloadNftImage = (src: string | null | undefined): Promise<boolean> => {
  if (!src) return Promise.resolve(false);
  
  let proxiedSrc = getProxiedImageUrl(src);
  if (src.includes('nochill.io') || src.includes('seadn.io') || src.includes('opensea.io')) {
    proxiedSrc = `https://wsrv.nl/?url=${encodeURIComponent(src)}`;
  }
  
  if (!proxiedSrc) return Promise.resolve(false);
  
  // Check cache first
  const cached = nftImageCache.get(proxiedSrc);
  if (cached && Date.now() - cached.timestamp < NFT_CACHE_TTL) {
    return Promise.resolve(cached.loaded);
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      nftImageCache.set(proxiedSrc!, { loaded: true, timestamp: Date.now() });
      saveCacheToStorage();
      resolve(true);
    };
    img.onerror = () => {
      nftImageCache.set(proxiedSrc!, { loaded: false, timestamp: Date.now() });
      saveCacheToStorage();
      resolve(false);
    };
    img.src = proxiedSrc!;
  });
};

// Batch preload multiple NFT images
export const preloadNftImages = async (sources: (string | null | undefined)[]): Promise<void> => {
  const validSources = sources.filter(Boolean) as string[];
  await Promise.allSettled(validSources.map(preloadNftImage));
};

const nftAvatarVariants = cva(
  'rounded-lg overflow-hidden flex items-center justify-center',
  {
    variants: {
      size: {
        xs: 'size-10',
        sm: 'size-12',
        md: 'size-16',
        lg: 'size-20',
        xl: 'size-24',
        full: 'size-full',
      },
      showBorder: {
        true: 'border border-glass-border',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      showBorder: true,
    },
  }
);

const nftAvatarTextVariants = cva(
  'font-pixel font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent select-none',
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        full: 'text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const nftAvatarImageVariants = cva('object-cover', {
  variants: {
    size: {
      xs: 'size-10',
      sm: 'size-12',
      md: 'size-16',
      lg: 'size-20',
      xl: 'size-24',
      full: 'size-full',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface NftAvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof nftAvatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
  collectionName?: string;
}

export const NftAvatar = memo((
  {
    src,
    alt,
    name,
    collectionName,
    size,
    showBorder,
    className,
    ...props
  }: NftAvatarProps
) => {
  // Use proxied image URL for IPFS compatibility
  let proxiedSrc = getProxiedImageUrl(src);

  // Special handling for CORS-blocked domains - use image proxy
  if (
    src &&
    (src.includes('nochill.io') ||
      src.includes('seadn.io') ||
      src.includes('opensea.io'))
  ) {
    proxiedSrc = `https://wsrv.nl/?url=${encodeURIComponent(src)}`;
  }

  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(() => {
    // Check cache on initial render with TTL
    if (!proxiedSrc) return false;
    const cached = nftImageCache.get(proxiedSrc);
    return (
      cached?.loaded === true && Date.now() - cached.timestamp < NFT_CACHE_TTL
    );
  });

  // Reset state when src changes, check cache
  useEffect(() => {
    if (proxiedSrc) {
      const cached = nftImageCache.get(proxiedSrc);
      if (cached?.loaded && Date.now() - cached.timestamp < NFT_CACHE_TTL) {
        setImageLoaded(true);
        setHasError(false);
      } else {
        setImageLoaded(false);
        setHasError(false);
      }
    } else {
      setImageLoaded(false);
      setHasError(false);
    }
  }, [proxiedSrc]);

  const handleImageLoad = useCallback(() => {
    if (proxiedSrc) {
      nftImageCache.set(proxiedSrc, { loaded: true, timestamp: Date.now() });
      saveCacheToStorage();
    }
    setHasError(false);
    setImageLoaded(true);
  }, [proxiedSrc]);

  const handleImageError = useCallback(() => {
    console.warn(`Failed to load NFT image: ${proxiedSrc}`);
    if (proxiedSrc) {
      nftImageCache.set(proxiedSrc, { loaded: false, timestamp: Date.now() });
      saveCacheToStorage();
    }
    setHasError(true);
    setImageLoaded(false);
  }, [proxiedSrc]);

  // Generate initials from NFT name or collection name
  const getInitials = (name?: string, collectionName?: string): string => {
    const displayName = name || collectionName;
    if (!displayName) return 'NFT';

    const words = displayName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  // Show fallback if no src or error
  if (!proxiedSrc || hasError) {
    return (
      <div
        className={cn(
          nftAvatarVariants({ size, showBorder }),
          'bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20',
          className
        )}
        {...props}
      >
        <span className={cn(nftAvatarTextVariants({ size }))}>
          {getInitials(name, collectionName)}
        </span>
      </div>
    );
  }

  // Show image with loading state overlay
  return (
    <div
      className={cn(nftAvatarVariants({ size, showBorder }), 'relative', className)}
      {...props}
    >
      {/* Loading placeholder - shown until image loads */}
      {!imageLoaded && (
        <div
          className={cn(
            nftAvatarVariants({ size, showBorder }),
            'animate-pulse bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 absolute inset-0'
          )}
        >
          <span className={cn(nftAvatarTextVariants({ size }), 'opacity-50')}>
            {getInitials(name, collectionName)}
          </span>
        </div>
      )}
      <img
        src={proxiedSrc}
        alt={alt || name || collectionName || 'NFT'}
        className={cn(
          nftAvatarImageVariants({ size }), 
          'rounded-lg',
          !imageLoaded && 'opacity-0'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="eager"
        decoding="async"
      />
    </div>
  );
});

NftAvatar.displayName = 'NftAvatar';
