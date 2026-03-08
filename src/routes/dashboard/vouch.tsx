import { Loader2 } from 'lucide-react';

import { createFileRoute } from '@tanstack/react-router';

import { ErrorMessage } from '@/components/error-message';
import Icons from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useChain } from '@/contexts/chain-context';
import {
  useSeasonInfo,
  useVouchBalance,
  useVouchHistory,
  useVouchRewards,
} from '@/hooks';
import { cn } from '@/lib/utils';
import { VouchTransactionType } from '@/types/vouch';

export const Route = createFileRoute('/dashboard/vouch')({
  component: RouteComponent,
});

// Simple date formatting helper
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Helper to format transaction reason
const formatTransactionReason = (reason: string) => {
  // Remove user IDs from vouch transactions using regex
  // Matches patterns like "Gave LIKE to user [anything]" or "Removed LIKE from user [anything]"
  const gaveVouchPattern = /^Gave (LIKE|like|DISLIKE|dislike) to user .+$/i;
  const removedVouchPattern = /^Removed (LIKE|like|DISLIKE|dislike) from user .+$/i;
  
  if (gaveVouchPattern.test(reason)) {
    // Check if it's a like or dislike
    if (reason.toLowerCase().includes('like') && !reason.toLowerCase().includes('dislike')) {
      return 'Gave like to user';
    } else if (reason.toLowerCase().includes('dislike')) {
      return 'Gave dislike to user';
    }
  }
  
  if (removedVouchPattern.test(reason)) {
    // Check if it's a like or dislike removal
    if (reason.toLowerCase().includes('like') && !reason.toLowerCase().includes('dislike')) {
      return 'Removed like from user';
    } else if (reason.toLowerCase().includes('dislike')) {
      return 'Removed dislike from user';
    }
  }
  
  return reason;
};

function RouteComponent() {
  const { selectedNetwork } = useChain();
  
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useVouchBalance();
  const { data: history, isLoading: historyLoading } = useVouchHistory({ limit: 20 });
  const { data: rewards } = useVouchRewards(selectedNetwork);
  const { data: season } = useSeasonInfo(selectedNetwork);

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (balanceError) {
    return (
      <ErrorMessage
        header="Error loading vouch data"
        error={balanceError?.message || 'Unknown error'}
      />
    );
  }

  const getTransactionIcon = (type: VouchTransactionType) => {
    switch (type) {
      case VouchTransactionType.TWITTER_SIGNUP:
        return <Icons.twitter className="size-2.5" />;
      case VouchTransactionType.REFERRAL_BONUS:
        return <Icons.share2 className="size-2.5" />;
      case VouchTransactionType.LEADERBOARD_REWARD:
        return <Icons.zap className="size-2.5" />;
      case VouchTransactionType.LIKE_SPENT:
        return <Icons.thumbsUp className="size-2.5" />;
      case VouchTransactionType.DISLIKE_SPENT:
        return <Icons.thumbsDown className="size-2.5" />;
      case VouchTransactionType.LIKE_REMOVED:
        return <Icons.thumbsUp className="size-2.5" />;
      case VouchTransactionType.DISLIKE_REMOVED:
        return <Icons.thumbsDown className="size-2.5" />;
      case VouchTransactionType.ADMIN_ADJUSTMENT:
        return <Icons.settings className="size-2.5" />;
      default:
        return <Icons.heart className="size-2.5" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Season Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Vouch System</h2>
          <p className="text-muted-foreground text-sm">
            Like or dislike other users to vouch for them
          </p>
        </div>
        {season && (
          <Badge
            variant={season.isActive ? 'default' : 'secondary'}
            className={cn(
              'px-3 py-1.5 text-xs font-medium',
              season.isActive && 'bg-primary/20 text-primary border-primary/30'
            )}
          >
            Season {season.seasonNumber} {season.isActive ? `• ${season.daysRemaining}d left` : '• Ended'}
          </Badge>
        )}
      </div>

      {/* Balance Hero Card */}
      <div className="glass rounded-xl p-5">
        <div className="grid gap-5 sm:grid-cols-4">
          {/* Available Balance - Hero stat */}
          <div className="flex flex-col items-center justify-center gap-1 sm:border-r sm:border-border/20 sm:pr-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 mb-1">
              <Icons.heart className="size-4 text-primary" />
            </div>
            <span className="text-3xl font-bold text-primary tabular-nums">{balance?.balance ?? 0}</span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Balance</span>
          </div>

          {/* Likes */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/15 mb-1">
              <Icons.thumbsUp className="size-4 text-green-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums">{balance?.likesGiven ?? 0}</span>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xl font-bold tabular-nums">{balance?.likesReceived ?? 0}</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Given / Received</span>
          </div>

          {/* Dislikes */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 mb-1">
              <Icons.thumbsDown className="size-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums">{balance?.dislikesGiven ?? 0}</span>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xl font-bold tabular-nums">{balance?.dislikesReceived ?? 0}</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Given / Received</span>
          </div>

          {/* Earned / Spent */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 mb-1">
              <Icons.zap className="size-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-green-500 tabular-nums">{balance?.totalEarned ?? 0}</span>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xl font-bold text-red-500 tabular-nums">{balance?.totalSpent ?? 0}</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Earned / Spent</span>
          </div>
        </div>
      </div>

      {/* How to Earn + Season Info */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            How to Earn Vouches
          </h4>
          {season && (
            <span className="text-[11px] text-muted-foreground">
              {season.network} Network • <span className="text-primary font-semibold">{season.daysRemaining} days</span> remaining in Season {season.seasonNumber}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {[
            { icon: <Icons.twitter className="size-3.5 text-primary" />, title: 'Twitter Signup', desc: 'One-time bonus for connecting your Twitter account', value: '+5' },
            { icon: <Icons.share2 className="size-3.5 text-primary" />, title: 'Refer a Friend', desc: 'Earn vouches for each successful referral', value: '+5' },
            { icon: <Icons.zap className="size-3.5 text-primary" />, title: 'Leaderboard Rewards', desc: `Top 100 ranked users earn vouches every 30 days${season ? `next reward in ${season.daysRemaining}d` : ''}`, value: '+3–25' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                {item.icon}
              </div>
              <span className="font-medium text-sm shrink-0">{item.title}</span>
              <span className="text-[11px] text-muted-foreground truncate">{item.desc}</span>
              <span className="text-primary font-bold text-sm ml-auto shrink-0">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Leaderboard Tiers - Compact */}
        <div className="mt-4 pt-4 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground font-medium mb-2.5">Reward Tiers (every 30 days per network)</p>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { label: '1st', value: '+25', color: 'text-yellow-500' },
              { label: '2nd', value: '+20', color: 'text-gray-300' },
              { label: '3rd', value: '+15', color: 'text-orange-400' },
              { label: '4-10', value: '+10', color: 'text-blue-400' },
              { label: '11-100', value: '+3', color: 'text-muted-foreground' },
            ].map((tier) => (
              <div key={tier.label} className="p-1.5 rounded bg-primary/8">
                <span className={cn('text-[10px] font-bold block', tier.color)}>{tier.label}</span>
                <span className="text-[10px] text-primary font-semibold">{tier.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Your Rewards */}
      {rewards && rewards.rewards.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Your Rewards
          </h4>
          <div className="space-y-2">
            {rewards.rewards.map((reward, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{reward.network}</Badge>
                  <span className="text-xs">
                    S{reward.seasonNumber} • <span className="font-bold">#{reward.rank}</span>
                  </span>
                </div>
                <span className="font-bold text-green-500 text-sm">+{reward.reward}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 mt-3">
              <span className="text-xs font-medium">Total Rewards</span>
              <span className="font-bold text-green-500">+{rewards.totalRewards}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Transaction History
        </h4>
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary size-5 animate-spin" />
          </div>
        ) : history?.transactions && history.transactions.length > 0 ? (
          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1 scrollbar-hide">
            {history.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors group">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                  tx.amount > 0 ? 'bg-green-500/12' : 'bg-red-500/12'
                )}>
                  <div className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                    {getTransactionIcon(tx.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">{formatTransactionReason(tx.reason)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimeAgo(tx.createdAt)}
                    {tx.network && <span className="opacity-50"> • {tx.network}</span>}
                  </span>
                </div>
                <span className={cn(
                  'font-bold text-sm tabular-nums shrink-0',
                  getTransactionColor(tx.amount)
                )}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Icons.heart className="size-5 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No transactions yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Earn vouches by signing up, referring friends, or ranking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
