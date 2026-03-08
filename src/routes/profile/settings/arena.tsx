import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { createFileRoute } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SettingsHeading } from '@/components/settings-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useArenaConnectionStatus,
  useArenaStats,
  useCurrentUser,
  useDisableArenaYapping,
  useEnableArenaYapping,
  useSyncArena,
} from '@/hooks';

export const Route = createFileRoute('/profile/settings/arena')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: currentUser } = useCurrentUser();
  const {
    data: connectionStatus,
    isLoading: isConnectionLoading,
  } = useArenaConnectionStatus();

  const {
    data: arenaStats,
    isLoading: isStatsLoading,
  } = useArenaStats();

  const syncMutation = useSyncArena();
  const enableYapping = useEnableArenaYapping();
  const disableYapping = useDisableArenaYapping();

  const isConnected = connectionStatus?.found && connectionStatus.status === 'ACTIVE';
  const isYappingEnabled = connectionStatus?.isEnabled ?? false;
  const isToggling = enableYapping.isPending || disableYapping.isPending;

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success('Arena account synced successfully!');
        } else {
          toast.error(data.message || 'Arena account not found');
        }
      },
      onError: () => {
        toast.error('Failed to sync Arena account');
      },
    });
  };

  const handleYappingToggle = (checked: boolean) => {
    if (checked) {
      enableYapping.mutate(undefined, {
        onSuccess: () => toast.success('Arena Yapping enabled!'),
        onError: () => toast.error('Failed to enable Arena Yapping'),
      });
    } else {
      disableYapping.mutate(undefined, {
        onSuccess: () => toast.success('Arena Yapping disabled'),
        onError: () => toast.error('Failed to disable Arena Yapping'),
      });
    }
  };

  if (isConnectionLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Arena Yapping Toggle */}
      <SettingsHeading
        title="Arena Yapping"
        description="Enable or disable Arena Yapping point system"
        action={
          <Switch
            checked={isYappingEnabled}
            onCheckedChange={handleYappingToggle}
            disabled={isToggling}
          />
        }
      />

      {/* Connection Status */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="grid">
            <h4>Arena Connection</h4>
            <span className="text-muted text-xs">
              Automatic detection via Twitter or wallet address
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>

        {isConnected ? (
          <div className="glass rounded-md p-4 sm:p-6 border border-success/20 bg-success/5">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {connectionStatus.arenaProfile?.profilePicture ? (
                  <img
                    src={connectionStatus.arenaProfile.profilePicture}
                    alt="Arena"
                    className="size-12 rounded-full ring-2 ring-success/30 flex-shrink-0 object-cover"
                  />
                ) : (
                  <ProfileAvatar
                    src=""
                    name={connectionStatus.arenaProfile?.userName || connectionStatus.arenaHandle || ''}
                    size="md"
                    className="size-12 ring-2 ring-success/30 flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-pixel text-sm sm:text-base truncate">
                      {connectionStatus.arenaProfile?.userName || connectionStatus.arenaHandle}
                    </h5>
                    <Badge variant="default" className="text-[10px] flex-shrink-0">
                      Active
                    </Badge>
                  </div>
                  <a
                    href={`https://arena.social/${connectionStatus.arenaHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline truncate"
                  >
                    @{connectionStatus.arenaHandle}
                  </a>
                  <span className="text-muted text-[10px]">
                    Found via {connectionStatus.matchedBy === 'twitter' ? 'Twitter' : 'Wallet'}:{' '}
                    <span className="font-mono">{connectionStatus.matchedIdentifier}</span>
                  </span>
                </div>
              </div>

              {/* Mini Stats */}
              {!isStatsLoading && arenaStats && (
                <div className="flex gap-4 sm:gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="font-pixel text-lg text-primary">{arenaStats.totalPointsEarned}</p>
                    <p className="text-muted text-[10px]">Total Points</p>
                  </div>
                  <div className="text-center">
                    <p className="font-pixel text-lg">{arenaStats.totalThreadsMatched}</p>
                    <p className="text-muted text-[10px]">Threads</p>
                  </div>
                  <div className="text-center">
                    <p className="font-pixel text-lg text-tertiary">{arenaStats.todayPointsEarned}/50</p>
                    <p className="text-muted text-[10px]">Today</p>
                  </div>
                </div>
              )}
            </div>

            {connectionStatus.lastSyncedAt && (
              <div className="mt-3 pt-3 border-t border-success/10">
                <span className="text-muted text-[10px]">
                  Last synced: {new Date(connectionStatus.lastSyncedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass rounded-md p-4 sm:p-6 border border-tertiary/20 bg-tertiary/5">
            <div className="flex items-start gap-3">
              <div className="glass flex size-10 items-center justify-center rounded-lg flex-shrink-0">
                <Icons.arena className="size-5 text-muted" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-pixel text-sm">Not Found</h5>
                  <Badge variant="destructive" className="text-[10px]">
                    Disconnected
                  </Badge>
                </div>
                <p className="text-muted text-xs">
                  We couldn't find your Arena account. Make sure you have an account at{' '}
                  <a
                    href="https://arena.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    arena.social
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="glass rounded-md p-4 sm:p-6">
        <h5 className="font-pixel text-sm mb-3">How it works</h5>
        <ul className="text-muted text-xs sm:text-sm space-y-2 list-disc list-inside ml-1">
          <li>System automatically searches for your Arena account</li>
          <li>
            First tries your Twitter handle:{' '}
            <span className="text-foreground font-medium">
              @{connectionStatus?.matchedIdentifier || currentUser?.slug || 'username'}
            </span>
          </li>
          <li>Falls back to your connected Arena wallet addresses</li>
          <li>
            Awards points per thread containing{' '}
            <span className="text-foreground font-medium">"guud"</span> or{' '}
            <span className="text-foreground font-medium">"guudscore"</span>
          </li>
          <li>Maximum <span className="text-primary font-medium">50 points</span> per day</li>
        </ul>
      </div>
    </div>
  );
}
