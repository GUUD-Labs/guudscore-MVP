import { createFileRoute } from '@tanstack/react-router';

import { Card } from '@/components/card';
import { Heading } from '@/components/heading';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import Icons from '@/components/icons';
import { useChain } from '@/contexts/chain-context';
import { useAgentProfile } from '@/hooks';
import { requireAuth } from '@/lib/auth-guards';
import { getUserPhotoUrl } from '@/lib/utils/image';

export const Route = createFileRoute('/agent-profile/$agentId')({
  component: AgentProfilePage,
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
});

function AgentProfilePage() {
  const { agentId } = Route.useParams();
  const { selectedNetwork } = useChain();
  const { data, isLoading, error } = useAgentProfile(agentId, selectedNetwork);

  if (isLoading) {
    return (
      <>
        <Heading
          title="Agent Profile"
          description="Loading agent data..."
          badge="Agent"
        />
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Heading
          title="Agent Profile"
          description="Agent not found"
          badge="Agent"
        />
        <div className="text-muted-foreground py-20 text-center">
          Failed to load agent profile
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 p-4 sm:p-6">
      <Heading
        title={data.agent.name}
        description={`Agent: ${data.agent.slug}`}
        badge="Agent Profile"
      />

      {/* Agent Avatar & Info */}
      <div className="flex items-center justify-center gap-4">
        <ProfileAvatar
          src={getUserPhotoUrl(data.agent.profilePicture)}
          alt={data.agent.name}
          name={data.agent.name}
          size="xl"
          className="size-20"
          isAgent
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card title="Portfolio Value">
          <div className="font-pixel text-2xl">
            ${data.stats.portfolioValue.toLocaleString()}
          </div>
        </Card>
        <Card title="NFTs">
          <div className="font-pixel text-2xl">{data.stats.totalNfts}</div>
        </Card>
        <Card title="Badges">
          <div className="font-pixel text-2xl">{data.stats.badgeCount}</div>
        </Card>
        <Card title="Arena Points">
          <div className="font-pixel text-2xl">{data.arena.points}</div>
        </Card>
      </div>

      {/* GuudScores per network */}
      <Card title="GuudScore Breakdown">
        <div className="flex flex-col gap-3">
          {data.guudScores.map((gs) => (
            <div key={gs.network} className="glass flex items-center justify-between rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{gs.network}</Badge>
                <span className="text-sm">{gs.tier}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="hidden sm:inline">Token: {gs.tokenHoldingsScore}</span>
                <span className="hidden sm:inline">NFT: {gs.nftHoldingsScore}</span>
                <span className="hidden sm:inline">Protocol: {gs.protocolUsageScore}</span>
                <span className="font-pixel text-lg">{gs.totalScore}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Vouch Stats */}
      {data.vouchBalance && (
        <Card title="Reputation">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Icons.thumbsUp className="size-4 text-success" />
                <span className="font-pixel text-xl text-success">{data.vouchBalance.likesReceived}</span>
              </div>
              <div className="text-muted-foreground text-xs">Likes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Icons.thumbsDown className="size-4 text-destructive" />
                <span className="font-pixel text-xl text-destructive">{data.vouchBalance.dislikesReceived}</span>
              </div>
              <div className="text-muted-foreground text-xs">Dislikes</div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xl">{data.vouchBalance.balance}</div>
              <div className="text-muted-foreground text-xs">Vouch Balance</div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xl">{data.stats.totalBribesReceived}</div>
              <div className="text-muted-foreground text-xs">Bribes Received</div>
            </div>
          </div>
        </Card>
      )}

      {/* Wallets */}
      <Card title="Connected Wallets">
        <div className="flex flex-col gap-2">
          {data.agent.wallets.map((w, i) => (
            <div key={i} className="glass flex items-center justify-between rounded-lg p-3">
              <code className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">{w.walletAddress}</code>
              <Badge variant="outline" className="text-xs ml-2">{w.network}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
