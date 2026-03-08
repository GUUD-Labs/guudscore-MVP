import { type ComponentProps, useEffect } from 'react';

import { NftCollectionEmptyState } from '@/components/empty-state';
import { NftAvatar, preloadNftImages } from '@/components/nft-avatar';
import { cn } from '@/lib/utils';
import type { NFTData } from '@/types';

export const NftList = ({
  className,
  nfts,
}: ComponentProps<'div'> & { nfts: NFTData['items'] }) => {
  // Filter out NFTs with null/undefined images
  const validNfts = nfts.filter(nft => nft.image != null && nft.image !== '');

  // Preload all NFT images when component mounts or nfts change
  useEffect(() => {
    if (validNfts.length > 0) {
      const imageSources = validNfts.map(nft => nft.image);
      preloadNftImages(imageSources);
    }
  }, [validNfts]);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {validNfts.length > 0 ? (
        validNfts.map((nft, index) => (
          <div
            key={`key-${nft.contractAddress}-${nft.tokenId}-${index}`}
            className="glass flex items-center overflow-hidden rounded-md p-3 sm:p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <NftAvatar
                src={nft.image}
                name={nft.name || `Token #${nft.tokenId}`}
                collectionName={nft.collectionName}
                size="lg"
                className="flex-shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-pixel truncate text-xs sm:text-sm font-bold">
                  {nft.name || `Token #${nft.tokenId}`}
                </span>
                <span className="text-muted text-[10px] sm:text-xs">{nft.network}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <NftCollectionEmptyState />
      )}
    </div>
  );
};
