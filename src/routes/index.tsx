import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth-guards';

import { useEffect, useState } from 'react';

import { AnimatedNumber } from '@/components/animated-number';
import { Card } from '@/components/card';
import { FeaturedProtocols } from '@/components/featured-protocols';
import { Heading } from '@/components/heading';
import { TreemapCard } from '@/components/treemap-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useChain } from '@/contexts/chain-context';
import { useAgentLeaderboard, useAvailableBadges, useFullAnalytics, useScoreDistributionByBadge } from '@/hooks';

interface AvalancheProtocol {
  name: string;
  address: string;
  category: string;
  ecosystem: string;
  logo: string;
}

interface SolanaProtocol {
  id: string;
  name: string;
  logo_url: string;
  program_ids: string[];
  aliases: string[];
}

interface BaseProtocolDetail {
  contracts: string[];
  contract_addresses?: string[];
  logo: string;
  twitter: string;
  category: string;
}

interface BaseProtocolsData {
  totalProtocols: number;
  protocols_detailed: Record<string, BaseProtocolDetail>;
}

interface WhitelistCollection {
  contract_address: string;
  name: string;
  symbol: string;
  collection_logo: string;
}

interface SolanaCollection {
  collection_mint: string;
  name: string;
  symbol: string;
  standard: string;
  marketplace_slug: string;
  collection_image: string;
}

interface WhitelistData {
  collections: WhitelistCollection[];
}

interface SolanaWhitelistData {
  collections: SolanaCollection[];
}

// Define search params schema
type IndexPageSearch = {
  ref?: string;
};

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  validateSearch: (search: Record<string, unknown>): IndexPageSearch => {
    return {
      ref: search.ref as string,
    };
  },
});

function App() {
  const { ref } = Route.useSearch();
  const { selectedNetwork } = useChain();
  const { data, isLoading, error } = useFullAnalytics();
  const [protocolsData, setProtocolsData] = useState<{protocols: AvalancheProtocol[]} | null>(null);
  const [solanaProtocolsData, setSolanaProtocolsData] = useState<{protocols: SolanaProtocol[]} | null>(null);
  const [baseProtocolsData, setBaseProtocolsData] = useState<BaseProtocolsData | null>(null);
  const [arbitrumProtocolsData, setArbitrumProtocolsData] = useState<BaseProtocolsData | null>(null);
  const [whitelistData, setWhitelistData] = useState<WhitelistData | null>(null);
  const [solanaWhitelistData, setSolanaWhitelistData] = useState<SolanaWhitelistData | null>(null);
  const [baseWhitelistData, setBaseWhitelistData] = useState<WhitelistData | null>(null);
  const [arbitrumWhitelistData, setArbitrumWhitelistData] = useState<WhitelistData | null>(null);

  // Agent count for Alpha stats
  const { data: agentData } = useAgentLeaderboard({ page: 1, limit: 1 });

  // Badge/Season filter state for score distribution
  const [selectedBadge, setSelectedBadge] = useState<string>('current');
  const { data: badgesData } = useAvailableBadges();
  const { data: filteredScoreData, isLoading: isScoreLoading } = useScoreDistributionByBadge(
    selectedBadge !== 'current' ? selectedBadge : null
  );

  // Handle referral code from URL parameter
  useEffect(() => {
    if (ref && ref.trim().length > 0) {
      localStorage.setItem('referralCode', ref.trim());
      console.log('[Index] Stored referral code:', ref);
    }
  }, [ref]);

  // Load protocol and NFT whitelist data based on selected network
  useEffect(() => {
    if (selectedNetwork === 'SOLANA') {
      // Load Solana data
      fetch('/solana-whitelist-protocol.json')
        .then(res => res.json())
        .then(data => setSolanaProtocolsData(data))
        .catch(err => console.error('Failed to load Solana protocols:', err));
      
      fetch('/solana-whitelist-nft.json')
        .then(res => res.json())
        .then(data => setSolanaWhitelistData(data))
        .catch(err => console.error('Failed to load Solana whitelist:', err));
    } else if (selectedNetwork === 'BASE') {
      // Load Base data
      fetch('/base-whitelist-protocol.json')
        .then(res => res.json())
        .then(data => setBaseProtocolsData(data))
        .catch(err => console.error('Failed to load Base protocols:', err));
      
      fetch('/base-whitelist-nft.json')
        .then(res => res.json())
        .then(data => setBaseWhitelistData(data))
        .catch(err => console.error('Failed to load Base whitelist:', err));
    } else if (selectedNetwork === 'ARBITRUM') {
      // Load Arbitrum data
      fetch('/arbitrum-whitelist-protocol.json')
        .then(res => res.json())
        .then(data => setArbitrumProtocolsData(data))
        .catch(err => console.error('Failed to load Arbitrum protocols:', err));
      
      fetch('/arbitrum-whitelist-nft.json')
        .then(res => res.json())
        .then(data => setArbitrumWhitelistData(data))
        .catch(err => console.error('Failed to load Arbitrum whitelist:', err));
    } else {
      // Load Avalanche data
      fetch('/avalanche-protocols.json')
        .then(res => res.json())
        .then(data => setProtocolsData(data))
        .catch(err => console.error('Failed to load protocols:', err));
      
      fetch('/whitelist-nft.json')
        .then(res => res.json())
        .then(data => setWhitelistData(data))
        .catch(err => console.error('Failed to load whitelist:', err));
    }
  }, [selectedNetwork]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted font-pixel">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-destructive font-pixel">Error loading data</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted font-pixel">No data available</div>
      </div>
    );
  }

  const {
    communityOverview,
    topAssets,
    protocolAnalytics,
    nftCollections,
    scoreDistribution,
  } = data;

  return (
    <>
      <Heading
        title="Alpha"
        description="Exclusive insights and analytics for the GuudScore community"
        badge="Premium"
      />
      {selectedNetwork === 'AVAX' && protocolsData && (
        <FeaturedProtocols 
          avalancheProtocols={protocolsData}
        />
      )}
      <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-5">
        <Card title="Tracked Wallets" contentClassName="text-center sm:text-left">
          <AnimatedNumber
            value={communityOverview.trackedWallets}
            className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all"
            delay={100}
          />
        </Card>
        <Card title="Community AUM (USD)" contentClassName="text-center sm:text-left">
          <AnimatedNumber
            value={communityOverview.communityAUM.total}
            className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all"
            delay={200}
          />
        </Card>
        <Card title="Avg Portfolio (USD)" contentClassName="text-center sm:text-left">
          <AnimatedNumber
            value={communityOverview.avgPortfolio.value}
            className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all"
            delay={300}
          />
        </Card>
        <Card title="NFT Sentiment" contentClassName="text-center sm:text-left">
          <AnimatedNumber
            value={communityOverview.nftSentiment.percentage}
            className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all"
            suffix="%"
            delay={400}
          />
        </Card>
        <Card title="Agents" contentClassName="text-center sm:text-left">
          <AnimatedNumber
            value={agentData?.stats.totalAgents ?? 0}
            className="font-pixel text-xl sm:text-2xl md:text-3xl lg:text-4xl break-all"
            delay={500}
          />
        </Card>
      </div>
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        <Card
          title="Most Held (by # wallets)"
          contentClassName="flex flex-col items-center"
          wrapperClassName="gap-4 sm:gap-6"
        >
          <TreemapCard
            items={topAssets.mostHeldByWalletCount.map(asset => ({
              name: asset.name,
              symbol: asset.symbol,
              value: asset.walletCount || 0,
              logo: asset.logo,
              tokenAddress: asset.tokenAddress,
              network: selectedNetwork,
            }))}
            type="token"
          />
        </Card>
        <Card
          title="Largest Allocation (by USD)"
          contentClassName="flex flex-col items-center"
          wrapperClassName="gap-4 sm:gap-6"
        >
          <TreemapCard
            items={topAssets.largestAllocationByUSD.map(asset => ({
              name: asset.name,
              symbol: asset.symbol,
              value: parseFloat(asset.totalValue) || 0,
              logo: asset.logo,
              tokenAddress: asset.tokenAddress,
              network: selectedNetwork,
            }))}
            type="token"
          />
        </Card>
      </div>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          title={`Most Used Protocols (${protocolAnalytics.timeWindow})`}
          wrapperClassName="gap-6"
        >
          {(() => {
            if (selectedNetwork === 'SOLANA') {
              // Solana protocol matching
              const matchedProtocols = protocolAnalytics.protocols
                .map((protocol) => {
                  let matchingProtocol = solanaProtocolsData?.protocols.find(
                    p => p.name.toLowerCase() === protocol.name.toLowerCase()
                  );
                  
                  if (!matchingProtocol && protocol.contractAddress) {
                    matchingProtocol = solanaProtocolsData?.protocols.find(
                      p => p.program_ids.some(pid => pid.toLowerCase() === protocol.contractAddress!.toLowerCase())
                    );
                  }
                  
                  // Check aliases
                  if (!matchingProtocol) {
                    matchingProtocol = solanaProtocolsData?.protocols.find(
                      p => p.aliases.some(alias => alias.toLowerCase() === protocol.name.toLowerCase())
                    );
                  }
                  
                  return matchingProtocol ? { 
                    protocol, 
                    matchingProtocol,
                    interactionCount: protocol.interactionCount || 0
                  } : null;
                })
                .filter((item): item is { protocol: any; matchingProtocol: SolanaProtocol; interactionCount: number } => item !== null);

              const seenNames = new Set<string>();
              const uniqueProtocols = matchedProtocols.filter(({ matchingProtocol }) => {
                const name = matchingProtocol.name.toLowerCase();
                if (seenNames.has(name)) {
                  return false;
                }
                seenNames.add(name);
                return true;
              }).slice(0, 6);

              return (
                <TreemapCard
                  items={uniqueProtocols.map(({ matchingProtocol, interactionCount }) => ({
                    name: matchingProtocol.name,
                    value: interactionCount,
                    logo: matchingProtocol.logo_url,
                  }))}
                  type="protocol"
                />
              );
            } else if (selectedNetwork === 'BASE') {
              // Base protocol matching - uses protocols_detailed object format
              if (!baseProtocolsData?.protocols_detailed) {
                return (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Loading protocols...
                  </div>
                );
              }
              
              const matchedProtocols = protocolAnalytics.protocols
                .map((protocol) => {
                  // Search by name in protocols_detailed keys
                  const protocolName = Object.keys(baseProtocolsData.protocols_detailed).find(
                    name => name.toLowerCase() === protocol.name.toLowerCase()
                  );
                  
                  // If not found by name, search by contract address
                  let matchedName = protocolName;
                  if (!matchedName && protocol.contractAddress) {
                    matchedName = Object.keys(baseProtocolsData.protocols_detailed).find(name => {
                      const detail = baseProtocolsData.protocols_detailed[name];
                      return detail.contracts.some(
                        c => c.toLowerCase() === protocol.contractAddress!.toLowerCase()
                      );
                    });
                  }
                  
                  if (!matchedName) return null;
                  
                  const detail = baseProtocolsData.protocols_detailed[matchedName];
                  return {
                    protocol,
                    name: matchedName,
                    logo: detail.logo,
                    category: detail.category,
                    interactionCount: protocol.interactionCount || 0
                  };
                })
                .filter((item): item is { protocol: any; name: string; logo: string; category: string; interactionCount: number } => item !== null);

              const seenNames = new Set<string>();
              const uniqueProtocols = matchedProtocols.filter(({ name }) => {
                const lowerName = name.toLowerCase();
                if (seenNames.has(lowerName)) {
                  return false;
                }
                seenNames.add(lowerName);
                return true;
              }).slice(0, 6);

              return (
                <TreemapCard
                  items={uniqueProtocols.map(({ name, logo, interactionCount }) => ({
                    name,
                    value: interactionCount,
                    logo,
                  }))}
                  type="protocol"
                />
              );
            } else if (selectedNetwork === 'ARBITRUM') {
              // Arbitrum protocol matching - uses protocols_detailed object format (same as Base)
              if (!arbitrumProtocolsData?.protocols_detailed) {
                return (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Loading protocols...
                  </div>
                );
              }
              
              const matchedProtocols = protocolAnalytics.protocols
                .map((protocol) => {
                  // Search by name in protocols_detailed keys
                  const protocolName = Object.keys(arbitrumProtocolsData.protocols_detailed).find(
                    name => name.toLowerCase() === protocol.name.toLowerCase()
                  );
                  
                  // If not found by name, search by contract address
                  let matchedName = protocolName;
                  if (!matchedName && protocol.contractAddress) {
                    matchedName = Object.keys(arbitrumProtocolsData.protocols_detailed).find(name => {
                      const detail = arbitrumProtocolsData.protocols_detailed[name];
                      return detail.contract_addresses?.some(
                        addr => addr.toLowerCase() === protocol.contractAddress!.toLowerCase()
                      );
                    });
                  }
                  
                  if (!matchedName) return null;
                  
                  const detail = arbitrumProtocolsData.protocols_detailed[matchedName];
                  return {
                    protocol,
                    name: matchedName,
                    logo: detail.logo,
                    category: detail.category,
                    interactionCount: protocol.interactionCount || 0
                  };
                })
                .filter((item): item is { protocol: any; name: string; logo: string; category: string; interactionCount: number } => item !== null);

              const seenNames = new Set<string>();
              const uniqueProtocols = matchedProtocols.filter(({ name }) => {
                const lowerName = name.toLowerCase();
                if (seenNames.has(lowerName)) {
                  return false;
                }
                seenNames.add(lowerName);
                return true;
              }).slice(0, 6);

              return (
                <TreemapCard
                  items={uniqueProtocols.map(({ name, logo, interactionCount }) => ({
                    name,
                    value: interactionCount,
                    logo,
                  }))}
                  type="protocol"
                />
              );
            } else {
              // Avalanche protocol matching
              const matchedProtocols = protocolAnalytics.protocols
                .map((protocol) => {
                  let matchingProtocol = protocolsData?.protocols.find(
                    p => p.name.toLowerCase() === protocol.name.toLowerCase()
                  );
                  
                  if (!matchingProtocol && protocol.contractAddress) {
                    matchingProtocol = protocolsData?.protocols.find(
                      p => p.address.toLowerCase() === protocol.contractAddress!.toLowerCase()
                    );
                  }
                  
                  return matchingProtocol ? { 
                    protocol, 
                    matchingProtocol,
                    interactionCount: protocol.interactionCount || 0
                  } : null;
                })
                .filter((item): item is { protocol: any; matchingProtocol: AvalancheProtocol; interactionCount: number } => item !== null);

              const seenEcosystems = new Set<string>();
              const uniqueProtocols = matchedProtocols.filter(({ matchingProtocol }) => {
                const ecosystem = matchingProtocol.ecosystem.toLowerCase();
                if (seenEcosystems.has(ecosystem)) {
                  return false;
                }
                seenEcosystems.add(ecosystem);
                return true;
              }).slice(0, 6);

              return (
                <TreemapCard
                  items={uniqueProtocols.map(({ matchingProtocol, interactionCount }) => ({
                    name: matchingProtocol.ecosystem,
                    value: interactionCount,
                    logo: matchingProtocol.logo,
                  }))}
                  type="protocol"
                />
              );
            }
          })()}
        </Card>
        <Card title="Top NFT Collections (by holders)" wrapperClassName="gap-6">
          <TreemapCard
            items={nftCollections.collections.map(collection => {
              if (selectedNetwork === 'SOLANA') {
                // Solana NFT matching - use collection_mint
                const solanaMatch = solanaWhitelistData?.collections.find(
                  wl => wl.collection_mint.toLowerCase() === collection.contractAddress?.toLowerCase()
                );
                
                return {
                  name: solanaMatch?.name || collection.name,
                  value: collection.holderCount || 0,
                  logo: solanaMatch?.collection_image || collection.logo,
                  contractAddress: collection.contractAddress,
                  network: collection.network,
                };
              } else if (selectedNetwork === 'BASE') {
                // Base NFT matching
                const baseMatch = baseWhitelistData?.collections.find(
                  wl => wl.contract_address.toLowerCase() === collection.contractAddress?.toLowerCase()
                );
                
                return {
                  name: baseMatch?.name || collection.name,
                  value: collection.holderCount || 0,
                  logo: baseMatch?.collection_logo || collection.logo,
                  contractAddress: collection.contractAddress,
                  network: collection.network,
                };
              } else if (selectedNetwork === 'ARBITRUM') {
                // Arbitrum NFT matching
                const arbitrumMatch = arbitrumWhitelistData?.collections.find(
                  wl => wl.contract_address.toLowerCase() === collection.contractAddress?.toLowerCase()
                );
                
                return {
                  name: arbitrumMatch?.name || collection.name,
                  value: collection.holderCount || 0,
                  logo: arbitrumMatch?.collection_logo || collection.logo,
                  contractAddress: collection.contractAddress,
                  network: collection.network,
                };
              } else {
                // Avalanche NFT matching
                const whitelistMatch = whitelistData?.collections.find(
                  wl => wl.contract_address.toLowerCase() === collection.contractAddress?.toLowerCase()
                );
                
                return {
                  name: whitelistMatch?.name || collection.name,
                  value: collection.holderCount || 0,
                  logo: whitelistMatch?.collection_logo || collection.logo,
                  contractAddress: collection.contractAddress,
                  network: collection.network,
                };
              }
            })}
            type="nft"
          />
        </Card>
      </div>
      <div className="w-full">
        <Card title="Total GuudScore Distribution" wrapperClassName="gap-4 sm:gap-6">
          {/* Badge/Season Filter */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Filter by:</span>
            <Select value={selectedBadge} onValueChange={setSelectedBadge}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Season</SelectItem>
                {badgesData?.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    {badge.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-64 sm:h-72 md:h-80 w-full">
            {isScoreLoading && selectedBadge !== 'current' ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(filteredScoreData?.distribution || scoreDistribution.distribution).map(item => {
                    return {
                      name: item.range,
                      originalRange: item.range,
                      value: item.count,
                      percentage: item.percentage,
                    };
                  })}
                >
                  <XAxis
                    dataKey="name"
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
                        const data = payload[0].payload;
                        return (
                          <div className="glass min-w-[248px] rounded-xl p-3">
                            <div className="space-y-2">
                              <div className="text-xl font-bold">
                                Score Range: {label}
                              </div>
                              <div className="font-pixel text-xs">
                                <span
                                  className="mr-2 inline-block h-3 w-3 rounded-full"
                                  style={{ backgroundColor: 'var(--primary)' }}
                                />
                                Users: {data.value} ({data.percentage.toFixed(1)}
                                %)
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {(filteredScoreData?.distribution || scoreDistribution.distribution).map((_, index) => (
                      <Cell key={`cell-${index}`} fill="var(--primary)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
