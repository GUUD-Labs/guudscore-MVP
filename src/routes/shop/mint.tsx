import { useEffect, useState } from 'react';

import { Link, createFileRoute } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth-context';
import { useMintCard, useSignTransaction } from '@/hooks';

interface CardData {
  cardId: string;
  isPremium: boolean;
  price: number;
  collectionName: string;
  collectionNumber: string;
  name: string;
  title: string;
  affiliation: string;
  nftId?: string;
  cardPhotoId?: string;
}

interface OrderData {
  orderId: string;
  paymentMethod: string;
}

export const Route = createFileRoute('/shop/mint')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuthContext();
  const [isMinting, setIsMinting] = useState(false);
  const [cardData, setCardData] = useState<CardData>({
    cardId: '',
    isPremium: true,
    price: 99.99,
    collectionName: '',
    collectionNumber: '',
    name: '',
    title: '',
    affiliation: '',
  });
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const mintCard = useMintCard();
  const signTransaction = useSignTransaction();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center justify-center py-12">
        <div className="glass flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-md p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Icons.lock className="text-muted size-12" />
            <div className="space-y-2">
              <h3 className="font-pixel text-lg">Authentication Required</h3>
              <p className="text-muted max-w-md text-sm">
                Please sign in to mint your card.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Load card and order data from sessionStorage
  useEffect(() => {
    const storedCardData = sessionStorage.getItem('cardData');
    const storedOrderData = sessionStorage.getItem('orderData');

    if (storedCardData) {
      try {
        const parsedCardData = JSON.parse(storedCardData);
        setCardData(parsedCardData);
      } catch (error) {
        console.error('Failed to parse card data:', error);
      }
    }

    if (storedOrderData) {
      try {
        const parsedOrderData = JSON.parse(storedOrderData);
        setOrderData(parsedOrderData);
      } catch (error) {
        console.error('Failed to parse order data:', error);
      }
    }
  }, []);

  const handleMint = async () => {
    if (!cardData.cardId) {
      alert('Card ID not found. Please go back and create your card again.');
      return;
    }

    setIsMinting(true);
    try {
      // Call mint API to get methodData
      const methodData = await mintCard.mutateAsync(cardData.cardId);

      // Sign the transaction
      const result = await signTransaction.mutateAsync({
        methodData,
        privateKey: '0x...', // TODO: Get from wallet
      });

      console.log('Card minted successfully!', result.transactionHash);
      alert('Card minted successfully!');

      // Clear session storage
      sessionStorage.removeItem('cardData');
      sessionStorage.removeItem('orderData');
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleShareToX = () => {
    const tweetText = `Just minted my ${cardData.isPremium ? 'PREMIUM' : 'REGULAR'} GuudCard! 🎉`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto flex min-h-[600px] max-w-2xl flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full flex-col items-center gap-8">
        {/* Title */}
        <div>
          <h4 className="font-pixel text-center text-4xl">CONGRATULATIONS</h4>
        </div>

        {/* Card Image */}
        <div className="w-full max-w-md">
          <img
            src={cardData.isPremium ? '/card2.png' : '/card1.png'}
            alt="Your GuudCard"
            className="h-auto w-full object-contain"
          />
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={isMinting}
          className="h-14 w-full max-w-md"
          size="lg"
        >
          {isMinting ? 'Minting...' : 'Mint Card'}
        </Button>

        {/* Share to X Button */}
        <Button
          onClick={handleShareToX}
          variant="outline"
          className="h-14 w-full max-w-md"
          size="lg"
        >
          <Icons.xLogo className="mr-2 size-4" />
          Share to X
        </Button>

        {/* Order Status Link */}
        {orderData?.orderId && (
          <Link
            to="/shop/order-status"
            search={{ orderId: orderData.orderId }}
            className="text-muted hover:text-foreground mt-2 text-center text-sm transition-colors"
          >
            View Order Status →
          </Link>
        )}
      </div>
    </div>
  );
}
