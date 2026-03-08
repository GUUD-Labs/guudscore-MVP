import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGiveVouch, useRemoveVouch, useUserVouchStats, useVouchBalance } from '@/hooks';
import { cn } from '@/lib/utils';
import { VouchType } from '@/types/vouch';

interface VouchButtonsProps {
  targetUserId: string;
  isOwnProfile?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VouchButtons = ({
  targetUserId,
  isOwnProfile = false,
  className,
  size = 'md',
}: VouchButtonsProps) => {
  const { data: balance } = useVouchBalance();
  const { data: stats, isLoading: statsLoading } = useUserVouchStats(targetUserId);
  const { mutate: giveVouch, isPending: isGiving } = useGiveVouch();
  const { mutate: removeVouch, isPending: isRemoving } = useRemoveVouch();

  const [error, setError] = useState<string | null>(null);

  const handleVouch = (vouchType: VouchType) => {
    setError(null);

    // If already vouched with this type, remove it
    if (stats?.myVouch === vouchType) {
      removeVouch(targetUserId, {
        onError: (err: any) => {
          setError(err.message || 'Failed to remove vouch');
        },
      });
      return;
    }

    // If vouched with different type, need to remove first
    if (stats?.myVouch && stats.myVouch !== vouchType) {
      setError('Remove current vouch first to change');
      return;
    }

    // Check balance
    if (!balance || balance.balance < 1) {
      setError('Insufficient vouch balance');
      return;
    }

    giveVouch(
      { targetUserId, vouchType },
      {
        onError: (err: any) => {
          setError(err.message || 'Failed to give vouch');
        },
      }
    );
  };

  // Don't show on own profile
  if (isOwnProfile) {
    return null;
  }

  const isPending = isGiving || isRemoving;
  const hasLiked = stats?.myVouch === VouchType.LIKE;
  const hasDisliked = stats?.myVouch === VouchType.DISLIKE;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  sizeClasses[size],
                  'rounded-full transition-all',
                  hasLiked
                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    : 'hover:bg-green-500/10 hover:text-green-500'
                )}
                disabled={isPending || statsLoading}
                onClick={() => handleVouch(VouchType.LIKE)}
              >
                {isPending && isGiving ? (
                  <Loader2 className={cn(iconSizeClasses[size], 'animate-spin')} />
                ) : (
                  <Icons.thumbsUp
                    className={cn(iconSizeClasses[size], hasLiked && 'fill-current')}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasLiked ? 'Remove Like' : 'Like (-1 vouch)'}
            </TooltipContent>
          </Tooltip>

          {/* Stats Display */}
          <div className="flex flex-col items-center min-w-[60px]">
            {statsLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span
                  className={cn(
                    'text-lg font-bold',
                    (stats?.netScore ?? 0) > 0
                      ? 'text-green-500'
                      : (stats?.netScore ?? 0) < 0
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                  )}
                >
                  {(stats?.netScore ?? 0) > 0 ? '+' : ''}
                  {stats?.netScore ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats?.likesReceived ?? 0} / {stats?.dislikesReceived ?? 0}
                </span>
              </>
            )}
          </div>

          {/* Dislike Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  sizeClasses[size],
                  'rounded-full transition-all',
                  hasDisliked
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'hover:bg-red-500/10 hover:text-red-500'
                )}
                disabled={isPending || statsLoading}
                onClick={() => handleVouch(VouchType.DISLIKE)}
              >
                {isPending && isRemoving ? (
                  <Loader2 className={cn(iconSizeClasses[size], 'animate-spin')} />
                ) : (
                  <Icons.thumbsDown
                    className={cn(iconSizeClasses[size], hasDisliked && 'fill-current')}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasDisliked ? 'Remove Dislike' : 'Dislike (-1 vouch)'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Error Message */}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </TooltipProvider>
  );
};
