/**
 * Bribe Button Component
 * Reusable button for sending bribes to users
 */

import { Gift } from 'lucide-react';

import { useState } from 'react';

import { BribeModal } from '@/components/bribe-modal';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useChain } from '@/contexts/chain-context';
import { cn } from '@/lib/utils';
import type { BribeableUser, BribeNetwork } from '@/types/bribe';

interface BribeButtonProps {
  /** User to send bribe to */
  user: {
    id: string;
    name: string;
    slug: string;
    photo?: string | null;
    rank?: number;
    guudScore?: number;
    evmBribeWallet?: string | null;
    solBribeWallet?: string | null;
  };
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional class names */
  className?: string;
  /** Show label text */
  showLabel?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Always show even without bribe wallet */
  alwaysShow?: boolean;
}

export function BribeButton({
  user,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
  disabled = false,
  alwaysShow = false,
}: BribeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedNetwork } = useChain();
  const network = selectedNetwork as BribeNetwork;

  // Check if user has bribe wallet for current network
  const hasBribeWallet = network === 'SOLANA' 
    ? !!user.solBribeWallet 
    : !!user.evmBribeWallet;

  // Convert user to BribeableUser format
  const recipient: BribeableUser = {
    id: user.id,
    name: user.name,
    slug: user.slug,
    photo: user.photo || null,
    rank: user.rank || 0,
    guudScore: user.guudScore || 0,
    evmBribeWallet: user.evmBribeWallet || null,
    solBribeWallet: user.solBribeWallet || null,
    bribeWallet: network === 'SOLANA' ? user.solBribeWallet || null : user.evmBribeWallet || null,
  };

  // If user doesn't have bribe wallet and alwaysShow is false, don't render
  if (!hasBribeWallet && !alwaysShow) {
    return null;
  }

  const handleClick = () => {
    // Allow opening modal even without bribe wallet if alwaysShow is true
    // User can still see the modal and be informed about bribe requirements
    if (!disabled && (hasBribeWallet || alwaysShow)) {
      setIsModalOpen(true);
    }
  };

  const buttonContent = (
    <>
      <Gift className={cn('size-4', showLabel && 'mr-1.5')} />
      {showLabel && 'Bribe'}
    </>
  );

  const tooltipText = hasBribeWallet
    ? `Send tokens to ${user.name}`
    : `${user.name} has not enabled bribes yet`;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn(
                hasBribeWallet
                  ? 'text-primary hover:text-primary hover:bg-primary/10 border-primary/30'
                  : alwaysShow
                    ? 'text-muted-foreground hover:text-muted-foreground/80 border-muted-foreground/30'
                    : 'text-muted-foreground hover:text-muted-foreground opacity-50 cursor-not-allowed',
                className
              )}
              onClick={handleClick}
              disabled={disabled || (!hasBribeWallet && !alwaysShow)}
            >
              {buttonContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <BribeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipient={recipient}
      />
    </>
  );
}
