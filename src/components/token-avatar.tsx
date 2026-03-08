import { type VariantProps, cva } from 'class-variance-authority';

import { type HTMLAttributes, useEffect, useRef, useState } from 'react';

import {
    getCachedImage,
    isUrlFailed,
    isUrlLoaded,
    isUrlLoading,
    preloadImage,
    shouldDelayRequest,
    shouldRetryUrl,
    startAutoRetry,
} from '@/lib/avatar-cache';
import { cacheLogoUrl, findValidTokenImage } from '@/lib/token-images';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/utils/image';

const tokenAvatarVariants = cva(
  'rounded-full overflow-hidden flex items-center justify-center',
  {
    variants: {
      size: {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-12',
      },
      state: {
        loading: 'bg-gray-200 animate-pulse',
        fallback: 'bg-primary/20',
        image: '',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'image',
    },
  }
);

const tokenAvatarTextVariants = cva('font-pixel font-bold text-primary', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const tokenAvatarImageVariants = cva('rounded-full object-cover', {
  variants: {
    size: {
      sm: 'size-6',
      md: 'size-8',
      lg: 'size-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface TokenAvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tokenAvatarVariants> {
  symbol: string;
  name?: string;
  address?: string;
  src?: string | null; // Direct image URL from backend
  network?: string; // Network for GeckoTerminal lookup (AVAX, BASE, ARBITRUM, SOLANA)
}

export const TokenAvatar = ({
  symbol,
  name,
  address,
  src,
  size,
  network,
  className,
  ...props
}: TokenAvatarProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startAutoRetry(url => {
      if (url === imageUrl) {
        setRetryTrigger(prev => prev + 1);
      }
    });
  }, [imageUrl]);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        let validUrl: string | null = null;

        // Try backend src if available (backend now returns proper logos with null instead of empty string)
        if (src) {
          const proxiedSrc = getProxiedImageUrl(src);
          if (proxiedSrc) {
            const isValid = await new Promise<boolean>((resolve) => {
              const img = new Image();
              const timeout = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                resolve(false);
              }, 5000); // Increased timeout for slower connections
              
              img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
              };
              
              img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
              };
              
              img.src = proxiedSrc;
            });
            
            if (isValid) {
              validUrl = proxiedSrc;
              // Cache the backend logo URL for future page loads
              cacheLogoUrl(symbol, network, src);
            }
          }
        }

        // If backend src failed or not available, try alternative sources
        if (!validUrl) {
          const alternativeUrl = await findValidTokenImage(symbol, address, {
            timeout: 5000,
            network,
          });
          validUrl = alternativeUrl ? getProxiedImageUrl(alternativeUrl) : null;
        }

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (validUrl) {
          if (isUrlFailed(validUrl) && !shouldRetryUrl(validUrl)) {
            setImageUrl(null);
            setHasError(true);
            setIsLoading(false);
            return;
          }

          if (isUrlLoaded(validUrl)) {
            const cached = getCachedImage(validUrl);
            if (cached) {
              setImageUrl(validUrl);
              setIsLoading(false);
              return;
            }
          }

          if (isUrlLoading(validUrl)) {
            setIsLoading(true);
            const checkInterval = setInterval(() => {
              if (
                !isUrlLoading(validUrl) ||
                abortControllerRef.current?.signal.aborted
              ) {
                clearInterval(checkInterval);
                if (abortControllerRef.current?.signal.aborted) return;

                if (isUrlLoaded(validUrl)) {
                  setImageUrl(validUrl);
                  setIsLoading(false);
                } else {
                  setHasError(true);
                  setIsLoading(false);
                }
              }
            }, 50);
            return;
          }

          if (shouldDelayRequest(validUrl)) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          try {
            await preloadImage(validUrl);

            if (!abortControllerRef.current?.signal.aborted) {
              setImageUrl(validUrl);
              setIsLoading(false);
            }
          } catch (preloadError) {
            if (!abortControllerRef.current?.signal.aborted) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `Failed to preload token image for ${symbol}:`,
                  preloadError
                );
              }
              setImageUrl(null);
              setHasError(true);
              setIsLoading(false);
            }
          }
        } else {
          if (!abortControllerRef.current?.signal.aborted) {
            setImageUrl(null);
            setHasError(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to load token image for ${symbol}:`, error);
          }
          setImageUrl(null);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, address, src, retryTrigger]);

  if (isLoading) {
    return (
      <div
        className={cn(
          tokenAvatarVariants({ size, state: 'loading' }),
          className
        )}
        {...props}
      />
    );
  }

  if (
    imageUrl &&
    !hasError &&
    (isUrlLoaded(imageUrl) || getCachedImage(imageUrl))
  ) {
    return (
      <div
        className={cn(tokenAvatarVariants({ size, state: 'image' }), className)}
        {...props}
      >
        <img
          src={imageUrl}
          alt={name || symbol}
          className={cn(tokenAvatarImageVariants({ size }))}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        tokenAvatarVariants({ size, state: 'fallback' }),
        className
      )}
      {...props}
    >
      <span className={cn(tokenAvatarTextVariants({ size }))}>
        {symbol.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
};
