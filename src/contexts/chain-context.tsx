import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

export type NetworkType = 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';

const STORAGE_KEY = 'selectedNetwork';

interface ChainContextType {
  selectedNetwork: NetworkType;
  setSelectedNetwork: (network: NetworkType) => void;
  getNetworkParam: () => string;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const getStoredNetwork = (): NetworkType => {
  if (typeof window === 'undefined') return 'AVAX';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'AVAX' || stored === 'BASE' || stored === 'SOLANA' || stored === 'ARBITRUM' || stored === 'MONAD') {
    return stored;
  }
  return 'AVAX';
};

export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [selectedNetwork, setSelectedNetworkState] =
    useState<NetworkType>(getStoredNetwork);

  const setSelectedNetwork = useCallback((network: NetworkType) => {
    setSelectedNetworkState(network);
    localStorage.setItem(STORAGE_KEY, network);
  }, []);

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = getStoredNetwork();
    if (stored !== selectedNetwork) {
      setSelectedNetworkState(stored);
    }
  }, []);

  const getNetworkParam = useCallback(() => {
    return `network=${selectedNetwork}`;
  }, [selectedNetwork]);

  return (
    <ChainContext.Provider value={{ selectedNetwork, setSelectedNetwork, getNetworkParam }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};

export const useNetworkParam = () => {
  const { selectedNetwork } = useChain();
  return selectedNetwork;
};
