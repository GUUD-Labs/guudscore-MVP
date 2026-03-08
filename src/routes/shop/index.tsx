import { Link, createFileRoute } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useAuthContext } from '@/contexts/auth-context';
import { useGuudCardList } from '@/hooks';
import { cn } from '@/lib/utils';
import { CardType } from '@/types';

export const Route = createFileRoute('/shop/')({
  component: RouteComponent,
});

const FALLBACK_CARDS = [
  {
    id: '1',
    name: 'Regular Card',
    image: '/card1.png',
    description: 'Standard GuudCard with basic features',
    cardType: CardType.REGULAR,
    isPremium: false,
  },
  {
    id: '2',
    name: 'Premium Card',
    image: '/card2.png',
    description: 'Premium GuudCard with enhanced features',
    cardType: CardType.PREMIUM,
    isPremium: true,
  },
];

function RouteComponent() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Empty className="border-muted/20 mx-auto max-w-md border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icons.lock />
            </EmptyMedia>
            <EmptyTitle>Authentication Required</EmptyTitle>
            <EmptyDescription>
              You need to be logged in to access the shop and customize your
              cards.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="font-pixel w-full" asChild>
            <Link to="/login" className="w-full">
              <Icons.login className="mr-2 size-4" />
              Sign In to Access Shop
            </Link>
          </Button>
        </Empty>
      </div>
    );
  }

  // Fetch card list from API
  const {
    data: cardsData,
    isLoading,
    error,
  } = useGuudCardList({
    page: 1,
    limit: 10,
  });

  // Use API data if available, otherwise use fallback
  const cards = cardsData?.cards?.length ? cardsData.cards : FALLBACK_CARDS;

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center justify-center py-12">
        <p className="font-pixel text-xl">Loading cards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center justify-center py-12">
        <p className="text-destructive font-pixel text-xl">
          Failed to load cards
        </p>
        <p className="text-muted mt-2 text-sm">Using fallback cards</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6">
      <div className="grid w-full grid-cols-2 gap-6">
        {cards.map(card => {
          const isPremium = card.cardType === CardType.PREMIUM;
          const cardImage = isPremium ? '/card2.png' : '/card1.png';
          const cardFeatures = isPremium
            ? [
                'Premium Design',
                'Enhanced Stats',
                'Special Effects',
                'Rarity Boost',
              ]
            : [
                'Standard Design',
                'Basic Stats',
                'Classic Look',
                'Common Rarity',
              ];

          return (
            <div key={card.id} className="flex w-full flex-col gap-6">
              <img
                src={cardImage}
                alt={card.name}
                className="h-96 w-full object-contain"
              />
              <h4
                className={cn(
                  'text-center',
                  isPremium &&
                    'text-tertiary text-shadow-[0_0_10px_var(--tertiary)]/30'
                )}
              >
                {card.cardType}
              </h4>
              <ul className="m-0 list-inside list-none p-0">
                {cardFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className={cn(
                      'm-0 px-4 py-5',
                      index % 2 !== 0 && 'bg-secondary'
                    )}
                  >
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/shop/customization">
                <Button
                  variant={isPremium ? 'premium' : 'default'}
                  className="w-full"
                >
                  {isPremium ? 'Customize Premium' : 'Customize Regular'}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
