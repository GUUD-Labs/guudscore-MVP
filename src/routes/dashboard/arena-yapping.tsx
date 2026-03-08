import { useState } from 'react';
import { Flame, RefreshCw, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { createFileRoute } from '@tanstack/react-router';

import { AnimatedNumber } from '@/components/animated-number';
import ArenaAvatarFrame from '@/components/arena-avatar-frame';
import { Card } from '@/components/card';
import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useArenaConnectionStatus,
  useArenaMonthlyHistory,
  useArenaProgress,
  useArenaStats,
  useSyncArena,
} from '@/hooks';

export const Route = createFileRoute('/dashboard/arena-yapping')({
  component: RouteComponent,
});

/** 8-bit retro progress bar - Windows XP style, all purple */
function PixelProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const totalSegments = 10;
  const filledSegments = Math.round((Math.min(value, max) / max) * totalSegments);

  return (
    <div
      className={`flex gap-[3px] p-[3px] rounded-[2px] ${className}`}
      style={{
        background: 'linear-gradient(180deg, oklch(0.15 0.04 286) 0%, oklch(0.12 0.05 286) 50%, oklch(0.1 0.04 286) 100%)',
        border: '2px solid oklch(0.25 0.06 286)',
        boxShadow: 'inset 0 1px 0 oklch(0.08 0.03 286), inset 0 -1px 0 oklch(0.2 0.05 286)',
      }}
    >
      {Array.from({ length: totalSegments }, (_, i) => {
        const isFilled = i < filledSegments;

        return (
          <div
            key={i}
            className="h-4 sm:h-5 flex-1 transition-all duration-300"
            style={isFilled ? {
              background: 'linear-gradient(180deg, oklch(0.72 0.22 286) 0%, oklch(0.62 0.22 286) 40%, oklch(0.55 0.20 286) 60%, oklch(0.65 0.22 286) 100%)',
              boxShadow: '0 0 4px oklch(0.62 0.22 286 / 0.5)',
            } : {
              background: 'oklch(0.13 0.04 286 / 0.4)',
            }}
          />
        );
      })}
    </div>
  );
}

function formatMonth(month: string) {
  // month is "2026-02" format
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function RouteComponent() {
  const [chartMode, setChartMode] = useState<'points' | 'threads'>('points');

  const {
    data: connectionStatus,
    isLoading: isConnectionLoading,
  } = useArenaConnectionStatus();

  const {
    data: arenaStats,
    isLoading: isStatsLoading,
  } = useArenaStats();

  const {
    data: progress,
  } = useArenaProgress();

  const {
    data: monthlyHistory,
  } = useArenaMonthlyHistory(6);

  const syncMutation = useSyncArena();

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

  const isLoading = isConnectionLoading || isStatsLoading;
  const isConnected = connectionStatus?.found && connectionStatus.status === 'ACTIVE';
  const dailyPoints = progress?.daily?.pointsEarned ?? arenaStats?.todayPointsEarned ?? 0;
  const dailyLimit = progress?.daily?.dailyLimit ?? 5;
  const dailyMax = dailyLimit * 10; // 5 slots * 10 points each = 50

  // Chart data from monthly history endpoint
  const chartData = (monthlyHistory?.months ?? []).map((m) => ({
    month: formatMonth(m.month),
    points: m.pointsEarned,
    threads: m.threadsMatched,
  })).reverse();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-28 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-xl sm:text-2xl">Arena Yapping</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {isConnected ? (
        <>
          {/* Arena Profile Card */}
          <div className="glass rounded-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <ArenaAvatarFrame
                  arenaPoints={progress?.totalPointsEarned ?? arenaStats?.totalPointsEarned}
                  size="lg"
                  showPoints={true}
                  hoverExpand
                >
                  {connectionStatus.arenaProfile?.profilePicture ? (
                    <img
                      src={connectionStatus.arenaProfile.profilePicture}
                      alt="Arena Profile"
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <ProfileAvatar
                      src=""
                      name={connectionStatus.arenaProfile?.userName || connectionStatus.arenaHandle || ''}
                      size="full"
                      className="size-full"
                    />
                  )}
                </ArenaAvatarFrame>
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="font-pixel text-base sm:text-lg truncate">
                    {connectionStatus.arenaProfile?.userName || connectionStatus.arenaHandle}
                  </h4>
                  <a
                    href={`https://arena.social/${connectionStatus.arenaHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs sm:text-sm hover:underline truncate"
                  >
                    @{connectionStatus.arenaHandle}
                  </a>
                  <div className="flex items-center gap-3 text-muted text-[10px] sm:text-xs mt-0.5">
                    <span>{connectionStatus.arenaProfile?.threadCount ?? 0} threads</span>
                    <span>{connectionStatus.arenaProfile?.followerCount ?? 0} followers</span>
                    <span>{connectionStatus.arenaProfile?.followingsCount ?? 0} following</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/30 rounded-sm">
                  <div className="size-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-success text-[10px] sm:text-xs font-medium">
                    Connected via {connectionStatus.matchedBy === 'twitter' ? 'Twitter' : 'Wallet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            <Card title="Total Points" headingClassName="text-xs sm:text-sm">
              <AnimatedNumber
                value={progress?.totalPointsEarned ?? arenaStats?.totalPointsEarned ?? 0}
                className="font-pixel text-xl sm:text-2xl lg:text-3xl text-primary"
              />
            </Card>
            <Card title="Total Threads" headingClassName="text-xs sm:text-sm">
              <AnimatedNumber
                value={progress?.totalThreadsMatched ?? arenaStats?.totalThreadsMatched ?? 0}
                className="font-pixel text-xl sm:text-2xl lg:text-3xl"
              />
            </Card>
            <Card title="Today's Points" headingClassName="text-xs sm:text-sm">
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={dailyPoints}
                  className="font-pixel text-xl sm:text-2xl lg:text-3xl text-tertiary"
                />
                <span className="text-muted text-xs">/{dailyMax}</span>
              </div>
            </Card>
            <Card title="Remaining Slots" headingClassName="text-xs sm:text-sm">
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={progress?.daily?.remainingSlots ?? arenaStats?.remainingDailySlots ?? 5}
                  className="font-pixel text-xl sm:text-2xl lg:text-3xl text-accent"
                />
                <span className="text-muted text-xs">/{dailyLimit}</span>
              </div>
            </Card>
          </div>

          {/* Daily Progress + Streak */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            <div className="glass rounded-md p-4 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <span className="font-pixel text-sm">Daily Progress</span>
                <span className="font-pixel text-xs text-primary">
                  {dailyPoints}<span className="text-muted">/{dailyMax}</span>
                </span>
              </div>

              {/* 8-bit Progress Bar */}
              <PixelProgressBar value={dailyPoints} max={dailyMax} />

              <div className="flex items-center justify-between mt-2">
                <span className="text-muted text-[10px] sm:text-xs">
                  {progress?.daily?.threadsMatched ?? arenaStats?.todayThreadsMatched ?? 0} threads today
                </span>
                <span className="text-muted text-[10px] sm:text-xs">
                  {progress?.daily?.remainingSlots ?? arenaStats?.remainingDailySlots ?? 5} slots left
                </span>
              </div>

              {/* Weekly summary */}
              {progress?.weekly && (
                <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className="size-3.5 text-tertiary" />
                    <span className="text-xs">
                      <span className="text-foreground font-medium">{progress.weekly.pointsEarned}</span>
                      <span className="text-muted"> pts this week</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="size-3.5 text-primary" />
                    <span className="text-xs">
                      <span className="text-foreground font-medium">{(progress.weekly.avgPointsPerDay ?? 0).toFixed(1)}</span>
                      <span className="text-muted"> avg/day</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Streak Card */}
            <div className="glass rounded-md p-4 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="size-4 text-tertiary" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-pixel text-3xl sm:text-4xl text-tertiary">
                    {progress?.streak?.current ?? 0}
                  </p>
                  <p className="text-muted text-[10px] sm:text-xs mt-0.5">day streak</p>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <div>
                    <p className="font-pixel text-sm text-primary">{progress?.streak?.longest ?? 0}</p>
                    <p className="text-muted text-[10px]">best</p>
                  </div>
                  {progress?.monthly && (
                    <div>
                      <p className="font-pixel text-sm">{progress.monthly.activeDays}</p>
                      <p className="text-muted text-[10px]">active days</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Points History Chart */}
          <div className="glass rounded-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h5 className="font-pixel text-sm">Points History</h5>
              <div className="flex gap-1 bg-secondary/30 rounded-sm p-0.5">
                <button
                  onClick={() => setChartMode('points')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                    chartMode === 'points'
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Points
                </button>
                <button
                  onClick={() => setChartMode('threads')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                    chartMode === 'threads'
                      ? 'bg-tertiary/20 text-tertiary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Threads
                </button>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradientPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lineGradientThreads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--tertiary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--tertiary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      className="font-pixel text-muted text-xs"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      className="font-pixel text-muted text-xs"
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass min-w-[140px] rounded-xl p-3">
                              <p className="text-xs font-medium mb-1">{label}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`size-2 rounded-full ${chartMode === 'points' ? 'bg-primary' : 'bg-tertiary'}`} />
                                <span className="text-muted">{chartMode === 'points' ? 'Points' : 'Threads'}:</span>
                                <span className="font-pixel">{payload[0].value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartMode}
                      stroke={chartMode === 'points' ? 'var(--primary)' : 'var(--tertiary)'}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: chartMode === 'points' ? 'var(--primary)' : 'var(--tertiary)', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: chartMode === 'points' ? 'var(--primary)' : 'var(--tertiary)', strokeWidth: 2, stroke: 'var(--background)' }}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <p className="text-muted text-sm">No history data yet</p>
              </div>
            )}

            {/* Chart legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${chartMode === 'points' ? 'bg-primary' : 'bg-tertiary'}`} />
                <span className="text-muted text-[10px] sm:text-xs">
                  {chartMode === 'points' ? 'Monthly Points' : 'Monthly Threads'}
                </span>
              </div>
              <span className="text-muted text-[10px] sm:text-xs">Last 6 months</span>
            </div>
          </div>

          {/* Monthly Summary */}
          {progress?.monthly && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              <div className="glass rounded-md p-4">
                <p className="text-muted text-[10px] sm:text-xs mb-1">This Month</p>
                <p className="font-pixel text-lg sm:text-xl text-primary">{progress.monthly.pointsEarned}</p>
                <p className="text-muted text-[10px]">points</p>
              </div>
              <div className="glass rounded-md p-4">
                <p className="text-muted text-[10px] sm:text-xs mb-1">Monthly Threads</p>
                <p className="font-pixel text-lg sm:text-xl">{progress.monthly.threadsMatched}</p>
                <p className="text-muted text-[10px]">threads</p>
              </div>
              <div className="glass rounded-md p-4">
                <p className="text-muted text-[10px] sm:text-xs mb-1">Best Day</p>
                <p className="font-pixel text-lg sm:text-xl text-tertiary">{progress.monthly.bestDayPoints ?? 0}</p>
                <p className="text-muted text-[10px]">
                  {progress.monthly.bestDay
                    ? new Date(progress.monthly.bestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div className="glass rounded-md p-4">
                <p className="text-muted text-[10px] sm:text-xs mb-1">Active Days</p>
                <p className="font-pixel text-lg sm:text-xl text-accent">{progress.monthly.activeDays}</p>
                <p className="text-muted text-[10px]">this month</p>
              </div>
            </div>
          )}

          {/* How to Earn */}
          <div className="glass rounded-md p-4 sm:p-6 border border-tertiary/20 bg-tertiary/5">
            <div className="flex items-start gap-3">
              <Icons.arena className="size-5 flex-shrink-0 text-tertiary mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <h5 className="font-pixel text-sm text-tertiary">How to earn points</h5>
                <ul className="text-muted text-xs sm:text-sm space-y-1">
                  <li>System automatically searches for your Arena account</li>
                  <li>First tries your Twitter handle: <span className="text-foreground font-medium">@{connectionStatus.arenaHandle || 'username'}</span></li>
                  <li>Falls back to your connected Arena wallet addresses</li>
                  <li>Awards points per thread containing <span className="text-foreground font-medium">"guud"</span> or <span className="text-foreground font-medium">"guudscore"</span></li>
                  <li>Maximum <span className="text-primary font-medium">50 points</span> per day</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Last Synced */}
          {connectionStatus.lastSyncedAt && (
            <div className="text-center text-muted text-[10px] sm:text-xs">
              Last synced: {new Date(connectionStatus.lastSyncedAt).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        /* Not Connected State */
        <div className="glass rounded-md p-8 sm:p-12 text-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="glass flex size-16 items-center justify-center rounded-lg">
              <Icons.arena className="size-8 text-muted" />
            </div>
            <h4 className="font-pixel text-lg">Arena Account Not Found</h4>
            <p className="text-muted text-sm">
              We couldn't find your Arena account using your Twitter handle or wallet addresses.
              Make sure you have an account at{' '}
              <a
                href="https://arena.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                arena.social
              </a>
            </p>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Searching...' : 'Try Syncing Again'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
