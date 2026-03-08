/**
 * Bribe Modal Component
 * Full-featured modal for sending bribes with recipient management
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  AlertCircle,
  ExternalLink,
  Gift,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, parseUnits, type Address } from 'viem';
import { useAccount, useDisconnect, usePublicClient, useWalletClient } from 'wagmi';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BRIBE_CONTRACT_ABI,
  BRIBE_CONTRACT_ADDRESSES,
  ERC20_ABI,
  getTxExplorerUrl,
} from '@/config/bribe-contract';
import { useChain } from '@/contexts/chain-context';
import { useBribeableUsers, useBribeableUsersByNft, useRecordBribe } from '@/hooks/use-bribe';
import { cn } from '@/lib/utils';
import { getUserPhotoUrl } from '@/lib/utils/image';
import type { BribeableUser, BribeNetwork, BribeUsersFilter } from '@/types/bribe';

// Moralis API for fetching all ERC-20 tokens
const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const MORALIS_API_URL = 'https://deep-index.moralis.io/api/v2.2';

// Token info
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  name?: string;
  logo?: string;
}

// Moralis token balance response
interface MoralisTokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
}

// NFT Collection type
interface NFTCollection {
  contract_address?: string;
  collection_mint?: string;
  name: string;
  symbol?: string;
  collection_logo?: string;
  collection_image?: string;
}

// Recipient options
const RECIPIENT_OPTIONS = [
  { value: 'top10', label: 'Top 10', count: 10 },
  { value: 'top50', label: 'Top 50', count: 50 },
  { value: 'top100', label: 'Top 100', count: 100 },
  { value: 'top500', label: 'Top 500', count: 500 },
] as const;

export interface BribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Single recipient for profile page bribe */
  recipient?: BribeableUser;
  /** NFT collections for filtering */
  nftCollections?: NFTCollection[];
  /** Pre-selected NFT collection */
  selectedNftCollection?: string;
}

export function BribeModal({
  isOpen,
  onClose,
  recipient,
  nftCollections = [],
  selectedNftCollection,
}: BribeModalProps) {
  const { selectedNetwork } = useChain();
  const network = selectedNetwork as BribeNetwork;
  
  // Wagmi hooks
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Native AVAX balance state
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  
  // Recipients management
  const [recipients, setRecipients] = useState<BribeableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNftFilter, setSelectedNftFilter] = useState<string>(selectedNftCollection || '');
  const [nftSearchQuery, setNftSearchQuery] = useState('');
  
  // Token state
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  // Transaction state
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const recordBribeMutation = useRecordBribe();

  // Get bribeable users from API
  const { data: top10Users } = useBribeableUsers(network, 'top10');
  const { data: top50Users } = useBribeableUsers(network, 'top50');
  const { data: top100Users } = useBribeableUsers(network, 'top100');
  const { data: top500Users } = useBribeableUsers(network, 'top500');
  
  // Get bribeable users by NFT collection (API call)
  const { data: nftFilteredUsers } = useBribeableUsersByNft(
    network, 
    selectedNftFilter && selectedNftFilter !== 'all' ? selectedNftFilter : undefined
  );

  // Initialize with single recipient if provided
  useEffect(() => {
    if (recipient && isOpen) {
      setRecipients([recipient]);
    }
  }, [recipient, isOpen]);

  // Add users when NFT collection filter returns results
  useEffect(() => {
    if (!selectedNftFilter || selectedNftFilter === 'all' || !nftFilteredUsers) return;
    
    // Add users who aren't already in the list and have bribe wallets
    const newUsers = nftFilteredUsers.filter(
      u => u.evmBribeWallet && !recipients.some(r => r.id === u.id)
    );
    
    if (newUsers.length > 0) {
      setRecipients(prev => [...prev, ...newUsers]);
      toast.success(`Added ${newUsers.length} NFT holders`);
    } else if (nftFilteredUsers.length === 0) {
      toast.info('No bribeable users found with this NFT');
    }
    
    // Reset filter after adding
    setSelectedNftFilter('all');
  }, [nftFilteredUsers, selectedNftFilter]);

  // Load all ERC-20 token balances using Moralis API
  const loadTokenBalances = useCallback(async () => {
    if (!connectedAddress || !publicClient) return;
    
    setIsLoadingTokens(true);
    const tokenInfos: TokenInfo[] = [];
    
    try {
      // Fetch native AVAX balance using wagmi publicClient
      const nativeAvaxBalance = await publicClient.getBalance({
        address: connectedAddress,
      });
      setNativeBalance(formatUnits(nativeAvaxBalance, 18));
      
      // Fetch all ERC-20 tokens from Moralis API
      const response = await fetch(
        `${MORALIS_API_URL}/${connectedAddress}/erc20?chain=avalanche`,
        {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const tokens = data as MoralisTokenBalance[];
        
        for (const token of tokens) {
          // Skip spam tokens and zero balance
          if (token.possible_spam || token.balance === '0') continue;
          
          const balance = BigInt(token.balance);
          
          tokenInfos.push({
            address: token.token_address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance,
            formattedBalance: formatUnits(balance, token.decimals),
            logo: token.logo || token.thumbnail,
          });
        }
      } else {
        console.error('Moralis API error:', response.status, await response.text());
      }
      
      // Sort by balance value (highest first)
      tokenInfos.sort((a, b) => {
        const aValue = parseFloat(a.formattedBalance);
        const bValue = parseFloat(b.formattedBalance);
        return bValue - aValue;
      });
      
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    }
    
    setTokens(tokenInfos);
    if (tokenInfos.length > 0 && !selectedToken) {
      setSelectedToken(tokenInfos[0].address);
    }
    setIsLoadingTokens(false);
  }, [connectedAddress, publicClient, selectedToken]);

  // Load tokens when wallet connects
  useEffect(() => {
    if (isConnected && connectedAddress && isOpen) {
      loadTokenBalances();
    }
  }, [isConnected, connectedAddress, isOpen, loadTokenBalances]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (!recipient) {
        setRecipients([]);
      }
      setAmount('');
      setMessage('');
      setTxHash(null);
      setSearchQuery('');
      setIsApproving(false);
      setIsSending(false);
    }
  }, [isOpen, recipient]);

  // Get selected token info
  const selectedTokenInfo = useMemo(() => {
    return tokens.find(t => t.address === selectedToken);
  }, [tokens, selectedToken]);

  // Add recipients from preset
  const addRecipientsFromPreset = (preset: BribeUsersFilter) => {
    let users: BribeableUser[] = [];
    switch (preset) {
      case 'top10':
        users = top10Users || [];
        break;
      case 'top50':
        users = top50Users || [];
        break;
      case 'top100':
        users = top100Users || [];
        break;
      case 'top500':
        users = top500Users || [];
        break;
    }
    
    // Only add users with bribe wallets who aren't already in the list
    const newUsers = users.filter(
      u => u.evmBribeWallet && !recipients.some(r => r.id === u.id)
    );
    
    if (newUsers.length === 0) {
      toast.info('No new bribeable users to add');
      return;
    }
    
    setRecipients(prev => [...prev, ...newUsers]);
    toast.success(`Added ${newUsers.length} recipients`);
  };

  // Remove a recipient
  const removeRecipient = (userId: string) => {
    setRecipients(prev => prev.filter(r => r.id !== userId));
  };

  // Clear all recipients
  const clearAllRecipients = () => {
    setRecipients([]);
  };

  // Filter recipients by search
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const query = searchQuery.toLowerCase();
    return recipients.filter(
      r => (r.name || '').toLowerCase().includes(query) || (r.slug || '').toLowerCase().includes(query)
    );
  }, [recipients, searchQuery]);

  // Filter NFT collections by search
  const filteredNftCollections = useMemo(() => {
    if (!nftSearchQuery.trim()) return nftCollections;
    const query = nftSearchQuery.toLowerCase();
    return nftCollections.filter(c => (c.name || '').toLowerCase().includes(query));
  }, [nftCollections, nftSearchQuery]);

  // Valid recipients (with bribe wallets)
  const validRecipients = useMemo(() => {
    return recipients.filter(r => r.evmBribeWallet);
  }, [recipients]);

  // Calculate fee (1%)
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.01;
  const amountPerRecipient = validRecipients.length > 0 ? (amountNum - fee) / validRecipients.length : 0;

  // Set max amount
  const handleSetMax = () => {
    if (selectedTokenInfo) {
      setAmount(selectedTokenInfo.formattedBalance);
    }
  };



  // Send bribe
  const handleSendBribe = async () => {
    if (!selectedTokenInfo || !amount || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isConnected || !connectedAddress || !walletClient || !publicClient) {
      toast.error('Please connect your wallet');
      return;
    }

    const contractAddress = BRIBE_CONTRACT_ADDRESSES['AVAX'];
    if (!contractAddress) {
      toast.error('Bribe contract not available');
      return;
    }

    if (validRecipients.length === 0) {
      toast.error('No valid recipients with bribe wallets');
      return;
    }

    const recipientWallets = validRecipients.map(u => u.evmBribeWallet as Address);

    try {
      const amountInWei = parseUnits(amount, selectedTokenInfo.decimals);
      const tokenAddress = selectedTokenInfo.address as Address;
      const bribeContract = contractAddress as Address;

      // Check balance
      if (amountInWei > selectedTokenInfo.balance) {
        toast.error(`Insufficient ${selectedTokenInfo.symbol} balance`);
        return;
      }

      // Step 1: Check allowance
      setIsApproving(true);
      
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [connectedAddress, bribeContract],
      }) as bigint;

      // Step 2: Approve if needed
      if (currentAllowance < amountInWei) {
        toast.info('Approving token...');
        
        const approveHash = await walletClient.writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [bribeContract, amountInWei],
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success('Token approved!');
      }

      setIsApproving(false);
      setIsSending(true);

      // Step 3: Send bribe
      let bribeTxHash: `0x${string}`;

      if (recipientWallets.length === 1) {
        bribeTxHash = await walletClient.writeContract({
          address: bribeContract,
          abi: BRIBE_CONTRACT_ABI,
          functionName: 'bribeSingle',
          args: [tokenAddress, recipientWallets[0], amountInWei, message || ''],
        });
      } else {
        bribeTxHash = await walletClient.writeContract({
          address: bribeContract,
          abi: BRIBE_CONTRACT_ABI,
          functionName: 'bribeBatch',
          args: [tokenAddress, recipientWallets, amountInWei, message || ''],
        });
      }

      toast.info('Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash: bribeTxHash });
      
      setTxHash(bribeTxHash);

      // Record bribes in backend
      const amountPerRecipientWei = recipientWallets.length === 1 
        ? amountInWei - (amountInWei / 100n)
        : (amountInWei - (amountInWei / 100n)) / BigInt(recipientWallets.length);

      for (const user of validRecipients) {
        try {
          await recordBribeMutation.mutateAsync({
            receiverId: user.id,
            network,
            tokenAddress: selectedTokenInfo.address,
            tokenSymbol: selectedTokenInfo.symbol,
            tokenDecimals: selectedTokenInfo.decimals,
            amount: amountPerRecipientWei.toString(),
            message: message || undefined,
            txHash: bribeTxHash,
            senderWallet: connectedAddress,
            receiverWallet: user.evmBribeWallet!,
          });
        } catch (error) {
          console.error('Failed to record bribe:', error);
        }
      }

      toast.success(`Bribe sent to ${recipientWallets.length} recipient${recipientWallets.length > 1 ? 's' : ''}!`);
      
    } catch (error: any) {
      console.error('Bribe error:', error);
      
      if (error.message?.includes('CannotBribeSelf')) {
        toast.error('You cannot bribe yourself');
      } else if (error.message?.includes('InsufficientBalance')) {
        toast.error('Insufficient token balance');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected');
      } else {
        toast.error(error.message || 'Failed to send bribe');
      }
    } finally {
      setIsApproving(false);
      setIsSending(false);
    }
  };

  const isLoading = isApproving || isSending;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="w-full h-full max-w-full max-h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-[900px] sm:max-h-[95vh] overflow-hidden flex flex-col glass sm:rounded-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-pixel text-primary">
            <Gift className="size-5" />
            {recipient ? 'Send Bribe' : 'Bribe Leaderboard'}
          </DialogTitle>
          <DialogDescription>
            {recipient ? `Send tokens to ${recipient.name}` : 'Send tokens to top performers'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
          {/* Success State */}
          {txHash ? (
            <div className="py-8 text-center space-y-4">
              <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="size-8 text-primary" />
              </div>
              <h3 className="text-lg font-pixel text-primary">Bribe Sent!</h3>
              <p className="text-sm text-muted-foreground">
                Successfully sent to {validRecipients.length} recipient{validRecipients.length > 1 ? 's' : ''}.
              </p>
              <a
                href={getTxExplorerUrl(network, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View Transaction
                <ExternalLink className="size-3.5" />
              </a>
              <div className="pt-4">
                <Button onClick={onClose} className="w-full">Done</Button>
              </div>
            </div>
          ) : (
            <>
            {/* Avalanche-only info */}
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3 mb-3">
              <AlertCircle className="size-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground !mt-0">
                Bribes are currently only available on the <span className="font-medium text-primary">Avalanche</span> network.
              </p>
            </div>

            {/* Connect Wallet */}
            {!isConnected && (
              <div className="flex flex-col items-center gap-3 py-6 rounded-lg bg-primary/5 border border-primary/20">
                <Wallet className="size-10 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Connect Your Wallet</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect to send bribes on Avalanche</p>
                </div>
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => {
                    const ready = mounted;
                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                        })}
                      >
                        <Button onClick={openConnectModal} className="bg-primary hover:bg-primary/90">
                          <Wallet className="size-4 mr-2" />
                          Connect Wallet
                        </Button>
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            )}

            {/* Connected Wallet Status - Compact */}
            {isConnected && connectedAddress && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="size-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                  <span className="text-xs text-primary font-medium">
                    {isLoadingTokens ? '...' : `${parseFloat(nativeBalance).toFixed(2)} AVAX`}
                  </span>
                  <span className="size-1.5 rounded-full bg-green-500" title="Connected" />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={loadTokenBalances}
                    disabled={isLoadingTokens}
                    className="size-6 text-muted-foreground hover:text-primary"
                    title="Refresh"
                  >
                    <RefreshCw className={cn("size-3", isLoadingTokens && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnect()}
                    className="size-6 text-muted-foreground hover:text-destructive"
                    title="Disconnect"
                  >
                    <LogOut className="size-3" />
                  </Button>
                </div>
              </div>
            )}

            {isConnected && (
              <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-3">
                {/* Recipients Section */}
                {!recipient && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="size-4" />
                        Recipients ({validRecipients.length})
                      </Label>
                      {recipients.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllRecipients}
                          className="text-destructive hover:text-destructive h-7 px-2"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {RECIPIENT_OPTIONS.map(option => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => addRecipientsFromPreset(option.value)}
                          className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Plus className="size-3 mr-1" />
                          {option.label}
                        </Button>
                      ))}
                      {nftCollections.length > 0 && (
                        <Select value={selectedNftFilter} onValueChange={(value) => {
                          setSelectedNftFilter(value);
                          setNftSearchQuery('');
                        }}>
                          <SelectTrigger className="h-7 min-w-[90px] text-xs border border-primary/30 text-primary hover:bg-primary/10 rounded-md px-2 bg-transparent">
                            <SelectValue placeholder="NFT Collection" />
                          </SelectTrigger>
                          <SelectContent 
                            align="start" 
                            className="max-h-[350px] overflow-hidden !bg-[#0a0a0f] !border !border-border/40 !rounded-md"
                          >
                            {/* Search Input - Fixed at top */}
                            <div className="sticky top-0 z-10 p-2 border-b border-border/40 -mx-1 -mt-1 bg-[#0a0a0f]">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                                <input
                                  type="text"
                                  placeholder="Search collections..."
                                  value={nftSearchQuery}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNftSearchQuery(e.target.value)}
                                  className="h-8 w-full pl-8 pr-3 text-sm rounded-md border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 bg-[#0a0a0f]"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto bg-[#0a0a0f]">
                              <SelectItem value="all">All Collections ({nftCollections.length})</SelectItem>
                              {filteredNftCollections.length === 0 && nftSearchQuery && (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  No collections found
                                </div>
                              )}
                              {filteredNftCollections
                                .filter((c) => {
                                  const address = c.contract_address || c.collection_mint;
                                  return address && address.trim() !== '';
                                })
                                .map(c => {
                                  const itemValue = c.contract_address || c.collection_mint || c.name;
                                  const logo = c.collection_logo || c.collection_image;
                                  return (
                                    <SelectItem
                                      key={itemValue}
                                      value={itemValue}
                                    >
                                      <div className="flex items-center gap-2">
                                        {logo && (
                                          <img 
                                            src={logo} 
                                            alt={c.name} 
                                            className="size-4 rounded-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        )}
                                        <span className="truncate max-w-[120px]">{c.name}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                            </div>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Search */}
                    {recipients.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search recipients..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-9 h-8 text-sm"
                        />
                      </div>
                    )}

                    {/* Recipients List */}
                    {recipients.length > 0 ? (
                      <div className="flex-1 min-h-[180px] max-h-[280px] overflow-y-auto scrollbar-hide rounded-xl border border-primary/20 bg-muted/20">
                        <div className="p-2 grid grid-cols-2 gap-1">
                          {filteredRecipients.map((user, index) => (
                            <div
                              key={user.id}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
                                user.evmBribeWallet 
                                  ? 'bg-background/50 hover:bg-background/80' 
                                  : 'bg-destructive/10 hover:bg-destructive/15'
                              )}
                            >
                              <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
                              <ProfileAvatar
                                src={getUserPhotoUrl(user.photo)}
                                alt={user.name}
                                name={user.name}
                                size="xs"
                                className="size-5 flex-shrink-0"
                              />
                              <span className="text-xs font-medium truncate flex-1">{user.name}</span>
                              {!user.evmBribeWallet && (
                                <span className="text-[9px] text-destructive">No wallet</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 hover:bg-destructive/20 hover:text-destructive opacity-50 hover:opacity-100 flex-shrink-0"
                                onClick={() => removeRecipient(user.id)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-8 rounded-xl border border-dashed border-primary/20 bg-muted/10">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="size-6 text-primary/50" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No recipients added yet</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Use the buttons above to add recipients</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Single Recipient Display */}
                {recipient && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <ProfileAvatar
                      src={getUserPhotoUrl(recipient.photo)}
                      alt={recipient.name}
                      name={recipient.name}
                      size="sm"
                      className="size-10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rank #{recipient.rank} • {recipient.guudScore.toLocaleString()} pts
                      </p>
                    </div>
                    {!recipient.evmBribeWallet && (
                      <Badge variant="destructive" className="text-xs">No Wallet</Badge>
                    )}
                  </div>
                )}

                {/* Token Selection - Compact */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="h-10 px-3 bg-primary/5 border-primary/20 hover:border-primary/40">
                      {selectedTokenInfo ? (
                        <div className="flex items-center gap-2 w-full">
                          {selectedTokenInfo.logo ? (
                            <img 
                              src={selectedTokenInfo.logo} 
                              alt={selectedTokenInfo.symbol} 
                              className="size-5 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {selectedTokenInfo.symbol?.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-sm">{selectedTokenInfo.symbol}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.floor(parseFloat(selectedTokenInfo.formattedBalance)).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder={isLoadingTokens ? 'Loading...' : 'Select token'} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map(token => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2 w-full">
                            {token.logo ? (
                              <img 
                                src={token.logo} 
                                alt={token.symbol} 
                                className="size-5 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                {token.symbol?.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-muted-foreground text-xs ml-auto">
                              {Math.floor(parseFloat(token.formattedBalance)).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Amount</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={handleSetMax}
                    >
                      MAX
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={e => {
                        // Remove non-numeric characters except decimal
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setAmount(value);
                      }}
                      className="pr-20 h-14 text-xl font-semibold bg-primary/5 border-primary/20 focus:border-primary/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {selectedTokenInfo?.symbol || 'TOKEN'}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Message (optional)</Label>
                  <Textarea
                    placeholder="Thanks for the alpha!"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="resize-none bg-primary/5 border-primary/20 focus:border-primary/50"
                  />
                </div>

                {/* Summary */}
                {amountNum > 0 && validRecipients.length > 0 && (
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-3">
                    <h4 className="text-sm font-pixel text-primary flex items-center gap-2">
                      <Gift className="size-4" />
                      Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Recipients</span>
                        <span className="font-medium">{validRecipients.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Per recipient</span>
                        <span className="font-medium">{Math.floor(amountPerRecipient).toLocaleString()} {selectedTokenInfo?.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fee (1%)</span>
                        <span className="font-medium">{Math.floor(fee).toLocaleString()} {selectedTokenInfo?.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg text-primary">
                          {Math.floor(amountNum).toLocaleString()} {selectedTokenInfo?.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>

        {/* Footer stays fixed at bottom */}
        {!txHash && (
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-primary/20 gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-6 h-11 rounded-xl border-border/50 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendBribe} 
              disabled={isLoading || amountNum <= 0 || !isConnected || validRecipients.length === 0}
              className="px-6 h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25"
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isApproving ? 'Approving...' : isSending ? 'Sending...' : `Send to ${validRecipients.length} recipient${validRecipients.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
