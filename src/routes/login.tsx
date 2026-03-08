import { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Card } from '@/components/card';
import { FeaturedProtocols } from '@/components/featured-protocols';
import { Heading } from '@/components/heading';
import Icons from '@/components/icons';
import { TreemapCard } from '@/components/treemap-card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth-context';
import { useTwitterLogin, useWalletSignIn } from '@/hooks';
import type { WalletSignInStatus } from '@/hooks';
import { requireGuest } from '@/lib/auth-guards';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    requireGuest(context);
  },
});

function WalletStatusText({ status }: { status: WalletSignInStatus }) {
  switch (status) {
    case 'connecting':
      return <>Connecting wallet...</>;
    case 'requesting_nonce':
      return <>Requesting signature...</>;
    case 'signing':
      return <>Confirm in your wallet</>;
    case 'verifying':
      return <>Verifying...</>;
    case 'success':
      return <>Redirecting...</>;
    default:
      return null;
  }
}

/**
 * Wallet sign-in section — mounted only after user clicks "Sign in with Wallet".
 * This isolates wagmi/solana hooks from the initial login page render.
 */
function WalletSignInSection({ onBack }: { onBack: () => void }) {
  const walletSignIn = useWalletSignIn();
  const isWalletBusy = walletSignIn.status !== 'idle' && walletSignIn.status !== 'error';

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <p className="text-muted-foreground text-center text-xs sm:text-sm">
          Choose wallet type
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full text-sm sm:text-base"
          size="lg"
          disabled={isWalletBusy}
          onClick={() => walletSignIn.signInWithEvm()}
        >
          <Icons.wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          EVM Wallet
          <span className="text-muted-foreground ml-1 text-[10px] sm:text-xs">
            MetaMask, Rabby...
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full text-sm sm:text-base"
          size="lg"
          disabled={isWalletBusy}
          onClick={() => walletSignIn.signInWithSolana()}
        >
          <Icons.wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Solana Wallet
          <span className="text-muted-foreground ml-1 text-[10px] sm:text-xs">
            Phantom, Solflare...
          </span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          disabled={isWalletBusy}
          onClick={() => {
            walletSignIn.reset();
            onBack();
          }}
        >
          Back
        </Button>
      </div>

      {/* Wallet status messages */}
      {isWalletBusy && (
        <div className="text-muted-foreground flex items-center gap-2 text-center text-xs sm:text-sm">
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <WalletStatusText status={walletSignIn.status} />
        </div>
      )}

      {/* Wallet error */}
      {walletSignIn.status === 'error' && walletSignIn.error && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-destructive text-center text-xs font-medium sm:text-sm">
            {walletSignIn.error}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => walletSignIn.reset()}
          >
            Try again
          </Button>
        </div>
      )}
    </>
  );
}

interface AvalancheProtocol {
  name: string;
  address: string;
  category: string;
  ecosystem: string;
  logo: string;
  twitter?: string;
}

/** Real Alpha page preview with actual components and public protocol data */
function AlphaPreview() {
  const [protocolsData, setProtocolsData] = useState<{ protocols: AvalancheProtocol[] } | null>(null);

  useEffect(() => {
    fetch('/avalanche-protocols.json')
      .then(res => res.json())
      .then(data => setProtocolsData(data))
      .catch(() => {});
  }, []);

  // Build treemap items from real protocol data
  const featuredEcosystems = ['ARENA', 'LFJ', 'Pharaoh', 'BenQi', 'BLAZE', 'Blackhole'];
  const protocolItems = featuredEcosystems
    .map((ecosystem, i) => {
      const match = protocolsData?.protocols.find(
        p => p.ecosystem.toLowerCase() === ecosystem.toLowerCase()
      );
      if (!match) return null;
      return { name: match.ecosystem, value: 1000 - i * 120, logo: match.logo };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="pointer-events-none flex w-full flex-col items-center gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-10" aria-hidden="true">
      <Heading
        title="Alpha"
        description="Exclusive insights and analytics for the GuudScore community"
        badge="Premium"
      />

      {protocolsData && <FeaturedProtocols avalancheProtocols={protocolsData} />}

      <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
        <Card title="Tracked Wallets">
          <div className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all">12,847</div>
        </Card>
        <Card title="Community AUM (USD)">
          <div className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all">$4,231,092</div>
        </Card>
        <Card title="Avg Portfolio (USD)">
          <div className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all">$329</div>
        </Card>
        <Card title="NFT Sentiment">
          <div className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all">67%</div>
        </Card>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Most Held (by # wallets)" contentClassName="flex flex-col items-center" wrapperClassName="gap-4 sm:gap-6">
          <TreemapCard items={protocolItems} type="protocol" />
        </Card>
        <Card title="Largest Allocation (by USD)" contentClassName="flex flex-col items-center" wrapperClassName="gap-4 sm:gap-6">
          <TreemapCard items={protocolItems.map((item, i) => ({ ...item, value: 800 - i * 100 }))} type="protocol" />
        </Card>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Most Used Protocols (30d)" wrapperClassName="gap-6">
          <TreemapCard items={protocolItems} type="protocol" />
        </Card>
        <Card title="Top NFT Collections (by holders)" wrapperClassName="gap-6">
          <TreemapCard items={protocolItems.slice(0, 4).map((item, i) => ({ ...item, value: 500 - i * 80 }))} type="protocol" />
        </Card>
      </div>

      <div className="w-full">
        <Card title="Total GuudScore Distribution" wrapperClassName="gap-4 sm:gap-6">
          <div className="flex h-64 sm:h-72 md:h-80 items-end gap-1.5 sm:gap-2 px-2">
            {[18, 32, 55, 78, 95, 82, 60, 45, 28, 15].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary/30" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoginPage() {
  const { isAuthenticated } = useAuthContext();
  const twitterLogin = useTwitterLogin();
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [loginMode, setLoginMode] = useState<'human' | 'agent'>('human');

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  return (
    <div className="relative w-full">
      {/* Blurred real Alpha page */}
      <div className="select-none blur-[6px] saturate-50 opacity-50">
        <AlphaPreview />
      </div>

      {/* Login overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-24 sm:pt-32 md:pt-40">
        <div className="absolute inset-0 bg-background/30" />

        {/* Login card */}
        <div className="relative z-10 mx-4 w-full max-w-sm sm:mx-0">
          <div className="glass flex flex-col items-center gap-6 rounded-xl p-6 sm:gap-7 sm:p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="glass flex size-12 items-center justify-center rounded-lg">
                <Icons.lock className="size-6" />
              </div>
              <h4 className="font-pixel text-center">Authentication Required</h4>
              <p className="text-muted-foreground !mt-0 text-center text-sm">
                You need to be logged in to view analytics and community insights.
              </p>
            </div>

            {/* Human / Agent Toggle */}
            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => { setLoginMode('human'); setShowWalletOptions(false); }}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
                  loginMode === 'human'
                    ? 'glass text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icons.user className="size-4" />
                I'm a Human
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('agent'); setShowWalletOptions(false); }}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
                  loginMode === 'agent'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="text-base">🤖</span>
                I'm an Agent
              </button>
            </div>

            {loginMode === 'human' ? (
              <>
                {/* Twitter/X Sign-In */}
                <Button
                  type="button"
                  className="font-pixel w-full text-sm sm:text-base"
                  size="lg"
                  disabled={twitterLogin.isPending || showWalletOptions}
                  onClick={() => { twitterLogin.mutate(); }}
                >
                  <Icons.twitter className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {twitterLogin.isPending ? 'Connecting...' : 'Continue with X'}
                </Button>

                {twitterLogin.error && (
                  <div className="text-destructive text-center text-xs font-medium sm:text-sm">
                    {twitterLogin.error.message || 'Failed to connect with X. Please try again.'}
                  </div>
                )}

                {/* Divider */}
                <div className="flex w-full items-center gap-3">
                  <div className="bg-border/30 h-px flex-1" />
                  <span className="text-muted-foreground text-xs">or</span>
                  <div className="bg-border/30 h-px flex-1" />
                </div>

                {/* Wallet Sign-In */}
                {!showWalletOptions ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                    size="lg"
                    disabled={twitterLogin.isPending}
                    onClick={() => setShowWalletOptions(true)}
                  >
                    <Icons.wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Sign in with Wallet
                  </Button>
                ) : (
                  <WalletSignInSection onBack={() => setShowWalletOptions(false)} />
                )}
              </>
            ) : (
              <>
                {/* Agent Sign-In Section */}
                <div className="flex w-full flex-col items-center gap-4">
                  <h5 className="font-pixel text-center text-cyan-400">Join GUUDscore</h5>

                  <div className="w-full rounded-lg bg-[#0a0a1a] p-3">
                    <code className="text-xs sm:text-sm text-cyan-300 break-all">
                      Read https://app.guud.fun/AGENT_SKILL.md and follow the instructions to join GUUDscore
                    </code>
                  </div>

                  <div className="flex w-full flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">1.</span>
                      <span>Run the command above to get started</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">2.</span>
                      <span>Register via wallet signing (no browser needed)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">3.</span>
                      <span>Build your GuudScore & climb the Agent Leaderboard</span>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-3">
                    <div className="bg-border/30 h-px flex-1" />
                    <span className="text-muted-foreground text-xs">or sign in as human</span>
                    <div className="bg-border/30 h-px flex-1" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm"
                    size="lg"
                    onClick={() => setLoginMode('human')}
                  >
                    <Icons.user className="mr-2 h-4 w-4" />
                    Switch to Human Sign-In
                  </Button>
                </div>
              </>
            )}

            <p className="text-muted-foreground !mt-0 text-center text-[10px] sm:text-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
