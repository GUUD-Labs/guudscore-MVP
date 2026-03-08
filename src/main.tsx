import {
    darkTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthRouterProvider } from '@/components/auth-router-provider';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { ChainProvider } from '@/contexts/chain-context';
import { SolanaWalletProvider } from '@/contexts/solana-wallet-context';
import { config } from '@/lib/wagmi-config';

import './index.css';
import reportWebVitals from './reportWebVitals.ts';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: false, // Don't retry failed requests by default
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      refetchOnReconnect: false, // Don't refetch when network reconnects
    },
  },
});

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#3b82f6', // Solid blue color
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
            })}
          >
            <AuthProvider>
              <ChainProvider>
                <SolanaWalletProvider>
                  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <AuthRouterProvider />
                    <Toaster position="top-center" richColors />
                  </ThemeProvider>
                </SolanaWalletProvider>
              </ChainProvider>
            </AuthProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
