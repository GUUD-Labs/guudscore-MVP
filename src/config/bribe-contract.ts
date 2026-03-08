/**
 * Bribe Contract Configuration
 * Contract addresses and ABI for the Bribe system
 */

import type { BribeNetwork } from '@/types/bribe';

// Contract addresses per network
export const BRIBE_CONTRACT_ADDRESSES: Record<BribeNetwork, string | null> = {
  AVAX: '0x8d46796613e408E35CFb5F2F8532c3bBa3FBf8F4',
  BASE: null, // TBD
  ARBITRUM: null, // TBD
  MONAD: null, // TBD
  SOLANA: null, // Solana uses different program
};

// ERC-20 Token ABI (for approve)
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// Bribe Contract ABI
export const BRIBE_CONTRACT_ABI = [
  // Read functions
  {
    name: 'FEE_BASIS_POINTS',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'MAX_RECIPIENTS',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'estimateBribe',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'recipientCount', type: 'uint256' },
      { name: 'totalAmount', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountPerRecipient', type: 'uint256' },
      { name: 'totalFee', type: 'uint256' },
      { name: 'actualTotal', type: 'uint256' },
    ],
  },
  {
    name: 'canBribe',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [
      { name: 'canExecute', type: 'bool' },
      { name: 'reason', type: 'string' },
    ],
  },
  // Write functions
  {
    name: 'bribeSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'bribeBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  // Events
  {
    name: 'BribeSent',
    type: 'event',
    inputs: [
      { name: 'sender', type: 'address', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
      { name: 'message', type: 'string', indexed: false },
    ],
  },
  {
    name: 'BatchBribeSent',
    type: 'event',
    inputs: [
      { name: 'sender', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'recipientCount', type: 'uint256', indexed: false },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'totalFee', type: 'uint256', indexed: false },
      { name: 'message', type: 'string', indexed: false },
    ],
  },
] as const;

// Explorer URLs per network
export const EXPLORER_URLS: Record<BribeNetwork, string> = {
  AVAX: 'https://snowtrace.io',
  BASE: 'https://basescan.org',
  ARBITRUM: 'https://arbiscan.io',
  MONAD: 'https://explorer.monad.xyz',
  SOLANA: 'https://solscan.io',
};

/**
 * Get the bribe contract address for a network
 */
export function getBribeContractAddress(network: BribeNetwork): string | null {
  return BRIBE_CONTRACT_ADDRESSES[network];
}

/**
 * Check if bribe is supported on a network
 */
export function isBribeSupported(network: BribeNetwork): boolean {
  return BRIBE_CONTRACT_ADDRESSES[network] !== null;
}

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(network: BribeNetwork, txHash: string): string {
  const baseUrl = EXPLORER_URLS[network];
  if (network === 'SOLANA') {
    return `${baseUrl}/tx/${txHash}`;
  }
  return `${baseUrl}/tx/${txHash}`;
}
