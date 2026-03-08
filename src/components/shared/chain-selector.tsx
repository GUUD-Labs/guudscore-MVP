import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChain, type NetworkType } from '@/contexts/chain-context';
import { ChevronDown } from 'lucide-react';

type Chain = 'avalanche' | 'base' | 'solana' | 'arbitrum' | 'monad';

const chainToNetwork: Record<Chain, NetworkType> = {
  avalanche: 'AVAX',
  base: 'BASE',
  solana: 'SOLANA',
  arbitrum: 'ARBITRUM',
  monad: 'MONAD',
};

const networkToChain: Record<NetworkType, Chain> = {
  AVAX: 'avalanche',
  BASE: 'base',
  SOLANA: 'solana',
  ARBITRUM: 'arbitrum',
  MONAD: 'monad',
};

const chains = [
  {
    id: 'avalanche' as Chain,
    name: 'Avalanche',
    logo: (
      <svg width="24" height="24" viewBox="0 0 1503 1504" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="287" y="258" width="928" height="844" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M1502.5 752C1502.5 1166.77 1166.27 1503 751.5 1503C336.734 1503 0.5 1166.77 0.5 752C0.5 337.234 336.734 1 751.5 1C1166.27 1 1502.5 337.234 1502.5 752ZM538.688 1050.86H392.94C362.314 1050.86 347.186 1050.86 337.962 1044.96C327.999 1038.5 321.911 1027.8 321.173 1015.99C320.619 1005.11 328.184 991.822 343.312 965.255L703.182 330.935C718.495 303.999 726.243 290.531 736.021 285.55C746.537 280.2 759.083 280.2 769.599 285.55C779.377 290.531 787.126 303.999 802.438 330.935L876.42 460.079L876.797 460.738C893.336 489.635 901.723 504.289 905.385 519.669C909.443 536.458 909.443 554.169 905.385 570.958C901.695 586.455 893.393 601.215 876.604 630.549L687.573 964.702L687.084 965.558C670.436 994.693 661.999 1009.46 650.306 1020.6C637.576 1032.78 622.263 1041.63 605.474 1046.62C590.161 1050.86 573.004 1050.86 538.688 1050.86ZM906.75 1050.86H1115.59C1146.4 1050.86 1161.9 1050.86 1171.13 1044.78C1181.09 1038.32 1187.36 1027.43 1187.92 1015.63C1188.45 1005.1 1181.05 992.33 1166.55 967.307C1166.05 966.455 1165.55 965.588 1165.04 964.706L1060.43 785.75L1059.24 783.735C1044.54 758.877 1037.12 746.324 1027.59 741.472C1017.08 736.121 1004.71 736.121 994.199 741.472C984.605 746.453 976.857 759.552 961.544 785.934L857.306 964.891L856.949 965.507C841.69 991.847 834.064 1005.01 834.614 1015.81C835.352 1027.62 841.44 1038.5 851.402 1044.96C860.443 1050.86 875.94 1050.86 906.75 1050.86Z" fill="#E84142"/>
      </svg>
    ),
    enabled: true,
  },
  {
    id: 'base' as Chain,
    name: 'Base',
    logo: (
      <svg width="24" height="24" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
      </svg>
    ),
    enabled: true,
  },
  {
    id: 'solana' as Chain,
    name: 'Solana',
    logo: (
      <svg width="24" height="24" viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="solanaGradient" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00ffa3"/>
            <stop offset="1" stopColor="#dc1fff"/>
          </linearGradient>
          <linearGradient id="solanaGradient2" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00ffa3"/>
            <stop offset="1" stopColor="#dc1fff"/>
          </linearGradient>
          <linearGradient id="solanaGradient3" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00ffa3"/>
            <stop offset="1" stopColor="#dc1fff"/>
          </linearGradient>
        </defs>
        <path d="m64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8h-317.4c-5.8 0-8.7-7-4.6-11.1z" fill="url(#solanaGradient)"/>
        <path d="m64.6 3.8c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8h-317.4c-5.8 0-8.7-7-4.6-11.1z" fill="url(#solanaGradient2)"/>
        <path d="m333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8h-317.4c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1z" fill="url(#solanaGradient3)"/>
      </svg>
    ),
    enabled: true,
  },
  {
    id: 'arbitrum' as Chain,
    name: 'Arbitrum',
    logo: (
      <img src="/arbitrum.svg" alt="Arbitrum" className="w-6 h-6" />
    ),
    enabled: true,
  },
  {
    id: 'monad' as Chain,
    name: 'Monad',
    logo: (
      <img src="/monad.svg" alt="Monad" className="w-6 h-6" />
    ),
    enabled: true,
  },
];

export const ChainSelector = () => {
  const { selectedNetwork, setSelectedNetwork } = useChain();
  const selectedChain = networkToChain[selectedNetwork];
  const currentChain = chains.find(c => c.id === selectedChain);

  const handleChainSelect = (chain: Chain) => {
    const network = chainToNetwork[chain];
    setSelectedNetwork(network);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-primary/10 focus:outline-none">
          <div className="flex items-center justify-center w-5 h-5">
            {currentChain?.logo}
          </div>
          <ChevronDown className="h-4 w-4 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-glass-border w-48">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            disabled={!chain.enabled}
            className={`cursor-pointer flex items-center gap-3 ${
              !chain.enabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${selectedChain === chain.id ? 'bg-primary/10' : ''}`}
            onClick={() => chain.enabled && handleChainSelect(chain.id)}
          >
            <div className="flex items-center justify-center w-5 h-5">
              {chain.logo}
            </div>
            <span className="font-pixel text-sm">{chain.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
