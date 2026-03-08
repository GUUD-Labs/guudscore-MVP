import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import { NftList } from '@/components/nft-list';
import { useMyNFTs } from '@/hooks';

export const Route = createFileRoute('/dashboard/nfts')({
  component: RouteComponent,
});

function RouteComponent() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  
  const { data: nfts, isLoading, error } = useMyNFTs({ limit: 100 });

  // Filter out NFTs without name AND without image (completely empty metadata)
  const validNfts = (nfts?.items || []).filter(
    nft => nft.name || nft.image
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(validNfts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNfts = validNfts.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h4 className="text-muted text-sm">Loading NFTs...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        header="Error loading NFTs"
        error={error?.message || 'Unknown error'}
      />
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg">Collections</h4>
          <span className="text-muted text-[10px] sm:text-xs">
            {validNfts.length} NFTs found
          </span>
        </div>

        <NftList nfts={paginatedNfts} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-glass border border-glass-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass-hover transition-colors text-xs sm:text-sm"
            >
              Previous
            </button>
            
            <span className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-glass border border-glass-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass-hover transition-colors text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
