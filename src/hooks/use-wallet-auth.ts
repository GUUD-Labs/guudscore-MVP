import { useCallback, useEffect, useRef, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/auth';
import type { WalletType } from '@/types';

import { AUTH_QUERY_KEYS, tokenStorage } from './use-auth';

export type WalletSignInStatus =
  | 'idle'
  | 'connecting'
  | 'requesting_nonce'
  | 'signing'
  | 'verifying'
  | 'success'
  | 'error';

/** Convert a UTF-8 string to 0x-prefixed hex for personal_sign */
function toHex(str: string): string {
  return (
    '0x' +
    Array.from(new TextEncoder().encode(str))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Proper base58 encoding that handles leading zero bytes correctly.
 */
function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) leadingZeros++;
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) num = num * 256n + BigInt(bytes[i]);
  let encoded = '';
  while (num > 0n) {
    encoded = ALPHABET[Number(num % 58n)] + encoded;
    num = num / 58n;
  }
  return '1'.repeat(leadingZeros) + encoded;
}

/**
 * Get the MetaMask provider specifically, avoiding conflicts with
 * Phantom EVM mode or other wallet extensions that override window.ethereum.
 */
function getEvmProvider(): any {
  const win = window as any;

  // If MetaMask is installed alongside other wallets, it exposes itself
  // via window.ethereum.providers array
  if (win.ethereum?.providers?.length) {
    const metamask = win.ethereum.providers.find(
      (p: any) => p.isMetaMask && !p.isPhantom
    );
    if (metamask) return metamask;
  }

  // Fallback: use window.ethereum if it's MetaMask (not Phantom EVM)
  if (win.ethereum && !win.ethereum.isPhantom) {
    return win.ethereum;
  }

  // Last resort: any EVM provider
  if (win.ethereum) {
    return win.ethereum;
  }

  return null;
}

export function useWalletSignIn() {
  const [status, setStatus] = useState<WalletSignInStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingSolanaSignIn = useRef(false);
  const queryClient = useQueryClient();

  // Solana hooks (these are safe — Solana adapter doesn't have the 'raw' issue)
  const {
    publicKey: solanaPublicKey,
    connected: isSolanaConnected,
    signMessage: signSolanaMessage,
    connect: connectSolana,
    disconnect: disconnectSolana,
    wallet: solanaWallet,
  } = useWallet();
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  const getReferralCode = (): string | undefined => {
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef) return urlRef;
    const stored = localStorage.getItem('referralCode');
    return stored || undefined;
  };

  const handleSuccess = useCallback(
    (accessToken: string, expiresIn: number) => {
      tokenStorage.setTokens({ accessToken, refreshToken: '', expiresIn });
      localStorage.removeItem('referralCode');
      sessionStorage.setItem('oauth_login_in_progress', 'true');
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    },
    [queryClient],
  );

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Wallet sign-in failed';
    if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('User denied')) {
      setError('Sign cancelled');
    } else if (msg.includes('Nonce expired') || msg.includes('nonce')) {
      setError('Nonce expired. Please try again.');
    } else if (msg.includes('Invalid signature') || msg.includes('invalid signature')) {
      setError('Verification failed, please try again');
    } else {
      setError(msg);
    }
    setStatus('error');
  }, []);

  // ─── EVM Sign-In (direct window.ethereum — avoids wagmi 'raw' crash) ───
  const signInWithEvm = useCallback(async () => {
    setError(null);
    try {
      const provider = getEvmProvider();
      if (!provider) throw new Error('No EVM wallet detected. Please install MetaMask or another wallet.');

      // Step 1: Request accounts
      setStatus('connecting');
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts?.length) throw new Error('No accounts returned from wallet');
      const address = accounts[0].toLowerCase();

      // Step 2: Request nonce from backend (fresh nonce every time)
      setStatus('requesting_nonce');
      const { messageToSign } = await authService.walletNonce({
        walletAddress: address,
        walletType: 'EVM' as WalletType,
      });

      // Step 3: Sign with personal_sign
      // MetaMask requires hex-encoded message: params = [hexData, fromAddress]
      // personal_sign internally prepends "\x19Ethereum Signed Message:\n{len}"
      // so backend's web3.eth.accounts.recover(plaintextMessage, sig) will match.
      setStatus('signing');
      const hexMessage = toHex(messageToSign);
      const signature: string = await provider.request({
        method: 'personal_sign',
        params: [hexMessage, accounts[0]],
      });

      // Step 4: Verify with backend
      setStatus('verifying');
      const authResponse = await authService.walletVerify({
        walletAddress: address,
        signature,
        walletType: 'EVM' as WalletType,
        ref: getReferralCode(),
      });

      handleSuccess(authResponse.tokens.accessToken, authResponse.tokens.expiresIn);
    } catch (err) {
      handleError(err);
    }
  }, [handleSuccess, handleError]);

  // ─── Solana Sign-In (core flow) ────────────────────────────
  const doSolanaSignIn = useCallback(
    async (pubKeyBase58: string, signFn: (msg: Uint8Array) => Promise<Uint8Array>) => {
      try {
        // Request nonce
        setStatus('requesting_nonce');
        const { messageToSign } = await authService.walletNonce({
          walletAddress: pubKeyBase58,
          walletType: 'SOL' as WalletType,
        });

        // Sign
        setStatus('signing');
        const signatureBytes = await signFn(new TextEncoder().encode(messageToSign));
        const signatureBase58 = encodeBase58(signatureBytes);

        // Verify
        setStatus('verifying');
        const authResponse = await authService.walletVerify({
          walletAddress: pubKeyBase58,
          signature: signatureBase58,
          walletType: 'SOL' as WalletType,
          ref: getReferralCode(),
        });

        handleSuccess(authResponse.tokens.accessToken, authResponse.tokens.expiresIn);
      } catch (err) {
        handleError(err);
        disconnectSolana();
      }
    },
    [handleSuccess, handleError, disconnectSolana],
  );

  // After Solana wallet connects (from modal or connect call), continue sign-in
  useEffect(() => {
    if (
      pendingSolanaSignIn.current &&
      isSolanaConnected &&
      solanaPublicKey &&
      signSolanaMessage
    ) {
      pendingSolanaSignIn.current = false;
      doSolanaSignIn(solanaPublicKey.toBase58(), signSolanaMessage);
    }
  }, [isSolanaConnected, solanaPublicKey, signSolanaMessage, doSolanaSignIn]);

  const signInWithSolana = useCallback(async () => {
    setError(null);
    try {
      if (isSolanaConnected && solanaPublicKey && signSolanaMessage) {
        // Already connected — go directly
        await doSolanaSignIn(solanaPublicKey.toBase58(), signSolanaMessage);
      } else if (solanaWallet) {
        // Wallet adapter selected but not connected
        setStatus('connecting');
        pendingSolanaSignIn.current = true;
        await connectSolana();
        // useEffect above will fire when connected
      } else {
        // No wallet selected — open Solana wallet modal
        setStatus('connecting');
        pendingSolanaSignIn.current = true;
        setSolanaModalVisible(true);
        // User picks a wallet in the modal → adapter auto-connects → useEffect fires
      }
    } catch (err) {
      pendingSolanaSignIn.current = false;
      handleError(err);
    }
  }, [
    isSolanaConnected,
    solanaPublicKey,
    signSolanaMessage,
    solanaWallet,
    connectSolana,
    doSolanaSignIn,
    setSolanaModalVisible,
    handleError,
  ]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    pendingSolanaSignIn.current = false;
  }, []);

  return { status, error, signInWithEvm, signInWithSolana, reset };
}
