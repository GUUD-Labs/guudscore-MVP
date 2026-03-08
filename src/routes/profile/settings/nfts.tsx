import {
    AlertCircle,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCallback, useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { NftAvatar } from '@/components/nft-avatar';
import { SettingsHeading } from '@/components/settings-heading';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useChain } from '@/contexts/chain-context';
import {
    useCurrentUser,
    useFileUpload,
    useMyNFTs,
    useRemoveFeaturedNFT,
    useSetFeaturedNFT,
    useUpdateAvatar,
    useUpdateUserProfile,
} from '@/hooks';
import { fetchWithRetryAndCooldown, resizeImage } from '@/lib/format';
import { resolveImageUrlWithCache } from '@/lib/image-cache';
import { cn } from '@/lib/utils';
import type { NFT, Network } from '@/types';

export const Route = createFileRoute('/profile/settings/nfts')({
  component: RouteComponent,
});

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { selectedNetwork: globalNetwork } = useChain();
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    globalNetwork // Initialize with global network
  );
  const [avatarUpdatingNFTs, setAvatarUpdatingNFTs] = useState<Set<string>>(
    new Set()
  );

  // Sync with global network when it changes
  useEffect(() => {
    setSelectedNetwork(globalNetwork);
    setCurrentPage(1); // Reset pagination when network changes
  }, [globalNetwork]);

  const {
    data: nftData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useMyNFTs(selectedNetwork ? { network: selectedNetwork } : {});

  const { data: currentUser, isPending: currentUserPending } = useCurrentUser();
  const updateProfileMutation = useUpdateUserProfile();
  const setFeaturedNFTMutation = useSetFeaturedNFT();
  const removeFeaturedNFTMutation = useRemoveFeaturedNFT();
  const fileUploadMutation = useFileUpload();
  const updateAvatarMutation = useUpdateAvatar();

  const rawNFTs = nftData?.items || [];
  const uniqueNFTsMap = new Map(rawNFTs.map(nft => [nft.id, nft]));
  const allNFTs = Array.from(uniqueNFTsMap.values());

  // Get featured NFTs
  const featuredNFTs = allNFTs.filter(nft => nft.isFeatured);

  const totalNFTs = allNFTs.length;
  const totalPages = Math.ceil(totalNFTs / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const nfts = allNFTs.slice(startIndex, endIndex);

  const handleToggleFeatured = async (nft: NFT) => {
    // Backend expects database ID (nft.id), not blockchain tokenId!
    // The endpoint toggles: isFeatured = !nft.isFeatured
    const payload = {
      tokenId: nft.id, // ← Database ID! Backend uses: findFirst({ where: { id: nftId } })
      network: nft.network,
      contractAddress: nft.contractAddress,
    };
    
    console.log('[Featured NFT] Full NFT object:', nft);
    console.log('[Featured NFT] Sending payload:', payload);
    console.log('[Featured NFT] Current user ID:', currentUser?.id);
    
    try {
      await setFeaturedNFTMutation.mutateAsync(payload);
      // Force refetch to sync with backend
      await refetch();
    } catch (error) {
      console.error('[Featured NFT] Error:', error);
      // Refetch anyway to sync state
      await refetch();
      throw error;
    }
  };

  const handleClearAllFeatured = async () => {
    if (featuredNFTs.length === 0) return;

    try {
      // When removeAll=true, tokenId value doesn't matter
      await setFeaturedNFTMutation.mutateAsync({
        tokenId: 'clear-all', // Dummy value, backend ignores when removeAll=true
        removeAll: true,
      });
      // Sync after clearing all
      await refetch();
    } catch (error) {
      console.error('[Clear All Featured] Error:', error);
      // Refetch anyway to sync state
      await refetch();
      throw error;
    }
  };

  const handleAddAllFeatured = async () => {
    // Filter NFTs that are not already featured
    const unfeaturedNFTs = allNFTs.filter(nft => !nft.isFeatured);
    if (unfeaturedNFTs.length === 0) return;

    try {
      // Add all unfeatured NFTs one by one
      for (const nft of unfeaturedNFTs) {
        await setFeaturedNFTMutation.mutateAsync({
          tokenId: nft.id,
          network: nft.network,
          contractAddress: nft.contractAddress,
        });
      }
      // Sync after adding all
      await refetch();
    } catch (error) {
      console.error('[Add All Featured] Error:', error);
      // Refetch anyway to sync state
      await refetch();
      throw error;
    }
  };

  const handleShowNFTsChange = async (checked: boolean) => {
    await updateProfileMutation.mutateAsync({ isPublicNft: checked });
  };

  const handleSyncChange = async (checked: boolean) => {
    await updateProfileMutation.mutateAsync({ isSynced: checked });
  };

  const handleNetworkChange = (value: Network | undefined) => {
    setSelectedNetwork(value);
    setCurrentPage(1);
  };

  const handleSetNftAsProfile = useCallback(
    async (nft: NFT) => {
      if (!nft.image) {
        toast.error('NFT has no image', { position: 'top-center' });
        return;
      }
      
      setAvatarUpdatingNFTs(prev => new Set(prev).add(nft.id));
      
      try {
        console.log('[NFT Avatar] Starting process for NFT:', nft.id);
        console.log('[NFT Avatar] Original image URL:', nft.image);
        
        const resolvedUrl = await resolveImageUrlWithCache(nft.image);
        console.log('[NFT Avatar] Resolved URL:', resolvedUrl);
        
        if (!resolvedUrl) {
          throw new Error('Failed to resolve NFT image URL');
        }

        console.log('[NFT Avatar] Fetching image from:', resolvedUrl);
        const response = await fetchWithRetryAndCooldown(
          resolvedUrl,
          { responseType: 'blob' },
          3,
          700
        );

        console.log('[NFT Avatar] Fetch response:', response);
        console.log('[NFT Avatar] Response type:', typeof response);
        
        // fetchWithRetryAndCooldown returns Blob directly when responseType is 'blob'
        let blob: Blob;
        if (response instanceof Blob) {
          blob = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          blob = response.data as Blob;
        } else {
          throw new Error('Failed to fetch image - invalid response format');
        }
        
        console.log('[NFT Avatar] Original blob size:', blob.size, 'type:', blob.type);
        
        // Verify it's actually an image
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Invalid image type: ${blob.type}. Expected image/* but got ${blob.type}`);
        }
        
        blob = await resizeImage(blob, 512, 512, 'image/jpeg', 1);
        if (!blob) {
          toast.error('Failed to process image: could not create image blob.', {
            position: 'top-center',
          });
          setAvatarUpdatingNFTs(prev => {
            const newSet = new Set(prev);
            newSet.delete(nft.id);
            return newSet;
          });
          return;
        }
        
        const MAX_SIZE = 5 * 1024 * 1024;
        if (blob.size > MAX_SIZE) {
          console.log('[NFT Avatar] Resizing - Original Blob Size:', blob.size);
          blob = await resizeImage(blob, 384, 384, 'image/jpeg', 0.95);
          if (blob.size > MAX_SIZE) {
            console.log('[NFT Avatar] Resizing - Second attempt, size:', blob.size);
            blob = await resizeImage(blob, 256, 256, 'image/jpeg', 0.9);
            if (blob.size > MAX_SIZE) {
              console.log('[NFT Avatar] Resizing - Third attempt, size:', blob.size);
              blob = await resizeImage(blob, 160, 160, 'image/jpeg', 0.8);
            }
          }
        }

        if (blob.size > MAX_SIZE) {
          toast.error('Image is too large after resize (max 5MB).', {
            position: 'top-center',
          });
          setAvatarUpdatingNFTs(prev => {
            const newSet = new Set(prev);
            newSet.delete(nft.id);
            return newSet;
          });
          return;
        }
        
        console.log('[NFT Avatar] Final blob size:', blob.size);
        const file = new File([blob], 'nft-avatar.jpg', { type: 'image/jpeg' });
        
        console.log('[NFT Avatar] Uploading file...');
        fileUploadMutation.mutate(file, {
          onSuccess: (uploadResponse) => {
            console.log('[NFT Avatar] Upload successful, response:', uploadResponse);
            
            // Get the file ID from upload response - API returns photoId
            const fileId = uploadResponse?.data?.photoId || uploadResponse?.data?.id;
            console.log('[NFT Avatar] File ID:', fileId);
            
            if (!fileId) {
              console.error('[NFT Avatar] No file ID in response');
              toast.error('Failed to get file ID from upload', {
                position: 'top-center',
              });
              setAvatarUpdatingNFTs(prev => {
                const newSet = new Set(prev);
                newSet.delete(nft.id);
                return newSet;
              });
              return;
            }
            
            // Update user avatar with the uploaded file
            console.log('[NFT Avatar] Updating avatar with file ID:', fileId);
            updateAvatarMutation.mutate(
              { avatarId: fileId },
              {
                onSuccess: () => {
                  console.log('[NFT Avatar] Avatar updated successfully');
                  toast.success('NFT set as profile picture!', {
                    position: 'top-center',
                  });
                  setAvatarUpdatingNFTs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(nft.id);
                    return newSet;
                  });
                },
                onError: (avatarError) => {
                  console.error('[NFT Avatar] Failed to update avatar:', avatarError);
                  toast.error('Failed to update profile picture', {
                    position: 'top-center',
                  });
                  setAvatarUpdatingNFTs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(nft.id);
                    return newSet;
                  });
                },
              }
            );
          },
          onError: (uploadError) => {
            console.error('[NFT Avatar] Upload failed:', uploadError);
            toast.error('Failed to upload avatar image', {
              position: 'top-center',
            });
            setAvatarUpdatingNFTs(prev => {
              const newSet = new Set(prev);
              newSet.delete(nft.id);
              return newSet;
            });
          },
        });
      } catch (error) {
        console.error('[NFT Avatar] Failed to set NFT as profile picture:', error);
        
        setAvatarUpdatingNFTs(prev => {
          const newSet = new Set(prev);
          newSet.delete(nft.id);
          return newSet;
        });
        
        let errorMsg = 'Failed to set NFT as avatar';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        
        toast.error(errorMsg, {
          position: 'top-center',
        });
      }
    },
    [fileUploadMutation, updateAvatarMutation]
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-8">
        <SettingsHeading
          title="Show NFTs"
          description="Display your NFT collection"
          action={
            <Switch
              checked={currentUser?.isPublicNft ?? false}
              onCheckedChange={handleShowNFTsChange}
              disabled={updateProfileMutation.isPending || currentUserPending}
            />
          }
        />
        <SettingsHeading
          title="Auto Sync"
          description="Automatically update from wallet"
          action={
            <Switch
              checked={currentUser?.isSynced ?? false}
              onCheckedChange={handleSyncChange}
              disabled={updateProfileMutation.isPending || currentUserPending}
            />
          }
        />
        <div className="flex items-center gap-6">
          <span className="font-pixel">Select Network</span>
          <div className="flex items-center gap-2">
            <Select
              value={selectedNetwork}
              onValueChange={value => handleNetworkChange(value as Network)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Networks</SelectLabel>
                  <SelectItem value="AVAX">Avalanche</SelectItem>
                  <SelectItem value="BASE">Base</SelectItem>
                  <SelectItem value="SOLANA">Solana</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedNetwork && (
              <Button
                variant="link"
                size="sm"
                onClick={() => handleNetworkChange(undefined)}
                className="font-pixel text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Featured NFTs Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 flex flex-col gap-4 duration-500">
        <div className="flex items-center justify-between">
          <h4>Featured NFTs</h4>
          <div className="flex items-center gap-2">
            {allNFTs.length > featuredNFTs.length && (
              <Button
                onClick={handleAddAllFeatured}
                variant="outline"
                size="sm"
                className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-all duration-200"
                disabled={
                  setFeaturedNFTMutation.isPending ||
                  isFetching ||
                  removeFeaturedNFTMutation.isPending
                }
              >
                <Plus className="mr-2 size-4" />
                {setFeaturedNFTMutation.isPending || isFetching
                  ? 'Adding...'
                  : 'Add All'}
              </Button>
            )}
            {featuredNFTs.length > 0 && (
              <Button
                onClick={handleClearAllFeatured}
                variant="outline"
                size="sm"
                className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                disabled={
                  setFeaturedNFTMutation.isPending ||
                  isFetching ||
                  removeFeaturedNFTMutation.isPending
                }
              >
                <X className="mr-2 size-4" />
                {setFeaturedNFTMutation.isPending || isFetching
                  ? 'Clearing...'
                  : 'Clear All'}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] animate-pulse items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-gray-300">
            <div className="space-y-2 text-center">
              <Loader2 className="text-primary mx-auto size-8 animate-spin" />
              <p className="text-muted text-sm">Loading NFTs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 p-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <div className="space-y-2 text-center">
              <h4 className="text-base font-semibold text-gray-700">
                Failed to Load NFTs
              </h4>
              <p className="text-sm text-gray-500">
                {error.message || 'There was an error loading your NFTs'}
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 size-4" />
              Try Again
            </Button>
          </div>
        ) : featuredNFTs.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {featuredNFTs.map(nft => (
              <div key={nft.id} className="group relative cursor-pointer">
                <div className="relative">
                  <NftAvatar
                    src={nft.image}
                    alt={nft.name}
                    name={nft.name}
                    collectionName={nft.collectionName}
                    size="xl"
                    showBorder={false}
                    className="size-[80px] rounded-xl border-4 border-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                  />

                  <Button
                    onClick={() => handleToggleFeatured(nft)}
                    className="absolute -top-2 -right-2 z-20 flex size-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:bg-red-600"
                    title="Remove from featured"
                    disabled={
                      removeFeaturedNFTMutation.isPending ||
                      setFeaturedNFTMutation.isPending
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-1 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {nft.name}
                    <div className="absolute top-full left-1/2 size-0 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl border p-6 text-center shadow-md">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <Wallet className="size-8 text-purple-500" />
            </div>
            <h4 className="mb-2 text-base font-semibold">No Featured NFTs</h4>
            <p className="text-muted mx-auto mb-4 max-w-sm text-sm">
              {allNFTs.length === 0
                ? "You don't have any NFTs in your collection yet"
                : 'Choose NFTs from your collection below to feature on your profile'}
            </p>
          </div>
        )}
      </div>

      {/* All NFTs Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 flex flex-col gap-4 duration-500">
        <div className="flex items-center justify-between">
          <h4>Your NFT Collection</h4>
          <div className="flex items-center gap-3">
            {selectedNetwork && (
              <span className="text-muted text-xs">
                Network: {selectedNetwork}
              </span>
            )}
            {!isLoading && (
              <span className="text-muted text-xs">
                {totalNFTs > 0
                  ? `${totalNFTs} ${totalNFTs === 1 ? 'NFT' : 'NFTs'}`
                  : '0 NFTs'}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="glass flex items-center justify-center rounded-md p-8">
            <Loader2 className="text-primary size-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="glass flex items-center justify-center rounded-md p-8">
            <p className="text-destructive text-sm">
              Error loading NFTs: {error.message || 'Unknown error'}
            </p>
          </div>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nfts.map(nft => (
              <div
                key={nft.id}
                className="glass group relative flex items-center justify-between gap-4 rounded-md p-4 transition-all hover:shadow-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={nft.image}
                    alt={nft.attributes?.name || nft.name || 'NFT'}
                    className="size-16 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-pixel truncate text-sm">
                      {nft.attributes?.name || nft.name || 'Unnamed NFT'}
                    </span>
                    <span className="text-muted truncate text-xs">
                      {nft.collectionName}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Button
                    variant="link"
                    size="sm"
                    className="font-pixel shrink-0 text-xs"
                    onClick={() => handleSetNftAsProfile(nft)}
                    disabled={
                      nft.image === undefined ||
                      (avatarUpdatingNFTs.size > 0 &&
                        !avatarUpdatingNFTs.has(nft.id)) ||
                      avatarUpdatingNFTs.has(nft.id)
                    }
                  >
                    {avatarUpdatingNFTs.has(nft.id) ? (
                      <>
                        <Loader2 className="mr-0 size-4 animate-spin md:mr-2" />
                        <span className="hidden md:block">Processing...</span>
                      </>
                    ) : (
                      'Set as Avatar'
                    )}
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className={cn(
                      'font-pixel shrink-0 text-xs',
                      nft.isFeatured ? 'text-destructive' : ''
                    )}
                    onClick={() => handleToggleFeatured(nft)}
                    disabled={
                      setFeaturedNFTMutation.isPending ||
                      removeFeaturedNFTMutation.isPending
                    }
                  >
                    {nft.isFeatured ? 'Remove' : 'Select'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass flex items-center justify-center rounded-md p-8">
            <p className="text-muted text-sm">
              {selectedNetwork
                ? `No NFTs found on ${selectedNetwork} network`
                : 'No NFTs available'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                pageNum => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={`page-${pageNum}`}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNum}
                          onClick={e => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Show ellipsis
                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={`ellipsis-${pageNum}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return null;
                }
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
