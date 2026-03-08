import { NFTCollectionAvatar } from '@/components/nft-collection-avatar';
import { TokenAvatar } from '@/components/token-avatar';

interface TreemapItem {
  name: string;
  symbol?: string;
  value: number;
  logo?: string | null;
  tokenAddress?: string;
  contractAddress?: string;
  network?: string;
}

interface TreemapCardProps {
  items: TreemapItem[];
  type?: 'token' | 'protocol' | 'nft';
}

export const TreemapCard = ({ items, type = 'token' }: TreemapCardProps) => {
  // Sort items by value descending
  const sortedItems = [...items].sort((a, b) => b.value - a.value).slice(0, 6);
  
  // Calculate total for percentage
  const total = sortedItems.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate sizes for treemap layout with proportional sizing
  const itemsWithSize = sortedItems.map((item, index) => {
    const percentage = (item.value / total) * 100;
    return {
      ...item,
      percentage,
      rank: index + 1,
    };
  });

  const renderAvatar = (item: typeof itemsWithSize[0]) => {
    if (type === 'nft') {
      return (
        <NFTCollectionAvatar
          name={item.name}
          contractAddress={item.contractAddress || ''}
          logo={item.logo}
          network={item.network || 'avalanche'}
          size="lg"
        />
      );
    }

    if (type === 'protocol' && item.logo) {
      return (
        <img
          src={item.logo}
          alt={item.name}
          className="size-12 rounded-md object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    return (
      <TokenAvatar
        symbol={item.symbol || item.name}
        name={item.name}
        src={item.logo}
        address={item.tokenAddress}
        network={item.network}
        size="lg"
      />
    );
  };

  if (itemsWithSize.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[400px]">
      <div 
        className="grid gap-1 h-full"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: '1.3fr 1.3fr 0.6fr',
        }}
      >
        {/* Item 1 - Largest (left side, 2 rows only) */}
        {itemsWithSize[0] && (
          <div 
            className="glass rounded-lg flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-background/80 transition-colors p-2 sm:p-4"
            style={{ gridRow: '1 / 3' }}
          >
            {renderAvatar(itemsWithSize[0])}
            <div className="text-center">
              <h6 className="font-pixel text-sm sm:text-base truncate">
                {itemsWithSize[0].symbol || itemsWithSize[0].name}
              </h6>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-pixel mt-0.5 sm:mt-1">
                #{itemsWithSize[0].rank}
              </p>
            </div>
          </div>
        )}

        {/* Item 2 - Second largest (right top) */}
        {itemsWithSize[1] && (
          <div 
            className="glass rounded-lg flex flex-row items-center justify-start gap-2 sm:gap-3 hover:bg-background/80 transition-colors p-2 sm:p-3"
          >
            {renderAvatar(itemsWithSize[1])}
            <div className="text-left flex-1 min-w-0">
              <h6 className="font-pixel text-xs sm:text-sm truncate">
                {itemsWithSize[1].symbol || itemsWithSize[1].name}
              </h6>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-pixel mt-0.5">
                #{itemsWithSize[1].rank}
              </p>
            </div>
          </div>
        )}

        {/* Item 3 - Third (right middle) */}
        {itemsWithSize[2] && (
          <div 
            className="glass rounded-lg flex flex-row items-center justify-start gap-2 sm:gap-3 hover:bg-background/80 transition-colors p-2 sm:p-3"
          >
            {renderAvatar(itemsWithSize[2])}
            <div className="text-left flex-1 min-w-0">
              <h6 className="font-pixel text-xs sm:text-sm truncate">
                {itemsWithSize[2].symbol || itemsWithSize[2].name}
              </h6>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-pixel mt-0.5">
                #{itemsWithSize[2].rank}
              </p>
            </div>
          </div>
        )}

        {/* Items 4, 5, 6 - Bottom row (equal size) */}
        <div 
          className="grid grid-cols-3 gap-1"
          style={{ gridColumn: '1 / 3' }}
        >
          {itemsWithSize.slice(3, 6).map((item) => (
            <div 
              key={item.symbol || item.name || item.contractAddress}
              className="glass rounded-lg flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 hover:bg-background/80 transition-colors p-1.5 sm:p-2"
            >
              {renderAvatar(item)}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h6 className="font-pixel text-[10px] sm:text-xs truncate">
                  {item.symbol || item.name}
                </h6>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-pixel mt-0.5">
                  #{item.rank}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
