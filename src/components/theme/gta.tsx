import {
  calculateTopOffset,
  useAdaptiveFontSize,
} from './use-adaptive-font-size';
import { getResponsiveCardStyles } from './utils';

interface GuuldCardProps {
  username: string;
  imageUrl: string;
  score: string;
  subtitleHeader: string;
  description: string;
  logoUrl?: string;
  hasEmptyWallets?: boolean;
  width?: number;
  height?: number;
}

const MAX_FONT_SIZE = 24;
const MIN_FONT_SIZE = 10;
const BASE_TOP_POSITION = 85;

export function GuuldCard({
  username,
  imageUrl,
  score,
  subtitleHeader,
  description,
  logoUrl: _logoUrl,
  hasEmptyWallets,
  width,
  height,
}: GuuldCardProps) {
  const { containerStyle, contentStyle } = getResponsiveCardStyles(
    width,
    height
  );
  const displayUsername = username?.trim() || 'Anonymous';

  const usernameFontSize = useAdaptiveFontSize(displayUsername, {
    maxWidth: 185,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    fontFamily: 'Pricedown, sans-serif',
    fontWeight: 900,
  });

  const topOffset = calculateTopOffset(
    usernameFontSize,
    MAX_FONT_SIZE,
    MIN_FONT_SIZE,
    10
  );
  const dynamicTop = BASE_TOP_POSITION + topOffset;

  return (
    <div className="relative" style={containerStyle}>
      <div
        className="relative overflow-hidden"
        style={{
          ...contentStyle,
          backgroundImage: 'url(/theme/gta.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Username */}
        <div
          className="absolute z-10"
          style={{ top: `${dynamicTop}px`, left: '165px' }}
        >
          <div
            className="text-center capitalize"
            style={{
              fontFamily: 'Pricedown',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 900,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              maxWidth: '185px',
            }}
            title={displayUsername} // Tooltip for full text on hover
          >
            {displayUsername}
          </div>
        </div>

        {/* User Image */}
        <div
          className="absolute z-10"
          style={{
            width: '201.5px',
            height: '201px',
            top: '118px',
            left: '160px',
          }}
        >
          <div className="relative h-full w-full">
            <div className="h-full w-full overflow-hidden">
              <div className="relative h-full w-full bg-gradient-to-br from-pink-300 to-pink-400">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={displayUsername}
                    crossOrigin="anonymous"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="absolute z-10" style={{ top: '317px', left: '170px' }}>
          <div
            style={{
              fontFamily: 'Pricedown',
              fontSize: '28px',
              fontWeight: 900,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            SCORE: #{score}
          </div>
        </div>

        {/* Subtitle Header */}
        <div
          className="absolute z-10"
          style={{
            top: '352px',
            left: hasEmptyWallets ? '220px' : '220px',
          }}
        >
          <div
            style={{
              fontFamily: 'Pixel Digivolve, monospace',
              fontSize: '12px',
              fontWeight: 400,
              color: '#fff',
            }}
          >
            {subtitleHeader}
          </div>
        </div>

        {/* Description */}
        <div
          className="absolute z-10"
          style={{
            top: '367px',
            left: hasEmptyWallets ? '220px' : '220px',
            width: '140px',
            maxWidth: '140px',
            height: '34px',
          }}
        >
          <div
            style={{
              fontFamily: 'NK57 Monospace SC, monospace',
              fontSize: '8px',
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.4,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              wordBreak: 'normal',
              whiteSpace: 'normal',
              width: '100%',
              height: '100%',
            }}
            title={description} // Tooltip for full text on hover
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
