import { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import { AnimatedNumber } from '@/components/animated-number';
import { Card } from '@/components/card';
import { ErrorMessage } from '@/components/error-message';
import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser, useReferralStats } from '@/hooks';

export const Route = createFileRoute('/dashboard/referral-stats')({
  component: RouteComponent,
});

function RouteComponent() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  
  const { data: currentUser } = useCurrentUser();
  const {
    data: referralStats,
    isLoading: isReferralLoading,
    error: referralError,
  } = useReferralStats();

  const referralUrl = currentUser?.slug 
    ? `${window.location.origin}/?ref=${currentUser.slug}`
    : '';

  const handleCopyLink = () => {
    if (referralUrl) {
      navigator.clipboard
        .writeText(referralUrl)
        .then(() => {
          toast.success('Referral link copied to clipboard!');
        })
        .catch(() => {
          toast.error('Failed to copy referral link');
        });
    }
  };

  if (isReferralLoading) {
    return (
      <div className="flex w-full gap-4 sm:gap-6">
        <div className="w-full">
          <Card title="Referral Stats" headingClassName="text-base sm:text-lg font-pixel">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-24" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (referralError) {
    return (
      <ErrorMessage
        header="Error loading referral stats"
        error={referralError.message || 'Unknown error'}
      />
    );
  }

  return (
    <div className="flex w-full gap-6">
      <div className="w-full">
        <Card title="Referral Stats" headingClassName="text-lg font-pixel">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-sm text-muted-foreground">
                  Total Referrals
                </span>
                <AnimatedNumber
                  value={referralStats?.totalReferrals || 0}
                  className="font-pixel text-3xl sm:text-4xl md:text-5xl"
                />
                <p className="text-xs text-muted-foreground">
                  Number of users you've referred to the platform
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-sm text-muted-foreground">
                  Referral Score Earned
                </span>
                <AnimatedNumber
                  value={referralStats?.referralScore || 0}
                  className="font-pixel text-3xl sm:text-4xl md:text-5xl"
                />
                <span className="font-pixel text-xs text-muted-foreground">
                  You earn 5 points for each successful referral
                </span>
              </div>
            </div>

            {referralUrl && (
              <div className="glass rounded-lg p-4 sm:p-6 mt-2 sm:mt-4">
                <h3 className="font-pixel text-sm sm:text-base text-muted-foreground mb-3">
                  Your Referral Link
                </h3>
                <div 
                  onClick={handleCopyLink}
                  className="flex items-center justify-between gap-3 bg-background/50 rounded-md p-3 cursor-pointer hover:bg-background/70 transition-colors group"
                >
                  <span className="font-pixel text-xs sm:text-sm text-primary break-all">
                    {referralUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink();
                    }}
                    className="shrink-0 size-8 hover:bg-primary/10"
                    title="Copy to clipboard"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}

            <div className="glass rounded-lg p-4 sm:p-6 mt-2 sm:mt-4">
              <button
                onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                className="flex items-center gap-2 w-full group"
              >
                <h3 className="font-pixel text-base sm:text-lg">How It Works</h3>
                <Icons.plus className={`size-4 transition-transform duration-200 ${isHowItWorksOpen ? 'rotate-45' : ''}`} />
              </button>
              
              {isHowItWorksOpen && (
                <div className="space-y-2 text-sm text-muted-foreground mt-3 sm:mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-baseline gap-3">
                    <span className="font-pixel text-primary shrink-0 w-4">1.</span>
                    <p>Share your referral link with friends</p>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-pixel text-primary shrink-0 w-4">2.</span>
                    <p>They sign up using your link</p>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-pixel text-primary shrink-0 w-4">3.</span>
                    <p>You earn 50 GuudScore points for each successful referral</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
