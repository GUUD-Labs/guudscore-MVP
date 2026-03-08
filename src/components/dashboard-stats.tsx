import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

import { useState } from 'react';

import { Link, useSearch } from '@tanstack/react-router';

import { AnimatedNumber } from '@/components/animated-number';
import { Card } from '@/components/card';
import { CardCustomizationModal } from '@/components/card-customization-modal';
import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SharePreviewDialog } from '@/components/share-preview-dialog';
import { type CardTemplate } from '@/components/social-media-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useChain } from '@/contexts/chain-context';
import { useCompleteProfile, useCurrentUser, useDashboardMetrics } from '@/hooks';

export const DashboardStats = () => {
  const { selectedNetwork } = useChain();
  const { data: profileData, isLoading: isProfileLoading } = useCurrentUser();
  const { data: dashboardMetrics, isLoading: isMetricsLoading } =
    useDashboardMetrics(selectedNetwork);
  // Network-aware complete profile for GuudScore
  const { data: completeProfileData } = useCompleteProfile();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CardTemplate>('guud');

  // Get search params from router
  const searchParams = useSearch({ from: '/dashboard' });
  const useMockWallets = searchParams?.useMockWallets ?? false;
  const testLockedTemplates = searchParams?.testLockedTemplates ?? false;

  const handleShareCardClick = (template: CardTemplate) => {
    setSelectedTemplate(template);
    setIsSharePreviewOpen(true);
  };

  const chartData = [
    { value: 400 },
    { value: 450 },
    { value: 380 },
    { value: 520 },
    { value: 600 },
    { value: 680 },
    { value: 744 },
  ];

  const resolvedDisplayName =
    profileData?.name?.trim() ||
    profileData?.username?.trim() ||
    profileData?.slug?.trim() ||
    profileData?.email?.split('@')[0] ||
    'GUUD Friend';

  const profile = {
    photoUrl:
      typeof profileData?.photo === 'object' && profileData.photo !== null
        ? profileData.photo.url
        : profileData?.photo || '',
    username: resolvedDisplayName,
    slug:
      profileData?.slug || profileData?.username || profileData?.email || '',
    xUrl: profileData?.social?.find(user => user.platform === 'x')?.url || '',
    xUsername:
      profileData?.social
        ?.find(user => user.platform === 'x')
        ?.url.split('/')
        .pop() || '',
  };

  // Get network-specific GuudScore from completeProfileData (uses selectedNetwork)
  const getNetworkScore = () => {
    if (completeProfileData?.user?.guudScore) {
      return completeProfileData.user.guudScore;
    }
    if (completeProfileData?.guudScore) {
      return completeProfileData.guudScore;
    }
    if (typeof completeProfileData?.totalScore === 'number') {
      return {
        totalScore: completeProfileData.totalScore,
        tier: completeProfileData.tier,
        rank: completeProfileData.rank,
      };
    }
    return null;
  };

  const networkScore = getNetworkScore();

  const guudScoreSummary = {
    // Prioritize network-specific score from completeProfileData
    // Use 0 as default if network score exists but totalScore is 0
    totalScore: networkScore !== null 
      ? (networkScore.totalScore ?? 0)
      : (typeof profileData?.guudScore === 'number'
        ? profileData.guudScore
        : (profileData?.guudScore?.totalScore ??
          dashboardMetrics?.guudScore ??
          0)),
    tier:
      networkScore?.tier ||
      profileData?.guudScore?.tier ||
      dashboardMetrics?.reputation?.tier ||
      'Identity Pending',
    rank: networkScore?.rank ?? profileData?.guudScore?.rank ?? null,
  };

  const cardDescription = 'Your current overall identity in the system.';

  const dashboardMetricsData = {
    guudScoreEarned: guudScoreSummary.totalScore,
    ecosystemImpact: dashboardMetrics?.ecosystemImpact || {
      current: 0,
      ytd: 0,
    },
    guudFriends: dashboardMetrics?.guudFriends.list || [],
    guudFriendsCount: dashboardMetrics?.guudFriends.total || 0,
    guudFriendsYTD: dashboardMetrics?.guudFriends.ytd || 0,
    reputationTier: dashboardMetrics?.reputation || {
      current: 0,
      ytd: 0,
      tier: 'N/A',
    },
  };

  return (
    <div className="flex w-full flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 sm:gap-6 w-full lg:w-auto">
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
          {isProfileLoading ? (
            <>
              <Skeleton className="size-16 sm:size-20 lg:size-24 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 sm:h-7 lg:h-8 w-24 sm:w-28 lg:w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 sm:h-5 w-20 sm:w-24" />
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/profile/$username" params={{ username: profile.slug }}>
                <ProfileAvatar
                  src={profile.photoUrl}
                  name={profile.username}
                  size="xl"
                  className="ring-background hover:ring-primary/50 size-16 sm:size-20 lg:size-24 ring-2 transition-all flex-shrink-0"
                />
              </Link>
              <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
                <h4 className="text-xl sm:text-2xl lg:text-3xl truncate">{profile.username}</h4>
                <a
                  href={profile.xUrl}
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <Icons.xLogo className="fill-tertiary size-3 sm:size-4 flex-shrink-0" />{' '}
                  <span className="text-tertiary text-xs sm:text-sm font-medium truncate">
                    @{profile.slug}
                  </span>
                </a>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
          <Button variant="link" asChild>
            <Link
              to="/profile/settings"
              className="font-pixel !text-accent h-auto !p-0 text-xs sm:text-sm hover:!underline hover:opacity-80 text-left"
            >
              Customize Profile
            </Link>
          </Button>
          <Button
            variant="link"
            onClick={() => {
              const referralUrl = `${window.location.origin}/?ref=${profileData?.slug}`;
              navigator.clipboard
                .writeText(referralUrl)
                .then(() => {
                  toast.success('Referral link copied to clipboard!');
                })
                .catch(() => {
                  toast.error('Failed to copy referral link');
                });
            }}
            className="font-pixel !text-accent h-auto p-0 text-xs sm:text-sm hover:opacity-80 text-left"
          >
            Share Your Referral Link
          </Button>
          <Button
            variant="link"
            onClick={() => setIsCardModalOpen(true)}
            className="font-pixel !text-accent h-auto p-0 text-xs sm:text-sm hover:opacity-80 text-left"
          >
            Share your Guud Card
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
        {isMetricsLoading ? (
          <>
            <Card title="GuudScore Earned" headingClassName="text-xs sm:text-sm">
              <Skeleton className="h-7 sm:h-8 lg:h-9 w-12 sm:w-14 lg:w-16" />
            </Card>
            <Card title="Ecosystem Impact" headingClassName="text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <Skeleton className="h-7 sm:h-8 lg:h-9 w-10 sm:w-11 lg:w-12" />
                  <Skeleton className="h-4 sm:h-5 w-6 sm:w-7 lg:w-8" />
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <Skeleton className="h-7 sm:h-8 lg:h-9 w-6 sm:w-7 lg:w-8" />
                  <Skeleton className="h-4 sm:h-5 w-5 sm:w-6" />
                </div>
              </div>
            </Card>
            <Card title="Guud Friends" headingClassName="text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <Skeleton className="h-7 sm:h-8 lg:h-9 w-6 sm:w-7 lg:w-8" />
                  <Skeleton className="h-4 sm:h-5 w-10 sm:w-11 lg:w-12" />
                </div>
                <div className="flex -space-x-2">
                  <Skeleton className="size-6 sm:size-7 lg:size-8 rounded-full" />
                  <Skeleton className="size-6 sm:size-7 lg:size-8 rounded-full" />
                  <Skeleton className="size-6 sm:size-7 lg:size-8 rounded-full" />
                </div>
              </div>
            </Card>
            <Card title="Reputation Tier" headingClassName="text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <Skeleton className="h-7 sm:h-8 lg:h-9 w-6 sm:w-7 lg:w-8" />
                  <Skeleton className="h-4 sm:h-5 w-10 sm:w-11 lg:w-12" />
                </div>
                <Skeleton className="h-10 sm:h-11 lg:h-12 w-16 sm:w-18 lg:w-20 rounded" />
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card title="GuudScore Earned" headingClassName="text-xs sm:text-sm">
              <AnimatedNumber
                value={dashboardMetricsData.guudScoreEarned}
                className="font-pixel text-xl sm:text-2xl lg:text-3xl"
              />
            </Card>
            <Card title="Ecosystem Impact" headingClassName="text-xs sm:text-sm">
              <AnimatedNumber
                value={dashboardMetricsData.ecosystemImpact.current}
                suffix="%"
                className="font-pixel text-xl sm:text-2xl lg:text-3xl"
              />
            </Card>
            <Card title="Guud Friends" headingClassName="text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
                <div className="flex flex-col">
                  <AnimatedNumber
                    value={dashboardMetricsData.guudFriendsCount}
                    className="font-pixel text-xl sm:text-2xl lg:text-3xl"
                  />
                  <span className="font-pixel text-xs sm:text-sm">
                    {dashboardMetricsData.guudFriendsYTD} (YTD)
                  </span>
                </div>
                <div className="flex -space-x-1.5 sm:-space-x-2">
                  {dashboardMetricsData.guudFriends.slice(0, 3).map(friend => (
                    <Link
                      key={friend.id}
                      to="/profile/$username"
                      params={{ username: friend.slug }}
                    >
                      <ProfileAvatar
                        src={friend.photoUrl}
                        alt={`@${friend.slug}`}
                        name={friend.name}
                        size="sm"
                        className="ring-background hover:ring-primary/50 size-6 sm:size-7 lg:size-8 ring-1 sm:ring-2 transition-all"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
            <Card title="Reputation Tier" headingClassName="text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
                <div className="flex flex-col">
                  <AnimatedNumber
                    value={dashboardMetricsData.reputationTier.current}
                    className="font-pixel text-xl sm:text-2xl lg:text-3xl"
                  />
                  <span className="font-pixel text-xs sm:text-sm">
                    {dashboardMetricsData.reputationTier.ytd}% (YTD)
                  </span>
                </div>
                <div className="h-10 w-14 sm:h-11 sm:w-16 lg:h-12 lg:w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--primary)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--primary)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#colorGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <CardCustomizationModal
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        currentTemplate={selectedTemplate}
        onSave={setSelectedTemplate}
        name={profile.username}
        score={dashboardMetricsData.guudScoreEarned}
        rankTitle={guudScoreSummary.tier}
        rankDescription={cardDescription}
        slug={profile.slug}
        cardPhotoUrl={profile.photoUrl}
        userWallets={
          profileData?.wallets ? profileData?.wallets : useMockWallets
        }
        testMode={testLockedTemplates}
        onShareClick={handleShareCardClick}
      />

      <SharePreviewDialog
        open={isSharePreviewOpen}
        onOpenChange={setIsSharePreviewOpen}
        template={selectedTemplate}
        name={profile.username}
        score={dashboardMetricsData.guudScoreEarned}
        rankTitle={guudScoreSummary.tier}
        rankDescription={cardDescription}
        slug={profile.slug}
        cardPhotoUrl={profile.photoUrl}
        // defaultShareText={`Check my GUUD Score 🎯 - ${profile.username}`}
        hasEmptyWallets={
          !profileData?.wallets || profileData?.wallets.length === 0
        }
      />
    </div>
  );
};
