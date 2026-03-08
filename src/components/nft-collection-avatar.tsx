import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/utils/image';
import { useEffect, useState } from 'react';

interface NFTCollectionAvatarProps {
  name: string;
  contractAddress: string;
  logo?: string | null;
  network?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-16',
};

const textSizeClasses = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

// Cache for Alchemy API responses
const alchemyCache = new Map<string, string | null>();

const fetchAlchemyMetadata = async (
  contractAddress: string,
  network: string = 'avax'
): Promise<string | null> => {
  const cacheKey = `${network}:${contractAddress.toLowerCase()}`;
  
  // Check cache first
  if (alchemyCache.has(cacheKey)) {
    return alchemyCache.get(cacheKey) || null;
  }

  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    console.warn('VITE_ALCHEMY_API_KEY not found in environment variables');
    alchemyCache.set(cacheKey, null);
    return null;
  }

  // Map network to Alchemy network name
  const networkMap: Record<string, string> = {
    avax: 'avax-mainnet',
    ethereum: 'eth-mainnet',
    polygon: 'polygon-mainnet',
    arbitrum: 'arb-mainnet',
    base: 'base-mainnet',
  };

  const alchemyNetwork = networkMap[network.toLowerCase()] || 'avax-mainnet';

  try {
    const response = await fetch(
      `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${contractAddress}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      alchemyCache.set(cacheKey, null);
      return null;
    }

    const data = await response.json();
    
    // Try multiple possible image fields from Alchemy response
    const imageUrl =
      data?.openSeaMetadata?.imageUrl ||
      data?.openSeaMetadata?.bannerImageUrl ||
      data?.image ||
      null;

    alchemyCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Failed to fetch Alchemy metadata:', error);
    alchemyCache.set(cacheKey, null);
    return null;
  }
};

export function NFTCollectionAvatar({
  name,
  contractAddress,
  logo,
  network = 'avax',
  size = 'md',
  className,
}: NFTCollectionAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(logo || null);
  const [isLoading, setIsLoading] = useState(!logo);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      // If we already have a logo from backend, use it with proxy
      if (logo) {
        setImageUrl(getProxiedImageUrl(logo));
        setIsLoading(false);
        return;
      }

      // Try to fetch from Alchemy
      setIsLoading(true);
      const alchemyUrl = await fetchAlchemyMetadata(contractAddress, network);
      
      if (isMounted) {
        setImageUrl(alchemyUrl ? getProxiedImageUrl(alchemyUrl) : null);
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [logo, contractAddress, network]);

  // Generate fallback text (first 2 letters of name)
  const fallbackText = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        'rounded-lg border border-border bg-muted',
        className
      )}
    >
      {imageUrl && !isLoading && (
        <AvatarImage
          src={imageUrl}
          alt={name}
          className="object-cover"
          onError={() => setImageUrl(null)}
        />
      )}
      <AvatarFallback
        className={cn(
          'rounded-lg bg-gradient-to-br from-primary/20 to-primary/5',
          'font-pixel font-bold text-primary',
          textSizeClasses[size]
        )}
      >
        {isLoading ? '...' : fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
