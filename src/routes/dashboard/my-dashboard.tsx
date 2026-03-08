import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
    useAccount,
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useSignMessage,
} from 'wagmi';
import { mainnet } from 'wagmi/chains';

import { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Card } from '@/components/card';
import { ErrorMessage } from '@/components/error-message';
import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useChain } from '@/contexts/chain-context';
import {
    useCurrentUser,
    useGuudScoreHistory,
    useLinkWallet,
    useUnlinkWallet,
    useWalletList,
} from '@/hooks';
import { dateFormatter, walletAddressShortener } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/my-dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: scoreHistoryData, isLoading: scoreLoading, error: scoreError } = useGuudScoreHistory();
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [hasAutoSigned, setHasAutoSigned] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Chain context for network selection
  const { selectedNetwork } = useChain();

  // EVM wallet hooks (Avalanche, Base & Arbitrum)
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { signMessageAsync: signEvmMessage } = useSignMessage();

  // Solana wallet hooks
  const { 
    publicKey: solanaPublicKey, 
    connected: isSolanaConnected, 
    disconnect: disconnectSolana,
    signMessage: signSolanaMessage 
  } = useWallet();

  // Determine which wallet is active based on network
  const isConnected = selectedNetwork === 'SOLANA' ? isSolanaConnected : isEvmConnected;
  const address = selectedNetwork === 'SOLANA' 
    ? solanaPublicKey?.toBase58() 
    : evmAddress;

  // ENS bilgilerini al (mainnet üzerinden) - only for EVM
  const { data: ensName } = useEnsName({
    address: evmAddress,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: mainnet.id,
  });

  const { data: currentUser, isLoading, error } = useCurrentUser();
  const allWalletsData = useWalletList();
  const linkWalletMutation = useLinkWallet();
  const unlinkWalletMutation = useUnlinkWallet();
  const maxWallets = 10;

  // Filter wallets based on selected network and remove duplicates
  // Solana addresses are Base58 (don't start with 0x), EVM addresses start with 0x
  const walletsData = allWalletsData
    .filter(wallet => {
      const isSolanaWallet = !wallet.walletAddress.startsWith('0x');
      return selectedNetwork === 'SOLANA' ? isSolanaWallet : !isSolanaWallet;
    })
    // Remove duplicate wallet addresses (keep first occurrence by id)
    .filter((wallet, index, self) => 
      index === self.findIndex(w => w.walletAddress.toLowerCase() === wallet.walletAddress.toLowerCase())
    );
  
  const connectedWallets = walletsData.length;

  // Handle disconnect based on network
  const handleDisconnect = () => {
    if (selectedNetwork === 'SOLANA') {
      disconnectSolana();
    } else {
      disconnectEvm();
    }
  };

  const handleAddWallet = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!currentUser?.nonce) {
      toast.error('User nonce not found. Please refresh and try again.');
      return;
    }

    setIsSigningMessage(true);

    try {
      let walletAddress = address;
      let signature: string;

      if (selectedNetwork === 'SOLANA') {
        // Solana wallet signing
        if (!solanaPublicKey || !signSolanaMessage) {
          toast.error('Solana wallet not properly connected');
          setIsSigningMessage(false);
          return;
        }

        const message = `GUUD Score Wallet Verification

By signing this message, you confirm that:
• You are the rightful owner of this wallet address
• You authorize this wallet to be linked to your GUUD Score account
• This signature is used solely for ownership verification
• No transaction will be executed or funds transferred

Wallet: ${solanaPublicKey.toBase58()}
Nonce: ${currentUser.nonce}

Request: Link wallet to GUUD Score account`;

        const encodedMessage = new TextEncoder().encode(message);
        const signatureBytes = await signSolanaMessage(encodedMessage);
        
        // Convert signature to base58 string
        const bs58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let signatureBase58 = '';
        let num = BigInt('0x' + Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        while (num > 0) {
          signatureBase58 = bs58Chars[Number(num % 58n)] + signatureBase58;
          num = num / 58n;
        }
        signature = signatureBase58;
        walletAddress = solanaPublicKey.toBase58();

        await linkWalletMutation.mutateAsync({
          walletAddress,
          signature,
          network: 'SOLANA',
        });
      } else {
        // EVM wallet signing (Avalanche & Base)
        let actualAddress = evmAddress;
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            const accounts = await (window as any).ethereum.request({ 
              method: 'eth_accounts' 
            }) as string[];
            
            if (accounts && accounts.length > 0) {
              actualAddress = accounts[0] as `0x${string}`;
              
              if (evmAddress && evmAddress.toLowerCase() !== actualAddress.toLowerCase()) {
                console.warn('⚠️ Address mismatch detected! Using actual provider address.');
              }
            }
          } catch (providerError) {
            console.warn('Could not fetch accounts from provider, using wagmi address:', providerError);
          }
        }

        const normalizedAddress = actualAddress?.toLowerCase() || '';

        const message = `GUUD Score Wallet Verification

By signing this message, you confirm that:
• You are the rightful owner of this wallet address
• You authorize this wallet to be linked to your GUUD Score account
• This signature is used solely for ownership verification
• No transaction will be executed or funds transferred

Wallet: ${normalizedAddress}
Nonce: ${currentUser.nonce}

Request: Link wallet to GUUD Score account`;

        signature = await signEvmMessage({ message });

        await linkWalletMutation.mutateAsync({
          walletAddress: normalizedAddress,
          signature,
          network: selectedNetwork as 'AVAX' | 'BASE' | 'SOLANA',
          ensName: ensName || '',
          ensAvatar: ensAvatar || '',
        });
      }

      setShowAddForm(false);
      setHasAutoSigned(false);
      setHasError(false);
      handleDisconnect();
    } catch (error: any) {
      console.error('❌ Wallet linking error:', error);

      if (error?.message?.includes('User rejected')) {
        toast.error('Signature request was rejected');
      } else if (
        error?.message?.includes('invalid') ||
        error?.message?.includes('Invalid')
      ) {
        toast.error('Invalid signature. Please try again.');
      } else {
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to add wallet';
        toast.error(errorMsg);
      }
      
      setHasAutoSigned(true);
      setHasError(true);
      setShowAddForm(false);
      handleDisconnect();
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Auto-trigger signature when wallet connects
  useEffect(() => {
    if (isConnected && address && showAddForm && !hasAutoSigned && !hasError && !isSigningMessage && currentUser?.nonce) {
      setHasAutoSigned(true);
      handleAddWallet();
    }
  }, [isConnected, address, showAddForm, hasAutoSigned, isSigningMessage, currentUser?.nonce]);

  const handleRemoveWallet = async (walletId: string) => {
    try {
      // Find the wallet being deleted to get its address
      const walletToDelete = allWalletsData.find(w => w.id === walletId);
      if (!walletToDelete) {
        await unlinkWalletMutation.mutateAsync(walletId);
        setConfirmingDelete(null);
        return;
      }

      // Find all wallets with the same address (duplicates across chains)
      const duplicateWallets = allWalletsData.filter(
        w => w.walletAddress.toLowerCase() === walletToDelete.walletAddress.toLowerCase()
      );

      // Delete all duplicate wallets
      await Promise.all(
        duplicateWallets.map(w => unlinkWalletMutation.mutateAsync(w.id))
      );
      
      setConfirmingDelete(null);
    } catch (error) {
      // Error toast handled by hook
    }
  };

  // const feedData = [
  //   {
  //     id: 1,
  //     profileImage: null,
  //     username: 'CryptoKing',
  //     xHandle: '@cryptoking',
  //     date: '22 Jun',
  //     text: 'Just achieved a new milestone in DeFi farming! The yields are looking incredible this quarter. 🚀',
  //     likes: 142,
  //     comments: 28,
  //     reshares: 45,
  //     views: 1200,
  //   },
  //   {
  //     id: 2,
  //     profileImage: null,
  //     username: 'CryptoKing',
  //     xHandle: '@cryptoking',
  //     date: '21 Jun',
  //     text: 'New NFT collection dropping soon! Stay tuned for some amazing artwork and utility features.',
  //     likes: 89,
  //     comments: 12,
  //     reshares: 23,
  //     views: 856,
  //   },
  //   {
  //     id: 3,
  //     profileImage: null,
  //     username: 'CryptoKing',
  //     xHandle: '@cryptoking',
  //     date: '20 Jun',
  //     text: 'The future of Web3 is here. Excited to be part of this revolutionary ecosystem! 🌟',
  //     likes: 256,
  //     comments: 67,
  //     reshares: 89,
  //     views: 2100,
  //   },
  // ];

  if (isLoading || scoreLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h4 className="text-muted text-sm">Loading dashboard...</h4>
      </div>
    );
  }

  if (error || scoreError) {
    return (
      <ErrorMessage
        header="Error loading dashboard"
        error={error?.message || scoreError?.message || 'Unknown error'}
      />
    );
  }

  const scoreHistory =
    scoreHistoryData?.map(item => ({
      date: dateFormatter(item.date),
      score: item.score,
    })) || [];

  return (
    <>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GuudScore Chart - Left Side (2 columns on lg screens) */}
        <div className="lg:col-span-2">
          <Card title="Guudscore" headingClassName="text-base sm:text-lg font-pixel">
              <div className="h-64 sm:h-80 md:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={scoreHistory}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="scoreGradient"
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
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      className="font-pixel text-muted text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      dataKey="score"
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
                                  {label
                                    ? new Date(label).toLocaleDateString(
                                        'tr-TR',
                                        {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        }
                                      )
                                    : 'N/A'}
                                </div>
                                <div className="font-pixel text-xs">
                                  <span
                                    className="mr-2 inline-block h-3 w-3 rounded-full"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                  />
                                  GuudScore: {payload[0].value}
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
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
          </Card>
        </div>

        {/* Wallets Section - Right Side (1 column on lg screens) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg">Your Wallets</h4>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-muted text-xs sm:text-sm">
                  {connectedWallets}/{maxWallets}
                </span>
              </div>
            </div>
            <p className="text-muted text-xs leading-relaxed">
              Connect your wallets to calculate your GuudScore and unlock exclusive badges based on your on-chain activity.
            </p>
            <Button
              onClick={() => {
                setShowAddForm(true);
                setHasAutoSigned(false);
                setHasError(false);
              }}
              className="font-pixel flex items-center gap-1.5 text-xs w-full"
              disabled={connectedWallets >= maxWallets}
              size="sm"
            >
              <Icons.plus className="size-3" />
              Add Wallet
            </Button>
          </div>

          {/* Add Wallet Form */}
          {showAddForm && (
            <div className="glass rounded-md p-4">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="font-pixel text-sm">
                  Add {selectedNetwork === 'SOLANA' ? 'Solana' : selectedNetwork === 'BASE' ? 'Base' : selectedNetwork === 'ARBITRUM' ? 'Arbitrum' : selectedNetwork === 'MONAD' ? 'Monad' : 'Avalanche'} Wallet
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setHasAutoSigned(false);
                    setHasError(false);
                    if (isConnected) {
                      handleDisconnect();
                    }
                  }}
                >
                  ×
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                {selectedNetwork === 'SOLANA' ? (
                  // Solana Wallet Connect
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-center">
                      <WalletMultiButton 
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0.375rem',
                          height: '36px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    
                    {isSolanaConnected && solanaPublicKey && (
                      <div className="flex flex-col gap-4">
                        <div className="glass rounded-md p-3">
                          <div className="text-xs font-semibold">Connected Solana Wallet</div>
                          <div className="font-pixel text-muted mt-1 text-[10px] break-all">
                            {solanaPublicKey.toBase58()}
                          </div>
                          {(isSigningMessage || linkWalletMutation.isPending) && (
                            <div className="text-primary mt-2 text-xs">
                              {isSigningMessage
                                ? '⏳ Please sign...'
                                : '⏳ Adding...'}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false);
                            setHasAutoSigned(false);
                            disconnectSolana();
                          }}
                          disabled={linkWalletMutation.isPending || isSigningMessage}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // EVM Wallet Connect (Avalanche)
                  <>
                    <div className="flex justify-center">
                      <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                      }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                          ready &&
                          account &&
                          chain &&
                          (!authenticationStatus ||
                            authenticationStatus === 'authenticated');

                        return (
                          <div
                            {...(!ready && {
                              'aria-hidden': true,
                              style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                              },
                            })}
                          >
                            {(() => {
                              if (!connected) {
                                return (
                                  <Button
                                    onClick={openConnectModal}
                                    className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] glass hover:bg-glass-background/80 hover:border-glass-border/80 px-4 py-2 w-full"
                                    size="sm"
                                  >
                                    Connect Wallet
                                  </Button>
                                );
                              }

                              if (chain.unsupported) {
                                return (
                                  <Button
                                    onClick={openChainModal}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    Wrong network
                                  </Button>
                                );
                              }

                              return (
                                <div className="flex flex-col gap-2 w-full">
                                  <Button
                                    onClick={openChainModal}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                  >
                                    {chain.hasIcon && (
                                      <div
                                        className="size-4 overflow-hidden rounded-full"
                                        style={{
                                          background: chain.iconBackground,
                                        }}
                                      >
                                        {chain.iconUrl && (
                                          <img
                                            alt={chain.name ?? 'Chain icon'}
                                            src={chain.iconUrl}
                                            className="size-4"
                                          />
                                        )}
                                      </div>
                                    )}
                                    {chain.name}
                                  </Button>

                                  <Button
                                    onClick={openAccountModal}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {account.displayName}
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>

                  {isEvmConnected && evmAddress && (
                    <div className="flex flex-col gap-4">
                      <div className="glass rounded-md p-3">
                        <div className="text-xs font-semibold">Connected Wallet</div>
                        <div className="font-pixel text-muted mt-1 text-[10px] break-all">
                          {evmAddress}
                        </div>
                        {(isSigningMessage || linkWalletMutation.isPending) && (
                          <div className="text-primary mt-2 text-xs">
                            {isSigningMessage
                              ? '⏳ Please sign...'
                              : '⏳ Adding...'}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddForm(false);
                          setHasAutoSigned(false);
                          disconnectEvm();
                        }}
                        disabled={linkWalletMutation.isPending || isSigningMessage}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {walletsData.map(wallet => (
              <div
                key={`wallet-${wallet.walletAddress}`}
                className="glass flex items-center justify-between rounded-md p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 rounded-md p-2">
                    <Icons.wallet className="text-primary size-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-pixel text-xs font-semibold">
                      {walletAddressShortener(wallet.walletAddress)}
                    </span>
                    <span className="font-pixel text-muted text-[10px]">
                      Encrypted
                    </span>
                  </div>
                </div>

                {confirmingDelete === wallet.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={unlinkWalletMutation.isPending}
                      onClick={() => handleRemoveWallet(wallet.id)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      {unlinkWalletMutation.isPending ? '...' : 'Confirm'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(null)}
                      disabled={unlinkWalletMutation.isPending}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmingDelete(wallet.id)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
