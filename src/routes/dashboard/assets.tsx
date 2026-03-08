import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import { useChain } from '@/contexts/chain-context';
import { useAssetHistory, useAssets, useTokenHoldings } from '@/hooks';
import { dateFormatter, formatCurrency, formatNumber } from '@/lib/utils';
import type { AssetHolding } from '@/types';

export const Route = createFileRoute('/dashboard/assets')({
  component: RouteComponent,
});

// Smart decimal formatting for quantities - show more decimals for small numbers
const getSmartDecimals = (value: number): number => {
  if (value === 0) return 0;
  if (value >= 1000) return 0;
  if (value >= 100) return 1;
  if (value >= 10) return 2;
  if (value >= 1) return 2;
  if (value >= 0.01) return 4;
  return 6;
};

const formatQuantity = (value: number): string => {
  const decimals = getSmartDecimals(value);
  return formatNumber(value, decimals);
};

// Group assets by symbol across all wallets
interface GroupedAsset {
  name: string;
  symbol: string;
  logo: string;
  totalQuantity: number;
  totalValueUSD: number;
  percentage: number;
  wallets: Array<{
    address: string;
    quantity: number;
    valueUSD: number;
  }>;
}

function RouteComponent() {
  const { isLoading, error } = useAssets();
  const { data: tokenHoldings } = useTokenHoldings();
  const { data: historyData } = useAssetHistory();
  const { selectedNetwork } = useChain();
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  // Get chain name for display
  const chainName = selectedNetwork === 'SOLANA' ? 'Solana' : selectedNetwork === 'BASE' ? 'Base' : selectedNetwork === 'ARBITRUM' ? 'Arbitrum' : selectedNetwork === 'MONAD' ? 'Monad' : 'Avalanche';

  // Group tokens by symbol
  const groupedHoldings: GroupedAsset[] = tokenHoldings?.topHoldings
    ? (() => {
        const grouped = new Map<string, GroupedAsset>();
        
        tokenHoldings.topHoldings.forEach((holding: AssetHolding) => {
          const existing = grouped.get(holding.symbol);
          
          // Create wallet entry
          const walletEntry = {
            address: holding.walletAddress || `Wallet ${(existing?.wallets.length || 0) + 1}`,
            quantity: holding.quantity || 0,
            valueUSD: holding.valueUSD,
          };
          
          if (existing) {
            existing.totalQuantity += holding.quantity || 0;
            existing.totalValueUSD += holding.valueUSD;
            existing.wallets.push(walletEntry);
          } else {
            grouped.set(holding.symbol, {
              name: holding.name,
              symbol: holding.symbol,
              logo: holding.logo,
              totalQuantity: holding.quantity || 0,
              totalValueUSD: holding.valueUSD,
              percentage: holding.percentage,
              wallets: [walletEntry],
            });
          }
        });
        
        // Sort wallets by quantity (highest first) for each token
        const result = Array.from(grouped.values()).map(asset => ({
          ...asset,
          wallets: asset.wallets.sort((a, b) => b.quantity - a.quantity),
        }));
        
        return result;
      })()
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h4 className="text-muted text-sm">Loading assets...</h4>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage header="Error loading assets" error={error.message} />;
  }

  const topHoldings = groupedHoldings;

  const donutData = tokenHoldings?.topHoldings
    ? (() => {
        const holdings = tokenHoldings.topHoldings;
        const minVisiblePercentage = 3; // Minimum 3% for visibility
        const colors = ['#F39C12', '#3498DB', '#9B59B6', '#2ECC71', '#E74C3C'];

        // Separate large and small holdings
        const largeHoldings = holdings.filter(
          h => h.percentage >= minVisiblePercentage
        );
        const smallHoldings = holdings.filter(
          h => h.percentage < minVisiblePercentage
        );

        // Create chart data for large holdings
        const chartData = largeHoldings.map((holding, index) => ({
          name: holding.symbol,
          value: holding.percentage,
          color: colors[index % colors.length],
          amount: holding.valueUSD / (holding.percentage / 100),
          usdValue: holding.valueUSD,
        }));

        // If there are small holdings, group them as "Others"
        if (smallHoldings.length > 0) {
          const othersValue = smallHoldings.reduce(
            (sum, h) => sum + h.percentage,
            0
          );
          const othersUsdValue = smallHoldings.reduce(
            (sum, h) => sum + h.valueUSD,
            0
          );

          chartData.push({
            name: 'Others',
            value: Math.max(othersValue, minVisiblePercentage), // Ensure at least 3% visibility
            color: colors[chartData.length % colors.length],
            amount: othersUsdValue / (othersValue / 100),
            usdValue: othersUsdValue,
          });
        }

        return chartData;
      })()
    : [];

  if (!historyData) {
    return null;
  }

  const portfolioData = historyData.length
    ? historyData.map(item => ({
        date: dateFormatter(item.date),
        totalPortfolio: item.totalValueUSD,
        totalAssets: item.totalAssets,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-3 sm:gap-4">
        <h4 className="text-base sm:text-lg">Top Assets Held</h4>
        
        {topHoldings.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-md p-6 sm:p-8 md:p-12 text-center">
            <div className="mb-3 sm:mb-4 rounded-full bg-primary/10 p-4 sm:p-5 md:p-6">
              <svg
                className="size-8 sm:size-10 md:size-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h5 className="mb-2 text-base sm:text-lg font-semibold">No Tokens Found</h5>
            <p className="text-muted max-w-md text-xs sm:text-sm">
              No {chainName} ecosystem tokens detected in your connected wallets. Add wallets or acquire tokens to see your holdings here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {topHoldings.slice(0, 5).map((asset) => {
            const hasMultipleWallets = asset.wallets.length > 1;
            const isHovered = hoveredAsset === asset.symbol;

            return (
              <div
                key={asset.symbol}
                className="glass relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-md p-3 sm:p-4 min-w-0"
                onMouseEnter={() => hasMultipleWallets && setHoveredAsset(asset.symbol)}
                onMouseLeave={() => setHoveredAsset(null)}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <img
                    src={asset.logo}
                    alt={asset.name}
                    className="size-8 sm:size-10 rounded-full shrink-0"
                  />
                  <span className="font-pixel text-sm sm:text-base font-semibold truncate">
                    {asset.symbol}
                  </span>
                </div>

                <div className="flex flex-col items-start sm:items-end text-left sm:text-right shrink-0">
                  <span className="font-pixel text-sm sm:text-base font-semibold">
                    {formatQuantity(asset.totalQuantity)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-muted text-xs sm:text-sm">
                      {formatCurrency(asset.totalValueUSD)}
                    </span>
                  </div>
                </div>

                {/* Wallet breakdown tooltip - shown on hover, positioned above the card */}
                {isHovered && hasMultipleWallets && (
                  <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-background border-glass-border rounded-lg border p-4 shadow-2xl pointer-events-auto min-w-[280px] max-w-[320px]">
                      <div className="text-sm font-semibold mb-3 text-center">Holdings by Wallet</div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {asset.wallets.map((wallet, idx) => {
                          const walletName = `Wallet ${idx + 1}`;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                              <div className="text-muted font-medium">
                                {walletName}
                              </div>
                              <div className="text-right">
                                <div className="font-pixel font-semibold text-xs">
                                  {formatQuantity(wallet.quantity)}
                                </div>
                                <div className="text-muted text-[10px]">
                                  {formatCurrency(wallet.valueUSD)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        <h4 className="text-base sm:text-lg">My GuudScore</h4>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
          <div className="glass flex flex-col rounded-md p-4 sm:p-5 md:p-6">
            <div className="flex h-64 sm:h-80 md:h-96 items-center justify-between">
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={0}
                      stroke="var(--background)"
                      strokeWidth={8}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="glass min-w-[248px] rounded-xl p-3">
                              <div className="space-y-1">
                                <div className="text-xl font-bold">
                                  {data.name}
                                </div>
                                <div className="font-pixel text-3xl">
                                  {formatNumber(data.amount, 2)}
                                </div>
                                <div className="font-pixel text-muted text-base">
                                  {formatCurrency(data.usdValue)}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center space-y-2 sm:space-y-3 pr-2 sm:pr-4 md:pr-8">
                {donutData.map((token, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: token.color }}
                    />
                    <div className="flex flex-col">
                      <span className="font-pixel text-sm font-semibold">
                        {token.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass flex flex-col rounded-md p-4 sm:p-5 md:p-6">
            <div className="h-64 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={portfolioData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="totalGradient"
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
                    <linearGradient
                      id="walletGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--quaternary)"
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--quaternary)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
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
                          <div className="glass min-w-[248px] rounded-xl p-3">
                            <div className="space-y-2">
                              <div className="text-xl font-bold uppercase">
                                {label}
                              </div>
                              <div className="font-pixel text-xs">
                                <span
                                  className="mr-2 inline-block h-3 w-3 rounded-full"
                                  style={{ backgroundColor: 'var(--primary)' }}
                                />
                                Total Portfolio: {formatCurrency(Number(payload[0].value))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalPortfolio"
                    stroke="var(--primary)"
                    fill="url(#totalGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
                <span className="font-pixel text-sm">Total Portfolio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
