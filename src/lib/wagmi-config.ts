import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalanche } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'GuudScore',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [avalanche],
  ssr: false,
});
