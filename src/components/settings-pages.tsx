import { Link } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { cn } from '@/lib/utils';

export const SettingsPages = () => {
  const pages = [
    { name: 'Basic', href: '/profile/settings/basic' },
    {
      name: 'Social',
      href: '/profile/settings/social',
    },
    {
      name: 'NFTs',
      href: '/profile/settings/nfts',
    },
    {
      name: 'Bribe',
      href: '/profile/settings/bribe',
    },
    {
      name: 'Arena',
      href: '/profile/settings/arena',
    },
    {
      name: 'Appearance',
      href: '/profile/settings/appearance',
    },
    {
      name: 'Style',
      href: '/profile/settings/style',
    },
  ];

  return (
    <div className="flex w-full gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-2 -mb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      {pages.map(page => (
        <Link
          key={page.name}
          to={page.href}
          className={cn(
            'font-pixel !text-foreground [&.active]:!text-primary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap flex-shrink-0 [&:not(.active)>svg]:hidden'
          )}
        >
          <Icons.chevronRight className="inline-block size-3" />
          {page.name}
        </Link>
      ))}
    </div>
  );
};
