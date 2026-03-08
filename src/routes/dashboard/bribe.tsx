/**
 * Dashboard Bribe Page
 * Shows bribe history, stats, and settings quick access
 */

import { formatUnits } from 'viem';

import { ExternalLink, Gift, Loader2, Settings, Users, Wallet } from 'lucide-react';
import { useMemo } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTxExplorerUrl } from '@/config/bribe-contract';
import { useCurrentUser } from '@/hooks/use-auth';
import { useBribeHistory, useBribeStats, useBribeWalletSettings } from '@/hooks/use-bribe';
import { cn, walletAddressShortener } from '@/lib/utils';
import type { BribeNetwork, BribeRecord } from '@/types/bribe';

export const Route = createFileRoute('/dashboard/bribe')({
  component: RouteComponent,
});

// Format amount with proper decimals
const formatAmount = (amount: string, decimals: number): string => {
  try {
    // If amount looks like a raw bigint value (very large), format it
    if (amount.length > 10 && !amount.includes('.')) {
      return formatUnits(BigInt(amount), decimals);
    }
    // Otherwise return as is
    return amount;
  } catch {
    return amount;
  }
};

function RouteComponent() {
  const { data: currentUser } = useCurrentUser();
  const { data: bribeSettings, isLoading: isLoadingSettings } = useBribeWalletSettings();
  const { data: bribeStats, isLoading: isLoadingStats } = useBribeStats();
  const { data: bribeHistory, isLoading: isLoadingHistory } = useBribeHistory({ limit: 500 });

  // Combine loading states for potential future use
  void (isLoadingSettings || isLoadingStats || isLoadingHistory);

  // Group batch bribes by txHash
  const groupedBribes = useMemo(() => {
    if (!bribeHistory?.items || !currentUser?.id) return [];
    
    const groups: Record<string, {
      txHash: string;
      isReceived: boolean;
      recipients: number;
      totalAmount: number;
      tokenSymbol: string;
      tokenDecimals: number;
      message?: string;
      createdAt: string;
      network: string;
      firstBribe: BribeRecord;
    }> = {};
    
    bribeHistory.items.forEach((bribe: BribeRecord) => {
      const isReceived = bribe.receiver?.id === currentUser.id;
      const formattedAmount = parseFloat(formatAmount(bribe.amount, bribe.tokenDecimals || 18));
      const key = bribe.txHash || bribe.id || Math.random().toString();
      
      if (groups[key]) {
        groups[key].recipients += 1;
        groups[key].totalAmount += formattedAmount;
      } else {
        groups[key] = {
          txHash: bribe.txHash || '',
          isReceived,
          recipients: 1,
          totalAmount: formattedAmount,
          tokenSymbol: bribe.tokenSymbol,
          tokenDecimals: bribe.tokenDecimals || 18,
          message: bribe.message || undefined,
          createdAt: bribe.createdAt,
          network: bribe.network,
          firstBribe: bribe,
        };
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bribeHistory, currentUser]);

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

  const renderWalletCard = (
    label: string,
    isEnabled: boolean | undefined,
    walletAddress: string | null | undefined,
  ) => (
    <div className="rounded-xl p-3.5 flex items-center gap-3 bg-primary/5 border border-primary/10">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 shrink-0">
        <Wallet className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium leading-none mb-1">{label}</p>
        {isLoadingSettings ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : isEnabled && walletAddress ? (
          <code className="text-sm font-mono text-foreground block truncate">
            {walletAddressShortener(walletAddress)}
          </code>
        ) : (
          <Link to="/profile/settings/bribe">
            <span className="text-sm text-primary hover:underline cursor-pointer">Configure wallet</span>
          </Link>
        )}
      </div>
      {!isLoadingSettings && (
        <Badge
          className={cn(
            'text-[10px] px-2 py-0.5 shrink-0',
            isEnabled && walletAddress
              ? 'bg-green-500/15 text-green-500 border-green-500/25'
              : 'bg-muted/30 text-muted-foreground border-border/30'
          )}
        >
          {isEnabled && walletAddress ? 'Active' : 'Inactive'}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Bribe System</h2>
          <p className="text-muted-foreground text-sm">
            View your bribe history and manage settings
          </p>
        </div>
        <Link to="/profile/settings/bribe">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="size-3.5" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats + Wallets Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {/* Stats Cards */}
        <div className="glass rounded-xl p-5 flex flex-col items-center justify-center">
          {isLoadingStats ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/15 mb-2">
                <Gift className="size-4 text-green-500" />
              </div>
              <span className="text-2xl font-bold text-green-500 tabular-nums">{bribeStats?.totalReceived || 0}</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Received</span>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5 flex flex-col items-center justify-center">
          {isLoadingStats ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 mb-2">
                <Gift className="size-4 text-red-500" />
              </div>
              <span className="text-2xl font-bold text-red-500 tabular-nums">{bribeStats?.totalSent || 0}</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Sent</span>
            </>
          )}
        </div>

        {/* Wallet Cards */}
        <div className="sm:col-span-2 flex flex-col gap-3">
          {renderWalletCard(
            'EVM Wallet',
            bribeSettings?.evmBribeEnabled,
            bribeSettings?.evmBribeWallet,
          )}
          {renderWalletCard(
            'Solana Wallet',
            bribeSettings?.solBribeEnabled,
            bribeSettings?.solBribeWallet,
          )}
        </div>
      </div>

      {/* History */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Bribe History
        </h4>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : groupedBribes.length > 0 ? (
          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1 scrollbar-hide">
            {groupedBribes.map((group, index) => {
              const isBatch = group.recipients > 1;
              const otherUser = group.isReceived ? group.firstBribe.sender : group.firstBribe.receiver;

              return (
                <div
                  key={group.txHash || index}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                      group.isReceived ? 'bg-green-500/12' : 'bg-red-500/12'
                    )}
                  >
                    {isBatch && !group.isReceived ? (
                      <Users className="size-3.5 text-red-500" />
                    ) : (
                      <Gift className={cn('size-3.5', group.isReceived ? 'text-green-500' : 'text-red-500')} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">
                      {group.isReceived ? (
                        <>From <span className="text-primary">{otherUser?.name || 'Unknown'}</span></>
                      ) : isBatch ? (
                        <>Batch to <span className="text-primary">{group.recipients} recipients</span></>
                      ) : (
                        <>To <span className="text-primary">{otherUser?.name || 'Unknown'}</span></>
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatTimeAgo(group.createdAt)}</span>
                      {group.message && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="truncate max-w-[150px] italic">"{group.message}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums shrink-0',
                      group.isReceived ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {group.isReceived ? '+' : '-'}
                    {Number(group.totalAmount).toLocaleString()} {group.tokenSymbol}
                  </span>

                  {/* Explorer Link */}
                  {group.txHash && (
                    <a
                      href={getTxExplorerUrl(group.network as BribeNetwork, group.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Gift className="size-5 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No bribe history yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Send or receive your first bribe to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
