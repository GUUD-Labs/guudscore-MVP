import { type FC, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ArenaAvatarFrameProps {
  children: ReactNode;
  arenaPoints?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showPoints?: boolean;
  hoverExpand?: boolean;
}

const sizeConfig = {
  xs: {
    outer: 40,
    border: 3,
    pointsText: 'text-[7px]',
    pointsBg: 'px-1.5 py-0.5',
    pointsBottom: '-bottom-2',
    glow: 4,
  },
  sm: {
    outer: 52,
    border: 3.5,
    pointsText: 'text-[8px]',
    pointsBg: 'px-1.5 py-0.5',
    pointsBottom: '-bottom-2',
    glow: 5,
  },
  md: {
    outer: 72,
    border: 4,
    pointsText: 'text-[9px]',
    pointsBg: 'px-2 py-0.5',
    pointsBottom: '-bottom-2.5',
    glow: 6,
  },
  lg: {
    outer: 88,
    border: 4.5,
    pointsText: 'text-[10px]',
    pointsBg: 'px-2 py-1',
    pointsBottom: '-bottom-3',
    glow: 8,
  },
  xl: {
    outer: 104,
    border: 5,
    pointsText: 'text-[11px]',
    pointsBg: 'px-2.5 py-1',
    pointsBottom: '-bottom-3',
    glow: 10,
  },
} as const;

const ArenaAvatarFrame: FC<ArenaAvatarFrameProps> = ({
  children,
  arenaPoints,
  size = 'md',
  className,
  showPoints = true,
  hoverExpand = false,
}) => {
  const config = sizeConfig[size];
  const { outer, border, glow } = config;
  const inner = outer - border * 2;
  const center = outer / 2;
  const radius = (outer - border) / 2;

  const glowId = `arena-glow-${size}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div
      className={cn(
        'relative inline-flex flex-col items-center group/arena',
        className
      )}
      style={{ width: outer, height: outer }}
    >
      {/* SVG ring frame with glow */}
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        className="absolute inset-0 z-10 pointer-events-none"
      >
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Glow layer */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f28c28"
          strokeWidth={border + 3}
          opacity={0.35}
          filter={`url(#${glowId})`}
        />
        {/* Main orange ring - sharp */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f28c28"
          strokeWidth={border}
        />
        {/* Inner highlight edge */}
        <circle
          cx={center}
          cy={center}
          r={radius - border * 0.5}
          fill="none"
          stroke="#ffad5c"
          strokeWidth={border * 0.3}
          opacity={0.45}
        />
      </svg>

      {/* Avatar content - centered inside ring */}
      <div
        className="absolute rounded-full overflow-hidden z-0"
        style={{
          top: border,
          left: border,
          width: inner,
          height: inner,
        }}
      >
        {children}
      </div>

      {/* Arena Points Badge at bottom */}
      {showPoints && arenaPoints !== undefined && (
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 z-20',
            'rounded-full border border-[#f28c28]/60',
            'bg-[#f28c28] shadow-[0_0_8px_rgba(242,140,40,0.6)]',
            'font-pixel font-bold text-white leading-none whitespace-nowrap',
            'transition-all duration-200',
            config.pointsText,
            config.pointsBg,
            config.pointsBottom,
            hoverExpand && 'group-hover/arena:scale-150 group-hover/arena:shadow-[0_0_14px_rgba(242,140,40,0.8)] group-hover/arena:-translate-y-1'
          )}
        >
          {arenaPoints >= 1000
            ? `${(arenaPoints / 1000).toFixed(1)}k`
            : arenaPoints}
        </div>
      )}
    </div>
  );
};

export default ArenaAvatarFrame;
