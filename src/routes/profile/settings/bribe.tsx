/**
 * Bribe Settings Page
 * Allows users to configure their bribe receiving wallets
 */

import { Gift, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useMemo } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { SettingsHeading } from '@/components/settings-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useWalletList } from '@/hooks';
import {
    useBribeWalletSettings,
    useRemoveBribeWallet,
    useSetBribeWallet,
} from '@/hooks/use-bribe';
import { walletAddressShortener } from '@/lib/utils';

export const Route = createFileRoute('/profile/settings/bribe')({
  component: RouteComponent,
});

function RouteComponent() {
  // Get all linked wallets
  const allWallets = useWalletList();
  
  // Split wallets by type and dedupe
  const evmWallets = useMemo(() => {
    const wallets = allWallets.filter(w => w.walletAddress.startsWith('0x'));
    // Remove duplicates by wallet address
    const unique = wallets.filter((w, i, arr) => 
      arr.findIndex(x => x.walletAddress.toLowerCase() === w.walletAddress.toLowerCase()) === i
    );
    return unique;
  }, [allWallets]);
  
  const solWallets = useMemo(() => {
    const wallets = allWallets.filter(w => !w.walletAddress.startsWith('0x'));
    // Remove duplicates by wallet address
    const unique = wallets.filter((w, i, arr) => 
      arr.findIndex(x => x.walletAddress === w.walletAddress) === i
    );
    return unique;
  }, [allWallets]);
  
  // Bribe settings hooks
  const { data: bribeSettings, isLoading: isLoadingSettings } = useBribeWalletSettings();
  const setWalletMutation = useSetBribeWallet();
  const removeWalletMutation = useRemoveBribeWallet();

  const handleSetEvmWallet = async (walletAddress: string) => {
    try {
      await setWalletMutation.mutateAsync({
        walletAddress,
        walletType: 'EVM',
      });
      toast.success('EVM bribe wallet set successfully');
    } catch (error) {
      toast.error('Failed to set EVM bribe wallet');
    }
  };

  const handleSetSolWallet = async (walletAddress: string) => {
    try {
      await setWalletMutation.mutateAsync({
        walletAddress,
        walletType: 'SOL',
      });
      toast.success('Solana bribe wallet set successfully');
    } catch (error) {
      toast.error('Failed to set Solana bribe wallet');
    }
  };

  const handleRemoveEvmWallet = async () => {
    try {
      await removeWalletMutation.mutateAsync('EVM');
      toast.success('EVM bribe wallet removed');
    } catch (error) {
      toast.error('Failed to remove EVM bribe wallet');
    }
  };

  const handleRemoveSolWallet = async () => {
    try {
      await removeWalletMutation.mutateAsync('SOL');
      toast.success('Solana bribe wallet removed');
    } catch (error) {
      toast.error('Failed to remove Solana bribe wallet');
    }
  };

  const isLoading = isLoadingSettings || setWalletMutation.isPending || removeWalletMutation.isPending;

  return (
    <div className="space-y-6">
      <SettingsHeading
        title="Bribe Settings"
        description="Configure your wallet addresses to receive bribes from other users"
      />

      <div className="glass border border-primary/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-primary">Important:</strong> Selected bribe wallets will be <strong className="text-primary">publicly visible</strong> even if your profile is set to private.
        </p>
        {bribeSettings?.isAutoSelected && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="text-yellow-500">ℹ️</span> Your wallets were automatically selected because your profile is public. You can change them below.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* EVM Wallet Section */}
        <div className="glass rounded-lg">
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-pixel flex items-center gap-2 text-primary">
                  <Wallet className="size-5" />
                  EVM Networks
                </h3>
                <p className="text-sm text-muted-foreground">
                  AVAX, BASE, ARBITRUM, MONAD
                </p>
              </div>
              {bribeSettings?.evmBribeEnabled && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Enabled
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 space-y-4">
            {evmWallets.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Wallet className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No EVM wallets connected</p>
                <p className="text-xs mt-1">Connect a wallet first to enable bribes</p>
              </div>
            ) : (
              <RadioGroup
                value={bribeSettings?.evmBribeWallet || ''}
                onValueChange={handleSetEvmWallet}
                disabled={isLoading}
              >
                {evmWallets.map((wallet) => (
                  <div
                    key={wallet.walletAddress}
                    className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                      bribeSettings?.evmBribeWallet === wallet.walletAddress
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30'
                    }`}
                  >
                    <RadioGroupItem
                      value={wallet.walletAddress}
                      id={wallet.walletAddress}
                      className="border-primary/50 text-primary"
                    />
                    <Label
                      htmlFor={wallet.walletAddress}
                      className="flex-1 cursor-pointer font-mono text-sm text-foreground"
                    >
                      {walletAddressShortener(wallet.walletAddress)}
                    </Label>
                    {bribeSettings?.evmBribeWallet === wallet.walletAddress && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}

            {bribeSettings?.evmBribeEnabled && (
              <>
                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveEvmWallet}
                    disabled={isLoading}
                    className="w-full text-white hover:text-white border-primary/30 hover:bg-primary/10"
                  >
                    {removeWalletMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Disable EVM Bribes
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Solana Wallet Section */}
        <div className="glass rounded-lg">
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-pixel flex items-center gap-2 text-primary">
                  <Wallet className="size-5" />
                  Solana Network
                </h3>
                <p className="text-sm text-muted-foreground">
                  SOL, USDC, and other SPL tokens
                </p>
              </div>
              {bribeSettings?.solBribeEnabled && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Enabled
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 space-y-4">
            {solWallets.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Wallet className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No Solana wallets connected</p>
                <p className="text-xs mt-1">Connect a wallet first to enable bribes</p>
              </div>
            ) : (
              <RadioGroup
                value={bribeSettings?.solBribeWallet || ''}
                onValueChange={handleSetSolWallet}
                disabled={isLoading}
              >
                {solWallets.map((wallet) => (
                  <div
                    key={wallet.walletAddress}
                    className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                      bribeSettings?.solBribeWallet === wallet.walletAddress
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30'
                    }`}
                  >
                    <RadioGroupItem
                      value={wallet.walletAddress}
                      id={wallet.walletAddress}
                      className="border-primary/50 text-primary"
                    />
                    <Label
                      htmlFor={wallet.walletAddress}
                      className="flex-1 cursor-pointer font-mono text-sm text-foreground"
                    >
                      {walletAddressShortener(wallet.walletAddress)}
                    </Label>
                    {bribeSettings?.solBribeWallet === wallet.walletAddress && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}

            {bribeSettings?.solBribeEnabled && (
              <>
                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveSolWallet}
                    disabled={isLoading}
                    className="w-full text-white hover:text-white border-primary/30 hover:bg-primary/10"
                  >
                    {removeWalletMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Disable Solana Bribes
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass rounded-lg p-6">
        <h4 className="font-pixel mb-4 flex items-center gap-2 text-primary">
          <Gift className="size-5" />
          How Bribes Work
        </h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">•</span>
            <span>Enable bribe receiving by selecting a wallet for each network type</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">•</span>
            <span>Other users can send you tokens directly through the leaderboard</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">•</span>
            <span>A 1% fee is deducted from each bribe transaction</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">•</span>
            <span>Your bribe wallet address will be visible to all users</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
