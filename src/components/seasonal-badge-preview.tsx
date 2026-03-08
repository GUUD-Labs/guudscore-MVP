/**
 * Seasonal Badge Preview
 * 
 * Bu komponent seasonal badge generator'ın nasıl çalıştığını göstermek için
 * örnek badge'ler oluşturur. Development ve test amaçlı kullanılabilir.
 */

import { useState } from 'react';

import { SeasonalBadgeImage } from '@/components/seasonal-badge-image';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { NetworkType } from '@/types/badge';

const NETWORKS: NetworkType[] = ['AVAX', 'BASE', 'SOLANA', 'ARBITRUM', 'MONAD'];
const QUARTERS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
const YEARS = [2024, 2025, 2026];
const TIERS = ['Tourist', 'Paperhands', 'Maxi', 'Arena Veteran', 'Guudlord'];

export const SeasonalBadgePreview = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('AVAX');
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedTier, setSelectedTier] = useState<string>('Guudlord');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');

  const tierWithNetwork = selectedTier === 'Maxi' 
    ? `${selectedNetwork} Maxi` 
    : selectedTier;

  const downloadBadge = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `Q${selectedQuarter}_${selectedYear}_${selectedNetwork}_${selectedTier}.png`;
    link.href = generatedImageUrl;
    link.click();
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Seasonal Badge Preview</h1>
        <p className="text-muted-foreground">
          Test and preview seasonal badge generation
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Network</label>
          <Select value={selectedNetwork} onValueChange={(v) => setSelectedNetwork(v as NetworkType)}>
            <SelectTrigger className="glass border-glass-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map(network => (
                <SelectItem key={network} value={network}>{network}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Quarter</label>
          <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v) as 1 | 2 | 3 | 4)}>
            <SelectTrigger className="glass border-glass-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map(q => (
                <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Year</label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="glass border-glass-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Tier</label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="glass border-glass-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map(tier => (
                <SelectItem key={tier} value={tier}>{tier}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-6">
        <div className="glass rounded-xl p-8 border border-glass-border">
          <SeasonalBadgeImage
            network={selectedNetwork}
            quarter={selectedQuarter}
            tier={tierWithNetwork}
            size={300}
            onImageGenerated={setGeneratedImageUrl}
          />
        </div>

        <Button onClick={downloadBadge} disabled={!generatedImageUrl}>
          Download Badge
        </Button>
      </div>

      {/* All Combinations Preview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">All Tier Variants</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {TIERS.map(tier => (
            <div key={tier} className="flex flex-col items-center gap-2">
              <SeasonalBadgeImage
                network={selectedNetwork}
                quarter={selectedQuarter}
                tier={tier === 'Maxi' ? `${selectedNetwork} Maxi` : tier}
                size={150}
              />
              <span className="text-xs text-muted-foreground">{tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Networks Preview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">All Networks</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {NETWORKS.map(network => (
            <div key={network} className="flex flex-col items-center gap-2">
              <SeasonalBadgeImage
                network={network}
                quarter={selectedQuarter}
                tier={selectedTier === 'Maxi' ? `${network} Maxi` : selectedTier}
                size={150}
              />
              <span className="text-xs text-muted-foreground">{network}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeasonalBadgePreview;
