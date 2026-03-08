import { type VariantProps, cva } from 'class-variance-authority';
import { type HTMLAttributes, useEffect, useRef, useState } from 'react';

import { getCachedBlobUrl, getAvatarFromStorage, persistAvatarImage } from '@/lib/avatar-cache';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/utils/image';

const profileAvatarVariants = cva(
  'rounded-full overflow-hidden flex items-center justify-center',
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
    },
    defaultVariants: {
      size: 'xl',
    },
  }
);

const profileAvatarTextVariants = cva(
  'font-pixel font-bold text-primary select-none',
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
      size: 'xl',
    },
  }
);

const profileAvatarImageVariants = cva('rounded-full object-cover', {
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
    size: 'xl',
  },
});

interface ProfileAvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof profileAvatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
  isAgent?: boolean;
}

const agentBadgeSizeMap: Record<string, string> = {
  xs: 'size-3.5 text-[7px] bottom-0 right-0',
  sm: 'size-4 text-[8px] bottom-0 right-0',
  md: 'size-5 text-[10px] bottom-0 right-0',
  lg: 'size-5.5 text-[11px] bottom-0 right-0',
  xl: 'size-6 text-xs bottom-0 right-0',
  full: 'size-6 text-xs bottom-0 right-0',
};

const AgentBadge = ({ sizeKey }: { sizeKey: string }) => {
  const badgeSizeClass = agentBadgeSizeMap[sizeKey] ?? agentBadgeSizeMap.xl;
  return (
    <span
      className={cn(
        'absolute z-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 shadow-lg leading-[0]',
        badgeSizeClass
      )}
    >
      <span className="block">🤖</span>
    </span>
  );
};

export const ProfileAvatar = ({
  src,
  alt,
  name,
  size,
  isAgent,
  className,
  ...props
}: ProfileAvatarProps) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fallbackStage, setFallbackStage] = useState(0);
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string | null>(() =>
    src ? getCachedBlobUrl(src) : null
  );
  const persistedRef = useRef(false);

  // Build all URL candidates to try in order
  const proxiedSrc = src ? getProxiedImageUrl(src) : null;
  const wsrvFallback = src ? `https://wsrv.nl/?url=${encodeURIComponent(src)}&default=1` : null;

  // Determine current URL and key for each stage
  const getSrcForStage = (stage: number): string | null => {
    switch (stage) {
      case 0: return proxiedSrc;                    // proxied URL (weserv/dweb/wsrv)
      case 1: return src ?? null;                   // direct original URL
      case 2: return wsrvFallback;                  // wsrv.nl generic fallback
      default: return null;
    }
  };

  const currentSrc = cachedBlobUrl || getSrcForStage(fallbackStage);

  // Check persistent Cache Storage on mount / src change
  useEffect(() => {
    setHasError(false);
    setImageLoaded(false);
    setFallbackStage(0);
    persistedRef.current = false;

    // Check in-memory blob cache first (synchronous)
    const memCached = src ? getCachedBlobUrl(src) : null;
    if (memCached) {
      setCachedBlobUrl(memCached);
      return;
    }

    setCachedBlobUrl(null);

    // Then check persistent Cache Storage (async)
    if (src) {
      getAvatarFromStorage(src).then(blobUrl => {
        if (blobUrl) {
          setCachedBlobUrl(blobUrl);
        }
      });
    }
  }, [src]);

  const handleImageLoad = () => {
    setHasError(false);
    setImageLoaded(true);

    // Persist to Cache Storage in background (only once per src)
    if (src && !persistedRef.current && !cachedBlobUrl) {
      persistedRef.current = true;
      const loadedFromUrl = getSrcForStage(fallbackStage);
      if (loadedFromUrl) {
        persistAvatarImage(src, loadedFromUrl);
      }
    }
  };

  const handleImageError = () => {
    // If blob URL failed, clear it and fall back to network loading
    if (cachedBlobUrl) {
      setCachedBlobUrl(null);
      setFallbackStage(0);
      setImageLoaded(false);
      return;
    }

    const nextStage = fallbackStage + 1;
    const nextSrc = getSrcForStage(nextStage);
    // Skip stages that have the same URL as already failed one
    const currentStageUrl = getSrcForStage(fallbackStage);
    if (nextSrc && nextSrc !== currentStageUrl) {
      setFallbackStage(nextStage);
      setImageLoaded(false);
      return;
    }
    // Try one more stage if next was duplicate
    const afterNext = nextStage + 1;
    const afterNextSrc = getSrcForStage(afterNext);
    if (afterNextSrc && afterNextSrc !== currentStageUrl) {
      setFallbackStage(afterNext);
      setImageLoaded(false);
      return;
    }
    // All attempts exhausted
    setHasError(true);
    setImageLoaded(false);
  };

  // Generate initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const sizeKey = size ?? 'xl';

  // Show fallback if no src or error
  if (!currentSrc || hasError) {
    return (
      <div className={cn('relative', isAgent && 'inline-block w-fit')} {...(isAgent ? {} : props)}>
        <div
          className={cn(
            profileAvatarVariants({ size }),
            'bg-primary/10',
            className
          )}
          {...(isAgent ? {} : {})}
          {...(!isAgent ? props : {})}
        >
          <span className={cn(profileAvatarTextVariants({ size }))}>
            {getInitials(name)}
          </span>
        </div>
        {isAgent && <AgentBadge sizeKey={sizeKey} />}
      </div>
    );
  }

  // Show image
  return (
    <div className={cn('relative', isAgent && 'inline-block w-fit')} {...(isAgent ? props : {})}>
      <div className={cn(profileAvatarVariants({ size }), 'relative', className)} {...(!isAgent ? props : {})}>
        {!imageLoaded && (
          <div
            className={cn(
              profileAvatarVariants({ size }),
              'bg-primary/10 animate-pulse absolute inset-0'
            )}
          >
            <span
              className={cn(profileAvatarTextVariants({ size }), 'opacity-50')}
            >
              {getInitials(name)}
            </span>
          </div>
        )}
        <img
          key={`${src}-${fallbackStage}`}
          src={currentSrc}
          alt={alt || name || 'Profile'}
          className={cn(
            profileAvatarImageVariants({ size }),
            !imageLoaded && 'opacity-0'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
      {isAgent && <AgentBadge sizeKey={sizeKey} />}
    </div>
  );
};
