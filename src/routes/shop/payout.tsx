import { useEffect, useState } from 'react';

import { Link, createFileRoute } from '@tanstack/react-router';

import Icons from '@/components/icons';
import TiltedCard from '@/components/tilted-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth-context';
import { useCreateOrder } from '@/hooks';
import type { PaymentMethod } from '@/types';

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

export const Route = createFileRoute('/shop/payout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
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
  const createOrder = useCreateOrder();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center justify-center py-12">
        <div className="glass flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-md p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Icons.lock className="text-muted size-12" />
            <div className="space-y-2">
              <h3 className="font-pixel text-lg">Authentication Required</h3>
              <p className="text-muted max-w-md text-sm">
                Please sign in to complete your order.
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

  // Load card data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('cardData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setCardData(parsedData);
      } catch (error) {
        console.error('Failed to parse card data:', error);
      }
    }
  }, []);

  const handlePayment = async (paymentMethod: PaymentMethod) => {
    setIsProcessing(true);
    try {
      // Create order with the card
      const order = await createOrder.mutateAsync({
        guudCardId: cardData.cardId,
        shippingAddress: {
          fullName: 'John Doe', // TODO: Get from user input
          addressLine1: '123 Main St',
          addressLine2: '',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phoneNumber: '+1234567890',
        },
      });

      // Store order data for mint and order-status pages
      const orderData = { orderId: order.id, paymentMethod };
      sessionStorage.setItem('orderData', JSON.stringify(orderData));

      // Navigate to mint page
      window.location.href = '/shop/mint';
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = () => handlePayment('stripe');
  const handleWalletPayment = () => handlePayment('wallet');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - Card Preview */}
        <div className="flex items-center justify-center">
          <TiltedCard
            imageSrc={cardData.isPremium ? '/card2.png' : '/card1.png'}
            altText="Card Preview"
            containerHeight="500px"
            containerWidth="100%"
            imageHeight="500px"
            imageWidth="350px"
            scaleOnHover={1.05}
            rotateAmplitude={12}
            showMobileWarning={false}
            showTooltip={false}
          />
        </div>

        {/* Right Column - Payment Details */}
        <div className="flex flex-col gap-6">
          <div>
            <h4 className="font-pixel text-2xl">PAYOUT</h4>
          </div>

          {/* Badge and Price */}
          <div className="flex items-center gap-4">
            <Badge variant={cardData.isPremium ? 'legendary' : 'default'}>
              {cardData.isPremium ? 'PREMIUM' : 'REGULAR'}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-pixel text-4xl">
              ${cardData.price.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-muted font-pixel text-sm">PFP</div>
              <div className="text-sm font-semibold">
                {cardData.nftId ? 'Own NFT' : 'Upload Photo'}
              </div>
            </div>
            <div>
              <div className="text-muted font-pixel text-sm">
                COLLECTION NAME
              </div>
              <div className="text-sm font-semibold">
                {cardData.collectionName}
              </div>
            </div>
            <div>
              <div className="text-muted font-pixel text-sm">NAME</div>
              <div className="text-sm font-semibold">{cardData.name}</div>
            </div>
            <div>
              <div className="text-muted font-pixel text-sm">TITLE</div>
              <div className="text-sm font-semibold">{cardData.title}</div>
            </div>
            <div>
              <div className="text-muted font-pixel text-sm">AFFILIATION</div>
              <div className="text-sm font-semibold">
                {cardData.affiliation}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="font-pixel mb-4 text-sm">PAYMENT OPTION</h5>

            <div className="flex items-center gap-4">
              {/* Stripe Button */}
              <Button
                onClick={handleStripePayment}
                disabled={isProcessing}
                className="h-14 flex-1"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Pay with Stripe'}
              </Button>

              {/* OR Divider */}
              <div className="flex items-center gap-2">
                <div className="border-muted h-px w-6 border-t"></div>
                <span className="text-muted text-xs font-medium whitespace-nowrap">
                  OR
                </span>
                <div className="border-muted h-px w-6 border-t"></div>
              </div>

              {/* Wallet Button */}
              <Button
                onClick={handleWalletPayment}
                disabled={isProcessing}
                variant="outline"
                className="h-14 flex-1"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Pay with Wallet'}
              </Button>
            </div>
          </div>

          <Link
            to="/shop/customization"
            className="text-muted hover:text-foreground mt-2 text-center text-sm transition-colors"
          >
            ← Back to Customization
          </Link>
        </div>
      </div>
    </div>
  );
}
