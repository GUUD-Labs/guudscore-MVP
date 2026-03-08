import { Link } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { cn } from '@/lib/utils';

export const DashboardPages = () => {
  const pages = [
    { name: 'My Dashboard', href: '/dashboard/my-dashboard' },
    { name: 'Assets', href: '/dashboard/assets' },
    { name: 'NFTs', href: '/dashboard/nfts' },
    { name: 'Score', href: '/dashboard/score' },
    { name: 'Vouch', href: '/dashboard/vouch' },
    { name: 'Guud Friends', href: '/dashboard/guud-friends' },
    { name: 'Guud Card', href: '/dashboard/guud-card' },
    { name: 'Referral Stats', href: '/dashboard/referral-stats' },
    { name: 'Arena Yapping', href: '/dashboard/arena-yapping' },
    { name: 'Guud XP', href: '/dashboard/guud-xp', isSoon: true },
  ];

  return (
    <div className="mb-6 sm:mb-8 w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-3 sm:gap-4 lg:gap-8 min-w-max sm:min-w-0">
        {pages.map(page => (
          <Link
            key={page.name}
            to={page.href}
            disabled={page.isSoon}
            className={cn(
              'font-pixel !text-foreground [&.active]:!text-primary flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-xl whitespace-nowrap [&:not(.active)>svg]:hidden transition-colors',
              page.isSoon && '!text-muted cursor-not-allowed'
            )}
          >
            <Icons.chevronRight className="inline-block size-2.5 sm:size-3 flex-shrink-0" />
            <span className="truncate">{page.name}</span>
            {page.isSoon && (
              <span className="bg-muted text-foreground/40 rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs flex-shrink-0">
                Soon
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};
