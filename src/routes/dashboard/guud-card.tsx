import { createFileRoute } from '@tanstack/react-router';

import { ErrorMessage } from '@/components/error-message';
import { useGuudCardList } from '@/hooks';

export const Route = createFileRoute('/dashboard/guud-card')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    data: cardList,
    isLoading,
    error,
  } = useGuudCardList({ page: 1, limit: 10 });

  const cards = cardList?.cards || [];

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-5">
        <h4 className="text-muted text-sm">Loading guudCard...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        header="Error loading guudCard"
        error={error.message || 'Unknown error'}
      />
    );
  }

  if (cards.length === 0) {
    return <div>No cards available.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h4 className="text-base sm:text-lg">
        Guud<span>card</span>
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <div key={card.id}>
            {card.cardType === 'SPECIAL_EDITION' ? (
              <div className="glass relative rounded-md bg-[linear-gradient(-45deg,var(--primary),var(--tertiary),var(--quaternary),var(--accent),var(--primary))] p-3 sm:p-4 shadow-[0_0_20px_oklch(0.6215_0.2159_286.79_/_50%)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-12 sm:size-14 md:size-16 overflow-hidden rounded-md">
                    <img
                      src={card.photo.url}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h6 className="font-pixel text-background text-sm sm:text-base">{card.name}</h6>
                    <span className="text-muted text-xs sm:text-sm">{card.title}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass relative rounded-md p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-12 sm:size-14 md:size-16 overflow-hidden rounded-md">
                    <img
                      src={card.photo.url}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h6 className="font-pixel">{card.name}</h6>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
