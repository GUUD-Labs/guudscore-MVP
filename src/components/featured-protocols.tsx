import { useState } from 'react';

import { TokenAvatar } from '@/components/token-avatar';

interface AvalancheProtocol {
  name: string;
  address: string;
  category: string;
  ecosystem: string;
  logo: string;
  twitter?: string;
}

interface FeaturedProtocolsProps {
  avalancheProtocols?: { protocols: AvalancheProtocol[] } | null;
}

export const FeaturedProtocols = ({ avalancheProtocols }: FeaturedProtocolsProps) => {
  const [isPaused, setIsPaused] = useState(false);

  // Featured ecosystems to display
  const featuredEcosystems = ['ARENA', 'LFJ', 'Pharaoh', 'BenQi', 'BLAZE', 'Blackhole', 'Salvor'];

  // Get one protocol from each featured ecosystem
  const uniqueProtocols = featuredEcosystems
    .map((ecosystem) => {
      const matchingProtocol = avalancheProtocols?.protocols.find(
        p => p.ecosystem.toLowerCase() === ecosystem.toLowerCase()
      );
      return matchingProtocol;
    })
    .filter((protocol): protocol is AvalancheProtocol => protocol !== undefined);

  // Duplicate multiple times for seamless infinite scroll
  const duplicatedProtocols = [
    ...uniqueProtocols, 
    ...uniqueProtocols, 
    ...uniqueProtocols,
    ...uniqueProtocols
  ];

  return (
    <div className="w-full py-2">
      <div className="w-full">
        <h3 className="font-pixel text-sm text-muted-foreground mb-3 text-center">
          Featured Protocols
        </h3>
        <div className="relative overflow-hidden w-full">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div
            className={`flex gap-3 ${!isPaused ? 'animate-scroll' : 'animate-scroll-paused'}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              width: 'max-content',
            }}
          >
            {duplicatedProtocols.map((matchingProtocol, index) => (
              <div
                key={`${matchingProtocol.ecosystem}-${index}`}
                className="glass flex items-center gap-3 rounded-lg px-4 py-2 min-w-[220px] hover:bg-background/80 transition-colors cursor-pointer"
                onClick={() => {
                  if (matchingProtocol.twitter) {
                    window.open(matchingProtocol.twitter, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                {matchingProtocol.logo ? (
                  <img
                    src={matchingProtocol.logo}
                    alt={matchingProtocol.ecosystem}
                    className="size-8 rounded-md object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <TokenAvatar symbol={matchingProtocol.ecosystem} size="sm" />
                )}
                <div className="flex flex-col justify-center min-w-0 gap-0.5">
                  <h4 className="font-pixel text-xs text-foreground truncate leading-tight">
                    {matchingProtocol.ecosystem}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {matchingProtocol.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
