import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Link } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pages = [
    { 
      name: 'My Dashboard', 
      href: '/dashboard/my-dashboard',
      icon: Icons.layoutDashboard
    },
    { 
      name: 'Assets', 
      href: '/dashboard/assets',
      icon: Icons.wallet
    },
    { 
      name: 'NFTs', 
      href: '/dashboard/nfts',
      icon: Icons.image
    },
    { 
      name: 'Score', 
      href: '/dashboard/score',
      icon: Icons.barChart3
    },
    { 
      name: 'Vouch', 
      href: '/dashboard/vouch',
      icon: Icons.heart
    },
    { 
      name: 'Bribe', 
      href: '/dashboard/bribe',
      icon: Icons.gift
    },
    { 
      name: 'Guud Friends', 
      href: '/dashboard/guud-friends',
      icon: Icons.users
    },
    { 
      name: 'Guud Card', 
      href: '/dashboard/guud-card',
      icon: Icons.creditCard
    },
    {
      name: 'Referral Stats',
      href: '/dashboard/referral-stats',
      icon: Icons.share2
    },
    {
      name: 'Arena Yapping',
      href: '/dashboard/arena-yapping',
      icon: Icons.arena
    },
    {
      name: 'Guud XP',
      href: '/dashboard/guud-xp',
      isSoon: true,
      icon: Icons.zap
    },
  ];

  return (
    <aside className={cn(
      "hidden lg:block flex-shrink-0 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <nav className="glass sticky top-24 rounded-lg p-4">
        <div className="flex flex-col gap-1">
          {/* Toggle Button */}
          <div className={cn(
            "mb-2 flex",
            isCollapsed ? "justify-center" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:bg-accent/50 h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </Button>
          </div>

          {pages.map(page => (
            <Link
              key={page.name}
              to={page.href}
              disabled={page.isSoon}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                'hover:bg-accent/50 hover:text-foreground',
                '[&.active]:bg-primary/10 [&.active]:text-primary',
                'text-muted-foreground [&.active]:font-semibold',
                page.isSoon && 'cursor-not-allowed opacity-50',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? page.name : undefined}
            >
              <page.icon className="size-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{page.name}</span>
                  {page.isSoon && (
                    <span className="bg-muted text-foreground/40 ml-auto rounded-md px-2 py-0.5 text-xs">
                      Soon
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};
